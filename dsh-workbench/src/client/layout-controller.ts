/**
 * The workbench's layout controller: one place that owns the applied layout,
 * the optimistic updates, and the round trip to the Host.
 *
 * Keeping it out of the components leaves the page free of transport concerns
 * and lets a test drive ordering and failure handling without a DOM.
 * @module dsh-workbench/client/layout-controller
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { WorkbenchCardLayoutRecord, WorkbenchLayoutEntry } from '../layout-contract.ts'
import type { WorkbenchLayoutApi } from './layout-api.ts'
import type { WorkbenchCardFact, WorkbenchOrder } from './layout-store.ts'
import { layoutFromSnapshot, planWorkbenchMove, resolveWorkbenchOrder } from './layout-store.ts'

/** Write state the page reports. */
export interface WorkbenchWriteState {
  /** Idle after a successful write, pending while one is in flight. */
  readonly phase: 'idle' | 'pending' | 'failed'
  /** Failure reason, or `merged` when another client wrote first. */
  readonly message?: string
}

/** What the page renders from. */
export interface WorkbenchLayoutView {
  /** Card ids in display order. */
  readonly visibleIds: readonly string[]
  /** Card currently being dragged. */
  readonly draggingId: string | null
  /** First read outcome. */
  readonly load: 'loading' | 'ready' | 'unavailable'
  /** Last write outcome. */
  readonly write: WorkbenchWriteState
}

/** Ordering and refresh operations the page wires to controls. */
export interface WorkbenchLayoutActions {
  /** Move one card to an index in the visible order. */
  readonly reorder: (id: string, toIndex: number) => void
  /** Move one card by one position. */
  readonly moveBy: (id: string, delta: -1 | 1) => void
  /** Clear the arrangement, returning every card to its declared order. */
  readonly reset: () => void
  /** Re-read the stored layout. */
  readonly refresh: () => void
  /** Mark a card as being dragged, so the page can style the grid. */
  readonly setDragging: (id: string | null) => void
}

/** One controller result. */
export interface WorkbenchLayoutController {
  /** Render inputs. */
  readonly view: WorkbenchLayoutView
  /** Operations. */
  readonly actions: WorkbenchLayoutActions
}

/** Applied arrangement plus the revision it was read at. */
interface AppliedLayout {
  readonly records: ReadonlyMap<string, WorkbenchCardLayoutRecord>
  readonly revision: string
}

const EMPTY_LAYOUT: AppliedLayout = { records: new Map(), revision: '' }

/**
 * Drive the layout of one workbench page.
 * @param cards - card facts from the slot ledger.
 * @param api - layout transport.
 * @param active - whether the workbench panel is currently selected.
 * @returns the view plus its operations.
 */
export function useWorkbenchLayout(
  cards: readonly WorkbenchCardFact[],
  api: WorkbenchLayoutApi,
  active: boolean,
): WorkbenchLayoutController {
  const [applied, setApplied] = useState<AppliedLayout>(EMPTY_LAYOUT)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [load, setLoad] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [write, setWrite] = useState<WorkbenchWriteState>({ phase: 'idle' })
  const requested = useRef(false)
  const order = useMemo<WorkbenchOrder>(
    () => resolveWorkbenchOrder(cards, applied.records),
    [cards, applied.records],
  )

  const refresh = useCallback((): void => {
    void api.read().then((result) => {
      if (result.status === 'unavailable') {
        setLoad('unavailable')
        return
      }
      setApplied({ records: layoutFromSnapshot(result.snapshot), revision: result.snapshot.revision })
      setLoad('ready')
    })
  }, [api])

  // The first selection of the panel is what loads the stored layout.
  useEffect(() => {
    if (!active || requested.current) return
    requested.current = true
    refresh()
  }, [active, refresh])

  const send = useCallback((entries: readonly WorkbenchLayoutEntry[], next: AppliedLayout): void => {
    setWrite({ phase: 'pending' })
    void api.write({ baseRevision: next.revision, entries }).then((result) => {
      if (result.status === 'ok') {
        setApplied({ records: layoutFromSnapshot(result.snapshot), revision: result.snapshot.revision })
        setWrite({ phase: 'idle' })
        return
      }
      if (result.status === 'conflict') {
        // Another client wrote first: adopt its snapshot and report the merge
        // rather than retrying from a base that no longer exists.
        setApplied({ records: layoutFromSnapshot(result.snapshot), revision: result.snapshot.revision })
        setWrite({ phase: 'failed', message: 'merged' })
        return
      }
      // The change stays on screen; only the durable copy failed.
      setWrite({ phase: 'failed', message: result.reason })
    })
  }, [api])

  const commit = useCallback((records: ReadonlyMap<string, WorkbenchCardLayoutRecord>, entries: readonly WorkbenchLayoutEntry[]): void => {
    const next: AppliedLayout = { records, revision: applied.revision }
    setApplied(next)
    send(entries, next)
  }, [applied.revision, send])

  const reorder = useCallback((id: string, toIndex: number): void => {
    const plan = planWorkbenchMove(order.visible, applied.records, id, toIndex)
    if (plan.entries.length === 0) return
    const records = new Map(applied.records)
    for (const entry of plan.entries) {
      records.set(entry.id, {
        ...entry.position === undefined ? {} : { position: entry.position },
      })
    }
    commit(records, plan.entries)
  }, [applied.records, commit, order.visible])

  const moveBy = useCallback((id: string, delta: -1 | 1): void => {
    const from = order.visible.indexOf(id)
    if (from === -1) return
    const to = Math.max(0, Math.min(from + delta, order.visible.length - 1))
    if (to !== from) reorder(id, to)
  }, [order.visible, reorder])

  const reset = useCallback((): void => {
    const ids = [...applied.records.keys()]
    if (ids.length === 0) return
    commit(new Map(), ids.map(id => ({ id })))
  }, [applied.records, commit])

  return {
    view: {
      visibleIds: order.visible,
      draggingId,
      load,
      write,
    },
    actions: { reorder, moveBy, reset, refresh, setDragging: setDraggingId },
  }
}
