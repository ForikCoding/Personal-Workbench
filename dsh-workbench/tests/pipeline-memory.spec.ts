// @vitest-environment jsdom
/**
 * Which pipeline the workbench reopens.
 *
 * The panel is one mount of the page, so the choice has to outlive it: forgetting lands the
 * user on the first stored pipeline every time, which is the bug this answers. The three
 * cases here are the three ways the choice can be decided — a remembered id that is still
 * stored, one that is gone, and none at all.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { pickOpenPipeline, readOpenPipeline, rememberOpenPipeline } from '../src/client/pipeline-memory.ts'
import type { WorkbenchPipeline } from '../src/pipeline-contract.ts'

/**
 * One stored pipeline.
 * @param id - its id.
 * @param updatedAt - when it was last changed.
 * @returns the pipeline.
 */
function pipeline(id: string, updatedAt: number): WorkbenchPipeline {
  return { id, name: id, steps: [], updatedAt }
}

// The app serves one origin, so a case that wrote here would change the next case's answer.
afterEach(() => { globalThis.localStorage?.clear() })

describe('the pipeline the workbench opens', () => {
  it('reopens the one it showed, not the first stored one', () => {
    const stored = [pipeline('pipeline-1', 100), pipeline('pipeline-2', 200)]
    expect(pickOpenPipeline(stored, 'pipeline-2')?.id).toBe('pipeline-2')
    // Storage order is creation order, so "first" would be the older one: the remembered id
    // has to beat it even though it is stored second.
    expect(stored[0]?.id).toBe('pipeline-1')
  })

  it('opens the most recently changed one when nothing was remembered', () => {
    const stored = [pipeline('pipeline-1', 100), pipeline('pipeline-2', 200)]
    expect(pickOpenPipeline(stored, undefined)?.id).toBe('pipeline-2')
  })

  it('opens the most recently changed one when the remembered pipeline is gone', () => {
    const stored = [pipeline('pipeline-1', 100), pipeline('pipeline-2', 200)]
    expect(pickOpenPipeline(stored, 'pipeline-deleted')?.id).toBe('pipeline-2')
  })

  it('has nothing to open when nothing is stored', () => {
    expect(pickOpenPipeline([], 'pipeline-1')).toBeUndefined()
    expect(pickOpenPipeline([], undefined)).toBeUndefined()
  })

  it('keeps the id where a remount can read it back', () => {
    expect(readOpenPipeline()).toBeUndefined()
    rememberOpenPipeline('pipeline-2')
    expect(readOpenPipeline()).toBe('pipeline-2')
    rememberOpenPipeline('pipeline-1')
    expect(readOpenPipeline()).toBe('pipeline-1')
    rememberOpenPipeline('')
    expect(readOpenPipeline()).toBeUndefined()
  })
})
