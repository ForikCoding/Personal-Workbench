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
import type { WorkbenchActionTarget } from '../../skill-card-contract.ts';
/** One insertion: the rewritten document, and where the new line begins in it. */
export interface DeclarationInsertion {
    /** The whole document after the insertion. */
    readonly text: string;
    /** Index of the first character of the inserted line, so the editor can reveal it. */
    readonly lineStart: number;
}
/**
 * Write one declaration line.
 * @param key - the action key a button will carry.
 * @param target - what that key resolves to.
 * @returns the line, exactly as the analyser reads it back.
 */
export declare function declarationLine(key: string, target: WorkbenchActionTarget): string;
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
export declare function insertDeclaration(text: string, line: string): DeclarationInsertion;
