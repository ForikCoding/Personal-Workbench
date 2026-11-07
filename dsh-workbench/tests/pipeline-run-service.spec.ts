/** Numbering, ordering, and the caps of the pipeline-execution store. */

import { describe, expect, it } from 'vitest'
import type { WorkbenchPipelineRun, WorkbenchPipelineRunDraft } from '../src/pipeline-contract.ts'
import { WorkbenchPipelineRunService, WorkbenchPipelineRunStorageError, pipelineRunKey } from '../src/pipeline-run-service.ts'
import { FakePipelineRunTable } from './support/fake-pipeline-run-table.ts'

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

/**
 * Build a service over a table.
 * @param options - seeded records and cap overrides.
 * @returns the service and its table.
 */
function setup(options: { seed?: readonly WorkbenchPipelineRun[]; runsPerPipeline?: number; maxTotal?: number } = {}) {
  const table = new FakePipelineRunTable(options.seed ?? [])
  const service = new WorkbenchPipelineRunService({
    table,
    runsPerPipeline: options.runsPerPipeline ?? 20,
    maxTotal: options.maxTotal ?? 200,
  })
  return { service, table }
}

describe('workbench pipeline run service', () => {
  it('numbers a pipeline’s executions from one and keeps counting', async () => {
    const { service, table } = setup()
    const first = await service.append(draft())
    const second = await service.append(draft({ startedAt: 3_000 }))
    expect(first.run.no).toBe(1)
    expect(second.run.no).toBe(2)
    expect(table.operations.map(operation => operation.key)).toEqual(['pipeline-1#1', 'pipeline-1#2'])
  })

  it('numbers each pipeline on its own', async () => {
    const { service } = setup({ seed: [record({ pipelineId: 'pipeline-1', no: 7 })] })
    const other = await service.append(draft({ pipelineId: 'pipeline-2' }))
    expect(other.run.no).toBe(1)
    const same = await service.append(draft())
    expect(same.run.no).toBe(8)
  })

  it('answers the records newest first', async () => {
    const { service } = setup({ seed: [
      record({ no: 1, startedAt: 1_000 }),
      record({ no: 2, startedAt: 9_000 }),
      record({ pipelineId: 'pipeline-2', no: 1, startedAt: 5_000 }),
    ] })
    expect(service.read().runs.map(run => `${run.pipelineId}#${String(run.no)}`))
      .toEqual(['pipeline-1#2', 'pipeline-2#1', 'pipeline-1#1'])
  })

  it('drops the oldest execution of a pipeline past its cap', async () => {
    // Three records already stored, and the cap is two: the append lands and the oldest of
    // the four is what goes, not the newest.
    const { service, table } = setup({
      runsPerPipeline: 2,
      seed: [record({ no: 1 }), record({ no: 2 }), record({ no: 3 })],
    })
    const written = await service.append(draft({ startedAt: 4_000 }))
    expect(written.run.no).toBe(4)
    expect(table.operations.filter(operation => operation.kind === 'delete').map(operation => operation.key).sort())
      .toEqual(['pipeline-1#1', 'pipeline-1#2'])
    expect(service.read().runs.map(run => run.no)).toEqual([4, 3])
  })

  it('drops the oldest executions overall past the deployment cap', async () => {
    const { service } = setup({
      maxTotal: 2,
      seed: [
        record({ pipelineId: 'pipeline-1', no: 1, startedAt: 100 }),
        record({ pipelineId: 'pipeline-2', no: 1, startedAt: 200 }),
      ],
    })
    await service.append(draft({ startedAt: 300 }))
    expect(service.read().runs.map(run => `${run.pipelineId}#${String(run.startedAt)}`))
      .toEqual(['pipeline-1#300', 'pipeline-2#200'])
  })

  it('keys one record by its pipeline and number', async () => {
    expect(pipelineRunKey({ pipelineId: 'pipeline-12', no: 34 })).toBe('pipeline-12#34')
  })

  it('names the operation that failed when storage refuses it', async () => {
    const { service, table } = setup()
    table.put = async () => { throw new Error('disk is full') }
    await expect(service.append(draft())).rejects.toBeInstanceOf(WorkbenchPipelineRunStorageError)
    await expect(service.append(draft())).rejects.toThrow('workbench pipeline run put failed: disk is full')
  })

  it('keeps what a run stored, and nothing it was not given', async () => {
    const { service, table } = setup()
    await service.append(draft({
      scope: 'single',
      only: 0,
      instruction: '只改结论',
      steps: [{ cardId: 'card-2', phase: 'failed', failure: 'the run failed' }],
    }))
    expect(table.operations[0]).toEqual({
      kind: 'put',
      key: 'pipeline-1#1',
      value: {
        pipelineId: 'pipeline-1',
        no: 1,
        startedAt: 1_000,
        tookMs: 2_000,
        phase: 'settled',
        scope: 'single',
        only: 0,
        instruction: '只改结论',
        steps: [{ cardId: 'card-2', phase: 'failed', failure: 'the run failed' }],
      },
    })
  })
})
