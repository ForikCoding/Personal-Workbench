/**
 * The skill card: one HTML template the user wrote, filled with the value a child
 * agent produced.
 *
 * The card owns no frame. It hands the shared shell its presentation facts and
 * supplies its content through the shell's body slot.
 * @module dsh-workbench/client/skill-card/SkillCard
 */
import { type ReactNode } from 'react';
import type { InjectFace, PropsRenderFactories, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { WorkbenchLocaleKey } from '../locales.ts';
import type { WorkbenchCardState } from '../contract.ts';
import type { WorkbenchActionEvent, WorkbenchScriptBinder } from './render.ts';
import type { WorkbenchCardProblem, WorkbenchCardView } from './controller.ts';
import type { WorkbenchSkillCardApi } from './api.ts';
/** Identity of the one skill card. */
export declare const SKILL_CARD_ID = "skill-card";
/**
 * Read the title one card face shows.
 *
 * Kept next to the face that applies it, because an action declaration addresses a
 * card by the name the user sees: resolving that name has to fall back exactly the
 * same way, or a declaration pointing at a nameless card would never resolve.
 * @param stored - the stored card record.
 * @param stored.cardId - the card's identity.
 * @param stored.name - the user's name for it, when one is stored.
 * @param t - translator, for the default card's own label.
 * @returns the visible title.
 */
export declare function cardFaceTitle(stored: {
    readonly cardId: string;
    readonly name?: string | undefined;
}, t: (key: WorkbenchLocaleKey) => string): string;
/**
 * Where one card stands, as the face's status dot reports it.
 *
 * A run in flight outranks everything: the card is working, whatever its last record says.
 * With nothing running, the newest stored run is the verdict — and a run that ended
 * without usable content is an error rather than a success, which is the distinction the
 * record's own `failure` carries (see `run-timeout`).
 * @param view - what the card currently shows.
 * @returns the state the shared shell paints.
 */
export declare function cardFaceStanding(view: WorkbenchCardView): WorkbenchCardState;
/** Injected share of the skill card entry. */
export interface SkillCardFace {
    /** Transport. */
    readonly api: WorkbenchSkillCardApi;
    /**
     * Read the session the card reads the installed skills through.
     *
     * Not the session a run executes in: a run is given one of its own. This one supplies the
     * agent scope a catalog read needs. A callback rather than a value: the read happens when
     * the card asks, which is the freshest point and finds a session opened after the card
     * rendered. The `useSessions` hook belongs to `ui-session`'s standard props, which this
     * package cannot type without depending on that plugin's client entry.
     * @returns the session id, or undefined when none qualifies.
     */
    readonly runSessionId: () => string | undefined;
    /**
     * Open one of this card's full-panel views in the whole display column.
     * @param cardId - the card to show.
     * @param view - which of its views; `result` without a run opens the latest run.
     */
    readonly openCard: (cardId: string, view: 'result' | 'runs' | 'config') => void;
}
/** Composed props of the skill card entry. */
export type SkillCardProps = PropsRuntime<'workbench.cards'> & PropsRenderFactories & InjectFace<SkillCardFace> & {
    /**
     * Translate one workbench string.
     *
     * Takes parameters because the face counts and dates its own runs, and a count is
     * part of the sentence rather than something appended to it.
     * @param key - dictionary key.
     * @param params - named values the sentence interpolates.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
};
/**
 * Render the skill card.
 * @param props - owner props, shell render share, transport, session lookup, and `t`.
 * @returns the card element.
 */
export declare function SkillCard(props: SkillCardProps): ReactNode;
/** Props of the card body. */
export interface SkillCardBodyProps {
    /** What the card currently shows. */
    readonly view: WorkbenchCardView;
    /**
     * The card this body belongs to; the document's own script is bound to it.
     *
     * Absent renders the document unbound: its own logic runs, and a read it asks for finds no
     * card behind it. Both pages that show a card always have one; a preview need not.
     */
    readonly cardId?: string | undefined;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey) => string;
    /**
     * Called when a button inside the rendered document is clicked.
     *
     * Omitted leaves the document inert, which is the whole of what a card without a
     * confirmation panel should do with a child-authored button.
     * @param event - the action the click resolved to, or why it could not be read.
     */
    readonly onAction?: ((event: WorkbenchActionEvent) => void) | undefined;
    /** Builds the binding the rendered document's own script receives. */
    readonly documents?: WorkbenchScriptBinder | undefined;
}
/**
 * Render the card's content.
 *
 * The permission note is not here: the result page carries it as a footnote beneath
 * everything, because it is a statement about the page rather than part of the document
 * the card renders.
 * @param props - the view, `t`, and the click outlet.
 * @returns the body element.
 */
export declare function SkillCardBody({ view, cardId, t, onAction, documents }: SkillCardBodyProps): ReactNode;
/**
 * Choose the status line for a higher-priority fact.
 * @param code - the failure code.
 * @returns the locale key. Exhaustive over the code union.
 */
export declare function problemKey(code: WorkbenchCardProblem['code']): WorkbenchLocaleKey;
