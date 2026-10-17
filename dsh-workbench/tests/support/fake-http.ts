/**
 * HTTP doubles shared by the Host-side route specs.
 *
 * A route handler owns the full response lifecycle, so the specs drive it with a
 * readable request stream and a response that records what was written.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { expect, vi } from 'vitest'

/** Minimal incoming-request double: a JSON body, then end of stream. */
export class FakeRequest extends Readable {
  readonly method: string
  /** Request URL; routes reading query parameters rely on it. */
  url = '/'
  readonly headers: Record<string, string> = {}

  /**
   * @param method - HTTP method.
   * @param body - JSON body to stream; `undefined` streams nothing.
   * @param end - whether to close the stream immediately.
   */
  constructor(method: string, body?: unknown, end = true) {
    super()
    this.method = method
    if (body !== undefined) this.push(JSON.stringify(body))
    if (end) this.push(null)
  }

  /**
   * Stream one raw chunk instead of a JSON body, then close.
   * @param method - HTTP method.
   * @param chunk - raw bytes to expose as the whole body.
   * @returns the request, ready to read.
   */
  static raw(method: string, chunk: string): FakeRequest {
    const request = new FakeRequest(method, undefined, false)
    request.push(chunk)
    request.push(null)
    return request
  }
}

/** Response double recording status, headers, and payload. */
export class FakeResponse {
  statusCode = 200
  readonly headers = new Map<string, string>()
  body = ''
  ended = false

  /**
   * @param name - header name.
   * @param value - header value.
   */
  setHeader(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value)
  }

  /**
   * @param chunk - payload chunk.
   * @returns this response, for chaining.
   */
  write(chunk: string): this {
    this.body += chunk
    return this
  }

  /** @returns this response, for chaining. */
  end(): this {
    this.ended = true
    return this
  }
}

/**
 * Run one request through a handler and settle after async bodies finish.
 * @param handle - route handler.
 * @param request - request double.
 * @returns the recorded response.
 */
export async function run(
  handle: (request: IncomingMessage, response: ServerResponse) => void,
  request: FakeRequest,
): Promise<FakeResponse> {
  const response = new FakeResponse()
  handle(request as unknown as IncomingMessage, response as unknown as ServerResponse)
  await vi.waitFor(() => { expect(response.ended).toBe(true) })
  return response
}
