/**
 * Workbench Client half: the sidebar entry, the panel it opens, and the card
 * host. Card plugins contribute into `workbench.cards` and render the
 * `workbench.card` assembly; this plugin owns the page, the ordering, and the
 * layout round trip.
 * @module dsh-workbench/client
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { createSnapshotStore, type ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import { resolveSlotLabel, type InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { WORKBENCH_PANEL_ID } from './workbench-panel.ts'
import { createWorkbenchLayoutApi } from './layout-api.ts'
import type { WorkbenchCardFact } from './layout-store.ts'
import type { WorkbenchCardSelection } from './contract.ts'
import type { WorkbenchSkillCardApi } from './skill-card/api.ts'
import { en, zh } from './locales.ts'
import { createWorkbenchSkillCardApi } from './skill-card/api.ts'
import { createModelSeat } from './skill-card/model.ts'
import type { WorkbenchModelDirectoryResolver, WorkbenchModelSeat } from './skill-card/model.ts'
import { createWorkspacePicker, readDesktopPicker } from './skill-card/workspace-picker.ts'
import type { WorkbenchWorkspacePicker } from './skill-card/workspace-picker.ts'
import { SKILL_CARD_ID, SkillCard } from './skill-card/SkillCard.tsx'
import type { SkillCardFace } from './skill-card/SkillCard.tsx'
import { pickRunSession } from './skill-card/session.ts'
import type { WorkbenchSessionRow } from './skill-card/session.ts'
import { WorkbenchPage } from './WorkbenchPage.tsx'
import { WorkbenchPanelIcon } from './WorkbenchPanelIcon.tsx'
import { WorkbenchCardShell } from './WorkbenchCardShell.tsx'

export { WORKBENCH_PANEL_ID } from './workbench-panel.ts'
export type {
  WorkbenchCardInput,
  WorkbenchCardOccurrenceProps,
  WorkbenchCardSlots,
  WorkbenchCardSpan,
  WorkbenchCardState,
  WorkbenchCardsOwnerProps,
} from './contract.ts'
export type { WorkbenchLocaleKey } from './locales.ts'
export type { WorkbenchCardFact, WorkbenchOrder } from './layout-store.ts'
export type { WorkbenchLayoutApi, WorkbenchReadResult, WorkbenchWriteResult } from './layout-api.ts'
export type { WorkbenchLayoutActions, WorkbenchLayoutController, WorkbenchLayoutView } from './layout-controller.ts'

/** Locale namespace owned by this plugin. */
export const NS = 'workbench'

/** Services the sidebar row, the panel, the layout read, and the skill card depend on. */
export const inject = ['slots', 'locale', 'layout', 'sessions']

/**
 * Session surface the workbench reads to choose a run target.
 *
 * Declared narrowly here, as the Host narrows its own services: the `sessions`
 * client service belongs to the generated session-controller API, which this
 * package does not depend on for types.
 */
interface SessionListHost {
  readonly sessions: {
    readonly list: {
      /**
       * Read the current session list.
       * @returns the ordered ids and the rows addressing them.
       */
      getSnapshot(): {
        readonly ids: readonly string[]
        readonly byId: Readonly<Record<string, WorkbenchSessionRow | undefined>>
      }
    }
  }
}

/** Context member carrying the model directory resolver, narrowed to what this reads. */
interface ModelDirectoryHost {
  readonly modelDirectories: WorkbenchModelDirectoryResolver
}

/**
 * Context member carrying the workspace UI, narrowed to the one picker this reads.
 *
 * Declared here rather than imported: the service belongs to
 * `@deepseek-ai/dsh-client-ui-workspace`, which this package does not depend on for types,
 * and `pickDirectory()` is the whole of what the feature uses.
 */
interface WorkspacePickerHost {
  readonly uiWorkspace: {
    /**
     * Open the platform's own directory chooser.
     * @returns the selected directory, or null when the chooser was cancelled.
     */
    pickDirectory(): Promise<string | null>
  }
}

/** Injected share of the panel registration. */
export interface WorkbenchPanelFace {
  /** Card facts and the full-panel selection, bound to `useCards` and `useSelection`. */
  readonly hooks: {
    readonly cards: ObservableSnapshot<readonly WorkbenchCardFact[]>
    readonly selection: ObservableSnapshot<WorkbenchCardSelection | undefined>
  }
  /** Layout transport. */
  readonly api: ReturnType<typeof createWorkbenchLayoutApi>
  /** Skill card transport, for the full-panel views the grid opens into. */
  readonly skillCards: {
    /** Configuration and run transport. */
    readonly api: WorkbenchSkillCardApi
    /**
     * Resolve the session a run hangs off.
     * @returns the session id, or undefined when none is available.
     */
    readonly runSessionId: () => string | undefined
    /** Model catalog the card's field and its run control read. */
    readonly models: WorkbenchModelSeat
    /** Directory picker the configuration page offers for the card's workspace. */
    readonly workspacePicker: WorkbenchWorkspacePicker
  }
  /** Return to the grid from whichever full-panel view is open. */
  readonly closeCard: () => void
  /**
   * Open one of a card's full-panel views.
   *
   * Injected rather than read from a context, because a card action can target a
   * different card: the run starts there and the page that shows it is that card's.
   */
  readonly openCard: (cardId: string, view: WorkbenchCardSelection['view']) => void
}

/** Injected share as the page component receives it. */
export type WorkbenchPanelSeat = InjectFace<WorkbenchPanelFace>

/**
 * Register the workbench panel, its sidebar entry, and the card assembly.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'workbench: dictionaries')
  const t = ctx.locale.bind(NS)
  const cards = createSnapshotStore<readonly WorkbenchCardFact[]>([])
  const api = createWorkbenchLayoutApi()
  const skillCardApi = createWorkbenchSkillCardApi()
  // The model directory is read through a getter rather than captured: the service is
  // injected scoped below, so a composition without it simply answers "no model known",
  // which is a card that cannot run rather than a plugin left pending.
  const modelResolver: { current: WorkbenchModelDirectoryResolver | undefined } = { current: undefined }
  const models = createModelSeat(() => modelResolver.current)
  ctx.inject(['modelDirectories'], (scoped) => {
    modelResolver.current = (scoped as unknown as ModelDirectoryHost).modelDirectories
    scoped.effect(() => () => { modelResolver.current = undefined }, 'workbench: model directory')
  })
  // The workspace UI is injected the same way and for the same reason: it is a service this
  // plugin may run without, so a composition lacking it answers "no picker" rather than
  // leaving the plugin pending. On Windows the Desktop plugin has already published its own
  // picker on the window, and that one wins — see `createWorkspacePicker`.
  const workspaceUi: { current: WorkspacePickerHost['uiWorkspace'] | undefined } = { current: undefined }
  ctx.inject(['uiWorkspace'], (scoped) => {
    workspaceUi.current = (scoped as unknown as WorkspacePickerHost).uiWorkspace
    scoped.effect(() => () => { workspaceUi.current = undefined }, 'workbench: workspace picker')
  })
  const workspacePicker = createWorkspacePicker(() => {
    const native = readDesktopPicker()
    const workspace = workspaceUi.current
    return {
      ...native === undefined ? {} : { native },
      ...workspace === undefined ? {} : { workspace: () => workspace.pickDirectory() },
    }
  })
  const sessionList = (ctx as unknown as SessionListHost).sessions.list
  // Read when a card asks, not when it renders: the freshest list is the one that
  // finds a session the user opened after the card appeared.
  const runSessionId = (): string | undefined => {
    const snapshot = sessionList.getSnapshot()
    return pickRunSession(snapshot.ids, snapshot.byId)
  }
  // The grid and the two full-panel views are one panel with three states. The
  // state lives here rather than in the page so a card can open its own view
  // without the page and the card sharing a React tree.
  const selection = createSnapshotStore<WorkbenchCardSelection | undefined>(undefined)
  const openCard = (cardId: string, view: WorkbenchCardSelection['view']): void => {
    selection.set({ cardId, view })
  }
  const closeCard = (): void => { selection.set(undefined) }

  // The card contract declares this assembly and the README documents it, but
  // nothing registered it: a card calling renderFactorySlot('workbench.card', …)
  // failed at load, which blocked every card that wanted the shared frame.
  ctx.effect(() => ctx.slots.registerFactory({
    name: 'workbench.card',
    scope: 'root',
    locale: NS,
    slots: { body: { scope: 'root' }, actions: { scope: 'root' } },
  }, WorkbenchCardShell), 'workbench: card assembly')

  // The slot ledger is the single source of registered cards: the workbench
  // keeps no second registry, so this projection is rebuilt from it alone.
  const syncCards = (): void => {
    const next = ctx.slots.entriesOfSlot('workbench.cards').map(entry => ({
      id: entry.options.id as string,
      order: entry.options.order ?? 0,
      label: resolveSlotLabel(entry.options.label) ?? '',
    }))
    const previous = cards.getSnapshot()
    if (previous.length === next.length
      && previous.every((card, index) => card.id === next[index]?.id
        && card.order === next[index]?.order
        && card.label === next[index]?.label)) {
      return
    }
    cards.set(next)
  }
  ctx.effect(() => ctx.slots.subscribe('workbench.cards', syncCards), 'workbench: card entries')
  ctx.effect(() => ctx.locale.subscribe(syncCards), 'workbench: card labels')
  ctx.effect(() => {
    syncCards()
    return () => { cards.set([]) }
  }, 'workbench: initial card projection')

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: WORKBENCH_PANEL_ID,
    locale: NS,
    children: { 'workbench.cards': { kind: 'list', scope: 'root' } },
    inject: (): WorkbenchPanelFace => ({
      hooks: { cards, selection },
      api,
      skillCards: { api: skillCardApi, runSessionId, models, workspacePicker },
      closeCard,
      openCard,
    }),
  }, WorkbenchPage))

  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: WORKBENCH_PANEL_ID,
    order: 100,
    label: () => t('panel'),
    locale: NS,
  }, WorkbenchPanelIcon))

  ctx.slots.inject('workbench.cards', () => ctx.slots.register({
    name: 'workbench.cards',
    id: SKILL_CARD_ID,
    order: 200,
    label: () => t('skillCardTitle'),
    locale: NS,
    inject: (): SkillCardFace => ({ api: skillCardApi, runSessionId, openCard }),
  }, SkillCard))
}
