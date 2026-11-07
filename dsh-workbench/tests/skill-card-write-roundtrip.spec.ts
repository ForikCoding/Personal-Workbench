/**
 * The client's card write, through the real route, onto a real store.
 *
 * The page-level specs drive a stubbed transport, so a mismatch between what the client
 * sends and what the route accepts would pass every one of them and still leave the button
 * dead in the app. This runs the two halves against each other.
 */

import { describe, expect, it } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createWorkbenchSkillCardApi } from '../src/client/skill-card/api.ts'
import { createWorkbenchSkillCardHandler } from '../src/skill-card-route.ts'
import { WorkbenchSkillCardStore } from '../src/skill-card-store.ts'
import { FakeRequest, run } from './support/fake-http.ts'
import { fakeSkillCardTables } from './support/fake-skill-card-tables.ts'

/**
 * A transport that answers from the route in this process.
 * @param handle - the route handler.
 * @returns a fetch-shaped function.
 */
function transport(handle: (request: IncomingMessage, response: ServerResponse) => void): typeof fetch {
  return (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) as unknown : undefined
    const answer = await run(handle, new FakeRequest(method, body))
    const text = answer.body
    return {
      status: answer.statusCode,
      ok: answer.statusCode >= 200 && answer.statusCode < 300,
      json: async () => JSON.parse(text) as unknown,
      text: async () => text,
    } as unknown as Response
  }) as typeof fetch
}

/**
 * Build the api over a fresh store.
 * @returns the api and the store behind it.
 */
function setup(): {
  api: ReturnType<typeof createWorkbenchSkillCardApi>
  store: WorkbenchSkillCardStore
} {
  const tables = fakeSkillCardTables()
  const store = new WorkbenchSkillCardStore({
    domainName: 'workbench_skill_card',
    card: tables.card,
    template: tables.template,
    result: tables.result,
    events: { on: () => () => {} },
    maxTemplateBytes: 1024,
    maxTemplatesPerCard: 4,
    maxResultBytes: 512,
    maxResultsPerCard: 30,
    bootStamp: 7,
  })
  const handle = createWorkbenchSkillCardHandler({
    store,
    fence: { requestRejection: () => undefined },
    maxTemplateBytes: 1024,
    capabilities: { startActivation: true, start: false },
    warn: () => undefined,
  })
  return { api: createWorkbenchSkillCardApi({ fetcher: transport(handle) }), store }
}

describe('adding a step writes a card through the route', () => {
  it('lands the card a picked skill becomes', async () => {
    const { api, store } = setup()
    const read = await api.read()
    expect(read.status).toBe('ok')
    if (read.status !== 'ok') return
    const write = await api.write({
      baseRevision: read.snapshot.revision,
      cardId: 'skill-card-6',
      name: 'uf30-task-analysis',
      skill: 'uf30-task-analysis',
    })
    expect(write.status).toBe('ok')
    if (write.status !== 'ok') return
    const cards = write.snapshot.cards.map(card => card.cardId)
    expect(cards).toContain('skill-card-6')
    expect(store.read().cards.map(card => card.cardId)).toContain('skill-card-6')
  })
})
