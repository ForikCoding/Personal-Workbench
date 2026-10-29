/**
 * Route for the documents a card's template script reads.
 *
 * `GET cardId=…&path=…` answers one directory listing or one text file. The route owns the
 * HTTP status of each {@link WorkbenchFileError}; the confinement and the bounds belong to
 * the service, so a path outside the card's workspace is refused there rather than re-checked
 * here.
 * @module dsh-workbench/skill-card-files-route
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { isWorkbenchCardId } from './layout-contract.ts'
import type {
  WorkbenchFileErrorCode,
  WorkbenchFilesListing,
  WorkbenchFilesText,
} from './skill-card-contract.ts'
import { WORKBENCH_SKILL_CARD_API_VERSION } from './skill-card-contract.ts'
import { WorkbenchFileError, listCardDirectory, readCardFile } from './skill-card-files.ts'
import type { WorkbenchFilesOptions } from './skill-card-files.ts'
import { sendError, sendJson } from './route-io.ts'
import type { SkillCardRouteFence } from './skill-card-route.ts'

/** Everything the document route needs. */
export interface WorkbenchFilesRouteOptions extends WorkbenchFilesOptions {
  /** Trust fence applied first. */
  readonly fence: SkillCardRouteFence
  /** Host logger for a read that failed unexpectedly. */
  readonly warn: (message: string) => void
}

/** The listing body. */
export interface WorkbenchFilesListingBody extends WorkbenchFilesListing {
  /** Contract version, so a client from another build refuses the body. */
  readonly apiVersion: typeof WORKBENCH_SKILL_CARD_API_VERSION
  /** Discriminates the two answers this route gives. */
  readonly kind: 'directory'
}

/** The file body. */
export interface WorkbenchFilesTextBody extends WorkbenchFilesText {
  /** Contract version, so a client from another build refuses the body. */
  readonly apiVersion: typeof WORKBENCH_SKILL_CARD_API_VERSION
  /** Discriminates the two answers this route gives. */
  readonly kind: 'file'
}

/**
 * Build the route handler for {@link WORKBENCH_SKILL_CARD_FILES_PATH}.
 * @param options - workspace lookup, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export function createWorkbenchSkillCardFilesHandler(
  options: WorkbenchFilesRouteOptions,
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
    void handle(options, request, response)
  }
}

/**
 * Answer one listing or one file read.
 *
 * Which of the two is decided by the path's own kind rather than by a parameter: a script
 * asks for a path, and the answer states whether that path is a directory's listing or a
 * file's text. `read` on a directory is therefore the same request as `list` on it.
 * @param options - route dependencies.
 * @param request - the GET request.
 * @param response - the response to own.
 */
async function handle(
  options: WorkbenchFilesRouteOptions,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const cardId = queryParam(request, 'cardId')
  if (cardId === undefined || !isWorkbenchCardId(cardId)) {
    sendError(response, 400, 'invalid-card', 'cardId must name a card')
    return
  }
  // An absent path names the card's own workspace directory, which is where a skill that
  // reports no sub-directory put its documents.
  const path = queryParam(request, 'path') ?? ''
  if (path.includes('\u0000') || path.length > MAX_PATH_LENGTH) {
    sendError(response, 400, 'invalid-request', 'path is not usable')
    return
  }
  try {
    const listing = await listCardDirectory(options, cardId, path)
    const body: WorkbenchFilesListingBody = {
      apiVersion: WORKBENCH_SKILL_CARD_API_VERSION,
      kind: 'directory',
      path: listing.path,
      entries: listing.entries,
      truncated: listing.truncated,
    }
    sendJson(response, 200, body)
  } catch (error) {
    if (error instanceof WorkbenchFileError && error.code === 'not-directory') {
      // The path is there and is not a directory, so it may be the file the caller meant:
      // one request shape for "show me what is at this path" rather than two the script has
      // to choose between.
      await answerFile(options, cardId, path, response)
      return
    }
    answerFailure(options, error, response)
  }
}

/**
 * Answer one file read.
 * @param options - route dependencies.
 * @param cardId - the card.
 * @param path - the requested path.
 * @param response - the response to own.
 */
async function answerFile(
  options: WorkbenchFilesRouteOptions,
  cardId: string,
  path: string,
  response: ServerResponse,
): Promise<void> {
  try {
    const file = await readCardFile(options, cardId, path)
    const body: WorkbenchFilesTextBody = {
      apiVersion: WORKBENCH_SKILL_CARD_API_VERSION,
      kind: 'file',
      path: file.path,
      text: file.text,
      bytes: file.bytes,
    }
    sendJson(response, 200, body)
  } catch (error) {
    answerFailure(options, error, response)
  }
}

/**
 * Send the status and code one failed read earned.
 * @param options - route dependencies, for the logger.
 * @param error - what the service threw.
 * @param response - the response to own.
 */
function answerFailure(
  options: WorkbenchFilesRouteOptions,
  error: unknown,
  response: ServerResponse,
): void {
  if (error instanceof WorkbenchFileError) {
    sendError(response, STATUS_BY_CODE[error.code], error.code, error.message)
    return
  }
  options.warn(`workbench document read failed: ${error instanceof Error ? error.message : String(error)}`)
  sendError(response, 500, 'forbidden', 'the document could not be read')
}

/**
 * HTTP status each failure code is reported as.
 *
 * A record rather than a switch, so adding a code without deciding its status fails to compile.
 */
const STATUS_BY_CODE: Record<WorkbenchFileErrorCode, number> = {
  'unauthorized': 401,
  'forbidden': 403,
  'invalid-request': 400,
  'invalid-card': 400,
  // A card with no workspace, or one whose directory is gone: the card is otherwise fine and
  // one fact is missing, which is the same shape as the configuration route's `not-configured`.
  'no-workspace': 400,
  // A path outside the card's own directory is a refused read, not a malformed request.
  'outside-workspace': 403,
  'not-found': 404,
  'not-directory': 400,
  'not-file': 400,
  // The path is valid and the file is not something this route will show: a media type the
  // card cannot render rather than a request it got wrong.
  'not-text': 415,
  'too-large': 413,
}

/** Longest path one request may carry, in characters. */
const MAX_PATH_LENGTH = 4_096

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
