/** Request fencing, method handling, and payload validation of the pipeline route. */

import { describe, expect, it, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WorkbenchPipeline } from '../src/pipeline-contract.ts'
import { createWorkbenchPipelineHandler } from '../src/pipeline-route.ts'
import type { LayoutRouteFence } from '../src/layout-route.ts'
import { WorkbenchPipelineService } from '../src/pipeline-service.ts'
import { FakePipelineTable } from './support/fake-pipeline-table.ts'
import { FakeRequest, FakeResponse, run } from './support/fake-http.ts'

/** One well-formed pipeline. */
function pipeline(overrides: Partial<WorkbenchPipeline> = {}): WorkbenchPipeline {
  return { id: 'pipeline-1', name: '发布检查', steps: [{ cardId: 'card-1' }], updatedAt: 1, ...overrides }
}

/** Fence double with a configurable rejection. */
function fence(rejection: 401 | 403 | undefined): LayoutRouteFence {
  return { requestRejection: () => rejection }
}

/** Table that fails the spec if the route reaches storage. */
function forbiddenTable(): FakePipelineTable {
  const table = new FakePipelineTable()
  table.entries = () => { throw new Error('storage was read') }
  table.put = () => { throw new Error('storage was written') }
  table.delete = () => { throw new Error('storage was written') }
  return table
}

/**
 * Build a handler plus its table.
 * @param options - fence rejection, seeded records, and a table override.
 * @returns the handler, the table, and the logger spy.
 */
function setup(options: { rejection?: 401 | 403; seed?: Record<string, { name: string; steps: { cardId: string }[]; updatedAt: number }>; table?: FakePipelineTable } = {}): {
  handle: (request: IncomingMessage, response: ServerResponse) => void
  table: FakePipelineTable
  warn: ReturnType<typeof vi.fn>
} {
  const table = options.table ?? new FakePipelineTable(options.seed ?? {})
  const service = new WorkbenchPipelineService({
    domainName: 'workbench_pipeline',
    table,
    events: { on: () => () => {} },
    maxPipelines: 64,
    bootStamp: 5,
  })
  const warn = vi.fn()
  const handle = createWorkbenchPipelineHandler({ service, fence: fence(options.rejection), warn })
  return { handle, table, warn }
}

describe('workbench pipeline route', () => {
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

  it('serves the stored set with the contract version', async () => {
    const { handle } = setup({ seed: { 'pipeline-1': { name: '发布检查', steps: [{ cardId: 'card-1' }], updatedAt: 3 } } })
    const response = await run(handle, new FakeRequest('GET'))
    expect(response.statusCode).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(JSON.parse(response.body)).toEqual({
      apiVersion: 1,
      revision: '5:0',
      pipelines: [{ id: 'pipeline-1', name: '发布检查', steps: [{ cardId: 'card-1' }], updatedAt: 3 }],
    })
  })

  it('applies a write and echoes the new snapshot', async () => {
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('PATCH', { baseRevision: '5:0', pipelines: [pipeline()] }))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).pipelines).toEqual([pipeline()])
  })

  it('drops a field outside the contract rather than storing it', async () => {
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('PATCH', {
      baseRevision: '5:0',
      pipelines: [{ ...pipeline(), color: 'red' }],
    }))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).pipelines).toEqual([pipeline()])
  })

  it('answers a stale base revision with the current snapshot and 409', async () => {
    const { handle } = setup({ seed: { 'pipeline-1': { name: '旧', steps: [], updatedAt: 1 } } })
    const response = await run(handle, new FakeRequest('PATCH', { baseRevision: 'stale', pipelines: [] }))
    expect(response.statusCode).toBe(409)
    expect(JSON.parse(response.body).pipelines.map((entry: { name: string }) => entry.name)).toEqual(['旧'])
  })

  it('rejects a malformed body with a reason and no storage access', async () => {
    const cases = [
      { body: { baseRevision: 1, pipelines: [] }, message: 'baseRevision must be a string' },
      { body: { baseRevision: '5:0', pipelines: {} }, message: 'pipelines must be an array' },
      { body: { baseRevision: '5:0', pipelines: [{ ...pipeline(), id: 'Not An Id' }] }, message: 'needs a namespaced id' },
    ]
    for (const { body, message } of cases) {
      const { handle, table } = setup()
      const response = await run(handle, new FakeRequest('PATCH', body))
      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).error.code).toBe('invalid-request')
      expect(JSON.parse(response.body).error.message).toContain(message)
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
      baseRevision: '5:0',
      pipelines: [],
      padding: 'x'.repeat(70 * 1024),
    }))
    const response = await run(handle, oversized)
    expect(response.statusCode).toBe(413)
    expect(JSON.parse(response.body).error.code).toBe('invalid-request')
    expect(table.operations).toEqual([])
  })

  it('rejects an unsupported method with an allow list', () => {
    const { handle } = setup()
    const response = new FakeResponse()
    handle(new FakeRequest('DELETE') as unknown as IncomingMessage, response as unknown as ServerResponse)
    expect(response.statusCode).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, PATCH')
  })

  it('reports a storage failure as 500 without echoing the request', async () => {
    const table = new FakePipelineTable()
    table.put = () => Promise.reject(new Error('disk full'))
    const { handle, warn } = setup({ table })
    const response = await run(handle, new FakeRequest('PATCH', { baseRevision: '5:0', pipelines: [pipeline()] }))
    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body)).toEqual({ error: { code: 'storage-failure', message: 'pipeline storage failed' } })
    expect(response.body).not.toContain('发布检查')
    expect(warn).toHaveBeenCalledWith('workbench pipeline write failed: workbench pipeline put failed: disk full')
  })
})
