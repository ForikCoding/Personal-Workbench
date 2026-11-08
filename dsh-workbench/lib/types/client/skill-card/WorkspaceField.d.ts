/**
 * The directory something runs in, and the two ways of naming it.
 *
 * A picker when the build ships one, a field when it does not. Both are in one component
 * because the question is one question: the configuration page, the run dialog and the
 * confirmation panel all ask it, and a card that could pick a directory on one screen and
 * only read it on the other would be the bug this file exists to prevent — a card whose
 * folder is wrong, and no way to say otherwise on the screen where the run is pressed.
 *
 * A typed path is not the unconfirmed path this feature refused earlier: the Host is asked
 * whether it is a directory before anything is stored, the same check a run is gated on, so a
 * typo is answered rather than persisted.
 * @module dsh-workbench/client/skill-card/WorkspaceField
 */
import { type ReactNode } from 'react';
import type { WorkbenchCardView, WorkbenchWorkspaceTypedProblem } from './controller.ts';
import type { WorkbenchLocaleKey } from '../locales.ts';
/**
 * The field that takes a typed path, with its own answer to a path it did not take.
 *
 * Shared rather than written twice: the card's own directory and an invocation's directory are
 * asked the same way, refused for the same reasons, and should say so in the same words. What
 * differs is only where a confirmed path goes — the card's record, or this one run.
 * @param props - the resting value, the field's state, the note to show, and the commit.
 * @returns the input, its button, and the sentence explaining a refusal.
 */
export declare function WorkspacePathField({ value, fieldKind, problem, t, onCommit, }: {
    /** The path the field rests on; a keystroke is the user's edit, not this component's. */
    readonly value: string;
    /** Which state of the question this field is showing, carried for the layout's styling. */
    readonly fieldKind: 'ready' | 'missing' | 'invalid';
    /** Why the last typed path was not taken, if it was not. */
    readonly problem: WorkbenchWorkspaceTypedProblem | undefined;
    readonly t: (key: WorkbenchLocaleKey) => string;
    readonly onCommit: (path: string) => void;
}): ReactNode;
/**
 * Render the card's directory field.
 * @param props - the card view, the translator, and the two ways of naming a directory.
 * @returns the field.
 */
export declare function WorkspaceField({ view, t, onChooseWorkspace, onSetWorkspace, onClearWorkspace, }: {
    readonly view: WorkbenchCardView;
    readonly t: (key: WorkbenchLocaleKey) => string;
    readonly onChooseWorkspace: () => void;
    readonly onSetWorkspace: (path: string) => void;
    /**
     * Stop naming a directory for this card.
     *
     * Absent when the screen has nothing to write with, and then no control is drawn — a clear
     * button that cannot clear is worse than the missing answer it offers.
     */
    readonly onClearWorkspace?: (() => void) | undefined;
}): ReactNode;
