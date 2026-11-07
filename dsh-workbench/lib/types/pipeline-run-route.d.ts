/**
 * The workbench's private pipeline-execution route.
 *
 * Same fence and same two-sided validation as the pipeline definitions: the caller is a
 * browser across a process boundary, so this half validates what it is handed before the
 * service sees it. Reads answer with every pipeline's records at once — the panel shows one
 * pipeline at a time but knows which pipelines exist, so filtering here would mean a request
 * per pipeline picked off a menu.
 * @module dsh-workbench/pipeline-run-route
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LayoutRouteFence } from './layout-route.ts';
import type { WorkbenchPipelineRunService } from './pipeline-run-service.ts';
/** Everything the route handler needs. */
export interface WorkbenchPipelineRunRouteOptions {
    /** Execution read/append service. */
    readonly service: WorkbenchPipelineRunService;
    /** Trust fence applied first. */
    readonly fence: LayoutRouteFence;
    /** Host logger for storage failures. */
    readonly warn: (message: string) => void;
}
/**
 * Build the route handler for {@link import('./pipeline-contract.ts').WORKBENCH_PIPELINE_RUN_PATH}.
 * @param options - service, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export declare function createWorkbenchPipelineRunHandler(options: WorkbenchPipelineRunRouteOptions): (request: IncomingMessage, response: ServerResponse) => void;
