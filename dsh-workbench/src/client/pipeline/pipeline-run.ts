/**
 * Running a pipeline: one step at a time, one session for the whole chain.
 *
 * The sequencing lives in {@link runSteps}, which knows nothing about React or transport
 * seams beyond the two functions it is handed. That is deliberate: the rule that matters
 * — a step's session is the one the step before it settled in, and a chain stops at the
 * first step that does not settle — is testable without a component or a server.
 *
 * The chain stops rather than continues on failure. A step that failed produced no
 * result for the next one to read, and a pipeline that ran on would be answering with
 * whatever the previous conversation happened to contain.
 * @module dsh-workbench/client/pipeline/pipeline-run
 */

import { useCallback, useRef, useState } from 'react'
import { WORKBENCH_OUTPUT_SCHEMA } from '../../skill-card-contract.ts'
import type { WorkbenchPipeline, WorkbenchPipelineStep } from '../../pipeline-contract.ts'
import type { WorkbenchRunState } from '../../skill-card-contract.ts'
import type { WorkbenchSkillCardApi } from '../skill-card/api.ts'

/** How one step of a chain stands. */
export type PipelineStepPhase = 'idle' | 'queued' | 'running' | 'done' | 'failed' | 'stopped'

/** What one step of a chain did. */
export interface ChainStepOutcome {
  /** How it stands. */
  readonly phase: PipelineStepPhase
  /** When it started, in milliseconds since the epoch. */
  readonly startedAt?: number
  /** How long it took, once it stopped running. */
  readonly tookMs?: number
  /** Identity of the run, so the step's own view can open it. */
  readonly runId?: string
  /** Session it executed in; the next step continues this one. */
  readonly sessionId?: string
  /** Why it failed, when it did. */
  readonly failure?: string
}

/** How the whole chain ended. */
export type ChainPhase = 'running' | 'settled' | 'failed' | 'stopped'

/** One chain, as the canvas draws it. */
export interface PipelineChain {
  /** Pipeline the chain belongs to. */
  readonly pipelineId: string
  /** When the chain started. */
  readonly startedAt: number
  /** One entry per pipeline step, in step order. */
  readonly steps: readonly ChainStepOutcome[]
  /** Step that is running now, or was last started. */
  readonly activeIndex?: number
  /** Session the chain is having; absent until the first step settles. */
  readonly sessionId?: string
  /** How the chain stands. */
  readonly phase: ChainPhase
  /** Index of the step that failed, when one did. */
  readonly failureIndex?: number
  /** Why the chain failed, when it did. */
  readonly failure?: string
}

/** What one step's start answered. */
export type ChainStartOutcome =
  | { readonly status: 'started'; readonly runId?: string }
  | { readonly status: 'refused'; readonly reason: string }

/** What one step's settle answered. */
export interface ChainSettleOutcome {
  /** Terminal phase the run reached. */
  readonly phase: 'settled' | 'cancelled' | 'failed'
  /** Session the run executed in, which the next step continues. */
  readonly sessionId?: string
  /** Why it did not settle, for a failed or cancelled run. */
  readonly failure?: string
}

/** Everything {@link runSteps} needs from outside itself. */
export interface ChainSeams {
  /**
   * Start one step's run.
   * @param index - step index.
   * @param step - the step itself.
   * @param ask - the session to continue (absent for the first step), whether this step
   * ends the chain, and the instruction the step carries.
   * @returns the accepted run, or the refusal.
   */
  start(
    index: number,
    step: WorkbenchPipelineStep,
    ask: {
      readonly sessionId?: string
      readonly terminal: boolean
      readonly instruction?: string
    },
  ): Promise<ChainStartOutcome>
  /**
   * Wait for one step's run to reach a terminal phase.
   * @param cardId - the card whose run it is.
   * @param runId - the run's identity, when the start named one.
   * @param signal - cancellation; an aborted wait resolves as cancelled.
   * @returns how the run ended.
   */
  settle(cardId: string, runId: string | undefined, signal: AbortSignal): Promise<ChainSettleOutcome>
  /**
   * Report one step's new state.
   * @param index - step index.
   * @param outcome - the step's state.
   */
  onStep(index: number, outcome: ChainStepOutcome): void
  /** Wall clock seam. */
  now(): number
  /** Cancellation for the whole chain. */
  readonly signal: AbortSignal
}

/** How a chain ended. */
export interface ChainResult {
  /** How it ended. */
  readonly phase: 'settled' | 'failed' | 'stopped'
  /** Session the last settled step used. */
  readonly sessionId?: string
  /** Index of the failing step. */
  readonly failureIndex?: number
  /** Why it failed. */
  readonly failure?: string
  /** What each step did, by index. */
  readonly steps: readonly ChainStepOutcome[]
}

/**
 * Run one contiguous slice of a pipeline's steps.
 *
 * The session travels forward through this function, not through the caller: a step is
 * started in the session the step before it settled in, and nothing else decides that.
 * @param steps - the complete step list.
 * @param from - first step index to run.
 * @param to - last step index to run.
 * @param seams - the start, settle, report, clock and cancellation seams.
 * @returns how the chain ended, with every step's state.
 */
export async function runSteps(
  steps: readonly WorkbenchPipelineStep[],
  from: number,
  to: number,
  seams: ChainSeams,
): Promise<ChainResult> {
  const outcomes: ChainStepOutcome[] = steps.map((_unused, index) => (
    index < from || index > to ? { phase: 'idle' } : { phase: 'queued' }
  ))
  let sessionId: string | undefined
  /** The chain as it stands, with the session the last settled step used. */
  const ended = (phase: 'settled' | 'failed' | 'stopped'): { readonly phase: typeof phase; readonly steps: readonly ChainStepOutcome[]; readonly sessionId?: string } => ({
    phase,
    steps: outcomes,
    ...sessionId === undefined ? {} : { sessionId },
  })
  for (let index = from; index <= to; index += 1) {
    const step = steps[index]
    if (step === undefined) continue
    if (seams.signal.aborted) return ended('stopped')
    const startedAt = seams.now()
    outcomes[index] = { phase: 'running', startedAt }
    seams.onStep(index, outcomes[index] as ChainStepOutcome)
    const started = await seams.start(index, step, {
      ...sessionId === undefined ? {} : { sessionId },
      terminal: index === to,
      ...step.instruction === undefined ? {} : { instruction: step.instruction },
    })
    if (started.status === 'refused') {
      const failed: ChainStepOutcome = { phase: 'failed', startedAt, tookMs: seams.now() - startedAt, failure: started.reason }
      outcomes[index] = failed
      seams.onStep(index, failed)
      return { ...ended('failed'), failureIndex: index, failure: started.reason }
    }
    const settled = await seams.settle(step.cardId, started.runId, seams.signal)
    const tookMs = seams.now() - startedAt
    const runId = started.runId === undefined ? {} : { runId: started.runId }
    if (seams.signal.aborted || settled.phase === 'cancelled') {
      const stopped: ChainStepOutcome = { phase: 'stopped', startedAt, tookMs, ...runId }
      outcomes[index] = stopped
      seams.onStep(index, stopped)
      return ended('stopped')
    }
    if (settled.phase === 'failed' || settled.failure !== undefined) {
      const reason = settled.failure ?? 'the run failed'
      const failed: ChainStepOutcome = { phase: 'failed', startedAt, tookMs, failure: reason, ...runId }
      outcomes[index] = failed
      seams.onStep(index, failed)
      return { ...ended('failed'), failureIndex: index, failure: reason }
    }
    // The step's own session, which the next step joins. A settled step always has one.
    sessionId = settled.sessionId ?? sessionId
    const done: ChainStepOutcome = {
      phase: 'done',
      startedAt,
      tookMs,
      ...runId,
      ...settled.sessionId === undefined ? {} : { sessionId: settled.sessionId },
    }
    outcomes[index] = done
    seams.onStep(index, done)
  }
  return ended('settled')
}

/** How often a running step is polled. */
const POLL_INTERVAL_MS = 1_200

/** What the run hook needs from its host. */
export interface UsePipelineRunOptions {
  /** Skill card transport: the route that starts and polls runs. */
  readonly api: WorkbenchSkillCardApi
  /**
   * Session whose scope resolves a step's skill definition.
   * @returns the session id, or undefined when none is available.
   */
  readonly scopeSessionId?: () => string | undefined
  /** Polling interval; tests pass a shorter one. */
  readonly pollIntervalMs?: number
}

/** The run face the canvas drives. */
export interface PipelineRunFace {
  /** The chain on screen, or undefined when nothing has run in this page yet. */
  readonly chain: PipelineChain | undefined
  /**
   * Run a whole pipeline.
   * @param pipeline - the pipeline to run.
   */
  runAll(pipeline: WorkbenchPipeline): void
  /**
   * Run one step on its own, in a session of its own.
   * @param pipeline - the pipeline the step belongs to.
   * @param index - the step index.
   */
  runOne(pipeline: WorkbenchPipeline, index: number): void
  /** Stop the chain that is running, if one is. */
  stop(): void
}

/**
 * Drive one pipeline run from the page.
 * @param options - transport, scope session, and polling interval.
 * @returns the chain plus the three controls.
 */
export function usePipelineRun(options: UsePipelineRunOptions): PipelineRunFace {
  const { api, scopeSessionId } = options
  const pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS
  const [chain, setChain] = useState<PipelineChain | undefined>(undefined)
  // One chain at a time: a second start supersedes the first, and the first notices at
  // its next seam by finding a different token.
  const token = useRef(0)
  const abort = useRef<AbortController | undefined>(undefined)

  const start = useCallback((pipeline: WorkbenchPipeline, from: number, to: number) => {
    if (pipeline.steps.length === 0 || from > to) return
    token.current += 1
    const mine = token.current
    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller
    const startedAt = Date.now()
    const initial: PipelineChain = {
      pipelineId: pipeline.id,
      startedAt,
      steps: pipeline.steps.map((_unused, index) => (
        index < from || index > to ? { phase: 'idle' } : { phase: 'queued' }
      )),
      activeIndex: from,
      phase: 'running',
    }
    setChain(initial)
    void runSteps(pipeline.steps, from, to, {
      now: () => Date.now(),
      signal: controller.signal,
      onStep: (index, outcome) => {
        if (token.current !== mine) return
        setChain(current => current === undefined ? current : {
          ...current,
          steps: current.steps.map((entry, at) => (at === index ? outcome : entry)),
          activeIndex: index,
        })
      },
      start: async (_index, step, ask) => {
        const scope = scopeSessionId?.()
        const result = await api.start({
          cardId: step.cardId,
          // A joining step names the session it continues; the first step names none and
          // the Host opens one for it. `join` states which of the two this is, so a chain
          // that lost its session is refused instead of quietly starting over.
          ...ask.sessionId === undefined ? {} : { sessionId: ask.sessionId },
          ...scope === undefined ? {} : { scopeSessionId: scope },
          mode: { kind: 'step', terminal: ask.terminal, join: ask.sessionId !== undefined },
          ...ask.instruction === undefined ? {} : { instruction: ask.instruction },
          outputSchema: WORKBENCH_OUTPUT_SCHEMA,
        })
        if (result.status === 'ok') {
          return { status: 'started', ...result.state.runId === undefined ? {} : { runId: result.state.runId } }
        }
        if (result.status === 'rejected') return { status: 'refused', reason: result.message }
        return { status: 'refused', reason: result.reason }
      },
      settle: async (cardId, runId, signal) => await settleRun(api, cardId, runId, signal, pollIntervalMs),
    }).then((result) => {
      if (token.current !== mine) return
      setChain(current => current === undefined ? current : {
        ...current,
        steps: result.steps,
        phase: result.phase,
        ...result.failureIndex === undefined
          ? {}
          : { activeIndex: result.failureIndex, failureIndex: result.failureIndex },
        ...result.sessionId === undefined ? {} : { sessionId: result.sessionId },
        ...result.failure === undefined ? {} : { failure: result.failure },
      })
    })
  }, [api, pollIntervalMs, scopeSessionId])

  const runAll = useCallback((pipeline: WorkbenchPipeline) => {
    start(pipeline, 0, pipeline.steps.length - 1)
  }, [start])

  const runOne = useCallback((pipeline: WorkbenchPipeline, index: number) => {
    start(pipeline, index, index)
  }, [start])

  const stop = useCallback(() => {
    // Bumping the token is what makes the wait give up: the polling loop checks the
    // signal, and the token keeps any late `then` from writing over a newer chain.
    token.current += 1
    abort.current?.abort()
    setChain(current => current === undefined ? current : { ...current, phase: 'stopped' })
  }, [])

  return { chain, runAll, runOne, stop }
}

/**
 * Wait for one card's run to reach a terminal phase.
 * @param api - skill card transport.
 * @param cardId - the card whose run it is.
 * @param runId - the run to follow; absent follows the card's newest run.
 * @param signal - cancellation.
 * @param intervalMs - how long to wait between reads.
 * @returns how the run ended.
 */
export async function settleRun(
  api: WorkbenchSkillCardApi,
  cardId: string,
  runId: string | undefined,
  signal: AbortSignal,
  intervalMs: number,
): Promise<ChainSettleOutcome> {
  for (;;) {
    if (signal.aborted) return { phase: 'cancelled' }
    const read = await api.poll(cardId, signal).catch(() => undefined)
    if (signal.aborted) return { phase: 'cancelled' }
    if (read === undefined || read.status !== 'ok') {
      return { phase: 'failed', failure: 'the run could not be read' }
    }
    const state = pickRun(read.state, runId)
    if (state !== undefined && (state.phase === 'settled' || state.phase === 'cancelled')) {
      return outcomeOf(state)
    }
    await sleep(intervalMs)
  }
}

/**
 * Choose the run a chain is following out of one poll answer.
 * @param newest - the card's newest run, as the wire reports it.
 * @param runId - the run to follow, when one is named.
 * @returns the run's state, or undefined while the answer does not carry it.
 */
function pickRun(newest: WorkbenchRunState, runId: string | undefined): WorkbenchRunState | undefined {
  if (runId === undefined) return newest
  if (newest.runId === runId) return newest
  return undefined
}

/**
 * Read one terminal run state as a chain outcome.
 * @param state - the settled run.
 * @returns its session and, when it failed, why.
 */
function outcomeOf(state: WorkbenchRunState): ChainSettleOutcome {
  const sessionId = state.result?.sessionId
  if (state.phase === 'cancelled') {
    return { phase: 'cancelled', ...sessionId === undefined ? {} : { sessionId } }
  }
  if (state.failure !== undefined) {
    return { phase: 'failed', failure: state.failure, ...sessionId === undefined ? {} : { sessionId } }
  }
  return { phase: 'settled', ...sessionId === undefined ? {} : { sessionId } }
}

/**
 * Wait for a while.
 * @param ms - how long.
 * @returns resolution after the delay.
 */
async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => { setTimeout(resolve, ms) })
}

/**
 * Render a duration the way the canvas shows it.
 * @param ms - milliseconds.
 * @returns a compact duration.
 */
export function tookOf(ms: number): string {
  if (ms < 1_000) return `${String(Math.max(0, Math.round(ms)))}ms`
  const seconds = Math.round(ms / 1_000)
  if (seconds < 60) return `${String(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes)}m${String(seconds % 60).padStart(2, '0')}s`
}