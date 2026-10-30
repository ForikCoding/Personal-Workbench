/** @vitest-environment jsdom */
/** What the skill card body shows in each state. */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { SkillCardBody } from '../src/client/skill-card/SkillCard.tsx'
import type { WorkbenchCardView } from '../src/client/skill-card/controller.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

// Vitest runs without globals, so the library's own auto-cleanup never registers.
afterEach(cleanup)

/**
 * Translator that echoes the key, so a spec asserts which key was chosen rather
 * than what the copy currently says.
 * @param key - dictionary key.
 * @returns the key.
 */
const t = (key: string): string => key

/**
 * Build a card view.
 * @param overrides - fields the case varies.
 * @returns the view.
 */
function view(overrides: Partial<WorkbenchCardView> = {}): WorkbenchCardView {
  return {
    status: 'ready',
    runnable: false,
    runs: [],
    // The face renders neither the model field nor a run control; the body cases below are
    // about the content, so the card is stated without a route.
    modelField: { kind: 'unavailable' },
    // Same for the directory: the face shows no workspace field, and nothing on the grid
    // gates a run on one.
    workspaceField: { kind: 'missing' },
    // The mode is on the view (the result page states it), but the body renders only the
    // document, so the face's cases never read it.
    permission: 'workspace-write',
    // Likewise the instruction mode and the few asks the run bar offers back: the face
    // renders neither, and the default is the face a card has always had.
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

/** One stored result: the region content a run produced. */
const RESULT = { runId: 'run-1', skill: 'git-repo', executedAt: 1, stopReason: 'completed', structured: { html: '<p>v</p>' } }

/** A template whose region is the only part a run fills. */
const TEMPLATE = '<h1>Tasks</h1><!-- template-begin --><!-- template-end -->'

/**
 * Read what one body rendered into a shadow root.
 * @param container - the render container.
 * @returns the shadow root's text, or undefined when no shadow host rendered.
 */
function shadowText(container: HTMLElement): string | undefined {
  for (const element of container.querySelectorAll('div')) {
    if (element.shadowRoot !== null) return element.shadowRoot.textContent ?? ''
  }
  return undefined
}

describe('skill card body', () => {
  it('says it is loading while the configuration is read', () => {
    const { container } = render(<SkillCardBody view={view({ status: 'loading' })} t={t} />)
    expect(container.textContent).toContain('skillCardLoading')
  })

  it('asks for a template when none is stored', () => {
    const { container } = render(<SkillCardBody view={view()} t={t} />)
    expect(container.textContent).toContain('skillCardNoTemplateTitle')
  })

  it('says the card has not run yet', () => {
    const { container } = render(<SkillCardBody view={view({ template: TEMPLATE })} t={t} />)
    expect(container.textContent).toContain('skillCardNotRunTitle')
  })

  it('fills the template region once a result exists', () => {
    const { container } = render(
      <SkillCardBody
        view={view({ template: TEMPLATE, result: RESULT })}
        t={t}
      />,
    )
    expect(shadowText(container)).toBe('Tasksv')
  })

  it('reads as not run when a result carries no region content', () => {
    // A result stored before the region language existed carries named values instead
    // of HTML. Showing an empty frame would look like a run that returned nothing.
    const stale = { ...RESULT, structured: { a: 'v' } } as unknown as typeof RESULT
    const { container } = render(<SkillCardBody view={view({ template: TEMPLATE, result: stale })} t={t} />)
    expect(container.textContent).toContain('skillCardNotRunTitle')
  })

  it('names the run when its record has no content because the run failed', () => {
    // The bug this covers: a stopped run's record carries no region, so the panel said
    // 尚未运行 — "not run yet" — directly above a trace of that run's thirteen steps. A
    // record with a verdict is a run that happened, and the panel owes the reader the
    // verdict.
    const failed = {
      ...RESULT,
      stopReason: 'aborted',
      structured: undefined,
      failure: 'the skill run timed out after 10 minutes',
      failureCode: 'run-timeout',
    } as unknown as typeof RESULT
    const { container } = render(<SkillCardBody view={view({ template: TEMPLATE, result: failed })} t={t} />)
    expect(container.textContent).toContain('skillCardResultTimeoutTitle')
    expect(container.textContent).not.toContain('skillCardNotRunTitle')
    // The reason travels too: the heading says what happened, the line says why.
    expect(container.textContent).toContain('the skill run timed out after 10 minutes')
  })

  it('leaves the heading at failure when the run faulted rather than timed out', () => {
    const failed = {
      ...RESULT,
      stopReason: 'error',
      structured: undefined,
      failure: 'the child answered without reporting a structured result',
      failureCode: 'run-failed',
    } as unknown as typeof RESULT
    const { container } = render(<SkillCardBody view={view({ template: TEMPLATE, result: failed })} t={t} />)
    expect(container.textContent).toContain('skillCardResultFailedTitle')
  })

  it('leaves the permission note to the page that owns it', () => {
    // The note states the mode this card's runs use, so it is a footnote beneath the result
    // page's content rather than part of the document this body renders. The page spec pins
    // it in every state.
    const { container } = render(<SkillCardBody view={view({ template: TEMPLATE, result: RESULT })} t={t} />)
    expect(container.textContent).not.toContain('skillCardRunsWithPermission')
  })

  it('keeps a record a history row opened as the subject while another run is in flight', () => {
    // The card is busy with its own run, but the view names a settled record from the
    // history: the record is what the page shows, and the run above is not it. Showing the
    // run here is the exact defect "I opened a completed run but saw the running one".
    const running = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: 2,
      retried: false,
    } as const
    const { container } = render(
      <SkillCardBody
        view={view({
          template: TEMPLATE,
          result: RESULT,
          run: running,
          runId: 'run-1',
        })}
        t={t}
      />,
    )
    expect(shadowText(container)).toBe('Tasksv')
    expect(container.querySelector('[data-run-stream]')).toBeNull()
  })

  it('still shows the run in flight when the row opened is that run', () => {
    // Opening the running row by its own id is the way to watch it: no stored record exists
    // yet, so the run is the subject and the notice is the view.
    const startedAt = 2
    const running = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt,
      retried: false,
    } as const
    const { container } = render(
      <SkillCardBody
        view={view({
          template: TEMPLATE,
          run: running,
          runId: String(startedAt),
        })}
        t={t}
      />,
    )
    expect(container.querySelector('[data-run-stream]')).not.toBeNull()
  })
})
