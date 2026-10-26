/**
 * @vitest-environment jsdom
 *
 * The run-history page: one card's runs, newest first, and the way into each run.
 *
 * The rows name what the user needs to pick a run — when it completed, what it became,
 * and the first line of what it produced. The translator is the Chinese dictionary
 * rather than a key echo, because what is under test here is the sentence the user
 * reads.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { fakeModelSeat } from './support/fake-model-seat.ts'
import { fakeWorkspacePicker } from './support/fake-workspace-picker.ts'
import { PRESENT_DIRECTORY } from './support/fake-skill-card-host.ts'
import { zh } from '../src/client/locales.ts'
import type { WorkbenchLocaleKey } from '../src/client/locales.ts'
import type {
  WorkbenchCardResult,
  WorkbenchRunState,
  WorkbenchRunCapabilities,
} from '../src/skill-card-contract.ts'
import type { WorkbenchSkillCardApi } from '../src/client/skill-card/api.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

const { SkillCardRunsPage } = await import('../src/client/skill-card/SkillCardPages.tsx')
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

/**
 * Build one stored result.
 * @param overrides - fields the case varies.
 * @returns the result record as the snapshot carries it.
 */
function result(overrides: Partial<WorkbenchCardResult> = {}): WorkbenchCardResult {
  return {
    cardId: 'skill-card',
    runId: 'run-1',
    skill: 'git-repo',
    executedAt: STARTED_AT + 60_000,
    stopReason: 'completed',
    structured: { html: '<b>要点甲</b>\n<p>第二行。</p>' },
    ...overrides,
  }
}

/**
 * Build a transport for one card that is configured and ready to run.
 * @param options - the stored results, what the Host recorded about running, and the
 * run-state answer for the mount-time adoption read.
 * @returns the api.
 */
function pageApi(options: {
  results?: readonly WorkbenchCardResult[]
  capabilities?: WorkbenchRunCapabilities
  /** What the adoption poll answers; defaults to "nothing in flight". */
  poll?: () => Promise<{ readonly status: 'missing' } | { readonly status: 'ok'; readonly state: WorkbenchRunState }>
  /** What starting a run answers; the busy case uses a run that stays in flight. */
  start?: WorkbenchSkillCardApi['start']
} = {}): WorkbenchSkillCardApi {
  return {
    read: async () => ({
      status: 'ok',
      snapshot: {
        revision: '1:0',
        cards: [{
          cardId: 'skill-card',
          skill: 'git-repo',
          template: TEMPLATE,
          templateSkills: ['git-repo'],
          workspace: { path: 'D:\\Git\\Personal-Workbench' },
        }],
        results: [...(options.results ?? [])],
        ...options.capabilities === undefined ? {} : { capabilities: options.capabilities },
      },
    }),
    write: async () => ({ status: 'failed', reason: 'no write is issued here' }),
    catalog: async () => ({ status: 'ok', entries: [] }),
    poll: options.poll ?? (async () => ({ status: 'missing' })),
    // A start that stays running is the one case that needs one; everything else is
    // under test for the list it draws, and starting is left out.
    start: options.start ?? (async () => ({ status: 'unavailable', reason: 'no run is started here' })),
    cancel: async () => {},
    saveResult: async () => ({ status: 'unavailable', reason: 'no edit is stored here' }),
    statDirectory: async () => ({ status: 'ok', stat: PRESENT_DIRECTORY }),
  }
}

/**
 * Build page props.
 * @param overrides - fields the case varies.
 * @returns complete props.
 */
function props(overrides: Partial<PageProps> = {}): PageProps {
  return {
    api: pageApi(),
    cardId: 'skill-card',
    runSessionId: () => 'session-1',
    models: fakeModelSeat(),
    workspacePicker: fakeWorkspacePicker().picker,
    fallbackTitle: '技能卡',
    onBack: () => {},
    openCard: () => {},
    t,
    ...overrides,
  }
}

/**
 * Wait for the stored runs to be applied.
 * @param container - the render container.
 * @returns resolution once the card's own facts are on screen.
 */
async function loaded(container: HTMLElement): Promise<void> {
  await waitFor(() => { expect(container.textContent).toContain('git-repo') })
}

describe('the run-history page', () => {
  it('lists one card’s runs newest first, with their moments', async () => {
    // The list is the newest first, and a moment is when the run completed — the instant
    // the row is about, which never moves when the user edits the content later.
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [
              result({ runId: 'run-old', executedAt: STARTED_AT }),
              result({ runId: 'run-new', executedAt: STARTED_AT + 120_000 }),
              result({ runId: 'run-mid', executedAt: STARTED_AT + 60_000 }),
            ],
          }),
        })}
      />,
    )
    await loaded(container)
    const rows = [...container.querySelectorAll('[data-run-history-row]')]
    expect(rows.map(row => row.getAttribute('data-run-outcome'))).toEqual(['completed', 'completed', 'completed'])
    expect([...container.querySelectorAll('[data-run-history-time]')]
      .map(row => row?.textContent)).toEqual([
        '2024-01-02 14:30',
        '2024-01-02 14:29',
        '2024-01-02 14:28',
      ])
  })

  it('states how many runs the card keeps', async () => {
    const { container } = render(
      <SkillCardRunsPage
        {...props({ api: pageApi({ results: [result(), result({ runId: 'run-2', executedAt: STARTED_AT }) ] }) })}
      />,
    )
    await loaded(container)
    expect(container.querySelector('[data-run-history-count]')?.textContent).toBe(t('runHistoryCount', { count: 2 }))
  })

  it('names each run’s outcome', async () => {
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [
              result({ runId: 'run-ok', stopReason: 'completed', executedAt: STARTED_AT + 60_000 }),
              result({ runId: 'run-fail', stopReason: 'failed', executedAt: STARTED_AT }),
            ],
          }),
        })}
      />,
    )
    await loaded(container)
    expect([...container.querySelectorAll('[data-run-history-outcome]')]
      .map(row => row?.textContent)).toEqual([zh.runActivityCompleted, zh.runActivityFailed])
  })

  it('summarizes each run by its first visible line', async () => {
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [
              result({ runId: 'run-a', structured: { html: '<p>第一句。</p><p>第二句。</p>' } }),
              // A run with no region content has no summary — the outcome word carries it.
              result({ runId: 'run-b', executedAt: STARTED_AT, structured: { a: 'v' } }),
            ],
          }),
        })}
      />,
    )
    await loaded(container)
    expect([...container.querySelectorAll('[data-run-history-summary]')]
      .map(row => row?.textContent)).toEqual(['第一句。'])
  })

  it('marks a run the user has edited', async () => {
    const { container } = render(
      <SkillCardRunsPage
        {...props({ api: pageApi({ results: [result({ editedAt: STARTED_AT + 180_000 }) ] }) })}
      />,
    )
    await loaded(container)
    expect(container.querySelector('[data-run-history-edited]')?.textContent).toBe(zh.runHistoryEdited)
  })

  it('says the card has not run yet, and says so in a list of zero', async () => {
    const { container } = render(<SkillCardRunsPage {...props({ api: pageApi({ results: [] }) })} />)
    await loaded(container)
    expect(container.querySelector('[data-run-history-empty]')?.textContent).toBe(zh.runHistoryEmpty)
    expect(container.querySelector('[data-run-history-list]')).toBeNull()
    expect(container.querySelector('[data-run-history-count]')?.textContent).toBe(t('runHistoryCount', { count: 0 }))
  })

  it('opens the row’s own run when one is clicked', async () => {
    const opened: { cardId: string; view: string; runId: string | undefined }[] = []
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [result(), result({ runId: 'run-old', executedAt: STARTED_AT }) ],
          }),
          openCard: (cardId, view, runId) => { opened.push({ cardId, view, runId }) },
        })}
      />,
    )
    await loaded(container)
    const rows = [...container.querySelectorAll<HTMLButtonElement>('[data-run-history-row]')]
    expect(rows.length).toBe(2)
    // The older row opens its own run, not the card's latest.
    rows[1]?.click()
    expect(opened).toEqual([{ cardId: 'skill-card', view: 'result', runId: 'run-old' }])
  })

  it('lists the run in flight as its own top row, marked running', async () => {
    // A run the page starts is on the list the moment it is in flight: the row is the
    // run itself, not a record the host has stored yet — nothing has completed.
    const running: WorkbenchRunState = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: STARTED_AT,
      retried: false,
    }
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [],
            start: async () => ({ status: 'ok', state: running }),
          }),
        })}
      />,
    )
    await loaded(container)
    expect(container.querySelector('[data-run-history-empty]')).not.toBeNull()
    await act(async () => {
      const run = [...container.querySelectorAll('button')]
        .find(button => button.textContent === zh.skillCardRun)
      if (run === undefined) throw new Error('the run control did not render')
      run.click()
    })
    await waitFor(() => {
      // The list has one row where a moment ago the empty state stood.
      expect(container.querySelector('[data-run-history-empty]')).toBeNull()
      const rows = [...container.querySelectorAll('[data-run-history-row]')]
      expect(rows).toHaveLength(1)
      // The row is the run: its start moment, its running word, no summary yet.
      expect(rows[0]?.getAttribute('data-run-outcome')).toBe('running')
      expect(container.querySelector('[data-run-history-time]')?.textContent).toBe('2024-01-02 14:28')
      expect(container.querySelector('[data-run-history-outcome]')?.textContent).toBe(zh.runHistoryRunning)
      expect(container.querySelector('[data-run-history-summary]')).toBeNull()
      // The row is the way in to the run in flight: its live result page is what the
      // click shows, so it is a live control from the first moment.
      expect(container.querySelector<HTMLButtonElement>('[data-run-history-row]')?.disabled).toBe(false)
      expect(container.querySelector('[data-run-history-count]')?.textContent).toBe(t('runHistoryCount', { count: 1 }))
    })
  })

  it('turns the running row into the stored record when the run settles', async () => {
    // The row that said 运行中 becomes the run's own stored record — same row, same
    // moment, now with its outcome and summary — once the run settles and the snapshot
    // is re-read. The run stores only at settle, so the poll carries that record in and
    // the re-read finds it in storage, landing it where the running row stood.
    const running: WorkbenchRunState = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: STARTED_AT,
      retried: false,
    }
    const settled: WorkbenchRunState = {
      cardId: 'skill-card',
      phase: 'settled',
      startedAt: STARTED_AT,
      retried: false,
      result: {
        runId: String(STARTED_AT),
        skill: 'git-repo',
        executedAt: STARTED_AT + 1_000,
        stopReason: 'completed',
        structured: { html: '<p>第一句。</p>' },
      },
    }
    // The host stores the record at settle; the same array the page reads gains it, so
    // the settle-triggered refresh finds the completed row in storage.
    const stored: WorkbenchCardResult[] = []
    // The adoption read answers nothing in flight; every later poll is the run's own.
    let polls = 0
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: stored,
            start: async () => ({ status: 'ok', state: running }),
            poll: async () => {
              polls += 1
              if (polls === 1) return { status: 'missing' }
              if (polls === 2) return { status: 'ok', state: running }
              stored.push({
                cardId: 'skill-card',
                runId: String(STARTED_AT),
                skill: 'git-repo',
                executedAt: STARTED_AT + 1_000,
                stopReason: 'completed',
                structured: { html: '<p>第一句。</p>' },
              })
              return { status: 'ok', state: settled }
            },
          }),
        })}
      />,
    )
    await loaded(container)
    await act(async () => {
      const run = [...container.querySelectorAll('button')]
        .find(button => button.textContent === zh.skillCardRun)
      if (run === undefined) throw new Error('the run control did not render')
      run.click()
    })
    // The running row appears first, exactly as the previous case proved. The run polls
    // once a second, so the settle answer takes two ticks to arrive.
    await waitFor(() => {
      expect(container.querySelector<HTMLButtonElement>('[data-run-history-row]')?.getAttribute('data-run-outcome')).toBe('running')
    }, { timeout: 3_000 })
    // Then the settle lands: the same row now names the stored completion, summary and
    // all, and is a way into that run's result again.
    await waitFor(() => {
      const row = container.querySelector<HTMLButtonElement>('[data-run-history-row]')
      expect(row?.getAttribute('data-run-outcome')).toBe('completed')
      expect(container.querySelector('[data-run-history-outcome]')?.textContent).toBe(zh.runActivityCompleted)
      expect(container.querySelector('[data-run-history-summary]')?.textContent).toBe('第一句。')
      expect(row?.disabled).toBe(false)
      // Still one row: the running row became the stored record, it did not sit beside it.
      expect([...container.querySelectorAll('[data-run-history-row]')]).toHaveLength(1)
    }, { timeout: 3_000 })
  })

  it('keeps every row open while a run holds the card', async () => {
    // A run in flight turns the run control into its cancel, but the history stays a way
    // in: a stored run is a read-only record, and the row of the run in flight opens that
    // run's live view. Locking the rows left the list looking like dead text.
    const running: WorkbenchRunState = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: STARTED_AT,
      retried: false,
    }
    const opened: { cardId: string; view: string; runId: string | undefined }[] = []
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [result({ runId: 'run-old' })],
            start: async () => ({ status: 'ok', state: running }),
          }),
          openCard: (cardId, view, runId) => { opened.push({ cardId, view, runId }) },
        })}
      />,
    )
    await loaded(container)
    expect([...container.querySelectorAll<HTMLButtonElement>('[data-run-history-row]')][0]?.disabled).toBe(false)
    // Start a run from the page's own control; it stays in flight.
    await act(async () => {
      const run = [...container.querySelectorAll('button')]
        .find(button => button.textContent === zh.skillCardRun)
      if (run === undefined) throw new Error('the run control did not render')
      run.click()
    })
    await waitFor(() => {
      expect([...container.querySelectorAll('button')].some(button => button.textContent === zh.skillCardCancel)).toBe(true)
    })
    // The stored row is still a way in while the new run is in flight.
    const rows = [...container.querySelectorAll<HTMLButtonElement>('[data-run-history-row]')]
    expect(rows.every(row => row.disabled === false)).toBe(true)
    await act(async () => {
      const stored = rows.find(row => row.getAttribute('data-run-outcome') === 'completed')
      if (stored === undefined) throw new Error('the stored row did not render')
      stored.click()
    })
    expect(opened).toEqual([{ cardId: 'skill-card', view: 'result', runId: 'run-old' }])
    // And the row of the run in flight opens that run, which is the live view.
    await act(async () => {
      const live = [...container.querySelectorAll<HTMLButtonElement>('[data-run-history-row]')]
        .find(row => row.getAttribute('data-run-outcome') === 'running')
      if (live === undefined) throw new Error('the running row did not render')
      live.click()
    })
    expect(opened[1]).toEqual({ cardId: 'skill-card', view: 'result', runId: String(STARTED_AT) })
  })
})
