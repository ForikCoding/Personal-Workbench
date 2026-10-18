/**
 * The line-and-indent arithmetic both HTML editors share.
 *
 * Two editors write HTML in this feature — the template document and a stored result's
 * region — and they have to answer the same keystrokes the same way. Two copies of the
 * arithmetic would drift, and the drift would show up as "Tab indents in one box and
 * selects text in the other".
 * @module dsh-workbench/client/skill-card/text-editing
 */
/** Two spaces, the indent an HTML document or fragment is written with here. */
export declare const INDENT = "  ";
/**
 * Height of one rendered line, in pixels.
 *
 * The gutter and the text area both set it in CSS. A text area cannot scroll to a
 * character offset, so this is the only bridge between a line index and a scroll
 * position; it has to match the two `line-height` declarations exactly.
 */
export declare const LINE_HEIGHT = 18;
/** Where one line sits in a text. */
export interface LineBounds {
    /** First character of the line, which is also its indentation. */
    readonly start: number;
    /** One past its last character, excluding the terminating newline. */
    readonly end: number;
}
/** The text after one indent operation, and the selection that belongs with it. */
export interface IndentEdit {
    /** The whole text after the edit. */
    readonly text: string;
    /** First character the caret or selection should cover. */
    readonly start: number;
    /** One past the last character it should cover. */
    readonly end: number;
}
/**
 * Count the line a character offset falls on.
 * @param text - the text.
 * @param offset - a character offset within it.
 * @returns the zero-based line index.
 */
export declare function lineIndexAt(text: string, offset: number): number;
/**
 * Bound the text of one line, without its terminating newline.
 * @param text - the text.
 * @param line - zero-based line index.
 * @returns the line's first character and the one past its last, both clamped.
 */
export declare function lineBounds(text: string, line: number): LineBounds;
/**
 * Indent or outdent the lines a selection covers.
 *
 * Line-wise when the selection spans lines, so a whole block moves together; a bare caret
 * inserts at the cursor instead of rewriting its line.
 *
 * Returning undefined rather than an unchanged edit is deliberate: an outdent with nothing
 * to remove must not touch the text, or the caller's undo history grows a no-op step.
 * @param text - the whole text.
 * @param selectionStart - caret position, or the start of the selection.
 * @param selectionEnd - one past the end of the selection.
 * @param outdent - whether to remove one level instead of adding one.
 * @returns the edit to apply, or undefined when there is nothing to do.
 */
export declare function indentBlock(text: string, selectionStart: number, selectionEnd: number, outdent: boolean): IndentEdit | undefined;
