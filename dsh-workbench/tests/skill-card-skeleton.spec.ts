/** @vitest-environment jsdom */
/**
 * The starter a user gets for an empty template.
 *
 * Its contract is that it does not need fixing: a starter that opens on a validation
 * error is worse than an empty box, and it is exactly what a document written by hand
 * from memory keeps producing.
 */

import { describe, expect, it } from 'vitest'
import { templateSkeleton } from '../src/client/skill-card/skeleton.ts'
import { analyzeTemplate } from '../src/client/skill-card/template.ts'
import { en, zh } from '../src/client/locales.ts'
import type { WorkbenchLocaleKey } from '../src/client/locales.ts'

/** The two dictionaries, so both are proven to produce a clean document. */
const DICTIONARIES = [zh, en] as const

/**
 * Read one dictionary value.
 * @param dictionary - the dictionary.
 * @param key - dictionary key.
 * @returns the text.
 */
function translate(dictionary: Record<WorkbenchLocaleKey, string>, key: WorkbenchLocaleKey): string {
  return dictionary[key]
}

describe('the template skeleton', () => {
  it('analyzes clean in both languages', () => {
    for (const dictionary of DICTIONARIES) {
      const html = templateSkeleton(key => translate(dictionary, key))
      const analysis = analyzeTemplate(html)
      expect(analysis.violations).toEqual([])
      expect(analysis.region).toBeDefined()
      // The block exists and is empty: the builder appends the first target to it.
      expect(analysis.actions).toEqual([])
    }
  })

  it('demonstrates both concepts: the region and the declaration block', () => {
    const html = templateSkeleton(key => translate(zh, key))
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<style>')
    expect(html).toContain('<!-- dsh-actions -->')
    expect(html).toContain('<!-- template-begin -->')
    expect(html).toContain('<!-- template-end -->')
    // Inside the region: what to generate, one example row, and the quoting rule that
    // a child agent gets wrong otherwise.
    const region = html.slice(
      html.indexOf('<!-- template-begin -->'),
      html.indexOf('<!-- template-end -->'),
    )
    expect(region).toContain('data-dsh-action="finish"')
    expect(region).toContain("data-dsh-row='{")
    expect(region).toContain('&#39;')
    // The instruction is a comment, and the example button is inside it: a starter
    // that rendered a dead button would invite a click that cannot work.
    expect(region).toContain('<!--')
    expect(region).not.toContain('<script')
  })

  it('starts the document with no placeholder syntax left over', () => {
    // `{{field}}` is refused by the analyser, so a starter must never suggest it.
    const html = templateSkeleton(key => translate(zh, key))
    expect(/\{\{[^{}]*\}\}/u.test(html)).toBe(false)
  })
})
