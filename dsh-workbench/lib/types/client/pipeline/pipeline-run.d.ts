/**
 * Running a pipeline: one step at a time, one session for the whole chain.
 *
 * The sequencing lives in {@link runSteps}, which knows nothing about React or transport
 * seams beyond the two functions it is handed. That is deliberate: the rule that matters
 * — a step's session is the one the step before it settled in, and a chain stops at the
 * first step that does not settle — is testable without a component or a server.
 *
 * The chain stops rather than continues on failure. A step that failed produced no
 * result for the next one to read, and a pipeline that ran on would be answering with
 * whatever the previous conversation happened to contain.
 * @module dsh-workbench/client/pipeline/pipeline-run
 */
import type { WorkbenchPipeline, WorkbenchPipelineStep } from '../../pipeline-contract.ts';
import type { WorkbenchSkillCardApi } from '../skill-card/api.ts';
import type { PipelineRunEntry } from './pipeline-view.ts';
/** How one step of a chain stands. */
export type PipelineStepPhase = 'idle' | 'queued' | 'running' | 'done' | 'failed' | 'stopped';
/** What one step of a chain did. */
export interface ChainStepOutcome {
    /** How it stands. */
    readonly phase: PipelineStepPhase;
    /** When it started, in milliseconds since the epoch. */
    readonly startedAt?: number;
    /** How long it took, once it stopped running. */
    readonly tookMs?: number;
    /** Identity of the run, so the step's own view can open it. */
    readonly runId?: string;
    /** Session it executed in; the next step continues this one. */
    readonly sessionId?: string;
    /** Why it failed, when it did. */
    readonly failure?: string;
}
/** How the whole chain ended. */
export type ChainPhase = 'running' | 'settled' | 'failed' | 'stopped';
/** One chain, as the canvas draws it. */
export interface PipelineChain {
    /** Pipeline the chain belongs to. */
    readonly pipelineId: string;
    /** When the chain started. */
    readonly startedAt: number;
    /** One entry per pipeline step, in step order. */
    readonly steps: readonly ChainStepOutcome[];
    /** Step that is running now, or was last started. */
    readonly activeIndex?: number;
    /** Session the chain is having; absent until the first step settles. */
    readonly sessionId?: string;
    /** How the chain stands. */
    readonly phase: ChainPhase;
    /** Index of the step that failed, when one did. */
    readonly failureIndex?: number;
    /** Why the chain failed, when it did. */
    readonly failure?: string;
}
/** What one step's start answered. */
export type ChainStartOutcome = {
    readonly status: 'started';
    readonly runId?: string;
} | {
    readonly status: 'refused';
    readonly reason: string;
};
/** What one step's settle answered. */
export interface ChainSettleOutcome {
    /** Terminal phase the run reached. */
    readonly phase: 'settled' | 'cancelled' | 'failed';
    /** Session the run executed in, which the next step continues. */
    readonly sessionId?: string;
    /** Why it did not settle, for a failed or cancelled run. */
    readonly failure?: string;
}
/** Everything {@link runSteps} needs from outside itself. */
export interface ChainSeams {
    /**
     * Start one step's run.
     * @param index - step index.
     * @param step - the step itself.
     * @param ask - the session to continue (absent for the first step), whether this step
     * ends the chain, and the instruction the step carries.
     * @returns the accepted run, or the refusal.
     */
    start(index: number, step: WorkbenchPipelineStep, ask: {
        readonly sessionId?: string;
        readonly terminal: boolean;
        readonly instruction?: string;
    }): Promise<ChainStartOutcome>;
    /**
     * Wait for one step's run to reach a terminal phase.
     * @param cardId - the card whose run it is.
     * @param runId - the run's identity, when the start named one.
     * @param signal - cancellation; an aborted wait resolves as cancelled.
     * @returns how the run ended.
     */
    settle(cardId: string, runId: string | undefined, signal: AbortSignal): Promise<ChainSettleOutcome>;
    /**
     * Report one step's new state.
     * @param index - step index.
     * @param outcome - the step's state.
     */
    onStep(index: number, outcome: ChainStepOutcome): void;
    /** Wall clock seam. */
    now(): number;
    /** Cancellation for the whole chain. */
    readonly signal: AbortSignal;
    /**
     * Session the step before `from` settled in, when this chain resumes mid-pipeline.
     *
     * A resumed chain starts where the pipeline stands, so its first step has a predecessor
     * that already ran — in this panel or in an earlier one. Joining that session keeps the
     * promise the chain makes everywhere else; absent, the step opens its own, which is the
     * honest answer when nobody knows where the earlier step ran.
     */
    readonly resume?: string;
}
/** How a chain ended. */
export interface ChainResult {
    /** How it ended. */
    readonly phase: 'settled' | 'failed' | 'stopped';
    /** Session the last settled step used. */
    readonly sessionId?: string;
    /** Index of the failing step. */
    readonly failureIndex?: number;
    /** Why it failed. */
    readonly failure?: string;
    /** What each step did, by index. */
    readonly steps: readonly ChainStepOutcome[];
}
/**
 * Run one contiguous slice of a pipeline's steps.
 *
 * The session travels forward through this function, not through the caller: a step is
 * started in the session the step before it settled in, and nothing else decides that.
 * @param steps - the complete step list.
 * @param from - first step index to run.
 * @param to - last step index to run.
 * @param seams - the start, settle, report, clock and cancellation seams.
 * @returns how the chain ended, with every step's state.
 */
export declare function runSteps(steps: readonly WorkbenchPipelineStep[], from: number, to: number, seams: ChainSeams): Promise<ChainResult>;
/** What the run hook needs from its host. */
export interface UsePipelineRunOptions {
    /** Skill card transport: the route that starts and polls runs. */
    readonly api: WorkbenchSkillCardApi;
    /**
     * Session whose scope resolves a step's skill definition.
     * @returns the session id, or undefined when none is available.
     */
    readonly scopeSessionId?: () => string | undefined;
    /** Polling interval; tests pass a shorter one. */
    readonly pollIntervalMs?: number;
}
/** The run face the canvas drives. */
export interface PipelineRunFace {
    /** The chain on screen, or undefined when nothing has run in this page yet. */
    readonly chain: PipelineChain | undefined;
    /**
     * Run a whole pipeline.
     * @param pipeline - the pipeline to run.
     * @param from - first step to run; absent starts at the first step.
     * @param resume - session the step before `from` settled in, when the run continues it.
     */
    runAll(pipeline: WorkbenchPipeline, from?: number, resume?: string): void;
    /**
     * Run one step on its own, in a session of its own.
     * @param pipeline - the pipeline the step belongs to.
     * @param index - the step index.
     */
    runOne(pipeline: WorkbenchPipeline, index: number): void;
    /** Stop the chain that is running, if one is. */
    stop(): void;
    /**
     * Regenerate one step from a request about its result.
     * @param pipeline - the pipeline the step belongs to.
     * @param index - the step index.
     * @param instruction - what to change.
     */
    refine(pipeline: WorkbenchPipeline, index: number, instruction: string): void;
    /**
     * The runs this page has seen for one pipeline, newest first.
     * @param pipelineId - the pipeline to read.
     * @returns its runs; empty when it has not run here.
     */
    history(pipelineId: string): readonly PipelineRunEntry[];
}
/**
 * Drive one pipeline run from the page.
 * @param options - transport, scope session, and polling interval.
 * @returns the chain plus the three controls.
 */
export declare function usePipelineRun(options: UsePipelineRunOptions): PipelineRunFace;
/**
 * Wait for one card's run to reach a terminal phase.
 * @param api - skill card transport.
 * @param cardId - the card whose run it is.
 * @param runId - the run to follow; absent follows the card's newest run.
 * @param signal - cancellation.
 * @param intervalMs - how long to wait between reads.
 * @returns how the run ended.
 */
export declare function settleRun(api: WorkbenchSkillCardApi, cardId: string, runId: string | undefined, signal: AbortSignal, intervalMs: number): Promise<ChainSettleOutcome>;
/**
 * Render a duration the way the canvas shows it.
 * @param ms - milliseconds.
 * @returns a compact duration.
 */
export declare function tookOf(ms: number): string;
