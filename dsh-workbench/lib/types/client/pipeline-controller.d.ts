/**
 * The pipeline definitions the workbench page arranges, and the mutations it offers.
 *
 * The controller owns one snapshot and one revision, and every mutation is expressed as
 * "the complete set I would like to store". That is the route's shape, and it keeps the
 * awkward part of concurrent writes in one place: the revision a write was based on.
 *
 * Mutations are queued rather than fired in parallel. Two edits racing would both build
 * their next set from the same snapshot, so the second would silently undo the first —
 * the queue makes each one see the state the one before it committed.
 * @module dsh-workbench/client/pipeline-controller
 */
import type { WorkbenchPipeline, WorkbenchPipelineStep } from '../pipeline-contract.ts';
import type { WorkbenchCardWorkspace } from '../skill-card-contract.ts';
import type { WorkbenchPipelineApi } from './pipeline-api.ts';
/** What the page knows about the stored pipelines. */
export interface WorkbenchPipelinesState {
    /** Loading until the first read answers. */
    readonly phase: 'loading' | 'ready' | 'unavailable';
    /** Stored pipelines, ordered by id. */
    readonly pipelines: readonly WorkbenchPipeline[];
    /** Why the set is unavailable, for the notice the page shows. */
    readonly reason?: string;
    /** Why the last write did not land, for the notice the page shows. */
    readonly notice?: string;
}
/** The read/write face the pipeline view drives. */
export interface WorkbenchPipelinesFace extends WorkbenchPipelinesState {
    /**
     * Create a pipeline and return its id.
     * @param name - its starting name, which the user may rename later.
     * @returns the new id, or undefined when the set is full or the write failed.
     */
    create(name: string): Promise<string | undefined>;
    /**
     * Rename one pipeline.
     * @param id - pipeline to rename.
     * @param name - the new name; trimmed, and ignored when blank.
     */
    rename(id: string, name: string): Promise<void>;
    /**
     * Delete one pipeline.
     * @param id - pipeline to delete.
     */
    remove(id: string): Promise<void>;
    /**
     * Replace one pipeline's steps.
     * @param id - pipeline to edit.
     * @param steps - the complete new step list.
     * @returns whether the steps were stored; a conflict stores the Host's set instead.
     */
    setSteps(id: string, steps: readonly WorkbenchPipelineStep[]): Promise<boolean>;
    /**
     * Set the directory this pipeline's steps run in.
     *
     * The pipeline's own field, never a write onto its cards: one card can be a step of two
     * pipelines, and a directory stored on the card would follow it into both.
     * @param id - pipeline to edit.
     * @param workspace - the directory, or undefined to stop naming one.
     * @returns whether the write landed.
     */
    setWorkspace(id: string, workspace: WorkbenchCardWorkspace | undefined): Promise<boolean>;
    /** Read the stored set again. */
    reload(): void;
}
/**
 * Choose an unused pipeline id.
 * @param taken - ids already in use.
 * @returns the first free `pipeline-N`.
 */
export declare function nextPipelineId(taken: ReadonlySet<string>): string;
/**
 * Trim a name and clamp it to the contract's length.
 * @param name - the name as typed.
 * @returns the name as it may be stored; empty when nothing is left.
 */
export declare function clampPipelineName(name: string): string;
/**
 * Read and mutate the stored pipelines.
 * @param api - pipeline transport.
 * @returns the current state plus the mutations.
 */
export declare function usePipelines(api: WorkbenchPipelineApi): WorkbenchPipelinesFace;
