/** Transport behaviour of the browser-side layout client. */

import { describe, expect, it, vi } from 'vitest'
import { createWorkbenchLayoutApi, parseSnapshot } from '../src/client/layout-api.ts'
import type { FetchLike } from '../src/client/layout-api.ts'
import { WORKBENCH_LAYOUT_PATH } from '../src/layout-contract.ts'

/**
 * Build a JSON response.
 * @param status - HTTP status.
 * @param body - body value.
 * @returns the response.
 */
function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/** Snapshot body the route returns for a stored layout. */
const OK_BODY = { apiVersion: 1, revision: '3:0', entries: [{ id: 'git-repo', position: 1024 }] }

describe('createWorkbenchLayoutApi.read', () => {
  it('returns the parsed snapshot for a contract response', async () => {
    const fetcher = vi.fn(async () => json(200, OK_BODY))
    const api = createWorkbenchLayoutApi({ fetcher })
    await expect(api.read()).resolves.toEqual({
      status: 'ok',
      snapshot: { revision: '3:0', entries: [{ id: 'git-repo', position: 1024 }] },
    })
    expect(fetcher).toHaveBeenCalledWith(WORKBENCH_LAYOUT_PATH, expect.objectContaining({ method: 'GET' }))
  })

  it('reports a mismatched contract version as unavailable', async () => {
    const api = createWorkbenchLayoutApi({ fetcher: async () => json(200, { ...OK_BODY, apiVersion: 2 }) })
    const result = await api.read()
    expect(result.status).toBe('unavailable')
    expect(result.status === 'unavailable' && result.reason).toContain('did not match the contract')
  })

  it('reports a body that is not JSON as unavailable', async () => {
    const api = createWorkbenchLayoutApi({ fetcher: async () => new Response('<html>', { status: 200 }) })
    const result = await api.read()
    expect(result.status).toBe('unavailable')
  })

  it('reports a rejected route as unavailable', async () => {
    const api = createWorkbenchLayoutApi({ fetcher: async () => json(403, { error: { code: 'forbidden', message: 'no' } }) })
    const result = await api.read()
    expect(result.status === 'unavailable' && result.reason).toBe('layout route answered 403')
  })

  it('reports a transport failure as unavailable', async () => {
    const api = createWorkbenchLayoutApi({ fetcher: async () => { throw new Error('offline') } })
    const result = await api.read()
    expect(result.status === 'unavailable' && result.reason).toContain('offline')
  })
})

describe('createWorkbenchLayoutApi.write', () => {
  it('returns the new snapshot and sends only the changed entries', async () => {
    const fetcher = vi.fn<FetchLike>(async () => json(200, { ...OK_BODY, revision: '3:1' }))
    const api = createWorkbenchLayoutApi({ fetcher })
    const result = await api.write({ baseRevision: '3:0', entries: [{ id: 'git-repo', position: 2048 }] })
    expect(result).toEqual({
      status: 'ok',
      snapshot: { revision: '3:1', entries: [{ id: 'git-repo', position: 1024 }] },
    })
    const init = fetcher.mock.calls[0]?.[1]
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(String(init?.body))).toEqual({ baseRevision: '3:0', entries: [{ id: 'git-repo', position: 2048 }] })
  })

  it('reports a 409 as a conflict carrying the current snapshot', async () => {
    const api = createWorkbenchLayoutApi({ fetcher: async () => json(409, { ...OK_BODY, revision: '3:9' }) })
    const result = await api.write({ baseRevision: '3:0', entries: [{ id: 'git-repo', position: 1 }] })
    expect(result).toEqual({
      status: 'conflict',
      snapshot: { revision: '3:9', entries: [{ id: 'git-repo', position: 1024 }] },
    })
  })

  it('reports a conflict whose body is unreadable as a failure', async () => {
    const api = createWorkbenchLayoutApi({ fetcher: async () => new Response('nope', { status: 409 }) })
    const result = await api.write({ baseRevision: '3:0', entries: [] })
    expect(result.status).toBe('failed')
  })

  it('retries one transport failure and then succeeds', async () => {
    let attempt = 0
    const fetcher: FetchLike = async () => {
      attempt += 1
      if (attempt === 1) throw new Error('flaky')
      return json(200, OK_BODY)
    }
    const api = createWorkbenchLayoutApi({ fetcher, delay: async () => {} })
    await expect(api.write({ baseRevision: '3:0', entries: [] })).resolves.toMatchObject({ status: 'ok' })
    expect(attempt).toBe(2)
  })

  it('does not retry a rejected body', async () => {
    let attempt = 0
    const fetcher: FetchLike = async () => {
      attempt += 1
      return json(400, { error: { code: 'invalid-request', message: 'no' } })
    }
    const api = createWorkbenchLayoutApi({ fetcher, delay: async () => {} })
    const result = await api.write({ baseRevision: '3:0', entries: [] })
    expect(result.status).toBe('failed')
    expect(attempt).toBe(1)
  })

  it('reports a 500 as a failure after one retry', async () => {
    let attempt = 0
    const fetcher: FetchLike = async () => {
      attempt += 1
      return json(500, { error: { code: 'storage-failure', message: 'no' } })
    }
    const api = createWorkbenchLayoutApi({ fetcher, delay: async () => {} })
    const result = await api.write({ baseRevision: '3:0', entries: [] })
    expect(result.status === 'failed' && result.reason).toBe('layout route answered 500')
    // A 500 is a transport-shaped failure, so it earns the one retry.
    expect(attempt).toBe(1)
  })

  it('serializes writes so an earlier patch settles first', async () => {
    const seen: string[] = []
    const fetcher: FetchLike = async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { entries: { id: string }[] }
      const id = body.entries[0]?.id ?? ''
      seen.push(`start:${id}`)
      await new Promise(resolve => setTimeout(resolve, id === 'a-card' ? 10 : 0))
      seen.push(`end:${id}`)
      return json(200, OK_BODY)
    }
    const api = createWorkbenchLayoutApi({ fetcher })
    await Promise.all([
      api.write({ baseRevision: '3:0', entries: [{ id: 'a-card', position: 1 }] }),
      api.write({ baseRevision: '3:0', entries: [{ id: 'b-card', position: 2 }] }),
    ])
    expect(seen).toEqual(['start:a-card', 'end:a-card', 'start:b-card', 'end:b-card'])
  })

  it('refuses a write once too many are already pending', async () => {
    const api = createWorkbenchLayoutApi({
      fetcher: async () => await new Promise<Response>(() => {}),
    })
    const pending = Array.from({ length: 8 }, (_value, index) =>
      api.write({ baseRevision: '3:0', entries: [{ id: `card-${String(index)}`, position: index }] }))
    const overflow = await api.write({ baseRevision: '3:0', entries: [{ id: 'card-9', position: 9 }] })
    expect(overflow).toEqual({ status: 'failed', reason: 'too many pending layout changes' })
    void pending
  })
})

describe('parseSnapshot', () => {
  it('rejects bodies outside the contract', () => {
    expect(parseSnapshot(null)).toBeUndefined()
    expect(parseSnapshot([])).toBeUndefined()
    expect(parseSnapshot({ apiVersion: 1, revision: 1, entries: [] })).toBeUndefined()
    expect(parseSnapshot({ apiVersion: 1, revision: '1', entries: 'no' })).toBeUndefined()
    expect(parseSnapshot({ apiVersion: 1, revision: '1', entries: [{ id: 'Bad Id' }] })).toBeUndefined()
    expect(parseSnapshot({ apiVersion: 1, revision: '1', entries: [{ id: 'a-card', position: -1 }] })).toBeUndefined()
  })

  it('accepts a minimal record', () => {
    expect(parseSnapshot({ apiVersion: 1, revision: '1', entries: [{ id: 'a-card' }] }))
      .toEqual({ revision: '1', entries: [{ id: 'a-card' }] })
  })

  it('drops a hidden field a response still carries', () => {
    // The layout record holds ordering only. A body written by an older Host is
    // read without the field, so the card comes back visible.
    expect(parseSnapshot({ apiVersion: 1, revision: '1', entries: [{ id: 'a-card', position: 4, hidden: true }] }))
      .toEqual({ revision: '1', entries: [{ id: 'a-card', position: 4 }] })
  })
})
