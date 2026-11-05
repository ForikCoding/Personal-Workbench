/**
 * The workbench's private pipeline route.
 *
 * Same fence and same two-sided validation as the layout route: the caller is a browser
 * across a process boundary, so this half validates what it reads before the service
 * sees it.
 * @module dsh-workbench/pipeline-route
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LayoutRouteFence } from './layout-route.ts';
import type { WorkbenchPipelineService } from './pipeline-service.ts';
/** Everything the route handler needs. */
export interface WorkbenchPipelineRouteOptions {
    /** Pipeline read/write service. */
    readonly service: WorkbenchPipelineService;
    /** Trust fence applied first. */
    readonly fence: LayoutRouteFence;
    /** Host logger for storage failures. */
    readonly warn: (message: string) => void;
}
/**
 * Build the route handler for {@link import('./pipeline-contract.ts').WORKBENCH_PIPELINE_PATH}.
 * @param options - service, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export declare function createWorkbenchPipelineHandler(options: WorkbenchPipelineRouteOptions): (request: IncomingMessage, response: ServerResponse) => void;
