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
    /** The file the app opened this body for, when it named one. */
    readonly openFile?: string | undefined;
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
export declare function SkillCardBody({ view, cardId, t, onAction, documents, openFile }: SkillCardBodyProps): ReactNode;
/**
 * Choose the status line for a higher-priority fact.
 * @param code - the failure code.
 * @returns the locale key. Exhaustive over the code union.
 */
export declare function problemKey(code: WorkbenchCardProblem['code']): WorkbenchLocaleKey;
/** One reason a card's run control is closed, and the fact the user has to change. */
export interface WorkbenchRunProblem {
    /** Which of the four answers this is. */
    readonly code: WorkbenchCardProblem['code'];
    /** The directory the answer is about, for the workspace's own sentence. */
    readonly detail?: string | undefined;
}
/**
 * Every reason this card cannot start a run, in the order a user fixes them.
 *
 * The list is the single answer to "why is 运行 grey": the run pages print all of it, and a
 * card face has room for the first line only. Written once because the two places used to
 * carry their own copies of the four conditions, and a face that named a different reason
 * from the page under it would be worse than no sentence at all.
 *
 * The precedence is deliberate and it is the reason the list is written once: the directory
 * is this card's own fact and the one a sentence can point at ("that path is not there"), so
 * it is named first; a card with no model at all is the broader fact and is named after it;
 * and a harness without an activation seam is the one thing the user cannot fix from this
 * page, so it comes last. A face that said "no model is available" over a card whose folder
 * had been copied from another machine would send its reader to the wrong setting.
 * @param view - what the card currently shows.
 * @returns the reasons, most important first; empty when the control is open.
 */
export declare function runProblemsOf(view: WorkbenchCardView): readonly WorkbenchRunProblem[];
/**
 * The first of {@link runProblemsOf}, for a face with room for one line.
 * @param view - what the card currently shows.
 * @returns the reason to name, or undefined when the card can run.
 */
export declare function runProblemOf(view: WorkbenchCardView): WorkbenchRunProblem | undefined;
/**
 * Render the reasons a run cannot start, each under the control it explains.
 * @param props - the card's view and the translator.
 * @param props.view - what the card currently shows.
 * @param props.t - translator.
 * @returns the sentences, or nothing when the control is open.
 */
export declare function RunProblemLines({ view, t, }: {
    readonly view: WorkbenchCardView;
    readonly t: (key: WorkbenchLocaleKey) => string;
}): ReactNode;
/**
 * State the directory a result was produced in.
 *
 * The one run fact that is neither in the document nor in the run record: a result says what
 * the skill produced, the history says when and for how long, and neither says *where*. It
 * matters most exactly when it is least obvious — a card whose folder was changed, or copied
 * from another machine — so it is printed as the full path rather than the folder's name, and
 * it is printed from the card, which is where the run dialog writes the answer.
 * @param props - the card's view and the translator.
 * @param props.view - what the card currently shows.
 * @param props.t - translator.
 * @returns the line, or nothing for a card that has no directory to name.
 */
export declare function RunWorkspaceLine({ view, t, }: {
    readonly view: WorkbenchCardView;
    readonly t: (key: WorkbenchLocaleKey) => string;
}): ReactNode;
