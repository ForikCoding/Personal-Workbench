/**
 * Browser-side client for the workbench's private pipeline route.
 *
 * Every failure is a structured result rather than a throw, because the page has to
 * render an unavailable state instead of an error boundary. Responses are validated
 * here: this is a process boundary, so the Host's JSON is input, not a typed value.
 * @module dsh-workbench/client/pipeline-api
 */
import type { WorkbenchPipelinePatch, WorkbenchPipelineSnapshot } from '../pipeline-contract.ts';
/** Fetch seam so tests can drive transport without a server. */
export type PipelineFetchLike = (input: string, init?: RequestInit) => Promise<Response>;
/** Outcome of one read. */
export type WorkbenchPipelinesRead = {
    readonly status: 'ok';
    readonly snapshot: WorkbenchPipelineSnapshot;
} | {
    readonly status: 'unavailable';
    readonly reason: string;
};
/** Outcome of one write. */
export type WorkbenchPipelinesWrite = {
    readonly status: 'ok';
    readonly snapshot: WorkbenchPipelineSnapshot;
} | {
    readonly status: 'conflict';
    readonly snapshot: WorkbenchPipelineSnapshot;
} | {
    readonly status: 'failed';
    readonly reason: string;
};
/** The read/write face the pipeline view consumes. */
export interface WorkbenchPipelineApi {
    /**
     * Read the stored pipelines.
     * @param signal - caller-owned cancellation.
     * @returns the snapshot, or an unavailable reason.
     */
    read(signal?: AbortSignal): Promise<WorkbenchPipelinesRead>;
    /**
     * Send one write; writes are serialized, so this resolves after earlier ones.
     * @param patch - the complete set plus the revision it was based on.
     * @returns the write outcome.
     */
    write(patch: WorkbenchPipelinePatch): Promise<WorkbenchPipelinesWrite>;
}
/** What the API needs from its host. */
export interface WorkbenchPipelineApiOptions {
    /** Transport; defaults to `globalThis.fetch`. */
    readonly fetcher?: PipelineFetchLike;
}
/**
 * Build the pipeline API.
 * @param options - transport seam.
 * @returns the read/write face.
 */
export declare function createWorkbenchPipelineApi(options?: WorkbenchPipelineApiOptions): WorkbenchPipelineApi;
/**
 * Validate one decoded snapshot.
 * @param value - decoded body.
 * @returns the snapshot, or undefined when a field is outside the contract.
 */
export declare function decodeSnapshot(value: unknown): WorkbenchPipelineSnapshot | undefined;
