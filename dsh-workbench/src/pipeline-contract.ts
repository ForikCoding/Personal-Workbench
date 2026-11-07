/**
 * Wire contract for the workbench's pipeline definitions.
 *
 * A pipeline is an ordered list of card ids. Each step runs the card it names, and the
 * card already carries the skill, template, directory, model and permission the step
 * needs — so a step is a reference plus, optionally, the instruction for that step.
 *
 * No run state lives here. A pipeline's runs are its cards' runs: this module stores
 * what the user arranged, never what happened.
 * @module dsh-workbench/pipeline-contract
 */

import { isWorkbenchCardId } from './layout-contract.ts'

/** Private route this plugin serves pipeline definitions on. */
export const WORKBENCH_PIPELINE_PATH = '/api/workbench/pipeline'

/** Version of the pipeline wire contract; a client reading another version refuses it. */
export const WORKBENCH_PIPELINE_API_VERSION = 1

/** Deployment cap on stored pipelines. */
export const WORKBENCH_PIPELINE_MAX_PIPELINES = 64

/** Maximum steps one pipeline may hold. */
export const WORKBENCH_PIPELINE_MAX_STEPS = 32

/** Maximum pipeline name length. */
export const WORKBENCH_PIPELINE_NAME_MAX_LENGTH = 60

/** Maximum length of one step's own instruction. */
export const WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH = 2_000

/** Body ceiling for a pipeline write. */
export const WORKBENCH_PIPELINE_MAX_BODY_BYTES = 64 * 1024

/** Closed set of pipeline route failures. */
export type WorkbenchPipelineErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid-request'
  | 'conflict'
  | 'storage-failure'

/**
 * One step: which card runs, and what this step is asked for.
 *
 * `cardId` is the whole configuration — the card answers "which skill, which document,
 * which folder, whose permission". The instruction is the only thing a step adds.
 */
export interface WorkbenchPipelineStep {
  /** Card this step runs. */
  readonly cardId: string
  /** What this step is asked to do, when it needs saying beyond the card's own skill. */
  readonly instruction?: string
}

/** One stored pipeline. */
export interface WorkbenchPipeline {
  /** Pipeline identity, a namespaced slug. */
  readonly id: string
  /** User-visible name. */
  readonly name: string
  /** Ordered steps; empty is a legal draft, not an error. */
  readonly steps: readonly WorkbenchPipelineStep[]
  /** When this definition last changed, in milliseconds since the epoch. */
  readonly updatedAt: number
}

/** Stored body of one pipeline: everything but the identity, which is the record key. */
export interface WorkbenchPipelineRecord {
  /** User-visible name. */
  readonly name: string
  /** Ordered steps. */
  readonly steps: readonly WorkbenchPipelineStep[]
  /** When this definition last changed. */
  readonly updatedAt: number
}

/** Complete stored state, as both halves read it. */
export interface WorkbenchPipelineSnapshot {
  /** Contract version. */
  readonly apiVersion: number
  /** Changes whenever the stored set changes; a write must name the current one. */
  readonly revision: string
  /** Pipelines, ordered by id so the snapshot is stable. */
  readonly pipelines: readonly WorkbenchPipeline[]
}

/** One write: the complete set, plus the revision it was based on. */
export interface WorkbenchPipelinePatch {
  /** Revision the writer saw. */
  readonly baseRevision: string
  /** The complete set to store. A pipeline absent from this list is deleted. */
  readonly pipelines: readonly WorkbenchPipeline[]
}

/** Why a decoded body is not a pipeline list. */
export interface WorkbenchPipelineInvalid {
  /** Discriminant for {@link parseWorkbenchPipelines}. */
  readonly status: 'invalid'
  /** Operator-facing reason naming the offending field. */
  readonly reason: string
}

/**
 * Whether a value is a usable pipeline identity.
 *
 * Same slug rule as a card id: these are storage keys and record keys, and two rules for
 * "a safe key" is one rule too many.
 * @param value - candidate identity.
 * @returns whether the value may be used as a pipeline id.
 */
export function isWorkbenchPipelineId(value: string): boolean {
  return isWorkbenchCardId(value)
}

/**
 * Validate a decoded pipeline list against the wire contract.
 *
 * One validator for both halves on purpose: the route and the service are two places a
 * list can arrive from, and a second copy of these rules would be a second answer.
 * @param value - decoded `pipelines` array.
 * @returns the normalized list, or the first reason it is not storable.
 */
export function parseWorkbenchPipelines(value: unknown): readonly WorkbenchPipeline[] | WorkbenchPipelineInvalid {
  if (!Array.isArray(value)) return invalid('pipelines must be an array')
  if (value.length > WORKBENCH_PIPELINE_MAX_PIPELINES) {
    return invalid(`a workspace may hold ${String(WORKBENCH_PIPELINE_MAX_PIPELINES)} pipelines, this one carries ${String(value.length)}`)
  }
  const seen = new Set<string>()
  const pipelines: WorkbenchPipeline[] = []
  for (const [index, raw] of value.entries()) {
    const parsed = parseOne(raw, index)
    if ('status' in parsed) return parsed
    if (seen.has(parsed.id)) return invalid(`pipeline id ${JSON.stringify(parsed.id)} appears twice`)
    seen.add(parsed.id)
    pipelines.push(parsed)
  }
  return pipelines
}

/**
 * Validate one pipeline.
 * @param raw - candidate value.
 * @param index - position in the list, for the reason text.
 * @returns the normalized pipeline, or the reason it is not storable.
 */
function parseOne(raw: unknown, index: number): WorkbenchPipeline | WorkbenchPipelineInvalid {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return invalid(`pipeline at index ${String(index)} must be an object`)
  }
  const candidate = raw as {
    id?: unknown
    name?: unknown
    steps?: unknown
    updatedAt?: unknown
  }
  if (typeof candidate.id !== 'string' || !isWorkbenchPipelineId(candidate.id)) {
    return invalid(`pipeline at index ${String(index)} needs a namespaced id`)
  }
  const id = candidate.id
  if (typeof candidate.name !== 'string') return invalid(`pipeline ${JSON.stringify(id)} needs a name`)
  const name = candidate.name.trim()
  if (name.length === 0) return invalid(`pipeline ${JSON.stringify(id)} needs a non-empty name`)
  if (name.length > WORKBENCH_PIPELINE_NAME_MAX_LENGTH) {
    return invalid(`pipeline ${JSON.stringify(id)} has a name longer than ${String(WORKBENCH_PIPELINE_NAME_MAX_LENGTH)} characters`)
  }
  if (typeof candidate.updatedAt !== 'number' || !Number.isFinite(candidate.updatedAt) || candidate.updatedAt < 0) {
    return invalid(`pipeline ${JSON.stringify(id)} needs a finite updatedAt`)
  }
  const steps = parseSteps(candidate.steps, id)
  if ('status' in steps) return steps
  return { id, name, steps, updatedAt: candidate.updatedAt }
}

/**
 * Validate one pipeline's step list.
 * @param value - candidate `steps` value.
 * @param pipelineId - owning pipeline, for the reason text.
 * @returns the normalized steps, or the reason they are not storable.
 */
function parseSteps(value: unknown, pipelineId: string): readonly WorkbenchPipelineStep[] | WorkbenchPipelineInvalid {
  if (!Array.isArray(value)) return invalid(`pipeline ${JSON.stringify(pipelineId)} needs a steps array`)
  if (value.length > WORKBENCH_PIPELINE_MAX_STEPS) {
    return invalid(`pipeline ${JSON.stringify(pipelineId)} carries ${String(value.length)} steps, above the ${String(WORKBENCH_PIPELINE_MAX_STEPS)} limit`)
  }
  const steps: WorkbenchPipelineStep[] = []
  for (const [index, raw] of value.entries()) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return invalid(`step ${String(index)} of pipeline ${JSON.stringify(pipelineId)} must be an object`)
    }
    const step = raw as { cardId?: unknown; instruction?: unknown }
    if (typeof step.cardId !== 'string' || !isWorkbenchCardId(step.cardId)) {
      return invalid(`step ${String(index)} of pipeline ${JSON.stringify(pipelineId)} needs a card id`)
    }
    if (step.instruction === undefined) {
      steps.push({ cardId: step.cardId })
      continue
    }
    if (typeof step.instruction !== 'string') {
      return invalid(`step ${String(index)} of pipeline ${JSON.stringify(pipelineId)} has a non-string instruction`)
    }
    const instruction = step.instruction.trim()
    if (instruction.length > WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH) {
      return invalid(`step ${String(index)} of pipeline ${JSON.stringify(pipelineId)} has an instruction longer than ${String(WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH)} characters`)
    }
    // An empty instruction is the same as none: it would otherwise reach the prompt as a
    // blank block and read as "the user asked for nothing in particular".
    steps.push(instruction.length === 0 ? { cardId: step.cardId } : { cardId: step.cardId, instruction })
  }
  return steps
}

/**
 * Build one invalid result.
 * @param reason - what is wrong.
 * @returns the failure carrying that reason.
 */
function invalid(reason: string): WorkbenchPipelineInvalid {
  return { status: 'invalid', reason }
}

/* ------------------------------------------------------------------ records */

/**
 * What one execution of a pipeline left behind.
 *
 * The definition above is what the user arranged; this is what happened. They have
 * different lifetimes and different authors, which is why they are different records: a
 * definition is rewritten whole by every config edit, and a run must not be, or renaming a
 * pipeline would delete its history.
 *
 * A record is a snapshot, not a pointer: it carries each step's region as it was when the
 * run settled, because reading a run from today's files answers with today's files.
 */

/** Version of the pipeline-run wire contract; a client reading another version refuses it. */
export const WORKBENCH_PIPELINE_RUN_API_VERSION = 1

/** Private route pipeline executions are read and appended on. */
export const WORKBENCH_PIPELINE_RUN_PATH = '/api/workbench/pipeline-run'

/** How many executions one pipeline keeps; the oldest falls off the end. */
export const WORKBENCH_PIPELINE_RUNS_PER_PIPELINE = 20

/**
 * Ceiling on every pipeline's runs together, so a deployment full of pipelines stays bounded.
 *
 * Twenty per pipeline times the pipeline cap is far more than one person scrolls through, and
 * a workbench with that many real executions has a storage problem this cap is not the
 * answer to. Trimming the oldest overall keeps the newest work readable.
 */
export const WORKBENCH_PIPELINE_RUN_MAX_TOTAL = 200

/** Body ceiling for one append; a run carries every step's region. */
export const WORKBENCH_PIPELINE_RUN_MAX_BODY_BYTES = 4 * 1024 * 1024

/** How much of one step's region a record keeps. */
export const WORKBENCH_PIPELINE_RUN_STEP_HTML_MAX_LENGTH = 96_000

/** How one step of an execution ended. A record is only written once a step is over. */
export type WorkbenchPipelineRunStepPhase = 'done' | 'failed' | 'stopped'

/** One step of one execution, as it stood when the run settled. */
export interface WorkbenchPipelineRunStep {
  /** The card this step ran. */
  readonly cardId: string
  /** How it ended. */
  readonly phase: WorkbenchPipelineRunStepPhase
  /** How long it took. */
  readonly tookMs?: number
  /** Why it failed, when it did. */
  readonly failure?: string
  /** The region it stored, or as much of it as a record keeps. */
  readonly html?: string
}

/** One execution of one pipeline. */
export interface WorkbenchPipelineRun {
  /** The pipeline it ran. */
  readonly pipelineId: string
  /** Ordinal within that pipeline, counted from one; the Host's to assign. */
  readonly no: number
  /** When it started, in milliseconds since the epoch. */
  readonly startedAt: number
  /** How long the whole execution took. */
  readonly tookMs: number
  /** How it ended. A record is only written for an execution that ended. */
  readonly phase: 'settled' | 'failed' | 'stopped'
  /** Whether it ran the whole chain, one step, or one step again on request. */
  readonly scope: 'full' | 'single' | 'refine'
  /** The step a `single` or `refine` run was about, zero-based. */
  readonly only?: number
  /** What the review asked for, when the run was one. */
  readonly instruction?: string
  /** One entry per step the run touched, in step order. */
  readonly steps: readonly WorkbenchPipelineRunStep[]
}

/** An execution as a client submits it: everything but the number, which the Host assigns. */
export type WorkbenchPipelineRunDraft = Omit<WorkbenchPipelineRun, 'no'>

/** Everything stored for one read. */
export interface WorkbenchPipelineRunSnapshot {
  /** Contract version. */
  readonly apiVersion: number
  /** Records, newest first. */
  readonly runs: readonly WorkbenchPipelineRun[]
}

/** Why a submitted execution is not a record. */
export interface WorkbenchPipelineRunInvalid {
  /** Discriminant for {@link parseWorkbenchPipelineRunDraft}. */
  readonly status: 'invalid'
  /** What is wrong. */
  readonly reason: string
}

/**
 * Validate one submitted execution against the wire contract.
 *
 * The two halves of the app are separate processes, so this validates what the Host is
 * handed rather than trusting the body. Numbers are not accepted: the ordinal belongs to the
 * Host, which is the only side that can hand two runs different ones.
 * @param value - the decoded body.
 * @returns the draft, or what is wrong with it.
 */
export function parseWorkbenchPipelineRunDraft(
  value: unknown,
): WorkbenchPipelineRunDraft | WorkbenchPipelineRunInvalid {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { status: 'invalid', reason: 'body must be an object' }
  }
  const body = value as Record<string, unknown>
  const pipelineId = body.pipelineId
  if (typeof pipelineId !== 'string' || !isWorkbenchPipelineId(pipelineId)) {
    return { status: 'invalid', reason: 'pipelineId must be a pipeline id' }
  }
  const startedAt = body.startedAt
  if (typeof startedAt !== 'number' || !Number.isFinite(startedAt) || startedAt < 0) {
    return { status: 'invalid', reason: 'startedAt must be a non-negative number' }
  }
  const tookMs = body.tookMs
  if (typeof tookMs !== 'number' || !Number.isFinite(tookMs) || tookMs < 0) {
    return { status: 'invalid', reason: 'tookMs must be a non-negative number' }
  }
  const phase = body.phase
  if (phase !== 'settled' && phase !== 'failed' && phase !== 'stopped') {
    return { status: 'invalid', reason: 'phase must be settled, failed, or stopped' }
  }
  const scope = body.scope
  if (scope !== 'full' && scope !== 'single' && scope !== 'refine') {
    return { status: 'invalid', reason: 'scope must be full, single, or refine' }
  }
  const only = body.only
  if (only !== undefined && (typeof only !== 'number' || !Number.isInteger(only) || only < 0)) {
    return { status: 'invalid', reason: 'only must be a zero-based step index' }
  }
  const instruction = body.instruction
  if (instruction !== undefined && typeof instruction !== 'string') {
    return { status: 'invalid', reason: 'instruction must be a string' }
  }
  if (instruction !== undefined && instruction.length > WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH) {
    return { status: 'invalid', reason: `instruction is longer than ${String(WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH)} characters` }
  }
  const steps = parseRunSteps(body.steps)
  if ('status' in steps) return steps
  return {
    pipelineId,
    startedAt,
    tookMs,
    phase,
    scope,
    ...only === undefined ? {} : { only },
    ...instruction === undefined ? {} : { instruction },
    steps,
  }
}

/**
 * Validate one execution's step list.
 * @param value - the decoded list.
 * @returns the steps, or what is wrong with them.
 */
function parseRunSteps(value: unknown): readonly WorkbenchPipelineRunStep[] | WorkbenchPipelineRunInvalid {
  if (!Array.isArray(value)) return { status: 'invalid', reason: 'steps must be an array' }
  if (value.length > WORKBENCH_PIPELINE_MAX_STEPS) {
    return { status: 'invalid', reason: `a run of more than ${String(WORKBENCH_PIPELINE_MAX_STEPS)} steps is not a pipeline` }
  }
  const steps: WorkbenchPipelineRunStep[] = []
  for (const [index, raw] of value.entries()) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return { status: 'invalid', reason: `step ${String(index)} is not an object` }
    }
    const step = raw as Record<string, unknown>
    const cardId = step.cardId
    if (typeof cardId !== 'string' || !isWorkbenchCardId(cardId)) {
      return { status: 'invalid', reason: `step ${String(index)} does not name a card` }
    }
    const phase = step.phase
    if (phase !== 'done' && phase !== 'failed' && phase !== 'stopped') {
      return { status: 'invalid', reason: `step ${String(index)} phase must be done, failed, or stopped` }
    }
    const tookMs = step.tookMs
    if (tookMs !== undefined && (typeof tookMs !== 'number' || !Number.isFinite(tookMs) || tookMs < 0)) {
      return { status: 'invalid', reason: `step ${String(index)} tookMs must be a non-negative number` }
    }
    const failure = step.failure
    if (failure !== undefined && typeof failure !== 'string') {
      return { status: 'invalid', reason: `step ${String(index)} failure must be a string` }
    }
    const html = step.html
    if (html !== undefined && typeof html !== 'string') {
      return { status: 'invalid', reason: `step ${String(index)} html must be a string` }
    }
    if (html !== undefined && html.length > WORKBENCH_PIPELINE_RUN_STEP_HTML_MAX_LENGTH) {
      return { status: 'invalid', reason: `step ${String(index)} html is longer than ${String(WORKBENCH_PIPELINE_RUN_STEP_HTML_MAX_LENGTH)} characters` }
    }
    steps.push({
      cardId,
      phase,
      ...tookMs === undefined ? {} : { tookMs },
      ...failure === undefined ? {} : { failure },
      ...html === undefined ? {} : { html },
    })
  }
  return steps
}
