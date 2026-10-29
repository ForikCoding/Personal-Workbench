/**
 * The documents a card wrote, as the card's own template script reads them.
 *
 * A page has no filesystem, so a card that wants to list and open the files a run produced
 * asks the Host. This module is that one read: list a directory, read a text file, both
 * confined to the card's own workspace directory and bounded in size and entry count.
 *
 * Every failure is a {@link WorkbenchFileError} carrying a code the route reports and the
 * client renders, because a card has to show "this directory is not inside the card's
 * folder" beside the list it could not draw rather than replacing itself with an error.
 * @module dsh-workbench/skill-card-files
 */
import type { WorkbenchFileErrorCode, WorkbenchFilesListing, WorkbenchFilesText } from './skill-card-contract.ts';
/** Why one document read was refused, in the route's own vocabulary. */
export declare class WorkbenchFileError extends Error {
    readonly code: WorkbenchFileErrorCode;
    /**
     * @param code - the code the route reports and the client renders.
     * @param message - an operator-facing reason; never echoes the request path.
     */
    constructor(code: WorkbenchFileErrorCode, message: string);
}
/** What the document service reads from its owner. */
export interface WorkbenchFilesOptions {
    /**
     * The stored workspace directory of one card.
     * @param cardId - the card.
     * @returns its absolute directory path, or undefined when it has none.
     */
    readonly workspaceOf: (cardId: string) => string | undefined;
}
/**
 * List one directory inside a card's workspace.
 * @param options - the workspace lookup.
 * @param cardId - the card whose documents are being read.
 * @param requested - directory path relative to the workspace, absolute, or empty for the workspace itself.
 * @returns its direct entries, directories first.
 * @throws {WorkbenchFileError} when the path is outside the workspace or is not a directory.
 */
export declare function listCardDirectory(options: WorkbenchFilesOptions, cardId: string, requested: string): Promise<WorkbenchFilesListing>;
/**
 * Read one text file inside a card's workspace.
 * @param options - the workspace lookup.
 * @param cardId - the card whose documents are being read.
 * @param requested - file path relative to the workspace, or absolute.
 * @returns its decoded text and size.
 * @throws {WorkbenchFileError} when the path is outside the workspace, is not a regular
 * file, is too large, or does not hold text.
 */
export declare function readCardFile(options: WorkbenchFilesOptions, cardId: string, requested: string): Promise<WorkbenchFilesText>;
