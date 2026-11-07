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

import { useCallback, useEffect, useRef, useState } from 'react'
import { WORKBENCH_OUTPUT_SCHEMA } from '../../skill-card-contract.ts'
import type { WorkbenchPipeline, WorkbenchPipelineStep } from '../../pipeline-contract.ts'
import type { WorkbenchRunState } from '../../skill-card-contract.ts'
import type { WorkbenchSkillCardApi } from '../skill-card/api.ts'
import type { PipelineRunEntry, PipelineRunStep } from './pipeline-view.ts'

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
  /**
   * What this chain covers: the whole pipeline, this step alone, or this step again.
   *
   * The chain's own reading of itself, so a run of one step in a one-step pipeline is not
   * mistaken for a run of the pipeline: how many steps a run touched says nothing about
   * what it was asked to do.
   */
  readonly scope: PipelineRunEntry['scope']
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
  /**
   * Session the step before `from` settled in, when this chain resumes mid-pipeline.
   *
   * A resumed chain starts where the pipeline stands, so its first step has a predecessor
   * that already ran — in this panel or in an earlier one. Joining that session keeps the
   * promise the chain makes everywhere else; absent, the step opens its own, which is the
   * honest answer when nobody knows where the earlier step ran.
   */
  readonly resume?: string
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
  // A resumed chain begins with the session its predecessor left behind, when that is
  // known: the step it starts with is a continuation even though it is the first to run here.
  let sessionId = from > 0 ? seams.resume : undefined
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

/** How many runs one pipeline keeps in this page, newest first. */
const HISTORY_LIMIT = 20

/** What a pipeline with no runs answers. */
const EMPTY_HISTORY: readonly PipelineRunEntry[] = []

/** How often a running step is polled. */
const POLL_INTERVAL_MS = 1_200

/** How many reads a chain waits for a run id the card no longer reports. */
const MISS_LIMIT = 3

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
   * @param from - first step to run; absent starts at the first step.
   * @param resume - session the step before `from` settled in, when the run continues it.
   */
  runAll(pipeline: WorkbenchPipeline, from?: number, resume?: string): void
  /**
   * Run one step on its own, in a session of its own.
   * @param pipeline - the pipeline the step belongs to.
   * @param index - the step index.
   */
  runOne(pipeline: WorkbenchPipeline, index: number): void
  /** Stop the chain that is running, if one is. */
  stop(): void
  /**
   * Regenerate one step from a request about its result.
   * @param pipeline - the pipeline the step belongs to.
   * @param index - the step index.
   * @param instruction - what to change.
   */
  refine(pipeline: WorkbenchPipeline, index: number, instruction: string): void
  /**
   * The runs this page has seen for one pipeline, newest first.
   * @param pipelineId - the pipeline to read.
   * @returns its runs; empty when it has not run here.
   */
  history(pipelineId: string): readonly PipelineRunEntry[]
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
  const [historyOf, setHistory] = useState<Record<string, PipelineRunEntry[]>>({})
  // One chain at a time: a second start supersedes the first, and the first notices at
  // its next seam by finding a different token.
  const token = useRef(0)
  const abort = useRef<AbortController | undefined>(undefined)

  // Leaving the surface ends the chain: a poll loop outliving its panel would keep asking
  // the Host about a run nobody is watching, and never stop.
  useEffect(() => () => { abort.current?.abort() }, [])

  /**
   * Record one finished run, with what each step left behind.
   *
   * The snapshot is read once, after the run, from the results the Host already stores: a
   * run's own record has no history behind it, and the reader needs the region as it was.
   * A read that fails still records the run — the step list is worth keeping even when the
   * products can no longer be shown.
   */
  const finish = useCallback(async (
    pipeline: WorkbenchPipeline,
    result: ChainResult,
    ask: { scope: PipelineRunEntry['scope']; instruction?: string; previous?: string },
    from: number,
    startedAt: number,
  ) => {
    const products = new Map<string, string>()
    const read = await api.read()
    if (read.status === 'ok') {
      for (const stored of read.snapshot.results) {
        const html = htmlOf(stored.structured)
        if (html !== undefined && !products.has(stored.cardId)) products.set(stored.cardId, html)
      }
    }
    const steps: PipelineRunStep[] = []
    result.steps.forEach((outcome, index) => {
      // A step the run did not reach has nothing to say about this run.
      if (outcome.phase === 'idle') return
      const cardId = pipeline.steps[index]?.cardId
      if (cardId === undefined) return
      const html = products.get(cardId)
      steps.push({
        cardId,
        phase: outcome.phase,
        ...outcome.tookMs === undefined ? {} : { tookMs: outcome.tookMs },
        ...outcome.failure === undefined ? {} : { failure: outcome.failure },
        ...html === undefined ? {} : { html },
      })
    })
    const entry: PipelineRunEntry = {
      no: 0,
      startedAt,
      tookMs: Date.now() - startedAt,
      phase: result.phase === 'settled' ? 'settled' : result.phase === 'failed' ? 'failed' : 'stopped',
      scope: ask.scope,
      ...ask.scope === 'full' ? {} : { only: from },
      ...ask.instruction === undefined ? {} : { instruction: ask.instruction },
      steps,
    }
    setHistory(current => {
      const list = current[pipeline.id] ?? []
      const numbered: PipelineRunEntry = { ...entry, no: list.length + 1 }
      return { ...current, [pipeline.id]: [numbered, ...list].slice(0, HISTORY_LIMIT) }
    })
  }, [api])

  const start = useCallback((
    pipeline: WorkbenchPipeline,
    from: number,
    to: number,
    ask: { scope: PipelineRunEntry['scope']; instruction?: string; previous?: string; resume?: string },
  ) => {
    if (pipeline.steps.length === 0 || from > to) return
    token.current += 1
    const mine = token.current
    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller
    const startedAt = Date.now()
    const initial: PipelineChain = {
      pipelineId: pipeline.id,
      scope: ask.scope,
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
      ...ask.resume === undefined ? {} : { resume: ask.resume },
      onStep: (index, outcome) => {
        if (token.current !== mine) return
        setChain(current => current === undefined ? current : {
          ...current,
          steps: current.steps.map((entry, at) => (at === index ? outcome : entry)),
          activeIndex: index,
        })
      },
      start: async (index, step, seam) => {
        const scope = scopeSessionId?.()
        const regenerate = ask.previous !== undefined && ask.instruction !== undefined
        // A regeneration takes the branch below that says it is one, so this narrowing only
        // tells the type what the code already knows: a step run covers a chain or a step.
        const cover = ask.scope === 'refine' ? 'single' : ask.scope
        const result = await api.start({
          cardId: step.cardId,
          // A joining step names the session it continues; the first step names none and
          // the Host opens one for it. `join` states which of the two this is, so a chain
          // that lost its session is refused instead of quietly starting over.
          ...seam.sessionId === undefined ? {} : { sessionId: seam.sessionId },
          ...scope === undefined ? {} : { scopeSessionId: scope },
          mode: regenerate
            // A regeneration is its own kind of run: it starts from the result the user is
            // looking at, so it needs no session to continue and no hand-off to write. It
            // names the step only so the record says how the product was made.
            ? {
                kind: 'refine',
                instruction: ask.instruction as string,
                previous: ask.previous as string,
                handoff: { pipelineId: pipeline.id, step: index },
              }
            : {
                kind: 'step',
                terminal: seam.terminal,
                join: seam.sessionId !== undefined,
                // Which pipeline and step this is, so the run leaves a note the later steps
                // can read when the conversation is gone. Sent on every step, joined or
                // not: a note is written by every step, read by one that cannot join.
                // `scope` is what this run was asked to cover, which is the only thing that
                // separates a step run on its own from the same step inside a chain.
                handoff: { pipelineId: pipeline.id, step: index, scope: cover },
              },
          ...seam.instruction === undefined ? {} : { instruction: seam.instruction },
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
      void finish(pipeline, result, ask, from, startedAt)
    })
  }, [api, pollIntervalMs, scopeSessionId, finish])

  // A whole run starts where the pipeline actually is: at the first step without a result,
  // or at the first step again when every step holds one. The run bar states that rule in
  // words, so it is applied here rather than left for the button to decide.
  const runAll = useCallback((pipeline: WorkbenchPipeline, from = 0, resume?: string) => {
    const at = from < 0 || from >= pipeline.steps.length ? 0 : from
    // Resuming is a continuation of the step before it: the chain keeps its promise that a
    // step runs in the session the step before it settled in.
    start(pipeline, at, pipeline.steps.length - 1, {
      scope: 'full',
      ...at > 0 && resume !== undefined ? { resume } : {},
    })
  }, [start])

  const runOne = useCallback((pipeline: WorkbenchPipeline, index: number) => {
    start(pipeline, index, index, { scope: 'single' })
  }, [start])


  const refine = useCallback((pipeline: WorkbenchPipeline, index: number, instruction: string) => {
    void (async () => {
      const read = await api.read()
      if (read.status !== 'ok') return
      const cardId = pipeline.steps[index]?.cardId
      if (cardId === undefined) return
      const stored = read.snapshot.results.find(entry => entry.cardId === cardId)
      const previous = htmlOf(stored?.structured)
      if (previous === undefined || previous.trim() === '') return
      start(pipeline, index, index, { scope: 'refine', instruction, previous })
    })()
  }, [api, start])

  const history = useCallback((pipelineId: string) => historyOf[pipelineId] ?? EMPTY_HISTORY, [historyOf])

  const stop = useCallback(() => {
    // Bumping the token is what makes the wait give up: the polling loop checks the
    // signal, and the token keeps any late `then` from writing over a newer chain.
    token.current += 1
    abort.current?.abort()
    setChain(current => current === undefined ? current : { ...current, phase: 'stopped' })
  }, [])

  return { chain, runAll, runOne, stop, refine, history }
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
  let misses = 0
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
    // A card reports its newest run, so the run a chain follows can fall out of the answer
    // while it is still being read. Waiting for an id that will never come back would wait
    // for as long as the panel is open, so after a few reads the card's own terminal state
    // is taken as the answer: it is the truth about what that card last did.
    if (state === undefined) {
      misses += 1
      if (misses >= MISS_LIMIT && (read.state.phase === 'settled' || read.state.phase === 'cancelled')) {
        return outcomeOf(read.state)
      }
    } else {
      misses = 0
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
/**
 * The region a stored result carries.
 *
 * The output contract is `{ html }`, so a result's product is a string under that key. It
 * is read defensively anyway: a record written by an older build has no such field, and a
 * reader that assumed one would throw on a card nobody has re-run since.
 * @param structured - the result's structured answer, when it kept one.
 * @returns the region HTML, or undefined when the record carries none.
 */
function htmlOf(structured: unknown): string | undefined {
  if (typeof structured !== 'object' || structured === null) return undefined
  const value = (structured as { html?: unknown }).html
  return typeof value === 'string' ? value : undefined
}