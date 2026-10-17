/** Choosing the session a skill card run hangs off. */

import { describe, expect, it } from 'vitest'
import { pickRunSession } from '../src/client/skill-card/session.ts'
import type { WorkbenchSessionRow } from '../src/client/skill-card/session.ts'

/**
 * Build one session row.
 * @param overrides - fields the case varies.
 * @returns the row.
 */
function row(overrides: Partial<WorkbenchSessionRow> = {}): WorkbenchSessionRow {
  return { updatedAt: 0, ...overrides }
}

describe('run session picker', () => {
  it('returns nothing when no session can run', () => {
    expect(pickRunSession([], {})).toBeUndefined()
    expect(pickRunSession(['a'], { a: row({ origin: 'subagent' }) })).toBeUndefined()
    // An id with no row is not a candidate either.
    expect(pickRunSession(['a'], {})).toBeUndefined()
  })

  it('picks the most recently active ordinary session', () => {
    const byId = {
      old: row({ updatedAt: 10 }),
      newest: row({ updatedAt: 30 }),
      middle: row({ updatedAt: 20 }),
      child: row({ updatedAt: 99, origin: 'subagent' }),
    }
    expect(pickRunSession(['old', 'newest', 'middle', 'child'], byId)).toBe('newest')
  })

  it('prefers the session the main view holds over a more recent one', () => {
    // The workbench replaces the main view, so recency alone would pick whatever
    // the user touched last rather than the session they came from.
    const byId = {
      recent: row({ updatedAt: 30 }),
      held: row({ updatedAt: 10, retainedBy: { mainView: 1 } }),
    }
    expect(pickRunSession(['recent', 'held'], byId)).toBe('held')
  })

  it('ranks held sessions by recency among themselves', () => {
    const byId = {
      heldOld: row({ updatedAt: 10, retainedBy: { mainView: 1 } }),
      heldNew: row({ updatedAt: 20, retainedBy: { mainView: 1 } }),
      free: row({ updatedAt: 99 }),
    }
    expect(pickRunSession(['heldOld', 'heldNew', 'free'], byId)).toBe('heldNew')
  })

  it('still takes a session whose view released it', () => {
    // Opening the workbench drops retention on the session left behind, and that
    // session is exactly the one the user means to run in.
    const byId = { a: row({ updatedAt: 5, retainedBy: {} }) }
    expect(pickRunSession(['a'], byId)).toBe('a')
  })
})
