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
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
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
    // Nothing is in flight when the page opens, so the adoption read finds no run; after
    // the start the Host's own route keeps answering with the run it was asked to start.
    let started = false
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            results: [],
            start: async () => {
              started = true
              return { status: 'ok', state: running }
            },
            poll: async () => (started ? { status: 'ok', state: running } : { status: 'missing' }),
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
      expect(container.querySelector('[data-run-history-time]')?.textContent).toBe('14:28')
      expect(container.querySelector('[data-run-history-outcome]')?.textContent).toBe(zh.runHistoryRunning)
      expect(container.querySelector('[data-run-history-summary]')).toBeNull()
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

  it('keeps the header starting runs while a run holds the card, and stops it from its own row', async () => {
    // A card may run several at once, so the header no longer becomes 取消 — it would have
    // to choose which of them to stop. The row names one run, so the row is where that run
    // is stopped; every row stays a way in while another run is in flight.
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
            start: async () => ({ status: 'ok', state: running }),
            poll: async () => ({ status: 'ok', state: running }),
            cancel: async (cardId, runId) => { cancelled.push({ cardId, runId }) },
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
      expect([...container.querySelectorAll('[data-run-history-row]')]
        .some(row => row.getAttribute('data-run-outcome') === 'running')).toBe(true)
    })
    // The header still starts runs: a second run of this card is a click away.
    const header = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent === zh.skillCardRun)
    expect(header?.disabled).toBe(false)
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

describe('the run bar', () => {
  /** What a start answered, as the page recorded it. */
  interface Started {
    readonly instruction?: string
  }

  /**
   * Build the page with a card whose mode is under test, recording what each start carried.
   * @param mode - the card's instruction mode.
   * @returns the render container and the starts.
   */
  function barPage(mode: WorkbenchInstructionMode): { container: HTMLElement; started: Started[] } {
    const started: Started[] = []
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            instructionMode: mode,
            start: async (request: { instruction?: string }) => {
              started.push(request.instruction === undefined ? {} : { instruction: request.instruction })
              return {
                status: 'ok',
                state: { cardId: 'skill-card', phase: 'running', startedAt: STARTED_AT, retried: false },
              }
            },
            poll: async () => ({ status: 'missing' }),
          }),
        })}
      />,
    )
    return { container, started }
  }

  /** The bar's field. */
  function field(container: HTMLElement): HTMLTextAreaElement {
    const element = container.querySelector<HTMLTextAreaElement>('[data-run-bar] textarea')
    if (element === null) throw new Error('the run bar did not render a field')
    return element
  }

  /**
   * The page's one run control: the bar's for a card that takes an instruction, and the
   * header's for one that does not.
   */
  function control(container: HTMLElement): HTMLButtonElement {
    const element = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent === zh.skillCardRun)
    if (element === undefined) throw new Error('the page did not render a run control')
    return element
  }

  it('renders no field for a card whose runs need no instruction', async () => {
    // The face every card had before the setting existed: one control, nothing to fill in.
    const { container, started } = barPage('none')
    await loaded(container)
    expect(container.querySelector('[data-run-bar] textarea')).toBeNull()
    await act(async () => { control(container).click() })
    expect(started).toEqual([{}])
  })

  it('runs on an empty field in optional mode, and sends what was written otherwise', async () => {
    const { container, started } = barPage('optional')
    await loaded(container)
    const input = field(container)
    expect(input.placeholder).toBe(zh.runInstructionPlaceholderOptional)
    await act(async () => { control(container).click() })
    expect(started).toEqual([{}])
    fireEvent.change(input, { target: { value: '按时间倒序' } })
    await act(async () => { control(container).click() })
    expect(started[1]).toEqual({ instruction: '按时间倒序' })
    // The ask was sent, so the field no longer holds it.
    expect(input.value).toBe('')
  })

  it('refuses an empty field in required mode, without sending and without disabling the control', async () => {
    // A disabled control explains nothing; this one names the missing ask in place and puts
    // the caret where it belongs.
    const { container, started } = barPage('required')
    await loaded(container)
    const input = field(container)
    expect(input.placeholder).toBe(zh.runInstructionPlaceholderRequired)
    expect(control(container).disabled).toBe(false)
    await act(async () => { control(container).click() })
    expect(started).toEqual([])
    expect(container.querySelector('[data-run-instruction-required]')?.textContent)
      .toBe(zh.runInstructionRequired)
    expect(document.activeElement).toBe(input)
    // Typing retires the sentence; it was about the field being empty.
    fireEvent.change(input, { target: { value: '分析任务' } })
    expect(container.querySelector('[data-run-instruction-required]')).toBeNull()
    await act(async () => { control(container).click() })
    expect(started).toEqual([{ instruction: '分析任务' }])
  })

  it('submits on Enter while the ask is one line, and on Ctrl+Enter once it is not', async () => {
    const { container, started } = barPage('optional')
    await loaded(container)
    const input = field(container)
    fireEvent.change(input, { target: { value: '一句话' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(started).toEqual([{ instruction: '一句话' }])
    // A multi-line ask: Enter is the field's own newline, so only the explicit chord sends it.
    fireEvent.change(input, { target: { value: '第一行\n第二行' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(started).toHaveLength(1)
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true })
    expect(started[1]).toEqual({ instruction: '第一行\n第二行' })
  })

  it('offers this card’s recent asks back, refilling the field rather than running', async () => {
    const started: Started[] = []
    const { container } = render(
      <SkillCardRunsPage
        {...props({
          api: pageApi({
            instructionMode: 'required',
            results: [
              result({ runId: 'run-1', instruction: '分析 T202601010001', executedAt: STARTED_AT + 120_000 }),
              result({ runId: 'run-2', instruction: '分析 T202601010002', executedAt: STARTED_AT + 60_000 }),
              result({ runId: 'run-3', instruction: '分析 T202601010001', executedAt: STARTED_AT }),
            ],
            start: async (request: { instruction?: string }) => {
              started.push(request.instruction === undefined ? {} : { instruction: request.instruction })
              return {
                status: 'ok',
                state: { cardId: 'skill-card', phase: 'running', startedAt: STARTED_AT, retried: false },
              }
            },
            poll: async () => ({ status: 'missing' }),
          }),
        })}
      />,
    )
    await loaded(container)
    const chips = [...container.querySelectorAll<HTMLButtonElement>('[data-run-instruction-chip]')]
    // Distinct, newest first: the third run asked for the same thing as the first.
    expect(chips.map(chip => chip.textContent)).toEqual(['分析 T202601010001', '分析 T202601010002'])
    await act(async () => { chips[1]?.click() })
    expect(field(container).value).toBe('分析 T202601010002')
    expect(started).toEqual([])
  })
})
