/**
 * Browser-side client for the workbench's private pipeline-execution route.
 *
 * Same shape as the pipeline client: every failure is a structured result rather than a
 * throw, and the Host's JSON is validated here because this is a process boundary. A record
 * that does not decode is dropped rather than failing the read — one unreadable execution
 * must not cost the panel the history it can read.
 * @module dsh-workbench/client/pipeline-runs-api
 */
import type { WorkbenchPipelineRun, WorkbenchPipelineRunDraft } from '../pipeline-contract.ts';
import type { PipelineFetchLike } from './pipeline-api.ts';
/** Outcome of one read. */
export type WorkbenchPipelineRunsRead = {
    readonly status: 'ok';
    readonly runs: readonly WorkbenchPipelineRun[];
} | {
    readonly status: 'unavailable';
    readonly reason: string;
};
/** Outcome of one append. */
export type WorkbenchPipelineRunsAppend = {
    readonly status: 'ok';
    readonly run: WorkbenchPipelineRun;
} | {
    readonly status: 'failed';
    readonly reason: string;
};
/** The read/append face the run engine consumes. */
export interface WorkbenchPipelineRunsApi {
    /**
     * Read every stored execution.
     * @param signal - caller-owned cancellation.
     * @returns the records, or an unavailable reason.
     */
    read(signal?: AbortSignal): Promise<WorkbenchPipelineRunsRead>;
    /**
     * Store one finished execution; the Host numbers it.
     * @param draft - the execution as the run engine saw it.
     * @returns the numbered record, or why it was not stored.
     */
    append(draft: WorkbenchPipelineRunDraft): Promise<WorkbenchPipelineRunsAppend>;
}
/** What the API needs from its host. */
export interface WorkbenchPipelineRunsApiOptions {
    /** Transport; defaults to `globalThis.fetch`. */
    readonly fetcher?: PipelineFetchLike;
}
/**
 * Build the execution-record API.
 * @param options - transport seam.
 * @returns the read/append face.
 */
export declare function createWorkbenchPipelineRunsApi(options?: WorkbenchPipelineRunsApiOptions): WorkbenchPipelineRunsApi;
