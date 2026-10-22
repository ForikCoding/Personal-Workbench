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
import { WORKBENCH_SKILL_CARD_CATALOG_PATH, WORKBENCH_SKILL_CARD_DIRECTORY_PATH, WORKBENCH_SKILL_CARD_PATH, WORKBENCH_SKILL_CARD_RESULT_PATH, WORKBENCH_SKILL_CARD_RUN_PATH } from './skill-card-contract.ts'
import type { WorkbenchSandboxMode } from './skill-card-contract.ts'
import {
  WORKBENCH_CARD_TABLE,
  WORKBENCH_RESULT_TABLE,
  WORKBENCH_SKILL_CARD_DOMAIN,
  WORKBENCH_TEMPLATE_TABLE,
} from './skill-card-spec.ts'
import { assertSubagentProvider, probeSubagentSeam } from './skill-card-provider.ts'
import type { WorkbenchSkillCardHost, WorkbenchWorkingDirectory } from './skill-card-host.ts'
import { WorkbenchSandboxModeError } from './skill-card-host.ts'
import { statDirectory } from './skill-card-directory.ts'
import { WorkbenchSkillCardRunner } from './skill-card-runner.ts'
import { cardSelection } from './skill-card-runner.ts'
import {
  createWorkbenchSkillCardCatalogHandler,
  createWorkbenchSkillCardDirectoryHandler,
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
 *
 * `llm` IS named: a card that pins a model has to be checked against what the
 * deployment can route before a child is created, and a composition without an LLM
 * registry could not answer that at all.
 */
export const inject = [
  'storageDomain', 'webServer', 'connection', 'storage',
  'agents', 'skills', 'subagents',
  'workspaceRegistry', 'llm',
]

/**
 * Host event bus narrowed to the two events this plugin reads.
 *
 * Both are contributed by upstream packages' module augmentation — `agent/error` by the
 * agent loop, `session/event` by the session service — so neither is on the `Events` map
 * this package can see. They are declared on one interface rather than two because they are
 * one capability: the identity of a child's traffic. One narrowed shape, one `ctx.on` route,
 * one disposer.
 */
interface WorkbenchChildEventBus {
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
  /**
   * Observe every committed session event.
   *
   * `session/event` is a plain `emit`, so a passive listener is safe here — unlike
   * `agent/request`, which is a waterfall whose config a returning listener would replace.
   * The payload is `(session, event)`; `session.id` is the child's id, which is the same
   * identity `agent/error` carries as `agent.id`. Measured on a real composition: the
   * `tool/call` this feature maps arrives here as `{ type, data: { name, arguments, … } }`.
   * @param event - the event name.
   * @param listener - receives the session that grew and the event appended to it.
   * @returns the disposer.
   */
  on(
    event: 'session/event',
    listener: (
      session: { readonly id: string },
      event: { readonly type: string; readonly data?: unknown },
    ) => void,
  ): () => void
}

/**
 * The one member of a real agent's session this plugin writes to.
 *
 * A session records its sandbox mode as an event, and that event is the only write path:
 * the policy service that reads it has no setter of its own. The narrowed
 * `WorkbenchAgent.session` deliberately states only the header the runner reads, so this
 * is declared here, at the one place that needs it.
 */
interface WorkbenchSandboxSession {
  readonly session: {
    /**
     * Append one session event.
     * @param type - event discriminator.
     * @param data - the event's payload.
     */
    append(type: 'sandbox/mode', data: { readonly mode: WorkbenchSandboxMode }): void
  }
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
    // The narrow host is assembled here rather than handed on as the bare cast. Every other
    // member is a service this composition provides, but the sandbox setter is not a service
    // at all — it is one session event — so it has to be attached explicitly. Reading a
    // member that no service provides off a wide cast compiles and does nothing at run time,
    // and a permission that silently does nothing is the one outcome this feature refuses.
    const cardHost: WorkbenchSkillCardHost = {
      agents: runtime.agents,
      skills: runtime.skills,
      workspaceRegistry: runtime.workspaceRegistry,
      subagents: runtime.subagents,
      llm: runtime.llm,
      sandbox: {
        setMode: (sessionId, mode) => {
          // A card's mode is recorded on its own agent's session, because a child inherits
          // its parent's explicit override — that is what makes the card's mode govern its
          // runs. Reaching the session is the one widening here: the narrowed agent states
          // only the header, and keeping the cast at assembly means no consumer of the
          // narrow host can reach a Session by accident.
          const agent = runtime.agents.get(sessionId) as unknown as WorkbenchSandboxSession | undefined
          if (agent === undefined) {
            throw new WorkbenchSandboxModeError(sessionId, mode, 'no live agent has that session')
          }
          try {
            agent.session.append('sandbox/mode', { mode })
          } catch (error) {
            throw new WorkbenchSandboxModeError(
              sessionId,
              mode,
              error instanceof Error ? error.message : String(error),
            )
          }
        },
      },
    }
    assertSubagentProvider(runtime.subagents, config.subagentProvider)
    // Probed here, once, because the answer belongs to this composition rather than to a
    // run: it is the same for every card and every click. The client reads it off the card
    // snapshot and states it before a control is pressed; the runner refuses a call that
    // arrives anyway.
    const capabilities = probeSubagentSeam(runtime.subagents)
    if (!capabilities.startActivation && !capabilities.start) {
      ctx.logger.warn(
        'workbench: this harness exposes neither subagents.startActivation (0.2.1-alpha.2, the beta channel) nor the one-shot subagents.start (0.2.0-rc.2, the stable channel), so skill card runs are unavailable',
      )
    }
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
      host: cardHost,
      ...workingDirectory === undefined ? {} : { workingDirectory },
      statDirectory,
      subagentProvider: config.subagentProvider,
      runTimeoutMs: config.runTimeoutMs,
      maxConcurrentRuns: config.maxConcurrentRuns,
      // The run request carries only what the client knows; whether a template
      // exists is the Host's own answer, and it is the precondition for running.
      selection: (cardId) => cardSelection(store.read().cards.find(entry => entry.cardId === cardId)),
      saveResult: (cardId, record) => store.putResult(cardId, record),
      warn,
    })
    const disposers = [
      // The two events are declared by upstream packages' own module augmentation, which
      // this package does not import, so the bus is narrowed here the same way the service
      // surface is above. They share one effect because they are one capability — the
      // identity of a child's traffic — and because both listeners attribute by the same
      // rule: a run records a child's news only while it owns that child.
      //
      // `agent/error` is the only account of a faulted child: the subagent seam reduces one
      // to `stopReason: 'error'` and drops the error itself. `session/event` is the only
      // account of what the child did: `tool/call` is where a tool name and its first
      // argument exist, and neither `tool/result` nor `agent/status` carries them.
      ctx.effect(() => {
        const bus = ctx as unknown as WorkbenchChildEventBus
        const stopErrors = bus.on('agent/error', ({ agent, error }) => {
          runner.observeAgentError(agent.id, error)
        })
        const stopEvents = bus.on('session/event', (session, event) => {
          runner.observeChildEvent(session.id, event)
        })
        return () => {
          stopErrors()
          stopEvents()
        }
      }, 'workbench: child agent events'),
      ctx.effect(() => host.webServer.register({
        kind: 'exact',
        path: WORKBENCH_SKILL_CARD_PATH,
        handler: createWorkbenchSkillCardHandler({
          store,
          fence: host.connection,
          maxTemplateBytes: config.maxTemplateBytes,
          capabilities,
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
      // The card's workspace is checked through the Host: the page cannot read a
      // filesystem, and a run must be gated on the directory it would actually use.
      ctx.effect(() => host.webServer.register({
        kind: 'exact',
        path: WORKBENCH_SKILL_CARD_DIRECTORY_PATH,
        handler: createWorkbenchSkillCardDirectoryHandler({ statDirectory, fence: host.connection, warn }),
      }), 'workbench: skill card directory route'),
    ]
    return async () => {
      for (const dispose of disposers) dispose()
      await runner.dispose()
      store.dispose()
      await domain.close()
    }
  }, 'workbench: skill card domain and route')
}
