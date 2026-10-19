/**
 * Transport behaviour of the browser-side result edit.
 *
 * The page shows whatever this returns, so what is under test here is the boundary: the
 * request shape it sends, and that a response outside the contract becomes an error rather
 * than a half-read record.
 */

import { describe, expect, it, vi } from 'vitest'
import { createWorkbenchSkillCardApi } from '../src/client/skill-card/api.ts'
import type { FetchLike } from '../src/client/skill-card/api.ts'
import { WORKBENCH_SKILL_CARD_RESULT_PATH } from '../src/skill-card-contract.ts'

/**
 * Build a JSON response.
 * @param status - HTTP status.
 * @param body - body value.
 * @returns the response.
 */
function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/** The record the route returns for a stored edit. */
const STORED = {
  cardId: 'skill-card',
  skill: 'git-repo',
  executedAt: 2_000,
  editedAt: 2_000,
  stopReason: 'completed',
  structured: { html: '<b>新</b>' },
}

/** A successful result-edit body. */
const OK_BODY = { apiVersion: 1, revision: '3:1', result: STORED }

describe('createWorkbenchSkillCardApi.saveResult', () => {
  it('sends the card and the fragment to the result route, and returns the new record', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(200, OK_BODY))
    const api = createWorkbenchSkillCardApi({ fetcher })
    await expect(api.saveResult('skill-card', '<b>新</b>')).resolves.toEqual({
      status: 'ok',
      revision: '3:1',
      result: STORED,
    })
    const [url, init] = fetcher.mock.calls[0] ?? []
    expect(url).toBe(WORKBENCH_SKILL_CARD_RESULT_PATH)
    expect(init?.method).toBe('PUT')
    // The fragment travels alone: the record's run facts are the Host's to keep.
    expect(JSON.parse(String(init?.body))).toEqual({ cardId: 'skill-card', html: '<b>新</b>' })
  })

  it('reports a refusal as the Host stated it', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(413, {
      error: { code: 'too-large', message: 'html exceeds the byte limit' },
    }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    await expect(api.saveResult('skill-card', 'x')).resolves.toEqual({
      status: 'rejected',
      code: 'too-large',
      message: 'html exceeds the byte limit',
    })
  })

  it('reports a route that answered without an error body as unavailable', async () => {
    const fetcher = vi.fn<FetchLike>(async () => new Response('nope', { status: 502 }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', 'x')
    expect(outcome.status).toBe('unavailable')
    expect(outcome.status === 'unavailable' && outcome.reason).toBe('skill card route answered 502')
  })

  it('reports a mismatched contract version instead of trusting the body', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(200, { ...OK_BODY, apiVersion: 2 }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', 'x')
    expect(outcome.status === 'unavailable' && outcome.reason)
      .toBe('result response did not match the contract')
  })

  it('refuses a record whose provenance is not a number', async () => {
    // The 手工编辑 row renders whatever this carries, so a value the contract would not
    // accept must not reach it.
    const fetcher = vi.fn<FetchLike>(async () => json(200, {
      ...OK_BODY,
      result: { ...STORED, editedAt: 'yesterday' },
    }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', 'x')
    expect(outcome.status).toBe('unavailable')
  })

  it('refuses a record whose identity is not a card', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(200, {
      ...OK_BODY,
      result: { ...STORED, cardId: 'Skill-Card' },
    }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', 'x')
    expect(outcome.status).toBe('unavailable')
  })

  it('refuses a record whose model is not a pair of ids', async () => {
    // The run-detail row names the route straight from this value, so a joined string or a
    // half-filled pair is refused whole rather than printed as if it were provenance.
    for (const model of ['deepseek/chat', { provider: 'deepseek' }, { provider: '', model: 'chat' }]) {
      const fetcher = vi.fn<FetchLike>(async () => json(200, { ...OK_BODY, result: { ...STORED, model } }))
      const api = createWorkbenchSkillCardApi({ fetcher })
      const outcome = await api.saveResult('skill-card', 'x')
      expect(outcome.status, JSON.stringify(model)).toBe('unavailable')
    }
  })

  it('reports a transport failure as unavailable', async () => {
    const fetcher = vi.fn<FetchLike>(async () => { throw new Error('offline') })
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', 'x')
    expect(outcome.status === 'unavailable' && outcome.reason).toContain('offline')
  })
})
