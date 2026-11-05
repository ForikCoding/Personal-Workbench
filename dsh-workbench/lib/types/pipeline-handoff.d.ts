/**
 * The notes a pipeline's steps leave for each other on disk.
 *
 * A chain's real hand-off is its conversation: step two continues the session step one
 * ran in, and sees everything. That only holds while the session does. A chain finished
 * yesterday, a session the profile archived, or a single step started on its own all
 * reach a step with no conversation behind it — and a step that then runs blind is a step
 * that quietly answers from nothing.
 *
 * So each step writes one note into its own workspace, named by the pipeline and the
 * position in it, and a step that cannot continue the conversation is handed the notes of
 * the steps before it instead. One file per (pipeline, step), overwritten each run: the
 * note is the step's latest account of itself, not a log.
 *
 * Writing is best effort, always. A note that could not be written costs the fallback, not
 * the run; a step that ran is worth more than the bookkeeping about it.
 * @module dsh-workbench/pipeline-handoff
 */
import type { WorkbenchPipelineHandoff } from './skill-card-contract.ts';
/** Directory, relative to the workspace, the notes live under. */
export declare const WORKBENCH_HANDOFF_DIR = ".workbench/handoff";
/** How much of one note is carried into a prompt. */
export declare const WORKBENCH_HANDOFF_NOTE_MAX_BYTES: number;
/** How much of all the notes together is carried into a prompt. */
export declare const WORKBENCH_HANDOFF_TOTAL_MAX_BYTES: number;
/** How many earlier steps a prompt is told about. */
export declare const WORKBENCH_HANDOFF_MAX_STEPS = 32;
/**
 * Turn a pipeline id into a directory name.
 *
 * The id is the client's, and a client is free to name a pipeline anything, so it cannot
 * be used as a path segment as-is: a slash would write outside the pipeline's own folder
 * and a leading dot would hide it. Everything outside a conservative set becomes `_`,
 * which keeps two different pipelines apart in every case that matters and collapses the
 * ones that would only have differed by a character a filesystem refuses anyway.
 * @param pipelineId - the pipeline's identity.
 * @returns the directory name to use.
 */
export declare function handoffDirectoryName(pipelineId: string): string;
/**
 * Where one step's note lives.
 * @param workspace - the directory the step runs in.
 * @param handoff - which pipeline and which step.
 * @returns the note's absolute path.
 */
export declare function handoffPathFor(workspace: string, handoff: WorkbenchPipelineHandoff): string;
/**
 * Read the notes the earlier steps of one pipeline left.
 *
 * Oldest first, because that is the order the steps ran in and the order they should be
 * read in. Absent files are not an error: a step two of three is normally the first run of
 * anything, and it simply has no notes to read.
 * @param workspace - the directory the step is about to run in.
 * @param handoff - which pipeline and which step is starting.
 * @returns the notes as one document, or undefined when there are none.
 */
export declare function readHandoffNotes(workspace: string, handoff: WorkbenchPipelineHandoff): Promise<string | undefined>;
/**
 * Write the note one step leaves behind.
 * @param workspace - the directory the step ran in.
 * @param handoff - which pipeline and which step.
 * @param text - the note itself; blank means nothing worth leaving, so nothing is written.
 * @returns the path written, or undefined when there was nothing to write.
 */
export declare function writeHandoffNote(workspace: string, handoff: WorkbenchPipelineHandoff, text: string): Promise<string | undefined>;
