/** Validation of the pipeline wire contract, shared by the route and the service. */

import { describe, expect, it } from 'vitest'
import type { WorkbenchPipeline } from '../src/pipeline-contract.ts'
import {
  WORKBENCH_PIPELINE_MAX_PIPELINES,
  WORKBENCH_PIPELINE_MAX_STEPS,
  WORKBENCH_PIPELINE_NAME_MAX_LENGTH,
  WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH,
  isWorkbenchPipelineId,
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
