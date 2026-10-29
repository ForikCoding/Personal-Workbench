/**
 * The document route a card's own script calls.
 *
 * The listing and file bodies are asserted here, and so is every refusal status: the client
 * renders a failure from the code, so the code and the status have to agree with the
 * service's own reasons.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createWorkbenchSkillCardFilesHandler } from '../src/skill-card-files-route.ts'
import type { SkillCardRouteFence } from '../src/skill-card-route.ts'
import { FakeRequest, run } from './support/fake-http.ts'

/** The card the workspace belongs to. */
const CARD = 'card-under-test'

/** The route's own path, as the client asks for it. */
const PATH = '/api/workbench/skill-card/files'

/**
 * One fenced handler.
 * @param rejection - the fence's answer, when the case is about the fence.
 * @param workspaceOf - the workspace lookup, overridden for the "no workspace" case.
 * @returns the handler.
 */
function handler(
  rejection?: 401 | 403,
  workspaceOf: (cardId: string) => string | undefined = () => workspace,
): (request: IncomingMessage, response: ServerResponse) => void {
  const fence: SkillCardRouteFence = { requestRejection: () => rejection }
  return createWorkbenchSkillCardFilesHandler({ workspaceOf, fence, warn: () => {} })
}

/**
 * Build one GET request.
 * @param query - the query string, without its `?`.
 * @param method - the HTTP method.
 * @returns the request double.
 */
function at(query: string, method = 'GET'): FakeRequest {
  const request = new FakeRequest(method)
  request.url = `${PATH}?${query}`
  return request
}

/** The workspace the cases read; one temp directory per case. */
let root = ''
/** The card's own directory. */
let workspace = ''
/** A directory outside it. */
let outside = ''

describe('workbench skill card documents route', () => {
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'dsh-wb-route-'))
    workspace = join(root, 'ws')
    outside = join(root, 'out')
    await mkdir(join(workspace, 'docs'), { recursive: true })
    await mkdir(outside, { recursive: true })
    await writeFile(join(workspace, 'docs', 'a.md'), '# A\n', 'utf8')
    await writeFile(join(outside, 'secret.md'), 'secret', 'utf8')
    await writeFile(join(workspace, 'binary.bin'), Buffer.from([0x00, 0x01]))
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('answers a fenced request without reading anything', async () => {
    const response = await run(handler(403), at(`cardId=${CARD}&path=`))
    expect(response.statusCode).toBe(403)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('answers an unauthenticated request as unauthorized', async () => {
    const response = await run(handler(401), at(`cardId=${CARD}&path=`))
    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.body).error.code).toBe('unauthorized')
  })

  it('names the method it serves', async () => {
    const response = await run(handler(), at(`cardId=${CARD}&path=`, 'POST'))
    expect(response.statusCode).toBe(405)
    expect(response.headers.get('allow')).toBe('GET')
  })

  it('refuses a request that names no card', async () => {
    for (const query of ['path=', 'cardId=&path=', 'cardId=not%20a%20card&path=']) {
      const response = await run(handler(), at(query))
      expect(response.statusCode, query).toBe(400)
      expect(JSON.parse(response.body).error.code).toBe('invalid-card')
    }
  })

  it('lists one directory', async () => {
    const response = await run(handler(), at(`cardId=${CARD}&path=${encodeURIComponent('docs')}`))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      apiVersion: 1,
      kind: 'directory',
      path: 'docs',
      entries: [{ name: 'a.md', path: 'docs/a.md', type: 'file', size: 4 }],
      truncated: false,
    })
  })

  it('lists the workspace itself when the request names no path', async () => {
    const response = await run(handler(), at(`cardId=${CARD}`))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).kind).toBe('directory')
    expect(JSON.parse(response.body).path).toBe('')
  })

  it('reads one file with the same request shape a listing uses', async () => {
    // One request for "show me what is at this path": asking for a file and asking for a
    // directory differ in the answer, not in the URL a script has to build.
    const response = await run(handler(), at(`cardId=${CARD}&path=${encodeURIComponent('docs/a.md')}`))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      apiVersion: 1,
      kind: 'file',
      path: 'docs/a.md',
      text: '# A\n',
      bytes: 4,
    })
  })

  it('reports a path outside the workspace as forbidden', async () => {
    const response = await run(handler(), at(`cardId=${CARD}&path=${encodeURIComponent('../out/secret.md')}`))
    expect(response.statusCode).toBe(403)
    expect(JSON.parse(response.body).error.code).toBe('outside-workspace')
  })

  it('reports a missing path as not found', async () => {
    const response = await run(handler(), at(`cardId=${CARD}&path=${encodeURIComponent('docs/gone.md')}`))
    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body).error.code).toBe('not-found')
  })

  it('reports a binary file as an unsupported type', async () => {
    const response = await run(handler(), at(`cardId=${CARD}&path=${encodeURIComponent('binary.bin')}`))
    expect(response.statusCode).toBe(415)
    expect(JSON.parse(response.body).error.code).toBe('not-text')
  })

  it('reports a card with no workspace', async () => {
    const response = await run(handler(undefined, () => undefined), at(`cardId=${CARD}&path=`))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.code).toBe('no-workspace')
  })

  it('refuses a path carrying a NUL before it reaches the filesystem', async () => {
    const response = await run(handler(), at(`cardId=${CARD}&path=${encodeURIComponent('docs\u0000/a.md')}`))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.code).toBe('invalid-request')
  })
})
