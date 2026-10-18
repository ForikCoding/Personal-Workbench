// @vitest-environment jsdom
/** Page composition: read on selection, optimistic writes, and recovery paths. */

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { primitivesMock } from './support/primitives-mock.tsx'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

const { WorkbenchPage } = await import('../src/client/WorkbenchPage.tsx')
type PageProps = import('../src/client/WorkbenchPage.tsx').WorkbenchPageProps
type WorkbenchLayoutPatch = import('../src/layout-contract.ts').WorkbenchLayoutPatch
type WorkbenchLayoutApi = import('../src/client/layout-api.ts').WorkbenchLayoutApi
const { WorkbenchCardShellView } = await import('../src/client/WorkbenchCardShell.tsx')
const { WorkbenchCardGrid } = await import('../src/client/WorkbenchCardGrid.tsx')
const { en } = await import('../src/client/locales.ts')
type LocaleKey = import('../src/client/locales.ts').WorkbenchLocaleKey

afterEach(cleanup)

/** Translate an English dictionary value with its template parameters. */
const t = (key: LocaleKey, params?: Record<string, unknown>): string =>
  Object.entries(params ?? {}).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    en[key],
  )

/**
 * Build page props.
 * @param overrides - fields to replace.
 * @returns complete props.
 */
function props(overrides: Partial<PageProps> = {}): PageProps {
  const cards = [{ id: 'a-card', order: 100, label: 'A card' }, { id: 'b-card', order: 200, label: 'B card' }]
  return {
    usePanelInfo: ((selector: (info: { activePanelId: string | null }) => unknown) => selector({ activePanelId: 'workbench' })) as PageProps['usePanelInfo'],
    useCards: ((selector: (snapshot: typeof cards) => unknown) => selector(cards)) as PageProps['useCards'],
    // The grid is the state these cases render: no card has been opened.
    useSelection: ((selector: (snapshot: undefined) => unknown) => selector(undefined)) as PageProps['useSelection'],
    skillCards: {
      api: {
        read: async () => ({ status: 'unavailable', reason: 'not used by these cases' }),
        write: async () => ({ status: 'failed', reason: 'not used by these cases' }),
        catalog: async () => ({ status: 'ok', entries: [] }),
        poll: async () => ({ status: 'unavailable', reason: 'not used by these cases' }),
        start: async () => ({ status: 'failed', code: 'unavailable', message: 'not used by these cases' }),
        cancel: async () => {},
        saveResult: async () => ({ status: 'unavailable', reason: 'not used by these cases' }),
      },
      runSessionId: () => undefined,
    },
    closeCard: () => {},
    openCard: () => {},
    api: {
      read: async () => ({ status: 'ok', snapshot: { revision: '1:0', entries: [] } }),
      write: async () => ({ status: 'ok', snapshot: { revision: '1:1', entries: [] } }),
    },
    renderSlot: ((_name: string, _owner: unknown, opts: { only?: string }) => <CardEntry id={opts.only ?? ''} />) as PageProps['renderSlot'],
    t,
    ...overrides,
  } as PageProps
}

/** One card entry rendered through the real shell and the grid's reorder session. */
function CardEntry({ id }: { id: string }): ReactNode {
  return (
    <WorkbenchCardShellView
      id={id}
      title={id}
      position={1}
      reorderable
      dragging={false}
      body={<span>body {id}</span>}
      onMoveBy={() => {}}
      onCancelDrag={() => {}}
      t={key => en[key]}
    />
  )
}

/**
 * Point the grid's hit test at one card, as jsdom cannot hit-test itself.
 * @param id - card id the pointer is over.
 */
function pointAt(id: string): void {
  const card = document.querySelector(`[data-card-id="${id}"]`)
  document.elementFromPoint = () => card
}

/**
 * Drag the first card onto the second and drop it.
 *
 * The write-driven cases below all need one committed layout change; before the
 * X became a physical delete the cheapest gesture was clicking it, and now the
 * cheapest is a real reorder — which is the only layout write left.
 * @param target - card id to drop onto.
 */
async function dragFirstOnto(target: string): Promise<void> {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  pointAt(target)
  const surface = document.querySelector('[data-workbench-grid]') as HTMLElement
  fireEvent.pointerDown(screen.getAllByLabelText(en.dragHandle)[0] as HTMLElement, { pointerId: 1, clientX: 0, clientY: 0 })
  fireEvent.pointerMove(surface, { pointerId: 1, clientX: 5, clientY: 5 })
  fireEvent.pointerUp(surface, { pointerId: 1, clientX: 5, clientY: 5 })
}

/** Render the page with a grid whose entries are wired to the reorder session. */
function renderPage(overrides: Partial<PageProps> = {}) {
  const merged = props(overrides)
  const original = merged.renderSlot
  merged.renderSlot = ((name: string, owner: unknown, opts: { only?: string }) => {
    void original
    void name
    void owner
    return <CardEntry id={opts.only ?? ''} />
  }) as PageProps['renderSlot']
  return render(<WorkbenchPage {...merged} />)
}

describe('WorkbenchPage', () => {
  it('creates a skill card from the grid entry, for the user to configure', async () => {
    // Choosing a type is the whole interaction: the card appears on the grid and the
    // user configures it there, so this entry stays one decision.
    const writes: { cardId?: unknown; name?: unknown }[] = []
    const { container } = render(
      <WorkbenchPage
        {...props({
          skillCards: {
            api: {
              ...props().skillCards.api,
              read: async () => ({ status: 'ok', snapshot: { revision: '1:0', cards: [], results: [] } }),
              write: async (patch: { cardId?: unknown; name?: unknown }) => {
                writes.push(patch)
                return {
                  status: 'ok',
                  snapshot: {
                    revision: '1:1',
                    cards: [{ cardId: 'skill-card-1', name: 'Skill card 1', templateSkills: [] }],
                    results: [],
                  },
                }
              },
            },
            runSessionId: () => undefined,
          },
        })}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: en.createCard }))
    // The type menu is a separate render from the grid, so it is awaited.
    expect(await screen.findByRole('menuitem', { name: en.cardTypeSkill })).toBeTruthy()
    // A type that creates nothing yet is offered as disabled rather than hidden, so
    // the user can see it is planned.
    expect(screen.getByRole('menuitem', { name: `${en.cardTypeTest} · ${en.createCardCancel}` })).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: en.cardTypeSkill }))
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]).toMatchObject({ cardId: 'skill-card-1', name: 'Skill card 1' })
    // The write answers with the committed state, so the new card reaches the grid
    // without a second read.
    await waitFor(() => {
      expect(container.querySelector('[data-workbench-cell="skill-card-1"]')).not.toBeNull()
    })
  })

  it('renders a stored card instance as its own card', async () => {
    // A user-created card is stored data, not a slot registration: the registered
    // skill card entry renders it, told which instance it is rendering. Rendering
    // it under its own id would find no entry and produce nothing.
    const calls: { readonly only: string | undefined; readonly cardId: string }[] = []
    render(
      <WorkbenchPage
        {...props({
          skillCards: {
            api: {
              ...props().skillCards.api,
              read: async () => ({
                status: 'ok',
                snapshot: {
                  revision: '1:0',
                  cards: [
                    { cardId: 'a-card', templateSkills: [] },
                    { cardId: 'skill-card-2', name: 'Repo overview', templateSkills: [] },
                  ],
                  results: [],
                },
              }),
            },
            runSessionId: () => undefined,
          },
          renderSlot: ((_name: string, owner: { cardId: string }, opts: { only?: string }) => {
            calls.push({ only: opts.only, cardId: owner.cardId })
            return <span>{opts.only}</span>
          }) as PageProps['renderSlot'],
        })}
      />,
    )
    await waitFor(() => { expect(calls.some(call => call.cardId === 'skill-card-2')).toBe(true) })
    // A registered card renders through its own entry; the instance goes through the
    // skill card entry with its own id.
    expect(calls.find(call => call.cardId === 'a-card')?.only).toBe('a-card')
    expect(calls.find(call => call.cardId === 'skill-card-2')?.only).toBe('skill-card')
  })

  it('applies stored positions over the declared order', async () => {
    const read = vi.fn(async () => ({
      status: 'ok' as const,
      snapshot: {
        revision: '4:0',
        entries: [{ id: 'a-card', position: 900 }, { id: 'b-card', position: 10 }],
      },
    }))
    renderPage({ api: { read, write: props().api.write } })
    await waitFor(() => { expect(read).toHaveBeenCalledTimes(1) })
    await waitFor(() => {
      const cards = [...document.querySelectorAll('[data-card-id]')].map(node => node.getAttribute('data-card-id'))
      expect(cards).toEqual(['b-card', 'a-card'])
    })
  })

  it('leaves an untouched card at its declared place', async () => {
    // Only b-card carries a position. a-card was never arranged, so the merge
    // keeps it where the ledger declares it rather than shifting it for a
    // position the user never set on it.
    const read = async () => ({
      status: 'ok' as const,
      snapshot: { revision: '4:0', entries: [{ id: 'b-card', position: 10 }] },
    })
    renderPage({ api: { read, write: props().api.write } })
    await waitFor(() => {
      const cards = [...document.querySelectorAll('[data-card-id]')].map(node => node.getAttribute('data-card-id'))
      expect(cards).toEqual(['a-card', 'b-card'])
    })
  })

  it('does not read until the panel is selected', () => {
    const read = vi.fn(async () => ({ status: 'ok' as const, snapshot: { revision: '4:0', entries: [] } }))
    renderPage({
      usePanelInfo: ((selector: (info: { activePanelId: string | null }) => unknown) => selector({ activePanelId: null })) as PageProps['usePanelInfo'],
      api: { read, write: props().api.write },
    })
    expect(read).not.toHaveBeenCalled()
  })

  it('surfaces an unavailable layout without blocking the cards', async () => {
    renderPage({
      api: {
        read: async () => ({ status: 'unavailable' as const, reason: 'route answered 500' }),
        write: async () => ({ status: 'ok' as const, snapshot: { revision: '1:1', entries: [] } }),
      },
    })
    await waitFor(() => { expect(screen.getByText('body a-card')).toBeTruthy() })
  })

  it('writes one patch when a card is reordered and keeps the change on screen', async () => {
    const write = vi.fn(async () => ({
      status: 'ok' as const,
      snapshot: { revision: '1:1', entries: [{ id: 'a-card', position: 2048 }] },
    }))
    renderPage({ api: { read: props().api.read, write } })
    await waitFor(() => { expect(screen.getAllByLabelText(en.dragHandle)).toHaveLength(2) })
    await dragFirstOnto('b-card')
    await waitFor(() => { expect(write).toHaveBeenCalledTimes(1) })
    expect(write).toHaveBeenCalledWith({ baseRevision: '1:0', entries: [{ id: 'a-card', position: 1024 }] })
  })

  it('keeps the shown order and reports a failed write', async () => {
    const write = vi.fn(async () => ({ status: 'failed' as const, reason: 'offline' }))
    renderPage({ api: { read: async () => ({
      status: 'ok' as const,
      snapshot: { revision: '1:0', entries: [{ id: 'b-card', position: 10 }] },
    }), write } })
    await waitFor(() => { expect(screen.getAllByLabelText(en.dragHandle)).toHaveLength(2) })
    await dragFirstOnto('b-card')
    await waitFor(() => { expect(screen.getByRole('status').textContent).toContain('offline') })
    // The optimistic change stays rendered even though it was not stored.
    await waitFor(() => {
      const cards = [...document.querySelectorAll('[data-card-id]')].map(node => node.getAttribute('data-card-id'))
      expect(cards).toEqual(['b-card', 'a-card'])
    })
  })

  it('adopts the other client solution when a write conflicts', async () => {
    const write = vi.fn(async () => ({
      status: 'conflict' as const,
      snapshot: { revision: '2:0', entries: [{ id: 'b-card', position: 1 }, { id: 'a-card', position: 2 }] },
    }))
    renderPage({ api: { read: props().api.read, write } })
    await waitFor(() => { expect(screen.getAllByLabelText(en.dragHandle)).toHaveLength(2) })
    await dragFirstOnto('b-card')
    await waitFor(() => { expect(screen.getByRole('status').textContent).toContain(en.mergedElsewhere) })
    await waitFor(() => {
      const cards = [...document.querySelectorAll('[data-card-id]')].map(node => node.getAttribute('data-card-id'))
      expect(cards).toEqual(['b-card', 'a-card'])
    })
  })

  it('offers the creation entry when no card exists', () => {
    // An empty card list is the normal first-run state, not an empty state to guide
    // out of. The grid holds the creation entry, so replacing the grid with a
    // message took away the only way to make the first card.
    renderPage({ useCards: ((selector: (snapshot: never[]) => unknown) => selector([])) as PageProps['useCards'] })
    expect(screen.getByText(en.createCard)).toBeTruthy()
  })

  it('offers no hiding control, because hiding is not a capability', () => {
    // A card either leaves the product by being deleted or it stays; there is no
    // second, reversible way to make it disappear. The registered cards here
    // supply no `onRemove`, so the only control the shell draws is the handle.
    renderPage()
    expect(screen.queryAllByLabelText(en.removeCard)).toHaveLength(0)
    expect(document.querySelectorAll('[data-workbench-remove]')).toHaveLength(0)
  })

  it('drops a hidden field a stored record still carries', async () => {
    // A record written by an older build still says `hidden: true`. There is no
    // migration step: the card is read as visible, and the field never travels
    // back out in a patch.
    const write = vi.fn<WorkbenchLayoutApi['write']>(async () => ({
      status: 'ok',
      snapshot: { revision: '1:1', entries: [] },
    }))
    renderPage({
      api: {
        read: async () => ({
          status: 'ok',
          snapshot: {
            revision: '1:0',
            entries: [{ id: 'b-card', hidden: true }] as unknown as { readonly id: string; readonly position?: number }[],
          },
        }),
        write,
      },
    })
    await waitFor(() => { expect(screen.getAllByLabelText(en.dragHandle)).toHaveLength(2) })
    await dragFirstOnto('b-card')
    await waitFor(() => { expect(write).toHaveBeenCalledTimes(1) })
    expect(write.mock.calls[0]?.[0]).toEqual({ baseRevision: '1:0', entries: [{ id: 'a-card', position: 1024 }] })
  })

  it('reorders a card by dropping it on another', async () => {
    const write = vi.fn(async (_patch: WorkbenchLayoutPatch) => ({ status: 'ok' as const, snapshot: { revision: '1:1', entries: [] } }))
    renderPage({
      api: {
        read: async () => ({ status: 'ok' as const, snapshot: { revision: '1:0', entries: [{ id: 'b-card', position: 10 }] } }),
        write,
      },
    })
    await waitFor(() => { expect(screen.getAllByLabelText(en.dragHandle)).toHaveLength(2) })
    await dragFirstOnto('b-card')
    await waitFor(() => { expect(write).toHaveBeenCalledTimes(1) })
    // Only the moved card is written, quoting the revision the page read.
    const patch = write.mock.calls[0]?.[0]
    expect(patch?.baseRevision).toBe('1:0')
    expect(patch?.entries.map(entry => entry.id)).toEqual(['a-card'])
  })

  it('renders a grid entry for every visible card', async () => {
    renderPage()
    await waitFor(() => { expect(screen.getByText('body a-card')).toBeTruthy() })
    expect(screen.getByText('body b-card')).toBeTruthy()
    expect(WorkbenchCardGrid).toBeTypeOf('function')
  })

  it('ignores a card that the ledger no longer lists', async () => {
    renderPage({
      useCards: ((selector: (snapshot: { id: string; order: number; label: string }[]) => unknown) =>
        selector([{ id: 'a-card', order: 100, label: 'A card' }])) as PageProps['useCards'],
    })
    await waitFor(() => { expect(screen.queryByText('body b-card')).toBeNull() })
    expect(screen.getByText('body a-card')).toBeTruthy()
  })
})

/** `act` is re-exported so a future interaction spec can await React work. */
export { act }
