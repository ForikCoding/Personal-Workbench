/**
 * Starting a card's run, from the card itself.
 *
 * A run used to start from a bar on the card's own page: an input and a button above the
 * history, where the history is what the page is for. Starting a run is an action *on* a
 * card — the grid is where the cards are — so the control lives on the card's face, and the
 * sentence a run may need is written in a dialog. Nothing on the card's page starts a run any
 * more; the page reads the history, and a run in flight is stopped from its own row there.
 *
 * The dialog is the same one the result page opens for 从头跑: `RunPrompt`, here rather than in
 * the pages module so the face (which renders inside a grid cell) does not have to import a
 * page to start something.
 * @module dsh-workbench/client/skill-card/CardRun
 */
import { type ReactNode } from 'react';
import type { WorkbenchCardActions, WorkbenchCardView } from './controller.ts';
import type { WorkbenchLocaleKey } from '../locales.ts';
/** Rows the revision field grows to before it scrolls instead. */
export declare const COMPOSER_MAX_ROWS = 4;
/**
 * Read one card's unsent instruction back.
 *
 * A draft rather than a stored value: it belongs to the dialog the user left, and a card's
 * next run should not inherit a sentence left behind hours ago. Session storage rather than
 * memory because the face that opens the dialog and the page that shows the result are
 * separate mounts — a half-written ask would otherwise be dropped by looking at something.
 * @param cardId - the card whose draft is read.
 * @returns the draft, or an empty string when none was kept or storage is unavailable.
 */
export declare function readDraft(cardId: string): string;
/**
 * Keep or clear one card's unsent instruction.
 * @param cardId - the card whose draft is written.
 * @param text - the draft; an empty string clears it.
 */
export declare function writeDraft(cardId: string, text: string): void;
/**
 * The field a sentence is written into: one line grown to what it holds.
 *
 * Shared by every dialog a sentence is written in, because the two are the same field around
 * two different forms. What a dialog changes is only when Enter sends: in a dialog the dialog
 * *is* the form, so a bare Enter sends and Shift+Enter is the newline.
 * @param props - the text, its placeholder, and how Enter behaves.
 * @returns the field.
 */
export declare function InstructionField({ value, onChange, placeholder, ariaLabel, rows, disabled, className, submitOn, onSubmit, focus, }: {
    readonly value: string;
    readonly onChange: (next: string) => void;
    readonly placeholder: string;
    readonly ariaLabel: string;
    /** The fallback height, for a field that cannot measure itself. */
    readonly rows: number;
    readonly disabled?: boolean | undefined;
    /** The box the field is drawn in; each dialog brings its own. */
    readonly className?: string | undefined;
    readonly submitOn: 'enter' | 'modifier';
    readonly onSubmit: () => void;
    /** Whether the caret starts here, which is what a dialog exists to be typed in is for. */
    readonly focus?: boolean | undefined;
}): ReactNode;
/**
 * The instructions this card was recently given, offered back as chips.
 *
 * A shortcut for the common case — the same ask again, with a small edit — so a click refills
 * the field rather than starting anything.
 * @param props - the recent asks and what a click does with one.
 * @returns the chips, or nothing when this card has no history.
 */
export declare function InstructionChips({ recent, t, onPick, }: {
    readonly recent: readonly string[];
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
    readonly onPick: (instruction: string) => void;
}): ReactNode;
/**
 * The dialog a run's instruction is written in, for a card that takes one.
 *
 * A card whose skill takes no instruction never opens this: the run starts from its face, and
 * a dialog over a form with nothing in it would be a question with no answer.
 * @param props - the card, the mode, the recent asks, and the two ways out.
 * @returns the dialog.
 */
export declare function RunPrompt({ cardId, title, mode, recent, t, disabled, onRun, onCancel, }: {
    readonly cardId: string;
    /** The panel's heading: what this particular run is, in the words of the control that opened it. */
    readonly title: string;
    /** The card's instruction mode; `none` never reaches this dialog. */
    readonly mode: 'optional' | 'required';
    readonly recent: readonly string[];
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
    readonly disabled: boolean;
    readonly onRun: (instruction: string) => void;
    readonly onCancel: () => void;
}): ReactNode;
/**
 * The run control on a card's face.
 *
 * One control, three readings. A card that takes no instruction runs on the press; a card that
 * takes one opens the dialog to ask for it; and while this card's own run is in flight the
 * control is that run's stop, because the grid is where the user pressed the thing that
 * started it and the card's page has no run control at all. A card that cannot run is closed
 * rather than pressable-and-silent, and its face already says why.
 * @param props - the card's view, its actions, and the translator.
 * @returns the control, and the dialog when it is open.
 */
export declare function CardRunButton({ cardId, view, actions, t, }: {
    readonly cardId: string;
    readonly view: WorkbenchCardView;
    readonly actions: WorkbenchCardActions;
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
}): ReactNode;
