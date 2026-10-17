/**
 * Workbench layout store and the pure ordering rules it applies.
 *
 * The store owns viewing state only: which order the user arranged and which
 * card is mid-drag. The durable copy lives on the Host, so the store never
 * persists and never talks to the network — the controller in `index.ts` reads
 * it and sends the patches it produces.
 * @module dsh-workbench/client/layout-store
 */

import { defineStore } from '@deepseek-ai/dsh-client-store'
import type { WorkbenchCardLayoutRecord, WorkbenchLayoutEntry, WorkbenchLayoutSnapshot } from '../layout-contract.ts'
import { WORKBENCH_POSITION_BASE, WORKBENCH_POSITION_EPSILON, WORKBENCH_POSITION_STEP } from '../layout-contract.ts'

/** One card as the slot ledger describes it. */
export interface WorkbenchCardFact {
  /** Card identity. */
  readonly id: string
  /** Plugin-declared default order. */
  readonly order: number
  /** Plugin-declared label, resolved in the active locale; empty when the card declared none. */
  readonly label: string
}

/** Display order resolved from the ledger facts and the user's arrangement. */
export interface WorkbenchOrder {
  /** Card ids in display order. Every card the ledger declares appears here. */
  readonly visible: readonly string[]
}

/** What the page needs to render, plus the effect of the last write. */
export interface WorkbenchWriteStatus {
  /** Idle after a successful write, pending while one is in flight. */
  readonly phase: 'idle' | 'pending' | 'failed'
  /** Readable reason for a failure, or a merge notice. */
  readonly message?: string
}

/** Complete store state. */
export interface WorkbenchViewState {
  /** Card facts from the slot ledger. */
  cards: readonly WorkbenchCardFact[]
  /** Applied arrangement, keyed by card id. */
  layout: ReadonlyMap<string, WorkbenchCardLayoutRecord>
  /** Drag session, or null while idle. */
  drag: { readonly id: string; readonly overIndex: number } | null
  /** Last write outcome. */
  write: WorkbenchWriteStatus
  /** First read outcome. */
  load: { readonly phase: 'loading' | 'ready' | 'unavailable' }
}

/** Result of planning one move. */
export interface WorkbenchMovePlan {
  /** Patch entries implementing the move. */
  readonly entries: readonly WorkbenchLayoutEntry[]
  /** Resulting visible order, used for the optimistic update and the announcement. */
  readonly visible: readonly string[]
}

/**
 * Merge the ledger's default order with the user's arrangement.
 *
 * Arranged cards keep their stored position. A card with no record is placed
 * against the default order rather than appended: it lands immediately after
 * the last already-placed card that the ledger declares before it. That keeps
 * a freshly installed card near the position its author declared instead of at
 * the end.
 * @param cards - card facts from the slot ledger.
 * @param layout - stored arrangement.
 * @returns card ids in display order.
 */
export function resolveWorkbenchOrder(
  cards: readonly WorkbenchCardFact[],
  layout: ReadonlyMap<string, WorkbenchCardLayoutRecord>,
): WorkbenchOrder {
  const byDefault = [...cards].sort((left, right) =>
    left.order - right.order || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
  const defaultIndex = new Map(byDefault.map((card, index) => [card.id, index]))
  const arranged: string[] = []
  const unarranged: string[] = []
  for (const card of byDefault) {
    const record = layout.get(card.id)
    if (record?.position === undefined) unarranged.push(card.id)
    else arranged.push(card.id)
  }
  arranged.sort((left, right) =>
    (layout.get(left)?.position ?? 0) - (layout.get(right)?.position ?? 0)
    || (defaultIndex.get(left) ?? 0) - (defaultIndex.get(right) ?? 0))

  const visible: string[] = []
  let placed = 0
  for (const id of unarranged) {
    const index = defaultIndex.get(id) ?? 0
    while (placed < arranged.length && (defaultIndex.get(arranged[placed] as string) ?? 0) < index) {
      visible.push(arranged[placed] as string)
      placed += 1
    }
    visible.push(id)
  }
  while (placed < arranged.length) {
    visible.push(arranged[placed] as string)
    placed += 1
  }
  return { visible }
}

/**
 * Order records so the stored positions match one display sequence.
 * @param visible - visible card ids in display order.
 * @returns patch entries with fresh, widely spaced positions.
 */
export function renumberEntries(visible: readonly string[]): readonly WorkbenchLayoutEntry[] {
  return visible.map((id, index) => ({ id, position: WORKBENCH_POSITION_BASE * WORKBENCH_POSITION_STEP ** index }))
}

/**
 * Plan a move of one visible card to another index.
 *
 * A move between two neighbours uses the midpoint of their positions, which
 * touches exactly one record. When that midpoint would sit closer than
 * {@link WORKBENCH_POSITION_EPSILON} to a neighbour, the whole visible
 * sequence is renumbered in the same patch instead.
 * @param visible - current visible order.
 * @param layout - current arrangement.
 * @param id - card being moved.
 * @param toIndex - target index within the visible order.
 * @returns the patch entries plus the resulting visible order.
 */
export function planWorkbenchMove(
  visible: readonly string[],
  layout: ReadonlyMap<string, WorkbenchCardLayoutRecord>,
  id: string,
  toIndex: number,
): WorkbenchMovePlan {
  const from = visible.indexOf(id)
  if (from === -1) return { entries: [], visible }
  const rest = visible.filter(candidate => candidate !== id)
  const bounded = Math.max(0, Math.min(toIndex, rest.length))
  const next = [...rest.slice(0, bounded), id, ...rest.slice(bounded)]
  if (next.join('\u0000') === visible.join('\u0000')) return { entries: [], visible }

  const before = bounded === 0 ? undefined : rest[bounded - 1]
  const after = bounded >= rest.length ? undefined : rest[bounded]
  // An unarranged neighbour contributes no position: the moved card anchors on
  // the arranged side of the pair instead of trying to fit between two records
  // that do not exist. A card dropped at the very front gets the first slot the
  // client hands out.
  const lower = before === undefined ? undefined : layout.get(before)?.position
  const upper = after === undefined ? undefined : layout.get(after)?.position
  const arranged = lower !== undefined || upper !== undefined

  if (!arranged) {
    // Nothing to anchor on: one record for the moved card, in front of the
    // cards that keep their declared order.
    return { entries: [{ id, position: WORKBENCH_POSITION_BASE }], visible: next }
  }
  if (lower === undefined || upper === undefined) {
    const anchor = (lower ?? upper) as number
    return {
      entries: [{ id, position: Math.max(0, lower === undefined ? anchor - WORKBENCH_POSITION_BASE / 2 : anchor + WORKBENCH_POSITION_BASE) }],
      visible: next,
    }
  }
  if (upper - lower < WORKBENCH_POSITION_EPSILON * 2) {
    // Two arranged neighbours sit too close to subdivide: rebase the whole
    // sequence so the stored positions keep matching what the user sees.
    return { entries: renumberEntries(next), visible: next }
  }
  return { entries: [{ id, position: (lower + upper) / 2 }], visible: next }
}

/**
 * Project a Host snapshot onto a layout map.
 *
 * A stored document that still carries a removed field (for example a `hidden`
 * left by an older build) is read as a plain record, so the card comes back
 * visible; there is no migration step, the field is simply ignored.
 * @param snapshot - snapshot returned by the layout route.
 * @returns records keyed by card id.
 */
export function layoutFromSnapshot(snapshot: WorkbenchLayoutSnapshot): Map<string, WorkbenchCardLayoutRecord> {
  const layout = new Map<string, WorkbenchCardLayoutRecord>()
  for (const entry of snapshot.entries) {
    layout.set(entry.id, {
      ...entry.position === undefined ? {} : { position: entry.position },
    })
  }
  return layout
}

/** Store handle consumed by the controller and by component tests. */
export const workbenchStore = defineStore<WorkbenchViewState, {
  setCards: (draft: WorkbenchViewState, cards: readonly WorkbenchCardFact[]) => void
  applySnapshot: (draft: WorkbenchViewState, snapshot: WorkbenchLayoutSnapshot) => void
  setLayout: (draft: WorkbenchViewState, layout: ReadonlyMap<string, WorkbenchCardLayoutRecord>) => void
  beginDrag: (draft: WorkbenchViewState, id: string) => void
  updateDrag: (draft: WorkbenchViewState, overIndex: number) => void
  endDrag: (draft: WorkbenchViewState) => void
  setWrite: (draft: WorkbenchViewState, status: WorkbenchWriteStatus) => void
  setLoad: (draft: WorkbenchViewState, phase: 'loading' | 'ready' | 'unavailable') => void
}>({
  init: () => ({
    cards: [],
    layout: new Map(),
    drag: null,
    write: { phase: 'idle' },
    load: { phase: 'loading' },
  }),
  actions: {
    setCards: (draft, cards) => { draft.cards = cards },
    applySnapshot: (draft, snapshot) => { draft.layout = layoutFromSnapshot(snapshot) },
    setLayout: (draft, layout) => { draft.layout = layout },
    beginDrag: (draft, id) => { draft.drag = { id, overIndex: -1 } },
    updateDrag: (draft, overIndex) => {
      if (draft.drag !== null) draft.drag = { id: draft.drag.id, overIndex }
    },
    endDrag: (draft) => { draft.drag = null },
    setWrite: (draft, status) => { draft.write = status },
    setLoad: (draft, phase) => { draft.load = { phase } },
  },
})
