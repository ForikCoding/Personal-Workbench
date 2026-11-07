/**
 * The workbench's private pipeline-execution route.
 *
 * Same fence and same two-sided validation as the pipeline definitions: the caller is a
 * browser across a process boundary, so this half validates what it is handed before the
 * service sees it. Reads answer with every pipeline's records at once — the panel shows one
 * pipeline at a time but knows which pipelines exist, so filtering here would mean a request
 * per pipeline picked off a menu.
 * @module dsh-workbench/pipeline-run-route
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
  WorkbenchPipelineErrorCode,
  WorkbenchPipelineRun,
  WorkbenchPipelineRunSnapshot,
} from './pipeline-contract.ts'
import {
  WORKBENCH_PIPELINE_RUN_API_VERSION,
  WORKBENCH_PIPELINE_RUN_MAX_BODY_BYTES,
  parseWorkbenchPipelineRunDraft,
} from './pipeline-contract.ts'
import type { LayoutRouteFence } from './layout-route.ts'
import { readJsonBody, sendError, sendJson } from './route-io.ts'
import type { WorkbenchPipelineRunService } from './pipeline-run-service.ts'

/** Everything the route handler needs. */
export interface WorkbenchPipelineRunRouteOptions {
  /** Execution read/append service. */
  readonly service: WorkbenchPipelineRunService
  /** Trust fence applied first. */
  readonly fence: LayoutRouteFence
  /** Host logger for storage failures. */
  readonly warn: (message: string) => void
}

/** Failure carrying the response status a handler must send. */
class RunRequestError extends Error {
  /**
   * @param status - HTTP status to send.
   * @param code - error code in the response body.
   * @param message - operator-facing reason.
   */
  constructor(
    readonly status: number,
    readonly code: WorkbenchPipelineErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'RunRequestError'
  }
}

/**
 * Build the route handler for {@link import('./pipeline-contract.ts').WORKBENCH_PIPELINE_RUN_PATH}.
 * @param options - service, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export function createWorkbenchPipelineRunHandler(
  options: WorkbenchPipelineRunRouteOptions,
): (request: IncomingMessage, response: ServerResponse) => void {
  return (request, response) => {
    // The fence runs before the body is read or storage is touched.
    const rejection = options.fence.requestRejection(request)
    if (rejection !== undefined) {
      sendError(response, rejection, rejection === 401 ? 'unauthorized' : 'forbidden', 'request rejected')
      return
    }
    if (request.method === 'GET') {
      sendJson(response, 200, responseBody(options.service.read()))
      return
    }
    if (request.method === 'POST') {
      void handlePost(options, request, response)
      return
    }
    response.statusCode = 405
    response.setHeader('allow', 'GET, POST')
    response.setHeader('cache-control', 'no-store')
    response.end()
  }
}

/**
 * Read, validate, and store one execution.
 * @param options - route dependencies.
 * @param request - the POST request.
 * @param response - the response to own.
 */
async function handlePost(
  options: WorkbenchPipelineRunRouteOptions,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await readJsonBody(request, WORKBENCH_PIPELINE_RUN_MAX_BODY_BYTES)
    if (body.status === 'too-large') {
      throw new RunRequestError(413, 'invalid-request', 'request body is too large')
    }
    if (body.status === 'invalid') {
      throw new RunRequestError(400, 'invalid-request', body.reason)
    }
    const draft = parseWorkbenchPipelineRunDraft(body.value)
    if ('status' in draft) throw new RunRequestError(400, 'invalid-request', draft.reason)
    const result = await options.service.append(draft)
    // The numbered record comes back with the list: the client shows the row it just
    // created, and the number it shows has to be the one that was stored.
    sendJson(response, 200, { ...responseBody(result.snapshot), run: result.run })
  } catch (error) {
    if (error instanceof RunRequestError) {
      sendError(response, error.status, error.code, error.message)
      return
    }
    const detail = error instanceof Error ? error.message : String(error)
    options.warn(`workbench pipeline run write failed: ${detail}`)
    sendError(response, 500, 'storage-failure', 'pipeline run storage failed')
  }
}

/**
 * Project a snapshot onto the response body.
 * @param snapshot - service snapshot.
 * @returns the wire body.
 */
function responseBody(snapshot: WorkbenchPipelineRunSnapshot): {
  readonly apiVersion: number
  readonly runs: readonly WorkbenchPipelineRun[]
} {
  return { apiVersion: WORKBENCH_PIPELINE_RUN_API_VERSION, runs: snapshot.runs }
}
