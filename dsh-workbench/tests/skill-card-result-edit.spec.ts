/**
 * Storing a hand-edited result, on both sides of the route.
 *
 * The claims under test are narrow and load-bearing: an edit replaces the region HTML and
 * nothing else, it never fabricates a run, it is refused rather than trimmed when it does
 * not fit, and the route that carries it is a write of its own rather than a fourth method
 * on the run route.
 */

import { describe, expect, it, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  WORKBENCH_RESULT_MAX_BYTES,
  WORKBENCH_SKILL_CARD_MAX_BODY_BYTES,
} from '../src/skill-card-contract.ts'
import type { WorkbenchResultRecord } from '../src/skill-card-contract.ts'
import { createWorkbenchSkillCardResultHandler } from '../src/skill-card-route.ts'
import type { SkillCardRouteFence } from '../src/skill-card-route.ts'
import { WorkbenchSkillCardStore } from '../src/skill-card-store.ts'
import { FakeRequest, run } from './support/fake-http.ts'
import { fakeSkillCardTables } from './support/fake-skill-card-tables.ts'
import type { FakeSkillCardSeed, FakeSkillCardTables } from './support/fake-skill-card-tables.ts'

/** When the run behind the starting result finished. */
const RAN_AT = 1_000

/** When the hand edit is saved. */
const EDITED_AT = 2_000

/** The result a card starts with: a run's own record, with a second structured field. */
const RAN: WorkbenchResultRecord = {
  skill: 'git-repo',
  executedAt: RAN_AT,
  stopReason: 'completed',
  structured: { html: '<b>旧</b>', branch: 'main' },
  outputText: 'done',
  diagnostic: 'a warning from the provider',
}

/** A fence that lets a request through. */
const OPEN: SkillCardRouteFence = { requestRejection: () => undefined }

/**
 * Build a fence double carrying a fixed rejection.
 * @param rejection - the status the fence reports, or undefined to let the request through.
 * @returns the fence.
 */
function fence(rejection: 401 | 403 | undefined): SkillCardRouteFence {
  return { requestRejection: () => rejection }
}

/** Everything one spec needs to drive the store and the route. */
interface Setup {
  readonly store: WorkbenchSkillCardStore
  readonly tables: FakeSkillCardTables
  readonly handle: (request: IncomingMessage, response: ServerResponse) => void
  readonly warn: ReturnType<typeof vi.fn>
}

/**
 * Build a store and the result-edit handler over one seeded card.
 * @param options - seed records, the record byte budget, and a fence rejection.
 * @returns the store, tables, handler, and logger spy.
 */
function setup(options: {
  readonly result?: WorkbenchResultRecord | null
  readonly maxResultBytes?: number
  readonly rejection?: 401 | 403
} = {}): Setup {
  const result = options.result === null ? undefined : options.result ?? RAN
  const seed: FakeSkillCardSeed = {
    card: { 'skill-card': { skill: 'git-repo' } },
    ...result === undefined ? {} : { result: { 'skill-card': result } },
  }
  const tables = fakeSkillCardTables(seed)
  const store = new WorkbenchSkillCardStore({
    domainName: 'workbench_skill_card',
    card: tables.card,
    template: tables.template,
    result: tables.result,
    events: { on: () => () => {} },
    maxTemplateBytes: 1024,
    maxTemplatesPerCard: 4,
    maxResultBytes: options.maxResultBytes ?? WORKBENCH_RESULT_MAX_BYTES,
    bootStamp: 7,
    // The store's own clock: an edit stamps two moments, and neither waits for a second.
    now: () => EDITED_AT,
  })
  const warn = vi.fn()
  const handle = createWorkbenchSkillCardResultHandler({
    store,
    fence: fence(options.rejection),
    maxResultBytes: options.maxResultBytes ?? WORKBENCH_RESULT_MAX_BYTES,
    warn,
  })
  return { store, tables, handle, warn }
}

/**
 * One PUT body that would be accepted.
 * @param overrides - fields the case varies.
 * @returns the request body.
 */
function body(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { cardId: 'skill-card', html: '<b>新</b>', ...overrides }
}

describe('the store’s hand-edit path', () => {
  it('replaces the region HTML and keeps every other fact of the run', async () => {
    // Criterion 69. A save must not fabricate a run: the skill and the stop reason stay, the
    // raw output and the diagnostic stay, and the rest of the structured value stays.
    const { store, tables } = setup()
    const outcome = await store.putEditedResult('skill-card', '<b>新</b>')
    expect(outcome.status).toBe('written')
    const written = {
      ...RAN,
      executedAt: EDITED_AT,
      editedAt: EDITED_AT,
      structured: { branch: 'main', html: '<b>新</b>' },
    }
    expect(outcome.status === 'written' && outcome.result).toEqual({ cardId: 'skill-card', ...written })
    // What the table holds is the same record, not a projection of it.
    expect(tables.operations).toEqual([{ table: 'result', kind: 'put', key: 'skill-card', value: written }])
    expect(store.read().results).toEqual([{ cardId: 'skill-card', ...written }])
  })

  it('stamps a second edit with its own moment, and one provenance field only', async () => {
    const { store } = setup()
    await store.putEditedResult('skill-card', '<b>一</b>')
    const second = await store.putEditedResult('skill-card', '<b>二</b>')
    expect(second.status === 'written' && second.result.editedAt).toBe(EDITED_AT)
    expect(second.status === 'written' && second.result.structured).toEqual({ branch: 'main', html: '<b>二</b>' })
  })

  it('refuses a card that holds no result, because there is nothing to keep', async () => {
    // The record's skill and stop reason are the two facts a hand edit has nothing to say
    // about, so a card without a result has no record an edit could stand on.
    const { store, tables } = setup({ result: null })
    await expect(store.putEditedResult('skill-card', '<b>新</b>')).resolves.toEqual({ status: 'missing' })
    expect(tables.operations).toEqual([])
  })

  it('refuses a blank fragment at the durable boundary too', async () => {
    // The editor states this first, in the place the user can see the text. This is the
    // boundary that actually stores it, and an empty region renders as a broken card.
    const { store, tables } = setup()
    for (const blank of ['', '   ', '\n\t ']) {
      const outcome = await store.putEditedResult('skill-card', blank)
      expect(outcome.status).toBe('invalid')
    }
    expect(tables.operations).toEqual([])
  })

  it('refuses an oversized fragment instead of trimming it', async () => {
    // Criterion 66, store half. Truncating would store one document and display another.
    const { store, tables } = setup({ maxResultBytes: 200 })
    const outcome = await store.putEditedResult('skill-card', 'x'.repeat(201))
    expect(outcome).toEqual({ status: 'too-large', bytes: 201 })
    expect(tables.operations).toEqual([])
  })

  it('refuses a fragment that fits only if the run’s own output were dropped', async () => {
    // The record budget counts the whole record. Dropping the run's output text to make room
    // would be the same failure as truncating: what is stored would not be what was written.
    const { store, tables } = setup({
      maxResultBytes: 300,
      result: { ...RAN, outputText: 'y'.repeat(200) },
    })
    const outcome = await store.putEditedResult('skill-card', 'x'.repeat(120))
    expect(outcome.status).toBe('too-large')
    expect(tables.operations).toEqual([])
  })

  it('loses its provenance when the card runs again', async () => {
    // Criterion 69, second half. A later run overwrites the edit — that is the existing
    // semantics of running a card, and it is why `editedAt` is not a history.
    const { store } = setup()
    await store.putEditedResult('skill-card', '<b>新</b>')
    await store.putResult('skill-card', {
      skill: 'git-repo',
      executedAt: EDITED_AT + 1,
      stopReason: 'completed',
      structured: { html: '<b>运行</b>' },
    })
    const [stored] = store.read().results
    expect(stored).not.toHaveProperty('editedAt')
    expect(stored?.structured).toEqual({ html: '<b>运行</b>' })
  })
})

describe('the result-edit route', () => {
  it('answers a fenced request without touching storage', async () => {
    const { handle, tables } = setup({ rejection: 401 })
    const response = await run(handle, new FakeRequest('PUT', body()))
    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.body)).toEqual({ error: { code: 'unauthorized', message: 'request rejected' } })
    expect(tables.operations).toEqual([])
  })

  it('names the one method it serves', async () => {
    // Editing a result is not a run, so it is not a fourth method on the run route: this
    // route accepts the write and nothing else.
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('POST', body()))
    expect(response.statusCode).toBe(405)
    expect(response.headers.get('allow')).toBe('PUT')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('stores the edit and returns the new record with the revision', async () => {
    // Criterion 62, route half. The record comes back so the page updates without a second
    // read.
    const { handle, store } = setup()
    const response = await run(handle, new FakeRequest('PUT', body()))
    expect(response.statusCode).toBe(200)
    const parsed = JSON.parse(response.body)
    expect(parsed.apiVersion).toBe(1)
    expect(parsed.revision).toBe(store.revision)
    expect(parsed.result).toEqual({
      cardId: 'skill-card',
      skill: 'git-repo',
      executedAt: EDITED_AT,
      editedAt: EDITED_AT,
      stopReason: 'completed',
      structured: { branch: 'main', html: '<b>新</b>' },
      outputText: 'done',
      diagnostic: 'a warning from the provider',
    })
  })

  it('reports a card with no result as not found', async () => {
    const { handle, tables } = setup({ result: null })
    const response = await run(handle, new FakeRequest('PUT', body()))
    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body).error).toEqual({
      code: 'not-found',
      message: 'this card holds no result to edit',
    })
    expect(tables.operations).toEqual([])
  })

  it('rejects a body outside the contract', async () => {
    const { handle, tables } = setup()
    const cases: readonly { readonly request: FakeRequest; readonly message: string }[] = [
      { request: new FakeRequest('PUT', []), message: 'body must be an object' },
      { request: new FakeRequest('PUT', body({ cardId: 'Skill-Card' })), message: 'cardId must be a namespaced card id' },
      { request: new FakeRequest('PUT', body({ cardId: undefined })), message: 'cardId must be a namespaced card id' },
      { request: new FakeRequest('PUT', body({ html: 7 })), message: 'html must be a string' },
      { request: new FakeRequest('PUT', body({ html: undefined })), message: 'html must be a string' },
      { request: new FakeRequest('PUT', undefined), message: 'request body is empty' },
      { request: FakeRequest.raw('PUT', '{'), message: 'request body is not JSON' },
    ]
    for (const item of cases) {
      const response = await run(handle, item.request)
      expect(response.statusCode, item.message).toBe(400)
      expect(JSON.parse(response.body).error.message).toBe(item.message)
    }
    expect(tables.operations).toEqual([])
  })

  it('refuses a blank fragment with the store’s own reason', async () => {
    const { handle, tables } = setup()
    const response = await run(handle, new FakeRequest('PUT', body({ html: '  ' })))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.message).toBe('an edited result must hold visible content')
    expect(tables.operations).toEqual([])
  })

  it('refuses an oversized fragment with the size code', async () => {
    // Criterion 66, route half: refused, never truncated, and it never reaches storage.
    const { handle, tables } = setup()
    const oversized = 'x'.repeat(WORKBENCH_RESULT_MAX_BYTES + 1)
    const response = await run(handle, new FakeRequest('PUT', body({ html: oversized })))
    expect(response.statusCode).toBe(413)
    expect(JSON.parse(response.body).error).toEqual({
      code: 'too-large',
      message: 'html exceeds the byte limit',
    })
    expect(tables.operations).toEqual([])
  })

  it('applies whichever budget is smaller, the wire ceiling or the deployment’s', async () => {
    // A deployment may tighten the ceiling; it may not widen it.
    const { handle, tables } = setup({ maxResultBytes: 64 })
    const response = await run(handle, new FakeRequest('PUT', body({ html: 'x'.repeat(65) })))
    expect(response.statusCode).toBe(413)
    expect(tables.operations).toEqual([])
  })

  it('refuses a body above the request cap', async () => {
    const { handle } = setup()
    const huge = body({ html: 'x'.repeat(WORKBENCH_RESULT_MAX_BYTES + WORKBENCH_SKILL_CARD_MAX_BODY_BYTES) })
    const response = await run(handle, new FakeRequest('PUT', huge))
    expect(response.statusCode).toBe(413)
    expect(JSON.parse(response.body).error.code).toBe('too-large')
  })

  it('reports a storage failure without echoing the record', async () => {
    const tables = fakeSkillCardTables({
      card: { 'skill-card': { skill: 'git-repo' } },
      result: { 'skill-card': RAN },
    })
    tables.result.failPuts(new Error('disk on fire'))
    const store = new WorkbenchSkillCardStore({
      domainName: 'workbench_skill_card',
      card: tables.card,
      template: tables.template,
      result: tables.result,
      events: { on: () => () => {} },
      maxTemplateBytes: 1024,
      maxTemplatesPerCard: 4,
      maxResultBytes: WORKBENCH_RESULT_MAX_BYTES,
      bootStamp: 7,
      now: () => EDITED_AT,
    })
    const warn = vi.fn()
    const handle = createWorkbenchSkillCardResultHandler({
      store,
      fence: OPEN,
      maxResultBytes: WORKBENCH_RESULT_MAX_BYTES,
      warn,
    })
    const response = await run(handle, new FakeRequest('PUT', body()))
    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body)).toEqual({
      error: { code: 'storage-failure', message: 'skill card storage failed' },
    })
    expect(response.body).not.toContain('disk on fire')
    expect(warn).toHaveBeenCalledOnce()
    expect(String(warn.mock.calls[0]?.[0])).toContain('disk on fire')
  })
})
