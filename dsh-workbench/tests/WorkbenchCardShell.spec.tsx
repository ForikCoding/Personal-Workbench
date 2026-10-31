// @vitest-environment jsdom
/** Presentation behaviour of the shared workbench card shell. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { primitivesMock } from './support/primitives-mock.tsx'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

const { WorkbenchCardShellView } = await import('../src/client/WorkbenchCardShell.tsx')
type ShellProps = import('../src/client/WorkbenchCardShell.tsx').WorkbenchCardShellViewProps
const { en } = await import('../src/client/locales.ts')
type LocaleKey = import('../src/client/locales.ts').WorkbenchLocaleKey

afterEach(cleanup)

const t = (key: LocaleKey): string => en[key]

/**
 * Build shell props.
 * @param overrides - fields to replace.
 * @returns complete props.
 */
function props(overrides: Partial<ShellProps> = {}): ShellProps {
  return {
    id: 'git-repo',
    title: 'Git repository',
    position: 1,
    reorderable: true,
    dragging: false,
    onMoveBy: () => {},
    onCancelDrag: () => {},
    t,
    ...overrides,
  }
}

describe('card monogram', () => {
  it('marks a card with the first character of its name', async () => {
    const { cardMark } = await import('../src/client/WorkbenchCardShell.tsx')
    expect(cardMark('任务分析')).toBe('任')
    // One code point, not one UTF-16 unit: half a surrogate pair is not a character.
    expect(cardMark('🎯 targets')).toBe('🎯')
    expect(cardMark('git repo')).toBe('G')
    expect(cardMark('   ')).toBe('·')
  })

  it('takes its hue from the card id, not from the name', async () => {
    const { cardMarkHue } = await import('../src/client/WorkbenchCardShell.tsx')
    // Stable across renders and across a rename: the colour is how a card is recognised
    // before its title is read.
    expect(cardMarkHue('skill-card-2')).toBe(cardMarkHue('skill-card-2'))
    expect(cardMarkHue('skill-card-2')).not.toBe(cardMarkHue('skill-card-3'))
  })
})

describe('WorkbenchCardShellView', () => {
  it('renders the title, subtitle, and body', () => {
    render(<WorkbenchCardShellView {...props({ subtitle: 'D:\\repo', body: <p>clean</p> })} />)
    expect(screen.getByRole('heading', { name: 'Git repository' })).toBeTruthy()
    expect(screen.getByText('D:\\repo')).toBeTruthy()
    expect(screen.getByText('clean')).toBeTruthy()
  })

  it('shows the localized state name when no status text is given', () => {
    render(<WorkbenchCardShellView {...props({ state: 'ongoing' })} />)
    expect(screen.getByText(en.statusOngoing)).toBeTruthy()
  })

  it('prefers explicit status text over the state name', () => {
    render(<WorkbenchCardShellView {...props({ state: 'done', status: '2 passed' })} />)
    expect(screen.getByText('2 passed')).toBeTruthy()
    expect(screen.queryByText(en.statusDone)).toBeNull()
  })

  it('replaces the body with a readable failure', () => {
    render(<WorkbenchCardShellView {...props({ body: <p>clean</p>, failure: 'git is not installed' })} />)
    expect(screen.getByText(en.cardFailed)).toBeTruthy()
    expect(screen.getByText('git is not installed')).toBeTruthy()
    expect(screen.queryByText('clean')).toBeNull()
  })

  it('removes the card through the host action', () => {
    const onRemove = vi.fn()
    render(<WorkbenchCardShellView {...props({ onRemove })} />)
    fireEvent.click(screen.getByLabelText(en.removeCard))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('renders no X at all when the card supplies no removal', () => {
    // A card that the shell cannot delete must not grow a fallback control:
    // hiding is not offered anywhere, so the alternative to a delete button is
    // no button.
    render(<WorkbenchCardShellView {...props()} />)
    expect(screen.queryByLabelText(en.removeCard)).toBeNull()
    expect(document.querySelectorAll('[data-workbench-remove]')).toHaveLength(0)
  })

  it('draws the mark beside the title, invisible to a screen reader', () => {
    // The head is the title and its controls; the mark is decoration for the eye, so it
    // must not become a second thing the accessible name says.
    const { container } = render(<WorkbenchCardShellView {...props({ title: '任务分析' })} />)
    const mark = container.querySelector('[aria-hidden="true"]')
    expect(mark?.textContent).toBe('任')
    // The hue travels on the card itself, where the stylesheet reads it from.
    expect(container.querySelector('article')?.getAttribute('style')).toContain('--wb-hue')
    expect(container.querySelector('h3')?.textContent).toBe('任务分析')
  })

  it('keeps the name and its facts on separate rows', () => {
    // One metadata row under the title: the skill it runs and where its last run stands.
    // A title long enough to wrap must not drag the facts out of line across the grid.
    const { container } = render(
      <WorkbenchCardShellView {...props({ subtitle: 'git-repo', state: 'done', status: '14:28' })} />,
    )
    const header = container.querySelector('header')
    expect(header?.querySelector('h3')?.parentElement?.textContent).toBe('GGit repository')
    const meta = header?.lastElementChild
    expect(meta?.textContent).toBe('git-repo14:28')
  })

  it('offers the reorder handle only while reordering is possible', () => {
    const { unmount } = render(<WorkbenchCardShellView {...props()} />)
    expect(screen.getByLabelText(en.dragHandle)).toBeTruthy()
    unmount()
    render(<WorkbenchCardShellView {...props({ reorderable: false })} />)
    expect(screen.queryByLabelText(en.dragHandle)).toBeNull()
  })

  it('leaves the reorder handle last in the head actions, at the tertiary weight', () => {
    // It is an affordance for the position a card already has, so it sits after the
    // controls that act on the card and carries the muted colour rather than the
    // card's own weight. Hiding it at rest is the shell's rule for icon controls, and
    // it comes back on hover and on focus.
    const { container } = render(
      <WorkbenchCardShellView
        {...props({ onRemove: () => {}, onRefresh: () => {}, actions: <button type="button">Open</button> })}
      />,
    )
    const controls = [...(container.querySelector('header')?.querySelectorAll('button') ?? [])]
    expect(controls.map(control => control.hasAttribute('data-workbench-drag-handle')))
      .toEqual([false, false, false, true])
    expect(controls.at(-1)?.className).toContain('handle')
  })

  it('moves the card from the keyboard and cancels on Escape', () => {
    const onMoveBy = vi.fn()
    const onCancelDrag = vi.fn()
    render(<WorkbenchCardShellView {...props({ onMoveBy, onCancelDrag })} />)
    const handle = screen.getByLabelText(en.dragHandle)
    fireEvent.keyDown(handle, { key: 'ArrowUp' })
    expect(onMoveBy).toHaveBeenCalledWith(-1)
    fireEvent.keyDown(handle, { key: 'ArrowDown' })
    expect(onMoveBy).toHaveBeenCalledWith(1)
    fireEvent.keyDown(handle, { key: 'Escape' })
    expect(onCancelDrag).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(handle, { key: 'a' })
    expect(onMoveBy).toHaveBeenCalledTimes(2)
  })

  it('exposes the drag session and grid position', () => {
    const { container } = render(<WorkbenchCardShellView {...props({ dragging: true, position: 3 })} />)
    const card = container.querySelector('[data-card-id="git-repo"]')
    expect(card?.getAttribute('data-card-position')).toBe('3')
    expect(card?.hasAttribute('data-dragging')).toBe(true)
  })

  it('shows the refresh control only when the card offers one', () => {
    const onRefresh = vi.fn()
    const { unmount } = render(<WorkbenchCardShellView {...props({ onRefresh })} />)
    fireEvent.click(screen.getByLabelText(en.refreshAll))
    expect(onRefresh).toHaveBeenCalledTimes(1)
    unmount()
    render(<WorkbenchCardShellView {...props()} />)
    expect(screen.queryByLabelText(en.refreshAll)).toBeNull()
  })

  it('renders the card actions beside the host controls', () => {
    render(<WorkbenchCardShellView {...props({ onRemove: () => {}, actions: <button type="button">Open</button> })} />)
    expect(screen.getByRole('button', { name: 'Open' })).toBeTruthy()
    // The host's own controls stay available next to the card's.
    expect(screen.getByLabelText(en.removeCard)).toBeTruthy()
  })

  it('stays inert until the card offers an activation', () => {
    const { container } = render(<WorkbenchCardShellView {...props()} />)
    const card = container.querySelector('[data-card-id]') as HTMLElement
    expect(card.getAttribute('role')).toBeNull()
    expect(card.getAttribute('tabindex')).toBeNull()
  })

  it('activates the card from a click and from the keyboard', () => {
    const onActivate = vi.fn()
    const { container } = render(<WorkbenchCardShellView {...props({ onActivate })} />)
    const card = container.querySelector('[data-card-id]') as HTMLElement
    expect(card.getAttribute('role')).toBe('button')
    fireEvent.click(card)
    expect(onActivate).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(card, { key: 'Enter' })
    fireEvent.keyDown(card, { key: ' ' })
    expect(onActivate).toHaveBeenCalledTimes(3)
  })

  it('does not activate the card from a control inside it', () => {
    // The card hosts its own controls, so a click there is not a click on the card.
    // This is what keeps the configuration button from also opening the card.
    const onActivate = vi.fn()
    const onOpen = vi.fn()
    render(
      <WorkbenchCardShellView
        {...props({
          onActivate,
          actions: <button type="button" onClick={onOpen}>Open</button>,
        })}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onActivate).not.toHaveBeenCalled()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Open' }), { key: 'Enter' })
    expect(onActivate).not.toHaveBeenCalled()
  })
})
