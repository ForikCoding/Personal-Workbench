/**
 * In-memory pipeline table used by the Host-side specs.
 *
 * It mirrors the storage-domain table the service consumes and records every durable
 * operation, so a spec can assert exactly what a write stored and what it removed.
 */
import type { WorkbenchPipelineRecord } from '../../src/pipeline-contract.ts'
import type { PipelineRecordTable } from '../../src/pipeline-service.ts'

/** One recorded durable operation. */
export type PipelineTableOperation =
  | { readonly kind: 'put'; readonly key: string; readonly value: WorkbenchPipelineRecord }
  | { readonly kind: 'delete'; readonly key: string }

/** Table double with a readable operation log. */
export class FakePipelineTable implements PipelineRecordTable {
  /** Every durable operation in call order. */
  readonly operations: PipelineTableOperation[] = []
  private readonly records = new Map<string, WorkbenchPipelineRecord>()

  /**
   * @param seed - records the table starts with.
   */
  constructor(seed: Readonly<Record<string, WorkbenchPipelineRecord>> = {}) {
    for (const [key, value] of Object.entries(seed)) this.records.set(key, value)
  }

  /** @param key - record key. @returns the stored record. */
  get(key: string): WorkbenchPipelineRecord | undefined {
    return this.records.get(key)
  }

  /** @returns a snapshot of the stored pairs. */
  entries(): IterableIterator<[string, WorkbenchPipelineRecord]> {
    return new Map(this.records).entries()
  }

  /**
   * @param key - record key.
   * @param value - complete record.
   */
  async put(key: string, value: WorkbenchPipelineRecord): Promise<void> {
    this.operations.push({ kind: 'put', key, value })
    this.records.set(key, value)
  }

  /**
   * @param key - record key.
   * @returns whether a record was removed.
   */
  async delete(key: string): Promise<boolean> {
    this.operations.push({ kind: 'delete', key })
    return this.records.delete(key)
  }
}
