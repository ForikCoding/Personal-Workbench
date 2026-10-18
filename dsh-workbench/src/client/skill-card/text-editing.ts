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
export const INDENT = '  '

/**
 * Height of one rendered line, in pixels.
 *
 * The gutter and the text area both set it in CSS. A text area cannot scroll to a
 * character offset, so this is the only bridge between a line index and a scroll
 * position; it has to match the two `line-height` declarations exactly.
 */
export const LINE_HEIGHT = 18

/** Where one line sits in a text. */
export interface LineBounds {
  /** First character of the line, which is also its indentation. */
  readonly start: number
  /** One past its last character, excluding the terminating newline. */
  readonly end: number
}

/** The text after one indent operation, and the selection that belongs with it. */
export interface IndentEdit {
  /** The whole text after the edit. */
  readonly text: string
  /** First character the caret or selection should cover. */
  readonly start: number
  /** One past the last character it should cover. */
  readonly end: number
}

/**
 * Count the line a character offset falls on.
 * @param text - the text.
 * @param offset - a character offset within it.
 * @returns the zero-based line index.
 */
export function lineIndexAt(text: string, offset: number): number {
  const limit = Math.min(offset, text.length)
  let line = 0
  for (let index = 0; index < limit; index += 1) {
    if (text.charAt(index) === '\n') line += 1
  }
  return line
}

/**
 * Bound the text of one line, without its terminating newline.
 * @param text - the text.
 * @param line - zero-based line index.
 * @returns the line's first character and the one past its last, both clamped.
 */
export function lineBounds(text: string, line: number): LineBounds {
  let start = 0
  for (let index = 0; index < line; index += 1) {
    const next = text.indexOf('\n', start)
    if (next < 0) return { start: text.length, end: text.length }
    start = next + 1
  }
  const stop = text.indexOf('\n', start)
  return { start, end: stop < 0 ? text.length : stop }
}

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
export function indentBlock(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  outdent: boolean,
): IndentEdit | undefined {
  const block = text.slice(selectionStart, selectionEnd)
  if (!block.includes('\n')) {
    if (outdent) {
      // With a bare caret the indentation to remove sits immediately before it, not at
      // the start of the line: `<p>  a` with the caret after the spaces.
      const before = text.slice(0, selectionStart)
      const trimmed = before.replace(/ {1,2}$/u, '')
      const removed = before.length - trimmed.length
      if (removed === 0) return undefined
      const caret = selectionStart - removed
      return { text: `${trimmed}${text.slice(selectionEnd)}`, start: caret, end: caret }
    }
    const caret = selectionStart + INDENT.length
    return {
      text: `${text.slice(0, selectionStart)}${INDENT}${text.slice(selectionEnd)}`,
      start: caret,
      end: caret,
    }
  }
  // A selection spanning lines moves whole: every covered line gains or loses one level,
  // so a block keeps its relative shape.
  const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1
  const covered = text.slice(lineStart, selectionEnd)
  const rewritten = covered
    .split('\n')
    .map(line => outdent ? line.replace(/^ {1,2}/u, '') : `${INDENT}${line}`)
    .join('\n')
  return {
    text: `${text.slice(0, lineStart)}${rewritten}${text.slice(selectionEnd)}`,
    start: lineStart,
    end: selectionEnd + rewritten.length - covered.length,
  }
}
