/**
 * Resolving a clicked key into a runnable target.
 *
 * Every failure branch is a branch a user will actually hit — a renamed card, a
 * deleted card, an uninstalled skill — so each one is asserted together with the
 * candidates it reports.
 */

import { describe, expect, it } from 'vitest'
import { resolveAction } from '../src/client/skill-card/actions.ts'
import type { WorkbenchActionLookup } from '../src/client/skill-card/actions.ts'
import type { WorkbenchActionDeclaration } from '../src/skill-card-contract.ts'

const DECLARATIONS: readonly WorkbenchActionDeclaration[] = [
  { key: 'start', target: { kind: 'card', name: '启动任务' } },
  { key: 'finish', target: { kind: 'skill', name: 'task-finish' } },
  { key: 'gone', target: { kind: 'card', name: '已删除的卡' } },
]

/**
 * A lookup with two cards and one skill, all usable.
 * @param overrides - what the case varies.
 * @returns the lookup.
 */
function lookup(overrides: Partial<WorkbenchActionLookup> = {}): WorkbenchActionLookup {
  return {
    cards: [
      { cardId: 'skill-card', name: '每日任务', running: false },
      { cardId: 'skill-card-2', name: '启动任务', running: false },
    ],
    skills: ['git-repo', 'task-finish'],
    live: true,
    ...overrides,
  }
}

const PAYLOAD = { task_number: 'CP-2025-001', task_status: 1 }

describe('workbench action resolution', () => {
  it('resolves a card target to that card id', () => {
    // The reference is the id, not the name: the name is what the user edits and what
    // the template references, but the run has to address the card itself.
    expect(resolveAction(DECLARATIONS, lookup(), 'start', PAYLOAD)).toEqual({
      kind: 'resolved',
      key: 'start',
      target: { kind: 'card', name: '启动任务' },
      reference: 'skill-card-2',
      payload: PAYLOAD,
    })
  })

  it('resolves a skill target to its name', () => {
    expect(resolveAction(DECLARATIONS, lookup(), 'finish', PAYLOAD)).toEqual({
      kind: 'resolved',
      key: 'finish',
      target: { kind: 'skill', name: 'task-finish' },
      reference: 'task-finish',
      payload: PAYLOAD,
    })
  })

  it('passes the payload through untouched', () => {
    // Rebuilding it here would be the place a value silently changed shape between the
    // confirmation panel and the run.
    const resolved = resolveAction(DECLARATIONS, lookup(), 'start', PAYLOAD)
    expect(resolved.kind === 'resolved' ? resolved.payload : undefined).toBe(PAYLOAD)
  })

  it('refuses a key the template never declared', () => {
    expect(resolveAction(DECLARATIONS, lookup(), 'nope', PAYLOAD)).toEqual({
      kind: 'failed',
      key: 'nope',
      code: 'unknown-action',
      candidates: [],
    })
  })

  it('reports a card that is gone, and lists the cards that exist', () => {
    // Candidates are the whole point: the user's fix is to repoint the declaration.
    expect(resolveAction(DECLARATIONS, lookup(), 'gone', PAYLOAD)).toEqual({
      kind: 'failed',
      key: 'gone',
      code: 'target-card-missing',
      candidates: ['每日任务', '启动任务'],
    })
  })

  it('refuses two cards sharing the name instead of picking one', () => {
    // Picking the first would run the wrong card and look like success.
    const twice = lookup({
      cards: [
        { cardId: 'skill-card-2', name: '启动任务', running: false },
        { cardId: 'skill-card-7', name: '启动任务', running: false },
      ],
    })
    expect(resolveAction(DECLARATIONS, twice, 'start', PAYLOAD)).toEqual({
      kind: 'failed',
      key: 'start',
      code: 'target-card-ambiguous',
      candidates: ['启动任务', '启动任务'],
    })
  })

  it('refuses a target card that is already running', () => {
    const busy = lookup({
      cards: [{ cardId: 'skill-card-2', name: '启动任务', running: true }],
    })
    expect(resolveAction(DECLARATIONS, busy, 'start', PAYLOAD)).toEqual({
      kind: 'failed',
      key: 'start',
      code: 'target-busy',
      candidates: ['启动任务'],
    })
  })

  it('reports a skill that is not installed, and lists what is', () => {
    expect(resolveAction(DECLARATIONS, lookup({ skills: ['git-repo'] }), 'finish', PAYLOAD)).toEqual({
      kind: 'failed',
      key: 'finish',
      code: 'target-skill-missing',
      candidates: ['git-repo'],
    })
  })

  it('separates "no session" from "no such skill"', () => {
    // Telling a user their skill is missing when it is installed sends them looking
    // for a package problem that does not exist.
    expect(resolveAction(DECLARATIONS, lookup({ live: false }), 'finish', PAYLOAD)).toEqual({
      kind: 'failed',
      key: 'finish',
      code: 'target-unavailable',
      candidates: ['task-finish'],
    })
  })

  it('reports the unknown key before the missing target', () => {
    // With no declarations at all, every click is an unknown key — not a missing card,
    // which would blame the wrong thing.
    expect(resolveAction([], lookup(), 'start', PAYLOAD)).toMatchObject({ code: 'unknown-action' })
  })

  it('checks the target card before reporting a busy state', () => {
    // A running card that does not match the name must not be reported as busy.
    const other = lookup({
      cards: [{ cardId: 'skill-card-9', name: '别的卡', running: true }],
    })
    expect(resolveAction(DECLARATIONS, other, 'start', PAYLOAD)).toMatchObject({
      code: 'target-card-missing',
    })
  })
})
