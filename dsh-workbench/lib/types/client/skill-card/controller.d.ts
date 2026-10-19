/**
 * Skill card state: what one card shows and what it can do.
 *
 * The card never talks to the Host directly; it renders this view and calls these
 * actions. Failures travel as codes so the component localizes them, with the
 * Host's own text kept as secondary detail.
 *
 * Two of the states here are deliberately transient and never stored: the action
 * waiting for confirmation, and a bare run's progress. A reload loses both, which is
 * what makes a skill target's result a property of the screen rather than of the card.
 *
 * The refinement state — the revision log and the one version kept for a step back —
 * is transient for the same reason: the stored result stays the only durable thing,
 * and a reload starts the conversation over.
 * @module dsh-workbench/client/skill-card/controller
 */
import type { WorkbenchActionTarget, WorkbenchCardModel, WorkbenchResultRecord, WorkbenchRunState, WorkbenchSkillCardErrorCode, WorkbenchSkillCatalogEntry } from '../../skill-card-contract.ts';
import type { WorkbenchSkillCardApi } from './api.ts';
import type { WorkbenchActionErrorCode } from './actions.ts';
import type { WorkbenchModelField, WorkbenchModelSeat } from './model.ts';
import type { WorkbenchActionEvent } from './render.ts';
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
/**
 * Every reason a clicked action cannot run.
 *
 * The three payload reasons come from reading the button, the rest from resolving what
 * it points at. Both sets are reported the same way, on the card the user is looking
 * at.
 */
export type WorkbenchActionProblemCode = WorkbenchActionErrorCode
/** A click whose own key or payload could not be read; see {@link WorkbenchActionEvent}. */
 | Extract<WorkbenchActionEvent, {
    readonly kind: 'invalid';
}>['reason'];
/** Why one clicked action cannot run. */
export interface WorkbenchActionProblem {
    /** Code the panel localizes. */
    readonly code: WorkbenchActionProblemCode;
    /** Everything the user could have meant, for the message to list; empty when none. */
    readonly candidates: readonly string[];
    /** The Host's own text, when the failure has one. */
    readonly detail?: string;
}
/**
 * One action waiting for confirmation.
 *
 * Carries everything the panel states, read at the moment of the click, so the values
 * the user confirms are the values that run.
 */
export interface WorkbenchPendingAction {
    /** Action key the button carried. */
    readonly key: string;
    /** What that key resolves to. */
    readonly target: WorkbenchActionTarget;
    /** Target identity resolved at click time: a card id, or a skill name. */
    readonly reference: string;
    /** The skill that will run: a card target's own skill, or the skill target itself. */
    readonly skill: string;
    /** That row's raw fields, unchanged. */
    readonly payload: Record<string, unknown>;
    /** Session the run belongs to. */
    readonly sessionId: string;
}
/**
 * One bare run's state.
 *
 * There is no result to keep, so there is nothing to store: a skill target answers
 * whether it worked, and the card underneath keeps showing its own stored result.
 */
export type WorkbenchBareRunState = {
    readonly phase: 'running';
    readonly skill: string;
    readonly startedAt: number;
} | {
    readonly phase: 'settled';
    readonly skill: string;
    /** Whether the child ended normally. */
    readonly ok: boolean;
    /** Why it did not, when it did not. */
    readonly diagnostic?: string;
};
/**
 * One accepted refinement, as the result page's log shows it.
 *
 * Kept in memory only: the log is a conversation with this page, not a property of the
 * card, so a reload starts it empty.
 */
export interface WorkbenchRefinement {
    /** What the user asked for, verbatim. */
    readonly instruction: string;
    /** When the refinement was applied, in milliseconds since the epoch. */
    readonly at: number;
}
/**
 * The result one refinement replaced, kept for a single step back.
 *
 * In memory only for the same reason as the log, and replaced — not appended to — on
 * every refinement: the step back is one version deep by design.
 */
export interface WorkbenchPreviousResult {
    /** The region HTML the surface showed before the last refinement. */
    readonly html: string;
    /** When that result was executed, in milliseconds since the epoch. */
    readonly at: number;
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
    /**
     * Why this card cannot run at all, when the deployment cannot start a child.
     *
     * Separate from {@link problem} because it is not a fault of the card: reading,
     * configuring, and hand-editing it all still work, so the card must keep rendering
     * its content while this states what the run control waits for.
     */
    readonly runUnavailable?: WorkbenchCardProblem;
    /** The action waiting for confirmation; while present the panel replaces the body. */
    readonly pendingAction?: WorkbenchPendingAction;
    /** The last clicked action's refusal, shown as an alert. */
    readonly actionProblem?: WorkbenchActionProblem;
    /** This session's bare run, when a skill target was triggered. */
    readonly bareRun?: WorkbenchBareRunState;
    /**
     * Refinements applied in this session, oldest first.
     *
     * Read as a conversation log by the result page. Never stored, so a reload starts it
     * empty — an accepted cost of keeping the stored result the only durable thing.
     */
    readonly refinements: readonly WorkbenchRefinement[];
    /** The result the last refinement replaced, for one step back; in memory only. */
    readonly previous: WorkbenchPreviousResult | undefined;
    /**
     * Why the last refinement failed.
     *
     * Separate from {@link problem} because the page reports it under the composer, where
     * the ask came from, instead of above the result the user is still reading.
     */
    readonly refineProblem?: WorkbenchCardProblem;
    /**
     * Whether the running run is a refinement of what is shown.
     *
     * The surface keeps the current result while this is true: a refinement changes the
     * result, so hiding it removes the thing the user is reviewing.
     */
    readonly refining?: boolean;
    /** Whether a run can start: a skill, a template, a live session, and a model to name. */
    readonly runnable: boolean;
    /**
     * What the model field offers, and whether a run can name its route.
     *
     * Carried on the view rather than read by each page, because the field's state and the
     * run control's answer have to be the same answer.
     */
    readonly modelField: WorkbenchModelField;
    /** Skills the session's agent can invoke. */
    readonly catalog: readonly WorkbenchSkillCatalogEntry[];
    /** Whether the catalog has been read. */
    readonly catalogStatus: WorkbenchCatalogStatus;
    /** Why the catalog could not be read, when it could not. */
    readonly catalogFailure: WorkbenchSkillCardErrorCode | 'unavailable' | undefined;
    /**
     * Titles of every stored card, as a declaration must address them.
     *
     * The editor checks a declared card target against this list. It is carried on the
     * view rather than read by the analyser because the analyser is a pure text function
     * with no catalog and no storage, and because these names are the ones the click path
     * resolves against: a second rule here would let a declaration resolve differently in
     * the editor than it does when clicked.
     */
    readonly cardTitles: readonly string[];
}
/** What one card can do. */
export interface WorkbenchCardActions {
    /** Start a run. */
    run(): void;
    /** Cancel the in-flight run. */
    cancel(): void;
    /**
     * Ask for the current result to be revised.
     *
     * The run is a card run with the same contract, so its result replaces the card's
     * stored result; this session keeps the previous HTML and appends one log entry.
     * @param instruction - what to change, as the user typed it.
     */
    refine(instruction: string): void;
    /**
     * Put the result the last refinement — or the last hand edit — replaced back on screen.
     *
     * One step only: the previous version is consumed, and this never writes storage. The
     * undo stack is deliberately separate from the revision log, so a hand edit is undoable
     * without becoming an entry in a log that records instructions.
     */
    undoRefine(): void;
    /**
     * Store one hand-edited region fragment as this card's result.
     *
     * The record's run facts — the skill and the stop reason — are the Host's to keep; this
     * replaces the filled region and nothing else. The pre-edit result is kept for one step
     * back, and the edit is deliberately not appended to the revision log.
     * @param html - the fragment as the editor shows it.
     * @returns whether it was stored; a refusal is reported as {@link WorkbenchCardView.problem}.
     */
    saveResultEdit(html: string): Promise<boolean>;
    /** Re-read the stored configuration and result. */
    refresh(): void;
    /** Store a new skill selection. */
    chooseSkill(skill: string): void;
    /**
     * Store the model this card's runs use.
     *
     * The pair travels whole: two ids, never a joined string, so a provider id containing a
     * slash cannot be misread as a separator.
     * @param model - the route the user chose.
     */
    chooseModel(model: WorkbenchCardModel): void;
    /**
     * Store a template for the selected skill, together with the card's name.
     * @param template - the HTML to store.
     * @param name - the card's name as the editor shows it; an empty value clears it.
     */
    saveTemplate(template: string, name: string): void;
    /** Store the card's name; an empty name clears it back to the registered label. */
    rename(name: string): void;
    /**
     * Remove the card and everything stored for it.
     * @returns resolution once the Host has committed the removal.
     */
    remove(): Promise<void>;
    /**
     * Read one click on a button a child authored.
     *
     * Resolves the key at the moment of the click and either opens the confirmation
     * panel or reports why it cannot run. Nothing is executed here.
     * @param event - the action the click resolved to, or why it could not be read.
     */
    click(event: WorkbenchActionEvent): void;
    /** Carry out the pending action; the panel is one-shot. */
    confirmAction(): void;
    /** Drop the pending action. Nothing else happens: no run, no write, no navigation. */
    cancelAction(): void;
}
/** What the hook needs. */
export interface WorkbenchSkillCardOptions {
    /** Transport. */
    readonly api: WorkbenchSkillCardApi;
    /** Card identity. */
    readonly cardId: string;
    /**
     * Read the session a run hangs off.
     *
     * A callback rather than a value, because the click path has to know whether a
     * session is live *when the click happens*: opening a session after the page rendered
     * must make the next click resolvable rather than refusing it.
     * @returns the session id, or undefined when none is available.
     */
    readonly session: () => string | undefined;
    /**
     * Whether this card needs the skill catalog.
     *
     * Only the configuration view lists skills, so only it asks for the catalog. The
     * grid renders one face per card, and loading the catalog for each of them would
     * issue a request per card for a list none of them shows.
     */
    readonly withCatalog?: boolean;
    /**
     * Read the model catalog this card's field offers.
     *
     * Omitted by the card face, which neither shows the field nor has a run control. A page
     * that omits it resolves every card to "no model known", which is the honest answer for
     * a view that cannot see the directory.
     */
    readonly models?: WorkbenchModelSeat;
    /**
     * Read the title one card face shows.
     *
     * A declaration addresses a card by the name the user sees, so resolution has to
     * fall back exactly the way the face does.
     * @param cardId - the card.
     * @param name - its stored name, when it has one.
     * @returns the visible title.
     */
    readonly cardTitle?: (cardId: string, name: string | undefined) => string;
    /**
     * Open one of a card's full-panel views.
     *
     * A card target starts its run and then jumps to that card, which is a navigation
     * only the panel can perform.
     * @param cardId - the card to show.
     * @param view - which of its two views.
     */
    readonly openCard?: (cardId: string, view: 'result' | 'config') => void;
    /**
     * Whether to adopt a run that is already in flight for this card.
     *
     * A run can be started by another card's button before this card's page exists, and
     * only this card's own controller can show what became of it.
     */
    readonly watchRun?: boolean;
}
/**
 * Drive one skill card.
 * @param options - transport, card identity, session, and the panel's own callbacks.
 * @returns the card's view and actions.
 */
export declare function useSkillCard(options: WorkbenchSkillCardOptions): {
    readonly view: WorkbenchCardView;
    readonly actions: WorkbenchCardActions;
};
