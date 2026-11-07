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
/**
 * What one execution of a pipeline left behind.
 *
 * The definition above is what the user arranged; this is what happened. They have
 * different lifetimes and different authors, which is why they are different records: a
 * definition is rewritten whole by every config edit, and a run must not be, or renaming a
 * pipeline would delete its history.
 *
 * A record is a snapshot, not a pointer: it carries each step's region as it was when the
 * run settled, because reading a run from today's files answers with today's files.
 */
/** Version of the pipeline-run wire contract; a client reading another version refuses it. */
export declare const WORKBENCH_PIPELINE_RUN_API_VERSION = 1;
/** Private route pipeline executions are read and appended on. */
export declare const WORKBENCH_PIPELINE_RUN_PATH = "/api/workbench/pipeline-run";
/** How many executions one pipeline keeps; the oldest falls off the end. */
export declare const WORKBENCH_PIPELINE_RUNS_PER_PIPELINE = 20;
/**
 * Ceiling on every pipeline's runs together, so a deployment full of pipelines stays bounded.
 *
 * Twenty per pipeline times the pipeline cap is far more than one person scrolls through, and
 * a workbench with that many real executions has a storage problem this cap is not the
 * answer to. Trimming the oldest overall keeps the newest work readable.
 */
export declare const WORKBENCH_PIPELINE_RUN_MAX_TOTAL = 200;
/** Body ceiling for one append; a run carries every step's region. */
export declare const WORKBENCH_PIPELINE_RUN_MAX_BODY_BYTES: number;
/** How much of one step's region a record keeps. */
export declare const WORKBENCH_PIPELINE_RUN_STEP_HTML_MAX_LENGTH = 96000;
/** How one step of an execution ended. A record is only written once a step is over. */
export type WorkbenchPipelineRunStepPhase = 'done' | 'failed' | 'stopped';
/** One step of one execution, as it stood when the run settled. */
export interface WorkbenchPipelineRunStep {
    /** The card this step ran. */
    readonly cardId: string;
    /** How it ended. */
    readonly phase: WorkbenchPipelineRunStepPhase;
    /** How long it took. */
    readonly tookMs?: number;
    /** Why it failed, when it did. */
    readonly failure?: string;
    /** The region it stored, or as much of it as a record keeps. */
    readonly html?: string;
}
/** One execution of one pipeline. */
export interface WorkbenchPipelineRun {
    /** The pipeline it ran. */
    readonly pipelineId: string;
    /** Ordinal within that pipeline, counted from one; the Host's to assign. */
    readonly no: number;
    /** When it started, in milliseconds since the epoch. */
    readonly startedAt: number;
    /** How long the whole execution took. */
    readonly tookMs: number;
    /** How it ended. A record is only written for an execution that ended. */
    readonly phase: 'settled' | 'failed' | 'stopped';
    /** Whether it ran the whole chain, one step, or one step again on request. */
    readonly scope: 'full' | 'single' | 'refine';
    /** The step a `single` or `refine` run was about, zero-based. */
    readonly only?: number;
    /** What the review asked for, when the run was one. */
    readonly instruction?: string;
    /** One entry per step the run touched, in step order. */
    readonly steps: readonly WorkbenchPipelineRunStep[];
}
/** An execution as a client submits it: everything but the number, which the Host assigns. */
export type WorkbenchPipelineRunDraft = Omit<WorkbenchPipelineRun, 'no'>;
/** Everything stored for one read. */
export interface WorkbenchPipelineRunSnapshot {
    /** Contract version. */
    readonly apiVersion: number;
    /** Records, newest first. */
    readonly runs: readonly WorkbenchPipelineRun[];
}
/** Why a submitted execution is not a record. */
export interface WorkbenchPipelineRunInvalid {
    /** Discriminant for {@link parseWorkbenchPipelineRunDraft}. */
    readonly status: 'invalid';
    /** What is wrong. */
    readonly reason: string;
}
/**
 * Validate one submitted execution against the wire contract.
 *
 * The two halves of the app are separate processes, so this validates what the Host is
 * handed rather than trusting the body. Numbers are not accepted: the ordinal belongs to the
 * Host, which is the only side that can hand two runs different ones.
 * @param value - the decoded body.
 * @returns the draft, or what is wrong with it.
 */
export declare function parseWorkbenchPipelineRunDraft(value: unknown): WorkbenchPipelineRunDraft | WorkbenchPipelineRunInvalid;
