/** Choosing the session the application's own model picker reads. */

import { describe, expect, it, vi } from 'vitest'
import { createPickerSession } from '../src/client/skill-card/picker-session.ts'
import type { WorkbenchPickerSessionList } from '../src/client/skill-card/picker-session.ts'
import type { WorkbenchSessionRow } from '../src/client/skill-card/session.ts'

/**
 * Build one session row.
 * @param overrides - fields the case varies.
 * @returns the row.
 */
function row(overrides: Partial<WorkbenchSessionRow> = {}): WorkbenchSessionRow {
  return { updatedAt: 0, ...overrides }
}

/**
 * Build a session list a case can replace.
 * @param ids - list order.
 * @param byId - rows addressed by id.
 * @returns the list and a setter for the next snapshot.
 */
function list(ids: readonly string[], byId: Readonly<Record<string, WorkbenchSessionRow | undefined>>): {
  source: WorkbenchPickerSessionList
  set: (nextIds: readonly string[], nextById: Readonly<Record<string, WorkbenchSessionRow | undefined>>) => void
} {
  let state = { ids, byId }
  const listeners = new Set<() => void>()
  return {
    source: {
      getSnapshot: () => state,
      subscribe: (listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    },
    set: (nextIds, nextById) => {
      state = { ids: nextIds, byId: nextById }
      for (const listener of listeners) listener()
    },
  }
}

describe('picker session', () => {
  it('reads the session the main view holds', () => {
    const { source } = list(
      ['other', 'held'],
      { other: row({ updatedAt: 99 }), held: row({ retainedBy: { mainView: 1 } }) },
    )
    expect(createPickerSession(source).current()).toBe('held')
  })

  it('keeps that session after the panel takes the main column away', () => {
    // Opening the workbench unmounts the conversation, which releases the main-view
    // reference. Recency would then name whatever moved last — a different chat, or this
    // feature's own card agent — instead of the session the user came from.
    const { source, set } = list(
      ['held', 'recent'],
      { held: row({ retainedBy: { mainView: 1 } }), recent: row({ updatedAt: 50 }) },
    )
    const picker = createPickerSession(source)
    set(['held', 'recent'], { held: row({ retainedBy: {} }), recent: row({ updatedAt: 80 }) })
    expect(picker.current()).toBe('held')
  })

  it('follows a session opened after the panel appeared', () => {
    // The held answer wins over the remembered one, so a session retained later is used
    // rather than the one that was on screen when the tracker was built.
    const { source, set } = list(['first'], { first: row({ retainedBy: { mainView: 1 } }) })
    const picker = createPickerSession(source)
    set(['first', 'second'], {
      first: row({ retainedBy: {} }),
      second: row({ retainedBy: { mainView: 1 } }),
    })
    expect(picker.current()).toBe('second')
  })

  it('never names an addressed subagent', () => {
    const { source } = list(['child'], { child: row({ origin: 'subagent', retainedBy: { mainView: 1 } }) })
    expect(createPickerSession(source).current()).toBeUndefined()
  })

  it('answers nothing until a session has been held', () => {
    const { source } = list(['session'], { session: row({}) })
    expect(createPickerSession(source).current()).toBeUndefined()
  })

  it('observes the list it was built over', () => {
    const { source } = list([], {})
    const observe = vi.spyOn(source, 'subscribe')
    createPickerSession(source)
    expect(observe).toHaveBeenCalledTimes(1)
  })
})
