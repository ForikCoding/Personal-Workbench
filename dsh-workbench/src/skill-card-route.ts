/**
 * The skill card's private configuration route.
 *
 * The route is same-origin and fenced by Connection before it touches storage:
 * a request that fails the trust and browser-authentication check never reaches
 * the store. The payload is validated here as well as in the store, because this
 * is a process boundary and the caller is not a typed same-process consumer.
 * @module dsh-workbench/skill-card-route
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
  WorkbenchCatalogResponse,
  WorkbenchRunRequest,
  WorkbenchRunResponse,
  WorkbenchSkillCardErrorCode,
  WorkbenchSkillCardPatch,
  WorkbenchSkillCardResponse,
} from './skill-card-contract.ts'
import {
  WORKBENCH_SKILL_CARD_API_VERSION,
  WORKBENCH_SKILL_CARD_MAX_BODY_BYTES,
  isWorkbenchCardName,
  isWorkbenchSkillName,
} from './skill-card-contract.ts'
import { isWorkbenchCardId } from './layout-contract.ts'
import { readJsonBody, sendError, sendJson } from './route-io.ts'
import type { WorkbenchSkillCardRunner } from './skill-card-runner.ts'
import type { WorkbenchSkillCardStore } from './skill-card-store.ts'

/**
 * Trust fence this route consults before any business logic.
 *
 * Structurally the same member the layout route consumes: both read Connection's
 * own check, and each feature states the member it needs rather than importing
 * the other's Host context type.
 */
export interface SkillCardRouteFence {
  /**
   * Apply the deployment's Host/Origin and browser-authentication checks.
   * @param request - the incoming request.
   * @returns the rejection status, or undefined when the route may proceed.
   */
  requestRejection(request: IncomingMessage): 401 | 403 | undefined
}

/** Everything the configuration route handler needs. */
export interface WorkbenchSkillCardRouteOptions {
  /** Configuration and result store. */
  readonly store: WorkbenchSkillCardStore
  /** Trust fence applied first. */
  readonly fence: SkillCardRouteFence
  /**
   * Effective template byte budget.
   *
   * The route owns the HTTP status, so it checks the deployment's own limit
   * rather than the wire contract's ceiling; the store enforces it again.
   */
  readonly maxTemplateBytes: number
  /** Host logger for storage failures. */
  readonly warn: (message: string) => void
}

/** Failure carrying the response status a handler must send. */
class SkillCardRequestError extends Error {
  /**
   * @param status - HTTP status to send.
   * @param code - error code in the response body.
   * @param message - operator-facing reason.
   */
  constructor(
    readonly status: number,
    readonly code: WorkbenchSkillCardErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'SkillCardRequestError'
  }
}

/**
 * Build the route handler for {@link WORKBENCH_SKILL_CARD_PATH}.
 * @param options - store, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export function createWorkbenchSkillCardHandler(
  options: WorkbenchSkillCardRouteOptions,
): (request: IncomingMessage, response: ServerResponse) => void {
  return (request, response) => {
    // The fence runs before the body is read or storage is touched.
    const rejection = options.fence.requestRejection(request)
    if (rejection !== undefined) {
      sendError(response, rejection, rejection === 401 ? 'unauthorized' : 'forbidden', 'request rejected')
      return
    }
    if (request.method === 'GET') {
      sendJson(response, 200, responseBody(options.store))
      return
    }
    if (request.method === 'PATCH') {
      void handlePatch(options, request, response)
      return
    }
    sendMethodNotAllowed(response, 'GET, PATCH')
  }
}

/**
 * Read, validate, and apply one configuration patch.
 * @param options - route dependencies.
 * @param request - the PATCH request.
 * @param response - the response to own.
 */
async function handlePatch(
  options: WorkbenchSkillCardRouteOptions,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await readJsonBody(request, WORKBENCH_SKILL_CARD_MAX_BODY_BYTES)
    if (body.status === 'too-large') {
      throw new SkillCardRequestError(413, 'too-large', 'request body is too large')
    }
    if (body.status === 'invalid') {
      throw new SkillCardRequestError(400, 'invalid-request', body.reason)
    }
    const result = await options.store.write(parsePatch(body.value, options.maxTemplateBytes))
    if (result.status === 'invalid') {
      sendError(response, 400, 'invalid-request', result.reason)
      return
    }
    if (result.status === 'conflict') {
      // The loser reconciles against the current state instead of retrying blind.
      sendJson(response, 409, responseBody(options.store))
      return
    }
    sendJson(response, 200, responseBody(options.store))
  } catch (error) {
    if (error instanceof SkillCardRequestError) {
      sendError(response, error.status, error.code, error.message)
      return
    }
    const detail = error instanceof Error ? error.message : String(error)
    options.warn(`workbench skill card write failed: ${detail}`)
    sendError(response, 500, 'storage-failure', 'skill card storage failed')
  }
}

/**
 * Validate a decoded patch against the wire contract.
 * @param value - decoded body.
 * @param maxTemplateBytes - effective template byte budget.
 * @returns the validated patch.
 * @throws {SkillCardRequestError} 400 or 413 on any field outside the contract.
 */
function parsePatch(value: unknown, maxTemplateBytes: number): WorkbenchSkillCardPatch {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SkillCardRequestError(400, 'invalid-request', 'body must be an object')
  }
  const body = value as {
    baseRevision?: unknown
    cardId?: unknown
    name?: unknown
    remove?: unknown
    skill?: unknown
    template?: unknown
  }
  if (typeof body.baseRevision !== 'string') {
    throw new SkillCardRequestError(400, 'invalid-request', 'baseRevision must be a string')
  }
  if (typeof body.cardId !== 'string' || !isWorkbenchCardId(body.cardId)) {
    throw new SkillCardRequestError(400, 'invalid-request', 'cardId must be a namespaced card id')
  }

  if (body.remove !== undefined && body.remove !== true) {
    throw new SkillCardRequestError(400, 'invalid-request', 'remove must be true when present')
  }

  let name: string | null | undefined
  if (body.name === undefined) {
    name = undefined
  } else if (body.name === null) {
    name = null
  } else if (typeof body.name === 'string' && isWorkbenchCardName(body.name)) {
    name = body.name
  } else {
    throw new SkillCardRequestError(400, 'invalid-request', 'name must be null or a non-empty card name')
  }

  let skill: string | null | undefined
  if (body.skill === undefined) {
    skill = undefined
  } else if (body.skill === null) {
    skill = null
  } else if (typeof body.skill === 'string' && isWorkbenchSkillName(body.skill)) {
    skill = body.skill
  } else {
    throw new SkillCardRequestError(400, 'invalid-request', 'skill must be null or a kebab-case skill name')
  }

  let template: { readonly skill: string; readonly html: string } | undefined
  if (body.template !== undefined) {
    const raw = body.template
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new SkillCardRequestError(400, 'invalid-request', 'template must be an object')
    }
    const entry = raw as { skill?: unknown; html?: unknown }
    if (typeof entry.skill !== 'string' || !isWorkbenchSkillName(entry.skill)) {
      throw new SkillCardRequestError(400, 'invalid-request', 'template.skill must be a kebab-case skill name')
    }
    if (typeof entry.html !== 'string') {
      throw new SkillCardRequestError(400, 'invalid-request', 'template.html must be a string')
    }
    // Refused here with the transport's own code so an oversized template reads as
    // a size problem rather than a malformed request; the store caps it again.
    if (Buffer.byteLength(entry.html, 'utf8') > maxTemplateBytes) {
      throw new SkillCardRequestError(413, 'too-large', 'template exceeds the byte limit')
    }
    template = { skill: entry.skill, html: entry.html }
  }

  return {
    baseRevision: body.baseRevision,
    cardId: body.cardId,
    ...body.remove === undefined ? {} : { remove: true as const },
    ...name === undefined ? {} : { name },
    ...skill === undefined ? {} : { skill },
    ...template === undefined ? {} : { template },
  }
}

/**
 * Project the store's current state onto the response body.
 * @param store - the configuration store.
 * @returns the wire body.
 */
function responseBody(store: WorkbenchSkillCardStore): WorkbenchSkillCardResponse {
  const snapshot = store.read()
  return {
    apiVersion: WORKBENCH_SKILL_CARD_API_VERSION,
    revision: snapshot.revision,
    cards: snapshot.cards,
    results: snapshot.results,
  }
}

/**
 * HTTP status each failure code is reported as.
 *
 * A record rather than a switch, so adding a code to the union without deciding
 * its status fails compilation.
 */
const STATUS_BY_CODE: Record<WorkbenchSkillCardErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  'invalid-request': 400,
  'too-large': 413,
  conflict: 409,
  'not-found': 404,
  'storage-failure': 500,
  'run-failed': 500,
  'not-configured': 400,
  'session-not-live': 409,
  'skill-not-found': 404,
  'template-missing': 400,
  'catalog-failed': 500,
  'provider-unavailable': 500,
  'schema-rejected': 400,
  'run-in-progress': 409,
}

/** Everything the catalog route needs. */
export interface WorkbenchSkillCardCatalogRouteOptions {
  /** Session-scoped catalog reader. */
  readonly runner: WorkbenchSkillCardRunner
  /** Trust fence applied first. */
  readonly fence: SkillCardRouteFence
  /** Host logger for upstream failures. */
  readonly warn: (message: string) => void
}

/** Everything the run route needs. */
export interface WorkbenchSkillCardRunRouteOptions {
  /** Run owner. */
  readonly runner: WorkbenchSkillCardRunner
  /** Trust fence applied first. */
  readonly fence: SkillCardRouteFence
  /** Host logger for rejected run bodies. */
  readonly warn: (message: string) => void
}

/**
 * Build the route handler for the session-scoped skill catalog.
 * @param options - runner, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export function createWorkbenchSkillCardCatalogHandler(
  options: WorkbenchSkillCardCatalogRouteOptions,
): (request: IncomingMessage, response: ServerResponse) => void {
  return (request, response) => {
    const rejection = options.fence.requestRejection(request)
    if (rejection !== undefined) {
      sendError(response, rejection, rejection === 401 ? 'unauthorized' : 'forbidden', 'request rejected')
      return
    }
    if (request.method !== 'GET') {
      sendMethodNotAllowed(response, 'GET')
      return
    }
    void handleCatalog(options, request, response)
  }
}

/**
 * Build the route handler for run control: start, poll, and cancel.
 * @param options - runner, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export function createWorkbenchSkillCardRunHandler(
  options: WorkbenchSkillCardRunRouteOptions,
): (request: IncomingMessage, response: ServerResponse) => void {
  return (request, response) => {
    const rejection = options.fence.requestRejection(request)
    if (rejection !== undefined) {
      sendError(response, rejection, rejection === 401 ? 'unauthorized' : 'forbidden', 'request rejected')
      return
    }
    if (request.method === 'POST') {
      void handleStart(options, request, response)
      return
    }
    if (request.method === 'GET') {
      handleState(options, request, response)
      return
    }
    if (request.method === 'DELETE') {
      handleCancel(options, request, response)
      return
    }
    sendMethodNotAllowed(response, 'POST, GET, DELETE')
  }
}

/**
 * Read one session's skill catalog.
 * @param options - route dependencies.
 * @param request - the GET request.
 * @param response - the response to own.
 */
async function handleCatalog(
  options: WorkbenchSkillCardCatalogRouteOptions,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  // The catalog is readable without a session. A card is configured before it is
  // ever run, so requiring the run's session here would leave the skill picker
  // empty for exactly the user who is setting the card up.
  const requested = queryParam(request, 'sessionId')
  const outcome = await options.runner.catalog(
    requested === undefined || requested.length === 0 ? undefined : requested,
  )
  if (outcome.status === 'failed') {
    sendError(response, STATUS_BY_CODE[outcome.code], outcome.code, outcome.detail)
    return
  }
  const body: WorkbenchCatalogResponse = {
    apiVersion: WORKBENCH_SKILL_CARD_API_VERSION,
    skills: outcome.entries,
  }
  sendJson(response, 200, body)
}

/**
 * Start one card's run.
 * @param options - route dependencies.
 * @param request - the POST request.
 * @param response - the response to own.
 */
async function handleStart(
  options: WorkbenchSkillCardRunRouteOptions,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await readJsonBody(request, WORKBENCH_SKILL_CARD_MAX_BODY_BYTES)
    if (body.status === 'too-large') {
      throw new SkillCardRequestError(413, 'too-large', 'request body is too large')
    }
    if (body.status === 'invalid') {
      throw new SkillCardRequestError(400, 'invalid-request', body.reason)
    }
    const outcome = options.runner.start(parseRunRequest(body.value))
    if (outcome.status === 'rejected') {
      sendError(response, STATUS_BY_CODE[outcome.code], outcome.code, outcome.detail)
      return
    }
    // Accepted rather than OK: the run continues past this response, and the
    // client learns the outcome by polling.
    const started: WorkbenchRunResponse = {
      apiVersion: WORKBENCH_SKILL_CARD_API_VERSION,
      state: outcome.state,
    }
    sendJson(response, 202, started)
  } catch (error) {
    if (error instanceof SkillCardRequestError) {
      sendError(response, error.status, error.code, error.message)
      return
    }
    const detail = error instanceof Error ? error.message : String(error)
    options.warn(`workbench skill card run start failed: ${detail}`)
    sendError(response, 500, 'run-failed', 'the run could not be started')
  }
}

/**
 * Report one card's run state.
 * @param options - route dependencies.
 * @param request - the GET request.
 * @param response - the response to own.
 */
function handleState(
  options: WorkbenchSkillCardRunRouteOptions,
  request: IncomingMessage,
  response: ServerResponse,
): void {
  const cardId = queryParam(request, 'cardId')
  if (cardId === undefined || !isWorkbenchCardId(cardId)) {
    sendError(response, 400, 'invalid-request', 'cardId must be a namespaced card id')
    return
  }
  const state = options.runner.state(cardId)
  if (state === undefined) {
    sendError(response, 404, 'not-found', 'no run has been started for this card')
    return
  }
  const body: WorkbenchRunResponse = { apiVersion: WORKBENCH_SKILL_CARD_API_VERSION, state }
  sendJson(response, 200, body)
}

/**
 * Cancel one card's in-flight run.
 * @param options - route dependencies.
 * @param request - the DELETE request.
 * @param response - the response to own.
 */
function handleCancel(
  options: WorkbenchSkillCardRunRouteOptions,
  request: IncomingMessage,
  response: ServerResponse,
): void {
  const cardId = queryParam(request, 'cardId')
  if (cardId === undefined || !isWorkbenchCardId(cardId)) {
    sendError(response, 400, 'invalid-request', 'cardId must be a namespaced card id')
    return
  }
  if (!options.runner.cancel(cardId)) {
    sendError(response, 404, 'not-found', 'no run is in flight for this card')
    return
  }
  const state = options.runner.state(cardId)
  if (state === undefined) {
    sendError(response, 404, 'not-found', 'no run has been started for this card')
    return
  }
  const body: WorkbenchRunResponse = { apiVersion: WORKBENCH_SKILL_CARD_API_VERSION, state }
  sendJson(response, 200, body)
}

/**
 * Validate a decoded run body against the wire contract.
 * @param value - decoded body.
 * @returns the validated request.
 * @throws {SkillCardRequestError} 400 on any field outside the contract.
 */
function parseRunRequest(value: unknown): WorkbenchRunRequest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SkillCardRequestError(400, 'invalid-request', 'body must be an object')
  }
  const body = value as { cardId?: unknown; sessionId?: unknown; outputSchema?: unknown }
  if (typeof body.cardId !== 'string' || !isWorkbenchCardId(body.cardId)) {
    throw new SkillCardRequestError(400, 'invalid-request', 'cardId must be a namespaced card id')
  }
  if (typeof body.sessionId !== 'string' || body.sessionId.length === 0) {
    throw new SkillCardRequestError(400, 'invalid-request', 'sessionId must be a non-empty string')
  }
  // Whether the contract itself is usable is the runner's precondition, so it is
  // carried through unchecked here and answered as `schema-rejected` there.
  return { cardId: body.cardId, sessionId: body.sessionId, outputSchema: body.outputSchema }
}

/**
 * Read one query parameter.
 * @param request - the request whose URL to parse.
 * @param name - parameter name.
 * @returns the value, or undefined when absent.
 */
function queryParam(request: IncomingMessage, name: string): string | undefined {
  const url = request.url
  if (url === undefined) return undefined
  return new URL(url, 'http://localhost').searchParams.get(name) ?? undefined
}

/**
 * Answer an unsupported method with the ones this route serves.
 * @param response - the response to write.
 * @param allow - the `Allow` header value.
 */
function sendMethodNotAllowed(response: ServerResponse, allow: string): void {
  response.statusCode = 405
  response.setHeader('allow', allow)
  response.setHeader('cache-control', 'no-store')
  response.end()
}
