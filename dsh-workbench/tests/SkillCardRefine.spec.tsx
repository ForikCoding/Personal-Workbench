/**
 * @vitest-environment jsdom
 *
 * Conversational refinement on the result page.
 *
 * A refinement is a card run with a narrower ask, so what is under test here is the
 * session around it: the composer's gate, the log that records what was already asked,
 * the one version kept for a step back, and the promise that a failed revision leaves
 * the result the user accepted exactly where it was.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { fakeModelSeat } from './support/fake-model-seat.ts'
import { fakeWorkspacePicker } from './support/fake-workspace-picker.ts'
import { PRESENT_DIRECTORY, WORKSPACE_PATH } from './support/fake-skill-card-host.ts'
import { zh } from '../src/client/locales.ts'
import type { WorkbenchLocaleKey } from '../src/client/locales.ts'
import type {
  WorkbenchCardResult,
  WorkbenchRunRequest,
  WorkbenchRunState,
} from '../src/skill-card-contract.ts'
import type { WorkbenchSkillCardApi } from '../src/client/skill-card/api.ts'

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

/** A local wall-clock moment, so a formatted time is the same in any time zone. */
const STARTED_AT = new Date(2024, 0, 2, 14, 28, 36).getTime()

/** The region HTML the page starts from. */
const FIRST_HTML = '<b>旧</b>'

/**
 * Build one result record.
 * @param overrides - fields the case varies.
 * @returns the record.
 */
function result(overrides: Partial<WorkbenchCardResult> = {}): WorkbenchCardResult {
  return {
    cardId: 'skill-card',
    skill: 'git-repo',
    executedAt: STARTED_AT,
    stopReason: 'completed',
    structured: { html: FIRST_HTML },
    ...overrides,
  }
}

/**
 * Build the settled (or failed) state one scripted run answers with.
 * @param html - the region HTML the run captured.
 * @param overrides - fields the case varies.
 * @returns the run state.
 */
function settled(html: string, overrides: Partial<WorkbenchRunState> = {}): WorkbenchRunState {
  return {
    cardId: 'skill-card',
    phase: 'settled',
    startedAt: STARTED_AT,
    retried: false,
    result: result({ executedAt: STARTED_AT + 1_000, structured: { html } }),
    ...overrides,
  }
}

/**
 * Build a transport for one configured card.
 * @param options - the stored result (`null` for none), what a run answers with, and what
 * polling answers.
 * @returns the api and the run requests it received.
 */
function pageApi(options: {
  result?: WorkbenchCardResult | null
  start?: WorkbenchSkillCardApi['start']
  poll?: WorkbenchSkillCardApi['poll']
  cancel?: WorkbenchSkillCardApi['cancel']
} = {}): { api: WorkbenchSkillCardApi; requests: WorkbenchRunRequest[] } {
  const requests: WorkbenchRunRequest[] = []
  const stored = options.result === null ? undefined : options.result ?? result()
  const api: WorkbenchSkillCardApi = {
    read: async () => ({
      status: 'ok',
      snapshot: {
        revision: '1:0',
        cards: [{
          cardId: 'skill-card',
          skill: 'git-repo',
          template: TEMPLATE,
          templateSkills: ['git-repo'],
          // A refinement runs in the card's own directory, so the page is given one that is
          // there; a refinement refused for where it would run is a different case.
          workspace: { path: WORKSPACE_PATH },
        }],
        results: stored === undefined ? [] : [stored],
      },
    }),
    write: async () => ({ status: 'failed', reason: 'no write is issued here' }),
    catalog: async () => ({ status: 'ok', entries: [] }),
    // The mount-time adoption read: nothing is in flight for another card's button.
    poll: options.poll ?? (async () => ({ status: 'missing' })),
    start: async (request) => {
      requests.push(request)
      return options.start === undefined
        ? { status: 'unavailable' as const, reason: 'no run is started here' }
        : options.start(request)
    },
    cancel: options.cancel ?? (async () => {}),
    saveResult: async () => ({ status: 'unavailable', reason: 'no edit is stored here' }),
    statDirectory: async () => ({ status: 'ok', stat: PRESENT_DIRECTORY }),
  }
  return { api, requests }
}

/**
 * Build page props.
 * @param api - transport.
 * @returns complete props.
 */
function props(api: WorkbenchSkillCardApi): PageProps {
  return {
    api,
    cardId: 'skill-card',
    runSessionId: () => 'session-1',
    // A live catalog with a known selection: a refinement is a model call, and a card
    // that cannot name a model would refuse it before these cases ever reach the composer.
    models: fakeModelSeat(),
    workspacePicker: fakeWorkspacePicker().picker,
    fallbackTitle: '技能卡',
    onBack: () => {},
    openCard: () => {},
    t,
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
 * @param api - transport.
 * @returns the render container.
 */
async function show(api: WorkbenchSkillCardApi): Promise<HTMLElement> {
  const { container } = render(<SkillCardResultPage {...props(api)} />)
  await waitFor(() => { expect(shadowText(container)).toContain('旧') })
  return container
}

/**
 * Type one instruction into the composer and send it.
 * @param instruction - what to change.
 */
function ask(instruction: string): void {
  const field = screen.getByLabelText(zh.refinePlaceholder)
  fireEvent.change(field, { target: { value: instruction } })
  fireEvent.click(screen.getByRole('button', { name: zh.refineAction }))
}

describe('refining a result', () => {
  it('disables the regenerate control while the instruction is empty', async () => {
    // Criterion 53. An empty field is not an instruction, so the control that spends a
    // model call cannot be pressed from it.
    const { api } = pageApi()
    await show(api)
    const button = screen.getByRole('button', { name: zh.refineAction })
    expect(button).toHaveProperty('disabled', true)
    const field = screen.getByLabelText(zh.refinePlaceholder)
    fireEvent.change(field, { target: { value: '  ' } })
    expect(button).toHaveProperty('disabled', true)
    fireEvent.change(field, { target: { value: '按时间倒序' } })
    expect(button).toHaveProperty('disabled', false)
    fireEvent.change(field, { target: { value: '' } })
    expect(button).toHaveProperty('disabled', true)
  })

  it('sends the instruction and the HTML on screen, and nothing else', async () => {
    const { api, requests } = pageApi({
      start: async () => ({ status: 'ok', state: settled('<b>新</b>') }),
    })
    await show(api)
    ask('按时间倒序')
    await waitFor(() => { expect(requests).toHaveLength(1) })
    expect(requests[0]).toEqual({
      cardId: 'skill-card',
      sessionId: 'session-1',
      // The template comes from the card's stored selection, so it is not in the request;
      // the previous HTML travels verbatim, and so does the instruction.
      mode: { kind: 'refine', instruction: '按时间倒序', previous: FIRST_HTML },
      outputSchema: expect.anything(),
    })
  })

  it('replaces the result, appends a log entry and allows one step back', async () => {
    // Criterion 54, through the polling path: the run is started, then answered by the
    // state read a second later, which is how a real run settles.
    let polls = 0
    const { api, requests } = pageApi({
      start: async () => ({
        status: 'ok',
        state: { cardId: 'skill-card', phase: 'running', startedAt: STARTED_AT, retried: false },
      }),
      poll: async () => {
        polls += 1
        return polls === 1 ? { status: 'missing' } : { status: 'ok', state: settled('<b>新</b>') }
      },
    })
    const container = await show(api)
    ask('按时间倒序')

    await waitFor(() => { expect(shadowText(container)).toContain('新') }, { timeout: 4_000 })
    expect(requests).toHaveLength(1)
    const log = container.querySelector('[data-refine-log]')
    const entries = [...(log?.querySelectorAll('li') ?? [])].map(item => item.textContent ?? '')
    expect(entries).toHaveLength(1)
    // The instruction, then when it was applied: the log reads as a conversation.
    expect(entries[0]?.startsWith('按时间倒序')).toBe(true)
    expect(entries[0]).toMatch(/\d{2}:\d{2}:\d{2}$/)
    // The log says where it lives, because it disappears on reload.
    expect(log?.textContent).toContain(zh.refineSessionOnly)

    fireEvent.click(screen.getByRole('button', { name: zh.refineUndo }))
    expect(shadowText(container)).toContain('旧')
    // One step only: the control is spent by using it.
    expect(screen.queryByRole('button', { name: zh.refineUndo })).toBeNull()
    // The log stays: it records what was asked, not what is displayed.
    expect(container.querySelectorAll('[data-refine-log] li')).toHaveLength(1)
  })

  it('sends on Enter and inserts a newline on Shift+Enter', async () => {
    // The field is a sentence, not a label: Enter sends it, Shift+Enter keeps writing.
    const { api, requests } = pageApi({
      start: async () => ({ status: 'ok', state: settled('<b>新</b>') }),
    })
    await show(api)
    const field = screen.getByLabelText(zh.refinePlaceholder)

    // Nothing written yet, so Enter has nothing to send.
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(requests).toHaveLength(0)

    fireEvent.change(field, { target: { value: '按时间倒序' } })
    fireEvent.keyDown(field, { key: 'Enter', shiftKey: true })
    expect(requests).toHaveLength(0)

    fireEvent.keyDown(field, { key: 'Enter' })
    await waitFor(() => { expect(requests).toHaveLength(1) })
    expect(requests[0]?.mode).toEqual({ kind: 'refine', instruction: '按时间倒序', previous: FIRST_HTML })
    // The sentence has been sent, so the field is empty again.
    expect((screen.getByLabelText(zh.refinePlaceholder) as HTMLTextAreaElement).value).toBe('')
  })

  it('grows from one row to four and then scrolls instead', async () => {
    // One row is a short instruction, four is the most the block is allowed to take from
    // the result above it; past that the field scrolls.
    const { api } = pageApi()
    await show(api)
    const rowCount = (text: string): string | null => {
      fireEvent.change(screen.getByLabelText(zh.refinePlaceholder), { target: { value: text } })
      return screen.getByLabelText(zh.refinePlaceholder).getAttribute('rows')
    }
    expect(rowCount('一行')).toBe('1')
    expect(rowCount('一\n二\n三')).toBe('3')
    expect(rowCount('一\n二\n三\n四')).toBe('4')
    expect(rowCount('一\n二\n三\n四\n五\n六')).toBe('4')
  })

  it('heads the log with a count and puts 回到上一版 on the same row', async () => {
    const { api } = pageApi({ start: async () => ({ status: 'ok', state: settled('<b>新</b>') }) })
    const container = await show(api)
    ask('按时间倒序')
    await waitFor(() => { expect(container.querySelectorAll('[data-refine-log] li')).toHaveLength(1) })

    const log = container.querySelector('[data-refine-log]') as HTMLElement
    const head = log.firstElementChild as HTMLElement
    // A count, not a sentence, and the one step back beside it rather than below the list.
    expect(head.textContent).toContain(zh.refineLogCount.replace('{count}', '1'))
    const undo = head.querySelector('[data-refine-undo]')
    expect(undo?.textContent).toBe(zh.refineUndo)
    expect(log.querySelector('ol')?.contains(undo)).toBe(false)
    // The entries follow the header row.
    expect(head.nextElementSibling?.tagName).toBe('OL')
  })

  it('ends the log with the note that covers both the log and the step back', async () => {
    const { api } = pageApi({ start: async () => ({ status: 'ok', state: settled('<b>新</b>') }) })
    const container = await show(api)
    ask('按时间倒序')
    await waitFor(() => { expect(container.querySelectorAll('[data-refine-log] li')).toHaveLength(1) })
    const log = container.querySelector('[data-refine-log]') as HTMLElement
    // It is the block's last line, and it names both losses, because both are session-only.
    expect(log.lastElementChild?.textContent).toBe(zh.refineSessionOnly)
    expect(zh.refineSessionOnly).toContain('上一版')
    expect(zh.refineSessionOnly).toContain('修改记录')
  })

  it('drops 回到上一版 from the header once there is nothing to go back to', async () => {
    const { api } = pageApi({ start: async () => ({ status: 'ok', state: settled('<b>新</b>') }) })
    const container = await show(api)
    ask('按时间倒序')
    await waitFor(() => { expect(container.querySelector('[data-refine-undo]')).not.toBeNull() })
    fireEvent.click(screen.getByRole('button', { name: zh.refineUndo }))
    expect(container.querySelector('[data-refine-undo]')).toBeNull()
    // The log stays: it records what was asked, not what is displayed.
    expect(container.querySelectorAll('[data-refine-log] li')).toHaveLength(1)
    expect(container.querySelector('[data-refine-log]')?.firstElementChild?.textContent)
      .toContain(zh.refineLogCount.replace('{count}', '1'))
  })

  it('leaves the result untouched and reports the failure when a refinement fails', async () => {
    // Criterion 55. The failure is stated under the composer, where the ask was made,
    // and only there — the result the user accepted keeps its place above it.
    const failed = settled('', {
      result: result({ structured: undefined, outputText: '抱歉' }),
      failure: 'the child crashed',
      failureCode: 'run-failed',
    })
    const { api } = pageApi({ start: async () => ({ status: 'ok', state: failed }) })
    const container = await show(api)
    ask('按时间倒序')

    const alert = await screen.findByRole('alert')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(alert.textContent).toContain(zh.skillCardProblemRunFailed)
    expect(alert.textContent).toContain('the child crashed')
    // It is under the composer, and the result above it is unchanged.
    expect(container.querySelector('[data-refine-composer]')?.contains(alert)).toBe(true)
    expect(shadowText(container)).toContain('旧')
    // Nothing was kept for a step back, because nothing was replaced.
    expect(container.querySelector('[data-refine-log]')).toBeNull()
  })

  it('reports a refused start under the composer too', async () => {
    const { api } = pageApi({
      start: async () => ({ status: 'rejected', code: 'run-in-progress', message: 'another run is already in flight' }),
    })
    await show(api)
    ask('按时间倒序')
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain(zh.skillCardProblemRunning)
    expect(alert.textContent).toContain('another run is already in flight')
  })

  it('refines a refined result again, and only one version back remains', async () => {
    // Criterion 56. Each request starts from what is on screen, so the second one
    // carries the first refinement's HTML rather than the original.
    let calls = 0
    const { api, requests } = pageApi({
      start: async () => {
        calls += 1
        return { status: 'ok', state: settled(calls === 1 ? '<b>一</b>' : '<b>二</b>') }
      },
    })
    const container = await show(api)

    ask('去掉合计')
    await waitFor(() => { expect(shadowText(container)).toContain('一') })
    ask('加上日期')
    await waitFor(() => { expect(shadowText(container)).toContain('二') })

    expect(requests.map(request => request.mode)).toEqual([
      { kind: 'refine', instruction: '去掉合计', previous: FIRST_HTML },
      { kind: 'refine', instruction: '加上日期', previous: '<b>一</b>' },
    ])
    const entries = [...container.querySelectorAll('[data-refine-log] li')]
      .map(item => (item.textContent ?? '').replace(/\d{2}:\d{2}:\d{2}$/, ''))
    expect(entries).toEqual(['去掉合计', '加上日期'])

    // The step back restores the version the *last* refinement replaced.
    fireEvent.click(screen.getByRole('button', { name: zh.refineUndo }))
    expect(shadowText(container)).toContain('一')
  })

  it('shows a busy result and disables the composer while a run holds the card', async () => {
    const running: WorkbenchRunState = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: STARTED_AT,
      retried: false,
    }
    // The mount-time adoption read answers "nothing in flight"; from then on the run is
    // still going, so the surface keeps its busy state.
    let polls = 0
    const { api } = pageApi({
      start: async () => ({ status: 'ok', state: running }),
      poll: async () => {
        polls += 1
        return polls === 1 ? { status: 'missing' } : { status: 'ok', state: running }
      },
    })
    const container = await show(api)
    ask('按时间倒序')

    await waitFor(() => {
      expect(container.querySelector('[data-result-busy="true"]')).not.toBeNull()
    })
    expect(screen.getByLabelText(zh.refinePlaceholder)).toHaveProperty('disabled', true)
    // The composer's control becomes a stop while a run holds the card. A long task has
    // to be interruptible from where the user is looking: the head's control is at the
    // top of a page that grows with the result, so it scrolls out of reach.
    expect(screen.queryByRole('button', { name: zh.refineAction })).toBeNull()
    expect(screen.getByRole('button', { name: zh.refineStop })).toHaveProperty('disabled', false)
    // The result stays. A refinement edits what is on screen, so replacing it with a
    // progress notice would hide the very thing being revised; the surface is marked
    // busy instead and swapped when the new version arrives.
    const surface = container.querySelector('[data-result-surface]') as HTMLElement
    expect(surface.textContent).not.toContain(zh.skillCardRunningBody)
    const busy = surface.querySelector('[data-result-busy="true"]')
    expect(busy).not.toBeNull()
    expect(busy?.getAttribute('aria-busy')).toBe('true')
  })

  it('stops the run from the composer', async () => {
    const running: WorkbenchRunState = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: STARTED_AT,
      retried: false,
    }
    const cancel = vi.fn(async () => {})
    let polls = 0
    const { api } = pageApi({
      start: async () => ({ status: 'ok', state: running }),
      cancel,
      poll: async () => {
        polls += 1
        return polls === 1 ? { status: 'missing' } : { status: 'ok', state: running }
      },
    })
    await show(api)
    ask('按时间倒序')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: zh.refineStop })).toBeTruthy()
    })
    fireEvent.click(screen.getByRole('button', { name: zh.refineStop }))
    await waitFor(() => { expect(cancel).toHaveBeenCalledTimes(1) })
  })

  it('offers no composer before there is a result to revise', async () => {
    // A refinement is a revision of a result; a card that has never run has none, and a
    // stored result from before the region language has no HTML either.
    const none = pageApi({ result: null })
    const first = render(<SkillCardResultPage {...props(none.api)} />)
    await waitFor(() => { expect(first.container.textContent).toContain(zh.skillCardNotRunTitle) })
    expect(first.container.querySelector('[data-refine-composer]')).toBeNull()
    cleanup()
    const stale = pageApi({ result: result({ structured: { a: 'v' } }) })
    const second = render(<SkillCardResultPage {...props(stale.api)} />)
    await waitFor(() => { expect(second.container.textContent).toContain(zh.skillCardNotRunTitle) })
    expect(second.container.querySelector('[data-refine-composer]')).toBeNull()
  })
})
