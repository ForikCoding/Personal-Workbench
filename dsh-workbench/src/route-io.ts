/**
 * Shared plumbing for the workbench's private same-origin routes.
 *
 * Each route owns its own status codes and error vocabulary; what they share is
 * how a bounded JSON request body is read and how a JSON answer or error is
 * written under the family's no-store policy.
 * @module dsh-workbench/route-io
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

/** Outcome of reading one bounded JSON request body. */
export type JsonBodyResult =
  | { readonly status: 'ok'; readonly value: unknown }
  | { readonly status: 'too-large' }
  | { readonly status: 'invalid'; readonly reason: string }

/**
 * Read a bounded JSON body.
 * @param request - the request to drain.
 * @param maxBytes - cap on the body's byte length.
 * @returns the decoded value, or why the body was refused.
 */
export async function readJsonBody(request: IncomingMessage, maxBytes: number): Promise<JsonBodyResult> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk as Buffer
    size += buffer.length
    if (size > maxBytes) return { status: 'too-large' }
    chunks.push(buffer)
  }
  if (size === 0) return { status: 'invalid', reason: 'request body is empty' }
  try {
    return { status: 'ok', value: JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  } catch {
    return { status: 'invalid', reason: 'request body is not JSON' }
  }
}

/**
 * Send one JSON body with the route family's no-store policy.
 * @param response - the response to write.
 * @param status - HTTP status.
 * @param body - JSON-serializable body.
 */
export function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  response.statusCode = status
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.setHeader('cache-control', 'no-store')
  response.write(payload)
  response.end()
}

/**
 * Send one JSON error.
 *
 * The message is an operator-facing reason and never echoes request data.
 * @param response - the response to write.
 * @param status - HTTP status.
 * @param code - the route family's error code.
 * @param message - reason to report.
 */
export function sendError<C extends string>(response: ServerResponse, status: number, code: C, message: string): void {
  sendJson(response, status, { error: { code, message } })
}
