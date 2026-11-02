/** @vitest-environment jsdom */
/**
 * The run control on a card's face.
 *
 * The card in the grid is where a run starts — the card's own page has no run control at
 * all — so these cases pin the readings of one small control: the press always opens the run
 * dialog, which asks where the run happens (and, for a card that takes one, what to do), and
 * a card whose own run is in flight offers that run's stop instead. Nothing here renders the
 * page.
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
    // A build that ships a chooser is the default case: the typed field is the fallback, and
    // it gets its own cases below.
    canChooseWorkspace: true,
    workspaceTypedProblem: undefined,
    catalog: [],
    catalogStatus: 'idle',
    catalogFailure: undefined,
    cardTitles: [],
    refinements: [],
    previous: undefined,
    ...overrides,
  }
}

/** The card's actions, with only the four this control calls recorded. */
function actions(): {
  run: ReturnType<typeof vi.fn>
  cancel: ReturnType<typeof vi.fn>
  chooseWorkspace: ReturnType<typeof vi.fn>
  setWorkspace: ReturnType<typeof vi.fn>
} {
  return { run: vi.fn(), cancel: vi.fn(), chooseWorkspace: vi.fn(), setWorkspace: vi.fn() }
}

/**
 * Render the control.
 * @param overrides - the view the case states, and the actions it watches.
 * @returns the render container and the recorded actions.
 */
function control(
  overrides: Partial<WorkbenchCardView> = {},
  recorded = actions(),
): { container: HTMLElement; recorded: ReturnType<typeof actions> } {
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

/**
 * The dialog's own run control.
 * @param panel - the open dialog.
 * @returns the control that sends the run.
 */
function submitOf(panel: HTMLElement): HTMLElement {
  const submit = panel.querySelector<HTMLElement>('[data-prompt-submit]')
  if (submit === null) throw new Error('the run dialog has no run control')
  return submit
}

describe('the card face run control', () => {
  it('asks where a card that takes no instruction runs, then sends the run', () => {
    // The dialog is not only about the sentence: it names the directory and lets it be
    // changed, and a card that needs no instruction still runs somewhere.
    const { container, recorded } = control({ instructionMode: 'none' })
    expect(startControl(container).textContent).toBe(zh.skillCardRun)
    fireEvent.click(startControl(container))
    // The press asked where, not for a run.
    expect(recorded.run).not.toHaveBeenCalled()
    const panel = dialog()
    if (panel === null) throw new Error('the run dialog did not open')
    expect(panel.textContent).toContain(zh.runPromptTitle)
    expect(panel.textContent).toContain(zh.promptFreshHint)
    // No field: there is no sentence to write.
    expect(panel.querySelector('textarea')).toBeNull()
    const workspace = panel.querySelector('[data-workspace-field]')
    expect(workspace?.textContent).toContain('repo')
    expect(panel.querySelector('[data-workspace-path]')?.textContent).toBe('F:\\git\\repo')

    fireEvent.click(submitOf(panel))
    expect(recorded.run).toHaveBeenCalledTimes(1)
    // No instruction, not an empty one: the card has no field to send one from.
    expect(recorded.run.mock.calls[0]?.[0]).toBeUndefined()
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

  it('is where a card with no directory is fixed, rather than a dead control', () => {
    // A card copied from another machine still has a skill, a template and a model; the
    // folder is the one thing that did not come with it. The press is the moment the user
    // can answer that, so it must still work.
    const { container, recorded } = control({
      instructionMode: 'none',
      canChooseWorkspace: true,
      workspaceTypedProblem: undefined,
      workspaceField: { kind: 'missing' },
    })
    expect(startControl(container).disabled).toBe(false)
    fireEvent.click(startControl(container))
    const panel = dialog()
    if (panel === null) throw new Error('the run dialog did not open')
    expect(panel.querySelector('[data-dialog-workspace-missing]')?.textContent)
      .toBe(zh.skillCardProblemWorkspaceMissing)
    // Nothing to run in yet: the dialog's own run control waits for a directory.
    expect(submitOf(panel)).toHaveProperty('disabled', true)
    expect(recorded.run).not.toHaveBeenCalled()

    const pick = panel.querySelector<HTMLElement>('[data-workspace-pick]')
    if (pick === null) throw new Error('the dialog offered no directory picker')
    fireEvent.click(pick)
    expect(recorded.chooseWorkspace).toHaveBeenCalledTimes(1)
  })

  it('names a directory that is gone and the picker that replaces it', () => {
    const { container } = control({
      instructionMode: 'optional',
      canChooseWorkspace: true,
      workspaceTypedProblem: undefined,
      workspaceField: { kind: 'invalid', path: 'D:\\Git\\Gone', leaf: 'Gone', checked: true },
    })
    fireEvent.click(startControl(container))
    const panel = dialog()
    if (panel === null) throw new Error('the run dialog did not open')
    expect(panel.querySelector('[data-workspace-path]')?.textContent).toBe('D:\\Git\\Gone')
    expect(panel.querySelector('[data-workspace-invalid]')?.textContent)
      .toBe(zh.skillCardProblemWorkspaceInvalid)
    expect(submitOf(panel)).toHaveProperty('disabled', true)
  })

  it('asks for the path when the build ships no picker at all', () => {
    // The native chooser belongs to the desktop plugin, and the upstream workspace UI's own
    // picker is absent from a web-only profile. A card on such a build is not stuck: the field
    // takes the path, and the Host confirms it before anything is stored.
    const { container, recorded } = control({
      instructionMode: 'none',
      canChooseWorkspace: false,
      workspaceTypedProblem: undefined,
      workspaceField: { kind: 'missing' },
    })
    fireEvent.click(startControl(container))
    const panel = dialog()
    if (panel === null) throw new Error('the run dialog did not open')
    expect(panel.querySelector('[data-workspace-picker-unavailable]')?.textContent)
      .toBe(zh.skillCardWorkspacePickerUnavailable)
    // No button that cannot work, and an input that can.
    expect(panel.querySelector('[data-workspace-pick]')).toBeNull()
    const input = panel.querySelector<HTMLInputElement>('[data-workspace-input]')
    if (input === null) throw new Error('the dialog offered no path field')
    expect(input.value).toBe('')

    fireEvent.change(input, { target: { value: 'F:\\git\\repo' } })
    // Enter is the whole gesture: the field and the button beside it are one control.
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(recorded.setWorkspace).toHaveBeenCalledWith('F:\\git\\repo')
    // The path was asked for; the run still waits for the card to actually hold it.
    expect(recorded.run).not.toHaveBeenCalled()
  })

  it('states why a path that is not a path was refused', () => {
    // The card keeps the directory it had: a typo is answered, not stored.
    const { container } = control({
      instructionMode: 'none',
      canChooseWorkspace: false,
      workspaceTypedProblem: 'invalid-path',
      workspaceField: { kind: 'missing' },
    })
    fireEvent.click(startControl(container))
    const panel = dialog()
    if (panel === null) throw new Error('the run dialog did not open')
    expect(panel.querySelector('[data-workspace-typed-problem="invalid-path"]')?.textContent)
      .toBe(zh.skillCardWorkspaceTypedInvalid)
    expect(submitOf(panel)).toHaveProperty('disabled', true)
  })

  it('states why a path with no directory behind it was refused', () => {
    const { container } = control({
      instructionMode: 'none',
      canChooseWorkspace: false,
      workspaceTypedProblem: 'not-directory',
      workspaceField: { kind: 'missing' },
    })
    fireEvent.click(startControl(container))
    const panel = dialog()
    if (panel === null) throw new Error('the run dialog did not open')
    expect(panel.querySelector('[data-workspace-typed-problem="not-directory"]')?.textContent)
      .toBe(zh.skillCardWorkspaceTypedMissing)
    expect(submitOf(panel)).toHaveProperty('disabled', true)
  })
})
