/**
 * Workbench pipeline execution records: the read side, and the append that numbers them.
 *
 * Numbering lives here rather than on the client because two windows can finish the same
 * pipeline at once, and "the next number" is only knowable where the records are. The same
 * is true of the caps: a record that fell off the end is deleted here, so a client cannot
 * leave one behind by never asking again.
 * @module dsh-workbench/pipeline-run-service
 */
import type { WorkbenchPipelineRun, WorkbenchPipelineRunDraft, WorkbenchPipelineRunSnapshot } from './pipeline-contract.ts';
/** Read side of the execution table, as this service consumes it. */
export interface PipelineRunTable {
    /**
     * Read one record from memory.
     * @param key - record key, from {@link pipelineRunKey}.
     * @returns the stored record, or `undefined` when absent.
     */
    get(key: string): WorkbenchPipelineRun | undefined;
    /**
     * Snapshot the stored pairs.
     * @returns the pair iterator, stable while queued writes land.
     */
    entries(): IterableIterator<[string, WorkbenchPipelineRun]>;
    /**
     * Insert or overwrite one record durably.
     * @param key - record key.
     * @param value - the complete new record.
     * @returns resolution after durability.
     */
    put(key: string, value: WorkbenchPipelineRun): Promise<void>;
    /**
     * Delete one record durably.
     * @param key - record key.
     * @returns whether a record was removed.
     */
    delete(key: string): Promise<boolean>;
}
/** What an append did. */
export type WorkbenchPipelineRunAppendResult = {
    readonly status: 'written';
    /** The stored record, numbered. */
    readonly run: WorkbenchPipelineRun;
    /** Every record after the append and the trim. */
    readonly snapshot: WorkbenchPipelineRunSnapshot;
};
/** What the service needs from its Host context. */
export interface WorkbenchPipelineRunServiceOptions {
    /** Table holding one record per execution. */
    readonly table: PipelineRunTable;
    /** How many executions one pipeline keeps. */
    readonly runsPerPipeline: number;
    /** How many executions all pipelines keep together. */
    readonly maxTotal: number;
}
/** Errors raised while writing a record, carrying the route's error code. */
export declare class WorkbenchPipelineRunStorageError extends Error {
    readonly operation: 'put' | 'delete';
    /**
     * @param operation - the storage operation that failed.
     * @param cause - the underlying failure.
     */
    constructor(operation: 'put' | 'delete', cause: unknown);
}
/**
 * The table key of one execution.
 * @param run - the record, or the draft plus its number.
 * @returns the key, unique across every pipeline.
 */
export declare function pipelineRunKey(run: {
    readonly pipelineId: string;
    readonly no: number;
}): string;
/** Pipeline execution records over one storage domain table. */
export declare class WorkbenchPipelineRunService {
    private readonly options;
    /**
     * @param options - table and caps.
     */
    constructor(options: WorkbenchPipelineRunServiceOptions);
    /**
     * Read every stored record.
     * @returns records newest first.
     */
    read(): WorkbenchPipelineRunSnapshot;
    /**
     * Number one execution, store it, and drop whatever fell outside the caps.
     * @param draft - the execution as the run engine saw it.
     * @returns the numbered record and the records after the trim.
     */
    append(draft: WorkbenchPipelineRunDraft): Promise<WorkbenchPipelineRunAppendResult>;
    /**
     * Drop records past this pipeline's cap, then past the overall one.
     *
     * Oldest first in both cases: what a user scrolls back to is the recent work, and the
     * oldest execution of the oldest pipeline is the least likely thing to be wanted again.
     * @param pipelineId - the pipeline just appended to.
     */
    private trim;
    /**
     * Every stored record, newest first.
     * @returns the ordered list.
     */
    private sorted;
    /**
     * Run one storage operation, naming the failing operation in the error.
     * @param operation - operation discriminant.
     * @param run - the storage call.
     * @returns resolution after the call settles.
     */
    private run;
}
