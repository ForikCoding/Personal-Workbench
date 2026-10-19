/**
 * The refine run: revising a result the card already produced.
 *
 * A refinement is a card run with a narrower ask. The cases here are about the parts
 * that make that true: the template comes from the stored selection rather than the
 * request, the contract is the same `{ html }`, one retry still applies, and the settled
 * record is stored exactly as a card run's is.
 */

import { describe, expect, it, vi } from 'vitest'
import { WorkbenchSkillCardRunner } from '../src/skill-card-runner.ts'
import type { WorkbenchCardSelection, WorkbenchSkillCardRunnerOptions } from '../src/skill-card-runner.ts'
import type { WorkbenchRunRequest } from '../src/skill-card-contract.ts'
import { renderWorkbenchRefinePrompt } from '../src/skill-card-prompt.ts'
import { AGENT, SKILL, WORKSPACE_PATH, fakeHost } from './support/fake-skill-card-host.ts'
import type { FakeHost, FakeHostOptions } from './support/fake-skill-card-host.ts'

/** A document whose region is the only part a run fills. */
const TEMPLATE = '<h1>任务</h1><!-- template-begin --><!-- template-end -->'

/** A previous result written across several lines, so "verbatim" is observable. */
const PREVIOUS = '<tr>\n  <td>甲</td>\n  <td>乙</td>\n</tr>'

/** One instruction, with a comma in it, so nothing normalizes it on the way. */
const INSTRUCTION = '按时间倒序，保留合计'

/**
 * Build a runner over a fresh fake host.
 * @param options - host behaviour plus the runner settings the cases vary.
 * @returns the runner, the fake host, and what was stored.
 */
function setup(options: FakeHostOptions & {
  selection?: WorkbenchCardSelection
  saveResult?: WorkbenchSkillCardRunnerOptions['saveResult']
} = {}): {
  runner: WorkbenchSkillCardRunner
  fake: FakeHost
  saved: { cardId: string; record: { structured?: unknown } }[]
} {
  const fake = fakeHost(options)
  const saved: { cardId: string; record: { structured?: unknown } }[] = []
  const runner = new WorkbenchSkillCardRunner({
    host: fake.host,
    workingDirectory: fake.workingDirectory,
    statDirectory: fake.statDirectory,
    subagentProvider: 'spawn',
    runTimeoutMs: 5_000,
    maxConcurrentRuns: 1,
    selection: () => options.selection ?? { skill: 'git-repo', template: TEMPLATE, workspace: { path: WORKSPACE_PATH } },
    saveResult: options.saveResult ?? (async (cardId, record) => { saved.push({ cardId, record }) }),
    warn: () => {},
    now: () => 42,
  })
  return { runner, fake, saved }
}

/**
 * A refine run request.
 * @param overrides - fields the case varies.
 * @returns the request.
 */
function refine(overrides: Partial<WorkbenchRunRequest> = {}): WorkbenchRunRequest {
  return {
    cardId: 'skill-card',
    sessionId: AGENT.id,
    mode: { kind: 'refine', instruction: INSTRUCTION, previous: PREVIOUS },
    outputSchema: { type: 'object', properties: {} },
    ...overrides,
  }
}

/**
 * Wait for one card's run to reach a terminal phase.
 * @param runner - the runner.
 * @returns the terminal state.
 */
async function settle(runner: WorkbenchSkillCardRunner): Promise<ReturnType<WorkbenchSkillCardRunner['state']>> {
  await vi.waitFor(() => {
    const phase = runner.state('skill-card')?.phase
    expect(phase === 'settled' || phase === 'cancelled').toBe(true)
  })
  return runner.state('skill-card')
}

describe('the refine prompt', () => {
  it('carries the document, then the previous result, then the request', async () => {
    const prompt = renderWorkbenchRefinePrompt(SKILL, TEMPLATE, PREVIOUS, INSTRUCTION)
    expect(prompt).toContain('<skill_content name="git-repo">')
    expect(prompt).toContain('Inspect the repository and report its state.')
    // The order is the instruction: what to fill, what was there, what to change.
    const document = prompt.indexOf('<output_document>')
    const previous = prompt.indexOf('<previous_result>')
    const request = prompt.indexOf('<revision_request>')
    expect(document).toBeGreaterThan(0)
    expect(previous).toBeGreaterThan(document)
    expect(request).toBeGreaterThan(previous)
    // Every carried value is verbatim, the previous result's newlines included.
    expect(prompt).toContain(`<output_document>\n${TEMPLATE}\n</output_document>`)
    expect(prompt).toContain(`<previous_result>\n${PREVIOUS}\n</previous_result>`)
    expect(prompt).toContain(`<revision_request>\n${INSTRUCTION}\n</revision_request>`)
    // The model-facing line says what "revise" means here, and what comes back.
    expect(prompt).toContain('Revise the previous result above as the revision request asks')
    expect(prompt).toContain('report only the\nregion content through the structured-output tool as `html`')
    expect(prompt).toContain('keep everything else exactly as the previous result wrote it')
    // A run no row triggered carries no row.
    expect(prompt).not.toContain('<row_data>')
  })

  it('carries the row it was given, as the other prompts do', async () => {
    const row = { task_number: 'CP-2025-001' }
    const prompt = renderWorkbenchRefinePrompt(SKILL, TEMPLATE, PREVIOUS, INSTRUCTION, row)
    expect(prompt).toContain(`<row_data>\n${JSON.stringify(row, null, 2)}\n</row_data>`)
    // Data the run acts on arrives before the document it is filling.
    expect(prompt.indexOf('<row_data>')).toBeLessThan(prompt.indexOf('<output_document>'))
  })
})

describe('a refine run', () => {
  it('borrows the template from the stored selection and stores the captured value', async () => {
    // The request does not carry the template: the Host answers "which document" from its
    // own storage, exactly as it does for a card run.
    const { runner, fake, saved } = setup({
      outcomes: [{ output: [{ type: 'text', text: 'ok' }], stopReason: 'completed', structured: { html: '<b>新</b>' } }],
    })
    expect(await runner.start(refine())).toMatchObject({ status: 'started' })
    const state = await settle(runner)

    const spec = fake.activations[0]
    const prompt = spec?.request.prompt[0]?.text ?? ''
    expect(prompt).toContain(`<output_document>\n${TEMPLATE}\n</output_document>`)
    expect(prompt).toContain(`<previous_result>\n${PREVIOUS}\n</previous_result>`)
    expect(prompt).toContain(`<revision_request>\n${INSTRUCTION}\n</revision_request>`)
    // The contract is a card run's, unchanged.
    expect(spec?.request.outputSchema).toEqual({ type: 'object', properties: {} })

    expect(state?.phase).toBe('settled')
    expect(state?.failure).toBeUndefined()
    expect(state?.result?.structured).toEqual({ html: '<b>新</b>' })
    expect(saved).toEqual([{
      cardId: 'skill-card',
      record: {
        skill: 'git-repo',
        executedAt: 42,
        stopReason: 'completed',
        structured: { html: '<b>新</b>' },
        outputText: 'ok',
      },
    }])
  })

  it('refuses a refine run with no template stored', async () => {
    const { runner, fake } = setup({ selection: { skill: 'git-repo', workspace: { path: WORKSPACE_PATH } } })
    expect(await runner.start(refine())).toEqual({
      status: 'rejected',
      code: 'template-missing',
      detail: 'no template is stored for skill "git-repo"',
    })
    expect(fake.activations).toEqual([])
  })

  it('refuses a refine run with no output contract', async () => {
    // A refinement returns a region, so it has a contract to satisfy; without one it
    // would spend a model call before failing.
    const { runner, fake } = setup()
    expect(await runner.start(refine({ outputSchema: undefined }))).toMatchObject({
      status: 'rejected',
      code: 'schema-rejected',
    })
    expect(fake.activations).toEqual([])
  })

  it('retries once when the revision misses its capture', async () => {
    const { runner, fake, saved } = setup({
      outcomes: [
        { output: [{ type: 'text', text: 'sorry' }], stopReason: 'completed' },
        { output: [], stopReason: 'completed', structured: { html: '<b>新</b>' } },
      ],
    })
    await runner.start(refine())
    const state = await settle(runner)
    expect(fake.activations).toHaveLength(2)
    expect(state?.retried).toBe(true)
    expect(state?.result?.structured).toEqual({ html: '<b>新</b>' })
    expect(saved).toHaveLength(1)
  })
})
