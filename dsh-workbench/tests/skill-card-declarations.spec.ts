/** @vitest-environment jsdom */
/**
 * Where one action declaration goes, and what writing it must not disturb.
 *
 * The insertion is the whole contract of the builder: a line appended in the wrong
 * place is either erased by the next run or makes a document the analyser refuses, and
 * both look like "the button did nothing".
 */

import { describe, expect, it } from 'vitest'
import { analyzeTemplate } from '../src/client/skill-card/template.ts'
import { declarationLine, insertDeclaration } from '../src/client/skill-card/declarations.ts'
import { templateSkeleton } from '../src/client/skill-card/skeleton.ts'
import { zh } from '../src/client/locales.ts'
import type { WorkbenchLocaleKey } from '../src/client/locales.ts'

/**
 * Translate with the Chinese dictionary.
 * @param key - dictionary key.
 * @returns the Chinese text.
 */
const t = (key: WorkbenchLocaleKey): string => zh[key]

/** A document with one declared target, the region below it. */
const DECLARED = [
  '<h1>Tasks</h1>',
  '<!-- dsh-actions',
  '  a: card "A"',
  '-->',
  '<!-- template-begin -->',
  '<!-- template-end -->',
].join('\n')

describe('declaration lines', () => {
  it('writes the grammar the analyser reads back', () => {
    expect(declarationLine('finish', { kind: 'card', name: '任务' })).toBe('finish: card "任务"')
    expect(declarationLine('run', { kind: 'skill', name: 'task-finish' })).toBe('run: skill "task-finish"')
    const document = DECLARED.replace('a: card "A"', declarationLine('run', { kind: 'skill', name: 'x' }))
    expect(analyzeTemplate(document).actions).toEqual([{ key: 'run', target: { kind: 'skill', name: 'x' } }])
    expect(analyzeTemplate(document).violations).toEqual([])
  })
})

describe('inserting a declaration', () => {
  it('appends before the closing delimiter, disturbing no other line', () => {
    const inserted = insertDeclaration(DECLARED, declarationLine('b', { kind: 'skill', name: 'x' }))
    expect(inserted.text).toBe([
      '<h1>Tasks</h1>',
      '<!-- dsh-actions',
      '  a: card "A"',
      '  b: skill "x"',
      '-->',
      '<!-- template-begin -->',
      '<!-- template-end -->',
    ].join('\n'))
    // Every original line survives byte for byte.
    expect(inserted.text.split('\n').slice(0, 3)).toEqual(DECLARED.split('\n').slice(0, 3))
    expect(analyzeTemplate(inserted.text).actions).toHaveLength(2)
    expect(analyzeTemplate(inserted.text).violations).toEqual([])
  })

  it('creates the block before the region when the template has none', () => {
    const bare = ['<h1>Tasks</h1>', '<!-- template-begin -->', '<!-- template-end -->'].join('\n')
    const inserted = insertDeclaration(bare, declarationLine('a', { kind: 'card', name: 'A' }))
    expect(inserted.text).toBe([
      '<h1>Tasks</h1>',
      '<!-- dsh-actions',
      '  a: card "A"',
      '-->',
      '<!-- template-begin -->',
      '<!-- template-end -->',
    ].join('\n'))
    // Outside the region: a block inside it would be overwritten by the first run.
    const analysis = analyzeTemplate(inserted.text)
    expect(analysis.violations).toEqual([])
    expect(analysis.region?.start).toBeGreaterThan(inserted.text.indexOf('<!-- dsh-actions'))
  })

  it('appends at the end of a document that has neither block nor region', () => {
    const inserted = insertDeclaration('<p>a</p>', declarationLine('a', { kind: 'card', name: 'A' }))
    expect(inserted.text).toBe([
      '<p>a</p>',
      '<!-- dsh-actions',
      '  a: card "A"',
      '-->',
    ].join('\n'))
    expect(analyzeTemplate(inserted.text).actions).toHaveLength(1)
  })

  it('keeps a block written on one line readable', () => {
    // Both sides of the splice need their own line: a declaration sharing a line with
    // the opening marker is legal but reads as if the marker had eaten it.
    const oneLine = ['<!-- dsh-actions a: card "A" -->', '<!-- template-begin -->', '<!-- template-end -->'].join('\n')
    const inserted = insertDeclaration(oneLine, declarationLine('b', { kind: 'card', name: 'B' }))
    expect(inserted.text).toContain('b: card "B"')
    expect(analyzeTemplate(inserted.text).actions.map(declaration => declaration.key)).toEqual(['a', 'b'])
    expect(analyzeTemplate(inserted.text).violations).toEqual([])
  })

  it('keeps the block at the indentation it had, and lines its entries up under it', () => {
    // Splicing from the marker rather than the line start left the old leading
    // whitespace in front of the new one, which put the delimiter at a different depth
    // from the entries it introduces. The block keeps its own indent; the entries sit
    // one level deeper.
    const indented = ['<div>', '    <!-- dsh-actions', '        a: card "A"', '    -->', '</div>'].join('\n')
    const inserted = insertDeclaration(indented, declarationLine('b', { kind: 'card', name: 'B' }))
    expect(inserted.text).toBe([
      '<div>',
      '    <!-- dsh-actions',
      '      a: card "A"',
      '      b: card "B"',
      '    -->',
      '</div>',
    ].join('\n'))
  })

  it('reports where the written line begins, so the editor can reveal it', () => {
    const inserted = insertDeclaration(DECLARED, declarationLine('b', { kind: 'card', name: 'B' }))
    expect(inserted.text.slice(inserted.lineStart, inserted.lineStart + '  b: card "B"'.length))
      .toBe('  b: card "B"')
    const created = insertDeclaration('<p>a</p>', declarationLine('a', { kind: 'card', name: 'A' }))
    expect(created.text.slice(created.lineStart, created.lineStart + '  a: card "A"'.length))
      .toBe('  a: card "A"')
  })

  it('adds to the skeleton the editor writes for an empty template', () => {
    const inserted = insertDeclaration(templateSkeleton(t), declarationLine('finish', { kind: 'skill', name: 'x' }))
    expect(analyzeTemplate(inserted.text).actions).toEqual([{ key: 'finish', target: { kind: 'skill', name: 'x' } }])
    expect(analyzeTemplate(inserted.text).violations).toEqual([])
  })

  it('keeps every existing declaration when it rewrites the block', () => {
    // A block that already carried a blank line used to keep it, so each addition drifted
    // further from the format while the declarations still parsed. The block is
    // machine-managed, so it is re-emitted whole; the declarations are what must survive.
    const messy = [
      '<div>',
      '  <!-- dsh-actions',
      '        a: card "A"',
      '',
      '        b: skill "B"',
      '    -->',
      '</div>',
    ].join('\n')
    const inserted = insertDeclaration(messy, declarationLine('c', { kind: 'card', name: 'C' }))
    expect(analyzeTemplate(inserted.text).actions.map(action => action.key)).toEqual(['a', 'b', 'c'])
    // The blank line inside the block is gone: entries sit one per line.
    expect(inserted.text).not.toMatch(/\n\s*\n\s+[a-z]+:/u)
  })

  it('does not drift further with each insertion', () => {
    const once = insertDeclaration('<!-- dsh-actions\n-->\n', declarationLine('a', { kind: 'card', name: 'A' }))
    const twice = insertDeclaration(once.text, declarationLine('b', { kind: 'card', name: 'B' }))
    expect(twice.text).toBe('<!-- dsh-actions\n  a: card "A"\n  b: card "B"\n-->\n')
  })
})
