/**
 * Resolving a clicked action key into a target that can actually run.
 *
 * Two lookups, deliberately separate: the key must exist in the template's
 * declarations, and the thing it names must still exist. The second one fails in
 * ordinary use — a card gets deleted, a skill gets uninstalled — so every failure
 * carries the candidates the user needs to fix it, and nothing is ever guessed.
 * @module dsh-workbench/client/skill-card/actions
 */
import type { WorkbenchActionDeclaration, WorkbenchActionTarget } from '../../skill-card-contract.ts';
/** Why one click cannot be carried out. */
export type WorkbenchActionErrorCode = 'unknown-action' | 'target-card-missing' | 'target-card-ambiguous' | 'target-skill-missing' | 'target-busy' | 'target-unavailable';
/** One card as the resolver needs to see it. */
export interface WorkbenchActionCard {
    readonly cardId: string;
    /** The name the template refers to; user-editable, so it can drift. */
    readonly name: string;
    /** Whether this card is already running. */
    readonly running: boolean;
}
/** Everything the resolver reads, taken at the moment of the click. */
export interface WorkbenchActionLookup {
    /** Cards the workbench currently holds, in display order. */
    readonly cards: readonly WorkbenchActionCard[];
    /** Skills that may be invoked by a human, by name. */
    readonly skills: readonly string[];
    /** Whether a live session exists to run in. */
    readonly live: boolean;
}
/** The outcome of resolving one click. */
export type WorkbenchActionResolution = {
    readonly kind: 'resolved';
    readonly key: string;
    readonly target: WorkbenchActionTarget;
    /** Opaque identity: a card id, or a skill name. */
    readonly reference: string;
    /** That row's raw fields, unchanged. */
    readonly payload: Record<string, unknown>;
} | {
    readonly kind: 'failed';
    readonly key: string;
    readonly code: WorkbenchActionErrorCode;
    /** Everything the user could have meant, for the message to list. */
    readonly candidates: readonly string[];
};
/**
 * Resolve one clicked key against the template's declarations and the live catalog.
 *
 * The order is the contract, because the user sees only the first failure: an unknown
 * key is reported before a missing target, and a missing target before a busy one.
 * @param declarations - the targets the template declares.
 * @param lookup - cards, skills, and liveness as of this click.
 * @param key - the action key the button carried.
 * @param payload - that row's raw fields.
 * @returns the resolved target, or why it cannot run.
 */
export declare function resolveAction(declarations: readonly WorkbenchActionDeclaration[], lookup: WorkbenchActionLookup, key: string, payload: Record<string, unknown>): WorkbenchActionResolution;
