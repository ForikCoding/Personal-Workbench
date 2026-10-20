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
  WorkbenchCardModel,
  WorkbenchCardWorkspace,
  WorkbenchCatalogResponse,
  WorkbenchDirectoryStatResponse,
  WorkbenchResultEditRequest,
  WorkbenchResultEditResponse,
  WorkbenchRunCapabilities,
  WorkbenchRunMode,
  WorkbenchRunRequest,
  WorkbenchRunResponse,
  WorkbenchSandboxMode,
  WorkbenchSkillCardErrorCode,
  WorkbenchSkillCardPatch,
  WorkbenchSkillCardResponse,
} from './skill-card-contract.ts'
import {
  WORKBENCH_REFINE_INSTRUCTION_MAX_LENGTH,
  WORKBENCH_REFINE_PREVIOUS_MAX_BYTES,
  WORKBENCH_RESULT_MAX_BYTES,
  WORKBENCH_SANDBOX_MODES,
  WORKBENCH_SKILL_CARD_API_VERSION,
  WORKBENCH_SKILL_CARD_MAX_BODY_BYTES,
  isWorkbenchCardModel,
  isWorkbenchCardName,
  isWorkbenchCardWorkspace,
  isWorkbenchSandboxMode,
  isWorkbenchSkillName,
  isWorkbenchWorkspacePath,
} from './skill-card-contract.ts'
import { isWorkbenchCardId } from './layout-contract.ts'
import { readJsonBody, sendError, sendJson } from './route-io.ts'
import type { WorkbenchDirectoryProbe } from './skill-card-directory.ts'
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
  /**
   * What this deployment can do, probed once at composition.
   *
   * Carried on every read and write body so the card can state a missing seam as a state
   * instead of discovering it when a click lands.
   */
  readonly capabilities: WorkbenchRunCapabilities
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
      sendJson(response, 200, responseBody(options.store, options.capabilities))
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
      sendJson(response, 409, responseBody(options.store, options.capabilities))
      return
    }
    sendJson(response, 200, responseBody(options.store, options.capabilities))
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
    model?: unknown
    workspace?: unknown
    permission?: unknown
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

  let model: WorkbenchCardModel | null | undefined
  if (body.model === undefined) {
    model = undefined
  } else if (body.model === null) {
    model = null
  } else if (isWorkbenchCardModel(body.model)) {
    model = body.model
  } else {
    throw new SkillCardRequestError(
      400,
      'invalid-request',
      'model must be null or an object naming a provider and a model',
    )
  }

  let workspace: WorkbenchCardWorkspace | null | undefined
  if (body.workspace === undefined) {
    workspace = undefined
  } else if (body.workspace === null) {
    workspace = null
  } else if (isWorkbenchCardWorkspace(body.workspace)) {
    workspace = { path: body.workspace.path }
  } else {
    throw new SkillCardRequestError(
      400,
      'invalid-request',
      'workspace must be null or an object naming one absolute directory path',
    )
  }

  let permission: WorkbenchSandboxMode | null | undefined
  if (body.permission === undefined) {
    permission = undefined
  } else if (body.permission === null) {
    permission = null
  } else if (isWorkbenchSandboxMode(body.permission)) {
    permission = body.permission
  } else {
    throw new SkillCardRequestError(
      400,
      'invalid-request',
      `permission must be null or one of ${WORKBENCH_SANDBOX_MODES.join(', ')}`,
    )
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
    ...model === undefined ? {} : { model },
    ...workspace === undefined ? {} : { workspace },
    ...permission === undefined ? {} : { permission },
    ...template === undefined ? {} : { template },
  }
}

/** Everything the stored-result edit route needs. */
export interface WorkbenchSkillCardResultRouteOptions {
  /** Result owner. The record's run facts are read from here, not from the request. */
  readonly store: WorkbenchSkillCardStore
  /** Trust fence applied first. */
  readonly fence: SkillCardRouteFence
  /**
   * Effective result byte budget of this deployment.
   *
   * A deployment may tighten the wire ceiling but never widen it: the route applies the
   * smaller of the two, so no request can store more than the contract advertises.
   */
  readonly maxResultBytes: number
  /** Host logger for storage failures. */
  readonly warn: (message: string) => void
}

/**
 * Build the route handler for {@link WORKBENCH_SKILL_CARD_RESULT_PATH}.
 * @param options - store, fence, budget, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export function createWorkbenchSkillCardResultHandler(
  options: WorkbenchSkillCardResultRouteOptions,
): (request: IncomingMessage, response: ServerResponse) => void {
  return (request, response) => {
    const rejection = options.fence.requestRejection(request)
    if (rejection !== undefined) {
      sendError(response, rejection, rejection === 401 ? 'unauthorized' : 'forbidden', 'request rejected')
      return
    }
    if (request.method !== 'PUT') {
      sendMethodNotAllowed(response, 'PUT')
      return
    }
    void handleResultEdit(options, request, response)
  }
}

/**
 * Read, validate, and store one hand edit.
 * @param options - route dependencies.
 * @param request - the PUT request.
 * @param response - the response to own.
 */
async function handleResultEdit(
  options: WorkbenchSkillCardResultRouteOptions,
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
    const edit = parseResultEdit(body.value, options.maxResultBytes)
    const outcome = await options.store.putEditedResult(edit.cardId, edit.html)
    if (outcome.status === 'missing') {
      sendError(response, 404, 'not-found', 'this card holds no result to edit')
      return
    }
    if (outcome.status === 'invalid') {
      sendError(response, 400, 'invalid-request', outcome.reason)
      return
    }
    if (outcome.status === 'too-large') {
      sendError(response, 413, 'too-large', `the edited result is ${String(outcome.bytes)} bytes, above the byte limit`)
      return
    }
    // The new record travels back with the revision the write landed on: the client
    // updates from this response instead of reading the whole configuration again.
    const stored: WorkbenchResultEditResponse = {
      apiVersion: WORKBENCH_SKILL_CARD_API_VERSION,
      revision: options.store.revision,
      result: outcome.result,
    }
    sendJson(response, 200, stored)
  } catch (error) {
    if (error instanceof SkillCardRequestError) {
      sendError(response, error.status, error.code, error.message)
      return
    }
    const detail = error instanceof Error ? error.message : String(error)
    options.warn(`workbench skill card result edit failed: ${detail}`)
    sendError(response, 500, 'storage-failure', 'skill card storage failed')
  }
}

/**
 * Validate a decoded result-edit body.
 *
 * Only the two fields the contract has are checked, plus the byte budget: the editorial
 * rules (content policy, an empty region) belong to the editor, which is the only place
 * that can explain them next to the text they are about. The empty case is enforced a
 * second time by the store, because an empty stored result renders as a broken card.
 * @param value - decoded body.
 * @param maxResultBytes - effective result byte budget.
 * @returns the validated edit.
 * @throws {SkillCardRequestError} 400 on a malformed field, 413 above the budget.
 */
function parseResultEdit(value: unknown, maxResultBytes: number): WorkbenchResultEditRequest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SkillCardRequestError(400, 'invalid-request', 'body must be an object')
  }
  const body = value as { cardId?: unknown; html?: unknown }
  if (typeof body.cardId !== 'string' || !isWorkbenchCardId(body.cardId)) {
    throw new SkillCardRequestError(400, 'invalid-request', 'cardId must be a namespaced card id')
  }
  if (typeof body.html !== 'string') {
    throw new SkillCardRequestError(400, 'invalid-request', 'html must be a string')
  }
  // A deployment may tighten the wire ceiling but never widen it: the effective limit is
  // the smaller of the two, so a request can never store more than the contract advertises.
  const limit = Math.min(maxResultBytes, WORKBENCH_RESULT_MAX_BYTES)
  if (Buffer.byteLength(body.html, 'utf8') > limit) {
    // The transport's size code, so an oversized fragment reads as a size problem rather
    // than as a malformed request. It is refused, never truncated.
    throw new SkillCardRequestError(413, 'too-large', 'html exceeds the byte limit')
  }
  return { cardId: body.cardId, html: body.html }
}

/** Everything the directory-check route needs. */
export interface WorkbenchSkillCardDirectoryRouteOptions {
  /** The one filesystem read this feature performs. */
  readonly statDirectory: WorkbenchDirectoryProbe
  /** Trust fence applied first. */
  readonly fence: SkillCardRouteFence
  /** Host logger for a probe that failed unexpectedly. */
  readonly warn: (message: string) => void
}

/**
 * Build the route handler for {@link WORKBENCH_SKILL_CARD_DIRECTORY_PATH}.
 *
 * A read, so `GET` with the path in the query. The answer is deliberately three booleans
 * and never an error for a path that is simply not there: the client renders "this
 * directory is gone" from the same body it renders "this directory is fine" from, so a
 * missing folder cannot arrive as an exception.
 * @param options - probe, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export function createWorkbenchSkillCardDirectoryHandler(
  options: WorkbenchSkillCardDirectoryRouteOptions,
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
    void handleDirectoryStat(options, request, response)
  }
}

/**
 * Answer one directory check.
 * @param options - route dependencies.
 * @param request - the GET request.
 * @param response - the response to own.
 */
async function handleDirectoryStat(
  options: WorkbenchSkillCardDirectoryRouteOptions,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const path = queryParam(request, 'path')
  // Validated before the filesystem is touched, and against the same rule the store
  // applies: a relative path would name a different directory to whoever resolved it.
  if (path === undefined || !isWorkbenchWorkspacePath(path)) {
    sendError(response, 400, 'invalid-request', 'path must be one absolute directory path')
    return
  }
  try {
    const found = await options.statDirectory(path)
    const body: WorkbenchDirectoryStatResponse = {
      apiVersion: WORKBENCH_SKILL_CARD_API_VERSION,
      path,
      exists: found.exists,
      isDirectory: found.isDirectory,
      writable: found.writable,
    }
    sendJson(response, 200, body)
  } catch (error) {
    // A probe is expected to swallow its own failures; one that does not is still answered
    // as a state rather than as a stack trace, because the card's field reads this body.
    options.warn(`workbench skill card directory check failed: ${error instanceof Error ? error.message : String(error)}`)
    const body: WorkbenchDirectoryStatResponse = {
      apiVersion: WORKBENCH_SKILL_CARD_API_VERSION,
      path,
      exists: false,
      isDirectory: false,
      writable: false,
    }
    sendJson(response, 200, body)
  }
}

/**
 * Project the store's current state onto the response body.
 * @param store - the configuration store.
 * @param capabilities - what this deployment can do, probed at composition.
 * @returns the wire body.
 */
function responseBody(
  store: WorkbenchSkillCardStore,
  capabilities: WorkbenchRunCapabilities,
): WorkbenchSkillCardResponse {
  const snapshot = store.read()
  return {
    apiVersion: WORKBENCH_SKILL_CARD_API_VERSION,
    revision: snapshot.revision,
    cards: snapshot.cards,
    results: snapshot.results,
    capabilities,
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
  // The card names a route the deployment no longer offers, so the request conflicts with
  // the state the card was configured against rather than being malformed.
  'model-unavailable': 409,
  'schema-rejected': 400,
  'run-in-progress': 409,
  // Not implemented here rather than a bad request: the deployment, not the request, is
  // missing the seam a run needs, so no change to the request would make it succeed.
  'run-unavailable': 501,
  // The card is otherwise ready and one fact is missing, which is the same shape as
  // `not-configured`: nothing about the request is wrong.
  'workspace-missing': 400,
  // The stored directory is gone or is no longer a directory. That conflicts with the state
  // the card was configured against rather than being malformed, exactly like a model route
  // the deployment no longer offers.
  'workspace-invalid': 409,
  // The card names a permission mode this Host could not apply to the agent that runs it.
  // A conflict rather than a bad request for the same reason: the request is well formed and
  // the card is otherwise ready, and no change to the request would make the mode apply.
  'permission-unavailable': 409,
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
    const outcome = await options.runner.start(parseRunRequest(body.value))
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
  const body = value as {
    cardId?: unknown
    sessionId?: unknown
    mode?: unknown
    payload?: unknown
    outputSchema?: unknown
  }
  if (typeof body.cardId !== 'string' || !isWorkbenchCardId(body.cardId)) {
    throw new SkillCardRequestError(400, 'invalid-request', 'cardId must be a namespaced card id')
  }
  if (typeof body.sessionId !== 'string' || body.sessionId.length === 0) {
    throw new SkillCardRequestError(400, 'invalid-request', 'sessionId must be a non-empty string')
  }
  // The row is only checked for shape. Its byte budget belongs to the button attribute
  // that produced it: this value is re-serialized on the way here, so counting bytes
  // again would measure the encoding rather than the row. The body cap bounds it.
  let payload: Record<string, unknown> | undefined
  if (body.payload !== undefined) {
    if (typeof body.payload !== 'object' || body.payload === null || Array.isArray(body.payload)) {
      throw new SkillCardRequestError(400, 'invalid-request', 'payload must be an object')
    }
    payload = body.payload as Record<string, unknown>
  }
  // Whether the contract itself is usable is the runner's precondition, so it is
  // carried through unchecked here and answered as `schema-rejected` there. It is
  // absent for a bare run, which asks for no value at all.
  return {
    cardId: body.cardId,
    sessionId: body.sessionId,
    mode: parseRunMode(body.mode),
    ...payload === undefined ? {} : { payload },
    ...body.outputSchema === undefined ? {} : { outputSchema: body.outputSchema },
  }
}

/**
 * Validate the mode one run body carries.
 *
 * Explicit rather than inferred from the presence of a contract: a card run that
 * lost its contract must fail as a card run, not silently become a bare one.
 * @param value - the decoded `mode` field.
 * @returns the validated mode.
 * @throws {SkillCardRequestError} 400 when the mode is missing or malformed.
 */
function parseRunMode(value: unknown): WorkbenchRunMode {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SkillCardRequestError(400, 'invalid-request', 'mode must be an object')
  }
  const mode = value as { kind?: unknown; skill?: unknown; instruction?: unknown; previous?: unknown }
  if (mode.kind === 'card') return { kind: 'card' }
  if (mode.kind === 'refine') return parseRefineMode(mode)
  if (mode.kind !== 'bare') {
    throw new SkillCardRequestError(400, 'invalid-request', 'mode.kind must be card, bare or refine')
  }
  if (typeof mode.skill !== 'string' || !isWorkbenchSkillName(mode.skill)) {
    throw new SkillCardRequestError(400, 'invalid-request', 'mode.skill must be a kebab-case skill name')
  }
  return { kind: 'bare', skill: mode.skill }
}

/**
 * Validate the two strings a refine run carries.
 *
 * The instruction is free text, so the only rules are "there is something to ask for"
 * and a bound on what one request carries. The previous result is not re-validated as
 * HTML here: it is a string the client read back from a stored result, and the prompt
 * carries it verbatim either way.
 * @param mode - the decoded `mode` field, already known to say `refine`.
 * @returns the validated refine mode.
 * @throws {SkillCardRequestError} 400 when a field is outside the contract, 413 when
 * the previous result exceeds its byte budget.
 */
function parseRefineMode(mode: { instruction?: unknown; previous?: unknown }): WorkbenchRunMode {
  if (typeof mode.instruction !== 'string' || mode.instruction.trim() === '') {
    throw new SkillCardRequestError(400, 'invalid-request', 'mode.instruction must be a non-empty string')
  }
  if (mode.instruction.length > WORKBENCH_REFINE_INSTRUCTION_MAX_LENGTH) {
    throw new SkillCardRequestError(400, 'invalid-request', 'mode.instruction is longer than the limit')
  }
  if (typeof mode.previous !== 'string') {
    throw new SkillCardRequestError(400, 'invalid-request', 'mode.previous must be a string')
  }
  if (Buffer.byteLength(mode.previous, 'utf8') > WORKBENCH_REFINE_PREVIOUS_MAX_BYTES) {
    // The transport's own size code, so an oversized replay reads as a size problem
    // rather than as a malformed request.
    throw new SkillCardRequestError(413, 'too-large', 'mode.previous exceeds the byte limit')
  }
  return { kind: 'refine', instruction: mode.instruction, previous: mode.previous }
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
