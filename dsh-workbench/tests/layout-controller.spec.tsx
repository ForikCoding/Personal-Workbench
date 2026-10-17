// @vitest-environment jsdom
/**
 * Controller behaviour the page cannot reach through a visible control.
 *
 * The reset action has no button of its own, so it is driven here rather than
 * through the page: removing hiding took away the gesture the page spec used to
 * reach the same store write.
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useWorkbenchLayout } from '../src/client/layout-controller.ts'
import type { WorkbenchLayoutApi } from '../src/client/layout-api.ts'
import type { WorkbenchCardFact } from '../src/client/layout-store.ts'

/** Two cards the ledger declares, one of them already arranged. */
const CARDS: readonly WorkbenchCardFact[] = [
  { id: 'a-card', order: 100, label: 'A card' },
  { id: 'b-card', order: 200, label: 'B card' },
]

/**
 * Build the transport stub.
 * @param snapshot - what the first read returns.
 * @returns the api plus its write spy.
 */
function apiReading(snapshot: { readonly revision: string; readonly entries: readonly { readonly id: string; readonly position?: number }[] }): {
  api: WorkbenchLayoutApi
  write: ReturnType<typeof vi.fn>
} {
  const write = vi.fn(async () => ({ status: 'ok' as const, snapshot: { revision: '1:1', entries: [] } }))
  return {
    write,
    api: {
      read: async () => ({ status: 'ok' as const, snapshot }),
      write: write as unknown as WorkbenchLayoutApi['write'],
    },
  }
}

describe('useWorkbenchLayout', () => {
  it('exposes an ordering-only view', async () => {
    const { api } = apiReading({ revision: '1:0', entries: [] })
    const { result } = renderHook(() => useWorkbenchLayout(CARDS, api, true))
    await waitFor(() => { expect(result.current.view.load).toBe('ready') })
    // Ordering, the drag subject, and the write outcome — nothing about visibility.
    expect(Object.keys(result.current.view).sort()).toEqual(['draggingId', 'load', 'visibleIds', 'write'])
    expect(result.current.view.visibleIds).toEqual(['a-card', 'b-card'])
  })

  it('resets the arrangement by deleting every stored record', async () => {
    const { api, write } = apiReading({ revision: '1:0', entries: [{ id: 'a-card', position: 10 }] })
    const { result } = renderHook(() => useWorkbenchLayout(CARDS, api, true))
    await waitFor(() => { expect(result.current.view.load).toBe('ready') })
    act(() => { result.current.actions.reset() })
    await waitFor(() => { expect(write).toHaveBeenCalledTimes(1) })
    // A reset travels as `{ id }` alone: the Host deletes the record instead of
    // storing a value equal to the default.
    expect(write).toHaveBeenCalledWith({ baseRevision: '1:0', entries: [{ id: 'a-card' }] })
    await waitFor(() => { expect(result.current.view.visibleIds).toEqual(['a-card', 'b-card']) })
  })

  it('offers no hiding operation on its actions', async () => {
    const { api } = apiReading({ revision: '1:0', entries: [] })
    const { result } = renderHook(() => useWorkbenchLayout(CARDS, api, true))
    await waitFor(() => { expect(result.current.view.load).toBe('ready') })
    expect(Object.keys(result.current.actions).sort()).toEqual(['moveBy', 'refresh', 'reorder', 'reset', 'setDragging'])
  })
})
