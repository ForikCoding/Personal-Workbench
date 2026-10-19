// @vitest-environment jsdom
/**
 * The in-place confirmation panel, and the two things a confirmed action can do.
 *
 * The panel is the only human gate between a model-authored row and a run, so the
 * cases here are about what it shows, what it refuses to show, and what a confirmed
 * or cancelled decision actually starts.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { primitivesMock } from './support/primitives-mock.tsx'
import { fakeModelSeat } from './support/fake-model-seat.ts'
import { fakeWorkspacePicker } from './support/fake-workspace-picker.ts'
import { PRESENT_DIRECTORY, WORKSPACE_PATH } from './support/fake-skill-card-host.ts'
import type {
  WorkbenchCardConfigView,
  WorkbenchCardResult,
  WorkbenchRunRequest,
  WorkbenchSkillCatalogEntry,
} from '../src/skill-card-contract.ts'
import { WORKBENCH_OUTPUT_SCHEMA } from '../src/skill-card-contract.ts'
import type {
  WorkbenchRunRead,
  WorkbenchRunStart,
  WorkbenchSkillCardApi,
} from '../src/client/skill-card/api.ts'
import type { WorkbenchSkillCardPatch } from '../src/skill-card-contract.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

const { SkillCardResultPage } = await import('../src/client/skill-card/SkillCardPages.tsx')
const { cardFaceTitle } = await import('../src/client/skill-card/SkillCard.tsx')
type PageProps = import('../src/client/skill-card/SkillCardPages.tsx').SkillCardPageProps
const { en } = await import('../src/client/locales.ts')
type LocaleKey = import('../src/client/locales.ts').WorkbenchLocaleKey

afterEach(cleanup)

/** Translate an English dictionary value with its template parameters. */
const t = (key: LocaleKey, params?: Record<string, unknown>): string =>
  Object.entries(params ?? {}).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    en[key],
  )

/** The row one button carries: raw fields, not the rendered text beside them. */
const ROW = { task_number: 'CP-2025-001', task_name: '登录模块联调', task_status: 1 }

/** The page card's own skill; deliberately different from the target card's. */
const CLICKER_SKILL = 'daily-report'

/**
 * One card's template: a declaration block outside the region, plus a region the run
 * would fill. The block has to live outside the region because the region is rewritten.
 */
const CLICKER_TEMPLATE = [
  '<!-- dsh-actions',
  '  start: card "启动任务"',
  '  finish: skill "task-finish"',
  '  gone: card "已删除的卡"',
  '  lost: skill "uninstalled-skill"',
  '-->',
  '<h1>任务</h1>',
  '<!-- template-begin --><!-- template-end -->',
].join('\n')

/** The target card's template; it never renders in these cases, but it has to exist. */
const TARGET_TEMPLATE = '<h1>归档</h1><!-- template-begin --><!-- template-end -->'

/**
 * Build one button carrying an action key and a row.
 * @param key - the action key.
 * @param row - the attribute text, already encoded for a single-quoted attribute.
 * @returns the button markup.
 */
function button(key: string, row: string): string {
  return `<button type="button" data-dsh-action="${key}" data-dsh-row='${row}'>${key}</button>`
}

/**
 * Build the region one result carries.
 *
 * One button per declared key, so a case can click any declaration without rebuilding
 * the result — a model fills the region with a button for each row and each target.
 * @param extra - additional buttons the case needs.
 * @param row - the row the standard buttons carry.
 * @returns the region HTML.
 */
function region(extra = '', row: string = JSON.stringify(ROW)): string {
  return [
    '<table><tbody><tr><td>CP-2025-001</td><td>',
    button('start', row),
    button('finish', row),
    button('gone', row),
    button('lost', row),
    extra,
    '</td></tr></tbody></table>',
  ].join('')
}

/** One catalog entry a human may invoke. */
const TASK_FINISH: WorkbenchSkillCatalogEntry = {
  name: 'task-finish',
  description: 'Close a task',
  userInvocable: true,
}

/** One catalog entry only the model may invoke; it must never appear as a candidate. */
const MODEL_ONLY: WorkbenchSkillCatalogEntry = {
  name: 'system-only',
  description: 'Internal',
  userInvocable: false,
}

/** What one fixture records about the interaction. */
interface Recorded {
  /** Every start request, in order. */
  readonly starts: WorkbenchRunRequest[]
  /** Every stored write. */
  readonly writes: WorkbenchSkillCardPatch[]
  /** Every run-state read, by card. */
  readonly polls: string[]
  /** Starts and navigations in the order they happened. */
  readonly steps: string[]
}

/** Everything one case needs to render the page and inspect what happened. */
interface Fixture {
  readonly recorded: Recorded
  /**
   * Render the page for one card.
   * @param cardId - the card whose result page opens.
   * @returns the render result.
   */
  readonly renderPage: (cardId?: string) => ReturnType<typeof render>
}

/**
 * Build the page over one stored workbench.
 * @param options - cards, results, catalog, and the run-start and run-state doubles.
 * @returns the recorded interaction and a renderer.
 */
function fixture(options: {
  readonly cards?: readonly WorkbenchCardConfigView[]
  readonly results?: readonly WorkbenchCardResult[]
  readonly catalog?: readonly WorkbenchSkillCatalogEntry[]
  readonly start?: (request: WorkbenchRunRequest) => Promise<WorkbenchRunStart>
  readonly poll?: (cardId: string) => Promise<WorkbenchRunRead>
  readonly openCard?: (cardId: string, view: string) => void
  /** Read the run session; a case can change it after the page rendered. */
  readonly runSessionId?: () => string | undefined
} = {}): Fixture {
  const cards = options.cards ?? [
    {
      cardId: 'clicker',
      name: '每日任务',
      skill: CLICKER_SKILL,
      template: CLICKER_TEMPLATE,
      templateSkills: [CLICKER_SKILL],
      workspace: { path: WORKSPACE_PATH },
    },
    {
      cardId: 'target-card',
      name: '启动任务',
      skill: 'task-finish',
      template: TARGET_TEMPLATE,
      templateSkills: ['task-finish'],
      workspace: { path: WORKSPACE_PATH },
    },
  ]
  const results = options.results ?? [{
    cardId: 'clicker',
    skill: CLICKER_SKILL,
    executedAt: 1,
    stopReason: 'completed',
    structured: { html: region() },
  }]
  const recorded: Recorded = { starts: [], writes: [], polls: [], steps: [] }
  const snapshot = { revision: '1:0', cards, results }
  const api: WorkbenchSkillCardApi = {
    read: async () => ({ status: 'ok', snapshot }),
    write: async (patch) => {
      recorded.writes.push(patch)
      return { status: 'ok', snapshot }
    },
    catalog: async () => ({ status: 'ok', entries: options.catalog ?? [TASK_FINISH, MODEL_ONLY] }),
    poll: async (cardId) => {
      recorded.polls.push(cardId)
      return options.poll === undefined ? { status: 'missing' } : await options.poll(cardId)
    },
    start: async (request) => {
      recorded.starts.push(request)
      recorded.steps.push(`start:${request.cardId}`)
      if (options.start !== undefined) return await options.start(request)
      return {
        status: 'ok',
        state: { cardId: request.cardId, phase: 'running', startedAt: 1, retried: false },
      }
    },
    cancel: async () => {},
    saveResult: async () => ({ status: 'unavailable', reason: 'no edit is stored here' }),
    // The default directory is there; any other path is not. A click refused for where it
    // would run is its own case, and the rest of these cases must not trip over it.
    statDirectory: async (path) => ({
      status: 'ok',
      stat: path === WORKSPACE_PATH ? PRESENT_DIRECTORY : { exists: false, isDirectory: false, writable: false },
    }),
  }
  const props = (cardId: string): PageProps => ({
    api,
    cardId,
    runSessionId: options.runSessionId ?? (() => 'session-1'),
    // A live catalog with a known selection: these cases are about clicked actions, and a
    // card that cannot name a model would refuse to run for a reason they are not testing.
    models: fakeModelSeat(),
    workspacePicker: fakeWorkspacePicker().picker,
    fallbackTitle: cardId,
    onBack: () => {},
    openCard: (id, view) => {
      recorded.steps.push(`open:${id}`)
      options.openCard?.(id, view)
    },
    t,
  })
  return {
    recorded,
    renderPage: (cardId = 'clicker') => render(<SkillCardResultPage {...props(cardId)} />),
  }
}

/**
 * Read the shadow root the card document rendered into.
 * @returns the root, or undefined when the body is showing a notice instead.
 */
function cardDocument(): ShadowRoot | undefined {
  for (const element of document.querySelectorAll('div')) {
    if (element.shadowRoot !== null) return element.shadowRoot
  }
  return undefined
}

/**
 * Click one action button inside the card document.
 * @param key - the action key the button carries.
 */
async function clickAction(key: string): Promise<void> {
  const root = cardDocument()
  if (root === undefined) throw new Error('the card document did not render')
  const found = root.querySelector(`[data-dsh-action="${key}"]`)
  if (found === null) throw new Error(`the document carries no "${key}" button`)
  await act(async () => { (found as HTMLElement).click() })
}

/**
 * Read the confirmation panel.
 * @returns the panel element.
 */
function panel(): HTMLElement {
  const found = document.querySelector<HTMLElement>('[data-action-panel]')
  if (found === null) throw new Error('the confirmation panel did not open')
  return found
}

/**
 * Read the action problem alert.
 * @returns its code and text.
 */
function problem(): { readonly code: string | null; readonly text: string } | undefined {
  const found = document.querySelector<HTMLElement>('[data-action-problem]')
  return found === null
    ? undefined
    : { code: found.getAttribute('data-action-problem'), text: found.textContent ?? '' }
}

/**
 * Read the four facts the panel shows, in document order.
 * @returns one entry per field.
 */
function panelFields(): { readonly name: string | null; readonly text: string }[] {
  return [...panel().querySelectorAll('[data-action-field]')].map(field => ({
    name: field.getAttribute('data-action-field'),
    text: field.textContent ?? '',
  }))
}

describe('the title a card target must be declared with', () => {
  it('falls back exactly the way the card face does', () => {
    // A declaration addresses a card by the name the user reads on it, so this rule is
    // what makes a card with no stored name addressable at all.
    expect(cardFaceTitle({ cardId: 'skill-card' }, t)).toBe(en.skillCardTitle)
    expect(cardFaceTitle({ cardId: 'skill-card-2' }, t)).toBe('skill-card-2')
    expect(cardFaceTitle({ cardId: 'skill-card-2', name: '启动任务' }, t)).toBe('启动任务')
  })
})

describe('action confirmation panel', () => {
  it('opens on a click and states the four facts, in order', async () => {
    const { recorded, renderPage } = fixture()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(panel()).toBeTruthy() })

    const fields = panelFields()
    expect(fields.map(field => field.name)).toEqual(['target', 'skill', 'payload', 'session'])
    // The target as the user reads it, not as the template spells it.
    expect(fields[0]?.text).toBe('Card: 启动任务')
    expect(fields[1]?.text).toBe('task-finish')
    // The parameters whole, exactly as the button carried them.
    expect(fields[2]?.text).toBe(JSON.stringify(ROW, null, 2))
    expect(fields[3]?.text).toBe('session-1')
    // Nothing has run yet: the panel is a question.
    expect(recorded.starts).toEqual([])
  })

  it('shows the target card’s skill, not the clicked card’s', async () => {
    // The user clicked a button on 每日任务, but what runs is 启动任务's own skill.
    // Showing the clicked card's skill would have them confirm the wrong run.
    const { renderPage } = fixture()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    expect(panel().textContent).toContain('task-finish')
    expect(panel().textContent).not.toContain(CLICKER_SKILL)
  })

  it('shows a long payload in full, never truncated', async () => {
    // Truncating here would break the one guarantee the panel makes: the confirmed
    // parameters and the executed parameters are the same data.
    const long = 'x'.repeat(4_000)
    const row = JSON.stringify({ ...ROW, notes: long })
    const { renderPage } = fixture({
      results: [{
        cardId: 'clicker',
        skill: CLICKER_SKILL,
        executedAt: 1,
        stopReason: 'completed',
        structured: { html: region('', row) },
      }],
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    const payload = panel().querySelector('pre')
    expect(payload?.textContent).toBe(JSON.stringify(JSON.parse(row), null, 2))
    expect(payload?.textContent).toContain(long)
  })

  it('cancels without running, writing, or navigating', async () => {
    // Criterion 25: cancellation is the removal of the question and nothing else.
    const { recorded, renderPage } = fixture()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionCancel })) })
    expect(document.querySelector('[data-action-panel]')).toBeNull()
    expect(recorded.starts).toEqual([])
    expect(recorded.writes).toEqual([])
    expect(recorded.steps).toEqual([])
    // The card is back to what it was showing.
    await waitFor(() => { expect(cardDocument()?.textContent).toContain('任务') })
  })

  it('opens again for a second click on the same row', async () => {
    // Criterion 30: a button is never consumed, and every trigger is confirmed.
    const { renderPage } = fixture()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionCancel })) })
    await clickAction('start')
    await waitFor(() => { expect(panelFields()[0]?.text).toBe('Card: 启动任务') })
  })

  it('reads the session when the click happens, not when the page rendered', async () => {
    // A session opened after this page appeared must make the next click resolvable:
    // the panel has to state the session the run will actually join.
    let live: string | undefined
    const { renderPage } = fixture({ runSessionId: () => live })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    live = 'session-7'
    await clickAction('finish')
    await waitFor(() => { expect(panelFields()).toHaveLength(4) })
    expect(panelFields()[3]?.text).toBe('session-7')
  })

  it('refuses a payload it cannot read, before any panel', async () => {
    // Criterion 33: an unescaped quote breaks the attribute, and what arrives is a
    // fragment. Running on the readable part is exactly what must not happen.
    const { recorded, renderPage } = fixture({
      results: [{
        cardId: 'clicker',
        skill: CLICKER_SKILL,
        executedAt: 1,
        stopReason: 'completed',
        structured: { html: region(button('start', '{"name":"O\'Reilly"}')) },
      }],
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    // The first `start` button is the well-formed one; the broken one is extra HTML.
    await clickAction('start')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionCancel })) })
    const broken = cardDocument()?.querySelectorAll('[data-dsh-action="start"]')[1]
    if (broken === undefined) throw new Error('the broken button did not render')
    await act(async () => { (broken as HTMLElement).click() })
    await waitFor(() => { expect(problem()?.code).toBe('malformed-payload') })
    expect(document.querySelector('[data-action-panel]')).toBeNull()
    expect(recorded.starts).toEqual([])
  })

  it('refuses a payload over its budget, before any panel', async () => {
    // Criterion 34: over budget is refused, never shortened.
    const oversized = JSON.stringify({ notes: 'x'.repeat(9 * 1024) })
    const { recorded, renderPage } = fixture({
      results: [{
        cardId: 'clicker',
        skill: CLICKER_SKILL,
        executedAt: 1,
        stopReason: 'completed',
        structured: { html: region(button('start', oversized)) },
      }],
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionCancel })) })
    const big = cardDocument()?.querySelectorAll('[data-dsh-action="start"]')[1]
    if (big === undefined) throw new Error('the oversized button did not render')
    await act(async () => { (big as HTMLElement).click() })
    await waitFor(() => { expect(problem()?.code).toBe('oversized-payload') })
    expect(document.querySelector('[data-action-panel]')).toBeNull()
    expect(recorded.starts).toEqual([])
  })

  it('refuses a key the template never declared', async () => {
    // Criterion 19: a key the model invented is refused, not executed.
    const { recorded, renderPage } = fixture({
      results: [{
        cardId: 'clicker',
        skill: CLICKER_SKILL,
        executedAt: 1,
        stopReason: 'completed',
        structured: { html: region(button('invented', JSON.stringify(ROW))) },
      }],
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('invented')
    await waitFor(() => { expect(problem()?.code).toBe('unknown-action') })
    expect(document.querySelector('[data-action-panel]')).toBeNull()
    expect(recorded.starts).toEqual([])
  })

  it('reports a missing card target with the cards that do exist', async () => {
    // Criterion 20: the fix is to repoint the declaration, so the names are the
    // actionable part of the message.
    const { recorded, renderPage } = fixture()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('gone')
    await waitFor(() => { expect(problem()?.code).toBe('target-card-missing') })
    expect(problem()?.text).toContain('每日任务')
    expect(problem()?.text).toContain('启动任务')
    expect(recorded.starts).toEqual([])
  })

  it('reports two cards sharing the name instead of picking one', async () => {
    const { renderPage } = fixture({
      cards: [
        { cardId: 'clicker', name: '每日任务', skill: CLICKER_SKILL, template: CLICKER_TEMPLATE, templateSkills: [CLICKER_SKILL] },
        { cardId: 'target-1', name: '启动任务', skill: 'task-finish', template: TARGET_TEMPLATE, templateSkills: ['task-finish'] },
        { cardId: 'target-2', name: '启动任务', skill: 'task-finish', template: TARGET_TEMPLATE, templateSkills: ['task-finish'] },
      ],
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(problem()?.code).toBe('target-card-ambiguous') })
    expect(document.querySelector('[data-action-panel]')).toBeNull()
  })

  it('reports a missing skill with the installed ones, human-invocable only', async () => {
    // Criterion 21. The list is the fix, so it must not be padded with skills a human
    // cannot trigger.
    const { renderPage } = fixture()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('lost')
    await waitFor(() => { expect(problem()?.code).toBe('target-skill-missing') })
    expect(problem()?.text).toContain('task-finish')
    expect(problem()?.text).not.toContain('system-only')
  })

  it('reports a target card that is already running', async () => {
    // Criterion 23: refused at once, not queued and not waited for.
    const { recorded, renderPage } = fixture({
      poll: async (cardId) => (cardId === 'target-card'
        ? { status: 'ok', state: { cardId, phase: 'running', startedAt: 1, retried: false } }
        : { status: 'missing' }),
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(problem()?.code).toBe('target-busy') })
    expect(document.querySelector('[data-action-panel]')).toBeNull()
    expect(recorded.starts).toEqual([])
  })

  it('offers no buttons while this card’s own run is in flight', async () => {
    // Criterion 22: the card's own run replaces the document with its notice, so the
    // buttons are not merely refused — they are not there.
    const { renderPage } = fixture()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    const run = screen.getByRole('button', { name: en.skillCardRun })
    await act(async () => { fireEvent.click(run) })
    // The in-flight notice is what states this now: the status-line row that used to
    // carry `data-run-status` is gone, so the notice is the wait target.
    await waitFor(() => { expect(screen.getByText(en.skillCardRunningBody)).toBeTruthy() })
    expect(cardDocument()).toBeUndefined()
  })
})

describe('a confirmed card target', () => {
  it('starts that card’s run first, then shows it', async () => {
    // Criterion 26, and the order is the point: a refusal has to land on the card the
    // user is looking at, not on a page they were moved to.
    const { recorded, renderPage } = fixture()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionConfirm })) })
    await waitFor(() => { expect(recorded.steps).toEqual(['start:target-card', 'open:target-card']) })
    expect(recorded.starts[0]).toEqual({
      cardId: 'target-card',
      sessionId: 'session-1',
      mode: { kind: 'card' },
      // The row the user confirmed travels with the run.
      payload: ROW,
      outputSchema: WORKBENCH_OUTPUT_SCHEMA,
    })
    expect(document.querySelector('[data-action-panel]')).toBeNull()
  })

  it('sends the row it displayed, not a re-encoding of it', async () => {
    // What makes the panel a gate rather than a description: the payload text the user
    // read is exactly the payload the run receives.
    const { recorded, renderPage } = fixture()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    const shown = panel().querySelector('pre')?.textContent ?? ''
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionConfirm })) })
    await waitFor(() => { expect(recorded.starts).toHaveLength(1) })
    expect(JSON.stringify(recorded.starts[0]?.payload, null, 2)).toBe(shown)
  })

  it('reports a refused start on the card the user is looking at', async () => {
    // The check-then-start race: the target became busy in between, and the route's
    // own refusal is what the user sees. No lock is invented for it.
    const { recorded, renderPage } = fixture({
      start: async () => ({ status: 'rejected', code: 'run-in-progress', message: 'another run is already in flight' }),
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionConfirm })) })
    await waitFor(() => { expect(problem()?.code).toBe('target-busy') })
    expect(problem()?.text).toContain('another run is already in flight')
    expect(recorded.steps).toEqual(['start:target-card'])
  })
  it('refuses a click whose target card has no directory, before asking to confirm', async () => {
    // The card that would run is the target, and where it runs is its own stored fact. Opening
    // the panel for a run the Host is certain to refuse spends the one thing the panel exists
    // to protect: the user's attention.
    const { recorded, renderPage } = fixture({
      cards: [
        { cardId: 'clicker', name: '每日任务', skill: CLICKER_SKILL, template: CLICKER_TEMPLATE, templateSkills: [CLICKER_SKILL] },
        {
          cardId: 'target-card',
          name: '启动任务',
          skill: 'task-finish',
          template: TARGET_TEMPLATE,
          templateSkills: ['task-finish'],
        },
      ],
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(problem()?.code).toBe('target-workspace-missing') })
    expect(problem()?.text).toContain(en.skillCardProblemWorkspaceMissing)
    expect(document.querySelector('[data-action-panel]')).toBeNull()
    expect(recorded.starts).toEqual([])
  })

  it('refuses a click whose target directory is gone, naming it', async () => {
    const { recorded, renderPage } = fixture({
      cards: [
        { cardId: 'clicker', name: '每日任务', skill: CLICKER_SKILL, template: CLICKER_TEMPLATE, templateSkills: [CLICKER_SKILL] },
        {
          cardId: 'target-card',
          name: '启动任务',
          skill: 'task-finish',
          template: TARGET_TEMPLATE,
          templateSkills: ['task-finish'],
          workspace: { path: 'D:\\Git\\Gone' },
        },
      ],
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('start')
    await waitFor(() => { expect(problem()?.code).toBe('target-workspace-invalid') })
    expect(problem()?.text).toContain('D:\\Git\\Gone')
    expect(recorded.starts).toEqual([])
  })
})

describe('a confirmed skill target', () => {
  it('asks for a bare run of that skill in this session', async () => {
    // Criterion 27: no document, no contract — the request says so explicitly.
    const { recorded, renderPage } = fixture()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('finish')
    await waitFor(() => { expect(panelFields()[0]?.text).toBe('Skill: task-finish') })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionConfirm })) })
    await waitFor(() => { expect(recorded.starts).toHaveLength(1) })
    expect(recorded.starts[0]).toEqual({
      cardId: 'clicker',
      sessionId: 'session-1',
      mode: { kind: 'bare', skill: 'task-finish' },
      payload: ROW,
    })
    expect(recorded.starts[0]).not.toHaveProperty('outputSchema')
    // Nothing is stored for a bare run, and nothing navigates.
    expect(recorded.writes).toEqual([])
    expect(recorded.steps).toEqual(['start:clicker'])
  })

  it('shows the skill running, then only whether it worked', async () => {
    // Criteria 28 and 29 on the client: a verdict, no output text, and the card keeps
    // its own stored result underneath.
    let phase: 'running' | 'settled' = 'running'
    const { recorded, renderPage } = fixture({
      poll: async (cardId) => (recorded.starts.length === 0
        ? { status: 'missing' }
        : {
          status: 'ok',
          state: {
            cardId,
            phase,
            startedAt: 1,
            retried: false,
            ...phase === 'settled' ? { result: { skill: 'task-finish', executedAt: 2, stopReason: 'completed' } } : {},
          },
        }),
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('finish')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionConfirm })) })
    await waitFor(() => { expect(document.querySelector('[data-bare-run]')?.textContent).toBe('Running skill task-finish') })
    phase = 'settled'
    // The run route is read once a second; a verdict is one line with no detail
    // beyond it.
    await waitFor(
      () => { expect(document.querySelector('[data-bare-run]')?.textContent).toBe(en.bareRunDone) },
      { timeout: 3_000 },
    )
    expect(recorded.writes).toEqual([])
    // The card is still showing the result it had stored, which a reload returns to.
    expect(cardDocument()?.textContent).toContain('CP-2025-001')
  })

  it('shows the diagnostic when the child failed', async () => {
    // Criterion 29: a failure carries the reason, read from the host's existing
    // `agent/error` capture.
    const { recorded, renderPage } = fixture({
      poll: async (cardId) => (recorded.starts.length === 0
        ? { status: 'missing' }
        : {
          status: 'ok',
          state: {
            cardId,
            phase: 'settled',
            startedAt: 1,
            retried: false,
            failure: 'the skill run ended as error: the model call was rejected',
            failureCode: 'run-failed',
            result: { skill: 'task-finish', executedAt: 2, stopReason: 'error', diagnostic: 'the model call was rejected' },
          },
        }),
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('finish')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionConfirm })) })
    await waitFor(
      () => { expect(document.querySelector('[data-bare-run="settled"]')?.textContent).toContain(en.bareRunFailed) },
      { timeout: 3_000 },
    )
    expect(document.querySelector('[data-bare-run="settled"]')?.textContent).toContain('the model call was rejected')
  })

  it('refuses a skill-target click when this card has no directory', async () => {
    // A skill target runs on this card, so this card's directory is the one that decides.
    // The refusal lands where the click came from, and nothing is started.
    const { recorded, renderPage } = fixture({
      cards: [
        { cardId: 'clicker', name: '每日任务', skill: CLICKER_SKILL, template: CLICKER_TEMPLATE, templateSkills: [CLICKER_SKILL] },
        {
          cardId: 'target-card',
          name: '启动任务',
          skill: 'task-finish',
          template: TARGET_TEMPLATE,
          templateSkills: ['task-finish'],
          workspace: { path: WORKSPACE_PATH },
        },
      ],
    })
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('finish')
    await waitFor(() => { expect(problem()?.code).toBe('target-workspace-missing') })
    expect(recorded.starts).toEqual([])
    expect(document.querySelector('[data-action-panel]')).toBeNull()
  })

  it('forgets the bare run when the page is opened again', async () => {
    // Criterion 28: the transient state belongs to the screen, so a reload loses it
    // and the card goes back to its own result.
    let phase: 'running' | 'settled' = 'settled'
    const { recorded, renderPage } = fixture({
      poll: async (cardId) => (recorded.starts.length === 0
        ? { status: 'missing' }
        : { status: 'ok', state: { cardId, phase, startedAt: 1, retried: false } }),
    })
    const first = renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    await clickAction('finish')
    await waitFor(() => { expect(panel()).toBeTruthy() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: en.actionConfirm })) })
    await waitFor(
      () => { expect(document.querySelector('[data-bare-run="settled"]')).not.toBeNull() },
      { timeout: 3_000 },
    )
    first.unmount()
    renderPage()
    await waitFor(() => { expect(cardDocument()).toBeDefined() })
    // Nothing about the bare run survives: it was never written anywhere.
    expect(document.querySelector('[data-bare-run]')).toBeNull()
    expect(recorded.writes).toEqual([])
    expect(cardDocument()?.textContent).toContain('CP-2025-001')
  })
})
