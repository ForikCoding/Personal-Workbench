/** @vitest-environment jsdom */
/**
 * The template analyser: one region, and nothing the card must not carry.
 *
 * The grammar this file used to pin — placeholders, loops, field names — is gone. What
 * remains is the pair of questions a template still has to answer.
 */

import { describe, expect, it } from 'vitest'
import { analyzeTemplate, findRegion } from '../src/client/skill-card/template.ts'
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
})
