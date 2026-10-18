/**
 * Workbench Host half: opens the layout and skill card storage domains, serves
 * their private routes, and releases everything with the plugin's own effects.
 *
 * Both services stay inside this plugin: each one's only caller is its route,
 * and no other Host plugin consumes them.
 * @module dsh-workbench
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-storage'
import type {} from '@deepseek-ai/dsh-storage-domain'
import { WORKBENCH_LAYOUT_PATH } from './layout-contract.ts'
import { WORKBENCH_LAYOUT_DOMAIN, WORKBENCH_LAYOUT_TABLE } from './layout-spec.ts'
import { createWorkbenchLayoutHandler } from './layout-route.ts'
import type { WorkbenchHostContext } from './layout-route.ts'
import { WorkbenchLayoutService } from './layout-service.ts'
import { WORKBENCH_SKILL_CARD_CATALOG_PATH, WORKBENCH_SKILL_CARD_PATH, WORKBENCH_SKILL_CARD_RESULT_PATH, WORKBENCH_SKILL_CARD_RUN_PATH } from './skill-card-contract.ts'
import {
  WORKBENCH_CARD_TABLE,
  WORKBENCH_RESULT_TABLE,
  WORKBENCH_SKILL_CARD_DOMAIN,
  WORKBENCH_TEMPLATE_TABLE,
} from './skill-card-spec.ts'
import { assertSubagentProvider } from './skill-card-provider.ts'
import type { WorkbenchSkillCardHost, WorkbenchWorkingDirectory } from './skill-card-host.ts'
import { WorkbenchSkillCardRunner } from './skill-card-runner.ts'
import {
  createWorkbenchSkillCardCatalogHandler,
  createWorkbenchSkillCardHandler,
  createWorkbenchSkillCardResultHandler,
  createWorkbenchSkillCardRunHandler,
} from './skill-card-route.ts'
import { WorkbenchSkillCardStore } from './skill-card-store.ts'
import { Config } from './config.ts'
import type { Config as WorkbenchConfig } from './config.ts'

export { Config }

/** Stable Cordis plugin name. */
export const name = 'workbench'

/**
 * Required Host services.
 *
 * `storage` is named because the storage-domain form mounts over the hub, so
 * opening a domain before the hub exists would fail as a missing service rather
 * than as a startup error. The skill card names the three services its runner
 * reads: the context proxy refuses an undeclared member even when the read goes
 * through a narrowed type, and `subagents` also gates a composition without a
 * subagent plane at load instead of leaving a card that can never run.
 *
 * The working-directory service is deliberately NOT named: the stable channel's
 * pinned harness predates it, so requiring it would leave the whole plugin
 * pending there. The runner reads it optionally and falls back to the session
 * header.
 */
export const inject = [
  'storageDomain', 'webServer', 'connection', 'storage',
  'agents', 'skills', 'subagents',
]

/**
 * Host event bus narrowed to the one event this plugin reads.
 *
 * `agent/error` is contributed by the agent loop's module augmentation, so it is not
 * on the `Events` map this package can see.
 */
interface WorkbenchAgentErrorBus {
  /**
   * Observe one agent's turn failure.
   * @param event - the event name.
   * @param listener - receives the failing agent and its error.
   * @returns the disposer.
   */
  on(
    event: 'agent/error',
    listener: (payload: { readonly agent: { readonly id: string }; readonly error: unknown }) => void,
  ): () => void
}

/**
 * Open the layout domain and register the layout route.
 * @param ctx - Host context.
 * @param config - validated workbench configuration.
 */
export function apply(ctx: Context, config: WorkbenchConfig): void {
  if (!config.enabled) return

  ctx.effect(async () => {
    const host = ctx as unknown as WorkbenchHostContext
    const domain = await ctx.storageDomain.open(WORKBENCH_LAYOUT_DOMAIN)
    let service: WorkbenchLayoutService
    try {
      service = new WorkbenchLayoutService({
        domainName: domain.name,
        table: domain.table(WORKBENCH_LAYOUT_TABLE),
        events: {
          on: (_event, listener) => ctx.on('domain/changed', change => { listener(change) }),
        },
        maxRecords: config.maxRecords,
        bootStamp: Date.now(),
      })
    } catch (error) {
      await domain.close()
      throw error
    }
    const disposeRoute = ctx.effect(() => host.webServer.register({
      kind: 'exact',
      path: WORKBENCH_LAYOUT_PATH,
      handler: createWorkbenchLayoutHandler({
        service,
        fence: host.connection,
        maxRecords: config.maxRecords,
        warn: message => { ctx.logger.warn(message) },
      }),
    }), 'workbench: layout route')
    return async () => {
      disposeRoute()
      service.dispose()
      await domain.close()
    }
  }, 'workbench: layout domain and route')

  ctx.effect(async () => {
    const host = ctx as unknown as WorkbenchHostContext
    const runtime = ctx as unknown as WorkbenchSkillCardHost
    assertSubagentProvider(runtime.subagents, config.subagentProvider)
    const domain = await ctx.storageDomain.open(WORKBENCH_SKILL_CARD_DOMAIN)
    let store: WorkbenchSkillCardStore
    try {
      store = new WorkbenchSkillCardStore({
        domainName: domain.name,
        card: domain.table(WORKBENCH_CARD_TABLE),
        template: domain.table(WORKBENCH_TEMPLATE_TABLE),
        result: domain.table(WORKBENCH_RESULT_TABLE),
        events: {
          on: (_event, listener) => ctx.on('domain/changed', change => { listener(change) }),
        },
        maxTemplateBytes: config.maxTemplateBytes,
        maxTemplatesPerCard: config.maxTemplatesPerCard,
        maxResultBytes: config.maxResultBytes,
        bootStamp: Date.now(),
      })
    } catch (error) {
      await domain.close()
      throw error
    }
    const warn = (message: string): void => { ctx.logger.warn(message) }
    // Read optionally rather than injected: the stable channel's pinned harness
    // predates this service, and naming it would keep the whole plugin pending.
    const workingDirectory = ctx.get('workingDirectory') as WorkbenchWorkingDirectory | undefined
    const runner = new WorkbenchSkillCardRunner({
      host: runtime,
      ...workingDirectory === undefined ? {} : { workingDirectory },
      subagentProvider: config.subagentProvider,
      runTimeoutMs: config.runTimeoutMs,
      maxConcurrentRuns: config.maxConcurrentRuns,
      // The run request carries only what the client knows; whether a template
      // exists is the Host's own answer, and it is the precondition for running.
      selection: (cardId) => {
        const card = store.read().cards.find(entry => entry.cardId === cardId)
        return {
          ...card?.skill === undefined ? {} : { skill: card.skill },
          ...card?.template === undefined ? {} : { template: card.template },
        }
      },
      saveResult: (cardId, record) => store.putResult(cardId, record),
      warn,
    })
    const disposers = [
      // The event is declared by the agent loop's own module augmentation, which this
      // package does not import, so the bus is narrowed here the same way the service
      // surface is above. It is the only account of a faulted child: the subagent seam
      // reduces one to `stopReason: 'error'` and drops the error itself.
      ctx.effect(() => (ctx as unknown as WorkbenchAgentErrorBus).on('agent/error', ({ agent, error }) => {
        runner.observeAgentError(agent.id, error)
      }), 'workbench: child agent failures'),
      ctx.effect(() => host.webServer.register({
        kind: 'exact',
        path: WORKBENCH_SKILL_CARD_PATH,
        handler: createWorkbenchSkillCardHandler({
          store,
          fence: host.connection,
          maxTemplateBytes: config.maxTemplateBytes,
          warn,
        }),
      }), 'workbench: skill card route'),
      ctx.effect(() => host.webServer.register({
        kind: 'exact',
        path: WORKBENCH_SKILL_CARD_CATALOG_PATH,
        handler: createWorkbenchSkillCardCatalogHandler({ runner, fence: host.connection, warn }),
      }), 'workbench: skill card catalog route'),
      ctx.effect(() => host.webServer.register({
        kind: 'exact',
        path: WORKBENCH_SKILL_CARD_RUN_PATH,
        handler: createWorkbenchSkillCardRunHandler({ runner, fence: host.connection, warn }),
      }), 'workbench: skill card run route'),
      ctx.effect(() => host.webServer.register({
        kind: 'exact',
        path: WORKBENCH_SKILL_CARD_RESULT_PATH,
        handler: createWorkbenchSkillCardResultHandler({
          store,
          fence: host.connection,
          maxResultBytes: config.maxResultBytes,
          warn,
        }),
      }), 'workbench: skill card result route'),
    ]
    return async () => {
      for (const dispose of disposers) dispose()
      await runner.dispose()
      store.dispose()
      await domain.close()
    }
  }, 'workbench: skill card domain and route')
}
