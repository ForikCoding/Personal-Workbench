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
    /** Shown in place of the name while the card has none. */
    readonly fallbackTitle: string;
    /** Leave the page and return to the grid. */
    readonly onBack: () => void;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey) => string;
}
/**
 * Render the card's result in the whole display column, with its run control.
 * @param props - transport, card identity, session resolver, title fallback, back, and `t`.
 * @returns the result page.
 */
export declare function SkillCardResultPage(props: SkillCardPageProps): ReactNode;
/**
 * Render the card's configuration in the whole display column.
 * @param props - transport, card identity, session resolver, title fallback, back, and `t`.
 * @returns the configuration page.
 */
export declare function SkillCardConfigPage(props: SkillCardPageProps): ReactNode;
