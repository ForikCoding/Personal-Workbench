/** The chain driver: order, the session that travels forward, and where it stops. */

import { describe, expect, it } from 'vitest'
import { runSteps, tookOf } from '../src/client/pipeline/pipeline-run.ts'
import type { ChainSeams, ChainStepOutcome, ChainSettleOutcome } from '../src/client/pipeline/pipeline-run.ts'
import type { WorkbenchPipelineStep } from '../src/pipeline-contract.ts'

/** The steps every case runs over. */
const STEPS: readonly WorkbenchPipelineStep[] = [
  { cardId: 'card-a' },
  { cardId: 'card-b' },
  { cardId: 'card-c' },
]

/** One call the driver made, in order. */
type Call = { readonly kind: 'start'; readonly index: number; readonly sessionId?: string; readonly terminal: boolean }

/**
 * Build the seams, with per-step answers.
 * @param options - which steps refuse to start, which fail to settle, and when to abort.
 * @returns the seams plus the calls they received.
 */
function seams(options: {
  refuseAt?: number
  failAt?: number
  sessionOf?: (index: number) => string
  abortAt?: number
  abortOnStart?: boolean
  /** A step that answers `cancelled`, which is how a run stopped at the Host comes back. */
  cancelAt?: number
} = {}): { seams: ChainSeams; calls: Call[]; reports: { index: number; phase: ChainStepOutcome['phase'] }[] } {
  const calls: Call[] = []
  const reports: { index: number; phase: ChainStepOutcome['phase'] }[] = []
  const controller = new AbortController()
  let clock = 1_000
  const sessionOf = options.sessionOf ?? ((index: number) => `session-${String(index + 1)}`)
  return {
    calls,
    reports,
    seams: {
      now: () => { clock += 250; return clock },
      signal: controller.signal,
      onStep: (index, outcome) => { reports.push({ index, phase: outcome.phase }) },
      async start(index, step, ask) {
        calls.push({ kind: 'start', index, ...ask.sessionId === undefined ? {} : { sessionId: ask.sessionId }, terminal: ask.terminal })
        if (options.abortOnStart === true && index === options.abortAt) controller.abort()
        if (index === options.refuseAt) return { status: 'refused', reason: 'the card is gone' }
        return { status: 'started', runId: `run-${step.cardId}` }
      },
      async settle(cardId, _runId, _signal): Promise<ChainSettleOutcome> {
        const index = STEPS.findIndex(entry => entry.cardId === cardId)
        // A stop is not an abort here: the Host cancels the run and the run says so itself.
        if (index === options.cancelAt) return { phase: 'cancelled' }
        if (index === options.failAt) return { phase: 'failed', failure: 'it gave up' }
        return { phase: 'settled', sessionId: sessionOf(index) }
      },
    },
  }
}

describe('runSteps', () => {
  it('runs every step in order and carries each session into the next', async () => {
    const built = seams()
    const result = await runSteps(STEPS, 0, 2, built.seams)
    expect(result.phase).toBe('settled')
    expect(built.calls.map(call => call.index)).toEqual([0, 1, 2])
    // The first step opens the chain; each later step joins the session before it.
    expect(built.calls.map(call => call.sessionId)).toEqual([undefined, 'session-1', 'session-2'])
    // Only the last step ends the chain, so only it may archive the session.
    expect(built.calls.map(call => call.terminal)).toEqual([false, false, true])
    expect(result.steps.map(step => step.phase)).toEqual(['done', 'done', 'done'])
    expect(result.steps[2]?.sessionId).toBe('session-3')
  })

  it('reports each step as it starts and as it ends', async () => {
    const built = seams()
    await runSteps(STEPS, 0, 1, built.seams)
    expect(built.reports).toEqual([
      { index: 0, phase: 'running' },
      { index: 0, phase: 'done' },
      { index: 1, phase: 'running' },
      { index: 1, phase: 'done' },
    ])
  })

  it('carries the run’s trace into the step while it is still running', async () => {
    // What the panel draws mid-run comes from here: a poll of a run that has not settled is
    // reported as the step's activity, with the step's phase left alone.
    const built = seams()
    const seen: ChainStepOutcome[] = []
    const trace = [
      { kind: 'tool', tool: 'read', argument: 'src/a.ts' },
      { kind: 'text', text: 'starting' },
    ] as const
    const result = await runSteps(STEPS, 0, 0, {
      ...built.seams,
      onStep: (_index, outcome) => { seen.push(outcome) },
      settle: async (_cardId, _runId, _signal, onProgress) => {
        onProgress({ cardId: 'skill-card-1', phase: 'running', retried: false, activity: trace })
        // A second read still carrying the old trace must not resurrect anything: the step's
        // phase is what decides, and it is still running.
        onProgress({ cardId: 'skill-card-1', phase: 'running', retried: false, activity: trace })
        return { phase: 'settled', sessionId: 'session-1' }
      },
    })
    expect(result.phase).toBe('settled')
    const live = seen.filter(outcome => outcome.phase === 'running' && outcome.activity !== undefined)
    expect(live).toHaveLength(2)
    expect(live[1]?.activity).toBe(trace)
    // The settled step keeps the last trace it saw. The stored result supersedes it once it
    // is fetched, but between the chain settling and that fetch the panel has something to
    // draw rather than an empty tab that reads as "it did nothing".
    expect(result.steps[0]?.activity).toBe(trace)
  })

  it('stops at the step whose run failed, and starts nothing after it', async () => {
    const built = seams({ failAt: 1 })
    const result = await runSteps(STEPS, 0, 2, built.seams)
    expect(result.phase).toBe('failed')
    expect(result.failureIndex).toBe(1)
    expect(result.failure).toBe('it gave up')
    expect(built.calls.map(call => call.index)).toEqual([0, 1])
    expect(result.steps[1]).toMatchObject({ phase: 'failed', failure: 'it gave up' })
    // The third step never started, so it is still waiting rather than failed.
    expect(result.steps[2]).toMatchObject({ phase: 'queued' })
  })

  it('stops at the step that refuses to start', async () => {
    const built = seams({ refuseAt: 1 })
    const result = await runSteps(STEPS, 0, 2, built.seams)
    expect(result.phase).toBe('failed')
    expect(result.failureIndex).toBe(1)
    expect(result.failure).toBe('the card is gone')
    expect(built.calls.map(call => call.index)).toEqual([0, 1])
  })

  it('leaves the steps outside the slice idle and ends the slice at its last step', async () => {
    const built = seams()
    const result = await runSteps(STEPS, 1, 1, built.seams)
    expect(result.phase).toBe('settled')
    expect(built.calls).toEqual([{ kind: 'start', index: 1, terminal: true }])
    expect(result.steps.map(step => step.phase)).toEqual(['idle', 'done', 'idle'])
  })

  it('continues the session its predecessor left when the slice starts mid-pipeline', async () => {
    // Resuming at step 2 is still a continuation: step 1 already ran, so its session is the
    // one the first resumed step belongs in.
    const built = seams()
    const result = await runSteps(STEPS, 1, 2, { ...built.seams, resume: 'session-from-step-1' })
    expect(built.calls.map(call => call.sessionId)).toEqual(['session-from-step-1', 'session-2'])
    expect(result.steps[0]).toMatchObject({ phase: 'idle' })
    expect(result.phase).toBe('settled')
  })

  it('opens a cold session when nobody knows where the earlier step ran', async () => {
    const built = seams()
    await runSteps(STEPS, 2, 2, built.seams)
    expect(built.calls).toEqual([{ kind: 'start', index: 2, terminal: true }])
  })

  it('gives up when the chain is stopped before a step starts', async () => {
    const built = seams({ abortOnStart: true, abortAt: 1 })
    const result = await runSteps(STEPS, 0, 2, built.seams)
    expect(result.phase).toBe('stopped')
    expect(built.calls.map(call => call.index)).toEqual([0, 1])
    expect(result.steps[1]).toMatchObject({ phase: 'stopped' })
    // Nothing will start the step after a stop, so it is waiting rather than queued: a queue
    // is a promise, and this one was just broken.
    expect(result.steps[2]).toMatchObject({ phase: 'idle' })
  })

  it('reads the step a stop interrupted as stopped, and starts nothing after it', async () => {
    const built = seams({ cancelAt: 1 })
    const result = await runSteps(STEPS, 0, 2, built.seams)
    expect(result.phase).toBe('stopped')
    // The run reported itself cancelled, which is the chain's own way of learning it ended —
    // nobody had to abort the wait.
    expect(built.calls.map(call => call.index)).toEqual([0, 1])
    expect(result.steps.map(step => step.phase)).toEqual(['done', 'stopped', 'idle'])
    // The interrupted step is not a failure: nobody called it one, and its product is simply
    // not there. It keeps the identity of the run, which is what its row is about.
    expect(result.steps[1]).toMatchObject({ phase: 'stopped', runId: 'run-card-b' })
    expect(result.failureIndex).toBeUndefined()
    // The chain reports the last session a step actually settled in — the one before the
    // interrupted step — so a later run can still continue it.
    expect(result.sessionId).toBe('session-1')
  })

  it('keeps the steps outside a stopped slice untouched', async () => {
    const built = seams({ cancelAt: 1 })
    const result = await runSteps(STEPS, 1, 2, built.seams)
    expect(result.phase).toBe('stopped')
    // Step 1 was already done before this slice ran; a stop does not un-finish it.
    expect(result.steps.map(step => step.phase)).toEqual(['idle', 'stopped', 'idle'])
  })

  it('keeps the session the chain reached when a later step fails', async () => {
    const built = seams({ failAt: 2 })
    const result = await runSteps(STEPS, 0, 2, built.seams)
    // The failing step settled in a session of its own, and the chain reports the one it
    // had reached — which is what a retry or the run history needs to name.
    expect(result.sessionId).toBe('session-2')
    expect(result.steps[2]?.phase).toBe('failed')
  })
})

describe('tookOf', () => {
  it('keeps a sub-second duration in milliseconds', () => {
    expect(tookOf(0)).toBe('0ms')
    expect(tookOf(940)).toBe('940ms')
  })

  it('reads seconds and then minutes', () => {
    expect(tookOf(1_400)).toBe('1s')
    expect(tookOf(45_000)).toBe('45s')
    expect(tookOf(125_000)).toBe('2m05s')
  })
})

describe('the pipeline’s directory', () => {
  it('hands the pipeline directory to every step it starts', async () => {
    // The pipeline owns the directory, so a chain cannot start anywhere else: the seam is where
    // the run is told, and a step that read its own card instead would silently ignore it.
    const built = seams()
    const seen: (string | undefined)[] = []
    await runSteps(STEPS, 0, 2, {
      ...built.seams,
      workspace: { path: 'D:\\Git\\my-project' },
      async start(index, step, ask) {
        seen.push(ask.workspace)
        return await built.seams.start(index, step, ask)
      },
    })
    expect(seen).toEqual(['D:\\Git\\my-project', 'D:\\Git\\my-project', 'D:\\Git\\my-project'])
  })

  it('tells the run nothing when the pipeline names no directory', async () => {
    const built = seams()
    const seen: (string | undefined)[] = []
    await runSteps(STEPS, 0, 0, {
      ...built.seams,
      async start(index, step, ask) {
        seen.push(ask.workspace)
        return await built.seams.start(index, step, ask)
      },
    })
    expect(seen).toEqual([undefined])
  })
})

describe('the run’s own sentence', () => {
  it('reaches every step it starts, word for word', async () => {
    // One run, one sentence, every step: the sentence says which task this is, and a step that
    // received it only for some steps would be a chain about two different tasks.
    const built = seams()
    const seen: (string | undefined)[] = []
    await runSteps(STEPS, 0, 2, {
      ...built.seams,
      directive: '完成 T202608242753 任务，从需求到交付',
      async start(index, step, ask) {
        seen.push(ask.directive)
        return await built.seams.start(index, step, ask)
      },
    })
    expect(seen).toEqual([
      '完成 T202608242753 任务，从需求到交付',
      '完成 T202608242753 任务，从需求到交付',
      '完成 T202608242753 任务，从需求到交付',
    ])
  })

  it('travels beside a step’s instruction instead of replacing it', async () => {
    const built = seams()
    const seen: { instruction?: string; directive?: string }[] = []
    await runSteps([{ cardId: 'card-a', instruction: '写任务分析' }, { cardId: 'card-b', instruction: '写详细设计' }], 0, 1, {
      ...built.seams,
      directive: '完成 T1 任务',
      async start(index, step, ask) {
        seen.push({ ...ask.instruction === undefined ? {} : { instruction: ask.instruction }, ...ask.directive === undefined ? {} : { directive: ask.directive } })
        return await built.seams.start(index, step, ask)
      },
    })
    expect(seen).toEqual([
      { instruction: '写任务分析', directive: '完成 T1 任务' },
      { instruction: '写详细设计', directive: '完成 T1 任务' },
    ])
  })

  it('says nothing when the run gave no sentence', async () => {
    const built = seams()
    const seen: (string | undefined)[] = []
    await runSteps(STEPS, 0, 0, {
      ...built.seams,
      async start(index, step, ask) {
        seen.push(ask.directive)
        return await built.seams.start(index, step, ask)
      },
    })
    expect(seen).toEqual([undefined])
  })
})
