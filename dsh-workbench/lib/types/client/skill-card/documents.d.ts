/**
 * The binding a card document's own script receives, and the one read it exists for.
 *
 * A template is the user's HTML, and its script is the user's code: that code runs when the
 * card renders. What it cannot do is reach the filesystem, because a page has no such API —
 * so the two questions a document reader asks ("what is in this directory", "what does this
 * file say") are answered through the Host's document route, and the Markdown those files
 * hold is rendered with the application's own renderer.
 *
 * Both halves are deliberately small: three functions a template author can learn from one
 * example, and no general bridge to the page or the Host.
 * @module dsh-workbench/client/skill-card/documents
 */
import type { WorkbenchLocaleKey } from '../locales.ts';
import type { WorkbenchScriptBinder } from './render.ts';
export { parseListing, parseText } from './files-wire.ts';
import type { WorkbenchFileErrorCode } from '../../skill-card-contract.ts';
/** Fetch seam so tests can drive the route without a server. */
export type DocumentFetch = (input: string, init?: RequestInit) => Promise<Response>;
/** What the binder needs from its owner. */
export interface WorkbenchDocumentBinderOptions {
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey) => string;
    /** Transport; defaults to `globalThis.fetch`. */
    readonly fetcher?: DocumentFetch;
}
/**
 * One failure a document read reported, as the script sees it.
 *
 * An Error rather than a result object, because the script that asks is ordinary code writing
 * `try`/`catch`: a rejection it can catch is the shape it already knows.
 */
export declare class WorkbenchDocumentError extends Error {
    readonly code: WorkbenchFileErrorCode | 'unreachable';
    /**
     * @param code - the route's failure code.
     * @param message - the sentence to show.
     */
    constructor(code: WorkbenchFileErrorCode | 'unreachable', message: string);
}
/**
 * Build the binder the renderer hands each document's script.
 * @param options - translator and transport seam.
 * @returns the binder.
 */
export declare function createWorkbenchDocumentBinder(options: WorkbenchDocumentBinderOptions): WorkbenchScriptBinder;
