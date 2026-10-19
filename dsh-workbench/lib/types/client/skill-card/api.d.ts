/**
 * Browser-side client for the skill card's private routes.
 *
 * Every failure is a structured result rather than a throw, because the card has
 * to render an unavailable state instead of an error boundary. Responses are
 * validated here: this is a process boundary, so the Host's JSON is input, not a
 * typed value.
 * @module dsh-workbench/client/skill-card/api
 */
import type { WorkbenchCardConfigView, WorkbenchCardResult, WorkbenchRunCapabilities, WorkbenchRunRequest, WorkbenchRunState, WorkbenchSkillCardPatch, WorkbenchSkillCatalogEntry } from '../../skill-card-contract.ts';
/** Fetch seam so tests can drive transport without a server. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
/** Configuration and results the page renders from. */
export interface WorkbenchCardSnapshot {
    readonly cards: readonly WorkbenchCardConfigView[];
    readonly results: readonly WorkbenchCardResult[];
    readonly revision: string;
    /**
     * What the Host recorded about running a card, at composition.
     *
     * Absent means the Host sent no verdict — a build that predates the field — and the
     * card is then treated as able to run: its run route answers for real, and refuses
     * with `run-unavailable` when the seam is in fact missing.
     */
    readonly capabilities?: WorkbenchRunCapabilities;
}
/** Outcome of one configuration read. */
export type WorkbenchConfigRead = {
    readonly status: 'ok';
    readonly snapshot: WorkbenchCardSnapshot;
} | {
    readonly status: 'unavailable';
    readonly reason: string;
};
/** Outcome of one run-state read. */
export type WorkbenchRunRead = {
    readonly status: 'ok';
    readonly state: WorkbenchRunState;
} | {
    readonly status: 'missing';
} | {
    readonly status: 'unavailable';
    readonly reason: string;
};
/** Outcome of starting one run. */
export type WorkbenchRunStart = {
    readonly status: 'ok';
    readonly state: WorkbenchRunState;
} | {
    readonly status: 'rejected';
    readonly code: string;
    readonly message: string;
} | {
    readonly status: 'unavailable';
    readonly reason: string;
};
/** Outcome of one configuration write. */
export type WorkbenchConfigWrite = {
    readonly status: 'ok';
    readonly snapshot: WorkbenchCardSnapshot;
} | {
    readonly status: 'conflict';
    readonly snapshot: WorkbenchCardSnapshot;
} | {
    readonly status: 'failed';
    readonly reason: string;
};
/** Outcome of one catalog read. */
export type WorkbenchCatalogRead = {
    readonly status: 'ok';
    readonly entries: readonly WorkbenchSkillCatalogEntry[];
} | {
    readonly status: 'failed';
    readonly code: string;
    readonly message: string;
};
/** Outcome of storing one hand-edited result. */
export type WorkbenchResultWrite = {
    readonly status: 'ok';
    /** Revision the write landed on. */
    readonly revision: string;
    /** The record as stored, so the caller needs no second read. */
    readonly result: WorkbenchCardResult;
} | {
    readonly status: 'rejected';
    readonly code: string;
    readonly message: string;
} | {
    readonly status: 'unavailable';
    readonly reason: string;
};
/** The read/write face the card consumes. */
export interface WorkbenchSkillCardApi {
    /**
     * Read the stored configuration and results.
     * @param signal - caller-owned cancellation.
     * @returns the snapshot, or an unavailable reason.
     */
    read(signal?: AbortSignal): Promise<WorkbenchConfigRead>;
    /**
     * Send one configuration patch; writes are serialized.
     * @param patch - card, selection, and optional template.
     * @returns the write outcome.
     */
    write(patch: WorkbenchSkillCardPatch): Promise<WorkbenchConfigWrite>;
    /**
     * Read the skills a card can be pointed at.
     * @param sessionId - the session whose agent is preferred, when the card has one.
     * @param signal - caller-owned cancellation.
     * @returns the catalog, or why it could not be read.
     */
    catalog(sessionId: string | undefined, signal?: AbortSignal): Promise<WorkbenchCatalogRead>;
    /**
     * Read one card's run state.
     * @param cardId - the card.
     * @param signal - caller-owned cancellation.
     * @returns the state, that none exists, or an unavailable reason.
     */
    poll(cardId: string, signal?: AbortSignal): Promise<WorkbenchRunRead>;
    /**
     * Start one card's run.
     * @param request - card, session, and output contract.
     * @returns the accepted state, or the refusal.
     */
    start(request: WorkbenchRunRequest): Promise<WorkbenchRunStart>;
    /**
     * Cancel one card's in-flight run.
     * @param cardId - the card.
     * @returns resolution after the Host answers.
     */
    cancel(cardId: string): Promise<void>;
    /**
     * Store one hand-edited region fragment as that card's result.
     *
     * A write of its own rather than a run: it spends no model call, and the Host keeps the
     * record's run facts — the skill and the stop reason — as they are.
     * @param cardId - the card whose result is being replaced.
     * @param html - the region HTML to store, verbatim.
     * @returns the stored record and revision, or the refusal.
     */
    saveResult(cardId: string, html: string): Promise<WorkbenchResultWrite>;
}
/** What the API needs from its host. */
export interface WorkbenchSkillCardApiOptions {
    /** Transport; defaults to `globalThis.fetch`. */
    readonly fetcher?: FetchLike;
}
/**
 * Build the skill card API.
 * @param options - transport seam.
 * @returns the read/write face.
 */
export declare function createWorkbenchSkillCardApi(options?: WorkbenchSkillCardApiOptions): WorkbenchSkillCardApi;
/**
 * Validate one configuration snapshot body.
 * @param value - decoded body.
 * @returns the snapshot, or undefined when a field is outside the contract.
 */
export declare function parseSnapshot(value: unknown): WorkbenchCardSnapshot | undefined;
/**
 * Validate one catalog response body.
 * @param value - decoded body.
 * @returns the entries, or undefined when a field is outside the contract.
 */
export declare function parseCatalog(value: unknown): readonly WorkbenchSkillCatalogEntry[] | undefined;
/**
 * Validate one result-edit response body.
 * @param value - decoded body.
 * @returns the revision and record, or undefined when a field is outside the contract.
 */
export declare function parseResultEdit(value: unknown): {
    readonly revision: string;
    readonly result: WorkbenchCardResult;
} | undefined;
/**
 * Validate one run-state response body.
 * @param value - decoded body.
 * @returns the state, or undefined when a field is outside the contract.
 */
export declare function parseRunResponse(value: unknown): WorkbenchRunState | undefined;
