/**
 * @vitest-environment jsdom
 *
 * Hand-editing a stored result on the result page.
 *
 * A run's output is not always right, and the fix is sometimes two characters rather than
 * another model call. What is under test here is the whole of that claim: when the editor
 * is offered, that it edits the stored fragment rather than the rendered document, what it
 * refuses, that saving replaces the card's stored result and leaving does not, that the
 * record says it was edited by hand, and that one step back still recovers the run's own
 * version.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { fakeModelSeat } from './support/fake-model-seat.ts'
import { zh } from '../src/client/locales.ts'
import type { WorkbenchLocaleKey } from '../src/client/locales.ts'
import { WORKBENCH_RESULT_MAX_BYTES } from '../src/skill-card-contract.ts'
import type {
  WorkbenchCardResult,
  WorkbenchRunRequest,
  WorkbenchRunState,
  WorkbenchSkillCatalogEntry,
} from '../src/skill-card-contract.ts'
import type { WorkbenchResultWrite, WorkbenchSkillCardApi } from '../src/client/skill-card/api.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

const { SkillCardResultPage } = await import('../src/client/skill-card/SkillCardPages.tsx')
type PageProps = import('../src/client/skill-card/SkillCardPages.tsx').SkillCardPageProps

// Vitest runs without globals, so the library's own auto-cleanup never registers.
afterEach(cleanup)

/**
 * Translate through the Chinese dictionary, interpolating placeholders.
 * @param key - dictionary key.
 * @param params - placeholder values.
 * @returns the sentence the user reads.
 */
const t = (key: WorkbenchLocaleKey, params?: Record<string, unknown>): string =>
  Object.entries(params ?? {}).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    zh[key],
  )

/** A template whose region is the only part a run fills. */
const TEMPLATE = '<h1>任务</h1><!-- template-begin --><!-- template-end -->'

/** The region HTML the card starts with: what the last run produced. */
const RUN_HTML = '<b>旧</b>\n<i>附注</i>'

/** A local wall-clock moment, so a formatted time is the same in any time zone. */
const RAN_AT = new Date(2024, 0, 2, 14, 28, 36).getTime()

/** When the hand edit was saved. */
const EDITED_AT = new Date(2024, 0, 3, 9, 15, 0).getTime()

/**
 * Build one stored result.
 * @param overrides - fields the case varies.
 * @returns the record storage returns.
 */
function stored(overrides: Partial<WorkbenchCardResult> = {}): WorkbenchCardResult {
  return {
    cardId: 'skill-card',
    skill: 'git-repo',
    executedAt: RAN_AT,
    stopReason: 'completed',
    structured: { html: RUN_HTML },
    ...overrides,
  }
}

/** What one fixture records about the interaction. */
interface Recorded {
  /** Every fragment the page asked to store, in order. */
  readonly saves: { readonly cardId: string; readonly html: string }[]
  /** Every write of any other kind, which an edit must never issue. */
  readonly writes: unknown[]
  /** Every run the page started. */
  readonly starts: WorkbenchRunRequest[]
}

/**
 * Build the page over one stored card.
 * @param options - the stored result (`null` for none), the save double, the run double,
 * and the catalog.
 * @returns the api, what it recorded, and the props.
 */
function fixture(options: {
  readonly result?: WorkbenchCardResult | null
  readonly save?: (cardId: string, html: string) => Promise<WorkbenchResultWrite>
  readonly start?: (request: WorkbenchRunRequest) => Promise<{ status: 'ok'; state: WorkbenchRunState }>
  readonly poll?: WorkbenchSkillCardApi['poll']
  readonly catalog?: readonly WorkbenchSkillCatalogEntry[]
  readonly template?: string
} = {}): { readonly api: WorkbenchSkillCardApi; readonly recorded: Recorded; readonly props: PageProps } {
  const result = options.result === null ? undefined : options.result ?? stored()
  const recorded: Recorded = { saves: [], writes: [], starts: [] }
  const api: WorkbenchSkillCardApi = {
    read: async () => ({
      status: 'ok',
      snapshot: {
        revision: '1:0',
        cards: [{
          cardId: 'skill-card',
          skill: 'git-repo',
          template: options.template ?? TEMPLATE,
          templateSkills: ['git-repo'],
        }],
        results: result === undefined ? [] : [result],
      },
    }),
    write: async (patch) => {
      recorded.writes.push(patch)
      return { status: 'failed', reason: 'no configuration write is expected here' }
    },
    catalog: async () => ({ status: 'ok', entries: options.catalog ?? [] }),
    poll: options.poll ?? (async () => ({ status: 'missing' })),
    start: async (request) => {
      recorded.starts.push(request)
      return options.start === undefined
        ? { status: 'unavailable', reason: 'no run is started here' }
        : await options.start(request)
    },
    cancel: async () => {},
    saveResult: async (cardId, html) => {
      recorded.saves.push({ cardId, html })
      if (options.save !== undefined) return await options.save(cardId, html)
      // The Host's own answer: the run's facts stay, the fragment is replaced, and the
      // record now says when it was edited.
      return {
        status: 'ok',
        revision: '1:1',
        result: {
          ...stored(),
          cardId,
          executedAt: EDITED_AT,
          editedAt: EDITED_AT,
          structured: { html },
        },
      }
    },
  }
  return {
    api,
    recorded,
    props: {
      api,
      cardId: 'skill-card',
      runSessionId: () => 'session-1',
      // A hand edit spends no model call, but the page still resolves its run control from
      // the model field: a known route keeps the states these cases assert reachable.
      models: fakeModelSeat(),
      fallbackTitle: '技能卡',
      onBack: () => {},
      openCard: () => {},
      t,
    },
  }
}

/**
 * Read what the card's shadow root currently shows.
 * @param container - the render container.
 * @returns the rendered document's text.
 */
function shadowText(container: HTMLElement): string {
  for (const element of container.querySelectorAll('div')) {
    if (element.shadowRoot !== null) return element.shadowRoot.textContent ?? ''
  }
  return ''
}

/**
 * Render the page and wait for the stored result to be on screen.
 * @param props - page props.
 * @param rendered - text the rendered document must show before the case continues.
 * @returns the render container.
 */
async function show(props: PageProps, rendered = '旧'): Promise<HTMLElement> {
  const { container } = render(<SkillCardResultPage {...props} />)
  await waitFor(() => { expect(shadowText(container)).toContain(rendered) })
  return container
}

/**
 * Open the editor and return its field.
 * @returns the textarea.
 */
function openEditor(): HTMLTextAreaElement {
  fireEvent.click(screen.getByRole('button', { name: zh.skillCardResultEdit }))
  return screen.getByRole('textbox', { name: zh.resultEditLabel }) as HTMLTextAreaElement
}

/**
 * Read the editor's own region of the page.
 * @param container - the render container.
 * @returns the editor element.
 */
function editorRoot(container: HTMLElement): HTMLElement {
  const root = container.querySelector('[data-result-editor]')
  expect(root).not.toBeNull()
  return root as HTMLElement
}

/** The save control inside the editor. */
function saveButton(): HTMLElement {
  return screen.getByRole('button', { name: zh.skillCardSave })
}

/** The cancel control inside the editor. */
function cancelButton(): HTMLElement {
  return screen.getByRole('button', { name: zh.actionCancel })
}

describe('offering the result editor', () => {
  it('offers 编辑 in the result head once a result exists', async () => {
    // Criterion 61. The control is offered by the page's own head, beside the run control,
    // and only when there is a result: nothing else on the page can start an edit.
    const { props } = fixture()
    await show(props)
    const head = screen.getByRole('button', { name: zh.skillCardResultEdit })
    // Secondary to running: a ghost control beside the primary run control, and to its left.
    expect(head.getAttribute('variant')).toBe('ghost')
    const buttons = [...(document.querySelector('header')?.querySelectorAll('button') ?? [])]
    const labels = buttons.map(button => button.textContent)
    expect(labels.indexOf(zh.skillCardResultEdit)).toBe(labels.length - 2)
    expect(labels[labels.length - 1]).toBe(zh.skillCardRun)
  })

  it('offers nothing to edit when the card holds no result', async () => {
    const { props } = fixture({ result: null })
    const { container } = render(<SkillCardResultPage {...props} />)
    await waitFor(() => { expect(container.textContent).toContain(zh.skillCardNotRunTitle) })
    expect(screen.queryByRole('button', { name: zh.skillCardResultEdit })).toBeNull()
  })

  it('takes the control away while a run holds the card', async () => {
    const running: WorkbenchRunState = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: RAN_AT,
      retried: false,
    }
    // The mount-time adoption read answers "nothing in flight"; from then on the run is
    // still going, so the surface stays busy and the entry stays gone.
    let polls = 0
    const { props } = fixture({
      // A stored result and a live run at the same time is exactly the state the entry has
      // to stay out of: saving would replace the result the run is about to replace.
      result: stored(),
      start: async (request) => ({
        status: 'ok',
        state: { cardId: request.cardId, phase: 'running', startedAt: RAN_AT, retried: false },
      }),
      poll: async () => {
        polls += 1
        return polls === 1 ? { status: 'missing' } : { status: 'ok', state: running }
      },
    })
    await show(props)
    fireEvent.click(screen.getByRole('button', { name: zh.skillCardRun }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: zh.skillCardResultEdit })).toBeNull()
    })
  })

  it('takes the control away while a bare run holds the card', async () => {
    // A skill target started from a button in the document runs with no result of its own,
    // but it still holds this card: an edit stored mid-run would be overwritten by nothing
    // and would race the runner's own write.
    const bareTemplate = [
      '<!-- dsh-actions',
      '  finish: skill "task-finish"',
      '-->',
      '<h1>任务</h1>',
      '<!-- template-begin --><!-- template-end -->',
    ].join('\n')
    const html = '<button type="button" data-dsh-action="finish" data-dsh-row=\'{"id":1}\'>finish</button>'
    const { props } = fixture({
      template: bareTemplate,
      result: stored({ structured: { html } }),
      catalog: [{ name: 'task-finish', description: 'Close a task', userInvocable: true }],
      start: async (request) => ({
        status: 'ok',
        state: { cardId: request.cardId, phase: 'running', startedAt: RAN_AT, retried: false },
      }),
    })
    render(<SkillCardResultPage {...props} />)
    // The button lives inside the rendered document's shadow root.
    const shadow = await waitFor(() => {
      const host = [...document.querySelectorAll('div')].find(element => element.shadowRoot !== null)
      expect(host).toBeDefined()
      return host?.shadowRoot as ShadowRoot
    })
    await act(async () => { (shadow.querySelector('button') as HTMLButtonElement).click() })
    fireEvent.click(await screen.findByRole('button', { name: zh.actionConfirm }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: zh.skillCardResultEdit })).toBeNull()
    })
  })

  it('waits while the editor is open, because a run would replace the draft', async () => {
    const { props } = fixture()
    await show(props)
    openEditor()
    expect(saveButton()).toBeTruthy()
    // The run control is still there but out of reach: pressing it would replace the result
    // the draft is being kept against, and no confirmation would undo that.
    expect(screen.getByRole('button', { name: zh.skillCardRun })).toHaveProperty('disabled', true)
    // And the composer that asks a model for a revision is not on screen: two writers to
    // one result cannot both be open.
    expect(document.querySelector('[data-refine-composer]')).toBeNull()
  })
})

describe('what the editor edits', () => {
  it('starts from the stored fragment, not from the rendered document', async () => {
    // Criterion 62. The DOM holds the template's document with the fragment spliced into
    // it; its text is not the value the splice needs, so the field starts from the record.
    const { props } = fixture()
    await show(props)
    const field = openEditor()
    expect(field.value).toBe(RUN_HTML)
    // The template around the region is not part of the draft.
    expect(field.value).not.toContain(TEMPLATE.split('<!--')[0])
  })

  it('numbers every line and leaves no line box of its own in the gutter', async () => {
    const { props } = fixture()
    const container = await show(props)
    openEditor()
    const gutter = editorRoot(container).querySelector('pre') as HTMLPreElement
    const numbers = [...gutter.querySelectorAll('button')]
    // The fragment has two lines, so there are exactly two numbers and no stray text node
    // that would add a third line box under them.
    expect(numbers.map(number => number.textContent)).toEqual(['1', '2'])
    expect(gutter.childNodes).toHaveLength(numbers.length)
  })

  it('carries no region band and no action-declaration affordance', async () => {
    // The template editor's gutter paints the region and the declaration block, and its
    // status line writes markers or a skeleton. A fragment has none of those things.
    const { props } = fixture()
    const container = await show(props)
    openEditor()
    const root = editorRoot(container)
    expect(root.querySelector('.gutterLineRegion')).toBeNull()
    expect(root.querySelector('.gutterLineActions')).toBeNull()
    expect(screen.queryByRole('button', { name: zh.skillCardInsertMarkers })).toBeNull()
    expect(screen.queryByRole('button', { name: zh.skillCardInsertSkeleton })).toBeNull()
    expect(screen.queryByRole('button', { name: zh.skillCardAddAction })).toBeNull()
  })

  it('reports the byte count against the result budget', async () => {
    const { props } = fixture()
    const container = await show(props)
    openEditor()
    const bytes = new TextEncoder().encode(RUN_HTML).length
    const status = editorRoot(container).querySelector('[data-result-edit-status]') as HTMLElement
    // Bytes, not characters, and the budget a result is measured against.
    expect(status.textContent).toContain(`${String(bytes)} / 65,536 ${zh.skillCardTemplateSizeUnit}`)
    expect(WORKBENCH_RESULT_MAX_BYTES).toBe(65_536)
    // Nothing has been changed yet, so there is no unsaved marker.
    expect(status.textContent).not.toContain(zh.skillCardTemplateDirty)
    fireEvent.change(screen.getByRole('textbox', { name: zh.resultEditLabel }), {
      target: { value: `${RUN_HTML} ` },
    })
    expect(editorRoot(container).querySelector('[data-result-edit-status]')?.textContent)
      .toContain(zh.skillCardTemplateDirty)
  })
})

describe('saving and leaving', () => {
  it('stores the edited fragment and returns to the rendered result', async () => {
    // Criterion 62, second half: what the editor holds becomes the card's stored result,
    // and the page goes back to showing a rendered document.
    const { props, recorded } = fixture()
    const container = await show(props)
    const field = openEditor()
    fireEvent.change(field, { target: { value: '<b>新</b>' } })
    fireEvent.click(saveButton())

    await waitFor(() => { expect(recorded.saves).toHaveLength(1) })
    expect(recorded.saves[0]).toEqual({ cardId: 'skill-card', html: '<b>新</b>' })
    // The fragment travels alone: no template, and no configuration write.
    expect(recorded.writes).toEqual([])
    expect(recorded.starts).toEqual([])

    await waitFor(() => { expect(container.querySelector('[data-result-editor]')).toBeNull() })
    await waitFor(() => { expect(shadowText(container)).toContain('新') })
    // The card's own template is untouched: the fragment was spliced into it again.
    expect(shadowText(container)).toContain('任务')
  })

  it('closes on 取消 without writing anything, leaving the result unchanged', async () => {
    // Criterion 63. Cancelling is the removal of the decision: no start, no write, and the
    // draft is discarded rather than stored.
    const { props, recorded } = fixture()
    const container = await show(props)
    const field = openEditor()
    fireEvent.change(field, { target: { value: '<b>新</b>' } })
    fireEvent.click(cancelButton())

    await waitFor(() => { expect(container.querySelector('[data-result-editor]')).toBeNull() })
    expect(recorded.saves).toEqual([])
    expect(recorded.writes).toEqual([])
    expect(shadowText(container)).toContain('旧')
  })

  it('saves from the keyboard and suppresses the browser’s own save', async () => {
    const { props, recorded } = fixture()
    await show(props)
    const field = openEditor()
    fireEvent.change(field, { target: { value: '<b>新</b>' } })
    // `fireEvent` answers false when the default was prevented: without that the shell's
    // own "save page" dialog would open over the editor.
    expect(fireEvent.keyDown(field, { key: 's', ctrlKey: true })).toBe(false)
    await waitFor(() => { expect(recorded.saves).toHaveLength(1) })
  })

  it('does not save an unchanged draft, so no result is stamped as edited', async () => {
    // Opening the editor and pressing Save must not put 手工编辑 on a result nobody edited.
    const { props, recorded } = fixture()
    await show(props)
    const field = openEditor()
    expect(saveButton()).toHaveProperty('disabled', true)
    fireEvent.keyDown(field, { key: 's', ctrlKey: true })
    expect(recorded.saves).toEqual([])
  })

  it('keeps the editor open and says why when the write is refused', async () => {
    // A stored write that failed used to leave the screen looking like a success.
    const { props } = fixture({
      save: async () => ({ status: 'rejected', code: 'storage-failure', message: 'the store is read-only' }),
    })
    const container = await show(props)
    const field = openEditor()
    fireEvent.change(field, { target: { value: '<b>新</b>' } })
    fireEvent.click(saveButton())

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain(zh.skillCardProblemGeneric)
    expect(alert.textContent).toContain('the store is read-only')
    // The draft is still there, and the editor is still open: the failure is not a save.
    expect(editorRoot(container).querySelector('textarea')).not.toBeNull()
    expect((screen.getByRole('textbox', { name: zh.resultEditLabel }) as HTMLTextAreaElement).value)
      .toBe('<b>新</b>')
  })
})

describe('what the editor refuses', () => {
  it('refuses a content-policy construct, naming it and where it is', async () => {
    // Criterion 64. The renderer strips these silently, so storing one would read as "it
    // saved but did nothing".
    const { props, recorded } = fixture()
    const container = await show(props)
    const field = openEditor()
    fireEvent.change(field, { target: { value: '<b>新</b><script>alert(1)</script>' } })

    const violations = editorRoot(container).querySelector('[data-result-edit-violations]') as HTMLElement
    expect(violations.textContent).toContain(zh.skillCardViolationScript)
    // The position travels with the reason: a path into the fragment the fragment itself
    // can be searched for.
    expect(violations.textContent).toContain('root > script')
    expect(saveButton()).toHaveProperty('disabled', true)
    fireEvent.click(saveButton())
    expect(recorded.saves).toEqual([])

    // The refusal is also a jump target: clicking it selects the construct it names.
    fireEvent.click(screen.getByRole('button', { name: new RegExp(zh.skillCardViolationScript) }))
    const live = screen.getByRole('textbox', { name: zh.resultEditLabel }) as HTMLTextAreaElement
    const offset = live.value.indexOf('<script')
    // The reported token is the tag name, so the selection covers the name itself.
    expect([live.selectionStart, live.selectionEnd]).toEqual([offset, offset + 'script'.length])
  })

  it('refuses all five content-policy codes, not just script', async () => {
    // The narrow analyser reports the renderer's own five rules; a case per code is what
    // proves the listener was not wired to one of them.
    const cases: readonly { readonly html: string; readonly reason: WorkbenchLocaleKey }[] = [
      { html: '<b onclick="x()">a</b>', reason: 'skillCardViolationEvent' },
      { html: '<a href="javascript:void(0)">a</a>', reason: 'skillCardViolationUrl' },
      { html: '<img src="x.png">', reason: 'skillCardViolationExternal' },
      { html: '<div style="@import url(x.css)">a</div>', reason: 'skillCardViolationCss' },
    ]
    for (const item of cases) {
      const { props, recorded } = fixture()
      const container = await show(props)
      const field = openEditor()
      fireEvent.change(field, { target: { value: item.html } })
      const root = editorRoot(container)
      expect(root.textContent, item.reason).toContain(zh[item.reason])
      expect(saveButton().hasAttribute('disabled')).toBe(true)
      fireEvent.click(saveButton())
      expect(recorded.saves).toEqual([])
      cleanup()
    }
  })

  it('refuses an empty fragment and says the card can be run again', async () => {
    // Criterion 65. An empty region renders as a broken-looking card, and there is a way
    // out that is better than saving nothing.
    const { props, recorded } = fixture()
    const container = await show(props)
    const field = openEditor()
    fireEvent.change(field, { target: { value: '   ' } })

    const refusal = editorRoot(container).querySelector('[data-result-edit-refusal="empty"]')
    expect(refusal?.textContent).toBe(zh.resultEditEmpty)
    expect(refusal?.getAttribute('role')).toBe('alert')
    // The message names the way out rather than only the rule.
    expect(zh.resultEditEmpty).toContain('运行')
    expect(saveButton()).toHaveProperty('disabled', true)
    fireEvent.keyDown(field, { key: 's', ctrlKey: true })
    expect(recorded.saves).toEqual([])
  })

  it('refuses a fragment above the byte budget instead of truncating it', async () => {
    // Criterion 66. Truncating would store one document and display another.
    const { props, recorded } = fixture()
    const container = await show(props)
    const field = openEditor()
    const oversized = 'x'.repeat(WORKBENCH_RESULT_MAX_BYTES + 1)
    fireEvent.change(field, { target: { value: oversized } })

    const refusal = editorRoot(container).querySelector('[data-result-edit-refusal="too-large"]')
    expect(refusal?.textContent).toBe(zh.resultEditTooLarge
      .split('{bytes}').join('65,537')
      .split('{max}').join('65,536'))
    // The count itself is the fact that matters here, so it turns into the warning colour.
    expect(editorRoot(container).querySelector('[data-result-edit-status]')?.innerHTML)
      .toContain('editorStatusWarn')
    expect(saveButton()).toHaveProperty('disabled', true)
    fireEvent.click(saveButton())
    expect(recorded.saves).toEqual([])
    // The draft is kept whole: refusing must not become truncating in the field either.
    expect((screen.getByRole('textbox', { name: zh.resultEditLabel }) as HTMLTextAreaElement).value)
      .toHaveLength(oversized.length)
  })
})

describe('the edited result', () => {
  it('states that it was edited by hand, with the time', async () => {
    // Criterion 68. The record keeps the run's skill and stop reason, so nothing else on
    // the page would say a person replaced the HTML.
    const { props } = fixture()
    const container = await show(props)
    const field = openEditor()
    fireEvent.change(field, { target: { value: '<b>新</b>' } })
    fireEvent.click(saveButton())
    await waitFor(() => { expect(container.querySelector('[data-run-edited-at]')).not.toBeNull() })

    const block = container.querySelector('details') as HTMLDetailsElement
    const labels = [...block.querySelectorAll('dt')].map(term => term.textContent)
    expect(labels).toContain(zh.runEditedAt)
    const row = block.querySelector('[data-run-edited-at]')
    expect(row?.textContent).toBe(new Date(EDITED_AT).toLocaleString())
    // The run facts are still the run's: editing replaces the fragment, not the record.
    expect(block.querySelector('[data-run-stop-reason]')?.getAttribute('data-run-stop-reason'))
      .toBe('completed')
  })

  it('shows no 手工编辑 row for a result no one edited', async () => {
    const { props } = fixture()
    const container = await show(props)
    expect(container.querySelector('[data-run-edited-at]')).toBeNull()
    expect(container.textContent).not.toContain(zh.runEditedAt)
  })

  it('is one step back away from the run’s own version, without entering the log', async () => {
    // Criterion 67. The undo stack is a separate mechanism from the revision log: a hand
    // edit is recoverable, and it is deliberately not a 修改记录 entry — that log records
    // instructions, and nobody gave one.
    const { props } = fixture()
    const container = await show(props)
    const field = openEditor()
    fireEvent.change(field, { target: { value: '<b>新</b>' } })
    fireEvent.click(saveButton())
    await waitFor(() => { expect(shadowText(container)).toContain('新') })

    const undo = container.querySelector('[data-refine-undo]')
    expect(undo?.textContent).toBe(zh.refineUndo)
    // The log stayed empty: one edit, zero revisions.
    expect(container.querySelectorAll('[data-refine-log] li')).toHaveLength(0)
    expect(container.querySelector('[data-refine-log]')?.textContent)
      .toContain(zh.refineLogCount.split('{count}').join('0'))

    fireEvent.click(undo as HTMLElement)
    await waitFor(() => { expect(shadowText(container)).toContain('旧') })
    // Spent by using it.
    expect(container.querySelector('[data-refine-undo]')).toBeNull()
  })
})

describe('keyboard, which is the template editor’s keyboard', () => {
  it('indents with Tab and leaves only after Escape', async () => {
    const { props } = fixture({ result: stored({ structured: { html: '<p>a</p>' } }) })
    const container = await show(props, 'a')
    const field = openEditor()
    field.setSelectionRange(3, 3)
    // `fireEvent` answers false when the default was prevented: Tab must not move focus
    // out of a fragment being written.
    expect(fireEvent.keyDown(field, { key: 'Tab' })).toBe(false)
    expect((screen.getByRole('textbox', { name: zh.resultEditLabel }) as HTMLTextAreaElement).value)
      .toBe('<p>  a</p>')
    // One way out, and it has to be asked for.
    fireEvent.keyDown(field, { key: 'Escape' })
    expect(fireEvent.keyDown(field, { key: 'Tab' })).toBe(true)
    expect(container.querySelector('[data-result-editor] textarea')).not.toBeNull()
  })

  it('outdents with Shift+Tab, including a multi-line selection', async () => {
    const multi = '  <tr>\n    <td>a</td>\n  </tr>'
    const { props } = fixture({ result: stored({ structured: { html: multi } }) })
    const container = await show(props, 'a')
    const field = openEditor()
    // A whole block moves together, and the selection follows the shift. The caret is
    // restored from a microtask, after React has written the new value, so the assertion
    // has to let that microtask run first.
    field.setSelectionRange(0, multi.length)
    expect(fireEvent.keyDown(field, { key: 'Tab', shiftKey: true })).toBe(false)
    await act(async () => { await Promise.resolve() })
    const after = screen.getByRole('textbox', { name: zh.resultEditLabel }) as HTMLTextAreaElement
    expect(after.value).toBe('<tr>\n  <td>a</td>\n</tr>')
    expect([after.selectionStart, after.selectionEnd]).toEqual([0, '<tr>\n  <td>a</td>\n</tr>'.length])
    // A bare caret removes the indentation immediately before it, not the line's.
    fireEvent.change(after, { target: { value: '<p>  a</p>' } })
    after.setSelectionRange(5, 5)
    fireEvent.keyDown(after, { key: 'Tab', shiftKey: true })
    await act(async () => { await Promise.resolve() })
    expect((screen.getByRole('textbox', { name: zh.resultEditLabel }) as HTMLTextAreaElement).value)
      .toBe('<p>a</p>')
    expect(container.querySelector('[data-result-editor] textarea')).not.toBeNull()
  })
})
