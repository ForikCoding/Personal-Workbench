/** @vitest-environment jsdom */
/** What the skill card body shows in each state. */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import {
  RunProblemLines,
  SkillCardBody,
  cardFaceStanding,
  runProblemOf,
  runProblemsOf,
} from '../src/client/skill-card/SkillCard.tsx'
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

/** One stored result: the region content a run produced. */
const RESULT = { runId: 'run-1', skill: 'git-repo', executedAt: 1, stopReason: 'completed', structured: { html: '<p>v</p>' } }

/** A template whose region is the only part a run fills. */
const TEMPLATE = '<h1>Tasks</h1><!-- template-begin --><!-- template-end -->'

describe('why the run control is closed', () => {
  /** A card that can run: a route stored and a directory the Host confirmed. */
  const ok = {
    modelField: { kind: 'fixed', model: { provider: 'lightcode', model: 'GLM-FLASH-LATEST' } },
    workspaceField: { kind: 'ready', path: 'D:\\repo', leaf: 'repo' },
  } as const

  it('names nothing for a card that can run', () => {
    expect(runProblemsOf(view(ok))).toEqual([])
    expect(runProblemOf(view(ok))).toBeUndefined()
  })

  it('names the directory that is gone, with the path, before anything broader', () => {
    // The card was copied from a machine where that folder existed. The face gets one line,
    // and "no model is available" would send its reader to the wrong setting.
    const problems = runProblemsOf(view({
      modelField: { kind: 'unavailable' },
      workspaceField: { kind: 'invalid', path: 'D:\\Git\\deepseek-harness', leaf: 'deepseek-harness', checked: true },
    }))
    expect(problems).toEqual([
      { code: 'workspace-invalid', detail: 'D:\\Git\\deepseek-harness' },
      { code: 'model-unavailable' },
    ])
    expect(runProblemOf(view({
      modelField: { kind: 'unavailable' },
      workspaceField: { kind: 'invalid', path: 'D:\\Git\\deepseek-harness', leaf: 'deepseek-harness', checked: true },
    }))).toEqual({ code: 'workspace-invalid', detail: 'D:\\Git\\deepseek-harness' })
  })

  it('stays quiet about a directory whose check has not answered yet', () => {
    // One frame of "that folder is missing" on every page load would be a lie, and the
    // control is closed for that frame anyway.
    expect(runProblemsOf(view({
      modelField: ok.modelField,
      workspaceField: { kind: 'invalid', path: 'D:\\repo', leaf: 'repo', checked: false },
    }))).toEqual([])
  })

  it('names a missing workspace, and a harness with no run seam, in that order', () => {
    const problems = runProblemsOf(view({
      modelField: ok.modelField,
      workspaceField: { kind: 'missing' },
      runUnavailable: { code: 'run-unavailable' },
    }))
    expect(problems.map(problem => problem.code)).toEqual(['workspace-missing', 'run-unavailable'])
  })

  it('renders one sentence per reason, each under the control it closes', () => {
    const { container } = render(
      <RunProblemLines
        view={view({
          modelField: { kind: 'unavailable' },
          workspaceField: { kind: 'invalid', path: 'D:\\repo', leaf: 'repo', checked: true },
          runUnavailable: { code: 'run-unavailable' },
        })}
        t={t}
      />,
    )
    const codes = [...container.querySelectorAll('[data-run-workspace-invalid], [data-run-model-unavailable], [data-run-unavailable]')]
      .map(element => element.getAttributeNames().find(name => name.startsWith('data-run-')))
    expect(codes).toEqual(['data-run-workspace-invalid', 'data-run-model-unavailable', 'data-run-unavailable'])
    // The directory's sentence carries the path: the reason a user can act on is which one.
    expect(container.querySelector('[data-run-workspace-invalid]')?.textContent).toContain('D:\\repo')
  })
})

describe('card face standing', () => {
  it('reads as idle until the card has run', () => {
    expect(cardFaceStanding(view())).toBe('idle')
  })

  it('reads a run in flight before it reads the last record', () => {
    // The card is working; what it stored last says nothing about that.
    expect(cardFaceStanding(view({
      run: { cardId: 'skill-card', phase: 'running', startedAt: 1, retried: false },
      runs: [RESULT],
    }))).toBe('ongoing')
  })

  it('reads a settled run by its own verdict', () => {
    expect(cardFaceStanding(view({ runs: [RESULT] }))).toBe('done')
    // A run that stored no content failed, whichever way the child stopped: the record
    // now carries the verdict, and the dot is what says so at a glance.
    expect(cardFaceStanding(view({
      runs: [{ ...RESULT, structured: undefined, failure: 'timed out', failureCode: 'run-timeout' }],
    }))).toBe('error')
  })
})

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

  it('does not restate the card’s permission mode on its face', () => {
    // The mode is a field of the card's configuration, and the face is a title, a summary
    // and a control: a sentence about permissions here would push the summary out.
    const { container } = render(<SkillCardBody view={view({ template: TEMPLATE, result: RESULT })} t={t} />)
    expect(container.textContent).not.toContain('运行时权限')
    expect(container.textContent).not.toContain('Runs with')
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
