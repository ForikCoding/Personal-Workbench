/**
 * The directory a card runs in, and the two ways of naming it.
 *
 * A picker when the build ships one, a field when it does not. Both are in one component
 * because the question is one question: the configuration page and the run dialog ask it, and
 * a card that could pick a directory on one screen and only read it on the other would be the
 * bug this file exists to prevent — a card whose folder is wrong, and no way to say otherwise
 * on the screen where the run is pressed.
 *
 * A typed path is not the unconfirmed path this feature refused earlier: the Host is asked
 * whether it is a directory before anything is stored, the same check a run is gated on, so a
 * typo is answered rather than persisted.
 * @module dsh-workbench/client/skill-card/WorkspaceField
 */
import { type ReactNode } from 'react';
import type { WorkbenchCardView } from './controller.ts';
import type { WorkbenchLocaleKey } from '../locales.ts';
/**
 * Render the card's directory field.
 * @param props - the card view, the translator, and the two ways of naming a directory.
 * @returns the field.
 */
export declare function WorkspaceField({ view, t, onChooseWorkspace, onSetWorkspace, }: {
    readonly view: WorkbenchCardView;
    readonly t: (key: WorkbenchLocaleKey) => string;
    readonly onChooseWorkspace: () => void;
    readonly onSetWorkspace: (path: string) => void;
}): ReactNode;
