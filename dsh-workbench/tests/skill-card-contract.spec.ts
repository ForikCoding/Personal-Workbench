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
