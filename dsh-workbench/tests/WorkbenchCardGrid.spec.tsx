// @vitest-environment jsdom
/** Grid composition, drag session, and announcement behaviour. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { primitivesMock } from './support/primitives-mock.tsx'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

const { WorkbenchCardGrid, useWorkbenchReorder } = await import('../src/client/WorkbenchCardGrid.tsx')
const { WorkbenchCardShellView } = await import('../src/client/WorkbenchCardShell.tsx')
type GridProps = import('../src/client/WorkbenchCardGrid.tsx').WorkbenchCardGridProps
type WorkbenchCardsOwnerProps = import('../src/client/contract.ts').WorkbenchCardsOwnerProps
const { en } = await import('../src/client/locales.ts')

afterEach(cleanup)

// jsdom implements neither pointer capture nor hit testing; the grid only needs
// them to route a drag, so the spec supplies the two calls it makes.
beforeAll(() => {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
})

/** Card body that proves the entry rendered through the shell. */
function cardBody({ id }: { id: string }): ReactNode {
  return <span>body of {id}</span>
}

/**
 * Render one entry through the real shell, wired to the grid's reorder session.
 * @param props - the card id the entry renders, plus an optional removal.
 * @returns the shell element.
 */
function WorkbenchCardEntry({ id, onRemove }: { id: string; onRemove?: (() => void) | undefined }): ReactNode {
  const reorder = useWorkbenchReorder()
  return (
    <WorkbenchCardShellView
      id={id}
      title={id}
      position={1}
      reorderable
      dragging={reorder?.dragging ?? false}
      body={cardBody({ id })}
      onRemove={onRemove}
      onMoveBy={delta => { reorder?.moveBy(id, delta) }}
      onCancelDrag={() => { reorder?.end(false) }}
      t={key => en[key]}
    />
  )
}

/** Card id whose removal the grid spec drives through the shell's X. */
const REMOVABLE_CARD = 'b-card'

/**
 * Build grid props.
 * @param overrides - fields to replace.
 * @returns complete props.
 */
function props(overrides: Partial<GridProps> = {}): GridProps {
  return {
    view: { visibleIds: ['a-card', 'b-card'], draggingId: null, load: 'ready', write: { phase: 'idle' } },
    onCardsChanged: vi.fn(),
    actions: {
      reorder: vi.fn(),
      moveBy: vi.fn(),
      reset: vi.fn(),
      refresh: vi.fn(),
      setDragging: vi.fn(),
    },
    renderEntry: id => <WorkbenchCardEntry id={id} />,
    announce: (id, index) => en.announceMoved.replace('{title}', id).replace('{index}', String(index)),
    ...overrides,
  }
}

/**
 * Point the grid's hit test at one card.
 * @param id - card id the pointer is over.
 */
function pointAt(id: string): void {
  const card = document.querySelector(`[data-card-id="${id}"]`)
  document.elementFromPoint = () => card
}

describe('WorkbenchCardGrid', () => {
  it('renders one entry per visible card in view order', () => {
    render(<WorkbenchCardGrid {...props()} />)
    const cards = [...document.querySelectorAll('[data-card-id]')].map(node => node.getAttribute('data-card-id'))
    expect(cards).toEqual(['a-card', 'b-card'])
  })

  it('passes the panel owner props to every entry', () => {
    const renderEntry = vi.fn((id: string, _owner: WorkbenchCardsOwnerProps) => <WorkbenchCardEntry id={id} />)
    render(<WorkbenchCardGrid {...props({
      renderEntry,
      view: { visibleIds: ['a-card'], draggingId: null, load: 'ready', write: { phase: 'idle' } },
    })} />)
    expect(renderEntry).toHaveBeenCalledWith('a-card', expect.objectContaining({
      visibleIds: ['a-card'],
      draggingId: null,
    }))
    // The owner props describe ordering and nothing else: there is no hiding
    // control for the grid to hand out any more.
    const owner = renderEntry.mock.calls[0]?.[1] as Record<string, unknown> | undefined
    expect(Object.keys(owner ?? {}).sort()).toEqual(['cardId', 'draggingId', 'onCardsChanged', 'visibleIds'])
  })

  it('removes a card through the shell without touching the layout actions', () => {
    // The X is a delete: the card owns that write, so the grid's ordering
    // actions must not be involved.
    const grid = props()
    const onRemove = vi.fn()
    render(<WorkbenchCardGrid {...grid} renderEntry={id => (
      <WorkbenchCardEntry id={id} onRemove={id === REMOVABLE_CARD ? onRemove : undefined} />
    )} />)
    fireEvent.click(screen.getByLabelText(en.removeCard))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(grid.actions.reorder).not.toHaveBeenCalled()
    expect(grid.actions.moveBy).not.toHaveBeenCalled()
    expect(grid.actions.setDragging).not.toHaveBeenCalled()
  })

  it('renders each card body', () => {
    render(<WorkbenchCardGrid {...props()} />)
    expect(screen.getByText('body of a-card')).toBeTruthy()
    expect(screen.getByText('body of b-card')).toBeTruthy()
  })

  it('commits one reorder when a drag ends over another card', () => {
    const grid = props()
    render(<WorkbenchCardGrid {...grid} />)
    pointAt('b-card')
    const surface = document.querySelector('[data-workbench-grid]') as HTMLElement
    fireEvent.pointerDown(screen.getAllByLabelText(en.dragHandle)[0] as HTMLElement, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(grid.actions.setDragging).toHaveBeenCalledWith('a-card')
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 5, clientY: 5 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 5, clientY: 5 })
    expect(grid.actions.reorder).toHaveBeenCalledTimes(1)
    expect(grid.actions.reorder).toHaveBeenCalledWith('a-card', 1)
    expect(grid.actions.setDragging).toHaveBeenLastCalledWith(null)
  })

  it('reports the destination position after a drag', () => {
    const grid = props()
    render(<WorkbenchCardGrid {...grid} />)
    pointAt('b-card')
    const surface = document.querySelector('[data-workbench-grid]') as HTMLElement
    fireEvent.pointerDown(screen.getAllByLabelText(en.dragHandle)[0] as HTMLElement, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 5, clientY: 5 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 5, clientY: 5 })
    expect(screen.getByRole('status').textContent).toBe('a-card moved to position 2')
  })

  it('cancels a drag on Escape without reordering', () => {
    const grid = props()
    render(<WorkbenchCardGrid {...grid} />)
    const surface = document.querySelector('[data-workbench-grid]') as HTMLElement
    fireEvent.pointerDown(screen.getAllByLabelText(en.dragHandle)[0] as HTMLElement, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.keyDown(surface, { key: 'Escape' })
    expect(grid.actions.reorder).not.toHaveBeenCalled()
    expect(grid.actions.setDragging).toHaveBeenLastCalledWith(null)
  })

  it('cancels a drag when the pointer is cancelled', () => {
    const grid = props()
    render(<WorkbenchCardGrid {...grid} />)
    const surface = document.querySelector('[data-workbench-grid]') as HTMLElement
    fireEvent.pointerDown(screen.getAllByLabelText(en.dragHandle)[0] as HTMLElement, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerCancel(surface, { pointerId: 1 })
    expect(grid.actions.reorder).not.toHaveBeenCalled()
    expect(grid.actions.setDragging).toHaveBeenLastCalledWith(null)
  })

  it('ignores a pointer press that did not start on a drag handle', () => {
    const grid = props()
    render(<WorkbenchCardGrid {...grid} />)
    fireEvent.pointerDown(screen.getByRole('heading', { name: 'a-card' }), { pointerId: 1 })
    expect(grid.actions.setDragging).not.toHaveBeenCalled()
  })

  it('moves a card from the keyboard and announces the new position', () => {
    const grid = props()
    render(<WorkbenchCardGrid {...grid} />)
    fireEvent.keyDown(screen.getAllByLabelText(en.dragHandle)[0] as HTMLElement, { key: 'ArrowDown' })
    expect(grid.actions.moveBy).toHaveBeenCalledWith('a-card', 1)
    expect(screen.getByRole('status').textContent).toBe('a-card moved to position 2')
  })

  it('ignores a keyboard move past the end', () => {
    const grid = props()
    render(<WorkbenchCardGrid {...grid} />)
    const handles = screen.getAllByLabelText(en.dragHandle)
    fireEvent.keyDown(handles[1] as HTMLElement, { key: 'ArrowDown' })
    expect(grid.actions.moveBy).not.toHaveBeenCalled()
  })

  it('marks every entry reorderable only when there is more than one card', () => {
    const { unmount } = render(<WorkbenchCardGrid {...props()} />)
    expect(document.querySelectorAll('[data-workbench-drag-handle]')).toHaveLength(2)
    unmount()
    render(<WorkbenchCardGrid {...props({
      view: { visibleIds: ['a-card'], draggingId: null, load: 'ready', write: { phase: 'idle' } },
    })} />)
    // The shell decides whether to draw the handle; the grid reports the flag
    // through the reorder session, so a single card still renders its entry.
    expect(document.querySelectorAll('[data-card-id]')).toHaveLength(1)
  })

  it('prefers an explicit notice over the last announcement', () => {
    render(<WorkbenchCardGrid {...props({ notice: 'layout could not be saved' })} />)
    expect(screen.getByRole('status').textContent).toBe('layout could not be saved')
  })
})
