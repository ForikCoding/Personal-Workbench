/** @vitest-environment jsdom */
/**
 * Splicing a run's HTML into its template, and cleaning the result.
 *
 * The cleaning is the point of interest now: the fragment came from a model that read
 * the template, the skill, and whatever the skill's tools returned, so a construct can
 * reach the document that no template ever held.
 */

import { describe, expect, it } from 'vitest'
import { dedentedHtml, filledTemplate, renderTemplate, resultHtml } from '../src/client/skill-card/render.ts'

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

  describe('presenting a result', () => {
    it('removes the indentation every non-blank line shares', () => {
      expect(dedentedHtml('      <tr>\n        <td>a</td>\n      </tr>'))
        .toBe('<tr>\n  <td>a</td>\n</tr>')
    })

    it('ignores blank lines when finding that indentation, and leaves them empty', () => {
      // A blank line has no indentation of its own; counting it would make the common
      // prefix empty and the block would stay where it was.
      expect(dedentedHtml('    <tr>\n\n      <td>a</td>\n    \n    </tr>'))
        .toBe('<tr>\n\n  <td>a</td>\n\n</tr>')
    })

    it('leaves the text untouched when the lines share no indentation', () => {
      const html = '<tr>\n      <td>a</td>\n</tr>'
      expect(dedentedHtml(html)).toBe(html)
      expect(dedentedHtml('<p>a</p>')).toBe('<p>a</p>')
      expect(dedentedHtml('   ')).toBe('   ')
    })

    it('returns a new string rather than rewriting the value it was given', () => {
      // The dedent is display-only: the stored HTML is spliced into the template
      // verbatim, so nothing may be normalised in place.
      const html = '   <tr>\n     <td>a</td>\n   </tr>'
      const shown = dedentedHtml(html)
      expect(shown).not.toBe(html)
      expect(html).toBe('   <tr>\n     <td>a</td>\n   </tr>')
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
