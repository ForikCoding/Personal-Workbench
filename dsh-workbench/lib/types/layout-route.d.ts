/**
 * The workbench's private layout route.
 *
 * The route is same-origin and fenced by Connection before it touches storage:
 * a request that fails the trust and browser-authentication check never reaches
 * the layout service. Both halves validate the payload, because this is a
 * process boundary and the caller is not a typed same-process consumer.
 * @module dsh-workbench/layout-route
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { WorkbenchLayoutService } from './layout-service.ts';
/** Trust fence this route consults before any business logic. */
export interface LayoutRouteFence {
    /**
     * Apply the deployment's Host/Origin and browser-authentication checks.
     * @param request - the incoming request.
     * @returns the rejection status, or undefined when the route may proceed.
     */
    requestRejection(request: IncomingMessage): 401 | 403 | undefined;
}
/**
 * The Host context shape this plugin injects.
 *
 * `connection` is declared by `@deepseek-ai/dsh-client-connection`'s Host
 * augmentation, which this package does not depend on for types: the route
 * only needs Connection's trust fence, so the member is stated here.
 */
export interface WorkbenchHostContext {
    /** Web carrier that owns route registration. */
    readonly webServer: {
        register(route: {
            kind: 'exact';
            path: string;
            handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;
        }): () => void;
    };
    /** Connection's trust and browser-authentication checks. */
    readonly connection: LayoutRouteFence;
}
/** Everything the route handler needs. */
export interface WorkbenchLayoutRouteOptions {
    /** Layout read/write service. */
    readonly service: WorkbenchLayoutService;
    /** Trust fence applied first. */
    readonly fence: LayoutRouteFence;
    /** Deployment cap on stored records. */
    readonly maxRecords: number;
    /** Host logger for storage failures. */
    readonly warn: (message: string) => void;
}
/**
 * Build the route handler for {@link WORKBENCH_LAYOUT_PATH}.
 * @param options - service, fence, caps, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export declare function createWorkbenchLayoutHandler(options: WorkbenchLayoutRouteOptions): (request: IncomingMessage, response: ServerResponse) => void;
