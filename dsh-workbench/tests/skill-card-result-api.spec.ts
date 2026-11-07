/**
 * Transport behaviour of the browser-side result edit.
 *
 * The page shows whatever this returns, so what is under test here is the boundary: the
 * request shape it sends, and that a response outside the contract becomes an error rather
 * than a half-read record.
 */

import { describe, expect, it, vi } from 'vitest'
import { createWorkbenchSkillCardApi, parseRunResponse, parseSnapshot } from '../src/client/skill-card/api.ts'
import type { FetchLike } from '../src/client/skill-card/api.ts'
import { WORKBENCH_SKILL_CARD_FILES_PATH, WORKBENCH_SKILL_CARD_RESULT_PATH } from '../src/skill-card-contract.ts'

/**
 * Build a JSON response.
 * @param status - HTTP status.
 * @param body - body value.
 * @returns the response.
 */
function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/** The run the record the route returns belongs to. */
const RUN = '7'

/** The record the route returns for a stored edit. */
const STORED = {
  cardId: 'skill-card',
  runId: RUN,
  skill: 'git-repo',
  executedAt: 2_000,
  editedAt: 2_000,
  stopReason: 'completed',
  structured: { html: '<b>新</b>' },
}

/** A successful result-edit body. */
const OK_BODY = { apiVersion: 1, revision: '3:1', result: STORED }

describe('createWorkbenchSkillCardApi.saveResult', () => {
  it('sends the card, the run, and the fragment to the result route, and returns the new record', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(200, OK_BODY))
    const api = createWorkbenchSkillCardApi({ fetcher })
    await expect(api.saveResult('skill-card', RUN, '<b>新</b>')).resolves.toEqual({
      status: 'ok',
      revision: '3:1',
      result: STORED,
    })
    const [url, init] = fetcher.mock.calls[0] ?? []
    expect(url).toBe(WORKBENCH_SKILL_CARD_RESULT_PATH)
    expect(init?.method).toBe('PUT')
    // The fragment and its run travel together: the record's other run facts are the
    // Host's to keep, but the edit has to say which run it edits.
    expect(JSON.parse(String(init?.body))).toEqual({ cardId: 'skill-card', runId: RUN, html: '<b>新</b>' })
  })

  it('reports a refusal as the Host stated it', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(413, {
      error: { code: 'too-large', message: 'html exceeds the byte limit' },
    }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    await expect(api.saveResult('skill-card', RUN, 'x')).resolves.toEqual({
      status: 'rejected',
      code: 'too-large',
      message: 'html exceeds the byte limit',
    })
  })

  it('reports a route that answered without an error body as unavailable', async () => {
    const fetcher = vi.fn<FetchLike>(async () => new Response('nope', { status: 502 }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', RUN, 'x')
    expect(outcome.status).toBe('unavailable')
    expect(outcome.status === 'unavailable' && outcome.reason).toBe('skill card route answered 502')
  })

  it('reports a mismatched contract version instead of trusting the body', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(200, { ...OK_BODY, apiVersion: 2 }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', RUN, 'x')
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
    const outcome = await api.saveResult('skill-card', RUN, 'x')
    expect(outcome.status).toBe('unavailable')
  })

  it('refuses a record whose identity is not a card', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(200, {
      ...OK_BODY,
      result: { ...STORED, cardId: 'Skill-Card' },
    }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', RUN, 'x')
    expect(outcome.status).toBe('unavailable')
  })

  it('refuses a record whose run is not named', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(200, {
      ...OK_BODY,
      result: { ...STORED, runId: '' },
    }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', RUN, 'x')
    expect(outcome.status).toBe('unavailable')
  })

  it('refuses a record whose model is not a pair of ids', async () => {
    // The run-detail row names the route straight from this value, so a joined string or a
    // half-filled pair is refused whole rather than printed as if it were provenance.
    for (const model of ['deepseek/chat', { provider: 'deepseek' }, { provider: '', model: 'chat' }]) {
      const fetcher = vi.fn<FetchLike>(async () => json(200, { ...OK_BODY, result: { ...STORED, model } }))
      const api = createWorkbenchSkillCardApi({ fetcher })
      const outcome = await api.saveResult('skill-card', RUN, 'x')
      expect(outcome.status, JSON.stringify(model)).toBe('unavailable')
    }
  })

  it('keeps the session the edited result was produced in', async () => {
    // The edit is not a run, so nothing about the run's facts changes — the session
    // included. 重新生成 reads it from the record this returns.
    const fetcher = vi.fn<FetchLike>(async () => json(200, {
      ...OK_BODY,
      result: { ...STORED, sessionId: 'workbench-skill-card-7' },
    }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', RUN, '<b>新</b>')
    expect(outcome.status === 'ok' && outcome.result.sessionId).toBe('workbench-skill-card-7')
  })

  it('refuses a record whose session id is not a usable id', async () => {
    // The value travels back as the session a refinement runs in, so a record carrying
    // something that is not an id is refused whole rather than sent back as one.
    for (const sessionId of ['', 7, { id: 'session-1' }]) {
      const fetcher = vi.fn<FetchLike>(async () => json(200, { ...OK_BODY, result: { ...STORED, sessionId } }))
      const api = createWorkbenchSkillCardApi({ fetcher })
      const outcome = await api.saveResult('skill-card', RUN, 'x')
      expect(outcome.status, JSON.stringify(sessionId)).toBe('unavailable')
    }
  })

  it('reports a transport failure as unavailable', async () => {
    const fetcher = vi.fn<FetchLike>(async () => { throw new Error('offline') })
    const api = createWorkbenchSkillCardApi({ fetcher })
    const outcome = await api.saveResult('skill-card', RUN, 'x')
    expect(outcome.status === 'unavailable' && outcome.reason).toContain('offline')
  })
})

describe('parseSnapshot', () => {
  /** A snapshot body holding one card and one result. */
  const SNAPSHOT = {
    apiVersion: 1,
    revision: '1:0',
    cards: [{ cardId: 'skill-card', templateSkills: [] }],
    results: [STORED],
  }

  it('accepts a result that carries the session it ran in, and one that does not', () => {
    // The Host sends both: a record written before the workbench kept a session per run has
    // none, and refusing it would blank the whole board over one old entry.
    expect(parseSnapshot(SNAPSHOT)?.results[0]).not.toHaveProperty('sessionId')
    const withSession = { ...SNAPSHOT, results: [{ ...STORED, sessionId: 'workbench-skill-card-7' }] }
    expect(parseSnapshot(withSession)?.results[0]?.sessionId).toBe('workbench-skill-card-7')
  })

  it('keeps the instruction mode a card stores, and reads none as none', () => {
    // The page draws its run control from this value. Dropping it here is not a display
    // detail: the card then reads as "no instruction needed", the header's Run is drawn with
    // no field beside it, and the Host refuses the run the user had no way to fill in.
    const body = {
      ...SNAPSHOT,
      cards: [{ cardId: 'skill-card', instructionMode: 'required', templateSkills: [] }],
    }
    expect(parseSnapshot(body)?.cards[0]?.instructionMode).toBe('required')
    expect(parseSnapshot(SNAPSHOT)?.cards[0]).not.toHaveProperty('instructionMode')
    expect(parseSnapshot({
      ...SNAPSHOT,
      cards: [{ cardId: 'skill-card', instructionMode: 'optional', templateSkills: [] }],
    })?.cards[0]?.instructionMode).toBe('optional')
  })

  it('refuses a card whose instruction mode is outside the contract', () => {
    for (const instructionMode of ['always', '', 1, {}]) {
      const body = { ...SNAPSHOT, cards: [{ cardId: 'skill-card', instructionMode, templateSkills: [] }] }
      expect(parseSnapshot(body), JSON.stringify(instructionMode)).toBeUndefined()
    }
  })

  it('keeps the instruction a stored result carried', () => {
    // A history row states the ask it answered, so the value has to survive the boundary
    // read as well as the write.
    const body = { ...SNAPSHOT, results: [{ ...STORED, instruction: '分析 T202601010001' }] }
    expect(parseSnapshot(body)?.results[0]?.instruction).toBe('分析 T202601010001')
  })

  it('refuses a snapshot whose result carries an unusable session id', () => {
    // 重新生成 sends this value back as the session to run in, so a malformed one is
    // refused here rather than offered as a destination.
    for (const sessionId of ['', 7, null]) {
      const body = { ...SNAPSHOT, results: [{ ...STORED, sessionId }] }
      expect(parseSnapshot(body), JSON.stringify(sessionId)).toBeUndefined()
    }
  })

  it('reads a settled run state whose result names its session', () => {
    // The live run state carries the record a run produced, so the page can refine a result
    // that was never re-read from storage — and that record names the session too.
    const state = {
      apiVersion: 1,
      state: {
        cardId: 'skill-card',
        phase: 'settled',
        retried: false,
        result: { ...STORED, sessionId: 'workbench-skill-card-7' },
      },
    }
    expect(parseRunResponse(state)?.result?.sessionId).toBe('workbench-skill-card-7')
  })
})

describe('createWorkbenchSkillCardApi.listFiles', () => {
  /** One route body naming two files and a directory. */
  const LISTED = {
    apiVersion: 1,
    kind: 'directory',
    path: 'docs/设计',
    truncated: false,
    entries: [
      { name: '需求.md', path: 'docs/设计/需求.md', type: 'file', size: 57812 },
      { name: '子目录', path: 'docs/设计/子目录', type: 'directory' },
    ],
  }

  it('asks the files route for this card and this directory, and returns the listing', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(200, LISTED))
    const api = createWorkbenchSkillCardApi({ fetcher })
    const read = await api.listFiles('skill-card', 'docs/设计')
    expect(read).toEqual({ status: 'ok', listing: { path: 'docs/设计', entries: LISTED.entries, truncated: false } })
    const [url] = fetcher.mock.calls[0] ?? []
    // The card is part of the question: a directory path alone names nothing without it.
    expect(String(url).startsWith(WORKBENCH_SKILL_CARD_FILES_PATH)).toBe(true)
    expect(String(url)).toContain('cardId=skill-card')
    expect(String(url)).toContain(`path=${encodeURIComponent('docs/设计')}`)
  })

  it('states a refusal instead of throwing, and keeps the Host’s words', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(403, {
      error: { code: 'outside-workspace', message: 'that path is not in this card’s workspace' },
    }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    await expect(api.listFiles('skill-card', '../etc')).resolves.toEqual({
      status: 'unavailable',
      reason: 'that path is not in this card’s workspace',
    })
  })

  it('reports a body outside the contract rather than listing half of it', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(200, { ...LISTED, truncated: 'no' }))
    const api = createWorkbenchSkillCardApi({ fetcher })
    await expect(api.listFiles('skill-card', 'docs/设计')).resolves.toEqual({
      status: 'unavailable',
      reason: 'listing response did not match the contract',
    })
  })

  it('reports a transport that failed as unavailable, not as an empty directory', async () => {
    const fetcher = vi.fn<FetchLike>(async () => { throw new Error('offline') })
    const api = createWorkbenchSkillCardApi({ fetcher })
    const read = await api.listFiles('skill-card', 'docs/设计')
    expect(read.status).toBe('unavailable')
  })
})