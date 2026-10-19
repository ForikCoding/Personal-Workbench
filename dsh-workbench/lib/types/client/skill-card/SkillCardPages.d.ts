/**
 * The two full-panel views one skill card opens into.
 *
 * A card is an index entry: its face carries the name, the skill, and the way into
 * configuration. The result and the configuration each take the whole display
 * column, because both are wider than a grid cell: the result is arbitrary HTML the
 * user authored, and the configuration is a name field, a skill picker, a template
 * editor, a field list, and a preview.
 *
 * Each page builds its own card controller rather than receiving one. That is what
 * makes the hook call legal: a page is mounted only while it is the current view,
 * so the controller runs only for the card on screen.
 * @module dsh-workbench/client/skill-card/SkillCardPages
 */
import { type ReactNode } from 'react';
import type { WorkbenchLocaleKey } from '../locales.ts';
import type { WorkbenchSkillCardApi } from './api.ts';
import type { WorkbenchModelSeat } from './model.ts';
import type { WorkbenchWorkspacePicker } from './workspace-picker.ts';
/** What both pages need to show and change one card. */
export interface SkillCardPageProps {
    /** Transport. */
    readonly api: WorkbenchSkillCardApi;
    /** Card being shown. */
    readonly cardId: string;
    /**
     * Resolve the session a run hangs off.
     * @returns the session id, or undefined when none is available.
     */
    readonly runSessionId: () => string | undefined;
    /**
     * Read the model catalog, and what it knows about one session.
     *
     * Required rather than optional: a page that cannot see the directory cannot say which
     * model a run would use, and this feature never runs work it cannot name.
     */
    readonly models: WorkbenchModelSeat;
    /**
     * Ask the user for a directory to use as this card's workspace.
     *
     * Required rather than optional: a page that silently offers no picker would leave a card
     * permanently unable to run with no way to say so.
     */
    readonly workspacePicker: WorkbenchWorkspacePicker;
    /**
     * Shown in place of the name while the card has none.
     *
     * Only the result page reads it: the configuration page lets its own name field carry
     * that fact, so a head that repeated it would be the second, uneditable copy.
     */
    readonly fallbackTitle: string;
    /** Leave the page and return to the grid. */
    readonly onBack: () => void;
    /**
     * Open one of a card's full-panel views.
     *
     * A card-target action starts that card's run and then shows it, so the result page
     * is the one that needs this.
     * @param cardId - the card to show.
     * @param view - which of its two views.
     */
    readonly openCard: (cardId: string, view: 'result' | 'config') => void;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
}
/**
 * Render the card's result in the whole display column, with its run control.
 * @param props - transport, card identity, session resolver, title fallback, back, and `t`.
 * @returns the result page.
 */
export declare function SkillCardResultPage(props: SkillCardPageProps): ReactNode;
/**
 * Render the card's configuration in the whole display column.
 *
 * The head is the way back and nothing else. The card's name and skill were repeated
 * here *and* in the fields below, which made the page state the same two facts twice
 * and the head's copy the one that could not be edited. Removing the card lives in the
 * footer instead, apart from the controls a user presses without reading.
 * @param props - transport, card identity, session resolver, title fallback, back, and `t`.
 * @returns the configuration page.
 */
export declare function SkillCardConfigPage(props: SkillCardPageProps): ReactNode;
