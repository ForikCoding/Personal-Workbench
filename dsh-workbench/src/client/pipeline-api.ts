/**
 * Browser-side client for the workbench's private pipeline route.
 *
 * Every failure is a structured result rather than a throw, because the page has to
 * render an unavailable state instead of an error boundary. Responses are validated
 * here: this is a process boundary, so the Host's JSON is input, not a typed value.
 * @module dsh-workbench/client/pipeline-api
 */

import type { WorkbenchPipeline, WorkbenchPipelinePatch, WorkbenchPipelineSnapshot } from '../pipeline-contract.ts'
import {
  WORKBENCH_PIPELINE_API_VERSION,
  WORKBENCH_PIPELINE_MAX_PIPELINES,
  WORKBENCH_PIPELINE_PATH,
  isWorkbenchPipelineId,
} from '../pipeline-contract.ts'
import { isWorkbenchCardId } from '../layout-contract.ts'

/** Fetch seam so tests can drive transport without a server. */
export type PipelineFetchLike = (input: string, init?: RequestInit) => Promise<Response>

/** Outcome of one read. */
export type WorkbenchPipelinesRead =
  | { readonly status: 'ok'; readonly snapshot: WorkbenchPipelineSnapshot }
  | { readonly status: 'unavailable'; readonly reason: string }

/** Outcome of one write. */
export type WorkbenchPipelinesWrite =
  | { readonly status: 'ok'; readonly snapshot: WorkbenchPipelineSnapshot }
  | { readonly status: 'conflict'; readonly snapshot: WorkbenchPipelineSnapshot }
  | { readonly status: 'failed'; readonly reason: string }

/** The read/write face the pipeline view consumes. */
export interface WorkbenchPipelineApi {
  /**
   * Read the stored pipelines.
   * @param signal - caller-owned cancellation.
   * @returns the snapshot, or an unavailable reason.
   */
  read(signal?: AbortSignal): Promise<WorkbenchPipelinesRead>
  /**
   * Send one write; writes are serialized, so this resolves after earlier ones.
   * @param patch - the complete set plus the revision it was based on.
   * @returns the write outcome.
   */
  write(patch: WorkbenchPipelinePatch): Promise<WorkbenchPipelinesWrite>
}

/** What the API needs from its host. */
export interface WorkbenchPipelineApiOptions {
  /** Transport; defaults to `globalThis.fetch`. */
  readonly fetcher?: PipelineFetchLike
}

/**
 * Build the pipeline API.
 * @param options - transport seam.
 * @returns the read/write face.
 */
export function createWorkbenchPipelineApi(options: WorkbenchPipelineApiOptions = {}): WorkbenchPipelineApi {
  const fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init))
  // One write at a time: a rename followed by a step edit would otherwise both carry the
  // revision they read, and the second would lose. Serializing keeps the second write
  // reading the revision the first one committed.
  let tail: Promise<WorkbenchPipelinesWrite> = Promise.resolve({
    status: 'failed',
    reason: 'no write was issued',
  })

  const send = async (patch: WorkbenchPipelinePatch): Promise<WorkbenchPipelinesWrite> => {
    let response: Response
    try {
      response = await fetcher(WORKBENCH_PIPELINE_PATH, {
        method: 'PATCH',
        credentials: 'same-origin',
        redirect: 'error',
        cache: 'no-store',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
    } catch (error) {
      return { status: 'failed', reason: `pipeline request failed: ${messageOf(error)}` }
    }
    if (response.status === 409) {
      const snapshot = await readSnapshot(response)
      return snapshot === undefined
        ? { status: 'failed', reason: 'pipeline write was based on a stale revision' }
        : { status: 'conflict', snapshot }
    }
    if (!response.ok) {
      return { status: 'failed', reason: await reasonOf(response) }
    }
    const snapshot = await readSnapshot(response)
    return snapshot === undefined
      ? { status: 'failed', reason: 'pipeline response could not be read' }
      : { status: 'ok', snapshot }
  }

  return {
    async read(signal) {
      let response: Response
      try {
        response = await fetcher(WORKBENCH_PIPELINE_PATH, {
          method: 'GET',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
          ...signal === undefined ? {} : { signal },
        })
      } catch (error) {
        return { status: 'unavailable', reason: `pipeline request failed: ${messageOf(error)}` }
      }
      if (!response.ok) return { status: 'unavailable', reason: await reasonOf(response) }
      const snapshot = await readSnapshot(response)
      return snapshot === undefined
        ? { status: 'unavailable', reason: 'pipeline response could not be read' }
        : { status: 'ok', snapshot }
    },
    write(patch) {
      const next = tail.then(async () => await send(patch))
      tail = next
      return next
    },
  }
}

/**
 * Read one response body as a snapshot.
 * @param response - the response to read.
 * @returns the snapshot, or undefined when the body is not one.
 */
async function readSnapshot(response: Response): Promise<WorkbenchPipelineSnapshot | undefined> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return undefined
  }
  return decodeSnapshot(body)
}

/**
 * Validate one decoded snapshot.
 * @param value - decoded body.
 * @returns the snapshot, or undefined when a field is outside the contract.
 */
export function decodeSnapshot(value: unknown): WorkbenchPipelineSnapshot | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const body = value as { apiVersion?: unknown; revision?: unknown; pipelines?: unknown }
  if (body.apiVersion !== WORKBENCH_PIPELINE_API_VERSION) return undefined
  if (typeof body.revision !== 'string') return undefined
  const pipelines = decodeList(body.pipelines)
  if (pipelines === undefined) return undefined
  return { apiVersion: WORKBENCH_PIPELINE_API_VERSION, revision: body.revision, pipelines }
}

/**
 * Validate one decoded pipeline list.
 * @param value - decoded `pipelines` field.
 * @returns the list, or undefined when an entry is outside the contract.
 */
function decodeList(value: unknown): readonly WorkbenchPipeline[] | undefined {
  if (!Array.isArray(value) || value.length > WORKBENCH_PIPELINE_MAX_PIPELINES) return undefined
  const pipelines: WorkbenchPipeline[] = []
  for (const raw of value) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
    const entry = raw as { id?: unknown; name?: unknown; steps?: unknown; updatedAt?: unknown }
    if (typeof entry.id !== 'string' || !isWorkbenchPipelineId(entry.id)) return undefined
    if (typeof entry.name !== 'string' || typeof entry.updatedAt !== 'number') return undefined
    if (!Array.isArray(entry.steps)) return undefined
    const steps: { cardId: string; instruction?: string }[] = []
    for (const rawStep of entry.steps) {
      if (typeof rawStep !== 'object' || rawStep === null || Array.isArray(rawStep)) return undefined
      const step = rawStep as { cardId?: unknown; instruction?: unknown }
      if (typeof step.cardId !== 'string' || !isWorkbenchCardId(step.cardId)) return undefined
      if (step.instruction !== undefined && typeof step.instruction !== 'string') return undefined
      steps.push({
        cardId: step.cardId,
        ...step.instruction === undefined ? {} : { instruction: step.instruction },
      })
    }
    pipelines.push({ id: entry.id, name: entry.name, steps, updatedAt: entry.updatedAt })
  }
  return pipelines
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
  return `pipeline request failed with ${String(response.status)}`
}

/**
 * Render one failure for a log line or a notice.
 * @param error - the failure.
 * @returns a readable message.
 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
