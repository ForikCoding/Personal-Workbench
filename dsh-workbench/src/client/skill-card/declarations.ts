/**
 * Where one action declaration goes in a template, and how its line is written.
 *
 * The declaration block is the one part of a document the user cannot discover by
 * looking at the result: a wrong key, or `card` misspelled, renders a perfectly good
 * card that refuses every click. The editor therefore writes the line from choices,
 * and these two operations are what it writes with — kept out of the component so the
 * insertion can be asserted without a DOM.
 * @module dsh-workbench/client/skill-card/declarations
 */

import {
  WORKBENCH_ACTIONS_MARKER,
  WORKBENCH_REGION_BEGIN,
  regionMarkerPattern,
} from '../../skill-card-contract.ts'
import type { WorkbenchActionTarget } from '../../skill-card-contract.ts'
import { findActionsBlock } from './template.ts'

/** The indent a declaration line carries, matching the rest of a written document. */
const DECLARATION_INDENT = '  '

/** The block's opening marker, without its closing delimiter. */
const BLOCK_OPEN = `<!-- ${WORKBENCH_ACTIONS_MARKER}`

/** The block's closing delimiter. A new line is inserted immediately before it. */
const BLOCK_CLOSE = '-->'

/** One insertion: the rewritten document, and where the new line begins in it. */
export interface DeclarationInsertion {
  /** The whole document after the insertion. */
  readonly text: string
  /** Index of the first character of the inserted line, so the editor can reveal it. */
  readonly lineStart: number
}

/**
 * Write one declaration line.
 * @param key - the action key a button will carry.
 * @param target - what that key resolves to.
 * @returns the line, exactly as the analyser reads it back.
 */
export function declarationLine(key: string, target: WorkbenchActionTarget): string {
  return `${key}: ${target.kind} "${target.name}"`
}

/**
 * Insert one declaration line into a document.
 *
 * Only the line is written: an existing block keeps every line it already holds,
 * byte for byte. A template with no block gets one, placed so the analyser cannot
 * mistake it for a declaration written inside the region.
 * @param text - the template as the user has it.
 * @param line - the declaration line, from {@link declarationLine}.
 * @returns the rewritten document and the offset of the inserted line.
 */
export function insertDeclaration(text: string, line: string): DeclarationInsertion {
  const block = findActionsBlock(text)
  if (block !== undefined) {
    // The block is rewritten whole, at the indentation it already had. Splicing only
    // characters kept whatever blank lines and stray indents were there, so each
    // addition drifted further from the format; and replacing from the marker rather
    // than from the line start left the old leading whitespace in front of the new one,
    // which is what put the delimiter at a different depth from its own entries.
    const blockLineStart = text.lastIndexOf('\n', block.start - 1) + 1
    const lead = text.slice(blockLineStart, block.start)
    // Only whitespace may be consumed: a marker sharing a line with markup keeps its
    // position, because the text before it is not ours to delete.
    const aligned = /^[\t ]*$/u.test(lead)
    const indent = aligned ? lead : ''
    const from = aligned ? blockLineStart : block.start
    const body = text.slice(block.start + BLOCK_OPEN.length, block.end - BLOCK_CLOSE.length)
    const entries = body
      .split('\n')
      .map(entry => entry.trim())
      .filter(entry => entry !== '')
    entries.push(line)
    const rewritten = [
      `${indent}${BLOCK_OPEN}`,
      ...entries.map(entry => `${indent}${DECLARATION_INDENT}${entry}`),
      `${indent}${BLOCK_CLOSE}`,
    ].join('\n')
    const inserted = `${indent}${DECLARATION_INDENT}${line}`
    return {
      text: `${text.slice(0, from)}${rewritten}${text.slice(block.end)}`,
      // The last match is the line just appended, even when an identical declaration
      // was already in the block.
      lineStart: from + rewritten.lastIndexOf(inserted),
    }
  }
  const open = regionMarkerPattern(WORKBENCH_REGION_BEGIN).exec(text)
  // A new block goes immediately before the region rather than at the end of the
  // document: the region is rewritten whole on every run, so a block inside it would
  // survive exactly one run, and a region that is missing its closing marker would
  // swallow a block appended after everything the user wrote.
  const at = open?.index ?? text.length
  // The new block takes the indentation of the line it lands on, and its declaration
  // sits one level deeper inside it.
  const indent = indentOf(text, at)
  const openLine = `${indent}${BLOCK_OPEN}`
  const body = `${openLine}\n${indent}${DECLARATION_INDENT}${line}\n${indent}${BLOCK_CLOSE}`
  // The caret belongs on the declaration itself, not on the marker line that was
  // written above it.
  return insertAt(text, at, body, openLine.length + 1)
}

/**
 * Read the leading whitespace of the line an offset starts on.
 *
 * A declaration is indented one level deeper than the marker that opens its block, so
 * a block written inside a document keeps its own indentation instead of jumping to
 * the left margin.
 * @param text - the document.
 * @param at - the offset whose line indent is wanted.
 * @returns the line's leading whitespace, or an empty string when it has none.
 */
function indentOf(text: string, at: number): string {
  const lineStart = text.lastIndexOf('\n', at - 1) + 1
  const lead = text.slice(lineStart, at)
  return /^[\t ]*$/u.test(lead) ? lead : ''
}

/**
 * Splice one run of text into a document at an offset, keeping it on lines of its own.
 *
 * A block may be written on one line (`<!-- dsh-actions a: card "A" -->`), so both
 * sides of the splice are checked: a declaration that shared a line with the marker
 * would still parse, but it would read as if the marker had eaten it.
 * @param text - the document.
 * @param at - the offset to splice at.
 * @param body - the text to insert.
 * @param innerOffset - how far into `body` the reported line begins.
 * @returns the rewritten document and the offset of that line.
 */
function insertAt(text: string, at: number, body: string, innerOffset: number): DeclarationInsertion {
  const before = text.slice(0, at)
  const after = text.slice(at)
  const lead = before === '' || before.endsWith('\n') ? '' : '\n'
  const trail = after === '' || after.startsWith('\n') ? '' : '\n'
  const inserted = `${lead}${body}${trail}`
  return {
    text: `${before}${inserted}${after}`,
    lineStart: at + lead.length + innerOffset,
  }
}
