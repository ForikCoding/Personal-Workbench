/**
 * Route for the documents a card's template script reads.
 *
 * `GET cardId=…&path=…` answers one directory listing or one text file. The route owns the
 * HTTP status of each {@link WorkbenchFileError}; the confinement and the bounds belong to
 * the service, so a path outside the card's workspace is refused there rather than re-checked
 * here.
 * @module dsh-workbench/skill-card-files-route
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { WorkbenchFilesListing, WorkbenchFilesText } from './skill-card-contract.ts';
import { WORKBENCH_SKILL_CARD_API_VERSION } from './skill-card-contract.ts';
import type { WorkbenchFilesOptions } from './skill-card-files.ts';
import type { SkillCardRouteFence } from './skill-card-route.ts';
/** Everything the document route needs. */
export interface WorkbenchFilesRouteOptions extends WorkbenchFilesOptions {
    /** Trust fence applied first. */
    readonly fence: SkillCardRouteFence;
    /** Host logger for a read that failed unexpectedly. */
    readonly warn: (message: string) => void;
}
/** The listing body. */
export interface WorkbenchFilesListingBody extends WorkbenchFilesListing {
    /** Contract version, so a client from another build refuses the body. */
    readonly apiVersion: typeof WORKBENCH_SKILL_CARD_API_VERSION;
    /** Discriminates the two answers this route gives. */
    readonly kind: 'directory';
}
/** The file body. */
export interface WorkbenchFilesTextBody extends WorkbenchFilesText {
    /** Contract version, so a client from another build refuses the body. */
    readonly apiVersion: typeof WORKBENCH_SKILL_CARD_API_VERSION;
    /** Discriminates the two answers this route gives. */
    readonly kind: 'file';
}
/**
 * Build the route handler for {@link WORKBENCH_SKILL_CARD_FILES_PATH}.
 * @param options - workspace lookup, fence, and logger.
 * @returns a handler that owns the full response lifecycle.
 */
export declare function createWorkbenchSkillCardFilesHandler(options: WorkbenchFilesRouteOptions): (request: IncomingMessage, response: ServerResponse) => void;
