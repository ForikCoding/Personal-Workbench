/** Request fencing, method handling, and payload validation of the execution-record route. */

import { describe, expect, it, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WorkbenchPipelineRun, WorkbenchPipelineRunDraft } from '../src/pipeline-contract.ts'
import { createWorkbenchPipelineRunHandler } from '../src/pipeline-run-route.ts'
import type { LayoutRouteFence } from '../src/layout-route.ts'
import { WorkbenchPipelineRunService } from '../src/pipeline-run-service.ts'
import { FakePipelineRunTable } from './support/fake-pipeline-run-table.ts'
import { FakeRequest, FakeResponse, run } from './support/fake-http.ts'

/** One execution as the run engine hands it over. */
function draft(overrides: Partial<WorkbenchPipelineRunDraft> = {}): WorkbenchPipelineRunDraft {
  return {
    pipelineId: 'pipeline-1',
    startedAt: 1_000,
    tookMs: 2_000,
    phase: 'settled',
    scope: 'full',
    steps: [{ cardId: 'card-1', phase: 'done', tookMs: 2_000, html: '<p>done</p>' }],
    ...overrides,
  }
}

/** One stored execution. */
function record(overrides: Partial<WorkbenchPipelineRun> = {}): WorkbenchPipelineRun {
  return { no: 1, ...draft(), ...overrides }
}

/** Fence double with a configurable rejection. */
function fence(rejection: 401 | 403 | undefined): LayoutRouteFence {
  return { requestRejection: () => rejection }
}

/** Table that fails the spec if the route reaches storage. */
function forbiddenTable(): FakePipelineRunTable {
  const table = new FakePipelineRunTable()
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
function setup(options: { rejection?: 401 | 403; seed?: readonly WorkbenchPipelineRun[]; table?: FakePipelineRunTable } = {}): {
  handle: (request: IncomingMessage, response: ServerResponse) => void
  table: FakePipelineRunTable
  warn: ReturnType<typeof vi.fn>
} {
  const table = options.table ?? new FakePipelineRunTable(options.seed ?? [])
  const service = new WorkbenchPipelineRunService({ table, runsPerPipeline: 20, maxTotal: 200 })
  const warn = vi.fn()
  const handle = createWorkbenchPipelineRunHandler({ service, fence: fence(options.rejection), warn })
  return { handle, table, warn }
}

describe('workbench pipeline run route', () => {
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

  it('serves the stored records with the contract version', async () => {
    const { handle } = setup({ seed: [record({ no: 2, startedAt: 9_000 }), record({ no: 1 })] })
    const response = await run(handle, new FakeRequest('GET'))
    expect(response.statusCode).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(JSON.parse(response.body)).toEqual({
      apiVersion: 1,
      runs: [record({ no: 2, startedAt: 9_000 }), record({ no: 1 })],
    })
  })

  it('stores one execution and answers with the record it numbered', async () => {
    const { handle, table } = setup()
    const response = await run(handle, new FakeRequest('POST', draft()))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toMatchObject({
      apiVersion: 1,
      run: { pipelineId: 'pipeline-1', no: 1, scope: 'full' },
    })
    expect(JSON.parse(response.body).runs).toEqual([{ ...draft(), no: 1 }])
    expect(table.operations.map(operation => operation.kind)).toEqual(['put'])
  })

  it('ignores a number a client tried to choose', async () => {
    // Two windows finish the same pipeline; only the store can hand out the ordinal. A body
    // carrying one is not this contract, and taking it would let a client name a run twice.
    const { handle, table } = setup()
    const response = await run(handle, new FakeRequest('POST', { ...draft(), no: 9 }))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).run.no).toBe(1)
    expect(table.operations.filter(operation => operation.kind === 'put')).toHaveLength(1)
  })

  it('refuses an execution naming no pipeline', async () => {
    const { handle, table } = setup()
    const response = await run(handle, new FakeRequest('POST', { ...draft(), pipelineId: 42 }))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.code).toBe('invalid-request')
    expect(table.operations).toEqual([])
  })

  it('refuses a step that never ended', async () => {
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('POST', {
      ...draft(),
      steps: [{ cardId: 'card-1', phase: 'running' }],
    }))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.message).toContain('phase must be done, failed, or stopped')
  })

  it('refuses a body that is not an execution at all', async () => {
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('POST', ['nope']))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.message).toBe('body must be an object')
  })

  it('answers a storage failure as such, and logs the detail', async () => {
    const failing = new FakePipelineRunTable()
    failing.put = async () => { throw new Error('disk is full') }
    const { handle, warn } = setup({ table: failing })
    const response = await run(handle, new FakeRequest('POST', draft()))
    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body)).toEqual({ error: { code: 'storage-failure', message: 'pipeline run storage failed' } })
    expect(warn).toHaveBeenCalledWith('workbench pipeline run write failed: workbench pipeline run put failed: disk is full')
  })

  it('allows only the two methods it has', async () => {
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('DELETE'))
    expect(response.statusCode).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, POST')
    expect(response.ended).toBe(true)
    expect(response).toBeInstanceOf(FakeResponse)
  })
})
