/**
 * Workbench pipeline service: reads and writes pipeline definitions over one storage
 * domain table, and owns the revision that makes a concurrent write visible to the
 * client that lost the race.
 *
 * The same shape as the layout service, on purpose: both store an ordered set the user
 * arranges by hand, and both are written by a panel that may have two windows open.
 * @module dsh-workbench/pipeline-service
 */
import type { WorkbenchPipelinePatch, WorkbenchPipelineRecord, WorkbenchPipelineSnapshot } from './pipeline-contract.ts';
/** Read side of the pipeline table, as this service consumes it. */
export interface PipelineRecordTable {
    /**
     * Read one record from memory.
     * @param key - pipeline id.
     * @returns the stored record, or `undefined` when absent.
     */
    get(key: string): WorkbenchPipelineRecord | undefined;
    /**
     * Snapshot the stored pairs.
     * @returns the pair iterator, stable while queued writes land.
     */
    entries(): IterableIterator<[string, WorkbenchPipelineRecord]>;
    /**
     * Insert or overwrite one record durably.
     * @param key - pipeline id.
     * @param value - the complete new record.
     * @returns resolution after durability.
     */
    put(key: string, value: WorkbenchPipelineRecord): Promise<void>;
    /**
     * Delete one record durably.
     * @param key - pipeline id.
     * @returns whether a record was removed.
     */
    delete(key: string): Promise<boolean>;
}
/** Change subscription this service consumes, satisfied by the Cordis context. */
export interface PipelineChangeSource {
    /**
     * Subscribe to Host events.
     * @param event - event name.
     * @param listener - change callback.
     * @returns the unsubscribe function.
     */
    on(event: 'domain/changed', listener: (change: {
        readonly domain: string;
    }) => void): () => void;
}
/** Result of one write attempt. */
export type WorkbenchPipelineWriteResult = {
    readonly status: 'written';
    readonly snapshot: WorkbenchPipelineSnapshot;
} | {
    readonly status: 'conflict';
    readonly snapshot: WorkbenchPipelineSnapshot;
} | {
    readonly status: 'invalid';
    readonly reason: string;
};
/** What the service needs from its Host context. */
export interface WorkbenchPipelineServiceOptions {
    /** Storage domain name, used to filter change events. */
    readonly domainName: string;
    /** Table holding one record per pipeline. */
    readonly table: PipelineRecordTable;
    /** Host event source. */
    readonly events: PipelineChangeSource;
    /** Deployment cap on stored pipelines. */
    readonly maxPipelines: number;
    /** Process start stamp folded into the revision; tests pass a fixed value. */
    readonly bootStamp: number;
}
/** Errors raised while writing a pipeline, carrying the route's error code. */
export declare class WorkbenchPipelineStorageError extends Error {
    readonly operation: 'put' | 'delete';
    /**
     * @param operation - the storage operation that failed.
     * @param cause - the underlying failure.
     */
    constructor(operation: 'put' | 'delete', cause: unknown);
}
/** Pipeline read/write service over one storage domain table. */
export declare class WorkbenchPipelineService {
    private readonly options;
    private changeCount;
    private readonly disposeChange;
    /**
     * @param options - domain name, table, event source, caps, and boot stamp.
     */
    constructor(options: WorkbenchPipelineServiceOptions);
    /** Current revision: boot stamp plus the number of durable changes seen. */
    get revision(): string;
    /**
     * Read the complete stored set.
     * @returns pipelines ordered by id, with the current revision.
     */
    read(): WorkbenchPipelineSnapshot;
    /**
     * Apply one write.
     *
     * A write whose `baseRevision` is not current is refused without storing anything, and
     * answered with the state the client has to reconcile against.
     * @param patch - the complete set plus the revision it was based on.
     * @returns the write outcome.
     */
    write(patch: WorkbenchPipelinePatch): Promise<WorkbenchPipelineWriteResult>;
    /** Stop observing domain changes. Idempotent. */
    dispose(): void;
    /**
     * Run one storage operation, naming the failing operation in the error.
     * @param operation - operation discriminant.
     * @param run - the storage call.
     * @returns resolution after the call settles.
     */
    private run;
}
