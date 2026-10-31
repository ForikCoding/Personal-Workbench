/**
 * A modal form, over the whole window, for the sentences a result is changed with.
 *
 * The product has no dialog primitive, so the one this page needs is here: a panel portalled
 * to `document.body` rather than rendered in place, because the page lives inside whatever
 * scroll container and stacking context the shell gave its slot, and a `position: fixed`
 * element inside a transformed ancestor is positioned against that ancestor instead of the
 * window.
 *
 * What a dialog owes the keyboard is not decoration: Escape closes it, Tab stays inside it,
 * opening it puts the caret where the writing goes, and closing it returns focus to the
 * control that opened it. The backdrop closes on a click, and only on the backdrop itself —
 * a mousedown that started inside the panel and ended on the overlay is a select-drag, not a
 * dismissal.
 * @module dsh-workbench/client/skill-card/PromptDialog
 */
import { type ReactNode } from 'react';
/** What the dialog is made of: its copy, its two ways out, and the form between them. */
export interface PromptDialogProps {
    /** The panel's heading, which is also its accessible name. */
    readonly title: string;
    /** One line under the heading, saying what submitting will do. */
    readonly hint?: string | undefined;
    /** The label of the control that submits the form. */
    readonly submitLabel: string;
    /** Whether that control is closed, for a form whose field is still empty. */
    readonly submitDisabled?: boolean | undefined;
    /** The label of the control that dismisses the dialog. */
    readonly cancelLabel: string;
    /** The accessible name of the corner close button. */
    readonly closeLabel: string;
    /** A refusal stated inside the dialog, under its form. */
    readonly problem?: string | undefined;
    /** Whether the dialog covers a form that cannot be submitted at all. */
    readonly busy?: boolean | undefined;
    readonly onCancel: () => void;
    readonly onSubmit: () => void;
    /** The form: a field, and whatever else belongs beside it. */
    readonly children: ReactNode;
}
/**
 * Render the dialog over the page.
 * @param props - the copy, the two ways out, and the form.
 * @returns the dialog, portalled to the document body.
 */
export declare function PromptDialog({ title, hint, submitLabel, submitDisabled, cancelLabel, closeLabel, problem, busy, onCancel, onSubmit, children, }: PromptDialogProps): ReactNode;
