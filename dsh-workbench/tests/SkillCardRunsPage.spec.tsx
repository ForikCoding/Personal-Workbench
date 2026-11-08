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
  WorkbenchInstructionMode,
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
 * @param options - the stored results, the card's instruction mode, what the Host recorded
 * about running, and the run-state answer for the mount-time adoption read.
 * @returns the api.
 */
function pageApi(options: {
  results?: readonly WorkbenchCardResult[]
  capabilities?: WorkbenchRunCapabilities
  /** How much instruction the card's runs need; absent models a card created before it. */
  instructionMode?: WorkbenchInstructionMode
  /** What the adoption poll answers; defaults to "nothing in flight". */
  poll?: () => Promise<
    | { readonly status: 'missing' }
    | {
      readonly status: 'ok'
      readonly state: WorkbenchRunState
      readonly states?: readonly WorkbenchRunState[]
    }
  >
  /** What starting a run answers; the busy case uses a run that stays in flight. */
  start?: WorkbenchSkillCardApi['start']
  /** What a cancel asks the Host to stop, when the case presses one. */
  cancel?: WorkbenchSkillCardApi['cancel']
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
          ...options.instructionMode === undefined ? {} : { instructionMode: options.instructionMode },
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
    cancel: options.cancel ?? (async () => {}),
    saveResult: async () => ({ status: 'unavailable', reason: 'no edit is stored here' }),
    statDirectory: async () => ({ status: 'ok', stat: PRESENT_DIRECTORY }),
    listFiles: async () => ({ status: 'unavailable', reason: 'not used by these cases' }),
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
    // The day is the group heading's, so each row carries only its own clock reading.
    expect([...container.querySelectorAll('[data-run-history-time]')]
      .map(row => row?.textContent)).toEqual(['14:30', '14:29', '14:28'])
    expect([...container.querySelectorAll('[data-run-history-day]')]
      .map(day => day?.textContent)).toEqual(['2024-01-02'])
  })

  it('heads the page with one nameplate, the way back first', async () => {
    // The way back used to be a tier of its own above the title, which cost three lines of
    // chrome before a page whose content is a document began. It is an icon control now,
    // first on the nameplate, and the title and the facts follow it on that one line.
    const { container } = render(<SkillCardRunsPage {...props({ api: pageApi({ results: [result()] }) })} />)
    await loaded(container)
    const head = container.querySelector('header') as HTMLElement
    const back = [...head.querySelectorAll('button')]
      .find(button => button.getAttribute('aria-label') === zh.skillCardBack)
    expect(back).toBeTruthy()
    expect(head.firstElementChild).toBe(back)
    expect(back?.textContent).toBe('')
    expect(head.querySelector('h2')?.previousElementSibling).toBe(back)
    expect(head.querySelector('h2')?.textContent).toBe('技能卡')
    // The skill and the run facts share the line under the title, separated by the sheet.
    expect(head.textContent).toContain(zh.runHistoryCount.replace('{count}', '1'))
  })

  it('states that a run produced nothing instead of leaving its row blank', async () => {
    // A run that stored no region content used to render a lone grey meta line, which read
    // as a row that had failed to load rather than as a run with nothing to say.
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [result({ runId: 'run-empty', stopReason: 'aborted', structured: undefined })],
          }),
        })}
      />,
    )
    await loaded(container)
    const row = container.querySelector('[data-run-history-row]') as HTMLElement
    expect(row.getAttribute('data-run-outcome')).toBe('aborted')
    const nothing = row.querySelector('[data-run-history-nothing]') as HTMLElement
    expect(nothing.textContent).toBe(zh.runHistoryNoContent)
    // The clock is still the row's own fact and still there.
    expect(row.querySelector('[data-run-history-time]')?.textContent).toBe('14:29')
  })

  it('groups the runs by the day they completed on', async () => {
    // A row carries only its clock reading, so the day has to be stated somewhere: runs
    // from two days read as two groups, newest day first, and a day appears once.
    const day = 86_400_000
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [
              result({ runId: 'run-today', executedAt: STARTED_AT + day * 2 }),
              result({ runId: 'run-yesterday', executedAt: STARTED_AT + day }),
              result({ runId: 'run-yesterday-b', executedAt: STARTED_AT + day + 60_000 }),
              result({ runId: 'run-old', executedAt: STARTED_AT }),
            ],
          }),
        })}
      />,
    )
    await loaded(container)
    const days = [...container.querySelectorAll('[data-run-history-day]')].map(node => node.textContent)
    expect(days).toEqual(['2024-01-04', '2024-01-03', '2024-01-02'])
    // Three runs under the newest two days, and the fourth alone: the grouping follows
    // the order of the list rather than re-sorting it.
    expect([...container.querySelectorAll('[data-run-history-row]')]).toHaveLength(4)
    expect([...container.querySelectorAll('[data-run-history-time]')].map(node => node.textContent))
      .toEqual(['14:28', '14:29', '14:28', '14:28'])
  })

  it('numbers each run within the card’s history', async () => {
    // Two runs of one task look alike once their content is the same document; the
    // ordinal is what tells a reader which came first.
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [result({ runId: 'run-new', executedAt: STARTED_AT + 60_000 }), result({ runId: 'run-old' })],
          }),
        })}
      />,
    )
    await loaded(container)
    const rows = [...container.querySelectorAll('[data-run-history-row]')]
    expect(rows[0]?.textContent).toContain('第 2 次')
    // The card's first run is the history's floor, so it carries no ordinal: "第 1 次"
    // on every card's oldest row would be a fact with nothing to compare against.
    expect(rows[1]?.textContent).not.toContain('第 1 次')
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

  it('reads a run the deadline stopped as failed, not as stopped', async () => {
    // The seam reports `aborted` for a run the Host stopped at its deadline, and the list
    // used to print 已停止 — "stopped", the word for a run a person cancelled. Nobody
    // cancelled this one; the record's own verdict is what the row states.
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [
              result({
                runId: 'run-timeout',
                stopReason: 'aborted',
                structured: undefined,
                failure: 'the skill run timed out after 10 minutes',
                failureCode: 'run-timeout',
              }),
            ],
          }),
        })}
      />,
    )
    await loaded(container)
    expect(container.querySelector('[data-run-history-outcome]')?.textContent).toBe(zh.runActivityFailed)
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
    // A run the card's own face started is already in flight when this page opens, and the
    // adoption read finds it: the row is the run itself, not a record the host has stored
    // yet — nothing has completed.
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
            poll: async () => ({ status: 'ok', state: running }),
          }),
        })}
      />,
    )
    await loaded(container)
    await waitFor(() => {
      // The list has one row where a moment ago the empty state stood.
      expect(container.querySelector('[data-run-history-empty]')).toBeNull()
      const rows = [...container.querySelectorAll('[data-run-history-row]')]
      expect(rows).toHaveLength(1)
      // The row is the run: its start moment, its running word, no summary yet.
      expect(rows[0]?.getAttribute('data-run-outcome')).toBe('running')
      expect(container.querySelector('[data-run-history-time]')?.textContent).toBe('14:28')
      expect(container.querySelector('[data-run-history-outcome]')?.textContent).toBe(zh.runHistoryRunning)
      expect(container.querySelector('[data-run-history-summary]')).toBeNull()
      // A run in flight has no content *yet*, which is not the same fact as a run that
      // finished with none: the row must not claim the run is over and empty while its own
      // outcome says 运行中.
      expect(container.querySelector('[data-run-history-nothing]')).toBeNull()
      expect(container.querySelector('[data-run-history-pending]')?.textContent)
        .toBe(zh.runHistoryRunningTitle)
      // The row is the way in to the run in flight: its live result page is what the
      // click shows, so it is a live control from the first moment.
      expect(container.querySelector<HTMLButtonElement>('[data-run-history-row]')?.disabled).toBe(false)
      expect(container.querySelector('[data-run-history-count]')?.textContent).toBe(t('runHistoryCount', { count: 1 }))
    })
  })

  it('lists every run of the card that is in flight, one row each', async () => {
    // One card may run several of its own runs at once, so the list is not "the run" plus
    // history: each run in flight is a row of its own, newest first, and each row stops
    // and opens its own run rather than the card's newest.
    const first: WorkbenchRunState = {
      cardId: 'skill-card',
      runId: 'run-newer',
      phase: 'running',
      startedAt: STARTED_AT + 60_000,
      retried: false,
    }
    const second: WorkbenchRunState = {
      cardId: 'skill-card',
      runId: 'run-older',
      phase: 'running',
      startedAt: STARTED_AT,
      retried: false,
    }
    const cancelled: { cardId: string; runId: string | undefined }[] = []
    const opened: { cardId: string; view: string; runId: string | undefined }[] = []
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [result({ runId: 'run-stored', executedAt: STARTED_AT - 60_000 })],
            poll: async () => ({ status: 'ok', state: first, states: [first, second] }),
            cancel: async (cardId, runId) => { cancelled.push({ cardId, runId }) },
          }),
          openCard: (cardId, view, runId) => { opened.push({ cardId, view, runId }) },
        })}
      />,
    )
    await loaded(container)
    await waitFor(() => {
      expect([...container.querySelectorAll('[data-run-history-row]')]).toHaveLength(3)
    })
    const rows = () => [...container.querySelectorAll<HTMLButtonElement>('[data-run-history-row]')]
    // Newest first: the two runs in flight, then the stored record.
    expect(rows().map(row => row.getAttribute('data-run-outcome'))).toEqual(['running', 'running', 'completed'])
    expect(container.querySelector('[data-run-history-count]')?.textContent)
      .toBe(t('runHistoryCount', { count: 3 }))
    // One stop control per run in flight, and it names its own run.
    const stops = [...container.querySelectorAll<HTMLButtonElement>('[data-run-history-stop]')]
    expect(stops).toHaveLength(2)
    await act(async () => { stops[1]?.click() })
    expect(cancelled).toEqual([{ cardId: 'skill-card', runId: 'run-older' }])
    // A row opens the run it names, so two rows in flight are two different views.
    await act(async () => { rows()[0]?.click() })
    expect(opened).toEqual([{ cardId: 'skill-card', view: 'result', runId: 'run-newer' }])
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
    // The adoption read finds the run in flight; the next answer is its settle.
    let polls = 0
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: stored,
            poll: async () => {
              polls += 1
              if (polls === 1) return { status: 'ok', state: running }
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

  it('stops each run from its own row, and keeps every row a way in while one runs', async () => {
    // A card may run several at once, so no header control could say which of them it would
    // stop. The row names one run, so the row is where that run is stopped; every row stays
    // a way in while another run is in flight.
    const running: WorkbenchRunState = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: STARTED_AT,
      retried: false,
    }
    const opened: { cardId: string; view: string; runId: string | undefined }[] = []
    const cancelled: { cardId: string; runId: string | undefined }[] = []
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [result({ runId: 'run-old' })],
            poll: async () => ({ status: 'ok', state: running }),
            cancel: async (cardId, runId) => { cancelled.push({ cardId, runId }) },
          }),
          openCard: (cardId, view, runId) => { opened.push({ cardId, view, runId }) },
        })}
      />,
    )
    await loaded(container)
    await waitFor(() => {
      expect([...container.querySelectorAll('[data-run-history-row]')]
        .some(row => row.getAttribute('data-run-outcome') === 'running')).toBe(true)
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
    // Only the row of a run in flight carries the stop control, and it names that run.
    const stops = [...container.querySelectorAll<HTMLButtonElement>('[data-run-history-stop]')]
    expect(stops).toHaveLength(1)
    await act(async () => { stops[0]?.click() })
    expect(cancelled).toEqual([{ cardId: 'skill-card', runId: String(STARTED_AT) }])
  })

  it('states the instruction each run carried, and none for a run that carried none', async () => {
    // Two runs of one card produce two documents that differ only by what was asked for, so
    // the row that names the run also has to name its ask.
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [
              result({ runId: 'run-asked', instruction: '分析 T202601010001', executedAt: STARTED_AT + 60_000 }),
              result({ runId: 'run-plain', executedAt: STARTED_AT }),
            ],
          }),
        })}
      />,
    )
    await loaded(container)
    expect([...container.querySelectorAll('[data-run-history-instruction]')]
      .map(node => node.textContent))
      .toEqual([t('runHistoryInstruction', { text: '分析 T202601010001' })])
  })
})

describe('no run control on the page', () => {
  it('starts nothing from here, whatever the card needs before it runs', async () => {
    // Where the run bar used to be. A run starts from the card's own face in the grid — the
    // grid is where the cards are, so a card can be run without being opened — and this page
    // is the history of what that produced. A second control here would be a second place to
    // start the same thing, above a list that is not about the next run.
    for (const mode of ['none', 'optional', 'required'] as const) {
      const { container } = render(
        <SkillCardRunsPage {...props({ api: pageApi({ instructionMode: mode }) })} />,
      )
      await loaded(container)
      expect(container.querySelector('[data-run-bar]')).toBeNull()
      expect(container.querySelector('textarea')).toBeNull()
      expect([...container.querySelectorAll('button')]
        .map(button => button.textContent)
        .filter(text => text === zh.skillCardRun)).toEqual([])
      cleanup()
    }
  })
})
