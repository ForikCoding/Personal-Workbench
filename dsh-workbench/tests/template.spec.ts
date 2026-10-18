/** @vitest-environment jsdom */
/**
 * The template analyser: one region, and nothing the card must not carry.
 *
 * The grammar this file used to pin — placeholders, loops, field names — is gone. What
 * remains is the pair of questions a template still has to answer.
 */

import { describe, expect, it } from 'vitest'
import { analyzeFragment, analyzeTemplate, findRegion } from '../src/client/skill-card/template.ts'
import type { WorkbenchTemplateViolationCode } from '../src/client/skill-card/template.ts'

/**
 * The codes one document is refused for.
 * @param html - the template.
 * @returns its violation codes.
 */
function codes(html: string): readonly WorkbenchTemplateViolationCode[] {
  return analyzeTemplate(html).violations.map(violation => violation.code)
}

const WRAPPED = [
  '<style>body { color: red; }</style>',
  '<h1>今日任务</h1>',
  '<!-- template-begin -->',
  '<tr><td>a</td></tr>',
  '<!-- template-end -->',
].join('\n')

describe('workbench template analyser', () => {
  describe('region', () => {
    it('finds the content between the markers', () => {
      const analysis = analyzeTemplate(WRAPPED)
      expect(analysis.violations).toEqual([])
      const region = analysis.region
      expect(region).toBeDefined()
      expect(WRAPPED.slice(region?.start, region?.end).trim()).toBe('<tr><td>a</td></tr>')
    })

    it('accepts markers without inner padding', () => {
      expect(findRegion('<!--template-begin-->x<!--template-end-->')).toEqual({
        start: '<!--template-begin-->'.length,
        end: '<!--template-begin-->x'.length,
      })
    })

    it('refuses a template with no markers', () => {
      // One region is the whole language, so a document without one has nothing to fill.
      expect(codes('<p>hello</p>')).toEqual(['region-missing'])
      expect(findRegion('<p>hello</p>')).toBeUndefined()
    })

    it('refuses an unclosed region', () => {
      expect(codes('<!-- template-begin --><p>a</p>')).toEqual(['region-unclosed'])
    })

    it('refuses a closing marker with no opening one', () => {
      expect(codes('<p>a</p><!-- template-end -->')).toEqual(['region-unclosed'])
    })

    it('refuses more than one pair', () => {
      const html = '<!-- template-begin -->a<!-- template-end --><!-- template-begin -->b<!-- template-end -->'
      expect(codes(html)).toEqual(['region-repeated'])
    })

    it('refuses a closing marker that precedes its opening one', () => {
      expect(codes('<!-- template-end -->a<!-- template-begin -->')).toEqual(['region-unclosed'])
    })

    it('keeps the comments inside the region, because they are the instruction', () => {
      const html = '<!-- template-begin -->\n<!-- 每行一个任务 -->\n<tr></tr>\n<!-- template-end -->'
      const region = findRegion(html)
      expect(html.slice(region?.start, region?.end)).toContain('<!-- 每行一个任务 -->')
    })
  })

  describe('the removed placeholder language', () => {
    it('names a template still written in it', () => {
      // Silently rendering the braces would read as "my template works" until the card
      // showed literal `{{branch}}` text.
      expect(codes('<!-- template-begin --><td>{{branch}}</td><!-- template-end -->'))
        .toContain('placeholder-syntax')
      const bare = analyzeTemplate('{{branch}}')
      expect(bare.violations.map(violation => violation.code)).toEqual(['region-missing', 'placeholder-syntax'])
      expect(bare.violations.find(violation => violation.code === 'placeholder-syntax')?.token).toBe('{{branch}}')
    })

    it('leaves single braces alone', () => {
      expect(codes('<!-- template-begin --><td>{a}</td><!-- template-end -->')).toEqual([])
    })
  })

  describe('content policy', () => {
    it('refuses a script element and stops descending into it', () => {
      const html = '<!-- template-begin --><div><script>alert(1)</script></div><!-- template-end -->'
      expect(codes(html)).toEqual(['script'])
    })

    it('refuses an event attribute', () => {
      const html = '<!-- template-begin --><button onclick="go()">x</button><!-- template-end -->'
      expect(codes(html)).toEqual(['event-attribute'])
    })

    it('refuses an element that would load over the network', () => {
      const html = '<!-- template-begin --><img src="a.png"><iframe></iframe><!-- template-end -->'
      expect(codes(html)).toEqual(['external-element', 'external-element'])
    })

    it('refuses an unsafe URL scheme', () => {
      const html = '<!-- template-begin --><a href="javascript:go()">x</a><!-- template-end -->'
      expect(codes(html)).toEqual(['unsafe-url'])
    })

    it('refuses a stylesheet that reaches outward', () => {
      const html = '<!-- template-begin --><style>@import url(a.css);</style><!-- template-end -->'
      expect(codes(html)).toEqual(['external-css'])
    })

    it('allows the stylesheet a real template carries', () => {
      // The card's own document is mostly CSS; a rule that refused it would refuse
      // every template worth writing.
      expect(codes(WRAPPED)).toEqual([])
    })

    it('locates the violation so the user can find it', () => {
      const html = '<!-- template-begin --><div><span onclick="x()">a</span></div><!-- template-end -->'
      expect(analyzeTemplate(html).violations[0]?.location).toBe('root > div > span')
    })
  })

  describe('action declarations', () => {
    /**
     * Wrap one declaration block in a template whose region is elsewhere.
     * @param block - the comment block body.
     * @returns the template.
     */
    function withActions(block: string): string {
      return [
        `<!-- dsh-actions\n${block}\n-->`,
        '<!-- template-begin -->',
        '<tr></tr>',
        '<!-- template-end -->',
      ].join('\n')
    }

    it('reads one card target and one skill target', () => {
      const analysis = analyzeTemplate(withActions('  start:  card  "启动任务"\n  finish: skill "task-finish"'))
      expect(analysis.violations).toEqual([])
      expect(analysis.actions).toEqual([
        { key: 'start', target: { kind: 'card', name: '启动任务' } },
        { key: 'finish', target: { kind: 'skill', name: 'task-finish' } },
      ])
    })

    it('declares nothing when the template has no block', () => {
      // A template with no buttons is the normal case, not a violation.
      const analysis = analyzeTemplate('<!-- template-begin --><p>a</p><!-- template-end -->')
      expect(analysis.actions).toEqual([])
      expect(analysis.violations).toEqual([])
    })

    it('ignores blank lines and comments inside the block', () => {
      const analysis = analyzeTemplate(withActions('# 这一行是说明\n\n  start: card "A"\n'))
      expect(analysis.actions).toHaveLength(1)
      expect(analysis.violations).toEqual([])
    })

    it('refuses a second block', () => {
      const html = [
        '<!-- dsh-actions\n  a: card "A"\n-->',
        '<!-- dsh-actions\n  b: card "B"\n-->',
        '<!-- template-begin --><tr></tr><!-- template-end -->',
      ].join('\n')
      expect(codes(html)).toContain('action-declaration-duplicate')
    })

    it('refuses a key outside the grammar', () => {
      for (const key of ['中文键', 'a{b', 'a}b']) {
        expect(codes(withActions(`  ${key}: card "A"`))).toContain('action-key-invalid')
      }
    })

    it('refuses the same key twice', () => {
      expect(codes(withActions('  a: card "A"\n  a: skill "B"'))).toContain('action-key-repeated')
    })

    it('refuses an unknown target kind, a missing name, and an overlong name', () => {
      expect(codes(withActions('  a: board "A"'))).toContain('action-target-invalid')
      expect(codes(withActions('  a: card ""'))).toContain('action-target-invalid')
      expect(codes(withActions(`  a: card "${'x'.repeat(61)}"`))).toContain('action-target-invalid')
    })

    it('refuses a block written inside the region', () => {
      // The region is rewritten on every run, so a declaration inside it survives
      // exactly until the first run — which reads to the user as "it worked once".
      const html = [
        '<!-- template-begin -->',
        '<!-- dsh-actions\n  a: card "A"\n-->',
        '<!-- template-end -->',
      ].join('\n')
      expect(codes(html)).toContain('actions-inside-region')
    })

    it('keeps the declared keys that survived a rejected line', () => {
      // One bad line must not discard the whole block: the rest is still usable and the
      // editor points at the offending line.
      const analysis = analyzeTemplate(withActions('  a: card "A"\n  bad line here\n  b: skill "B"'))
      expect(analysis.actions.map(item => item.key)).toEqual(['a', 'b'])
      expect(analysis.violations.map(item => item.code)).toEqual(['action-target-invalid'])
    })
  })

  describe('violation offsets', () => {
    /**
     * Wrap one declaration block in a template whose region is elsewhere.
     * @param block - the comment block body.
     * @returns the template.
     */
    function withBlock(block: string): string {
      return [
        `<!-- dsh-actions\n${block}\n-->`,
        '<!-- template-begin -->',
        '<tr></tr>',
        '<!-- template-end -->',
      ].join('\n')
    }

    /**
     * The offset one code was reported at.
     * @param html - the template.
     * @param code - the code to look for.
     * @returns its offset, when it carries one.
     */
    function offsetOf(html: string, code: WorkbenchTemplateViolationCode): number | undefined {
      return analyzeTemplate(html).violations.find(violation => violation.code === code)?.offset
    }

    it('points an unclosed region at the marker that stands alone', () => {
      const opening = '<!-- template-begin --><p>a</p>'
      expect(offsetOf(opening, 'region-unclosed')).toBe(opening.indexOf('<!-- template-begin -->'))
      const closing = '<p>a</p><!-- template-end -->'
      expect(offsetOf(closing, 'region-unclosed')).toBe(closing.indexOf('<!-- template-end -->'))
    })

    it('points a repeated region at the marker that repeats', () => {
      const html = '<!-- template-begin -->a<!-- template-end --><!-- template-begin -->b<!-- template-end -->'
      expect(offsetOf(html, 'region-repeated')).toBe(html.indexOf('<!-- template-begin -->', 1))
    })

    it('points the removed placeholder syntax at its own match', () => {
      const html = '<p>{{branch}}</p>'
      expect(offsetOf(html, 'placeholder-syntax')).toBe(html.indexOf('{{branch}}'))
    })

    it('points a declaration block written inside the region at the block', () => {
      const html = [
        '<!-- template-begin -->',
        '<!-- dsh-actions\n  a: card "A"\n-->',
        '<!-- template-end -->',
      ].join('\n')
      expect(offsetOf(html, 'actions-inside-region')).toBe(html.indexOf('<!-- dsh-actions'))
    })

    it('points a bad declaration line at that place in the text, not at a line number', () => {
      // The offset is what the editor selects, so it has to be an index into the
      // document; a line number would put the caret in the wrong place.
      const html = withBlock('  a: card "A"\n  bad line here\n  b: skill "B"')
      expect(offsetOf(html, 'action-target-invalid')).toBe(html.indexOf('bad line here'))
    })

    it('points a repeated key at the second declaration', () => {
      const html = withBlock('  a: card "A"\n  a: skill "B"')
      const offset = offsetOf(html, 'action-key-repeated')
      expect(offset).toBeDefined()
      expect(html.startsWith('a: skill "B"', offset)).toBe(true)
    })

    it('points a second declaration block at that block', () => {
      const html = [
        '<!-- dsh-actions\n  a: card "A"\n-->',
        '<!-- dsh-actions\n  b: card "B"\n-->',
        '<!-- template-begin --><tr></tr><!-- template-end -->',
      ].join('\n')
      expect(offsetOf(html, 'action-declaration-duplicate')).toBe(html.indexOf('<!-- dsh-actions', 1))
    })

    it('approximates a content-policy position at the first tag of that kind', () => {
      // A parsed DOM carries no source spans, so the position is an anchor on the
      // right line rather than a claim about the offending node: both <img> reports
      // land on the first one, which is the documented approximation.
      const html = '<!-- template-begin --><img src="a"><div><img src="b"></div><!-- template-end -->'
      const offsets = analyzeTemplate(html).violations.map(violation => violation.offset)
      expect(offsets).toEqual([html.indexOf('<img'), html.indexOf('<img')])
      expect(offsetOf('<script>alert(1)</script>', 'script')).toBe(0)
    })

    it('approximates an attribute violation at the element carrying it', () => {
      const html = '<!-- template-begin --><button onclick="go()">x</button><!-- template-end -->'
      expect(offsetOf(html, 'event-attribute')).toBe(html.indexOf('<button'))
    })
  })
})

describe('the fragment analyser', () => {
  // The result editor edits a *region fragment*, which is not a document: it has no region
  // markers and declares no actions. Reporting document-level refusals against it would
  // block an edit for syntax that does not apply to a fragment at all.
  it('reports nothing document-level about a plain fragment', () => {
    expect(analyzeFragment('<tr><td>a</td></tr>')).toEqual([])
  })

  it('reports the five content-policy codes and only those', () => {
    const cases: readonly { readonly html: string; readonly code: string }[] = [
      { html: '<script>alert(1)</script>', code: 'script' },
      { html: '<b onclick="x()">a</b>', code: 'event-attribute' },
      { html: '<a href="javascript:void(0)">a</a>', code: 'unsafe-url' },
      { html: '<iframe src="x"></iframe>', code: 'external-element' },
      { html: '<div style="background: url(x.png)">a</div>', code: 'external-css' },
    ]
    for (const item of cases) {
      expect(analyzeFragment(item.html).map(violation => violation.code), item.code)
        .toEqual([item.code])
    }
  })

  it('carries a path and an approximate position, which is what the editor shows', () => {
    const fragment = '<div><script>alert(1)</script></div>'
    expect(analyzeFragment(fragment)).toEqual([{
      code: 'script',
      location: 'root > div > script',
      token: 'script',
      offset: fragment.indexOf('<script'),
    }])
  })
})
