/** @vitest-environment jsdom */
/**
 * Splicing a run's HTML into its template, and cleaning the result.
 *
 * The cleaning is the point of interest now: the fragment came from a model that read
 * the template, the skill, and whatever the skill's tools returned, so a construct can
 * reach the document that no template ever held.
 */

import { describe, expect, it } from 'vitest'
import {
  WORKBENCH_RESULT_HEADLINE_MAX_LENGTH,
  documentText,
  filledTemplate,
  renderTemplate,
  resultHeadline,
  resultHtml,
} from '../src/client/skill-card/render.ts'

/**
 * Render one document and hand back the shadow root.
 * @param html - the complete document.
 * @returns the shadow root the document was rendered into.
 */
function rendered(html: string): ShadowRoot {
  const host = document.createElement('div')
  document.body.append(host)
  const root = host.attachShadow({ mode: 'open' })
  renderTemplate(root, html)
  return root
}

const TEMPLATE = [
  '<style>.task { color: red; }</style>',
  '<h1>今日任务</h1>',
  '<table><tbody>',
  '<!-- template-begin -->',
  '<!-- 每行一个任务 -->',
  '<!-- template-end -->',
  '</tbody></table>',
  '<p>共 0 条</p>',
].join('\n')

describe('workbench skill card render', () => {
  describe('reading a result', () => {
    it('reads the HTML a result carries', () => {
      expect(resultHtml({ html: '<tr><td>a</td></tr>' })).toBe('<tr><td>a</td></tr>')
    })

    it('refuses everything that is not HTML', () => {
      // A result stored before the region language existed carries named values
      // instead, and there is nothing in it to show.
      for (const value of [undefined, null, 'text', 7, [], {}, { html: 7 }, { html: '' }, { html: '   ' }]) {
        expect(resultHtml(value)).toBeUndefined()
      }
    })
  })

  describe('naming a run by its headline', () => {
    it('takes the first paragraph as the first line, not the run whole', () => {
      expect(resultHeadline('<p>第一句。</p><p>第二句。</p>')).toBe('第一句。')
    })

    it('treats an explicit newline as a line break too', () => {
      expect(resultHeadline('第一行。\n第二行。')).toBe('第一行。')
    })

    it('skips an identifier that opens the document', () => {
      // The case the list was failing: five runs of one task all previewed their task
      // number, so the history read as five copies of one row.
      expect(resultHeadline('<p>T202610223746</p><p>登录改造任务分析</p>'))
        .toBe('登录改造任务分析')
    })

    it('prefers a marked summary over any line and over the first heading', () => {
      const html = '<h1>开发任务分析</h1>'
        + '<p>T202610223746</p>'
        + '<p data-dsh-summary="">集中度校验口径调整</p>'
      expect(resultHeadline(html)).toBe('集中度校验口径调整')
    })

    it('prefers the first heading when no summary is marked', () => {
      expect(resultHeadline('<p>T202610223746</p><h2>质押回购委托</h2>')).toBe('质押回购委托')
    })

    it('still says something for a document that is only an identifier', () => {
      // Nothing better exists, and the row needs a line: the number is the run's content.
      expect(resultHeadline('<p>T202610223746</p>')).toBe('T202610223746')
    })

    it('truncates one long line at the budget with an ellipsis', () => {
      const long = '字'.repeat(WORKBENCH_RESULT_HEADLINE_MAX_LENGTH + 10)
      const headline = resultHeadline(`<p>${long}</p>`)
      expect(headline?.length).toBe(WORKBENCH_RESULT_HEADLINE_MAX_LENGTH + 1)
      expect(headline?.endsWith('…')).toBe(true)
    })

    it('has no headline for a fragment with no visible text', () => {
      for (const html of ['<b></b>', '<br>', '   ', '']) {
        expect(resultHeadline(html)).toBeUndefined()
      }
    })
  })

  describe('reducing a document to text', () => {
    it('keeps every paragraph, one block per line', () => {
      const text = documentText('<h1>任务分析</h1><p>业务背景：改登录。</p><p>影响：登录页。</p>')
      expect(text).toBe(['任务分析', '业务背景：改登录。', '影响：登录页。'].join('\n'))
    })

    it('drops markup, styles, and comments, keeping only visible prose', () => {
      const text = documentText(
        '<style>.x{color:red}</style><!-- dsh-actions start: card "详细设计" -->'
          + '<button data-dsh-action="start">下一步</button><p>正文。</p>',
      )
      // The button is inline, so its label runs into the paragraph; what is gone is the
      // stylesheet text and the action comment.
      expect(text).toBe('下一步正文。')
    })

    it('folds consecutive blank lines and strips line indent', () => {
      const text = documentText('<div>a</div>\n\n\n<div>b</div>')
      expect(text).toBe('a\n\nb')
    })

    it('returns an empty string when there is no visible text', () => {
      expect(documentText('<style>.x{color:red}</style>')).toBe('')
      expect(documentText('')).toBe('')
    })
  })

  describe('splicing', () => {
    it('replaces the region and leaves the skeleton exactly as written', () => {
      // This is what the design rests on: the model never authors the styles or the
      // headings, so they cannot drift between runs.
      const filled = filledTemplate(TEMPLATE, '<tr><td>a</td></tr>')
      expect(filled).toContain('<style>.task { color: red; }</style>')
      expect(filled).toContain('<h1>今日任务</h1>')
      expect(filled).toContain('<p>共 0 条</p>')
      expect(filled).toContain('<tr><td>a</td></tr>')
      expect(filled).not.toContain('<!-- 每行一个任务 -->')
      expect(filled.slice(0, filled.indexOf('<!-- template-begin -->')))
        .toBe(TEMPLATE.slice(0, TEMPLATE.indexOf('<!-- template-begin -->')))
    })

    it('returns the template unchanged when it has no region', () => {
      expect(filledTemplate('<p>a</p>', 'ignored')).toBe('<p>a</p>')
    })
  })

  describe('rendering', () => {
    it('shows the whole document, comments and all', () => {
      const root = rendered(filledTemplate(TEMPLATE, '<!-- 每行一个任务 -->\n<tr><td>a</td></tr>'))
      expect(root.querySelector('h1')?.textContent).toBe('今日任务')
      expect(root.querySelector('tr td')?.textContent).toBe('a')
      expect(root.querySelector('style')?.textContent).toContain('color: red')
    })

    it('replaces the previous content on re-render', () => {
      const host = document.createElement('div')
      document.body.append(host)
      const root = host.attachShadow({ mode: 'open' })
      renderTemplate(root, '<p>first</p>')
      renderTemplate(root, '<p>second</p>')
      expect(root.textContent).toBe('second')
    })
  })

  describe('cleaning what a model may have authored', () => {
    it('removes a script element the fragment brought in', () => {
      const root = rendered(filledTemplate(TEMPLATE, '<div><script>alert(1)</script>kept</div>'))
      expect(root.querySelector('script')).toBeNull()
      expect(root.textContent).toContain('kept')
    })

    it('removes an event attribute but keeps the element', () => {
      const root = rendered(filledTemplate(TEMPLATE, '<button onclick="go()">启动</button>'))
      expect(root.querySelector('button')?.getAttribute('onclick')).toBeNull()
      expect(root.querySelector('button')?.textContent).toBe('启动')
    })

    it('removes an element that would load over the network', () => {
      const root = rendered(filledTemplate(TEMPLATE, '<img src="a.png">'))
      expect(root.querySelector('img')).toBeNull()
    })

    it('removes a stylesheet that reaches outward, whole', () => {
      // Removing only the reference would leave a half-applied sheet behind.
      const root = rendered(filledTemplate(TEMPLATE, '<style>@import url(a.css); .x { color: blue; }</style>'))
      expect(root.querySelectorAll('style')).toHaveLength(1)
      expect(root.querySelector('style')?.textContent).toContain('color: red')
    })

    it('keeps the template’s own stylesheet when the fragment carries an external one', () => {
      const root = rendered(filledTemplate(TEMPLATE, '<style>@import url(a.css);</style>'))
      expect(root.querySelector('style')?.textContent).toContain('color: red')
    })
  })
})
