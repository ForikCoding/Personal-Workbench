/**
 * One template's container elements, by line.
 *
 * A template is three or four hundred lines of markup whose shape is small: a head, a style
 * block, a body holding a handful of nested boxes, a script. Reading it top to bottom with
 * nothing but a scrollbar means holding that shape in your head while you look through it, so
 * the shape is derived here instead — once, purely, from the text — and the fold view is built
 * from it.
 *
 * This is not an HTML parser. It walks tags, not a tree, because the only questions asked of
 * it are "where does this block start and end on which line" and "what is it called", and
 * because a template is user-edited text that may be half-typed: the scanner has to answer
 * for a document with an unclosed `<div` rather than refuse it.
 * @module dsh-workbench/client/skill-card/template-outline
 */
/** One element, as the outline knows it. */
export interface OutlineNode {
    /** Position in the outline, which is stable for a given text and is the fold's identity. */
    readonly id: number;
    /** Lower-case tag name. */
    readonly tag: string;
    /** What the element is called in a list: `<div class="task-board">`. */
    readonly label: string;
    /** Zero-based line the opening tag is on. */
    readonly line: number;
    /** Zero-based line the matching end tag is on, or the opening line while it is unclosed. */
    readonly endLine: number;
    /** How many elements enclose this one; zero for the outermost. */
    readonly depth: number;
}
/** One visible row of the fold view. */
export interface FoldRow {
    /** Zero-based line of the source. */
    readonly line: number;
    /** One-based number shown beside the row. */
    readonly number: number;
    /** The line's text, exactly as stored. */
    readonly text: string;
    /** The block that starts on this line, when one does and it can fold. */
    readonly node: OutlineNode | undefined;
    /** How many lines this row hides; zero when the row is not folded. */
    readonly closed: number;
}
/**
 * Read one template's container elements.
 *
 * Nesting is answered from a stack, so an element that never closes does not swallow the
 * rest of the document: it ends on its own line and the elements after it are still found.
 * @param text - the template source.
 * @returns every opening element, in document order.
 */
export declare function outline(text: string): readonly OutlineNode[];
/**
 * The blocks of one outline: the elements whose content spans at least two lines.
 * @param nodes - an outline.
 * @returns the foldable nodes, in document order.
 */
export declare function foldableNodes(nodes: readonly OutlineNode[]): readonly OutlineNode[];
/**
 * Lay one template out as rows, with folded blocks replaced by their opening line.
 * @param text - the template source.
 * @param nodes - its outline.
 * @param folded - the ids of the blocks that are folded.
 * @returns one row per visible line, in document order.
 */
export declare function foldRows(text: string, nodes: readonly OutlineNode[], folded: ReadonlySet<number>): readonly FoldRow[];
