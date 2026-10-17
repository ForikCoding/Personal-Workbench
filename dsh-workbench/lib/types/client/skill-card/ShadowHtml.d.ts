/**
 * Shadow-root host for one rendered card document.
 *
 * The host element sits in the ordinary tree, so the card keeps its place in the
 * grid, while the document renders inside a shadow root where its styles cannot
 * reach the rest of the application.
 * @module dsh-workbench/client/skill-card/ShadowHtml
 */
import { type ReactNode } from 'react';
/** Props of the shadow-root host. */
export interface ShadowHtmlProps {
    /** The complete document to render. */
    readonly html: string;
    /** Class applied to the host element. */
    readonly className?: string | undefined;
}
/**
 * Render one document inside a shadow root.
 * @param props - the document and the host class.
 * @returns the host element.
 */
export declare function ShadowHtml({ html, className }: ShadowHtmlProps): ReactNode;
