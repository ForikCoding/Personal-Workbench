/**
 * Wire contract for the workbench's pipeline definitions.
 *
 * A pipeline is an ordered list of card ids. Each step runs the card it names, and the
 * card already carries the skill, template, directory, model and permission the step
 * needs — so a step is a reference plus, optionally, the instruction for that step.
 *
 * No run state lives here. A pipeline's runs are its cards' runs: this module stores
 * what the user arranged, never what happened.
 * @module dsh-workbench/pipeline-contract
 */
/** Private route this plugin serves pipeline definitions on. */
export declare const WORKBENCH_PIPELINE_PATH = "/api/workbench/pipeline";
/** Version of the pipeline wire contract; a client reading another version refuses it. */
export declare const WORKBENCH_PIPELINE_API_VERSION = 1;
/** Deployment cap on stored pipelines. */
export declare const WORKBENCH_PIPELINE_MAX_PIPELINES = 64;
/** Maximum steps one pipeline may hold. */
export declare const WORKBENCH_PIPELINE_MAX_STEPS = 32;
/** Maximum pipeline name length. */
export declare const WORKBENCH_PIPELINE_NAME_MAX_LENGTH = 60;
/** Maximum length of one step's own instruction. */
export declare const WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH = 2000;
/** Body ceiling for a pipeline write. */
export declare const WORKBENCH_PIPELINE_MAX_BODY_BYTES: number;
/** Closed set of pipeline route failures. */
export type WorkbenchPipelineErrorCode = 'unauthorized' | 'forbidden' | 'invalid-request' | 'conflict' | 'storage-failure';
/**
 * One step: which card runs, and what this step is asked for.
 *
 * `cardId` is the whole configuration — the card answers "which skill, which document,
 * which folder, whose permission". The instruction is the only thing a step adds.
 */
export interface WorkbenchPipelineStep {
    /** Card this step runs. */
    readonly cardId: string;
    /** What this step is asked to do, when it needs saying beyond the card's own skill. */
    readonly instruction?: string;
}
/** One stored pipeline. */
export interface WorkbenchPipeline {
    /** Pipeline identity, a namespaced slug. */
    readonly id: string;
    /** User-visible name. */
    readonly name: string;
    /** Ordered steps; empty is a legal draft, not an error. */
    readonly steps: readonly WorkbenchPipelineStep[];
    /** When this definition last changed, in milliseconds since the epoch. */
    readonly updatedAt: number;
}
/** Stored body of one pipeline: everything but the identity, which is the record key. */
export interface WorkbenchPipelineRecord {
    /** User-visible name. */
    readonly name: string;
    /** Ordered steps. */
    readonly steps: readonly WorkbenchPipelineStep[];
    /** When this definition last changed. */
    readonly updatedAt: number;
}
/** Complete stored state, as both halves read it. */
export interface WorkbenchPipelineSnapshot {
    /** Contract version. */
    readonly apiVersion: number;
    /** Changes whenever the stored set changes; a write must name the current one. */
    readonly revision: string;
    /** Pipelines, ordered by id so the snapshot is stable. */
    readonly pipelines: readonly WorkbenchPipeline[];
}
/** One write: the complete set, plus the revision it was based on. */
export interface WorkbenchPipelinePatch {
    /** Revision the writer saw. */
    readonly baseRevision: string;
    /** The complete set to store. A pipeline absent from this list is deleted. */
    readonly pipelines: readonly WorkbenchPipeline[];
}
/** Why a decoded body is not a pipeline list. */
export interface WorkbenchPipelineInvalid {
    /** Discriminant for {@link parseWorkbenchPipelines}. */
    readonly status: 'invalid';
    /** Operator-facing reason naming the offending field. */
    readonly reason: string;
}
/**
 * Whether a value is a usable pipeline identity.
 *
 * Same slug rule as a card id: these are storage keys and record keys, and two rules for
 * "a safe key" is one rule too many.
 * @param value - candidate identity.
 * @returns whether the value may be used as a pipeline id.
 */
export declare function isWorkbenchPipelineId(value: string): boolean;
/**
 * Validate a decoded pipeline list against the wire contract.
 *
 * One validator for both halves on purpose: the route and the service are two places a
 * list can arrive from, and a second copy of these rules would be a second answer.
 * @param value - decoded `pipelines` array.
 * @returns the normalized list, or the first reason it is not storable.
 */
export declare function parseWorkbenchPipelines(value: unknown): readonly WorkbenchPipeline[] | WorkbenchPipelineInvalid;
