/** What the outline reads out of a template, and what it deliberately does not. */

import { describe, expect, it } from 'vitest'
import { foldRows, foldableNodes, outline } from '../src/client/skill-card/template-outline.ts'

/**
 * Join lines into a document.
 * @param lines - the document's lines.
 * @returns one string.
 */
function doc(...lines: readonly string[]): string {
  return lines.join('\n')
}

describe('template outline', () => {
  it('names the blocks by their line, their end, and how deep they sit', () => {
    const text = doc(
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <style>a { color: red }</style>',
      '</head>',
      '<body>',
      '  <div class="task-board">',
      '    <p>one</p>',
      '  </div>',
      '</body>',
      '</html>',
    )
    const nodes = outline(text)
    const html = nodes.find(node => node.tag === 'html')
    const body = nodes.find(node => node.tag === 'body')
    const board = nodes.find(node => node.tag === 'div')
    expect(html).toMatchObject({ line: 1, endLine: 10, depth: 0 })
    expect(body).toMatchObject({ line: 5, endLine: 9, depth: 1 })
    expect(board).toMatchObject({ line: 6, endLine: 8, depth: 2 })
    expect(board?.label).toBe('<div class="task-board">')
  })

  it('reads a style block as one block, not as the tags inside it', () => {
    // A child selector and a JavaScript comparison both start with `<` and both would open
    // an element that never closes, hiding everything after them.
    const text = doc(
      '<style>',
      '  div > span { color: red }',
      '  p { width: 1px }',
      '</style>',
      '<body>',
      '<script>',
      '  if (a < b) { run() }',
      '</script>',
      '</body>',
    )
    const nodes = outline(text)
    expect(nodes.map(node => node.tag)).toEqual(['style', 'body', 'script'])
    expect(nodes[0]).toMatchObject({ line: 0, endLine: 3 })
    expect(nodes[1]).toMatchObject({ line: 4, endLine: 8 })
    expect(nodes[2]).toMatchObject({ line: 5, endLine: 7 })
  })

  it('ignores comments, elements that cannot hold content, and self-closing tags', () => {
    const text = doc(
      '<!-- <div class="ghost"> -->',
      '<body>',
      '  <img src="a.png">',
      '  <br/>',
      '  <input type="text">',
      '  <span>leaf</span>',
      '</body>',
    )
    const nodes = outline(text)
    expect(nodes.map(node => node.tag)).toEqual(['body', 'span'])
  })

  it('answers for a document that is still being typed', () => {
    const text = doc('<body>', '  <div class="open">', '    <p>text')
    expect(() => outline(text)).not.toThrow()
    const board = outline(text).find(node => node.tag === 'div')
    // An unclosed element ends on its own line: it is not foldable, and it does not
    // swallow the elements opened after it.
    expect(board).toMatchObject({ line: 1, endLine: 1 })
    expect(foldableNodes(outline(text))).toEqual([])
  })

  it('does not offer a block that is one line long', () => {
    const text = doc(
      '<body>',
      '  <table>',
      '    <tr><td>one</td></tr>',
      '    <tr><td>two</td></tr>',
      '  </table>',
      '</body>',
    )
    // A row that is one line is not a block, so a table of them folds as a table rather than
    // as three hundred rows.
    expect(foldableNodes(outline(text)).map(node => node.tag)).toEqual(['body', 'table'])
  })

  it('replaces a folded block with the line that opened it and counts what it hides', () => {
    const text = doc('<body>', '  <div class="a">', '    <p>one</p>', '    <p>two</p>', '  </div>', '</body>')
    const nodes = outline(text)
    const div = nodes.find(node => node.tag === 'div')
    expect(div).toBeDefined()
    const closed = new Set([div?.id ?? 0])
    const rows = foldRows(text, nodes, closed)
    // A folded block is one line: its opening tag, and everything through its end tag goes.
    // What is left is the line before it and the line after it.
    expect(rows.map(row => row.number)).toEqual([1, 2, 6])
    expect(rows[1]?.closed).toBe(3)
    expect(foldRows(text, nodes, new Set()).map(row => row.number)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('folds the outer block when one line opens two', () => {
    const text = doc('<div class="a"><table>', '  <tr><td>x</td></tr>', '</table></div>')
    const nodes = outline(text)
    const div = nodes.find(node => node.tag === 'div')
    const rows = foldRows(text, nodes, new Set([div?.id ?? 0]))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.closed).toBe(2)
  })
})
