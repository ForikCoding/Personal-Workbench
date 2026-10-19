/**
 * The card's workspace field: which directory it names, what to call it on screen, and
 * when a card cannot run at all.
 *
 * The stored value is a full absolute path and nothing else — no workspace id, no relative
 * path, no default. That is the product decision: a card runs in whatever directory the
 * user picked, which need not be a registered workspace. Everything here therefore treats
 * a missing or unconfirmable path as a closed gate rather than as something to infer.
 *
 * The deciding question throughout is "is there a directory this card may run in", never
 * "did the picker load". The run control reads the same three states the field renders, so
 * the two can never disagree about whether a run is possible.
 * @module dsh-workbench/client/skill-card/workspace
 */
import type { WorkbenchCardWorkspace, WorkbenchDirectoryStat } from '../../skill-card-contract.ts';
/**
 * What the configuration page renders for the directory, and whether a run can start.
 *
 * Three states rather than a path plus flags, because the run control's answer and the
 * field's answer have to be the same answer: a field that says "missing" beside an enabled
 * Run button is the bug this type exists to make impossible.
 */
export type WorkbenchWorkspaceField = 
/** No directory is configured, so there is nowhere to run. */
{
    readonly kind: 'missing';
}
/**
 * A path is stored but nothing confirms it is a directory.
 *
 * `path` and `leaf` travel with the state so every message about it can name the
 * directory in full, and the field can still show what the card is pointed at. `checked`
 * says whether the Host has answered yet: the gate is closed either way, but a page may
 * not claim a directory is gone before anything looked.
 */
 | {
    readonly kind: 'invalid';
    readonly path: string;
    readonly leaf: string;
    /** Whether the Host's answer has arrived; false means nobody has looked yet. */
    readonly checked: boolean;
}
/** A stored path that the Host confirmed is a directory: a run can start. */
 | {
    readonly kind: 'ready';
    readonly path: string;
    readonly leaf: string;
};
/**
 * The answer when nothing could be read at all.
 *
 * A check that never answered is treated as "nothing is there" rather than as a fourth
 * state: an unconfirmed directory is one a card may not run in, and inventing a "checking"
 * state would let the run control open on a path nobody verified.
 */
export declare const NO_DIRECTORY_STAT: WorkbenchDirectoryStat;
/**
 * The last segment of a directory path, for the field's primary value.
 *
 * Display only: the stored value is the full path and the run uses it as it is, so this
 * never round-trips into storage or into a request. Trailing separators are dropped first,
 * because a path is often written both ways and `Personal-Workbench/` must not read as an
 * empty name.
 * @param path - an absolute directory path, as stored.
 * @returns the last segment; a drive root and a filesystem root are handled below.
 */
export declare function workspaceLeaf(path: string): string;
/**
 * Resolve the field from the card's stored directory and the Host's answer about it.
 * @param stored - the directory this card stores, when it has one.
 * @param stat - what the Host answered about it; undefined while no answer has arrived.
 * @returns the field state.
 */
export declare function resolveWorkspaceField(stored: WorkbenchCardWorkspace | undefined, stat: WorkbenchDirectoryStat | undefined): WorkbenchWorkspaceField;
