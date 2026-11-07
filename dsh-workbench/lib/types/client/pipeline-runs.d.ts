/**
 * The executions the workbench knows about, and the append the run engine performs.
 *
 * This is the single source of the 运行记录 the panel draws. It used to be page state, which
 * is why a pipeline that had plainly run showed an empty history after a reload: the records
 * were built, numbered and then kept in a component that was about to unmount. They are
 * stored now, so the first paint of a reopened workbench already knows which run produced
 * what.
 * @module dsh-workbench/client/pipeline-runs
 */
import type { WorkbenchPipelineRun, WorkbenchPipelineRunDraft } from '../pipeline-contract.ts';
import type { WorkbenchPipelineRunsApi } from './pipeline-runs-api.ts';
/** What the page knows about stored executions. */
export interface WorkbenchPipelineRunsState {
    /** Loading until the first read answers. */
    readonly phase: 'loading' | 'ready' | 'unavailable';
    /** Records by pipeline id, newest first. */
    readonly runs: Readonly<Record<string, readonly WorkbenchPipelineRun[]>>;
    /** Why the records are unavailable, when they are. */
    readonly reason: string | undefined;
    /** Why the last append did not land. */
    readonly notice: string | undefined;
}
/** The face the run engine and the panel drive. */
export interface WorkbenchPipelineRunsFace extends WorkbenchPipelineRunsState {
    /**
     * The executions of one pipeline, newest first.
     * @param pipelineId - the pipeline to read.
     * @returns its records; empty when it has never run.
     */
    of(pipelineId: string): readonly WorkbenchPipelineRun[];
    /**
     * Store one finished execution.
     * @param draft - the execution as the run engine saw it.
     * @returns the numbered record, or undefined when it could not be stored.
     */
    record(draft: WorkbenchPipelineRunDraft): Promise<WorkbenchPipelineRun | undefined>;
    /** Read the records again. */
    reload(): void;
}
/**
 * Read, group, and append pipeline executions.
 * @param api - execution-record transport.
 * @returns the current state plus the operations.
 */
export declare function usePipelineRuns(api: WorkbenchPipelineRunsApi): WorkbenchPipelineRunsFace;
