/** @vitest-environment jsdom */
/**
 * The run control on a card's face.
 *
 * The card in the grid is where a run starts — the card's own page has no run control at
 * all — so these cases pin the three readings of one small control: a card that takes no
 * instruction starts on the press, a card that takes one asks in a dialog first, and a card
 * whose own run is in flight offers that run's stop instead. Nothing here renders the page.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { CardRunButton } from '../src/client/skill-card/CardRun.tsx'
import type { WorkbenchCardActions, WorkbenchCardView } from '../src/client/skill-card/controller.ts'
import { zh } from '../src/client/locales.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

// Vitest runs without globals, so the library's own auto-cleanup never registers.
afterEach(cleanup)

// Each case starts with no draft: the dialog is where a half-written ask is kept, and a case
// that found the previous case's sentence in the field would be asserting the wrong thing.
beforeEach(() => { globalThis.sessionStorage.clear() })

/** The card's own words: a case asserts the copy the user reads, not the key behind it. */
const t = (key: keyof typeof zh): string => zh[key]

/**
 * Build a card view.
 * @param overrides - the fields the case varies.
 * @returns the view.
 */
function view(overrides: Partial<WorkbenchCardView> = {}): WorkbenchCardView {
  return {
    status: 'ready',
    runnable: true,
    runs: [],
    modelField: { kind: 'fixed', model: { provider: 'lightcode', model: 'GLM-FLASH-LATEST' } },
    workspaceField: { kind: 'ready', path: 'F:\\git\\repo', leaf: 'repo' },
    permission: 'workspace-write',
    instructionMode: 'none',
    recentInstructions: [],
    canChooseWorkspace: false,
    catalog: [],
    catalogStatus: 'idle',
    catalogFailure: undefined,
    cardTitles: [],
    refinements: [],
    previous: undefined,
    ...overrides,
  }
}

/** The card's actions, with only the two this control calls recorded. */
function actions(): { run: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> } {
  return { run: vi.fn(), cancel: vi.fn() }
}

/**
 * Render the control.
 * @param overrides - the view the case states, and the actions it watches.
 * @returns the render container and the recorded actions.
 */
function control(
  overrides: Partial<WorkbenchCardView> = {},
  recorded = actions(),
): { container: HTMLElement; recorded: { run: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> } } {
  const { container } = render(
    <CardRunButton
      cardId="skill-card"
      view={view(overrides)}
      actions={recorded as unknown as WorkbenchCardActions}
      t={t}
    />,
  )
  return { container, recorded }
}

/**
 * Read the control the face renders.
 * @param container - the render container.
 * @returns the control, by the face it is in rather than by its label, which changes.
 */
function startControl(container: HTMLElement): HTMLButtonElement {
  const element = container.querySelector<HTMLButtonElement>('[data-card-run="start"]')
  if (element === null) throw new Error('the card face rendered no run control')
  return element
}

/**
 * Read the dialog, wherever the portal put it.
 * @returns the panel, or null when no dialog is open.
 */
function dialog(): HTMLElement | null {
  return document.querySelector('[data-prompt-panel]')
}

describe('the card face run control', () => {
  it('starts a card that takes no instruction on the press, with no dialog in the way', () => {
    // A dialog over a form with nothing in it would be a question with no answer.
    const { container, recorded } = control({ instructionMode: 'none' })
    expect(startControl(container).textContent).toBe(zh.skillCardRun)
    fireEvent.click(startControl(container))
    expect(recorded.run).toHaveBeenCalledTimes(1)
    expect(recorded.run.mock.calls[0]).toEqual([])
    expect(dialog()).toBeNull()
  })

  it('asks a card that takes an instruction, and sends what was written', () => {
    const { container, recorded } = control({ instructionMode: 'optional' })
    fireEvent.click(startControl(container))
    // Nothing is sent by opening the dialog: the press asked for a sentence, not for a run.
    expect(recorded.run).not.toHaveBeenCalled()
    const panel = dialog()
    if (panel === null) throw new Error('the run dialog did not open')
    expect(panel.textContent).toContain(zh.runPromptTitle)
    const field = panel.querySelector('textarea')
    if (field === null) throw new Error('the dialog held no field')
    expect(field.getAttribute('placeholder')).toBe(zh.runInstructionPlaceholderOptional)

    fireEvent.change(field, { target: { value: '列出本周改动' } })

    const submit = [...panel.querySelectorAll('button')]
      .find(button => button.textContent === zh.skillCardRun)
    if (submit === undefined) throw new Error('the dialog offered no way to run')
    fireEvent.click(submit)
    expect(recorded.run).toHaveBeenCalledWith('列出本周改动')
    expect(dialog()).toBeNull()
  })

  it('refuses an empty field on a card that needs one, and sends once it is written', () => {
    // Required, and nothing was written: the refusal happens in the dialog, in view, rather
    // than as a control that is closed without saying why.
    const { container, recorded } = control({ instructionMode: 'required' })
    fireEvent.click(startControl(container))
    const panel = dialog()
    if (panel === null) throw new Error('the run dialog did not open')
    const submit = [...panel.querySelectorAll('button')]
      .find(button => button.textContent === zh.skillCardRun)
    if (submit === undefined) throw new Error('the dialog offered no way to run')
    fireEvent.click(submit)
    expect(recorded.run).not.toHaveBeenCalled()
    expect(panel.querySelector('[data-prompt-problem]')?.textContent).toBe(zh.runInstructionRequired)
  })

  it('offers this card’s recent asks back, refilling the field rather than running', () => {
    const { container, recorded } = control({
      instructionMode: 'optional',
      recentInstructions: ['分析 T202601010001', '重新做一下影响分析'],
    })
    fireEvent.click(startControl(container))
    const panel = dialog()
    if (panel === null) throw new Error('the run dialog did not open')
    const chips = [...panel.querySelectorAll<HTMLButtonElement>('[data-run-instruction-chip]')]
    expect(chips.map(chip => chip.textContent)).toEqual(['分析 T202601010001', '重新做一下影响分析'])
    fireEvent.click(chips[1] as HTMLButtonElement)
    expect(recorded.run).not.toHaveBeenCalled()
    expect(panel.querySelector('textarea')?.value).toBe('重新做一下影响分析')
  })

  it('becomes the run’s stop while this card’s own run is in flight', () => {
    // The grid is where the user pressed the thing that started it, so the grid is also where
    // it is stopped: the card's page has no run control at all.
    const { container, recorded } = control({
      run: { cardId: 'skill-card', phase: 'running', startedAt: 1, retried: false },
    })
    const stop = container.querySelector<HTMLButtonElement>('[data-card-run="stop"]')
    expect(stop?.textContent).toBe(zh.skillCardCancel)
    expect(container.querySelector('[data-card-run="start"]')).toBeNull()
    fireEvent.click(stop as HTMLButtonElement)
    expect(recorded.cancel).toHaveBeenCalledTimes(1)
    expect(recorded.run).not.toHaveBeenCalled()
  })

  it('is closed on a card that cannot run, in every mode', () => {
    // Its face already says why, so a pressable-and-silent control would only be a second
    // place to learn nothing.
    for (const instructionMode of ['none', 'optional', 'required'] as const) {
      const { container } = control({ runnable: false, instructionMode })
      expect(startControl(container).disabled).toBe(true)
      expect(dialog()).toBeNull()
      cleanup()
    }
  })
})

describe('the run dialog', () => {
  it('is the same dialog the result page opens, so it names the card it runs', () => {
    // One panel for both places: the result page's 运行 and the card's own control ask the same
    // question, and only the heading differs.
    const { container } = control({ instructionMode: 'optional' })
    fireEvent.click(startControl(container))
    const panel = dialog()
    expect(panel?.getAttribute('role')).toBe('dialog')
    expect(panel?.textContent).toContain(zh.runPromptTitle)
  })

  it('closes on Escape without running anything', () => {
    const { container, recorded } = control({ instructionMode: 'optional' })
    fireEvent.click(startControl(container))
    expect(dialog()).not.toBeNull()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(dialog()).toBeNull()
    expect(recorded.run).not.toHaveBeenCalled()
  })
})
