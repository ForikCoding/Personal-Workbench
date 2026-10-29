/**
 * Turn one stored result into the document a card shows.
 *
 * A template is a whole document whose skeleton stays exactly as the user wrote it; the
 * marked region is the only part a child agent authors. So the region's HTML is spliced
 * into the raw template text and the assembled document is cleaned once, here.
 *
 * The cleaning is load-bearing rather than a backstop now: the fragment came from a
 * model, which read the template, the skill, and whatever the skill's tools returned.
 * @module dsh-workbench/client/skill-card/render
 */
import type { WorkbenchFilesListing, WorkbenchFilesText } from '../../skill-card-contract.ts';
/**
 * What one click on a child-authored button turned into.
 *
 * `invalid` is a first-class outcome, not an exception: a payload that cannot be read
 * whole must stop the click, never fall back to whatever could be read. A missing
 * payload is its own reason, and it keeps the key: the controller answers one by
 * carrying the card's own document to the target instead of refusing the whole ask.
 */
export type WorkbenchActionEvent = {
    readonly kind: 'action';
    readonly key: string;
    /** That row's raw fields, exactly as the child reported them. */
    readonly payload: Record<string, unknown>;
} | {
    readonly kind: 'invalid';
    readonly reason: 'missing-payload';
    /** The action the button still means; needed to carry the document on. */
    readonly key: string;
} | {
    readonly kind: 'invalid';
    readonly reason: 'missing-action' | 'malformed-payload' | 'oversized-payload';
};
/**
 * Read one clicked button's action and payload.
 *
 * The order is the contract: size, then JSON, then shape, then key. A payload that
 * breaks any step refuses the whole click, because a partially-read payload would make
 * the confirmed parameters and the executed parameters two different things.
 * @param element - the element that carries the action attributes.
 * @returns the action, or why it cannot be used.
 */
export declare function readActionEvent(element: Element): WorkbenchActionEvent;
/**
 * Read the HTML one stored result carries.
 * @param value - the result's structured value.
 * @returns the HTML, or undefined when the value carries none — including a result
 * stored by a build that filled named values instead of a region.
 */
export declare function resultHtml(value: unknown): string | undefined;
/**
 * Longest visible headline one run-history row shows, in code points.
 *
 * A row is one line in a list the user scans, so the headline is a preview, not the
 * document: 120 characters names the run's content without turning the list into the
 * result page.
 */
export declare const WORKBENCH_RESULT_HEADLINE_MAX_LENGTH = 120;
/**
 * The visible text of one document, block boundaries as line breaks.
 *
 * The payload a button carries to another card when it has no row of its own: the target
 * reads the source card's content, not its markup — a child that received the HTML
 * would have to pick prose out of tags. The whole document is what the user is looking
 * at, so nothing is truncated; consecutive blank lines fold to one, and each line's
 * leading whitespace is dropped.
 * @param html - a complete document, or a region fragment; either cleans the same way.
 * @returns the visible text, or an empty string when the browser refuses the markup.
 */
export declare function documentText(html: string): string;
/**
 * The one line a run-history row shows as that run's content.
 *
 * The first visible line is not always the content: a generated document frequently opens
 * with its subject's identifier, so seven runs of one task each preview "T202610223746"
 * and the list reads as seven copies of one row. A marked summary — an element carrying
 * `data-dsh-summary` — wins, then the first heading, then the first line that is not an
 * identifier alone, and only then an identifier, because a row with something to say
 * always says it before falling back to a number.
 * @param html - the region HTML a stored result carries.
 * @returns the headline, truncated, or undefined when the fragment is all markup.
 */
export declare function resultHeadline(html: string): string | undefined;
/**
 * Splice one result's HTML into its template's region.
 * @param template - the template as stored.
 * @param html - the region content the result carries.
 * @returns the document to render; the template unchanged when it has no region.
 */
export declare function filledTemplate(template: string, html: string): string;
/**
 * Remove the script elements one region fragment carries.
 *
 * The region is model-authored on every run, so a script in it is text a language model
 * wrote — refused here as well as by the analyser, because a stored result can reach the
 * screen without passing the editor that would have refused it. The template's own script is
 * untouched: it is outside the region, so it is not in this string.
 * @param html - the region fragment.
 * @returns the fragment with its scripts removed.
 */
export declare function withoutScripts(html: string): string;
/**
 * What one document's own script is given while it runs.
 *
 * Supplied by the card: the script is the template author's code, so it runs as the page runs
 * — but it has no way of its own to read the directory a run wrote into, which is the whole
 * reason this exists.
 */
export interface WorkbenchScriptBinding {
    /** The card the document belongs to. */
    readonly cardId: string;
    /** The run the document shows, when it shows one. */
    readonly runId?: string | undefined;
    /** The root the document was rendered into. */
    readonly root: ShadowRoot;
    /** The element that root belongs to. */
    readonly host: Element;
    /** The card's documents, read through the Host. */
    readonly files: {
        /**
         * List one directory of the card's workspace.
         * @param path - path relative to the workspace, or absolute; empty names the workspace.
         * @returns the listing.
         */
        list(path: string): Promise<WorkbenchFilesListing>;
        /**
         * Read one text file of the card's workspace.
         * @param path - path relative to the workspace, or absolute.
         * @returns the file's text and size.
         */
        read(path: string): Promise<WorkbenchFilesText>;
    };
    /** Rendering one Markdown document into an element of the card's own tree. */
    readonly markdown: {
        /**
         * Render Markdown into one element.
         * @param element - the element to fill; it must be inside this document.
         * @param text - the Markdown source.
         */
        render(element: Element, text: string): Promise<void>;
    };
}
/**
 * How one document's scripts are supplied with their binding.
 *
 * The card builds one binding per rendered document, so a script's `dsh` names the card it
 * was rendered in and not whichever card rendered last.
 */
export type WorkbenchScriptBinder = (input: {
    readonly cardId: string;
    readonly runId?: string | undefined;
    readonly root: ShadowRoot;
    readonly host: Element;
}) => WorkbenchScriptBinding;
/** What one render needs to run the document's own scripts. */
export interface WorkbenchRenderRuntime {
    /** The card the document belongs to. */
    readonly cardId: string;
    /** The run it shows, when it shows one. */
    readonly runId?: string | undefined;
    /** Builds the binding each script sees. */
    readonly bind: WorkbenchScriptBinder;
}
/**
 * Wrap one script's source so it receives its binding as a parameter.
 *
 * A parameter rather than a global lookup inside the script: the callbacks a script registers
 * outlive the render, and one that read the global later would read whatever the next
 * document published there.
 * @param source - the script as the template wrote it.
 * @returns the source to hand the element.
 */
export declare function bindDocumentScript(source: string): string;
/**
 * Render one document into a shadow root.
 *
 * The document is parsed inert, its scripts taken out, its forbidden constructs stripped, and
 * the rest adopted into the root. Only then are the scripts re-created and appended: a script
 * element that is inserted by the parser never runs, so running the template's code means
 * building a second element for it — which is also where the binding is attached.
 * @param root - the shadow root to fill; its previous children are replaced.
 * @param html - the complete document.
 * @param runtime - the card identity and binding factory; absent runs the document with no
 * binding, which is what a preview outside a card does.
 */
export declare function renderTemplate(root: ShadowRoot, html: string, runtime?: WorkbenchRenderRuntime): void;
