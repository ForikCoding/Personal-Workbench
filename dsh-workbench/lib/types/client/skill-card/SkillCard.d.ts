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
import type { WorkbenchCardProblem, WorkbenchCardView } from './controller.ts';
import type { WorkbenchSkillCardApi } from './api.ts';
/** Identity of the one skill card. */
export declare const SKILL_CARD_ID = "skill-card";
/** Injected share of the skill card entry. */
export interface SkillCardFace {
    /** Transport. */
    readonly api: WorkbenchSkillCardApi;
    /**
     * Read the session a run should hang off.
     *
     * A callback rather than a value: the read happens when the card asks, which is
     * the freshest point and finds a session opened after the card rendered. The
     * `useSessions` hook belongs to `ui-session`'s standard props, which this
     * package cannot type without depending on that plugin's client entry.
     * @returns the session id, or undefined when none qualifies.
     */
    readonly runSessionId: () => string | undefined;
    /**
     * Open one of this card's full-panel views in the whole display column.
     * @param cardId - the card to show.
     * @param view - which of its two views.
     */
    readonly openCard: (cardId: string, view: 'result' | 'config') => void;
}
/** Composed props of the skill card entry. */
export type SkillCardProps = PropsRuntime<'workbench.cards'> & PropsRenderFactories & InjectFace<SkillCardFace> & {
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey) => string;
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
     * Translate one workbench string.
     * @param key - dictionary key.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey) => string;
}
/**
 * Render the card's content.
 * @param props - the view and `t`.
 * @returns the body element.
 */
export declare function SkillCardBody({ view, t }: SkillCardBodyProps): ReactNode;
/**
 * Choose the status line for a higher-priority fact.
 * @param code - the failure code.
 * @returns the locale key. Exhaustive over the code union.
 */
export declare function problemKey(code: WorkbenchCardProblem['code']): WorkbenchLocaleKey;
