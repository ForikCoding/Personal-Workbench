/**
 * Browser-side client for the workbench's private layout route.
 *
 * Every failure is a structured result rather than a throw, because the page
 * has to render an unavailable state instead of an error boundary. Responses
 * are validated here: this is a process boundary, so the Host's JSON is input,
 * not a typed value.
 * @module dsh-workbench/client/layout-api
 */

import type {
  WorkbenchLayoutPatch,
  WorkbenchLayoutSnapshot,
} from '../layout-contract.ts'
import {
  WORKBENCH_LAYOUT_API_VERSION,
  WORKBENCH_LAYOUT_MAX_ENTRIES,
  WORKBENCH_LAYOUT_PATH,
  isWorkbenchCardId,
} from '../layout-contract.ts'

/** Fetch seam so tests can drive transport without a server. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/** Outcome of one read. */
export type WorkbenchReadResult =
  | { readonly status: 'ok'; readonly snapshot: WorkbenchLayoutSnapshot }
  | { readonly status: 'unavailable'; readonly reason: string }

/** Outcome of one write. */
export type WorkbenchWriteResult =
  | { readonly status: 'ok'; readonly snapshot: WorkbenchLayoutSnapshot }
  | { readonly status: 'conflict'; readonly snapshot: WorkbenchLayoutSnapshot }
  | { readonly status: 'failed'; readonly reason: string }

/** The read/write face the controller consumes. */
export interface WorkbenchLayoutApi {
  /**
   * Read the stored layout.
   * @param signal - caller-owned cancellation.
   * @returns the snapshot, or an unavailable reason.
   */
  read(signal?: AbortSignal): Promise<WorkbenchReadResult>
  /**
   * Send one patch; writes are serialized, so this resolves after earlier ones.
   * @param patch - changed cards plus the revision they were based on.
   * @returns the write outcome.
   */
  write(patch: WorkbenchLayoutPatch): Promise<WorkbenchWriteResult>
}

/** Queue depth above which the oldest waiting change is dropped. */
const MAX_QUEUED_WRITES = 8

/** Backoff before the single retry of a transport failure. */
const RETRY_DELAY_MS = 200

/** What the API needs from its host. */
export interface WorkbenchLayoutApiOptions {
  /** Transport; defaults to `globalThis.fetch`. */
  readonly fetcher?: FetchLike
  /** Delay seam for the retry backoff, so tests do not sleep. */
  readonly delay?: (ms: number) => Promise<void>
}

/**
 * Build the layout API.
 * @param options - transport and delay seams.
 * @returns the read/write face.
 */
export function createWorkbenchLayoutApi(options: WorkbenchLayoutApiOptions = {}): WorkbenchLayoutApi {
  const fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init))
  const delay = options.delay ?? (ms => new Promise<void>(resolve => { setTimeout(resolve, ms) }))
  let tail: Promise<WorkbenchWriteResult> = Promise.resolve({ status: 'failed', reason: 'no write was issued' })
  let queued = 0

  const send = async (patch: WorkbenchLayoutPatch): Promise<WorkbenchWriteResult> => {
    const attempt = async (): Promise<WorkbenchWriteResult> => {
      let response: Response
      try {
        response = await fetcher(WORKBENCH_LAYOUT_PATH, {
          method: 'PATCH',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
      } catch (error) {
        return { status: 'failed', reason: `layout request failed: ${messageOf(error)}` }
      }
      if (response.status === 409) {
        const snapshot = await readSnapshot(response)
        return snapshot === undefined
          ? { status: 'failed', reason: 'conflict response was not readable' }
          : { status: 'conflict', snapshot }
      }
      if (!response.ok) return { status: 'failed', reason: `layout route answered ${String(response.status)}` }
      const snapshot = await readSnapshot(response)
      return snapshot === undefined
        ? { status: 'failed', reason: 'layout response did not match the contract' }
        : { status: 'ok', snapshot }
    }

    const first = await attempt()
    // A transport failure is worth one retry; a rejected contract is not.
    if (first.status === 'failed' && first.reason.startsWith('layout request failed')) {
      await delay(RETRY_DELAY_MS)
      return await attempt()
    }
    return first
  }

  return {
    async read(signal) {
      let response: Response
      try {
        response = await fetcher(WORKBENCH_LAYOUT_PATH, {
          method: 'GET',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
          ...signal === undefined ? {} : { signal },
        })
      } catch (error) {
        return { status: 'unavailable', reason: `layout request failed: ${messageOf(error)}` }
      }
      if (!response.ok) return { status: 'unavailable', reason: `layout route answered ${String(response.status)}` }
      const snapshot = await readSnapshot(response)
      return snapshot === undefined
        ? { status: 'unavailable', reason: 'layout response did not match the contract' }
        : { status: 'ok', snapshot }
    },
    async write(patch) {
      if (queued >= MAX_QUEUED_WRITES) {
        return { status: 'failed', reason: 'too many pending layout changes' }
      }
      queued += 1
      const result = tail.then(() => send(patch)).finally(() => { queued -= 1 })
      tail = result
      return await result
    },
  }
}

/**
 * Parse one layout response body.
 * @param response - response to read.
 * @returns the snapshot, or undefined when the body is not this contract.
 */
async function readSnapshot(response: Response): Promise<WorkbenchLayoutSnapshot | undefined> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return undefined
  }
  return parseSnapshot(body)
}

/**
 * Validate one snapshot body.
 * @param value - decoded body.
 * @returns the snapshot, or undefined when a field is outside the contract.
 */
export function parseSnapshot(value: unknown): WorkbenchLayoutSnapshot | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const body = value as { apiVersion?: unknown; revision?: unknown; entries?: unknown }
  if (body.apiVersion !== WORKBENCH_LAYOUT_API_VERSION) return undefined
  if (typeof body.revision !== 'string') return undefined
  if (!Array.isArray(body.entries) || body.entries.length > WORKBENCH_LAYOUT_MAX_ENTRIES) return undefined
  const entries: { id: string; position?: number }[] = []
  for (const raw of body.entries) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
    const entry = raw as { id?: unknown; position?: unknown }
    if (typeof entry.id !== 'string' || !isWorkbenchCardId(entry.id)) return undefined
    if (entry.position !== undefined && (typeof entry.position !== 'number' || !Number.isFinite(entry.position) || entry.position < 0)) return undefined
    entries.push({
      id: entry.id,
      ...entry.position === undefined ? {} : { position: entry.position },
    })
  }
  return { revision: body.revision, entries }
}

/**
 * Render one failure for a log line or a notice.
 * @param error - the failure.
 * @returns a readable message.
 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
