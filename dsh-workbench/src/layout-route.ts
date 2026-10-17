/**
 * The workbench's private layout route.
 *
 * The route is same-origin and fenced by Connection before it touches storage:
 * a request that fails the trust and browser-authentication check never reaches
 * the layout service. Both halves validate the payload, because this is a
 * process boundary and the caller is not a typed same-process consumer.
 * @module dsh-workbench/layout-route
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
  WorkbenchLayoutEntry,
  WorkbenchLayoutErrorCode,
  WorkbenchLayoutPatch,
  WorkbenchLayoutResponse,
} from './layout-contract.ts'
import {
  WORKBENCH_LAYOUT_API_VERSION,
  WORKBENCH_LAYOUT_MAX_BODY_BYTES,
  isWorkbenchCardId,
} from './layout-contract.ts'
import { readJsonBody, sendError, sendJson } from './route-io.ts'
import type { WorkbenchLayoutService } from './layout-service.ts'

/** Trust fence this route consults before any business logic. */
export interface LayoutRouteFence {
  /**
   * Apply the deployment's Host/Origin and browser-authentication checks.
   * @param request - the incoming request.
   * @returns the rejection status, or undefined when the route may proceed.
   */
  requestRejection(request: IncomingMessage): 401 | 403 | undefined
}

/**
 * The Host context shape this plugin injects.
 *
 * `connection` is declared by `@deepseek-ai/dsh-client-connection`'s Host
 * augmentation, which this package does not depend on for types: the route
 * only needs Connection's trust fence, so the member is stated here.
 */
export interface WorkbenchHostContext {
  /** Web carrier that owns route registration. */
  readonly webServer: {
    register(route: { kind: 'exact'; path: string; handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void> }): () => void
  }
  /** Connection's trust and browser-authentication checks. */
  readonly connection: LayoutRouteFence
}

/** Everything the route handler needs. */
export interface WorkbenchLayoutRouteOptions {
  /** Layout read/write service. */
  readonly service: WorkbenchLayoutService
  /** Trust fence applied first. */
  readonly fence: LayoutRouteFence
  /** Deployment cap on stored records. */
  readonly maxRecords: number
  /** Host logger for storage failures. */
  readonly warn: (message: string) => void
}

/** Failure carrying the response status a handler must send. */
class LayoutRequestError extends Error {
  /**
   * @param status - HTTP status to send.
   * @param code - error code in the response body.
   * @param message - operator-facing reason.
   */
  constructor(
    readonly status: number,
    readonly code: WorkbenchLayoutErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'LayoutRequestError'
  }
}

/**
 * Build the route handler for {@link WORKBENCH_LAYOUT_PATH}.
 * @param options - service, fence, caps, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export function createWorkbenchLayoutHandler(
  options: WorkbenchLayoutRouteOptions,
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
 * Read, validate, and apply one patch.
 * @param options - route dependencies.
 * @param request - the PATCH request.
 * @param response - the response to own.
 */
async function handlePatch(
  options: WorkbenchLayoutRouteOptions,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await readJsonBody(request, WORKBENCH_LAYOUT_MAX_BODY_BYTES)
    if (body.status === 'too-large') {
      throw new LayoutRequestError(413, 'invalid-request', 'request body is too large')
    }
    if (body.status === 'invalid') {
      throw new LayoutRequestError(400, 'invalid-request', body.reason)
    }
    const patch = parsePatch(body.value, options.maxRecords)
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
    if (error instanceof LayoutRequestError) {
      sendError(response, error.status, error.code, error.message)
      return
    }
    const detail = error instanceof Error ? error.message : String(error)
    options.warn(`workbench layout write failed: ${detail}`)
    sendError(response, 500, 'storage-failure', 'layout storage failed')
  }
}

/**
 * Validate a decoded patch against the wire contract.
 * @param value - decoded body.
 * @param maxRecords - deployment cap on entries.
 * @returns the validated patch.
 * @throws {LayoutRequestError} 400 on any field outside the contract.
 */
function parsePatch(value: unknown, maxRecords: number): WorkbenchLayoutPatch {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new LayoutRequestError(400, 'invalid-request', 'body must be an object')
  }
  const body = value as { baseRevision?: unknown; entries?: unknown }
  if (typeof body.baseRevision !== 'string') {
    throw new LayoutRequestError(400, 'invalid-request', 'baseRevision must be a string')
  }
  if (!Array.isArray(body.entries)) {
    throw new LayoutRequestError(400, 'invalid-request', 'entries must be an array')
  }
  if (body.entries.length > maxRecords) {
    throw new LayoutRequestError(400, 'invalid-request', 'entries exceed the configured limit')
  }
  const entries: WorkbenchLayoutEntry[] = []
  for (const raw of body.entries) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new LayoutRequestError(400, 'invalid-request', 'each entry must be an object')
    }
    const entry = raw as { id?: unknown; position?: unknown }
    if (typeof entry.id !== 'string' || !isWorkbenchCardId(entry.id)) {
      throw new LayoutRequestError(400, 'invalid-request', 'each entry needs a namespaced card id')
    }
    if (entry.position !== undefined && (typeof entry.position !== 'number' || !Number.isFinite(entry.position) || entry.position < 0)) {
      throw new LayoutRequestError(400, 'invalid-request', 'position must be a finite non-negative number')
    }
    entries.push({
      id: entry.id,
      ...entry.position === undefined ? {} : { position: entry.position },
    })
  }
  return { baseRevision: body.baseRevision, entries }
}

/**
 * Project a snapshot onto the response body.
 * @param snapshot - service snapshot.
 * @returns the wire body.
 */
function responseBody(snapshot: { readonly entries: readonly WorkbenchLayoutEntry[]; readonly revision: string }): WorkbenchLayoutResponse {
  return { apiVersion: WORKBENCH_LAYOUT_API_VERSION, revision: snapshot.revision, entries: snapshot.entries }
}
