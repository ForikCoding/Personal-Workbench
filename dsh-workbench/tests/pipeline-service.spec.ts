/** Revision handling, storage order, and validation of the pipeline service. */

import { describe, expect, it, vi } from 'vitest'
import type { WorkbenchPipeline } from '../src/pipeline-contract.ts'
import { WorkbenchPipelineService, WorkbenchPipelineStorageError } from '../src/pipeline-service.ts'
import { FakePipelineTable } from './support/fake-pipeline-table.ts'

/** One well-formed pipeline. */
function pipeline(overrides: Partial<WorkbenchPipeline> = {}): WorkbenchPipeline {
  return { id: 'pipeline-1', name: '发布检查', steps: [{ cardId: 'card-1' }], updatedAt: 1, ...overrides }
}

/**
 * Build a service over a fresh table.
 * @param options - seeded records and the domain event sink.
 * @returns the service, its table, and the change listener registry.
 */
function setup(options: { seed?: Record<string, { name: string; steps: { cardId: string }[]; updatedAt: number }>; maxPipelines?: number } = {}): {
  service: WorkbenchPipelineService
  table: FakePipelineTable
  emit: (domain: string) => void
} {
  const table = new FakePipelineTable(options.seed ?? {})
  const listeners: ((change: { readonly domain: string }) => void)[] = []
  const service = new WorkbenchPipelineService({
    domainName: 'workbench_pipeline',
    table,
    events: {
      on: (_event, listener) => {
        listeners.push(listener)
        return () => {
          const index = listeners.indexOf(listener)
          if (index >= 0) listeners.splice(index, 1)
        }
      },
    },
    maxPipelines: options.maxPipelines ?? 64,
    bootStamp: 7,
  })
  return { service, table, emit: (domain) => { for (const listener of [...listeners]) listener({ domain }) } }
}

describe('workbench pipeline service', () => {
  it('reads an empty set with the contract version', () => {
    const { service } = setup()
    expect(service.read()).toEqual({ apiVersion: 1, revision: '7:0', pipelines: [] })
  })

  it('reads stored pipelines ordered by id', () => {
    const { service } = setup({
      seed: {
        'pipeline-b': { name: 'B', steps: [{ cardId: 'card-2' }], updatedAt: 5 },
        'pipeline-a': { name: 'A', steps: [], updatedAt: 9 },
      },
    })
    expect(service.read().pipelines.map(entry => entry.id)).toEqual(['pipeline-a', 'pipeline-b'])
  })

  it('counts domain changes into the revision, and only its own domain', () => {
    const { service, emit } = setup()
    emit('workbench_layout')
    expect(service.revision).toBe('7:0')
    emit('workbench_pipeline')
    expect(service.revision).toBe('7:1')
  })

  it('writes a new pipeline and answers with the stored snapshot', async () => {
    const { service, table } = setup()
    const result = await service.write({ baseRevision: '7:0', pipelines: [pipeline()] })
    expect(result.status).toBe('written')
    if (result.status !== 'written') return
    expect(result.snapshot.pipelines).toEqual([pipeline()])
    expect(table.operations).toEqual([{
      kind: 'put',
      key: 'pipeline-1',
      value: { name: '发布检查', steps: [{ cardId: 'card-1' }], updatedAt: 1 },
    }])
  })

  it('refuses a stale base revision without writing', async () => {
    const { service, table } = setup({ seed: { 'pipeline-1': { name: '旧', steps: [], updatedAt: 1 } } })
    const result = await service.write({ baseRevision: 'stale', pipelines: [] })
    expect(result.status).toBe('conflict')
    if (result.status !== 'conflict') return
    expect(result.snapshot.pipelines.map(entry => entry.name)).toEqual(['旧'])
    expect(table.operations).toEqual([])
  })

  it('deletes pipelines the write leaves out', async () => {
    const { service, table } = setup({
      seed: {
        'pipeline-1': { name: 'A', steps: [], updatedAt: 1 },
        'pipeline-2': { name: 'B', steps: [], updatedAt: 1 },
      },
    })
    const result = await service.write({ baseRevision: '7:0', pipelines: [pipeline({ id: 'pipeline-2' })] })
    expect(result.status).toBe('written')
    expect(table.operations.map(operation => `${operation.kind}:${operation.key}`)).toEqual([
      'delete:pipeline-1',
      'put:pipeline-2',
    ])
  })

  it('deletes before it writes, so a rename into a freed id survives', async () => {
    const { service, table } = setup({ seed: { 'pipeline-old': { name: 'A', steps: [], updatedAt: 1 } } })
    await service.write({
      baseRevision: '7:0',
      pipelines: [pipeline({ id: 'pipeline-new' }), pipeline({ id: 'pipeline-1' })],
    })
    expect(table.operations.map(operation => `${operation.kind}:${operation.key}`)).toEqual([
      'delete:pipeline-old',
      'put:pipeline-1',
      'put:pipeline-new',
    ])
  })

  it('refuses an invalid list without writing', async () => {
    const { service, table } = setup()
    const result = await service.write({ baseRevision: '7:0', pipelines: [{ ...pipeline(), name: '' }] })
    expect(result.status).toBe('invalid')
    if (result.status !== 'invalid') return
    expect(result.reason).toContain('non-empty name')
    expect(table.operations).toEqual([])
  })

  it('refuses more pipelines than the deployment stores', async () => {
    const { service, table } = setup({ maxPipelines: 1 })
    const result = await service.write({
      baseRevision: '7:0',
      pipelines: [pipeline({ id: 'pipeline-1' }), pipeline({ id: 'pipeline-2' })],
    })
    expect(result.status).toBe('invalid')
    if (result.status !== 'invalid') return
    expect(result.reason).toContain('this deployment stores 1 pipelines')
    expect(table.operations).toEqual([])
  })

  it('names the failing storage operation', async () => {
    const { service, table } = setup()
    table.put = () => Promise.reject(new Error('disk full'))
    await expect(service.write({ baseRevision: '7:0', pipelines: [pipeline()] }))
      .rejects.toBeInstanceOf(WorkbenchPipelineStorageError)
    await expect(service.write({ baseRevision: '7:0', pipelines: [pipeline()] }))
      .rejects.toThrow('workbench pipeline put failed: disk full')
  })

  it('stops observing once disposed', () => {
    const { service, emit } = setup()
    service.dispose()
    emit('workbench_pipeline')
    expect(service.revision).toBe('7:0')
  })

  it('tolerates a second dispose', () => {
    const { service } = setup()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    service.dispose()
    expect(() => { service.dispose() }).not.toThrow()
    warn.mockRestore()
  })
})
