/**
 * Workbench pipeline service: reads and writes pipeline definitions over one storage
 * domain table, and owns the revision that makes a concurrent write visible to the
 * client that lost the race.
 *
 * The same shape as the layout service, on purpose: both store an ordered set the user
 * arranges by hand, and both are written by a panel that may have two windows open.
 * @module dsh-workbench/pipeline-service
 */

import type {
  WorkbenchPipeline,
  WorkbenchPipelinePatch,
  WorkbenchPipelineRecord,
  WorkbenchPipelineSnapshot,
} from './pipeline-contract.ts'
import {
  WORKBENCH_PIPELINE_API_VERSION,
  WORKBENCH_PIPELINE_MAX_PIPELINES,
  parseWorkbenchPipelines,
} from './pipeline-contract.ts'

/** Read side of the pipeline table, as this service consumes it. */
export interface PipelineRecordTable {
  /**
   * Read one record from memory.
   * @param key - pipeline id.
   * @returns the stored record, or `undefined` when absent.
   */
  get(key: string): WorkbenchPipelineRecord | undefined
  /**
   * Snapshot the stored pairs.
   * @returns the pair iterator, stable while queued writes land.
   */
  entries(): IterableIterator<[string, WorkbenchPipelineRecord]>
  /**
   * Insert or overwrite one record durably.
   * @param key - pipeline id.
   * @param value - the complete new record.
   * @returns resolution after durability.
   */
  put(key: string, value: WorkbenchPipelineRecord): Promise<void>
  /**
   * Delete one record durably.
   * @param key - pipeline id.
   * @returns whether a record was removed.
   */
  delete(key: string): Promise<boolean>
}

/** Change subscription this service consumes, satisfied by the Cordis context. */
export interface PipelineChangeSource {
  /**
   * Subscribe to Host events.
   * @param event - event name.
   * @param listener - change callback.
   * @returns the unsubscribe function.
   */
  on(event: 'domain/changed', listener: (change: { readonly domain: string }) => void): () => void
}

/** Result of one write attempt. */
export type WorkbenchPipelineWriteResult =
  | { readonly status: 'written'; readonly snapshot: WorkbenchPipelineSnapshot }
  | { readonly status: 'conflict'; readonly snapshot: WorkbenchPipelineSnapshot }
  | { readonly status: 'invalid'; readonly reason: string }

/** What the service needs from its Host context. */
export interface WorkbenchPipelineServiceOptions {
  /** Storage domain name, used to filter change events. */
  readonly domainName: string
  /** Table holding one record per pipeline. */
  readonly table: PipelineRecordTable
  /** Host event source. */
  readonly events: PipelineChangeSource
  /** Deployment cap on stored pipelines. */
  readonly maxPipelines: number
  /** Process start stamp folded into the revision; tests pass a fixed value. */
  readonly bootStamp: number
}

/** Errors raised while writing a pipeline, carrying the route's error code. */
export class WorkbenchPipelineStorageError extends Error {
  /**
   * @param operation - the storage operation that failed.
   * @param cause - the underlying failure.
   */
  constructor(readonly operation: 'put' | 'delete', cause: unknown) {
    super(`workbench pipeline ${operation} failed: ${cause instanceof Error ? cause.message : String(cause)}`)
    this.name = 'WorkbenchPipelineStorageError'
  }
}

/** Pipeline read/write service over one storage domain table. */
export class WorkbenchPipelineService {
  private changeCount = 0
  private readonly disposeChange: () => void

  /**
   * @param options - domain name, table, event source, caps, and boot stamp.
   */
  constructor(private readonly options: WorkbenchPipelineServiceOptions) {
    this.disposeChange = options.events.on('domain/changed', (change) => {
      if (change.domain !== options.domainName) return
      this.changeCount += 1
    })
  }

  /** Current revision: boot stamp plus the number of durable changes seen. */
  get revision(): string {
    return `${String(this.options.bootStamp)}:${String(this.changeCount)}`
  }

  /**
   * Read the complete stored set.
   * @returns pipelines ordered by id, with the current revision.
   */
  read(): WorkbenchPipelineSnapshot {
    const pipelines: WorkbenchPipeline[] = []
    for (const [id, record] of this.options.table.entries()) {
      pipelines.push({
        id,
        name: record.name,
        steps: record.steps,
        updatedAt: record.updatedAt,
      })
    }
    // Id order rather than `updatedAt`: the snapshot has to be stable across reads that
    // saw the same set, and a clock can repeat.
    pipelines.sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
    return { apiVersion: WORKBENCH_PIPELINE_API_VERSION, pipelines, revision: this.revision }
  }

  /**
   * Apply one write.
   *
   * A write whose `baseRevision` is not current is refused without storing anything, and
   * answered with the state the client has to reconcile against.
   * @param patch - the complete set plus the revision it was based on.
   * @returns the write outcome.
   */
  async write(patch: WorkbenchPipelinePatch): Promise<WorkbenchPipelineWriteResult> {
    if (patch.baseRevision !== this.revision) {
      return { status: 'conflict', snapshot: this.read() }
    }
    const parsed = parseWorkbenchPipelines(patch.pipelines)
    if ('status' in parsed) return { status: 'invalid', reason: parsed.reason }
    const limit = Math.min(this.options.maxPipelines, WORKBENCH_PIPELINE_MAX_PIPELINES)
    if (parsed.length > limit) {
      return { status: 'invalid', reason: `this deployment stores ${String(limit)} pipelines, the write carries ${String(parsed.length)}` }
    }

    // Deletions first, then writes, in id order: a pipeline renamed into an id another
    // one is leaving must not be deleted by that other one's cleanup.
    const keeping = new Set(parsed.map(pipeline => pipeline.id))
    const removing: string[] = []
    for (const [id] of this.options.table.entries()) {
      if (!keeping.has(id)) removing.push(id)
    }
    removing.sort()
    for (const id of removing) {
      await this.run('delete', () => this.options.table.delete(id))
    }
    const ordered = [...parsed].sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
    for (const pipeline of ordered) {
      const record: WorkbenchPipelineRecord = {
        name: pipeline.name,
        steps: pipeline.steps,
        updatedAt: pipeline.updatedAt,
      }
      await this.run('put', () => this.options.table.put(pipeline.id, record))
    }
    return { status: 'written', snapshot: this.read() }
  }

  /** Stop observing domain changes. Idempotent. */
  dispose(): void {
    this.disposeChange()
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
      throw new WorkbenchPipelineStorageError(operation, error)
    }
  }
}
