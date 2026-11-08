/** Validation of the pipeline wire contract, shared by the route and the service. */

import { describe, expect, it } from 'vitest'
import type { WorkbenchPipeline } from '../src/pipeline-contract.ts'
import {
  WORKBENCH_PIPELINE_MAX_PIPELINES,
  WORKBENCH_PIPELINE_MAX_STEPS,
  WORKBENCH_PIPELINE_NAME_MAX_LENGTH,
  WORKBENCH_PIPELINE_RUN_STEP_HTML_MAX_LENGTH,
  WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH,
  isWorkbenchPipelineId,
  parseWorkbenchPipelineRunDraft,
  parseWorkbenchPipelines,
} from '../src/pipeline-contract.ts'

/** One well-formed pipeline. */
function pipeline(overrides: Partial<WorkbenchPipeline> = {}): WorkbenchPipeline {
  return { id: 'pipeline-1', name: '发布检查', steps: [{ cardId: 'card-1' }], updatedAt: 1, ...overrides }
}

/**
 * Assert that a list is refused with a reason mentioning a fragment.
 * @param value - candidate list.
 * @param fragment - text the reason must contain.
 */
function expectRefused(value: unknown, fragment: string): void {
  const parsed = parseWorkbenchPipelines(value)
  expect('status' in parsed).toBe(true)
  if (!('status' in parsed)) return
  expect(parsed.reason).toContain(fragment)
}

describe('pipeline contract', () => {
  it('accepts a pipeline id shaped like a card id', () => {
    expect(isWorkbenchPipelineId('pipeline-1')).toBe(true)
    expect(isWorkbenchPipelineId('a')).toBe(true)
    expect(isWorkbenchPipelineId('Pipeline-1')).toBe(false)
    expect(isWorkbenchPipelineId('-pipeline')).toBe(false)
    expect(isWorkbenchPipelineId('')).toBe(false)
    expect(isWorkbenchPipelineId('x'.repeat(65))).toBe(false)
  })

  it('normalizes a well-formed list', () => {
    const parsed = parseWorkbenchPipelines([pipeline()])
    expect('status' in parsed).toBe(false)
    expect(parsed).toEqual([{ id: 'pipeline-1', name: '发布检查', steps: [{ cardId: 'card-1' }], updatedAt: 1 }])
  })

  it('trims a name and a step instruction', () => {
    const parsed = parseWorkbenchPipelines([pipeline({
      name: '  发布检查  ',
      steps: [{ cardId: 'card-1', instruction: '  看测试  ' }],
    })])
    expect(parsed).toEqual([{
      id: 'pipeline-1',
      name: '发布检查',
      steps: [{ cardId: 'card-1', instruction: '看测试' }],
      updatedAt: 1,
    }])
  })

  it('reads a blank instruction as none', () => {
    // An empty block would reach the prompt as "the user asked for nothing", which is a
    // different statement from "this step adds nothing to its card".
    const parsed = parseWorkbenchPipelines([pipeline({ steps: [{ cardId: 'card-1', instruction: '   ' }] })])
    expect(parsed).toEqual([{ id: 'pipeline-1', name: '发布检查', steps: [{ cardId: 'card-1' }], updatedAt: 1 }])
  })

  it('accepts an empty pipeline and an empty set', () => {
    expect(parseWorkbenchPipelines([])).toEqual([])
    expect(parseWorkbenchPipelines([pipeline({ steps: [] })])).toEqual([
      { id: 'pipeline-1', name: '发布检查', steps: [], updatedAt: 1 },
    ])
  })

  it('refuses a value that is not a list', () => {
    expectRefused(undefined, 'pipelines must be an array')
    expectRefused({}, 'pipelines must be an array')
  })

  it('refuses more pipelines than the contract allows', () => {
    const many = Array.from({ length: WORKBENCH_PIPELINE_MAX_PIPELINES + 1 }, (_unused, index) => (
      pipeline({ id: `pipeline-${String(index)}` })
    ))
    expectRefused(many, 'a workspace may hold')
  })

  it('refuses a duplicated pipeline id', () => {
    expectRefused([pipeline(), pipeline()], 'appears twice')
  })

  it('refuses a malformed pipeline', () => {
    expectRefused([1], 'must be an object')
    expectRefused([{ ...pipeline(), id: 'Not An Id' }], 'namespaced id')
    expectRefused([{ ...pipeline(), name: '' }], 'non-empty name')
    expectRefused([{ ...pipeline(), name: 'x'.repeat(WORKBENCH_PIPELINE_NAME_MAX_LENGTH + 1) }], 'longer than')
    expectRefused([{ ...pipeline(), updatedAt: -1 }], 'finite updatedAt')
    expectRefused([{ ...pipeline(), updatedAt: 'now' }], 'finite updatedAt')
    expectRefused([{ ...pipeline(), steps: 'none' }], 'steps array')
  })

  it('refuses more steps than the contract allows', () => {
    const steps = Array.from({ length: WORKBENCH_PIPELINE_MAX_STEPS + 1 }, () => ({ cardId: 'card-1' }))
    expectRefused([pipeline({ steps })], 'above the')
  })

  it('refuses a malformed step', () => {
    expectRefused([pipeline({ steps: [1 as unknown as { cardId: string }] })], 'must be an object')
    expectRefused([pipeline({ steps: [{ cardId: 'Card 1' }] })], 'needs a card id')
    expectRefused([pipeline({ steps: [{ cardId: 'card-1', instruction: 1 as unknown as string }] })], 'non-string instruction')
    expectRefused(
      [pipeline({ steps: [{ cardId: 'card-1', instruction: 'x'.repeat(WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH + 1) }] })],
      'longer than',
    )
  })
})

describe('pipeline execution contract', () => {
  /** One execution as the run engine hands it over. */
  function draft(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      pipelineId: 'pipeline-1',
      startedAt: 1_000,
      tookMs: 2_000,
      phase: 'settled',
      scope: 'full',
      steps: [{ cardId: 'card-1', phase: 'done', tookMs: 2_000, html: '<p>done</p>' }],
      ...overrides,
    }
  }

  /**
   * Assert that an execution is refused with a reason mentioning a fragment.
   * @param value - candidate execution.
   * @param fragment - text the reason must contain.
   */
  function expectRefused(value: unknown, fragment: string): void {
    const parsed = parseWorkbenchPipelineRunDraft(value)
    expect('status' in parsed).toBe(true)
    if (!('status' in parsed)) return
    expect(parsed.reason).toContain(fragment)
  }

  it('accepts an execution and keeps only what it names', () => {
    expect(parseWorkbenchPipelineRunDraft({ ...draft(), colour: 'red' })).toEqual(draft())
  })

  it('does not accept a number, which the store assigns', () => {
    const parsed = parseWorkbenchPipelineRunDraft({ ...draft(), no: 4 })
    expect(parsed).not.toHaveProperty('no')
  })

  it('refuses an execution that names no pipeline', () => {
    expectRefused(draft({ pipelineId: 42 }), 'pipelineId must be a pipeline id')
    expectRefused(draft({ pipelineId: 'Pipeline 1' }), 'pipelineId must be a pipeline id')
    expectRefused(draft({ startedAt: -1 }), 'startedAt must be a non-negative number')
    expectRefused(draft({ tookMs: 'fast' }), 'tookMs must be a non-negative number')
    expectRefused(draft({ phase: 'running' }), 'phase must be settled, failed, or stopped')
    expectRefused(draft({ scope: 'everything' }), 'scope must be full, single, or refine')
    expectRefused(draft({ only: -1 }), 'only must be a zero-based step index')
    expectRefused(draft({ from: -1 }), 'from must be a zero-based step index')
    expectRefused(draft({ from: 1.5 }), 'from must be a zero-based step index')
    expectRefused(draft({ instruction: 7 }), 'instruction must be a string')
  })

  it('keeps where a whole run began, and leaves it out when it began at the first step', () => {
    // Two records — one that took every step, one that took the last two — used to read
    // identically; the steps the second left alone then looked like steps it replaced.
    expect(parseWorkbenchPipelineRunDraft(draft({ from: 1 }))).toEqual(draft({ from: 1 }))
    expect(parseWorkbenchPipelineRunDraft(draft({ from: 0 }))).toEqual(draft({ from: 0 }))
    const absent = parseWorkbenchPipelineRunDraft(draft())
    expect(absent).toEqual(draft())
    expect(absent).not.toHaveProperty('from')
  })

  it('refuses a step that never ended, and one that names no card', () => {
    expectRefused(draft({ steps: [{ cardId: 'card-1', phase: 'running' }] }), 'phase must be done, failed, or stopped')
    expectRefused(draft({ steps: [{ cardId: 'Card 1', phase: 'done' }] }), 'does not name a card')
    expectRefused(draft({ steps: [{ cardId: 'card-1', phase: 'done', tookMs: -1 }] }), 'tookMs must be a non-negative number')
    expectRefused(draft({ steps: [{ cardId: 'card-1', phase: 'done', failure: 1 }] }), 'failure must be a string')
    expectRefused(draft({ steps: [{ cardId: 'card-1', phase: 'done', html: 1 }] }), 'html must be a string')
    expectRefused(draft({ steps: 'none' }), 'steps must be an array')
  })

  it('refuses a region longer than a record keeps', () => {
    const html = 'x'.repeat(WORKBENCH_PIPELINE_RUN_STEP_HTML_MAX_LENGTH + 1)
    expectRefused(draft({ steps: [{ cardId: 'card-1', phase: 'done', html }] }), 'html is longer than')
  })

  it('refuses more steps than a pipeline may have', () => {
    const steps = Array.from({ length: WORKBENCH_PIPELINE_MAX_STEPS + 1 }, () => ({ cardId: 'card-1', phase: 'done' }))
    expectRefused(draft({ steps }), 'is not a pipeline')
  })
})
