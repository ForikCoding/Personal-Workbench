/**
 * Skill card state: what one card shows and what it can do.
 *
 * The card never talks to the Host directly; it renders this view and calls these
 * actions. Failures travel as codes so the component localizes them, with the
 * Host's own text kept as secondary detail.
 * @module dsh-workbench/client/skill-card/controller
 */
import type { WorkbenchResultRecord, WorkbenchRunState, WorkbenchSkillCardErrorCode, WorkbenchSkillCatalogEntry } from '../../skill-card-contract.ts';
import type { WorkbenchSkillCardApi } from './api.ts';
/** Whether the editor's skill catalog has been read. */
export type WorkbenchCatalogStatus = 'idle' | 'loading' | 'ready' | 'failed';
/** Why a card cannot show or do what it should. */
export interface WorkbenchCardProblem {
    /**
     * Code the component localizes.
     *
     * `unavailable` covers a read that never arrived; `template-invalid` covers a
     * stored template that no longer derives a usable contract.
     */
    readonly code: WorkbenchSkillCardErrorCode | 'unavailable' | 'template-invalid';
    /** Operator-facing detail shown as secondary text. */
    readonly detail?: string;
}
/** What one card renders. */
export interface WorkbenchCardView {
    /** Whether the stored configuration has been read yet. */
    readonly status: 'loading' | 'ready' | 'unavailable';
    /** User-assigned card name; absent means the card's registered label stands. */
    readonly name?: string;
    /** Selected skill, when one is configured. */
    readonly skill?: string;
    /** Stored template for the selected skill, when one exists. */
    readonly template?: string;
    /** Most recent result: the live run's, or the stored one. */
    readonly result?: WorkbenchResultRecord;
    /** Live run state, once a run has been started in this session. */
    readonly run?: WorkbenchRunState;
    /** Present when the card cannot show or do what it should. */
    readonly problem?: WorkbenchCardProblem;
    /** Whether a run can start: a skill, a template, and a live session. */
    readonly runnable: boolean;
    /** Skills the session's agent can invoke. */
    readonly catalog: readonly WorkbenchSkillCatalogEntry[];
    /** Whether the catalog has been read. */
    readonly catalogStatus: WorkbenchCatalogStatus;
    /** Why the catalog could not be read, when it could not. */
    readonly catalogFailure: WorkbenchSkillCardErrorCode | 'unavailable' | undefined;
}
/** What one card can do. */
export interface WorkbenchCardActions {
    /** Start a run. */
    run(): void;
    /** Cancel the in-flight run. */
    cancel(): void;
    /** Re-read the stored configuration and result. */
    refresh(): void;
    /** Store a new skill selection. */
    chooseSkill(skill: string): void;
    /** Store a template for the selected skill. */
    saveTemplate(template: string): void;
    /** Store the card's name; an empty name clears it back to the registered label. */
    rename(name: string): void;
    /**
     * Remove the card and everything stored for it.
     * @returns resolution once the Host has committed the removal.
     */
    remove(): Promise<void>;
}
/** What the hook needs. */
export interface WorkbenchSkillCardOptions {
    /** Transport. */
    readonly api: WorkbenchSkillCardApi;
    /** Card identity. */
    readonly cardId: string;
    /** Session the run hangs off; undefined when none is available. */
    readonly sessionId: string | undefined;
    /**
     * Whether this card needs the skill catalog.
     *
     * Only the configuration view lists skills, so only it asks for the catalog. The
     * grid renders one face per card, and loading the catalog for each of them would
     * issue a request per card for a list none of them shows.
     */
    readonly withCatalog?: boolean;
}
/**
 * Drive one skill card.
 * @param options - transport, card identity, session, and panel activity.
 * @returns the card's view and actions.
 */
export declare function useSkillCard(options: WorkbenchSkillCardOptions): {
    readonly view: WorkbenchCardView;
    readonly actions: WorkbenchCardActions;
};
