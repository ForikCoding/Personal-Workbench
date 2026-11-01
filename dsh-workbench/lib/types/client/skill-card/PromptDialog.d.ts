/**
 * A modal form, over the whole window, for the sentences a card or a result is changed with:
 * one line saying what submitting will do, the field, and the two ways out.
 *
 * The shell — the portal, the overlay, Escape, the Tab trap, and focus going back to the
 * control that opened it — is {@link Dialog}'s. This file is the form: the two buttons, and
 * the refusal that appears under the field when the Host would not take what was written.
 * @module dsh-workbench/client/skill-card/PromptDialog
 */
import type { ReactNode } from 'react';
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
