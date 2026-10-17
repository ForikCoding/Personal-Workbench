/**
 * Workbench layout service: reads and writes the card layout over the layout
 * storage domain, and owns the revision that makes a concurrent write visible
 * to the client that lost the race.
 * @module dsh-workbench/layout-service
 */

import type { WorkbenchCardLayoutRecord, WorkbenchLayoutEntry, WorkbenchLayoutPatch, WorkbenchLayoutSnapshot } from './layout-contract.ts'
import {
  WORKBENCH_LAYOUT_MAX_ENTRIES,
  isWorkbenchCardId,
  toLayoutRecord,
} from './layout-contract.ts'

/** Read side of one declared domain table, as this service consumes it. */
export interface LayoutRecordTable {
  /**
   * Read one record from memory.
   * @param key - record key.
   * @returns the stored record, or `undefined` when absent.
   */
  get(key: string): WorkbenchCardLayoutRecord | undefined
  /**
   * Snapshot the stored pairs.
   * @returns the pair iterator, stable while queued writes land.
   */
  entries(): IterableIterator<[string, WorkbenchCardLayoutRecord]>
  /**
   * Insert or overwrite one record durably.
   * @param key - record key.
   * @param value - the complete new record.
   * @returns resolution after durability.
   */
  put(key: string, value: WorkbenchCardLayoutRecord): Promise<void>
  /**
   * Delete one record durably.
   * @param key - record key.
   * @returns whether a record was removed.
   */
  delete(key: string): Promise<boolean>
}

/** Change subscription this service consumes, satisfied by the Cordis context. */
export interface LayoutChangeSource {
  /**
   * Subscribe to Host events.
   * @param event - event name.
   * @param listener - change callback.
   * @returns the unsubscribe function.
   */
  on(event: 'domain/changed', listener: (change: { readonly domain: string }) => void): () => void
}

/** Result of one write attempt. */
export type WorkbenchLayoutWriteResult =
  | { readonly status: 'written'; readonly snapshot: WorkbenchLayoutSnapshot }
  | { readonly status: 'conflict'; readonly snapshot: WorkbenchLayoutSnapshot }
  | { readonly status: 'invalid'; readonly reason: string }

/** What the service needs from its Host context. */
export interface WorkbenchLayoutServiceOptions {
  /** Storage domain name, used to filter change events. */
  readonly domainName: string
  /** Table holding one record per card. */
  readonly table: LayoutRecordTable
  /** Host event source. */
  readonly events: LayoutChangeSource
  /** Deployment cap on stored records. */
  readonly maxRecords: number
  /** Process start stamp folded into the revision; tests pass a fixed value. */
  readonly bootStamp: number
}

/** Errors raised while writing a layout, carrying the route's error code. */
export class WorkbenchLayoutStorageError extends Error {
  /**
   * @param operation - the storage operation that failed.
   * @param cause - the underlying failure.
   */
  constructor(readonly operation: 'put' | 'delete', cause: unknown) {
    super(`workbench layout ${operation} failed: ${cause instanceof Error ? cause.message : String(cause)}`)
    this.name = 'WorkbenchLayoutStorageError'
  }
}

/** Layout read/write service over one storage domain table. */
export class WorkbenchLayoutService {
  private changeCount = 0
  private readonly disposeChange: () => void

  /**
   * @param options - domain name, table, event source, caps, and boot stamp.
   */
  constructor(private readonly options: WorkbenchLayoutServiceOptions) {
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
   * Read the complete stored layout.
   * @returns entries sorted by card id, with the current revision.
   */
  read(): WorkbenchLayoutSnapshot {
    const entries: WorkbenchLayoutEntry[] = []
    for (const [id, record] of this.options.table.entries()) {
      entries.push({
        id,
        ...record.position === undefined ? {} : { position: record.position },
      })
    }
    entries.sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
    return { entries, revision: this.revision }
  }

  /**
   * Apply one patch.
   *
   * A patch whose `baseRevision` is not current is refused without writing, and
   * answered with the state the client has to reconcile against.
   * @param patch - changed cards plus the revision they were based on.
   * @returns the write outcome.
   */
  async write(patch: WorkbenchLayoutPatch): Promise<WorkbenchLayoutWriteResult> {
    if (patch.baseRevision !== this.revision) {
      return { status: 'conflict', snapshot: this.read() }
    }
    const invalid = this.validate(patch)
    if (invalid !== undefined) return { status: 'invalid', reason: invalid }

    // Id order so one request cannot overwrite itself, and so two concurrent
    // writers touch records in the same sequence.
    const ordered = [...patch.entries].sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
    for (const entry of ordered) {
      const record = toLayoutRecord(entry)
      if (record.position === undefined) {
        await this.run('delete', () => this.options.table.delete(entry.id))
        continue
      }
      await this.run('put', () => this.options.table.put(entry.id, record))
    }
    return { status: 'written', snapshot: this.read() }
  }

  /** Stop observing domain changes. Idempotent. */
  dispose(): void {
    this.disposeChange()
  }

  /**
   * Reject a patch that cannot be stored.
   * @param patch - candidate patch.
   * @returns a human-readable reason, or undefined when the patch is storable.
   */
  private validate(patch: WorkbenchLayoutPatch): string | undefined {
    const limit = Math.min(this.options.maxRecords, WORKBENCH_LAYOUT_MAX_ENTRIES)
    if (patch.entries.length > limit) {
      return `patch carries ${String(patch.entries.length)} entries, above the ${String(limit)} limit`
    }
    const seen = new Set<string>()
    for (const entry of patch.entries) {
      if (!isWorkbenchCardId(entry.id)) return `card id ${JSON.stringify(entry.id)} is not a namespaced slug`
      if (seen.has(entry.id)) return `card id ${JSON.stringify(entry.id)} appears twice in one patch`
      seen.add(entry.id)
      if (entry.position !== undefined && (!Number.isFinite(entry.position) || entry.position < 0)) {
        return `card ${JSON.stringify(entry.id)} has a non-finite or negative position`
      }
    }
    return undefined
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
      throw new WorkbenchLayoutStorageError(operation, error)
    }
  }
}
