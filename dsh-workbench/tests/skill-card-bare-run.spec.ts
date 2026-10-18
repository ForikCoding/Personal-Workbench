/**
 * The bare run: a skill target's lightweight execution.
 *
 * A bare run exists to answer one question — did it work — so the cases here are about
 * what it deliberately does not do: no document travels, no contract is asked for, and
 * nothing is stored.
 */

import { describe, expect, it, vi } from 'vitest'
import { WorkbenchSkillCardRunner } from '../src/skill-card-runner.ts'
import type { WorkbenchCardSelection, WorkbenchSkillCardRunnerOptions } from '../src/skill-card-runner.ts'
import type { WorkbenchRunRequest } from '../src/skill-card-contract.ts'
import { AGENT, fakeHost } from './support/fake-skill-card-host.ts'
import type { FakeHost, FakeHostOptions } from './support/fake-skill-card-host.ts'

/**
 * Build a runner over a fresh fake host.
 * @param options - host behaviour plus the runner settings the cases vary.
 * @returns the runner, the fake host, what was stored, and the warnings.
 */
function setup(options: FakeHostOptions & {
  selection?: WorkbenchCardSelection
  runTimeoutMs?: number
  saveResult?: WorkbenchSkillCardRunnerOptions['saveResult']
} = {}): {
  runner: WorkbenchSkillCardRunner
  fake: FakeHost
  saved: { cardId: string; record: unknown }[]
  warnings: string[]
} {
  const fake = fakeHost(options)
  const saved: { cardId: string; record: unknown }[] = []
  const warnings: string[] = []
  const runner = new WorkbenchSkillCardRunner({
    host: fake.host,
    workingDirectory: fake.workingDirectory,
    subagentProvider: 'spawn',
    runTimeoutMs: options.runTimeoutMs ?? 5_000,
    maxConcurrentRuns: 1,
    selection: () => options.selection ?? { skill: 'git-repo', template: '<b>x</b>' },
    saveResult: options.saveResult ?? (async (cardId, record) => { saved.push({ cardId, record }) }),
    warn: (message) => { warnings.push(message) },
    now: () => 42,
  })
  return { runner, fake, saved, warnings }
}

/**
 * A bare run request.
 * @param overrides - fields the case varies.
 * @returns the request.
 */
function bare(overrides: Partial<WorkbenchRunRequest> = {}): WorkbenchRunRequest {
  return {
    cardId: 'skill-card',
    sessionId: AGENT.id,
    mode: { kind: 'bare', skill: 'git-repo' },
    ...overrides,
  }
}

/**
 * A card run request, for the cases that contrast the two modes.
 * @returns the request.
 */
function card(): WorkbenchRunRequest {
  return {
    cardId: 'skill-card',
    sessionId: AGENT.id,
    mode: { kind: 'card' },
    outputSchema: { type: 'object', properties: {} },
  }
}

/**
 * Wait for one card's run to reach a terminal phase.
 * @param runner - the runner.
 * @param cardId - the card.
 * @returns the terminal state.
 */
async function settle(
  runner: WorkbenchSkillCardRunner,
  cardId = 'skill-card',
): Promise<ReturnType<WorkbenchSkillCardRunner['state']>> {
  await vi.waitFor(() => {
    const phase = runner.state(cardId)?.phase
    expect(phase === 'settled' || phase === 'cancelled').toBe(true)
  })
  return runner.state(cardId)
}

describe('a bare skill run', () => {
  it('carries the skill and the task line, with no document', async () => {
    // Criterion 27: no template travels. The stored selection is not even consulted —
    // a skill target is its own skill, which need not be the card's.
    const { runner, fake, saved } = setup({ selection: {} })
    expect(runner.start(bare())).toMatchObject({ status: 'started' })
    const state = await settle(runner)

    const request = fake.activations[0]?.request
    const prompt = request?.prompt[0]?.text ?? ''
    expect(prompt).toContain('<skill_content name="git-repo">')
    expect(prompt).toContain('Inspect the repository and report its state.')
    expect(prompt).toContain('Apply the skill above to the current workspace now.')
    expect(prompt).not.toContain('<output_document>')
    // No contract at all: the seam treats absence as "nothing to capture".
    expect(request).not.toHaveProperty('outputSchema')

    // Criterion 28: nothing is stored.
    expect(state?.phase).toBe('settled')
    expect(state?.failure).toBeUndefined()
    expect(saved).toEqual([])
  })

  it('keeps neither the output text nor a structured value', async () => {
    // A verdict is all a skill target shows, so nothing else may be reachable from the
    // record it settles with.
    const { runner, saved } = setup({
      outcomes: [{ output: [{ type: 'text', text: 'I did the thing' }], stopReason: 'completed' }],
    })
    runner.start(bare())
    const state = await settle(runner)
    expect(state?.result).toEqual({ skill: 'git-repo', executedAt: 42, stopReason: 'completed' })
    expect(saved).toEqual([])
  })

  it('runs on a backend that cannot return structured output', async () => {
    // A bare run asks for no value, so the capability is not required — but a card run
    // on the same backend still is.
    const bareSetup = setup({ providers: { spawn: { outputSchema: false } } })
    expect(bareSetup.runner.start(bare())).toMatchObject({ status: 'started' })
    await settle(bareSetup.runner)

    const cardSetup = setup({ providers: { spawn: { outputSchema: false } } })
    expect(cardSetup.runner.start(card())).toMatchObject({
      status: 'rejected',
      code: 'provider-unavailable',
    })
    expect(cardSetup.fake.activations).toEqual([])
  })

  it('reports the child failure the seam discards as the diagnostic', async () => {
    // Criterion 29: `agent/error` is a failure with its own text, and the host bus is
    // the only place that text exists.
    const { runner, fake, saved } = setup({ outcomes: ['manual'] })
    runner.start(bare())
    const claimChild = async (): Promise<void> => {
      for (let tick = 0; tick < 50; tick += 1) await Promise.resolve()
    }
    await claimChild()
    expect(fake.activations).toHaveLength(1)
    runner.observeAgentError('child', new Error('the model call was rejected'))
    fake.settleChild({ output: [], stopReason: 'error' })
    const state = await settle(runner)

    expect(state?.phase).toBe('settled')
    expect(state?.failureCode).toBe('run-failed')
    expect(state?.failure).toBe('the skill run ended as error: the model call was rejected')
    expect(state?.result?.diagnostic).toBe('the model call was rejected')
    expect(saved).toEqual([])
  })

  it('treats the deadline as a failure with a reason', async () => {
    // Criterion 29: a timeout is a failure. A bare run has no cancel control, so the
    // deadline is the only thing that can end one early.
    const { runner, fake } = setup({ outcomes: ['hang'], runTimeoutMs: 10 })
    runner.start(bare())
    const state = await settle(runner)
    expect(state?.phase).toBe('settled')
    expect(state?.failureCode).toBe('run-failed')
    expect(state?.failure).toBe('the skill run timed out')
    expect(fake.activations).toHaveLength(1)
  })

  it('is not retried', async () => {
    // The retry exists for a missed structured capture. A bare run has no capture, so
    // repeating it would spend another model call for the same verdict.
    const { runner, fake } = setup({
      outcomes: [{ output: [], stopReason: 'refusal' }],
    })
    runner.start(bare())
    const state = await settle(runner)
    expect(fake.activations).toHaveLength(1)
    expect(state?.failure).toBe('the skill run ended as refusal')
  })
})
