/**
 * Workbench layout service: reads and writes the card layout over the layout
 * storage domain, and owns the revision that makes a concurrent write visible
 * to the client that lost the race.
 * @module dsh-workbench/layout-service
 */
import type { WorkbenchCardLayoutRecord, WorkbenchLayoutPatch, WorkbenchLayoutSnapshot } from './layout-contract.ts';
/** Read side of one declared domain table, as this service consumes it. */
export interface LayoutRecordTable {
    /**
     * Read one record from memory.
     * @param key - record key.
     * @returns the stored record, or `undefined` when absent.
     */
    get(key: string): WorkbenchCardLayoutRecord | undefined;
    /**
     * Snapshot the stored pairs.
     * @returns the pair iterator, stable while queued writes land.
     */
    entries(): IterableIterator<[string, WorkbenchCardLayoutRecord]>;
    /**
     * Insert or overwrite one record durably.
     * @param key - record key.
     * @param value - the complete new record.
     * @returns resolution after durability.
     */
    put(key: string, value: WorkbenchCardLayoutRecord): Promise<void>;
    /**
     * Delete one record durably.
     * @param key - record key.
     * @returns whether a record was removed.
     */
    delete(key: string): Promise<boolean>;
}
/** Change subscription this service consumes, satisfied by the Cordis context. */
export interface LayoutChangeSource {
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
export type WorkbenchLayoutWriteResult = {
    readonly status: 'written';
    readonly snapshot: WorkbenchLayoutSnapshot;
} | {
    readonly status: 'conflict';
    readonly snapshot: WorkbenchLayoutSnapshot;
} | {
    readonly status: 'invalid';
    readonly reason: string;
};
/** What the service needs from its Host context. */
export interface WorkbenchLayoutServiceOptions {
    /** Storage domain name, used to filter change events. */
    readonly domainName: string;
    /** Table holding one record per card. */
    readonly table: LayoutRecordTable;
    /** Host event source. */
    readonly events: LayoutChangeSource;
    /** Deployment cap on stored records. */
    readonly maxRecords: number;
    /** Process start stamp folded into the revision; tests pass a fixed value. */
    readonly bootStamp: number;
}
/** Errors raised while writing a layout, carrying the route's error code. */
export declare class WorkbenchLayoutStorageError extends Error {
    readonly operation: 'put' | 'delete';
    /**
     * @param operation - the storage operation that failed.
     * @param cause - the underlying failure.
     */
    constructor(operation: 'put' | 'delete', cause: unknown);
}
/** Layout read/write service over one storage domain table. */
export declare class WorkbenchLayoutService {
    private readonly options;
    private changeCount;
    private readonly disposeChange;
    /**
     * @param options - domain name, table, event source, caps, and boot stamp.
     */
    constructor(options: WorkbenchLayoutServiceOptions);
    /** Current revision: boot stamp plus the number of durable changes seen. */
    get revision(): string;
    /**
     * Read the complete stored layout.
     * @returns entries sorted by card id, with the current revision.
     */
    read(): WorkbenchLayoutSnapshot;
    /**
     * Apply one patch.
     *
     * A patch whose `baseRevision` is not current is refused without writing, and
     * answered with the state the client has to reconcile against.
     * @param patch - changed cards plus the revision they were based on.
     * @returns the write outcome.
     */
    write(patch: WorkbenchLayoutPatch): Promise<WorkbenchLayoutWriteResult>;
    /** Stop observing domain changes. Idempotent. */
    dispose(): void;
    /**
     * Reject a patch that cannot be stored.
     * @param patch - candidate patch.
     * @returns a human-readable reason, or undefined when the patch is storable.
     */
    private validate;
    /**
     * Run one storage operation, naming the failing operation in the error.
     * @param operation - operation discriminant.
     * @param run - the storage call.
     * @returns resolution after the call settles.
     */
    private run;
}
