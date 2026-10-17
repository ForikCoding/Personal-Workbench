/**
 * The workbench card grid: lays the visible cards out, owns the reorder
 * session, and routes each entry through the `workbench.card` shell.
 *
 * The grid reads no card data: each entry renders itself, and the panel's
 * owner props tell it where the entry sits.
 * @module dsh-workbench/client/WorkbenchCardGrid
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import type { WorkbenchCardsOwnerProps } from './contract.ts'
import type { WorkbenchLayoutActions, WorkbenchLayoutView } from './layout-controller.ts'
import css from './workbench.module.css'

/** Reorder session one card shell reads to wire its handle. */
export interface WorkbenchCardReorder {
  /** Whether this card may be reordered right now. */
  readonly reorderable: boolean
  /** Begin a drag from this card's handle. */
  readonly begin: (id: string) => void
  /** Drop or cancel; `commit` false restores the pre-drag order. */
  readonly end: (commit: boolean) => void
  /** Move a card by one position, from the keyboard. */
  readonly moveBy: (id: string, delta: -1 | 1) => void
  /** Whether a drag session is running. */
  readonly dragging: boolean
}

/** Context the grid provides to the shells it renders. */
export const WorkbenchReorderContext = createContext<WorkbenchCardReorder | null>(null)

/** What the grid needs from its page. */
export interface WorkbenchCardGridProps {
  /** Current layout view. */
  readonly view: WorkbenchLayoutView
  /** Layout operations. */
  readonly actions: WorkbenchLayoutActions
  /**
   * Render one card entry.
   * @param id - visible card id to render.
   * @param owner - owner props the card list declaration expects.
   * @returns the entry, or null when the slot holds no such card.
   */
  readonly renderEntry: (id: string, owner: WorkbenchCardsOwnerProps) => ReactNode
  /**
   * Announcement text for the live region.
   * @param id - card that moved.
   * @param index - one-based destination position.
   * @returns the announcement.
   */
  readonly announce: (id: string, index: number) => string
  /** Result of the last action, announced as-is when present. */
  readonly notice?: string | undefined
  /**
   * One extra cell after the last card.
   *
   * The grid owns the cell, not its content: creating a card belongs where the cards
   * are, and the grid is the only thing that knows where that is.
   */
  readonly trailing?: ReactNode
  /** Report that the set of stored cards changed. */
  readonly onCardsChanged: () => void
}

/**
 * Render the grid and own the drag session.
 * @param props - view, actions, the entry renderer, announcement text, and notice.
 * @returns the grid element with its live region.
 */
export function WorkbenchCardGrid({
  view,
  actions,
  renderEntry,
  announce,
  notice,
  trailing,
  onCardsChanged,
}: WorkbenchCardGridProps): ReactNode {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)
  const visibleIds = view.visibleIds

  // A card that leaves the grid mid-drag cannot stay the drag subject.
  useEffect(() => {
    if (dragId !== null && !visibleIds.includes(dragId)) {
      setDragId(null)
      actions.setDragging(null)
    }
  }, [actions, dragId, visibleIds])

  const resolveOverIndex = useCallback((x: number, y: number): number | null => {
    const grid = gridRef.current
    if (grid === null || typeof document === 'undefined') return null
    const element = document.elementFromPoint(x, y)
    const card = element?.closest('[data-card-id]')
    if (card === null || card === undefined || !grid.contains(card)) return null
    const id = card.getAttribute('data-card-id')
    if (id === null) return null
    const index = visibleIds.indexOf(id)
    return index === -1 ? null : index
  }, [visibleIds])

  const end = useCallback((commit: boolean) => {
    const id = dragId
    const index = overIndex
    setDragId(null)
    setOverIndex(null)
    actions.setDragging(null)
    if (!commit || id === null || index === null) return
    const from = visibleIds.indexOf(id)
    if (from === -1 || from === index) return
    actions.reorder(id, index)
    setAnnouncement(announce(id, index + 1))
  }, [actions, announce, dragId, overIndex, visibleIds])

  const reorder = useMemo<WorkbenchCardReorder>(() => ({
    reorderable: visibleIds.length > 1,
    dragging: dragId !== null,
    begin: (id) => {
      setDragId(id)
      setOverIndex(visibleIds.indexOf(id))
      actions.setDragging(id)
    },
    end,
    moveBy: (id, delta) => {
      const from = visibleIds.indexOf(id)
      if (from === -1) return
      const to = Math.max(0, Math.min(from + delta, visibleIds.length - 1))
      if (to === from) return
      actions.moveBy(id, delta)
      setAnnouncement(announce(id, to + 1))
    },
  }), [actions, announce, dragId, end, visibleIds])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const handle = target.closest('[data-workbench-drag-handle]')
    if (handle === null) return
    const id = handle.getAttribute('data-workbench-drag-handle')
    if (id === null) return
    event.preventDefault()
    gridRef.current?.setPointerCapture(event.pointerId)
    reorder.begin(id)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (dragId === null) return
    const index = resolveOverIndex(event.clientX, event.clientY)
    if (index !== null && index !== overIndex) setOverIndex(index)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (dragId === null) return
    gridRef.current?.releasePointerCapture(event.pointerId)
    end(true)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape' && dragId !== null) {
      event.preventDefault()
      end(false)
    }
  }

  // The identity is per render, not per grid: one registered entry may back several
  // card instances.
  const owner: Omit<WorkbenchCardsOwnerProps, 'cardId'> = {
    visibleIds,
    draggingId: dragId,
    onCardsChanged,
  }

  return (
    <WorkbenchReorderContext.Provider value={reorder}>
      <div
        ref={gridRef}
        className={css.grid}
        data-workbench-grid=""
        {...dragId === null ? {} : { 'data-dragging': '' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { end(false) }}
        onKeyDown={handleKeyDown}
      >
        {visibleIds.map(id => (
          <div className={css.cell} key={id} data-workbench-cell={id}>
            {renderEntry(id, { ...owner, cardId: id })}
          </div>
        ))}
        {trailing === undefined ? null : (
          <div className={css.cell} data-workbench-cell="create">{trailing}</div>
        )}
      </div>
      <p className={css.notice} role="status" aria-live="polite">{notice ?? announcement}</p>
    </WorkbenchReorderContext.Provider>
  )
}

/**
 * Read the grid's reorder session from inside a card shell.
 * @returns the reorder session, or null when the shell renders outside the grid.
 */
export function useWorkbenchReorder(): WorkbenchCardReorder | null {
  return useContext(WorkbenchReorderContext)
}
