/**
 * The product has no dialog primitive, so the one this plugin needs is here: a panel
 * portalled to `document.body` rather than rendered in place, because a page lives inside
 * whatever scroll container and stacking context the shell gave its slot, and a
 * `position: fixed` element inside a transformed ancestor is positioned against that
 * ancestor instead of the window.
 *
 * What a dialog owes the keyboard is not decoration: Escape closes it, Tab stays inside it,
 * opening it moves focus in, and closing it returns focus to the control that opened it. The
 * backdrop closes on a click, and only on the backdrop itself — a mousedown that started
 * inside the panel and ended on the overlay is a select-drag, not a dismissal.
 *
 * Two panels are built on it: the form that writes a sentence (`PromptDialog`) and the
 * preview that shows a card's template (`TemplatePreviewDialog`). They differ in width and
 * in what sits under the body, so the shell keeps only what the keyboard contract needs.
 * @module dsh-workbench/client/skill-card/Dialog
 */
import { type ReactNode } from 'react';
/** How wide the panel is: a form fits in a column, a document needs the window. */
export type DialogSize = 'form' | 'wide';
/** What the shell is made of: its copy, its one way out, and the body between them. */
export interface DialogProps {
    /** The panel's heading, which is also its accessible name. */
    readonly title: string;
    /** One line under the heading, saying what the panel is showing. */
    readonly hint?: string | undefined;
    /** The accessible name of the corner close button. */
    readonly closeLabel: string;
    /** Which width the panel takes. Defaults to a form's column. */
    readonly size?: DialogSize | undefined;
    /** Whether the panel covers work that cannot be submitted at all. */
    readonly busy?: boolean | undefined;
    /** The controls along the bottom, when the panel has any. */
    readonly footer?: ReactNode;
    /** Dismiss the dialog; also what Escape and the backdrop do. */
    readonly onClose: () => void;
    /** The body: a form, or a document. */
    readonly children: ReactNode;
}
/**
 * Render the dialog over the page.
 * @param props - the copy, the size, the way out, and the body.
 * @returns the dialog, portalled to the document body.
 */
export declare function Dialog({ title, hint, closeLabel, size, busy, footer, onClose, children, }: DialogProps): ReactNode;
