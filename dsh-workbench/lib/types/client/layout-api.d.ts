/**
 * Browser-side client for the workbench's private layout route.
 *
 * Every failure is a structured result rather than a throw, because the page
 * has to render an unavailable state instead of an error boundary. Responses
 * are validated here: this is a process boundary, so the Host's JSON is input,
 * not a typed value.
 * @module dsh-workbench/client/layout-api
 */
import type { WorkbenchLayoutPatch, WorkbenchLayoutSnapshot } from '../layout-contract.ts';
/** Fetch seam so tests can drive transport without a server. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
/** Outcome of one read. */
export type WorkbenchReadResult = {
    readonly status: 'ok';
    readonly snapshot: WorkbenchLayoutSnapshot;
} | {
    readonly status: 'unavailable';
    readonly reason: string;
};
/** Outcome of one write. */
export type WorkbenchWriteResult = {
    readonly status: 'ok';
    readonly snapshot: WorkbenchLayoutSnapshot;
} | {
    readonly status: 'conflict';
    readonly snapshot: WorkbenchLayoutSnapshot;
} | {
    readonly status: 'failed';
    readonly reason: string;
};
/** The read/write face the controller consumes. */
export interface WorkbenchLayoutApi {
    /**
     * Read the stored layout.
     * @param signal - caller-owned cancellation.
     * @returns the snapshot, or an unavailable reason.
     */
    read(signal?: AbortSignal): Promise<WorkbenchReadResult>;
    /**
     * Send one patch; writes are serialized, so this resolves after earlier ones.
     * @param patch - changed cards plus the revision they were based on.
     * @returns the write outcome.
     */
    write(patch: WorkbenchLayoutPatch): Promise<WorkbenchWriteResult>;
}
/** What the API needs from its host. */
export interface WorkbenchLayoutApiOptions {
    /** Transport; defaults to `globalThis.fetch`. */
    readonly fetcher?: FetchLike;
    /** Delay seam for the retry backoff, so tests do not sleep. */
    readonly delay?: (ms: number) => Promise<void>;
}
/**
 * Build the layout API.
 * @param options - transport and delay seams.
 * @returns the read/write face.
 */
export declare function createWorkbenchLayoutApi(options?: WorkbenchLayoutApiOptions): WorkbenchLayoutApi;
/**
 * Validate one snapshot body.
 * @param value - decoded body.
 * @returns the snapshot, or undefined when a field is outside the contract.
 */
export declare function parseSnapshot(value: unknown): WorkbenchLayoutSnapshot | undefined;
