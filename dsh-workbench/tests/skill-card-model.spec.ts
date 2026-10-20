/**
 * The model field's three availability states, and the seat that reads them.
 *
 * The distinction under test is the one the feature turns on: "is there a model we can run
 * with" is not "did the picker load". A directory that failed while the session's saved
 * selection survives leaves the card runnable; a directory that answered without a usable
 * model does not invent one.
 */

import { describe, expect, it, vi } from 'vitest'
import type { WorkbenchCardModel } from '../src/skill-card-contract.ts'
import type {
  WorkbenchModelDirectory,
  WorkbenchModelDirectoryResolver,
  WorkbenchModelDirectoryState,
  WorkbenchModelGroup,
} from '../src/client/skill-card/model.ts'
import {
  createModelSeat,
  modelKey,
  parseModelKey,
  resolveModelField,
} from '../src/client/skill-card/model.ts'

/** The catalog the cases below resolve against. */
const GROUPS: readonly WorkbenchModelGroup[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' },
    ],
  },
]

/** The session's saved selection. */
const CURRENT: WorkbenchCardModel = { provider: 'deepseek', model: 'deepseek-chat' }

/** The card's own route, which wins over the session's. */
const STORED: WorkbenchCardModel = { provider: 'deepseek', model: 'deepseek-reasoner' }

/**
 * Build one directory view.
 * @param overrides - fields the case varies.
 * @returns the view.
 */
function directory(overrides: Partial<import('../src/client/skill-card/model.ts').WorkbenchModelDirectoryView> = {}) {
  return {
    available: true,
    status: 'ready' as const,
    current: CURRENT as WorkbenchCardModel | null,
    groups: GROUPS,
    ...overrides,
  }
}

describe('the model field', () => {
  it('offers the catalog with the session selection when the card names nothing', () => {
    // Criterion 73, first state: a card always shows a concrete model, so the default is
    // the session's own selection rather than an empty option.
    const field = resolveModelField(undefined, directory())
    expect(field).toEqual({ kind: 'ready', groups: GROUPS, selected: CURRENT })
  })

  it('prefers the card route over the session selection', () => {
    const field = resolveModelField(STORED, directory())
    expect(field.kind === 'ready' ? field.selected : undefined).toEqual(STORED)
  })

  it('selects the catalog’s first model when the session has saved none', () => {
    // A loaded catalog with no saved selection still has something to show, which is what
    // keeps the field a picker rather than an empty control.
    const field = resolveModelField(undefined, directory({ current: null }))
    expect(field.kind === 'ready' ? field.selected : undefined).toEqual(CURRENT)
  })

  it('shows a known route as text when the directory cannot answer', () => {
    // Criterion 73, second state. "Directory unavailable" is not "no model": the card's own
    // route survives, so the field states it and the run stays possible.
    const field = resolveModelField(STORED, directory({ available: false }))
    expect(field).toEqual({ kind: 'fixed', model: STORED, name: 'DeepSeek Reasoner' })
  })

  it('falls back to the session selection when the directory is in error but still holds one', () => {
    // The saved selection is retained through a failed load precisely so a card can still
    // say what it would run on.
    const field = resolveModelField(undefined, directory({ status: 'error' }))
    expect(field).toEqual({ kind: 'fixed', model: CURRENT, name: 'DeepSeek Chat' })
  })

  it('reports unavailable when there is no route to name', () => {
    // Criterion 73, third state: no stored route and nothing known from the session. There
    // is no model to put on a result, so the card cannot run at all. A directory this
    // client cannot reach answers with no selection either, which is that same state.
    expect(resolveModelField(undefined, directory({ available: false, current: null })))
      .toEqual({ kind: 'unavailable' })
    expect(resolveModelField(undefined, directory({ status: 'error', current: null, groups: [] })))
      .toEqual({ kind: 'unavailable' })
    expect(resolveModelField(undefined, directory({ status: 'loading', groups: [] })))
      .toMatchObject({ kind: 'fixed', model: CURRENT })
  })

  it('keeps a stored route selectable even when the catalog no longer lists it', () => {
    // A blank select would contradict "a card always shows a concrete model". The route is
    // added under its own id, which is the only name known for a model the catalog lost.
    const field = resolveModelField(
      { provider: 'deepseek', model: 'retired' },
      directory(),
    )
    expect(field.kind).toBe('ready')
    const groups = field.kind === 'ready' ? field.groups : []
    expect(groups[0]?.models).toContainEqual({ id: 'retired', name: 'retired' })
  })

  it('adds a whole provider group for a route whose provider is gone', () => {
    const field = resolveModelField({ provider: 'gone', model: 'large' }, directory())
    const groups = field.kind === 'ready' ? field.groups : []
    expect(groups).toContainEqual({ id: 'gone', name: 'gone', models: [{ id: 'large', name: 'large' }] })
  })
})

describe('the select option value', () => {
  it('round-trips a route whose provider contains a slash', () => {
    // The reason the pair is not stored as `"provider/model"`: this id would not survive it.
    const model = { provider: 'vendor/gateway', model: 'large' }
    expect(parseModelKey(modelKey(model))).toEqual(model)
  })

  it('refuses anything it did not produce', () => {
    expect(parseModelKey('deepseek/chat')).toBeUndefined()
    expect(parseModelKey('["deepseek"]')).toBeUndefined()
    expect(parseModelKey('["deepseek", ""]')).toBeUndefined()
    expect(parseModelKey('not json')).toBeUndefined()
  })
})

describe('the model directory seat', () => {
  /**
   * Build a resolver over one directory state.
   * @param state - what the directory reports.
   * @param fails - whether resolving the session throws.
   * @returns the resolver and the subscribe spy.
   */
  function resolverOver(state: WorkbenchModelDirectoryState | undefined, fails = false): {
    resolver: WorkbenchModelDirectoryResolver
    subscribe: ReturnType<typeof vi.fn>
    unsubscribe: ReturnType<typeof vi.fn>
  } {
    const unsubscribe = vi.fn()
    const subscribe = vi.fn(() => unsubscribe)
    let loads = 0
      // The seat must call this: a directory starts idle with no groups, and only a load
      // fills them. Leaving it out is what made most configured models invisible.
      const load = async (): Promise<unknown> => { loads += 1; return undefined }
      const directory: WorkbenchModelDirectory = { store: { getSnapshot: () => state as WorkbenchModelDirectoryState, subscribe }, load }
    const resolver: WorkbenchModelDirectoryResolver = {
      directoryFor: () => {
        if (fails) throw new Error('model selection is unavailable for addressed subagent sessions')
        return directory
      },
    }
    return { resolver, subscribe, unsubscribe }
  }

  it('narrows one session directory to the facts the field reads', () => {
    const state: WorkbenchModelDirectoryState = {
      current: { provider: 'deepseek', model: 'deepseek-chat', reasoningEffort: 'high' } as never,
      status: 'ready',
      groups: GROUPS,
    }
    const { resolver } = resolverOver(state)
    const seat = createModelSeat(() => resolver)
    expect(seat.read('session-1')).toEqual({
      available: true,
      status: 'ready',
      // The effort is dropped: v1 pins the route only, so a field it never chose must not
      // reach the card.
      current: CURRENT,
      groups: GROUPS,
    })
  })

  it('answers unavailable for a session with no directory of its own', () => {
    // `directoryFor` throws for an addressed subagent. That is an unavailable answer rather
    // than an error to report: a card on such a session simply cannot name a route.
    const { resolver } = resolverOver(undefined, true)
    const seat = createModelSeat(() => resolver)
    expect(seat.read('subagent-1')).toEqual({ available: false, status: 'idle', current: null, groups: [] })
    expect(seat.subscribe('subagent-1', () => {})()).toBeUndefined()
  })

  it('answers unavailable while no resolver has registered, and for a missing session', () => {
    const seat = createModelSeat(() => undefined)
    expect(seat.read('session-1').available).toBe(false)
    expect(seat.read(undefined).available).toBe(false)
    expect(seat.subscribe(undefined, () => {})()).toBeUndefined()
  })

  it('forwards the directory subscription and its unsubscribe', () => {
    const { resolver, subscribe, unsubscribe } = resolverOver({
      current: null,
      status: 'loading',
      groups: [],
    })
    const seat = createModelSeat(() => resolver)
    const listener = (): void => {}
    const stop = seat.subscribe('session-1', listener)
    expect(subscribe).toHaveBeenCalledWith(listener)
    stop()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
