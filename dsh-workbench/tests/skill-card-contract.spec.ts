/** Invariants of the skill card wire contract, which both halves compile against. */

import { describe, expect, it } from 'vitest'
import {
  WORKBENCH_OUTPUT_SCHEMA,
  WORKBENCH_DEFAULT_SANDBOX_MODE,
  WORKBENCH_SANDBOX_MODES,
  effectiveWorkbenchSandboxMode,
  isWorkbenchSandboxMode,
  WORKBENCH_REGION_BEGIN,
  WORKBENCH_REGION_END,
  WORKBENCH_RESULT_MAX_BYTES,
  regionMarkerPattern,
  resultPointerPath,
  WORKBENCH_SKILL_CARD_API_VERSION,
  WORKBENCH_SKILL_CARD_CATALOG_PATH,
  WORKBENCH_SKILL_CARD_MAX_BODY_BYTES,
  WORKBENCH_SKILL_CARD_PATH,
  WORKBENCH_SKILL_CARD_RESULT_PATH,
  WORKBENCH_SKILL_CARD_RUN_PATH,
  WORKBENCH_SKILL_NAME_MAX_LENGTH,
  WORKBENCH_TEMPLATE_MAX_BYTES,
  isWorkbenchSkillName,
  parseTemplateKey,
  templateKey,
} from '../src/skill-card-contract.ts'

describe('skill card contract', () => {
  it('keeps every route under the base path', () => {
    expect(WORKBENCH_SKILL_CARD_CATALOG_PATH.startsWith(`${WORKBENCH_SKILL_CARD_PATH}/`)).toBe(true)
    expect(WORKBENCH_SKILL_CARD_RUN_PATH.startsWith(`${WORKBENCH_SKILL_CARD_PATH}/`)).toBe(true)
    // The result edit is its own operation, so it is its own path rather than a fourth
    // method on the run route.
    expect(WORKBENCH_SKILL_CARD_RESULT_PATH).toBe(`${WORKBENCH_SKILL_CARD_PATH}/result`)
    expect(WORKBENCH_SKILL_CARD_RESULT_PATH).not.toBe(WORKBENCH_SKILL_CARD_RUN_PATH)
  })

  it('orders the byte ceilings so both halves agree on what fits', () => {
    expect(WORKBENCH_TEMPLATE_MAX_BYTES).toBeLessThan(WORKBENCH_SKILL_CARD_MAX_BODY_BYTES)
    expect(WORKBENCH_RESULT_MAX_BYTES).toBeLessThanOrEqual(WORKBENCH_SKILL_CARD_MAX_BODY_BYTES)
  })

  it('pins the contract version', () => {
    expect(WORKBENCH_SKILL_CARD_API_VERSION).toBe(1)
  })

  describe('skill names', () => {
    it('accepts kebab-case names', () => {
      for (const name of ['git-repo', 'a', 'office-xlsx', 'a1-b2']) {
        expect(isWorkbenchSkillName(name)).toBe(true)
      }
    })

    it('rejects anything else', () => {
      const overlong = 'a'.repeat(WORKBENCH_SKILL_NAME_MAX_LENGTH + 1)
      // The registry's own grammar admits no leading, trailing, or repeated hyphen.
      for (const name of ['', 'Git-Repo', 'git_repo', '-leading', 'trailing-', 'a--b', overlong]) {
        expect(isWorkbenchSkillName(name)).toBe(false)
      }
    })
  })

  describe('template keys', () => {
    it('round-trips a card and skill', () => {
      expect(parseTemplateKey(templateKey('skill-card', 'git-repo'))).toEqual({
        cardId: 'skill-card',
        skill: 'git-repo',
      })
    })

    it('keeps the key path-safe for the per-record storage layout', () => {
      // A per-record key becomes a file-name segment and must match its safe set.
      expect(templateKey('skill-card', 'git-repo')).toMatch(/^[a-zA-Z0-9_-]+$/)
    })

    it('rejects keys that are not composite', () => {
      for (const key of ['', 'git-repo', '_git-repo', 'skill-card_', 'Skill-Card_git-repo', 'skill-card_Git-Repo']) {
        expect(parseTemplateKey(key)).toBeUndefined()
      }
    })
  })

  it('matches region markers with or without inner padding', () => {
    // A fresh pattern per call: a global regex carries `lastIndex` between calls, so
    // reusing one would make the second `test` depend on the first.
    expect(regionMarkerPattern(WORKBENCH_REGION_BEGIN).test('<!-- template-begin -->')).toBe(true)
    expect(regionMarkerPattern(WORKBENCH_REGION_BEGIN).test('<!--template-begin-->')).toBe(true)
    expect(regionMarkerPattern(WORKBENCH_REGION_BEGIN).test('<!-- template-end -->')).toBe(false)
    expect(regionMarkerPattern(WORKBENCH_REGION_END).test('<!-- template-end -->')).toBe(true)
  })

  it('asks every child for the one property a region needs', () => {
    // The template's comments say what to produce, so the contract carries no field
    // list: the only thing that can be validated about a result is that it is HTML.
    expect(WORKBENCH_OUTPUT_SCHEMA.properties.html).toEqual({ type: 'string' })
    expect(WORKBENCH_OUTPUT_SCHEMA.required).toEqual(['html'])
  })

  it('resolves an absent permission mode to the default and accepts only the known modes', () => {
    // Criterion 103. Unset is not "inherit": it is one concrete mode, decided here so the
    // page, the store and the runner cannot each default differently.
    expect(effectiveWorkbenchSandboxMode(undefined)).toBe('workspace-write')
    expect(WORKBENCH_DEFAULT_SANDBOX_MODE).toBe('workspace-write')
    for (const mode of WORKBENCH_SANDBOX_MODES) {
      expect(effectiveWorkbenchSandboxMode(mode)).toBe(mode)
      expect(isWorkbenchSandboxMode(mode)).toBe(true)
    }
    for (const value of ['full-control', '', 'READ-ONLY', undefined, 3, { mode: 'read-only' }]) {
      expect(isWorkbenchSandboxMode(value)).toBe(false)
    }
  })
})

describe('resultPointerPath', () => {
  it('reads the attribute an author declared', () => {
    expect(resultPointerPath('<div data-dsh-files="docs/任务分析" hidden></div>')).toBe('docs/任务分析')
  })

  it('ignores a pointer quoted in the template’s own explanation', () => {
    // The header comment explains the attribute by quoting it, and that quotation comes
    // ahead of the element. Read in document order, the explanation wins and an author who
    // edits the element - the one thing the template says to change - sees nothing change.
    const template = [
      '<!-- 下面那个 data-dsh-files="docs/详细设计" —— 指向这一步真正写出文件的目录。 -->',
      '<div data-dsh-files="docs/任务分析" hidden></div>',
    ].join('\n')
    expect(resultPointerPath(template)).toBe('docs/任务分析')
  })

  it('answers nothing for a pointer that only exists in a comment', () => {
    expect(resultPointerPath('<!-- data-dsh-files="docs/设计" -->')).toBeUndefined()
  })

  it('still finds a pointer a stored region carries inside the markers', () => {
    const region = '<!-- template-begin --><div data-dsh-files="docs/旧" hidden></div><!-- template-end -->'
    expect(resultPointerPath(region)).toBe('docs/旧')
  })

  it('ignores an empty or absent pointer', () => {
    expect(resultPointerPath('<div data-dsh-files="" hidden></div>')).toBeUndefined()
    expect(resultPointerPath('<div data-dsh-files="   " hidden></div>')).toBeUndefined()
    expect(resultPointerPath('<p>no pointer</p>')).toBeUndefined()
    expect(resultPointerPath(undefined)).toBeUndefined()
  })
})