/**
 * What a pipeline has to be told before it runs, derived from the cards it arranges.
 *
 * The rule under test is the one the panel and the run share: a value exists because a card's
 * directory names it between braces, and for no other reason. The cases that matter are the ones
 * where a second declaration could creep in — a step that needs nothing, a name two cards share, a
 * token left open — so each is pinned here.
 */

import { describe, expect, it } from 'vitest'
import {
  WORKBENCH_PARAM_VALUE_MAX_LENGTH,
  missingParamValues,
  paramNamesOf,
  paramPartsOf,
  resolveTemplateParams,
  paramValueProblem,
  pipelineParamPlan,
  resolveResultPath,
  resolveTemplatePointer,
} from '../src/pipeline-params.ts'

describe('paramNamesOf', () => {
  it('reads the names a directory states, in order', () => {
    expect(paramNamesOf('{任务编号}/docs/{版本号}/详细设计')).toEqual(['任务编号', '版本号'])
  })

  it('reports a name once however often the path names it', () => {
    expect(paramNamesOf('{任务编号}/out/{任务编号}')).toEqual(['任务编号'])
  })

  it('reads a directory that states nothing as needing nothing', () => {
    expect(paramNamesOf('docs/审查意见')).toEqual([])
    expect(paramNamesOf(undefined)).toEqual([])
    expect(paramNamesOf('')).toEqual([])
  })

  it('leaves a stray brace to the filesystem rather than guessing at it', () => {
    expect(paramNamesOf('docs/{}')).toEqual([])
    expect(paramNamesOf('docs/{a')).toEqual([])
    expect(paramNamesOf('docs/未闭合}')).toEqual([])
  })

  it('does not treat a long braced stretch as a name', () => {
    // Longer than a name may be: it is prose in a path, not a token.
    expect(paramNamesOf(`docs/{${'x'.repeat(21)}}`)).toEqual([])
  })
})

describe('pipelineParamPlan', () => {
  it('asks once for a name two steps share, and names both steps', () => {
    expect(pipelineParamPlan([
      '{任务编号}/docs/需求拆解',
      '{任务编号}/docs/{版本号}/详细设计',
    ])).toEqual([
      { name: '任务编号', steps: [0, 1] },
      { name: '版本号', steps: [1] },
    ])
  })

  it('adds nothing for a step whose card writes no files', () => {
    expect(pipelineParamPlan([
      '{任务编号}/docs/需求拆解',
      undefined,
      'docs/审查意见',
      '{任务编号}/docs/单元测试',
    ])).toEqual([{ name: '任务编号', steps: [0, 3] }])
  })

  it('asks nothing of a pipeline whose cards name nothing', () => {
    expect(pipelineParamPlan(['docs/审查意见', undefined, 'docs/周报'])).toEqual([])
  })

  it('lists a step once even when its own path repeats the name', () => {
    expect(pipelineParamPlan(['{任务编号}/a/{任务编号}'])).toEqual([{ name: '任务编号', steps: [0] }])
  })

  it('orders by first appearance, not by name', () => {
    expect(pipelineParamPlan([undefined, '{b}/{a}', '{c}']).map(entry => entry.name)).toEqual(['b', 'a', 'c'])
  })
})

describe('resolveResultPath', () => {
  it('substitutes every token it holds a value for', () => {
    expect(resolveResultPath('{任务编号}/docs/{版本号}/详细设计', { 任务编号: 'T202608242753-1', 版本号: 'V2.3' }))
      .toBe('T202608242753-1/docs/V2.3/详细设计')
  })

  it('leaves an open token as written, so the path still says what is missing', () => {
    expect(resolveResultPath('{任务编号}/docs/{版本号}', { 任务编号: 'T1' }))
      .toBe('T1/docs/{版本号}')
    expect(resolveResultPath('{任务编号}/docs', {})).toBe('{任务编号}/docs')
  })

  it('treats an empty value as no value rather than as a blank in the path', () => {
    expect(resolveResultPath('{任务编号}/docs', { 任务编号: '' })).toBe('{任务编号}/docs')
  })

  it('passes a path with no tokens through untouched', () => {
    expect(resolveResultPath('docs/审查意见', { 任务编号: 'T1' })).toBe('docs/审查意见')
  })
})

describe('missingParamValues', () => {
  const plan = pipelineParamPlan(['{任务编号}/docs', '{任务编号}/{版本号}'])

  it('reports nothing once every name has a value', () => {
    expect(missingParamValues(plan, { 任务编号: 'T1', 版本号: 'V2.3' })).toEqual([])
  })

  it('reports the open names in plan order', () => {
    expect(missingParamValues(plan, { 版本号: 'V2.3' })).toEqual(['任务编号'])
    expect(missingParamValues(plan, {})).toEqual(['任务编号', '版本号'])
  })

  it('counts whitespace as nothing typed', () => {
    expect(missingParamValues(plan, { 任务编号: '  ', 版本号: 'V1' })).toEqual(['任务编号'])
  })
})

describe('paramValueProblem', () => {
  it('accepts what a directory name takes', () => {
    expect(paramValueProblem('T202608242753-1')).toBeUndefined()
    expect(paramValueProblem('V2.3')).toBeUndefined()
    expect(paramValueProblem('2026-08')).toBeUndefined()
  })

  it('refuses an empty value', () => {
    expect(paramValueProblem('')).toBe('empty')
    expect(paramValueProblem('   ')).toBe('empty')
  })

  it('refuses a separator or a space rather than escaping it', () => {
    expect(paramValueProblem('a/b')).toBe('charset')
    expect(paramValueProblem('V2.3 详细')).toBe('charset')
    expect(paramValueProblem('{x}')).toBe('charset')
  })

  it('refuses a value longer than the contract allows', () => {
    expect(paramValueProblem('x'.repeat(WORKBENCH_PARAM_VALUE_MAX_LENGTH))).toBeUndefined()
    expect(paramValueProblem('x'.repeat(WORKBENCH_PARAM_VALUE_MAX_LENGTH + 1))).toBe('length')
  })
})

describe('paramPartsOf', () => {
  it('cuts a path into its text and its names, in order', () => {
    expect(paramPartsOf('{任务编号}/docs/{版本号}/详细设计')).toEqual([
      { kind: 'name', name: '任务编号' },
      { kind: 'text', text: '/docs/' },
      { kind: 'name', name: '版本号' },
      { kind: 'text', text: '/详细设计' },
    ])
  })

  it('reports a path with no names as one stretch of text', () => {
    expect(paramPartsOf('docs/审查意见')).toEqual([{ kind: 'text', text: 'docs/审查意见' }])
    expect(paramPartsOf('')).toEqual([])
  })

  it('keeps a name that ends the path from being read as text', () => {
    expect(paramPartsOf('docs/{年-月}')).toEqual([
      { kind: 'text', text: 'docs/' },
      { kind: 'name', name: '年-月' },
    ])
  })
})

describe('resolveTemplateParams', () => {
  const template = [
    '<article data-dsh-files="{任务编号}/docs/需求拆解">',
    '  <!-- 指针写在上面：data-dsh-files="{任务编号}/docs/需求拆解" -->',
    '  <style>.a { color: red }</style>',
    '  <script>const a = { 编号: 1 }</script>',
    '</article>',
  ].join('\n')

  it('fills the pointer and leaves every other brace alone', () => {
    const out = resolveTemplateParams(template, { 任务编号: 'T202608242753-1' })
    expect(out).toContain('data-dsh-files="T202608242753-1/docs/需求拆解"')
    expect(out).toContain('.a { color: red }')
    expect(out).toContain('const a = { 编号: 1 }')
  })

  it('leaves the comment that quotes the pointer untouched', () => {
    const out = resolveTemplateParams(template, { 任务编号: 'T1' })
    expect(out).toContain('<!-- 指针写在上面：data-dsh-files="{任务编号}/docs/需求拆解" -->')
  })

  it('leaves an open token in the pointer as written', () => {
    expect(resolveTemplateParams(template, {})).toContain('data-dsh-files="{任务编号}/docs/需求拆解"')
  })

  it('returns a template without a pointer exactly as it came', () => {
    const plain = '<article>没有目录</article>'
    expect(resolveTemplateParams(plain, { 任务编号: 'T1' })).toBe(plain)
  })
})

describe('resolveTemplatePointer', () => {
  const template = [
    '<article data-dsh-files="{任务编号}/docs/分析">',
    '  <!-- 这里写 data-dsh-files="{任务编号}/docs/分析"，说明指针怎么来的 -->',
    '  <div data-dsh-region="body"></div>',
    '</article>',
  ].join('\n')

  it('puts the resolved directory into the pointer', () => {
    const resolved = resolveTemplatePointer(template, 'T202608242753-1/docs/分析')
    // The tag's attribute, named in full: the comment below quotes the same attribute with the
    // token in it, on purpose, so a search for the token anywhere would pass a broken rewrite.
    expect(resolved).toContain('<article data-dsh-files="T202608242753-1/docs/分析">')
  })

  it('leaves the comment that quotes the pointer as it was written', () => {
    // A comment explains the token; rewriting it would make the explanation describe a
    // directory rather than the rule.
    expect(resolveTemplatePointer(template, 'T1/docs/分析')).toContain('{任务编号}/docs/分析"，说明')
  })

  it('changes nothing when there is no directory to state', () => {
    expect(resolveTemplatePointer(template, '')).toBe(template)
  })
})
