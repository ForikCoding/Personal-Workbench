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
/**
 * What one click on a child-authored button turned into.
 *
 * `invalid` is a first-class outcome, not an exception: a payload that cannot be read
 * whole must stop the click, never fall back to whatever could be read.
 */
export type WorkbenchActionEvent = {
    readonly kind: 'action';
    readonly key: string;
    /** That row's raw fields, exactly as the child reported them. */
    readonly payload: Record<string, unknown>;
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
 * Splice one result's HTML into its template's region.
 * @param template - the template as stored.
 * @param html - the region content the result carries.
 * @returns the document to render; the template unchanged when it has no region.
 */
export declare function filledTemplate(template: string, html: string): string;
/**
 * Render one document into a shadow root.
 * @param root - the shadow root to fill; its previous children are replaced.
 * @param html - the complete document.
 */
export declare function renderTemplate(root: ShadowRoot, html: string): void;
