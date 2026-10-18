/**
 * Shadow-root host for one rendered card document.
 *
 * The host element sits in the ordinary tree, so the card keeps its place in the
 * grid, while the document renders inside a shadow root where its styles cannot
 * reach the rest of the application.
 *
 * Clicks arrive here rather than on the buttons themselves: the document is rebuilt on
 * every run, so a listener bound to a button would be gone the second time. The host
 * element outlives the content, which makes it the only stable place to listen.
 * @module dsh-workbench/client/skill-card/ShadowHtml
 */
import { type ReactNode } from 'react';
import type { WorkbenchActionEvent } from './render.ts';
/** Props of the shadow-root host. */
export interface ShadowHtmlProps {
    /** The complete document to render. */
    readonly html: string;
    /** Class applied to the host element. */
    readonly className?: string | undefined;
    /**
     * Called when a button in the document carries an action.
     *
     * Omitted means the document is inert: every click inside it does nothing.
     * @param event - the action the click resolved to, or why it could not be read.
     */
    readonly onAction?: ((event: WorkbenchActionEvent) => void) | undefined;
}
/**
 * Render one document inside a shadow root and observe its actions.
 * @param props - the document, the host class, and the action handler.
 * @returns the host element.
 */
export declare function ShadowHtml({ html, className, onAction }: ShadowHtmlProps): ReactNode;
