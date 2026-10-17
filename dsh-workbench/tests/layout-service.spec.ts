/** Read, write, revision, and conflict behaviour of the layout service. */

import { describe, expect, it } from 'vitest'
import type { WorkbenchCardLayoutRecord, WorkbenchLayoutEntry } from '../src/layout-contract.ts'
import { WorkbenchLayoutService, WorkbenchLayoutStorageError } from '../src/layout-service.ts'
import { FakeLayoutTable } from './support/fake-layout-table.ts'

/** Change source that lets a spec emit domain changes. */
class FakeChangeSource {
  private readonly listeners = new Set<(change: { readonly domain: string }) => void>()

  /** @param event - event name; only `domain/changed` is accepted. */
  on(event: 'domain/changed', listener: (change: { readonly domain: string }) => void): () => void {
    if (event !== 'domain/changed') throw new Error(`unexpected event ${event}`)
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** @param domain - domain name of the change to announce. */
  emit(domain: string): void {
    for (const listener of this.listeners) listener({ domain })
  }
}

/**
 * Build a service over a fake table.
 * @param seed - records the table starts with.
 * @returns the service, its table, and its change source.
 */
function setup(seed: Readonly<Record<string, WorkbenchCardLayoutRecord>> = {}): {
  service: WorkbenchLayoutService
  table: FakeLayoutTable
  changes: FakeChangeSource
} {
  const table = new FakeLayoutTable(seed)
  const changes = new FakeChangeSource()
  const service = new WorkbenchLayoutService({
    domainName: 'workbench_layout',
    table,
    events: changes,
    maxRecords: 256,
    bootStamp: 7,
  })
  return { service, table, changes }
}

describe('WorkbenchLayoutService.read', () => {
  it('projects the stored records sorted by card id and reports the boot revision', () => {
    const { service } = setup({
      'git-repo': { position: 2048 },
      'agent-runs': { position: 1024 },
    })
    expect(service.read()).toEqual({
      revision: '7:0',
      entries: [
        { id: 'agent-runs', position: 1024 },
        { id: 'git-repo', position: 2048 },
      ],
    })
  })

  it('advances the revision only for changes of its own domain', () => {
    const { service, changes } = setup()
    changes.emit('some_other_domain')
    expect(service.revision).toBe('7:0')
    changes.emit('workbench_layout')
    expect(service.revision).toBe('7:1')
  })

  it('stops observing changes once disposed', () => {
    const { service, changes } = setup()
    service.dispose()
    changes.emit('workbench_layout')
    expect(service.revision).toBe('7:0')
  })
})

describe('WorkbenchLayoutService.write', () => {
  it('writes changed cards and echoes the resulting snapshot', async () => {
    const { service, table } = setup()
    const result = await service.write({
      baseRevision: service.revision,
      entries: [{ id: 'git-repo', position: 1024 }],
    })
    expect(result).toEqual({
      status: 'written',
      snapshot: { revision: '7:0', entries: [{ id: 'git-repo', position: 1024 }] },
    })
    expect(table.operations).toEqual([{ kind: 'put', key: 'git-repo', value: { position: 1024 } }])
  })

  it('refuses a stale base revision without writing anything', async () => {
    const { service, table } = setup({ 'git-repo': { position: 1024 } })
    const result = await service.write({
      baseRevision: 'stale',
      entries: [{ id: 'git-repo', position: 9999 }],
    })
    expect(result.status).toBe('conflict')
    expect(result.status === 'conflict' && result.snapshot.entries).toEqual([{ id: 'git-repo', position: 1024 }])
    expect(table.operations).toEqual([])
  })

  it('deletes a record when a patch returns the card to its default', async () => {
    const { service, table } = setup({ 'git-repo': { position: 1024 } })
    const result = await service.write({ baseRevision: service.revision, entries: [{ id: 'git-repo' }] })
    expect(result.status).toBe('written')
    expect(table.operations).toEqual([{ kind: 'delete', key: 'git-repo' }])
  })

  it('ignores a hidden field in a patch that still carries one', async () => {
    // A client or a stored document from an older build may still send `hidden`.
    // It is not part of the record, so the write stores ordering and nothing else.
    const { service, table } = setup({ 'git-repo': { position: 1024 } })
    const stale = { id: 'git-repo', position: 2048, hidden: true } as unknown as WorkbenchLayoutEntry
    await service.write({ baseRevision: service.revision, entries: [stale] })
    expect(table.operations).toEqual([{ kind: 'put', key: 'git-repo', value: { position: 2048 } }])
  })

  it('rejects card ids outside the namespaced slug rule', async () => {
    const { service, table } = setup()
    const result = await service.write({ baseRevision: service.revision, entries: [{ id: 'Git Repo' }] })
    expect(result).toEqual({ status: 'invalid', reason: 'card id "Git Repo" is not a namespaced slug' })
    expect(table.operations).toEqual([])
  })

  it('rejects a repeated card id inside one patch', async () => {
    const { service } = setup()
    const result = await service.write({
      baseRevision: service.revision,
      entries: [{ id: 'git-repo', position: 1 }, { id: 'git-repo', position: 2 }],
    })
    expect(result.status).toBe('invalid')
  })

  it('rejects a non-finite or negative position', async () => {
    const { service } = setup()
    for (const position of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = await service.write({ baseRevision: service.revision, entries: [{ id: 'git-repo', position }] })
      expect(result.status).toBe('invalid')
    }
  })

  it('rejects a patch above the stored-record cap', async () => {
    const table = new FakeLayoutTable()
    const service = new WorkbenchLayoutService({
      domainName: 'workbench_layout',
      table,
      events: new FakeChangeSource(),
      maxRecords: 2,
      bootStamp: 7,
    })
    const entries = ['a-card', 'b-card', 'c-card'].map(id => ({ id, position: 1 }))
    const result = await service.write({ baseRevision: service.revision, entries })
    expect(result).toEqual({ status: 'invalid', reason: 'patch carries 3 entries, above the 2 limit' })
    expect(table.operations).toEqual([])
  })

  it('writes one patch in card-id order so a request cannot overwrite itself', async () => {
    const { service, table } = setup()
    await service.write({
      baseRevision: service.revision,
      entries: [{ id: 'git-repo', position: 2 }, { id: 'agent-runs', position: 1 }],
    })
    expect(table.operations.map(operation => operation.key)).toEqual(['agent-runs', 'git-repo'])
  })

  it('names the failing storage operation', async () => {
    const table = new FakeLayoutTable()
    table.put = () => Promise.reject(new Error('disk full'))
    const service = new WorkbenchLayoutService({
      domainName: 'workbench_layout',
      table,
      events: new FakeChangeSource(),
      maxRecords: 256,
      bootStamp: 7,
    })
    await expect(service.write({ baseRevision: service.revision, entries: [{ id: 'git-repo', position: 1 }] }))
      .rejects.toBeInstanceOf(WorkbenchLayoutStorageError)
  })
})
