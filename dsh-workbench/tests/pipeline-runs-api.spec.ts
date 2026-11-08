/** Transport behaviour of the browser-side execution-record client. */

import { describe, expect, it, vi } from 'vitest'
import type { WorkbenchPipelineRun, WorkbenchPipelineRunDraft } from '../src/pipeline-contract.ts'
import { WORKBENCH_PIPELINE_RUN_PATH } from '../src/pipeline-contract.ts'
import { createWorkbenchPipelineRunsApi } from '../src/client/pipeline-runs-api.ts'

/**
 * Build a JSON response.
 * @param status - HTTP status.
 * @param body - body value.
 * @returns the response.
 */
function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

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

describe('createWorkbenchPipelineRunsApi.read', () => {
  it('returns the records a contract response carries', async () => {
    const fetcher = vi.fn(async () => json(200, { apiVersion: 1, runs: [record()] }))
    const api = createWorkbenchPipelineRunsApi({ fetcher })
    await expect(api.read()).resolves.toEqual({ status: 'ok', runs: [record()] })
    expect(fetcher).toHaveBeenCalledWith(WORKBENCH_PIPELINE_RUN_PATH, expect.objectContaining({ method: 'GET' }))
  })

  it('drops a record that does not decode instead of failing the read', async () => {
    // One unreadable execution must not cost the panel the history it can read.
    const api = createWorkbenchPipelineRunsApi({
      fetcher: async () => json(200, { apiVersion: 1, runs: [record(), { na: 'na' }, record({ no: 2, startedAt: 5_000 })] }),
    })
    const result = await api.read()
    expect(result.status).toBe('ok')
    expect(result.status === 'ok' && result.runs.map(run => run.no)).toEqual([1, 2])
  })

  it('reads where a whole run began, so a re-run of the tail is not a run of everything', async () => {
    const api = createWorkbenchPipelineRunsApi({
      // The second record is malformed on purpose: what arrives over the wire is not typed,
      // and a decode that trusted it would put a string where a step index belongs.
      fetcher: async () => json(200, {
        apiVersion: 1,
        runs: [record({ no: 2, from: 1 }), { ...record({ no: 3 }), from: 'one' }],
      }),
    })
    const result = await api.read()
    expect(result.status === 'ok' && result.runs.map(run => run.from)).toEqual([1, undefined])
  })

  it('reports a mismatched contract version as unavailable', async () => {
    const api = createWorkbenchPipelineRunsApi({ fetcher: async () => json(200, { apiVersion: 2, runs: [] }) })
    const result = await api.read()
    expect(result.status).toBe('unavailable')
  })

  it('reports a rejected route as unavailable, with the Host’s own message', async () => {
    const api = createWorkbenchPipelineRunsApi({
      fetcher: async () => json(500, { error: { code: 'storage-failure', message: 'pipeline run storage failed' } }),
    })
    const result = await api.read()
    expect(result.status === 'unavailable' && result.reason).toBe('pipeline run storage failed')
  })

  it('reports a transport failure as unavailable', async () => {
    const api = createWorkbenchPipelineRunsApi({ fetcher: async () => { throw new Error('offline') } })
    const result = await api.read()
    expect(result.status === 'unavailable' && result.reason).toContain('offline')
  })
})

describe('createWorkbenchPipelineRunsApi.append', () => {
  it('sends the execution and answers with the numbered record the Host stored', async () => {
    const fetcher = vi.fn(async (_input: string, _init?: RequestInit) => json(200, { apiVersion: 1, runs: [record({ no: 4 })] }))
    const api = createWorkbenchPipelineRunsApi({ fetcher })
    const result = await api.append(draft())
    expect(result).toEqual({ status: 'ok', run: record({ no: 4 }) })
    const init = fetcher.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual(draft())
  })

  it('fails when the answer does not contain the record that was sent', async () => {
    // The row the panel draws has to carry the stored number, so an answer without the
    // record is not something it can show.
    const api = createWorkbenchPipelineRunsApi({
      fetcher: async () => json(200, { apiVersion: 1, runs: [record({ pipelineId: 'pipeline-2' })] }),
    })
    const result = await api.append(draft())
    expect(result).toEqual({ status: 'failed', reason: 'the stored run is not in the answer' })
  })

  it('reports a refused append as failed', async () => {
    const api = createWorkbenchPipelineRunsApi({
      fetcher: async () => json(400, { error: { code: 'invalid-request', message: 'step 0 phase must be done, failed, or stopped' } }),
    })
    const result = await api.append(draft())
    expect(result).toEqual({ status: 'failed', reason: 'step 0 phase must be done, failed, or stopped' })
  })
})
