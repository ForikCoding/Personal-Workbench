/**
 * In-memory pipeline-execution table used by the Host-side specs.
 *
 * It mirrors the storage-domain table the service consumes and records every durable
 * operation, so a spec can assert exactly what an append stored and what the caps removed.
 */
import type { WorkbenchPipelineRun } from '../../src/pipeline-contract.ts'
import { pipelineRunKey } from '../../src/pipeline-run-service.ts'
import type { PipelineRunTable } from '../../src/pipeline-run-service.ts'

/** One recorded durable operation. */
export type PipelineRunTableOperation =
  | { readonly kind: 'put'; readonly key: string; readonly value: WorkbenchPipelineRun }
  | { readonly kind: 'delete'; readonly key: string }

/** Table double with a readable operation log. */
export class FakePipelineRunTable implements PipelineRunTable {
  /** Every durable operation in call order. */
  readonly operations: PipelineRunTableOperation[] = []
  private readonly records = new Map<string, WorkbenchPipelineRun>()

  /**
   * @param seed - records the table starts with, keyed the way the service keys them.
   */
  constructor(seed: readonly WorkbenchPipelineRun[] = []) {
    // Keyed by the service's own function rather than by a copy of its format: a double that
    // spelled the key itself is what let a key the real store rejects pass every spec.
    for (const record of seed) this.records.set(pipelineRunKey(record), record)
  }

  /** @param key - record key. @returns the stored record. */
  get(key: string): WorkbenchPipelineRun | undefined {
    return this.records.get(key)
  }

  /** @returns a snapshot of the stored pairs. */
  entries(): IterableIterator<[string, WorkbenchPipelineRun]> {
    return new Map(this.records).entries()
  }

  /**
   * @param key - record key.
   * @param value - complete record.
   */
  async put(key: string, value: WorkbenchPipelineRun): Promise<void> {
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
