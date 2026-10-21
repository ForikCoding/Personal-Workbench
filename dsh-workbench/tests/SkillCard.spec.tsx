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
    // The face renders neither the model field nor a run control; the body cases below are
    // about the content, so the card is stated without a route.
    modelField: { kind: 'unavailable', catalog: { status: 'none' } },
    // Same for the directory: the face shows no workspace field, and nothing on the grid
    // gates a run on one.
    workspaceField: { kind: 'missing' },
    // The mode is on the view (the result page states it), but the body renders only the
    // document, so the face's cases never read it.
    permission: 'workspace-write',
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
const RESULT = { skill: 'git-repo', executedAt: 1, stopReason: 'completed', structured: { html: '<p>v</p>' } }

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

  it('leaves the permission note to the page that owns it', () => {
    // The note states the mode this card's runs use, so it is a footnote beneath the result
    // page's content rather than part of the document this body renders. The page spec pins
    // it in every state.
    const { container } = render(<SkillCardBody view={view({ template: TEMPLATE, result: RESULT })} t={t} />)
    expect(container.textContent).not.toContain('skillCardRunsWithPermission')
  })
})
