/** Execution behaviour of the skill card runner across every precondition and outcome. */

import { describe, expect, it, vi } from 'vitest'
import { WorkbenchSkillCardRunner } from '../src/skill-card-runner.ts'
import type { WorkbenchCardSelection, WorkbenchSkillCardRunnerOptions } from '../src/skill-card-runner.ts'
import type { WorkbenchRunRequest } from '../src/skill-card-contract.ts'
import type { WorkbenchSubagentResult } from '../src/skill-card-host.ts'
import { AGENT, fakeHost } from './support/fake-skill-card-host.ts'
import type { FakeHost, FakeHostOptions } from './support/fake-skill-card-host.ts'

/** Build a runner over a fresh fake host. */
function setup(options: FakeHostOptions & {
  selection?: WorkbenchCardSelection
  runTimeoutMs?: number
  maxConcurrentRuns?: number
  saveResult?: WorkbenchSkillCardRunnerOptions['saveResult']
  /** Omit the service to exercise the session-header fallback. */
  withoutWorkingDirectory?: boolean
} = {}): {
  runner: WorkbenchSkillCardRunner
  fake: FakeHost
  saved: { cardId: string; record: { stopReason: string; structured?: unknown } }[]
  warnings: string[]
} {
  const fake = fakeHost(options)
  const saved: { cardId: string; record: { stopReason: string; structured?: unknown } }[] = []
  const warnings: string[] = []
  const runner = new WorkbenchSkillCardRunner({
    host: fake.host,
    ...options.withoutWorkingDirectory === true ? {} : { workingDirectory: fake.workingDirectory },
    subagentProvider: 'spawn',
    runTimeoutMs: options.runTimeoutMs ?? 5_000,
    maxConcurrentRuns: options.maxConcurrentRuns ?? 1,
    selection: () => options.selection ?? { skill: 'git-repo', template: '<b>{{a}}</b>' },
    saveResult: options.saveResult ?? (async (cardId, record) => { saved.push({ cardId, record }) }),
    warn: (message) => { warnings.push(message) },
    now: () => 42,
  })
  return { runner, fake, saved, warnings }
}

/** A run request that passes every precondition. */
function request(overrides: Partial<WorkbenchRunRequest> = {}): WorkbenchRunRequest {
  return {
    cardId: 'skill-card',
    sessionId: AGENT.id,
    mode: { kind: 'card' },
    outputSchema: { type: 'object', properties: {} },
    ...overrides,
  }
}

/**
 * Wait for one card's run to reach a terminal phase.
 * @param runner - the runner.
 * @param cardId - the card.
 * @returns the terminal state.
 */
async function settle(runner: WorkbenchSkillCardRunner, cardId = 'skill-card'): Promise<ReturnType<WorkbenchSkillCardRunner['state']>> {
  await vi.waitFor(() => {
    const phase = runner.state(cardId)?.phase
    expect(phase === 'settled' || phase === 'cancelled').toBe(true)
  })
  return runner.state(cardId)
}

describe('workbench skill card runner', () => {
  describe('catalog', () => {
    it('reads the global layer when no session is live', async () => {
      // A booted app has no live agent. The Desktop layer mounts a host-plane skill
      // provider for exactly this case, so the read goes scope-less rather than
      // refusing: refusing is what left the picker empty for a first-run user.
      const { runner } = setup({ live: false })
      await expect(runner.catalog(undefined)).resolves.toMatchObject({
        status: 'ok',
        entries: [{ name: 'git-repo' }, { name: 'hidden' }],
      })
    })

    it('reads the global layer when the named session is cold', async () => {
      const { runner } = setup({ live: false })
      await expect(runner.catalog('nobody-opened-this')).resolves.toMatchObject({ status: 'ok' })
    })

    it('prefers the live agent scope the run will use', async () => {
      const { runner } = setup()
      await expect(runner.catalog('session-1')).resolves.toMatchObject({ status: 'ok' })
    })

    it('reads through the agent scope and carries the invocation flag', async () => {
      const { runner, fake } = setup()
      await expect(runner.catalog('session-1')).resolves.toEqual({
        status: 'ok',
        entries: [
          { name: 'git-repo', description: 'git-repo description', userInvocable: true },
          { name: 'hidden', description: 'hidden description', userInvocable: false },
        ],
      })
      // The scope is what selects the agent's layers: a scope-less read returns
      // the global layer, which carries no provider in the shipped composition.
      expect(fake.lookups[0]?.scope).toBe(AGENT)
      expect(fake.lookups[0]?.cwd).toBe('/repo')
    })

    it('falls back to the session header when the channel has no service', async () => {
      // The stable channel pins a harness that predates the working-directory
      // service, so omitting it must still resolve a directory.
      const { runner, fake } = setup({ withoutWorkingDirectory: true })
      await runner.catalog('session-1')
      expect(fake.lookups[0]?.cwd).toBe('/header-repo')
    })

    it('reports an upstream failure instead of an empty list', async () => {
      const { runner, warnings } = setup({ throwsOn: 'list' })
      await expect(runner.catalog('session-1')).resolves.toEqual({
        status: 'failed',
        code: 'catalog-failed',
        detail: 'registry unavailable',
      })
      expect(warnings).toEqual(['workbench skill card catalog failed: registry unavailable'])
    })
  })

  describe('start preconditions', () => {
    it('refuses a run with no output contract', () => {
      const { runner, fake } = setup()
      expect(runner.start(request({ outputSchema: undefined }))).toEqual({
        status: 'rejected',
        code: 'schema-rejected',
        detail: 'the run carried no object-rooted output contract',
      })
      expect(fake.activations).toEqual([])
    })

    it('refuses a contract that is not object-rooted', () => {
      const { runner } = setup()
      expect(runner.start(request({ outputSchema: { type: 'array' } }))).toMatchObject({
        status: 'rejected',
        code: 'schema-rejected',
      })
      expect(runner.start(request({ outputSchema: 'not a schema' }))).toMatchObject({
        status: 'rejected',
        code: 'schema-rejected',
      })
    })

    it('refuses a card with no skill selected', () => {
      const { runner } = setup({ selection: {} })
      expect(runner.start(request())).toEqual({
        status: 'rejected',
        code: 'not-configured',
        detail: 'no skill is configured for this card',
      })
    })

    it('refuses a card with no template for its skill', () => {
      const { runner } = setup({ selection: { skill: 'git-repo' } })
      expect(runner.start(request())).toEqual({
        status: 'rejected',
        code: 'template-missing',
        detail: 'no template is stored for skill "git-repo"',
      })
    })

    it('refuses a session with no live agent', () => {
      const { runner } = setup({ live: false })
      expect(runner.start(request())).toMatchObject({ status: 'rejected', code: 'session-not-live' })
    })

    it('refuses an unregistered or incapable backend', () => {
      const missing = setup({ providers: {} })
      expect(missing.runner.start(request())).toMatchObject({ status: 'rejected', code: 'provider-unavailable' })

      const incapable = setup({ providers: { spawn: { outputSchema: false } } })
      expect(incapable.runner.start(request())).toMatchObject({ status: 'rejected', code: 'provider-unavailable' })
    })

    it('refuses a second run for the same card', async () => {
      const { runner } = setup({ outcomes: ['hang'] })
      expect(runner.start(request()).status).toBe('started')
      expect(runner.start(request())).toEqual({
        status: 'rejected',
        code: 'run-in-progress',
        detail: 'another run is already in flight',
      })
      runner.cancel('skill-card')
      await settle(runner)
    })

    it('refuses a run once the global concurrency limit is reached', async () => {
      const { runner } = setup({ outcomes: ['hang'] })
      expect(runner.start(request()).status).toBe('started')
      expect(runner.start(request({ cardId: 'other-card' }))).toMatchObject({
        status: 'rejected',
        code: 'run-in-progress',
      })
      runner.cancel('skill-card')
      await settle(runner)
    })
  })

  describe('execution', () => {
    it('runs the skill through a child and stores the captured value', async () => {
      const { runner, fake, saved } = setup({
        outcomes: [{ output: [{ type: 'text', text: 'done' }], stopReason: 'completed', structured: { branch: 'main' } }],
      })
      const started = runner.start(request())
      expect(started).toEqual({
        status: 'started',
        state: { cardId: 'skill-card', phase: 'running', startedAt: 42, retried: false },
      })

      const state = await settle(runner)
      expect(state).toEqual({
        cardId: 'skill-card',
        phase: 'settled',
        startedAt: 42,
        retried: false,
        result: {
          skill: 'git-repo',
          executedAt: 42,
          stopReason: 'completed',
          structured: { branch: 'main' },
          outputText: 'done',
        },
      })
      expect(saved).toEqual([{
        cardId: 'skill-card',
        record: {
          skill: 'git-repo',
          executedAt: 42,
          stopReason: 'completed',
          structured: { branch: 'main' },
          outputText: 'done',
        },
      }])
      expect(fake.disposed.count).toBe(1)
    })

    it('sends the canonical skill wrapper and inherits the agent scope', async () => {
      const { runner, fake } = setup()
      runner.start(request())
      await settle(runner)

      const spec = fake.activations[0]
      expect(spec?.provider).toBe('spawn')
      expect(spec?.delivery).toBe('caller')
      expect(spec?.request.parent).toBe(AGENT)
      expect(spec?.request.cwd).toBe('/repo')
      expect(spec?.request.outputSchema).toEqual({ type: 'object', properties: {} })
      // Omitting these is how the run inherits the session's model and tools.
      expect(spec?.request).not.toHaveProperty('agentOptions')
      expect(spec?.request).not.toHaveProperty('toolFilter')
      const prompt = spec?.request.prompt[0]?.text ?? ''
      expect(prompt).toContain('<skill_content name="git-repo">')
      expect(prompt).toContain('Base directory for this skill: /repo/.agents/skills/git-repo')
      expect(prompt).toContain('Inspect the repository and report its state.')
      expect(prompt).toContain('Apply the skill above to the current workspace now.')
      // The whole document travels: the region markers say what to fill, and the
      // comments around them say how. The contract carries no field list at all.
      expect(prompt).toContain('<output_document>')
      expect(prompt).toContain('<b>{{a}}</b>')
      expect(prompt).toContain('report only that part through the structured-output tool as `html`')
    })

    it('carries the whole document, comments and chrome included', async () => {
      // Only the region comes back, so the model needs the frame around it to know what
      // the region is for. Parsing the document here would delete the comments, which
      // are the instruction.
      const template = [
        '<html><head><style>body{color:red}</style></head><body>',
        '<h1>今日任务</h1>',
        '<!-- template-begin -->',
        '<!-- 每行一个任务，按状态映射表把状态码译成中文 -->',
        '<tr><td>{{num}}</td></tr>',
        '<!-- template-end -->',
        '</body></html>',
      ].join('\n')
      const { runner, fake } = setup({ selection: { skill: 'git-repo', template } })
      runner.start(request())
      await settle(runner)
      const prompt = fake.activations[0]?.request.prompt[0]?.text ?? ''
      expect(prompt).toContain('<tr><td>{{num}}</td></tr>')
      expect(prompt).toContain('<!-- 每行一个任务，按状态映射表把状态码译成中文 -->')
      expect(prompt).toContain('body{color:red}')
      expect(prompt).toContain('<h1>今日任务</h1>')
      expect(prompt).toContain('Everything outside that region is kept exactly as written')
    })

    it('retries once when the child returns no usable value', async () => {
      const { runner, fake, saved } = setup({
        outcomes: [
          { output: [{ type: 'text', text: 'sorry' }], stopReason: 'completed' },
          { output: [{ type: 'text', text: 'ok' }], stopReason: 'completed', structured: { branch: 'main' } },
        ],
      })
      runner.start(request())
      const state = await settle(runner)

      expect(fake.activations).toHaveLength(2)
      expect(state?.retried).toBe(true)
      expect(state?.failure).toBeUndefined()
      expect(state?.result?.structured).toEqual({ branch: 'main' })
      expect(saved).toHaveLength(1)
    })

    it('does not claim the child answered when nothing was stored', async () => {
      // A block that carries a `text` field but is not a text block would satisfy a
      // looser check while `outputText` stays empty — the message then contradicted
      // the evidence displayed right underneath it.
      const { runner } = setup({
        outcomes: [{ output: [{ type: 'thinking', text: 'weighing options' }], stopReason: 'completed' }],
      })
      runner.start(request())
      const state = await settle(runner)
      expect(state?.failure).toBe('the run finished without a value matching the contract')
      expect(state?.result?.outputText).toBeUndefined()
    })

    it('records the child failure the seam discards', async () => {
      // The seam rewrites a faulted child to `stopReason: 'error'` and throws the error
      // away, so the host bus reading is the only account of what actually went wrong.
      // A faulted child is retryable, so both attempts are scripted by hand.
      const { runner, fake } = setup({ outcomes: ['manual', 'manual'] })
      const claimChild = async (): Promise<void> => {
        for (let tick = 0; tick < 50; tick += 1) await Promise.resolve()
      }
      runner.start(request())
      await claimChild()
      expect(fake.activations).toHaveLength(1)
      runner.observeAgentError('child', new Error('the model call was rejected'))
      fake.settleChild({ output: [], stopReason: 'error' })
      await claimChild()
      expect(fake.activations).toHaveLength(2)
      runner.observeAgentError('child', new Error('the model call was rejected'))
      fake.settleChild({ output: [], stopReason: 'error' })
      const state = await settle(runner)
      expect(state?.failure).toBe('the run ended as error: the model call was rejected')
      expect(state?.result?.diagnostic).toBe('the model call was rejected')
    })

    it('ignores a failure from an agent this runner did not start', async () => {
      const { runner, fake } = setup({ outcomes: ['manual', 'manual'] })
      const claimChild = async (): Promise<void> => {
        for (let tick = 0; tick < 50; tick += 1) await Promise.resolve()
      }
      runner.start(request())
      await claimChild()
      runner.observeAgentError('some-other-agent', new Error('unrelated'))
      fake.settleChild({ output: [], stopReason: 'error' })
      await claimChild()
      fake.settleChild({ output: [], stopReason: 'error' })
      const state = await settle(runner)
      expect(state?.failure).toBe('the run ended as error')
      expect(state?.result?.diagnostic).toBeUndefined()
    })

    it('names a child that answered without reporting a structured result', async () => {
      const { runner, fake, saved } = setup({
        outcomes: [
          { output: [{ type: 'text', text: 'first' }], stopReason: 'completed' },
          { output: [{ type: 'text', text: 'second' }], stopReason: 'completed' },
        ],
      })
      runner.start(request())
      const state = await settle(runner)

      expect(fake.activations).toHaveLength(2)
      expect(state?.failureCode).toBe('run-failed')
      // The child produced prose, so it did not fault: it never called the reporting
      // tool. Saying "the run ended as error" here sent the reader looking for a fault
      // that does not exist.
      expect(state?.failure).toBe('the child answered without reporting a structured result')
      // The unusable result is still kept: "view raw output" needs the text.
      expect(state?.result?.outputText).toBe('second')
      expect(saved).toHaveLength(1)
    })

    it('carries a provider diagnostic into the failure', async () => {
      const failed: WorkbenchSubagentResult = { output: [], stopReason: 'error', diagnostic: 'provider exploded' }
      // The seam reports a missed capture as `error` too, so this is retried once
      // before the run is called failed.
      const { runner, fake } = setup({ outcomes: [failed, failed] })
      runner.start(request())
      const state = await settle(runner)
      expect(fake.activations).toHaveLength(2)
      expect(state?.failure).toBe('the run ended as error: provider exploded')
    })

    it('does not repeat a child that refused or hit its ceiling', async () => {
      for (const stopReason of ['refusal', 'max-tokens']) {
        const { runner, fake } = setup({ outcomes: [{ output: [], stopReason }] })
        runner.start(request())
        const state = await settle(runner)
        expect(state?.failure).toBe(`the run ended as ${stopReason}`)
        expect(fake.activations).toHaveLength(1)
      }
    })

    it('reports a skill that is no longer available', async () => {
      const { runner, fake } = setup({ definitions: {} })
      runner.start(request())
      const state = await settle(runner)
      expect(fake.activations).toEqual([])
      expect(state).toMatchObject({
        phase: 'settled',
        failureCode: 'skill-not-found',
        failure: 'skill "git-repo" is not available to this session',
      })
    })

    it('reports an upstream resolution failure as a run failure', async () => {
      const { runner, warnings } = setup({ throwsOn: 'ensure' })
      runner.start(request())
      const state = await settle(runner)
      expect(state).toMatchObject({ phase: 'settled', failureCode: 'run-failed', failure: 'no working directory' })
      expect(warnings).toEqual(['workbench skill card run failed: no working directory'])
    })

    it('keeps the result when storing it fails', async () => {
      const { runner, warnings } = setup({
        saveResult: async () => { throw new Error('disk full') },
      })
      runner.start(request())
      const state = await settle(runner)
      expect(state?.phase).toBe('settled')
      expect(state?.result?.structured).toEqual({ a: '1' })
      expect(warnings).toEqual(['workbench skill card result could not be stored: disk full'])
    })
  })

  describe('cancellation and timeouts', () => {
    it('cancels an in-flight run without retrying', async () => {
      const { runner, fake } = setup({ outcomes: ['hang'] })
      runner.start(request())
      expect(runner.cancel('skill-card')).toBe(true)

      const state = await settle(runner)
      expect(state).toMatchObject({ phase: 'cancelled', failure: 'the run was cancelled', retried: false })
      expect(fake.activations).toHaveLength(1)
    })

    it('ignores a cancel for a card with no run in flight', async () => {
      const { runner } = setup()
      expect(runner.cancel('skill-card')).toBe(false)
      runner.start(request())
      await settle(runner)
      expect(runner.cancel('skill-card')).toBe(false)
    })

    it('cancels a run that outlives its timeout', async () => {
      const { runner } = setup({ outcomes: ['hang'], runTimeoutMs: 10 })
      runner.start(request())
      const state = await settle(runner)
      expect(state?.phase).toBe('cancelled')
    })

    it('signals every in-flight run on dispose', async () => {
      const { runner } = setup({ outcomes: ['hang', 'hang'], maxConcurrentRuns: 2 })
      runner.start(request())
      runner.start(request({ cardId: 'other-card' }))
      await runner.dispose()
      expect(runner.state('skill-card')).toBeUndefined()
      expect(runner.state('other-card')).toBeUndefined()
    })
  })
})
