/**
 * The workbench's private pipeline route.
 *
 * Same fence and same two-sided validation as the layout route: the caller is a browser
 * across a process boundary, so this half validates what it reads before the service
 * sees it.
 * @module dsh-workbench/pipeline-route
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
  WorkbenchPipeline,
  WorkbenchPipelineErrorCode,
  WorkbenchPipelinePatch,
  WorkbenchPipelineSnapshot,
} from './pipeline-contract.ts'
import {
  WORKBENCH_PIPELINE_API_VERSION,
  WORKBENCH_PIPELINE_MAX_BODY_BYTES,
  parseWorkbenchPipelines,
} from './pipeline-contract.ts'
import type { LayoutRouteFence } from './layout-route.ts'
import { readJsonBody, sendError, sendJson } from './route-io.ts'
import type { WorkbenchPipelineService } from './pipeline-service.ts'

/** Everything the route handler needs. */
export interface WorkbenchPipelineRouteOptions {
  /** Pipeline read/write service. */
  readonly service: WorkbenchPipelineService
  /** Trust fence applied first. */
  readonly fence: LayoutRouteFence
  /** Host logger for storage failures. */
  readonly warn: (message: string) => void
}

/** Failure carrying the response status a handler must send. */
class PipelineRequestError extends Error {
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
    this.name = 'PipelineRequestError'
  }
}

/**
 * Build the route handler for {@link import('./pipeline-contract.ts').WORKBENCH_PIPELINE_PATH}.
 * @param options - service, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export function createWorkbenchPipelineHandler(
  options: WorkbenchPipelineRouteOptions,
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
    if (request.method === 'PATCH') {
      void handlePatch(options, request, response)
      return
    }
    response.statusCode = 405
    response.setHeader('allow', 'GET, PATCH')
    response.setHeader('cache-control', 'no-store')
    response.end()
  }
}

/**
 * Read, validate, and apply one write.
 * @param options - route dependencies.
 * @param request - the PATCH request.
 * @param response - the response to own.
 */
async function handlePatch(
  options: WorkbenchPipelineRouteOptions,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await readJsonBody(request, WORKBENCH_PIPELINE_MAX_BODY_BYTES)
    if (body.status === 'too-large') {
      throw new PipelineRequestError(413, 'invalid-request', 'request body is too large')
    }
    if (body.status === 'invalid') {
      throw new PipelineRequestError(400, 'invalid-request', body.reason)
    }
    const patch = parsePatch(body.value)
    const result = await options.service.write(patch)
    if (result.status === 'invalid') {
      sendError(response, 400, 'invalid-request', result.reason)
      return
    }
    if (result.status === 'conflict') {
      // The loser reconciles against this snapshot instead of retrying blind.
      sendJson(response, 409, responseBody(result.snapshot))
      return
    }
    sendJson(response, 200, responseBody(result.snapshot))
  } catch (error) {
    if (error instanceof PipelineRequestError) {
      sendError(response, error.status, error.code, error.message)
      return
    }
    const detail = error instanceof Error ? error.message : String(error)
    options.warn(`workbench pipeline write failed: ${detail}`)
    sendError(response, 500, 'storage-failure', 'pipeline storage failed')
  }
}

/**
 * Validate a decoded write against the wire contract.
 * @param value - decoded body.
 * @returns the validated patch.
 * @throws {PipelineRequestError} 400 on any field outside the contract.
 */
function parsePatch(value: unknown): WorkbenchPipelinePatch {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PipelineRequestError(400, 'invalid-request', 'body must be an object')
  }
  const body = value as { baseRevision?: unknown; pipelines?: unknown }
  if (typeof body.baseRevision !== 'string') {
    throw new PipelineRequestError(400, 'invalid-request', 'baseRevision must be a string')
  }
  const pipelines = parseWorkbenchPipelines(body.pipelines)
  if ('status' in pipelines) {
    throw new PipelineRequestError(400, 'invalid-request', pipelines.reason)
  }
  return { baseRevision: body.baseRevision, pipelines }
}

/**
 * Project a snapshot onto the response body.
 * @param snapshot - service snapshot.
 * @returns the wire body.
 */
function responseBody(snapshot: WorkbenchPipelineSnapshot): {
  readonly apiVersion: number
  readonly revision: string
  readonly pipelines: readonly WorkbenchPipeline[]
} {
  return {
    apiVersion: WORKBENCH_PIPELINE_API_VERSION,
    revision: snapshot.revision,
    pipelines: snapshot.pipelines,
  }
}
