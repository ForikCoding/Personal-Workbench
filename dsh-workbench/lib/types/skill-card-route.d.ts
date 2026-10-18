/**
 * The skill card's private configuration route.
 *
 * The route is same-origin and fenced by Connection before it touches storage:
 * a request that fails the trust and browser-authentication check never reaches
 * the store. The payload is validated here as well as in the store, because this
 * is a process boundary and the caller is not a typed same-process consumer.
 * @module dsh-workbench/skill-card-route
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { WorkbenchSkillCardRunner } from './skill-card-runner.ts';
import type { WorkbenchSkillCardStore } from './skill-card-store.ts';
/**
 * Trust fence this route consults before any business logic.
 *
 * Structurally the same member the layout route consumes: both read Connection's
 * own check, and each feature states the member it needs rather than importing
 * the other's Host context type.
 */
export interface SkillCardRouteFence {
    /**
     * Apply the deployment's Host/Origin and browser-authentication checks.
     * @param request - the incoming request.
     * @returns the rejection status, or undefined when the route may proceed.
     */
    requestRejection(request: IncomingMessage): 401 | 403 | undefined;
}
/** Everything the configuration route handler needs. */
export interface WorkbenchSkillCardRouteOptions {
    /** Configuration and result store. */
    readonly store: WorkbenchSkillCardStore;
    /** Trust fence applied first. */
    readonly fence: SkillCardRouteFence;
    /**
     * Effective template byte budget.
     *
     * The route owns the HTTP status, so it checks the deployment's own limit
     * rather than the wire contract's ceiling; the store enforces it again.
     */
    readonly maxTemplateBytes: number;
    /** Host logger for storage failures. */
    readonly warn: (message: string) => void;
}
/**
 * Build the route handler for {@link WORKBENCH_SKILL_CARD_PATH}.
 * @param options - store, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export declare function createWorkbenchSkillCardHandler(options: WorkbenchSkillCardRouteOptions): (request: IncomingMessage, response: ServerResponse) => void;
/** Everything the stored-result edit route needs. */
export interface WorkbenchSkillCardResultRouteOptions {
    /** Result owner. The record's run facts are read from here, not from the request. */
    readonly store: WorkbenchSkillCardStore;
    /** Trust fence applied first. */
    readonly fence: SkillCardRouteFence;
    /**
     * Effective result byte budget of this deployment.
     *
     * A deployment may tighten the wire ceiling but never widen it: the route applies the
     * smaller of the two, so no request can store more than the contract advertises.
     */
    readonly maxResultBytes: number;
    /** Host logger for storage failures. */
    readonly warn: (message: string) => void;
}
/**
 * Build the route handler for {@link WORKBENCH_SKILL_CARD_RESULT_PATH}.
 * @param options - store, fence, budget, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export declare function createWorkbenchSkillCardResultHandler(options: WorkbenchSkillCardResultRouteOptions): (request: IncomingMessage, response: ServerResponse) => void;
/** Everything the catalog route needs. */
export interface WorkbenchSkillCardCatalogRouteOptions {
    /** Session-scoped catalog reader. */
    readonly runner: WorkbenchSkillCardRunner;
    /** Trust fence applied first. */
    readonly fence: SkillCardRouteFence;
    /** Host logger for upstream failures. */
    readonly warn: (message: string) => void;
}
/** Everything the run route needs. */
export interface WorkbenchSkillCardRunRouteOptions {
    /** Run owner. */
    readonly runner: WorkbenchSkillCardRunner;
    /** Trust fence applied first. */
    readonly fence: SkillCardRouteFence;
    /** Host logger for rejected run bodies. */
    readonly warn: (message: string) => void;
}
/**
 * Build the route handler for the session-scoped skill catalog.
 * @param options - runner, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export declare function createWorkbenchSkillCardCatalogHandler(options: WorkbenchSkillCardCatalogRouteOptions): (request: IncomingMessage, response: ServerResponse) => void;
/**
 * Build the route handler for run control: start, poll, and cancel.
 * @param options - runner, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export declare function createWorkbenchSkillCardRunHandler(options: WorkbenchSkillCardRunRouteOptions): (request: IncomingMessage, response: ServerResponse) => void;
