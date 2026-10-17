/**
 * In-memory layout table used by the Host-side specs.
 *
 * It mirrors the storage-domain table the service consumes and records every
 * durable operation, so a spec can assert exactly what a patch wrote.
 */
import type { WorkbenchCardLayoutRecord } from '../../src/layout-contract.ts'
import type { LayoutRecordTable } from '../../src/layout-service.ts'

/** One recorded durable operation. */
export type TableOperation =
  | { readonly kind: 'put'; readonly key: string; readonly value: WorkbenchCardLayoutRecord }
  | { readonly kind: 'delete'; readonly key: string }

/** Table double with a readable operation log. */
export class FakeLayoutTable implements LayoutRecordTable {
  /** Every durable operation in call order. */
  readonly operations: TableOperation[] = []
  private readonly records = new Map<string, WorkbenchCardLayoutRecord>()

  /**
   * @param seed - records the table starts with.
   */
  constructor(seed: Readonly<Record<string, WorkbenchCardLayoutRecord>> = {}) {
    for (const [key, value] of Object.entries(seed)) this.records.set(key, value)
  }

  /** @param key - record key. @returns the stored record. */
  get(key: string): WorkbenchCardLayoutRecord | undefined {
    return this.records.get(key)
  }

  /** @returns a snapshot of the stored pairs. */
  entries(): IterableIterator<[string, WorkbenchCardLayoutRecord]> {
    return new Map(this.records).entries()
  }

  /**
   * @param key - record key.
   * @param value - complete record.
   */
  async put(key: string, value: WorkbenchCardLayoutRecord): Promise<void> {
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
