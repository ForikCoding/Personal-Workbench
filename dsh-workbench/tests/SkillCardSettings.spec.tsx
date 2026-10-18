/** @vitest-environment jsdom */
/** What the card editor offers, refuses, and previews. */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { SkillCardSettings } from '../src/client/skill-card/SkillCardSettings.tsx'
import type { WorkbenchCardView } from '../src/client/skill-card/controller.ts'
import { zh } from '../src/client/locales.ts'
import { WORKBENCH_TEMPLATE_MAX_BYTES } from '../src/skill-card-contract.ts'
import type { WorkbenchLocaleKey } from '../src/client/locales.ts'

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
 * Translator backed by the Chinese dictionary, so a spec reads the sentence the user
 * actually sees instead of the key that produced it.
 * @param key - dictionary key.
 * @param params - placeholder values.
 * @returns the interpolated Chinese text.
 */
const zhT = (key: WorkbenchLocaleKey, params?: Record<string, unknown>): string =>
  Object.entries(params ?? {}).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    zh[key],
  )

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
    cardTitles: [],
    refinements: [],
    previous: undefined,
    ...overrides,
  }
}

/**
 * Render the editor.
 * @param overrides - fields the case varies.
 * @param translator - how to translate; the key echo by default.
 * @returns the render result plus the four callbacks.
 */
function setup(
  overrides: Partial<WorkbenchCardView> = {},
  translator: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string = t,
): {
  container: HTMLElement
  onSave: ReturnType<typeof vi.fn>
  onChoose: ReturnType<typeof vi.fn>
  onRename: ReturnType<typeof vi.fn>
  onClose: ReturnType<typeof vi.fn>
  onDelete: ReturnType<typeof vi.fn>
} {
  const onSave = vi.fn()
  const onChoose = vi.fn()
  const onRename = vi.fn()
  const onClose = vi.fn()
  const onDelete = vi.fn()
  const { container } = render(
    <SkillCardSettings
      view={view(overrides)}
      t={translator}
      onSave={onSave}
      onChoose={onChoose}
      onRename={onRename}
      onClose={onClose}
      onDelete={onDelete}
    />,
  )
  return { container, onSave, onChoose, onRename, onClose, onDelete }
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

  it('saves a template that declares a region, carrying the name with it', () => {
    // The name travels with the template because 保存 is the one action the user takes:
    // persisting it through a separate blur write lost it whenever the revision moved
    // between the two.
    const { onSave } = setup({ skill: 'git-repo', template: REGION })
    fireEvent.click(screen.getByRole('button', { name: 'skillCardSave' }))
    expect(onSave).toHaveBeenCalledWith(REGION, '')
  })

  it('sends the name the editor shows, not the stored one', () => {
    const { onSave } = setup({ skill: 'git-repo', template: REGION, name: '我的任务' })
    fireEvent.change(screen.getByPlaceholderText('skillCardNamePlaceholder'), { target: { value: '效能任务' } })
    fireEvent.click(screen.getByRole('button', { name: 'skillCardSave' }))
    expect(onSave).toHaveBeenCalledWith(REGION, '效能任务')
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

  it('indents with Tab instead of leaving the field', () => {
    const { container } = setup({ skill: 'git-repo', template: '<p>a</p>' })
    const field = container.querySelector('textarea') as HTMLTextAreaElement
    field.setSelectionRange(3, 3)
    // `fireEvent` answers false when the default was prevented, which is the whole
    // point: Tab must not move focus out of a document being written.
    expect(fireEvent.keyDown(field, { key: 'Tab' })).toBe(false)
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('<p>  a</p>')
  })

  it('removes one indent level with Shift+Tab', () => {
    const { container } = setup({ skill: 'git-repo', template: '<p>  a</p>' })
    const field = container.querySelector('textarea') as HTMLTextAreaElement
    // The caret sits after the two spaces and before the text they indent.
    field.setSelectionRange(5, 5)
    expect(fireEvent.keyDown(field, { key: 'Tab', shiftKey: true })).toBe(false)
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('<p>a</p>')
  })

  it('lets Tab leave once Escape has been pressed', () => {
    // Without this escape hatch the field would trap anyone navigating by keyboard.
    const { container } = setup({ skill: 'git-repo', template: '<p>a</p>' })
    const field = container.querySelector('textarea') as HTMLTextAreaElement
    field.setSelectionRange(3, 3)
    fireEvent.keyDown(field, { key: 'Escape' })
    expect(fireEvent.keyDown(field, { key: 'Tab' })).toBe(true)
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('<p>a</p>')
  })

  it('reports a failed catalog read', () => {
    const { container } = setup({ catalogStatus: 'failed' })
    expect(container.textContent).toContain('skillCardCatalogFailed')
  })

  describe('the status line', () => {
    /** A template with one region, one card target, and nothing else to report. */
    const CUED = [
      '<h1>Tasks</h1>',
      '<!-- template-begin -->',
      '<tr></tr>',
      '<!-- template-end -->',
      '<!-- dsh-actions',
      '  a: card "A"',
      '-->',
    ].join('\n')

    it('states the region lines, the action count, and the size in one line', () => {
      const { container } = setup({ skill: 'git-repo', template: CUED }, zhT)
      const status = container.querySelector('[data-template-status]') as HTMLElement
      expect(status.textContent).toContain('区间 2–4')
      expect(status.textContent).toContain('动作声明 1 条')
      // Bytes, not characters: the budget the Host enforces is a UTF-8 byte limit, so a
      // character count would report a Chinese document as fitting when it does not.
      const bytes = new TextEncoder().encode(CUED).length
      expect(status.textContent).toContain(`${String(bytes)} / 32,768 字节`)
    })

    it('keeps the unsaved marker in the same line', () => {
      const { container } = setup({ skill: 'git-repo', template: CUED }, zhT)
      fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, {
        target: { value: `${CUED}\n` },
      })
      expect(container.querySelector('[data-template-status]')?.textContent).toContain('有未保存的改动')
    })

    it('turns the count into a warning above 85% of the budget', () => {
      // Above this the document is close enough to the limit that the number is the
      // fact worth looking at.
      const near = `<!-- template-begin -->${'x'.repeat(Math.ceil(32_768 * 0.85))}<!-- template-end -->`
      const { container } = setup({ skill: 'git-repo', template: near }, zhT)
      const status = container.querySelector('[data-template-status]') as HTMLElement
      expect(status.querySelector('.editorStatusWarn')?.textContent).toContain('字节')
    })

    it('warns on bytes, so a multi-byte document is warned before the Host refuses it', () => {
      // Two thousand Chinese characters are about six thousand bytes: comfortably inside
      // a character-based budget and comfortably over a byte-based one only when read
      // in the units the limit is actually expressed in.
      const cjk = `<!-- template-begin -->${'任'.repeat(9_500)}<!-- template-end -->`
      const bytes = new TextEncoder().encode(cjk).length
      expect(bytes).toBeGreaterThan(WORKBENCH_TEMPLATE_MAX_BYTES * 0.85)
      expect(Array.from(cjk).length).toBeLessThan(WORKBENCH_TEMPLATE_MAX_BYTES * 0.85)
      const { container } = setup({ skill: 'git-repo', template: cjk }, zhT)
      const status = container.querySelector('[data-template-status]') as HTMLElement
      expect(status.querySelector('.editorStatusWarn')).not.toBeNull()
    })

    it('leaves the count alone below that line', () => {
      const { container } = setup({ skill: 'git-repo', template: CUED }, zhT)
      const status = container.querySelector('[data-template-status]') as HTMLElement
      expect(status.querySelector('.editorStatusWarn')).toBeNull()
    })

    it('switches panes with the tabs, which the wide layout hides', () => {
      // Writing and previewing are one task seen twice: wide enough both are visible and
      // the tabs are pointless, narrower the tabs decide which one is on screen. jsdom
      // computes no media queries, so the state the CSS keys on is what is asserted.
      const { container } = setup({ skill: 'git-repo', template: CUED }, zhT)
      const panes = container.querySelector('.panes') as HTMLElement
      expect(panes.getAttribute('data-pane')).toBe('edit')
      const tabs = [...container.querySelectorAll('[role="tab"]')]
      expect(tabs).toHaveLength(2)
      expect(tabs[0]?.getAttribute('aria-selected')).toBe('true')
      fireEvent.click(tabs[1] as HTMLElement)
      expect(panes.getAttribute('data-pane')).toBe('preview')
      expect(tabs[1]?.getAttribute('aria-selected')).toBe('true')
      expect(tabs[0]?.getAttribute('aria-selected')).toBe('false')
    })

    it('warns instead of naming lines when the region is missing', () => {
      const { container } = setup({ skill: 'git-repo', template: '<p>a</p>' }, zhT)
      const status = container.querySelector('[data-template-status]') as HTMLElement
      expect(status.className).toContain('editorStatusMissing')
      expect(status.textContent).toContain('区间缺失')
    })

    it('writes the marker pair at the caret and leaves the caret between them', async () => {
      const { container } = setup({ skill: 'git-repo', template: '<p>a</p>' }, zhT)
      const field = container.querySelector('textarea') as HTMLTextAreaElement
      field.setSelectionRange(8, 8)
      fireEvent.click(screen.getByRole('button', { name: '插入标记' }))
      await Promise.resolve()
      const next = container.querySelector('textarea') as HTMLTextAreaElement
      expect(next.value).toBe('<p>a</p>\n<!-- template-begin -->\n\n<!-- template-end -->')
      const caret = next.value.indexOf('<!-- template-begin -->') + '<!-- template-begin -->'.length + 1
      expect([next.selectionStart, next.selectionEnd]).toEqual([caret, caret])
      // The region exists now, so the control that wrote it is gone and the line names
      // the markers' own lines.
      expect(screen.queryByRole('button', { name: '插入标记' })).toBeNull()
      expect(container.querySelector('[data-template-status]')?.textContent).toContain('区间 2–4')
    })
  })

  describe('the gutter', () => {
    it('marks the region lines and the action block separately', () => {
      const template = [
        '<h1>Tasks</h1>',
        '<!-- dsh-actions',
        '  a: card "A"',
        '-->',
        '<!-- template-begin -->',
        '<tr></tr>',
        '<!-- template-end -->',
      ].join('\n')
      const { container } = setup({ skill: 'git-repo', template })
      const gutter = container.querySelector('pre') as HTMLPreElement
      const lines = [...gutter.querySelectorAll('button')]
      // Nothing but the numbered lines: a stray whitespace text node would add a line
      // box of its own and push every number below it off the text it labels.
      expect(gutter.childNodes).toHaveLength(lines.length)
      expect(lines.map(line => line.className.includes('gutterLineRegion'))).toEqual([
        false, false, false, false, true, true, true,
      ])
      expect(lines.map(line => line.className.includes('gutterLineActions'))).toEqual([
        false, true, true, true, false, false, false,
      ])
    })

    it('selects a line when its number is clicked', () => {
      const template = ['<h1>Tasks</h1>', '<!-- template-begin -->', '<p>a</p>', '<!-- template-end -->'].join('\n')
      const { container } = setup({ skill: 'git-repo', template })
      const gutter = container.querySelector('pre') as HTMLPreElement
      const third = gutter.querySelectorAll('button')[2] as HTMLButtonElement
      fireEvent.click(third)
      const field = container.querySelector('textarea') as HTMLTextAreaElement
      expect(field.value.slice(field.selectionStart, field.selectionEnd)).toBe('<p>a</p>')
      expect(document.activeElement).toBe(field)
    })
  })

  describe('violations as jump targets', () => {
    it('selects the construct a violation points at', () => {
      const template = ['<h1>T</h1>', '<!-- template-begin -->', '<p>{{branch}}</p>', '<!-- template-end -->']
        .join('\n')
      const { container } = setup({ skill: 'git-repo', template })
      fireEvent.click(screen.getByRole('button', { name: /skillCardViolationPlaceholder/u }))
      const field = container.querySelector('textarea') as HTMLTextAreaElement
      const offset = template.indexOf('{{branch}}')
      expect([field.selectionStart, field.selectionEnd]).toEqual([offset, offset + '{{branch}}'.length])
      expect(document.activeElement).toBe(field)
    })

    it('leaves a violation with no position as plain text', () => {
      // A missing region has no marker to point at, so there is nothing to select and
      // no button that would pretend otherwise.
      const { container } = setup({ skill: 'git-repo', template: '<p>a</p>' })
      expect(container.querySelector('ul')?.querySelectorAll('button').length).toBe(0)
    })
  })

  describe('Ctrl/Cmd+S', () => {
    it('saves and suppresses the browser’s own save', () => {
      const { container, onSave } = setup({ skill: 'git-repo', template: REGION })
      const field = container.querySelector('textarea') as HTMLTextAreaElement
      // `fireEvent` answers false when the default was prevented: without that the
      // shell's own "save page" dialog would open over the editor.
      expect(fireEvent.keyDown(field, { key: 's', ctrlKey: true })).toBe(false)
      expect(onSave).toHaveBeenCalledWith(REGION, '')
      expect(fireEvent.keyDown(field, { key: 's', metaKey: true })).toBe(false)
      expect(onSave).toHaveBeenCalledTimes(2)
    })

    it('does not save when nothing is saveable', () => {
      // No skill chosen is the same gate that disables the button; the shortcut must
      // not be a second route into the store.
      const { container, onSave } = setup({ template: REGION })
      const field = container.querySelector('textarea') as HTMLTextAreaElement
      expect(fireEvent.keyDown(field, { key: 's', ctrlKey: true })).toBe(false)
      expect(onSave).not.toHaveBeenCalled()
    })
  })
})

/** A template with one card target already declared, inside and outside the region. */
const DECLARED = [
  '<h1>Tasks</h1>',
  '<!-- dsh-actions',
  '  a: card "A"',
  '-->',
  '<!-- template-begin -->',
  '<tr></tr>',
  '<!-- template-end -->',
].join('\n')

/** A template whose region is the only thing it declares. */
const REGION_ONLY = ['<h1>Tasks</h1>', '<!-- template-begin -->', '<!-- template-end -->'].join('\n')

/** One invocable skill, so the editor has something to pick. */
const CATALOG = [{ name: 'git-repo', description: 'a', userInvocable: true }]

describe('the action declaration builder', () => {
  /**
   * Open the builder and take hold of its fields.
   * @param overrides - view fields the case varies.
   * @returns the render result plus the three fields and the confirm button.
   */
  function openBuilder(overrides: Partial<WorkbenchCardView> = {}): {
    container: HTMLElement
    keyField: HTMLInputElement
    kindField: HTMLSelectElement
    targetField: HTMLSelectElement
    confirm: HTMLElement
  } {
    const { container } = setup({
      skill: 'git-repo',
      template: DECLARED,
      cardTitles: ['A'],
      catalog: CATALOG,
      ...overrides,
    }, zhT)
    fireEvent.click(screen.getByRole('button', { name: '添加动作' }))
    return {
      container,
      keyField: screen.getByLabelText('动作键') as HTMLInputElement,
      kindField: screen.getByLabelText('类型') as HTMLSelectElement,
      targetField: screen.getByLabelText('目标') as HTMLSelectElement,
      confirm: screen.getByRole('button', { name: '确认' }),
    }
  }

  it('validates the key against the contract pattern before writing', () => {
    // The block is the one place a user types exact syntax, and a wrong key only fails
    // at click time — so it is refused here instead.
    const { container, keyField, confirm } = openBuilder()
    expect(confirm).toHaveProperty('disabled', true)
    fireEvent.change(keyField, { target: { value: 'not a key' } })
    expect(confirm).toHaveProperty('disabled', true)
    expect(container.querySelector('[data-action-key-caption]')?.textContent)
      .toBe(zh.skillCardViolationActionKey)
    fireEvent.change(keyField, { target: { value: 'finish' } })
    expect(confirm).toHaveProperty('disabled', false)
    expect(container.querySelector('[data-action-key-caption]')?.textContent)
      .toBe(zh.skillCardActionKeyHint)
  })

  it('refuses a key the template already declares instead of duplicating it', () => {
    // The analyser reports `action-key-repeated`; the panel must not be a way to
    // reach that report.
    const { container, keyField, confirm } = openBuilder()
    fireEvent.change(keyField, { target: { value: 'a' } })
    expect(confirm).toHaveProperty('disabled', true)
    expect(container.querySelector('[data-action-key-caption]')?.textContent)
      .toBe(zh.skillCardActionKeyTaken)
    fireEvent.click(confirm)
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe(DECLARED)
  })

  it('appends the line before the closing delimiter, disturbing no other line', () => {
    const { container, keyField, confirm } = openBuilder()
    fireEvent.change(keyField, { target: { value: 'b' } })
    fireEvent.click(confirm)
    const field = container.querySelector('textarea') as HTMLTextAreaElement
    expect(field.value).toBe([
      '<h1>Tasks</h1>',
      '<!-- dsh-actions',
      '  a: card "A"',
      '  b: card "A"',
      '-->',
      '<!-- template-begin -->',
      '<tr></tr>',
      '<!-- template-end -->',
    ].join('\n'))
    // Written to be valid, so the document keeps analyzing clean and counts the pair.
    expect(container.querySelectorAll('ul')).toHaveLength(0)
    expect(container.querySelector('[data-template-status]')?.textContent).toContain('动作声明 2 条')
    // The panel closed only because the line was written.
    expect(screen.queryByLabelText('动作键')).toBeNull()
  })

  it('creates the whole block when the template has none, outside the region', () => {
    const { container, keyField, confirm } = openBuilder({ template: REGION_ONLY })
    fireEvent.change(keyField, { target: { value: 'a' } })
    fireEvent.click(confirm)
    const field = container.querySelector('textarea') as HTMLTextAreaElement
    expect(field.value).toBe([
      '<h1>Tasks</h1>',
      '<!-- dsh-actions',
      '  a: card "A"',
      '-->',
      '<!-- template-begin -->',
      '<!-- template-end -->',
    ].join('\n'))
    // A declaration written inside the region would be erased by the first run.
    expect(container.querySelectorAll('ul')).toHaveLength(0)
    expect(container.querySelector('[data-template-status]')?.textContent).toContain('动作声明 1 条')
  })

  it('offers the stored cards for a card target and the invocable skills for a skill', () => {
    const { targetField, kindField } = openBuilder({ catalog: [
      ...CATALOG,
      { name: 'hidden', description: 'b', userInvocable: false },
    ] })
    expect([...targetField.querySelectorAll('option')].map(option => option.getAttribute('value')))
      .toEqual(['A'])
    fireEvent.change(kindField, { target: { value: 'skill' } })
    expect([...(screen.getByLabelText('目标') as HTMLSelectElement).querySelectorAll('option')]
      .map(option => option.getAttribute('value'))).toEqual(['git-repo'])
  })

  it('says why nothing can be confirmed when the chosen list is empty', () => {
    const { targetField } = openBuilder({ cardTitles: [] })
    expect(targetField).toHaveProperty('disabled', false)
    expect(screen.getByRole('button', { name: '确认' })).toHaveProperty('disabled', true)
    expect(screen.getByText(zh.skillCardActionNoCards)).toBeTruthy()
  })

  it('pairs its three labels with their controls', () => {
    const { container } = openBuilder()
    for (const name of ['动作键', '类型', '目标']) {
      const label = [...container.querySelectorAll('label')].find(entry => entry.textContent === name)
      const field = screen.getByLabelText(name)
      expect(label?.getAttribute('for')).toBe(field.id)
      expect(field.id).not.toBe('')
    }
  })
})

describe('a declared target that no longer exists', () => {
  /**
   * Declare one target of one kind.
   * @param line - the declaration line.
   * @returns the template.
   */
  function declaring(line: string): string {
    return [
      '<h1>Tasks</h1>',
      '<!-- dsh-actions',
      `  ${line}`,
      '-->',
      '<!-- template-begin -->',
      '<!-- template-end -->',
    ].join('\n')
  }

  it('reports a card target no stored card answers to, and still saves', () => {
    // The card this names may be created later, so this is a warning about the
    // declaration, not a refusal of the document.
    const { container } = setup({ skill: 'git-repo', template: declaring('a: card "Gone"'), cardTitles: ['A'] }, zhT)
    const warnings = container.querySelector('[data-action-target-warnings]') as HTMLElement
    expect(warnings.textContent).toContain('动作 a 指向的卡片不存在：Gone')
    expect(screen.getByRole('button', { name: '保存' })).toHaveProperty('disabled', false)
  })

  it('reports a skill target the catalog does not hold', () => {
    const { container } = setup({
      skill: 'git-repo',
      template: declaring('a: skill "gone-skill"'),
      catalog: CATALOG,
    }, zhT)
    const warnings = container.querySelector('[data-action-target-warnings]') as HTMLElement
    expect(warnings.textContent).toContain('动作 a 指向的 skill 不存在或不能被调用：gone-skill')
    expect(screen.getByRole('button', { name: '保存' })).toHaveProperty('disabled', false)
  })

  it('says nothing about a target that is there', () => {
    const { container } = setup({
      skill: 'git-repo',
      template: declaring('a: card "A"'),
      cardTitles: ['A'],
      catalog: CATALOG,
    }, zhT)
    expect(container.querySelector('[data-action-target-warnings]')).toBeNull()
  })

  it('says nothing while the catalog could not be read', () => {
    // A list that could not be read cannot declare a skill absent, and an unread
    // configuration would call every card missing.
    const { container } = setup({
      skill: 'git-repo',
      template: declaring('a: skill "anything"'),
      catalogStatus: 'failed',
    }, zhT)
    expect(container.querySelector('[data-action-target-warnings]')).toBeNull()
  })
})

describe('the skeleton', () => {
  it('writes a starter document that analyzes clean', () => {
    // A starter that opens on a validation error is worse than an empty box.
    const { container } = setup({ skill: 'git-repo', template: '' }, zhT)
    expect(screen.queryByRole('button', { name: '插入标记' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '插入骨架' }))
    const value = (container.querySelector('textarea') as HTMLTextAreaElement).value
    for (const part of [
      '<!DOCTYPE html>',
      '<style>',
      '<!-- dsh-actions -->',
      '<!-- template-begin -->',
      '<!-- template-end -->',
      'data-dsh-action="finish"',
      "data-dsh-row='{",
      '&#39;',
    ]) {
      expect(value).toContain(part)
    }
    expect(container.querySelectorAll('ul')).toHaveLength(0)
    expect(container.querySelector('[data-template-status]')?.textContent).toContain('区间')
    expect(screen.getByRole('button', { name: '保存' })).toHaveProperty('disabled', false)
  })
})

describe('removing the card', () => {
  it('takes two presses, and says so in between', () => {
    const { onDelete } = setup({ skill: 'git-repo', template: REGION }, zhT)
    fireEvent.click(screen.getByRole('button', { name: '删除卡片' }))
    expect(onDelete).not.toHaveBeenCalled()
    // The armed state is announced, not only drawn.
    expect(document.querySelector('[aria-live="polite"]')?.textContent)
      .toContain(zh.skillCardDeleteConfirmPrompt)
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('is cancelled by Escape, without deleting', () => {
    const { onDelete } = setup({ skill: 'git-repo', template: REGION }, zhT)
    fireEvent.click(screen.getByRole('button', { name: '删除卡片' }))
    fireEvent.keyDown(screen.getByRole('button', { name: '确认删除' }), { key: 'Escape' })
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: '确认删除' })).toBeNull()
    expect(screen.getByRole('button', { name: '删除卡片' })).toBeTruthy()
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('')
  })

  it('is cancelled by 取消, without deleting', () => {
    const { onDelete } = setup({ skill: 'git-repo', template: REGION }, zhT)
    fireEvent.click(screen.getByRole('button', { name: '删除卡片' }))
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: '确认删除' })).toBeNull()
  })
})

describe('a write that failed', () => {
  it('is stated beside the footer as an alert', () => {
    // The page used to render no failure at all, which is why a dropped write looked
    // like a stored one.
    setup({
      skill: 'git-repo',
      template: REGION,
      problem: { code: 'unavailable', detail: 'the store is read-only' },
    }, zhT)
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain(zh.skillCardProblemUnavailable)
    expect(alert.textContent).toContain('the store is read-only')
  })
})

describe('the page groups', () => {
  it('heads the card’s facts, the template, and the preview', () => {
    const { container } = setup({ skill: 'git-repo', template: REGION }, zhT)
    expect([...container.querySelectorAll('h2')].map(heading => heading.textContent))
      .toEqual([zh.skillCardSectionBasics, zh.skillCardTemplateLabel, zh.skillCardPreview])
    // The preview states which data it is showing on its own surface.
    expect(container.textContent).toContain(zh.skillCardPreviewSample)
  })

  it('pairs every label with its control', () => {
    setup({ skill: 'git-repo', template: REGION }, zhT)
    for (const name of [zh.skillCardCardName, zh.skillCardSelectSkill]) {
      const label = screen.getByText(name)
      const control = screen.getByLabelText(name)
      expect(label.tagName).toBe('LABEL')
      expect(label.getAttribute('for')).toBe(control.id)
      expect(control.id).not.toBe('')
    }
    // The template field is named by its own label attribute: the group heading is a
    // heading, and a second visible label over a code field is noise.
    expect(screen.getByRole('textbox', { name: zh.skillCardTemplateLabel }).tagName).toBe('TEXTAREA')
  })
})

