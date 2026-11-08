/**
 * Browser-side client for the workbench's private pipeline-execution route.
 *
 * Same shape as the pipeline client: every failure is a structured result rather than a
 * throw, and the Host's JSON is validated here because this is a process boundary. A record
 * that does not decode is dropped rather than failing the read — one unreadable execution
 * must not cost the panel the history it can read.
 * @module dsh-workbench/client/pipeline-runs-api
 */

import type { WorkbenchPipelineRun, WorkbenchPipelineRunDraft } from '../pipeline-contract.ts'
import { WORKBENCH_PIPELINE_RUN_API_VERSION, WORKBENCH_PIPELINE_RUN_PATH } from '../pipeline-contract.ts'
import type { PipelineFetchLike } from './pipeline-api.ts'

/** Outcome of one read. */
export type WorkbenchPipelineRunsRead =
  | { readonly status: 'ok'; readonly runs: readonly WorkbenchPipelineRun[] }
  | { readonly status: 'unavailable'; readonly reason: string }

/** Outcome of one append. */
export type WorkbenchPipelineRunsAppend =
  | { readonly status: 'ok'; readonly run: WorkbenchPipelineRun }
  | { readonly status: 'failed'; readonly reason: string }

/** The read/append face the run engine consumes. */
export interface WorkbenchPipelineRunsApi {
  /**
   * Read every stored execution.
   * @param signal - caller-owned cancellation.
   * @returns the records, or an unavailable reason.
   */
  read(signal?: AbortSignal): Promise<WorkbenchPipelineRunsRead>
  /**
   * Store one finished execution; the Host numbers it.
   * @param draft - the execution as the run engine saw it.
   * @returns the numbered record, or why it was not stored.
   */
  append(draft: WorkbenchPipelineRunDraft): Promise<WorkbenchPipelineRunsAppend>
}

/** What the API needs from its host. */
export interface WorkbenchPipelineRunsApiOptions {
  /** Transport; defaults to `globalThis.fetch`. */
  readonly fetcher?: PipelineFetchLike
}

/**
 * Build the execution-record API.
 * @param options - transport seam.
 * @returns the read/append face.
 */
export function createWorkbenchPipelineRunsApi(
  options: WorkbenchPipelineRunsApiOptions = {},
): WorkbenchPipelineRunsApi {
  const fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init))

  return {
    read: async (signal) => {
      let response: Response
      try {
        response = await fetcher(WORKBENCH_PIPELINE_RUN_PATH, {
          method: 'GET',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
          ...signal === undefined ? {} : { signal },
        })
      } catch (error) {
        return { status: 'unavailable', reason: `pipeline runs request failed: ${messageOf(error)}` }
      }
      if (!response.ok) return { status: 'unavailable', reason: await reasonOf(response) }
      const body = await bodyOf(response)
      if (body === undefined) return { status: 'unavailable', reason: 'pipeline runs answered with something else' }
      return { status: 'ok', runs: body }
    },
    append: async (draft) => {
      let response: Response
      try {
        response = await fetcher(WORKBENCH_PIPELINE_RUN_PATH, {
          method: 'POST',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        })
      } catch (error) {
        return { status: 'failed', reason: `pipeline run request failed: ${messageOf(error)}` }
      }
      if (!response.ok) return { status: 'failed', reason: await reasonOf(response) }
      const body = await bodyOf(response)
      if (body === undefined) return { status: 'failed', reason: 'pipeline run answered with something else' }
      // The stored record is the answer, not the one that was sent: the number on it is the
      // Host's, and the row the panel draws has to carry that number.
      const stored = body.find(run => run.pipelineId === draft.pipelineId && run.startedAt === draft.startedAt)
      if (stored === undefined) return { status: 'failed', reason: 'the stored run is not in the answer' }
      return { status: 'ok', run: stored }
    },
  }
}

/**
 * Decode a response body into the records it carries.
 * @param response - an ok response.
 * @returns the records, or undefined when the body is not this contract.
 */
async function bodyOf(response: Response): Promise<readonly WorkbenchPipelineRun[] | undefined> {
  let value: unknown
  try {
    value = await response.json()
  } catch {
    return undefined
  }
  if (typeof value !== 'object' || value === null) return undefined
  const body = value as { apiVersion?: unknown; runs?: unknown }
  if (body.apiVersion !== WORKBENCH_PIPELINE_RUN_API_VERSION) return undefined
  if (!Array.isArray(body.runs)) return undefined
  const runs: WorkbenchPipelineRun[] = []
  for (const entry of body.runs) {
    const run = decodeRun(entry)
    if (run !== undefined) runs.push(run)
  }
  return runs
}

/**
 * Decode one record.
 * @param value - one entry of the `runs` list.
 * @returns the record, or undefined when it is not one.
 */
function decodeRun(value: unknown): WorkbenchPipelineRun | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const run = value as Record<string, unknown>
  if (typeof run.pipelineId !== 'string' || run.pipelineId.length === 0) return undefined
  if (typeof run.no !== 'number' || !Number.isInteger(run.no) || run.no < 1) return undefined
  if (typeof run.startedAt !== 'number' || !Number.isFinite(run.startedAt)) return undefined
  if (typeof run.tookMs !== 'number' || !Number.isFinite(run.tookMs)) return undefined
  if (run.phase !== 'settled' && run.phase !== 'failed' && run.phase !== 'stopped') return undefined
  if (run.scope !== 'full' && run.scope !== 'single' && run.scope !== 'refine') return undefined
  const only = typeof run.only === 'number' && Number.isInteger(run.only) && run.only >= 0 ? run.only : undefined
  const from = typeof run.from === 'number' && Number.isInteger(run.from) && run.from >= 0 ? run.from : undefined
  const instruction = typeof run.instruction === 'string' ? run.instruction : undefined
  const steps = decodeSteps(run.steps)
  if (steps === undefined) return undefined
  return {
    pipelineId: run.pipelineId,
    no: run.no,
    startedAt: run.startedAt,
    tookMs: run.tookMs,
    phase: run.phase,
    scope: run.scope,
    ...only === undefined ? {} : { only },
    ...from === undefined ? {} : { from },
    ...instruction === undefined ? {} : { instruction },
    steps,
  }
}

/**
 * Decode one record's step list.
 * @param value - the `steps` field.
 * @returns the steps, or undefined when the list is not one.
 */
function decodeSteps(value: unknown): WorkbenchPipelineRun['steps'] | undefined {
  if (!Array.isArray(value)) return undefined
  const steps: { cardId: string; phase: 'done' | 'failed' | 'stopped'; tookMs?: number; failure?: string; html?: string }[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return undefined
    const step = entry as Record<string, unknown>
    if (typeof step.cardId !== 'string' || step.cardId.length === 0) return undefined
    if (step.phase !== 'done' && step.phase !== 'failed' && step.phase !== 'stopped') return undefined
    const tookMs = typeof step.tookMs === 'number' && Number.isFinite(step.tookMs) ? step.tookMs : undefined
    const failure = typeof step.failure === 'string' ? step.failure : undefined
    const html = typeof step.html === 'string' ? step.html : undefined
    steps.push({
      cardId: step.cardId,
      phase: step.phase,
      ...tookMs === undefined ? {} : { tookMs },
      ...failure === undefined ? {} : { failure },
      ...html === undefined ? {} : { html },
    })
  }
  return steps
}

/**
 * Read one failure body's message.
 * @param response - the failed response.
 * @returns the Host's own message, or the status.
 */
async function reasonOf(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: { message?: unknown } }
    const message = body.error?.message
    if (typeof message === 'string' && message.length > 0) return message
  } catch {
    // A body that is not JSON is described by its status.
  }
  return `pipeline runs request failed with ${String(response.status)}`
}

/**
 * Render one failure for a log line or a notice.
 * @param error - the failure.
 * @returns a readable message.
 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
