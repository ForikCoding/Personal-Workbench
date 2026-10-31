/**
 * One template's container elements, by line.
 *
 * A template is three or four hundred lines of markup whose shape is small: a head, a style
 * block, a body holding a handful of nested boxes, a script. Reading it top to bottom with
 * nothing but a scrollbar means holding that shape in your head while you look for the one
 * box you want, so the shape is derived here instead — once, purely, from the text — and both
 * the jump list and the fold view read it.
 *
 * This is not an HTML parser. It walks tags, not a tree, because the only questions asked of
 * it are "where does this block start and end on which line" and "what is it called", and
 * because a template is user-edited text that may be half-typed: the scanner has to answer
 * for a document with an unclosed `<div` rather than refuse it.
 * @module dsh-workbench/client/skill-card/template-outline
 */

/** Elements that never hold content, so they never fold. */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
])

/**
 * Elements whose content is text rather than markup.
 *
 * A `<` inside them is a character, not a tag: a CSS child selector and a JavaScript
 * comparison both look like an element to a tag scan, and both would open blocks that never
 * close. Their bodies are skipped to the matching end tag instead.
 */
const RAW_TAGS = new Set(['style', 'script', 'pre', 'textarea'])

/** One element, as the outline knows it. */
export interface OutlineNode {
  /** Position in the outline, which is stable for a given text and is the fold's identity. */
  readonly id: number
  /** Lower-case tag name. */
  readonly tag: string
  /** What the element is called in a list: `<div class="task-board">`. */
  readonly label: string
  /** Zero-based line the opening tag is on. */
  readonly line: number
  /** Zero-based line the matching end tag is on, or the opening line while it is unclosed. */
  readonly endLine: number
  /** How many elements enclose this one; zero for the outermost. */
  readonly depth: number
}

/** One visible row of the fold view. */
export interface FoldRow {
  /** Zero-based line of the source. */
  readonly line: number
  /** One-based number shown beside the row. */
  readonly number: number
  /** The line's text, exactly as stored. */
  readonly text: string
  /** The block that starts on this line, when one does and it can fold. */
  readonly node: OutlineNode | undefined
  /** How many lines this row hides; zero when the row is not folded. */
  readonly closed: number
}

/** Match one tag, its attributes, and its self-closing slash. */
const TAG_PATTERN = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/gu

/**
 * Blank out comments, keeping every offset and line break where it was.
 * @param text - the document.
 * @returns the document with comment bodies replaced by spaces.
 */
function maskComments(text: string): string {
  let masked = ''
  let index = 0
  while (index < text.length) {
    if (text.startsWith('<!--', index)) {
      const close = text.indexOf('-->', index + 4)
      const stop = close < 0 ? text.length : close + 3
      // Newlines are kept so the line numbers after a comment stay true.
      masked += text.slice(index, stop).replace(/[^\n]/gu, ' ')
      index = stop
      continue
    }
    masked += text.charAt(index)
    index += 1
  }
  return masked
}

/**
 * Name an element the way a list of blocks wants it named.
 * @param tag - lower-case tag name.
 * @param attributes - the opening tag's attribute text, verbatim.
 * @returns `<tag>`, or `<tag class="first-class">` when the element has one.
 */
function labelOf(tag: string, attributes: string): string {
  const match = /(?:^|\s)(class|id)\s*=\s*(?:"([^"]*)"|'([^']*)')/u.exec(attributes)
  const value = (match?.[2] ?? match?.[3] ?? '').trim()
  if (match === null || value === '') return `<${tag}>`
  const first = value.split(/\s+/u)[0] ?? ''
  const short = first.length > 24 ? `${first.slice(0, 24)}…` : first
  return `<${tag} ${match[1] ?? 'class'}="${short}">`
}

/**
 * Read one template's container elements.
 *
 * Nesting is answered from a stack, so an element that never closes does not swallow the
 * rest of the document: it ends on its own line and the elements after it are still found.
 * @param text - the template source.
 * @returns every opening element, in document order.
 */
export function outline(text: string): readonly OutlineNode[] {
  const masked = maskComments(text)
  const starts = [0]
  for (let index = 0; index < masked.length; index += 1) {
    if (masked.charAt(index) === '\n') starts.push(index + 1)
  }
  /**
   * The line an offset falls on.
   * @param offset - character offset into the document.
   * @returns zero-based line index.
   */
  const lineAt = (offset: number): number => {
    let low = 0
    let high = starts.length - 1
    while (low < high) {
      const middle = Math.ceil((low + high) / 2)
      if ((starts[middle] ?? 0) <= offset) low = middle
      else high = middle - 1
    }
    return low
  }

  const nodes: OutlineNode[] = []
  /** Nodes whose element is open, outermost first, as indexes into `nodes`. */
  const open: number[] = []
  const lower = masked.toLowerCase()

  TAG_PATTERN.lastIndex = 0
  for (let match = TAG_PATTERN.exec(masked); match !== null; match = TAG_PATTERN.exec(masked)) {
    const name = (match[2] ?? '').toLowerCase()
    const closing = match[1] === '/'
    const attributes = match[3] ?? ''
    const selfClosed = match[4] === '/'
    const line = lineAt(match.index)
    if (closing) {
      // Pop to the matching element, tolerating elements left open inside it: the document
      // is user-edited text, and one missing end tag must not hide everything after it.
      let at = -1
      for (let slot = open.length - 1; slot >= 0; slot -= 1) {
        const index = open[slot]
        if (index !== undefined && nodes[index]?.tag === name) { at = slot; break }
      }
      if (at >= 0) {
        for (let slot = open.length - 1; slot >= at; slot -= 1) {
          const index = open[slot]
          const node = index === undefined ? undefined : nodes[index]
          if (index !== undefined && node !== undefined) nodes[index] = { ...node, endLine: line }
        }
        open.length = at
      }
      continue
    }
    if (selfClosed || VOID_TAGS.has(name)) continue
    if (RAW_TAGS.has(name)) {
      // The body is text: skip to the end tag without reading it as markup.
      const close = lower.indexOf(`</${name}`, TAG_PATTERN.lastIndex)
      const endLine = close < 0 ? line : lineAt(close)
      nodes.push({ id: nodes.length, tag: name, label: labelOf(name, attributes), line, endLine, depth: open.length })
      if (close < 0) continue
      TAG_PATTERN.lastIndex = close + name.length + 2
      continue
    }
    nodes.push({ id: nodes.length, tag: name, label: labelOf(name, attributes), line, endLine: line, depth: open.length })
    open.push(nodes.length - 1)
  }
  return nodes
}

/**
 * The blocks of one outline: the elements whose content spans at least two lines.
 * @param nodes - an outline.
 * @returns the foldable nodes, in document order.
 */
export function foldableNodes(nodes: readonly OutlineNode[]): readonly OutlineNode[] {
  return nodes.filter(node => node.endLine > node.line)
}

/**
 * The blocks worth offering as a destination, outer ones first.
 *
 * A template's whole structure is a dozen blocks; the every-`tr` depth of a table is three
 * hundred rows of noise in a list that is meant to be read at a glance, so the depth is
 * capped.
 * @param nodes - an outline.
 * @param limit - how many entries to keep.
 * @returns the blocks to list, in document order.
 */
export function landmarks(nodes: readonly OutlineNode[], limit = 40): readonly OutlineNode[] {
  return foldableNodes(nodes).filter(node => node.depth <= 3).slice(0, limit)
}

/**
 * Lay one template out as rows, with folded blocks replaced by their opening line.
 * @param text - the template source.
 * @param nodes - its outline.
 * @param folded - the ids of the blocks that are folded.
 * @returns one row per visible line, in document order.
 */
export function foldRows(
  text: string,
  nodes: readonly OutlineNode[],
  folded: ReadonlySet<number>,
): readonly FoldRow[] {
  const lines = text.split('\n')
  // A line can open two blocks (`<div><table>`), and the fold belongs to the outer one: it
  // is the one whose end tag closes last, so folding it is what hides the other.
  const starts = new Map<number, OutlineNode>()
  for (const node of foldableNodes(nodes)) {
    const existing = starts.get(node.line)
    if (existing === undefined || node.depth < existing.depth) starts.set(node.line, node)
  }
  const rows: FoldRow[] = []
  let line = 0
  while (line < lines.length) {
    const node = starts.get(line)
    const closed = node !== undefined && folded.has(node.id) ? node.endLine - node.line : 0
    rows.push({ line, number: line + 1, text: lines[line] ?? '', node, closed })
    line = node !== undefined && closed > 0 ? node.endLine + 1 : line + 1
  }
  return rows
}
