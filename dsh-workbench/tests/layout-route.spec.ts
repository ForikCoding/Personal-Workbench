/** Request fencing, method handling, and payload validation of the layout route. */

import { describe, expect, it, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createWorkbenchLayoutHandler } from '../src/layout-route.ts'
import type { LayoutRouteFence } from '../src/layout-route.ts'
import { WorkbenchLayoutService } from '../src/layout-service.ts'
import { FakeLayoutTable } from './support/fake-layout-table.ts'
import { FakeRequest, FakeResponse, run } from './support/fake-http.ts'

/** Fence double with a configurable rejection. */
function fence(rejection: 401 | 403 | undefined): LayoutRouteFence {
  return { requestRejection: () => rejection }
}

/** Table that fails the spec if the route reaches storage. */
function forbiddenTable(): FakeLayoutTable {
  const table = new FakeLayoutTable()
  table.entries = () => { throw new Error('storage was read') }
  table.put = () => { throw new Error('storage was written') }
  table.delete = () => { throw new Error('storage was written') }
  return table
}

/**
 * Build a handler plus its table.
 * @param options - fence rejection, seeded records, and logger seam.
 * @returns the handler, the table, and the logger spy.
 */
function setup(options: { rejection?: 401 | 403; seed?: Record<string, { position?: number }>; table?: FakeLayoutTable } = {}): {
  handle: (request: IncomingMessage, response: ServerResponse) => void
  table: FakeLayoutTable
  warn: ReturnType<typeof vi.fn>
  service: WorkbenchLayoutService
} {
  const table = options.table ?? new FakeLayoutTable(options.seed ?? {})
  const service = new WorkbenchLayoutService({
    domainName: 'workbench_layout',
    table,
    events: { on: () => () => {} },
    maxRecords: 256,
    bootStamp: 11,
  })
  const warn = vi.fn()
  const handle = createWorkbenchLayoutHandler({
    service,
    fence: fence(options.rejection),
    maxRecords: 256,
    warn,
  })
  return { handle, table, warn, service }
}

describe('workbench layout route', () => {
  it('answers a fenced request without touching storage', async () => {
    const { handle, table } = setup({ rejection: 401, table: forbiddenTable() })
    const response = await run(handle, new FakeRequest('GET'))
    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.body)).toEqual({ error: { code: 'unauthorized', message: 'request rejected' } })
    expect(table.operations).toEqual([])
  })

  it('reports a forbidden request as such', async () => {
    const { handle } = setup({ rejection: 403 })
    const response = await run(handle, new FakeRequest('GET'))
    expect(response.statusCode).toBe(403)
    expect(JSON.parse(response.body).error.code).toBe('forbidden')
  })

  it('serves the stored layout with the contract version', async () => {
    const { handle } = setup({ seed: { 'git-repo': { position: 1024 } } })
    const response = await run(handle, new FakeRequest('GET'))
    expect(response.statusCode).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(JSON.parse(response.body)).toEqual({
      apiVersion: 1,
      revision: '11:0',
      entries: [{ id: 'git-repo', position: 1024 }],
    })
  })

  it('applies a patch and echoes the new snapshot', async () => {
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('PATCH', {
      baseRevision: '11:0',
      entries: [{ id: 'git-repo', position: 2048 }],
    }))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).entries).toEqual([{ id: 'git-repo', position: 2048 }])
  })

  it('ignores a hidden field in a patch that still carries one', async () => {
    // A client from an older build may still send `hidden`. The field is not part
    // of the contract any more, so the route stores the ordering alone.
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('PATCH', {
      baseRevision: '11:0',
      entries: [{ id: 'git-repo', position: 2048, hidden: true }],
    }))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).entries).toEqual([{ id: 'git-repo', position: 2048 }])
  })

  it('answers a stale base revision with the current snapshot and 409', async () => {
    const { handle } = setup({ seed: { 'git-repo': { position: 1024 } } })
    const response = await run(handle, new FakeRequest('PATCH', {
      baseRevision: 'stale',
      entries: [{ id: 'git-repo', position: 1 }],
    }))
    expect(response.statusCode).toBe(409)
    expect(JSON.parse(response.body).entries).toEqual([{ id: 'git-repo', position: 1024 }])
  })

  it('rejects a malformed body with a reason and no storage access', async () => {
    const cases = [
      { body: { baseRevision: 1, entries: [] }, message: 'baseRevision must be a string' },
      { body: { baseRevision: '11:0', entries: {} }, message: 'entries must be an array' },
      { body: { baseRevision: '11:0', entries: [{}] }, message: 'each entry needs a namespaced card id' },
      { body: { baseRevision: '11:0', entries: [{ id: 'git-repo', position: -1 }] }, message: 'position must be a finite non-negative number' },
    ]
    for (const { body, message } of cases) {
      const { handle, table } = setup()
      const response = await run(handle, new FakeRequest('PATCH', body))
      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({ error: { code: 'invalid-request', message } })
      expect(table.operations).toEqual([])
    }
  })

  it('rejects an empty or unreadable body', async () => {
    const { handle } = setup()
    const empty = await run(handle, new FakeRequest('PATCH'))
    expect(empty.statusCode).toBe(400)
    expect(JSON.parse(empty.body).error.message).toBe('request body is empty')

    const unreadable = await run(handle, FakeRequest.raw('PATCH', '{not json'))
    expect(JSON.parse(unreadable.body).error.message).toBe('request body is not JSON')
  })

  it('rejects a body above the byte cap with 413', async () => {
    const { handle, table } = setup()
    const oversized = FakeRequest.raw('PATCH', JSON.stringify({
      baseRevision: '11:0',
      entries: [],
      padding: 'x'.repeat(70 * 1024),
    }))
    const response = await run(handle, oversized)
    expect(response.statusCode).toBe(413)
    expect(JSON.parse(response.body)).toEqual({
      error: { code: 'invalid-request', message: 'request body is too large' },
    })
    expect(table.operations).toEqual([])
  })

  it('rejects an unsupported method with an allow list', async () => {
    const { handle } = setup()
    const response = new FakeResponse()
    handle(new FakeRequest('DELETE') as unknown as IncomingMessage, response as unknown as ServerResponse)
    expect(response.statusCode).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, PATCH')
  })

  it('reports a storage failure as 500 without echoing the request', async () => {
    const table = new FakeLayoutTable()
    table.put = () => Promise.reject(new Error('disk full'))
    const { handle, warn } = setup({ table })
    const response = await run(handle, new FakeRequest('PATCH', {
      baseRevision: '11:0',
      entries: [{ id: 'git-repo', position: 1 }],
    }))
    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body)).toEqual({ error: { code: 'storage-failure', message: 'layout storage failed' } })
    expect(response.body).not.toContain('git-repo')
    expect(warn).toHaveBeenCalledWith('workbench layout write failed: workbench layout put failed: disk full')
  })
})
