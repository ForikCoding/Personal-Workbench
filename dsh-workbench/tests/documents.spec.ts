/** @vitest-environment jsdom */
/**
 * The binding a card's own script receives, and what it answers with.
 *
 * The reads are driven through a transport double, so every case states the exact request the
 * script causes: the route's path, the card it names, and the failure it turned into.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { primitivesMock } from './support/primitives-mock.tsx'
import {
  WorkbenchDocumentError,
  createWorkbenchDocumentBinder,
  parseListing,
  parseText,
} from '../src/client/skill-card/documents.ts'
import type { WorkbenchScriptBinding } from '../src/client/skill-card/render.ts'

// The renderer itself belongs to the shared primitives package; this spec pins what the card
// hands it and where the result is mounted.
vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

/**
 * The translator used by every case: the key itself, so an assertion names the sentence the
 * card would show.
 * @param key - dictionary key.
 * @returns the key.
 */
function t(key: string): string {
  return key
}

/**
 * A response double carrying one JSON body.
 * @param status - HTTP status.
 * @param body - the body to serialize.
 * @returns the response.
 */
function answer(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

/** The document element every case renders into. */
let host: HTMLElement

/**
 * Build one binding for a card.
 * @param fetcher - the transport double.
 * @returns the binding the script would receive.
 */
function binding(fetcher: Mock): WorkbenchScriptBinding {
  host = document.createElement('div')
  document.body.append(host)
  const root = host.attachShadow({ mode: 'open' })
  return createWorkbenchDocumentBinder({
    t: t as never,
    fetcher: fetcher as never,
  })({ cardId: 'card-a', runId: 'run-1', root, host })
}

afterEach(() => {
  host?.remove()
})

describe('the document binding', () => {
  it('names the card and the run it was rendered for', () => {
    const seen = binding(vi.fn())
    expect(seen.cardId).toBe('card-a')
    expect(seen.runId).toBe('run-1')
    expect(seen.root).toBeInstanceOf(ShadowRoot)
  })

  it('lists a directory through the route, naming the card and the path', async () => {
    const fetcher = vi.fn(async () => answer(200, {
      apiVersion: 1,
      kind: 'directory',
      path: 'docs',
      entries: [{ name: 'a.md', path: 'docs/a.md', type: 'file', size: 4 }],
      truncated: false,
    }))
    const listing = await binding(fetcher).files.list('docs')
    expect(listing.entries.map(entry => entry.name)).toEqual(['a.md'])
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/workbench/skill-card/files?cardId=card-a&path=docs')
    expect(init.method).toBe('GET')
    expect(init.credentials).toBe('same-origin')
  })

  it('reads a file through the same route', async () => {
    const fetcher = vi.fn(async () => answer(200, {
      apiVersion: 1,
      kind: 'file',
      path: 'docs/a.md',
      text: '# A\n',
      bytes: 4,
    }))
    const file = await binding(fetcher).files.read('docs/a.md')
    expect(file.text).toBe('# A\n')
    expect(file.bytes).toBe(4)
  })

  it('turns a refusal into a sentence the card can show', async () => {
    const fetcher = vi.fn(async () => answer(403, {
      error: { code: 'outside-workspace', message: 'the path is outside the workspace directory' },
    }))
    const failure = await binding(fetcher).files.list('../out').catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(WorkbenchDocumentError)
    expect((failure as WorkbenchDocumentError).code).toBe('outside-workspace')
    expect((failure as Error).message).toContain('documentProblemOutside')
  })

  it('reports a body that is not the contract as unreadable', async () => {
    // The route is a process boundary, so an answer from another build is input, not a value.
    const fetcher = vi.fn(async () => answer(200, { apiVersion: 2, kind: 'directory', path: '', entries: [], truncated: false }))
    const failure = await binding(fetcher).files.list('').catch((error: unknown) => error)
    expect((failure as WorkbenchDocumentError).code).toBe('unreachable')
    expect((failure as Error).message).toContain('documentProblemUnreadable')
  })

  it('reports a transport that never answered', async () => {
    const fetcher = vi.fn(async () => { throw new Error('offline') })
    const failure = await binding(fetcher).files.list('').catch((error: unknown) => error)
    expect((failure as WorkbenchDocumentError).code).toBe('unreachable')
    expect((failure as Error).message).toContain('offline')
  })

  it('renders Markdown into an element of the document, in a shadow root of its own', async () => {
    const seen = binding(vi.fn())
    const target = document.createElement('div')
    seen.root.append(target)
    await seen.markdown.render(target, '# Title\n\nBody text.')
    // The application's Markdown CSS cannot leak out of, or into, the card's own tree; the
    // nested root is what keeps the two apart.
    expect(target.shadowRoot).not.toBeNull()
    await vi.waitFor(() => {
      expect(target.shadowRoot?.textContent).toContain('Title')
    })
  })

  it('accepts only the listing and file bodies the contract describes', () => {
    expect(parseListing({ apiVersion: 1, kind: 'directory', path: '', entries: [], truncated: false }))
      .toEqual({ path: '', entries: [], truncated: false })
    expect(parseListing({ apiVersion: 1, kind: 'file', path: '', text: '', bytes: 0 })).toBeUndefined()
    expect(parseListing({ apiVersion: 1, kind: 'directory', path: '', entries: [{ name: 'a' }], truncated: false }))
      .toBeUndefined()
    expect(parseText({ apiVersion: 1, kind: 'file', path: 'a', text: 'x', bytes: 1 }))
      .toEqual({ path: 'a', text: 'x', bytes: 1 })
    expect(parseText({ apiVersion: 1, kind: 'file', path: 'a', text: 7, bytes: 1 })).toBeUndefined()
  })
})
