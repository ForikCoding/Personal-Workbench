/**
 * Validation for the two bodies the document route answers with.
 *
 * Kept apart from the binder that requests them: the workbench panel lists the same
 * directories through the card API, and a module whose import graph pulls in React would be
 * a strange thing for a data read to depend on. The route is a process boundary, so what it
 * says is input rather than a typed value, and both callers validate it here.
 * @module dsh-workbench/client/skill-card/files-wire
 */
import type { WorkbenchFilesListing, WorkbenchFilesText } from '../../skill-card-contract.ts';
/**
 * Validate one listing body.
 * @param value - the decoded body.
 * @returns the listing, or undefined when a field is outside the contract.
 */
export declare function parseListing(value: unknown): WorkbenchFilesListing | undefined;
/**
 * Validate one file body.
 * @param value - the decoded body.
 * @returns the file, or undefined when a field is outside the contract.
 */
export declare function parseText(value: unknown): WorkbenchFilesText | undefined;
