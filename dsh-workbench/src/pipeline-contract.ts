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
import type { WorkbenchCardWorkspace } from './skill-card-contract.ts'
import { WORKBENCH_RUN_DIRECTIVE_MAX_LENGTH, isWorkbenchCardWorkspace } from './skill-card-contract.ts'
import {
  isWorkbenchParamName,
  paramValueProblem,
  WORKBENCH_PARAM_MAX_NAMES,
} from './pipeline-params.ts'

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
  /**
   * The directory every step of this pipeline runs in.
   *
   * The pipeline owns this, not the cards: one card can be a step of two pipelines working on
   * different checkouts, and a directory written onto the cards would quietly make those two share
   * one. When set, this is the directory a run is told; a step's own card directory stays where it
   * is and is not consulted.
   *
   * Absent means the pipeline says nothing about where it runs, and each step falls back to its own
   * card — which is what every pipeline written before this field existed does.
   */
  readonly workspace?: WorkbenchCardWorkspace
  /** When this definition last changed, in milliseconds since the epoch. */
  readonly updatedAt: number
}

/** Stored body of one pipeline: everything but the identity, which is the record key. */
export interface WorkbenchPipelineRecord {
  /** User-visible name. */
  readonly name: string
  /** Ordered steps. */
  readonly steps: readonly WorkbenchPipelineStep[]
  /** The directory every step of it runs in, when it names one. */
  readonly workspace?: WorkbenchCardWorkspace
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
    workspace?: unknown
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
  // The same directory rule the cards use: one absolute path, checked by the one predicate both
  // halves already share, so a path this cannot store is a path no card could store either.
  const workspace = candidate.workspace
  if (workspace !== undefined && !isWorkbenchCardWorkspace(workspace)) {
    return invalid(`pipeline ${JSON.stringify(id)} has a workspace that is not an absolute directory`)
  }
  return {
    id,
    name,
    steps,
    ...workspace === undefined ? {} : { workspace: { path: workspace.path } },
    updatedAt: candidate.updatedAt,
  }
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

/**
 * Ceiling on the directory one step records.
 *
 * The pointer a card's template carries is already bounded by one; this is the same bound on
 * what a run resolved it to, so a value cannot make a record longer than a record may be.
 */
export const WORKBENCH_PIPELINE_RUN_DIR_MAX_LENGTH = 512

/** One step of one execution, as it stood when the run settled. */
export interface WorkbenchPipelineRunStep {
  /** The card this step ran. */
  readonly cardId: string
  /** How it ended. */
  readonly phase: WorkbenchPipelineRunStepPhase
  /**
   * The directory this step's card wrote to, with the run's values put in place.
   *
   * The card's template states the pointer, and a pointer may name values the run was told
   * (`{任务编号}/docs/任务分析`). What the template says is therefore not where the files are;
   * this is. Recorded here rather than re-derived from today's template, because the template can
   * be edited after the run and yesterday's product would then be looked for in today's folder.
   */
  readonly dir?: string
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
  /**
   * First step a whole run covered, zero-based; absent means it began at the first step.
   *
   * A chain is allowed to be re-run from any step whose predecessors have finished, so a
   * `full` record is not always a record of all of it. Without this field two records — one
   * that took every step, one that took the last two — read identically, and the steps the
   * second one left alone look as if it had replaced them.
   */
  readonly from?: number
  /** What the review asked for, when the run was one. */
  readonly instruction?: string
  /**
   * The sentence the run was given once for all of its steps.
   *
   * Not {@link instruction}: that one is a review's request, addressed at a single step's product.
   * This one is the answer to "which task is this run", typed in the run dialog before the chain
   * starts, delivered to every step's prompt as `<pipeline_instruction>`, and repeated here so
   * the record says what the run was told rather than what its folders happen to be named.
   *
   * Absent for a run that was told nothing — every run started before this field existed, and
   * every run whose dialog was left blank.
   */
  readonly directive?: string
  /**
   * The values this run was told, by name.
   *
   * Kept for two readers: the record is what makes a run legible afterwards ("which task number
   * did this cover"), and the next run of the same pipeline opens on these values instead of
   * asking for them again. Absent when the pipeline's cards named nothing.
   */
  readonly params?: Readonly<Record<string, string>>
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
  const from = body.from
  if (from !== undefined && (typeof from !== 'number' || !Number.isInteger(from) || from < 0)) {
    return { status: 'invalid', reason: 'from must be a zero-based step index' }
  }
  const instruction = body.instruction
  if (instruction !== undefined && typeof instruction !== 'string') {
    return { status: 'invalid', reason: 'instruction must be a string' }
  }
  if (instruction !== undefined && instruction.length > WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH) {
    return { status: 'invalid', reason: `instruction is longer than ${String(WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH)} characters` }
  }
  // The sentence typed once for the whole run. Trimmed to nothing reads as absent, which is
  // what an emptied field means; anything else is stored as written, up to the bound shared
  // with the run request that carried it.
  const directive = body.directive
  if (directive !== undefined && typeof directive !== 'string') {
    return { status: 'invalid', reason: 'directive must be a string' }
  }
  if (directive !== undefined && directive.length > WORKBENCH_RUN_DIRECTIVE_MAX_LENGTH) {
    return { status: 'invalid', reason: `directive is longer than ${String(WORKBENCH_RUN_DIRECTIVE_MAX_LENGTH)} characters` }
  }
  const trimmedDirective = directive?.trim()
  const params = parseRunParams(body.params)
  if (!params.ok) return params.invalid
  const steps = parseRunSteps(body.steps)
  if ('status' in steps) return steps
  return {
    pipelineId,
    startedAt,
    tookMs,
    phase,
    scope,
    ...only === undefined ? {} : { only },
    ...from === undefined ? {} : { from },
    ...instruction === undefined ? {} : { instruction },
    ...trimmedDirective === undefined || trimmedDirective === '' ? {} : { directive: trimmedDirective },
    ...params.values === undefined ? {} : { params: params.values },
    steps,
  }
}

/**
 * Validate the values one execution was told.
 *
 * Checks the same two rules the panel applies, because the record's reader applies them too: a
 * name with a brace in it could not have been asked for, and a value with a slash in it never
 * reached a directory. A body that carries nothing gets `undefined` rather than an empty map, so a
 * record of a run with no parameters stays distinguishable from one whose values were erased.
 * @param value - the decoded `params` field.
 * @returns the values, `undefined` when absent, or what is wrong with them.
 */
function parseRunParams(
  value: unknown,
): ParsedRunParams {
  if (value === undefined) return { ok: true }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, invalid: { status: 'invalid', reason: 'params must be an object' } }
  }
  const entries = Object.entries(value as Record<string, unknown>)
  // An empty map is the same statement as no map: this run was told nothing. Keeping `{}` would
  // give the record two spellings of "no parameters" and make a reader decide which it believes.
  if (entries.length === 0) return { ok: true }
  if (entries.length > WORKBENCH_PARAM_MAX_NAMES) {
    return { ok: false, invalid: { status: 'invalid', reason: `params carries more than ${String(WORKBENCH_PARAM_MAX_NAMES)} names` } }
  }
  const values: Record<string, string> = {}
  for (const [name, raw] of entries) {
    if (!isWorkbenchParamName(name)) {
      return { ok: false, invalid: { status: 'invalid', reason: `param name ${JSON.stringify(name)} is not a token name` } }
    }
    if (typeof raw !== 'string') {
      return { ok: false, invalid: { status: 'invalid', reason: `param ${JSON.stringify(name)} must be a string` } }
    }
    const problem = paramValueProblem(raw)
    if (problem !== undefined) {
      return { ok: false, invalid: { status: 'invalid', reason: `param ${JSON.stringify(name)} is ${problem}` } }
    }
    values[name] = raw.trim()
  }
  return { ok: true, values }
}

/**
 * The values a draft carried, or why they are not storable.
 *
 * A union rather than a nullable record: `params` is user-named, so a name could be `status` and a
 * value could be `invalid` — a result narrowed by what it contains would answer a question about
 * the user's data with its own bookkeeping.
 */
type ParsedRunParams =
  | { readonly ok: true; readonly values?: Readonly<Record<string, string>> }
  | { readonly ok: false; readonly invalid: WorkbenchPipelineRunInvalid }

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
    // Where this step's files are, as the run resolved them. An empty one is refused rather than
    // kept: "the run wrote nowhere" is said by the field's absence, and an empty path would be
    // read as a directory the panel could list.
    const dir = step.dir
    if (dir !== undefined && (typeof dir !== 'string' || dir.trim() === '')) {
      return { status: 'invalid', reason: `step ${String(index)} dir must be a non-empty string` }
    }
    if (dir !== undefined && dir.length > WORKBENCH_PIPELINE_RUN_DIR_MAX_LENGTH) {
      return { status: 'invalid', reason: `step ${String(index)} dir is longer than ${String(WORKBENCH_PIPELINE_RUN_DIR_MAX_LENGTH)} characters` }
    }
    steps.push({
      cardId,
      phase,
      ...tookMs === undefined ? {} : { tookMs },
      ...failure === undefined ? {} : { failure },
      ...html === undefined ? {} : { html },
      ...dir === undefined ? {} : { dir },
    })
  }
  return steps
}
