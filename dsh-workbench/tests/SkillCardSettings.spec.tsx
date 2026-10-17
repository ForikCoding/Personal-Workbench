/** @vitest-environment jsdom */
/** What the card editor offers, refuses, and previews. */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { SkillCardSettings } from '../src/client/skill-card/SkillCardSettings.tsx'
import type { WorkbenchCardView } from '../src/client/skill-card/controller.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

// Vitest runs without globals, so the library's own auto-cleanup never registers.
afterEach(cleanup)

/**
 * Translator that echoes the key, so a spec asserts which key was chosen.
 * @param key - dictionary key.
 * @returns the key.
 */
const t = (key: string): string => key

/**
 * Build a card view for the editor.
 * @param overrides - fields the case varies.
 * @returns the view.
 */
function view(overrides: Partial<WorkbenchCardView> = {}): WorkbenchCardView {
  return {
    status: 'ready',
    runnable: false,
    catalog: [],
    catalogStatus: 'ready',
    catalogFailure: undefined,
    ...overrides,
  }
}

/**
 * Render the editor.
 * @param overrides - fields the case varies.
 * @returns the render result plus the three callbacks.
 */
function setup(overrides: Partial<WorkbenchCardView> = {}): {
  container: HTMLElement
  onSave: ReturnType<typeof vi.fn>
  onChoose: ReturnType<typeof vi.fn>
  onRename: ReturnType<typeof vi.fn>
  onClose: ReturnType<typeof vi.fn>
} {
  const onSave = vi.fn()
  const onChoose = vi.fn()
  const onRename = vi.fn()
  const onClose = vi.fn()
  const { container } = render(
    <SkillCardSettings
      view={view(overrides)}
      t={t}
      onSave={onSave}
      onChoose={onChoose}
      onRename={onRename}
      onClose={onClose}
    />,
  )
  return { container, onSave, onChoose, onRename, onClose }
}

/** A template that declares the one region a run fills. */
const REGION = '<h1>Tasks</h1><!-- template-begin --><!-- template-end -->'

describe('skill card editor', () => {
  it('offers only the skills a human may invoke', () => {
    const { container } = setup({
      skill: 'git-repo',
      catalog: [
        { name: 'git-repo', description: 'a', userInvocable: true },
        { name: 'hidden', description: 'b', userInvocable: false },
      ],
    })
    const values = [...container.querySelectorAll('option')].map(option => option.getAttribute('value'))
    expect(values).toEqual(['', 'git-repo'])
  })

  it('names the card, committing on blur and on Enter rather than per keystroke', () => {
    const { container, onRename } = setup({ skill: 'git-repo', name: 'Old' })
    const field = container.querySelector('input') as HTMLInputElement
    expect(field.value).toBe('Old')
    fireEvent.change(field, { target: { value: 'Repo overview' } })
    // A rename is one stored write, so typing must not issue one write per character.
    expect(onRename).not.toHaveBeenCalled()
    fireEvent.blur(field)
    expect(onRename).toHaveBeenCalledWith('Repo overview')
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledTimes(2)
  })

  it('reports a skill selection', () => {
    const { container, onChoose } = setup({
      skill: 'git-repo',
      catalog: [{ name: 'git-repo', description: 'a', userInvocable: true }],
    })
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'git-repo' } })
    expect(onChoose).toHaveBeenCalledWith('git-repo')
  })

  it('says so when the catalog holds nothing invocable', () => {
    const { container } = setup({ catalogStatus: 'ready', catalog: [] })
    expect(container.textContent).toContain('skillCardCatalogEmpty')
  })

  it('names the missing live session when the catalog cannot be read', () => {
    // The catalog needs a live agent for the skill scope, so the picker has to
    // name that reason instead of leaving a disabled control to diagnose.
    const { container } = setup({ catalogStatus: 'failed', catalogFailure: 'session-not-live' })
    expect(container.textContent).toContain('skillCardNoSession')
    expect(container.querySelector('select')).toHaveProperty('disabled', true)
  })

  it('reports any other catalog failure without blaming the session', () => {
    const { container } = setup({ catalogStatus: 'failed', catalogFailure: 'catalog-failed' })
    expect(container.textContent).toContain('skillCardCatalogFailed')
  })

  it('refuses a template and points at the construct', () => {
    const { container, onSave } = setup({ skill: 'git-repo', template: '<script>alert(1)</script>' })
    expect(container.textContent).toContain('skillCardViolationScript')
    expect(container.textContent).toContain('root > script')
    const save = screen.getByRole('button', { name: 'skillCardSave' })
    expect(save).toHaveProperty('disabled', true)
    fireEvent.click(save)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('refuses a template whose region markers do not pair', () => {
    const { container, onSave } = setup({ skill: 'git-repo', template: '<p>a</p><!-- template-begin -->' })
    expect(container.textContent).toContain('skillCardViolationRegionUnclosed')
    const save = screen.getByRole('button', { name: 'skillCardSave' })
    expect(save).toHaveProperty('disabled', true)
    fireEvent.click(save)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('refuses the placeholder language that was removed', () => {
    // Rendering the braces instead would read as "my template works" until the card
    // showed literal `{{branch}}` text.
    const { container } = setup({ skill: 'git-repo', template: '<p>{{branch}}</p>' })
    expect(container.textContent).toContain('skillCardViolationPlaceholder')
  })

  it('saves a template that declares a region', () => {
    const { onSave } = setup({ skill: 'git-repo', template: REGION })
    fireEvent.click(screen.getByRole('button', { name: 'skillCardSave' }))
    expect(onSave).toHaveBeenCalledWith(REGION)
  })

  it('will not save before a skill is chosen', () => {
    const { onSave } = setup({ template: REGION })
    const save = screen.getByRole('button', { name: 'skillCardSave' })
    expect(save).toHaveProperty('disabled', true)
    fireEvent.click(save)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('previews the draft skeleton, since only a run fills the region', () => {
    const { container } = setup({ skill: 'git-repo', template: '<h1>Tasks</h1><!-- template-begin --><!-- template-end -->' })
    const host = [...container.querySelectorAll('div')].find(element => element.shadowRoot !== null)
    expect(host?.shadowRoot?.querySelector('h1')?.textContent).toBe('Tasks')
  })

  it('reports a failed catalog read', () => {
    const { container } = setup({ catalogStatus: 'failed' })
    expect(container.textContent).toContain('skillCardCatalogFailed')
  })
})
