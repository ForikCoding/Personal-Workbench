/**
 * Workbench pipeline execution records: the read side, and the append that numbers them.
 *
 * Numbering lives here rather than on the client because two windows can finish the same
 * pipeline at once, and "the next number" is only knowable where the records are. The same
 * is true of the caps: a record that fell off the end is deleted here, so a client cannot
 * leave one behind by never asking again.
 * @module dsh-workbench/pipeline-run-service
 */

import type {
  WorkbenchPipelineRun,
  WorkbenchPipelineRunDraft,
  WorkbenchPipelineRunSnapshot,
} from './pipeline-contract.ts'
import { WORKBENCH_PIPELINE_RUN_API_VERSION } from './pipeline-contract.ts'

/** Read side of the execution table, as this service consumes it. */
export interface PipelineRunTable {
  /**
   * Read one record from memory.
   * @param key - record key, from {@link pipelineRunKey}.
   * @returns the stored record, or `undefined` when absent.
   */
  get(key: string): WorkbenchPipelineRun | undefined
  /**
   * Snapshot the stored pairs.
   * @returns the pair iterator, stable while queued writes land.
   */
  entries(): IterableIterator<[string, WorkbenchPipelineRun]>
  /**
   * Insert or overwrite one record durably.
   * @param key - record key.
   * @param value - the complete new record.
   * @returns resolution after durability.
   */
  put(key: string, value: WorkbenchPipelineRun): Promise<void>
  /**
   * Delete one record durably.
   * @param key - record key.
   * @returns whether a record was removed.
   */
  delete(key: string): Promise<boolean>
}

/** What an append did. */
export type WorkbenchPipelineRunAppendResult =
  | {
    readonly status: 'written'
    /** The stored record, numbered. */
    readonly run: WorkbenchPipelineRun
    /** Every record after the append and the trim. */
    readonly snapshot: WorkbenchPipelineRunSnapshot
  }

/** What the service needs from its Host context. */
export interface WorkbenchPipelineRunServiceOptions {
  /** Table holding one record per execution. */
  readonly table: PipelineRunTable
  /** How many executions one pipeline keeps. */
  readonly runsPerPipeline: number
  /** How many executions all pipelines keep together. */
  readonly maxTotal: number
}

/** Errors raised while writing a record, carrying the route's error code. */
export class WorkbenchPipelineRunStorageError extends Error {
  /**
   * @param operation - the storage operation that failed.
   * @param cause - the underlying failure.
   */
  constructor(readonly operation: 'put' | 'delete', cause: unknown) {
    super(`workbench pipeline run ${operation} failed: ${cause instanceof Error ? cause.message : String(cause)}`)
    this.name = 'WorkbenchPipelineRunStorageError'
  }
}

/**
 * The table key of one execution.
 * @param run - the record, or the draft plus its number.
 * @returns the key, unique across every pipeline.
 */
export function pipelineRunKey(run: { readonly pipelineId: string; readonly no: number }): string {
  return `${run.pipelineId}#${String(run.no)}`
}

/** Pipeline execution records over one storage domain table. */
export class WorkbenchPipelineRunService {
  /**
   * @param options - table and caps.
   */
  constructor(private readonly options: WorkbenchPipelineRunServiceOptions) {}

  /**
   * Read every stored record.
   * @returns records newest first.
   */
  read(): WorkbenchPipelineRunSnapshot {
    const runs = this.sorted()
    return { apiVersion: WORKBENCH_PIPELINE_RUN_API_VERSION, runs }
  }

  /**
   * Number one execution, store it, and drop whatever fell outside the caps.
   * @param draft - the execution as the run engine saw it.
   * @returns the numbered record and the records after the trim.
   */
  async append(draft: WorkbenchPipelineRunDraft): Promise<WorkbenchPipelineRunAppendResult> {
    // Counted from the records on disk rather than from the list the client was holding: a
    // second window that ran the same pipeline is exactly what makes those two differ.
    let highest = 0
    for (const [, record] of this.options.table.entries()) {
      if (record.pipelineId !== draft.pipelineId) continue
      if (record.no > highest) highest = record.no
    }
    const run: WorkbenchPipelineRun = { ...draft, no: highest + 1 }
    await this.run('put', () => this.options.table.put(pipelineRunKey(run), run))
    await this.trim(draft.pipelineId)
    return { status: 'written', run, snapshot: this.read() }
  }

  /**
   * Drop records past this pipeline's cap, then past the overall one.
   *
   * Oldest first in both cases: what a user scrolls back to is the recent work, and the
   * oldest execution of the oldest pipeline is the least likely thing to be wanted again.
   * @param pipelineId - the pipeline just appended to.
   */
  private async trim(pipelineId: string): Promise<void> {
    const own = [...this.options.table.entries()]
      .map(([, record]) => record)
      .filter(record => record.pipelineId === pipelineId)
      .sort((left, right) => right.no - left.no)
    for (const record of own.slice(this.options.runsPerPipeline)) {
      await this.run('delete', () => this.options.table.delete(pipelineRunKey(record)))
    }
    // Read the table again rather than subtracting: the deletes above are already durable,
    // so this is the true remaining set and the count cannot drift from it.
    const remaining = [...this.options.table.entries()]
      .map(([, record]) => record)
      .sort(compareOldestFirst)
    const excess = remaining.length - this.options.maxTotal
    if (excess <= 0) return
    for (const record of remaining.slice(0, excess)) {
      await this.run('delete', () => this.options.table.delete(pipelineRunKey(record)))
    }
  }

  /**
   * Every stored record, newest first.
   * @returns the ordered list.
   */
  private sorted(): WorkbenchPipelineRun[] {
    const runs = [...this.options.table.entries()].map(([, record]) => record)
    runs.sort((left, right) => (right.startedAt - left.startedAt) || (right.no - left.no))
    return runs
  }

  /**
   * Run one storage operation, naming the failing operation in the error.
   * @param operation - operation discriminant.
   * @param run - the storage call.
   * @returns resolution after the call settles.
   */
  private async run(operation: 'put' | 'delete', run: () => Promise<unknown>): Promise<void> {
    try {
      await run()
    } catch (error) {
      throw new WorkbenchPipelineRunStorageError(operation, error)
    }
  }
}

/**
 * Order two records oldest first.
 * @param left - one record.
 * @param right - the other.
 * @returns the comparison the trim's oldest-first slice needs.
 */
function compareOldestFirst(left: WorkbenchPipelineRun, right: WorkbenchPipelineRun): number {
  return (left.startedAt - right.startedAt) || (left.no - right.no)
}
