/** Execution behaviour of the skill card runner across every precondition and outcome. */

import { describe, expect, it, vi } from 'vitest'
import { WorkbenchSkillCardRunner, cardSelection } from '../src/skill-card-runner.ts'
import type { WorkbenchCardSelection, WorkbenchSkillCardRunnerOptions } from '../src/skill-card-runner.ts'
import type { WorkbenchRunRequest, WorkbenchResultRecord, WorkbenchSandboxMode } from '../src/skill-card-contract.ts'
import type { WorkbenchSubagentResult } from '../src/skill-card-host.ts'
import { AGENT, WORKSPACE_PATH, fakeHost } from './support/fake-skill-card-host.ts'
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
  saved: { cardId: string; record: WorkbenchResultRecord }[]
  warnings: string[]
} {
  const fake = fakeHost(options)
  const saved: { cardId: string; record: WorkbenchResultRecord }[] = []
  const warnings: string[] = []
  const runner = new WorkbenchSkillCardRunner({
    host: fake.host,
    ...options.withoutWorkingDirectory === true ? {} : { workingDirectory: fake.workingDirectory },
    statDirectory: fake.statDirectory,
    subagentProvider: 'spawn',
    runTimeoutMs: options.runTimeoutMs ?? 5_000,
    maxConcurrentRuns: options.maxConcurrentRuns ?? 1,
    // A card that is ready to run in every other respect: a directory is part of what
    // "configured" means now, so the default has one and the workspace cases vary it.
    selection: () => options.selection
      ?? { skill: 'git-repo', template: '<b>{{a}}</b>', workspace: { path: WORKSPACE_PATH } },
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
    it('refuses a card run on a harness without either run seam', async () => {
      // A harness that offers neither startActivation (0.2.1-alpha.2) nor the one-shot
      // start (0.2.0-rc.2) cannot run cards. The composition already probed it; this is
      // the second line, so a call that arrives anyway is answered with a state rather
      // than throwing `undefined is not a function` out of the route.
      const { runner, fake } = setup({ startActivation: false })
      const outcome = await runner.start(request())
      expect(outcome).toMatchObject({ status: 'rejected', code: 'run-unavailable' })
      // The refusal names both members and where each exists, which is the operator's remedy.
      const detail = outcome.status === 'rejected' ? outcome.detail : ''
      expect(detail).toContain('startActivation')
      expect(detail).toContain('start')
      expect(fake.activations).toEqual([])
      expect(fake.starts).toEqual([])
    })

    it('refuses a bare run the same way, which is the template-button path', async () => {
      // A button authored inside a result starts a bare run through the same route, so it
      // lands on the same guard instead of a stack trace.
      const { runner, fake } = setup({ startActivation: false })
      const outcome = await runner.start(request({ mode: { kind: 'bare', skill: 'git-repo' }, outputSchema: undefined }))
      expect(outcome).toMatchObject({ status: 'rejected', code: 'run-unavailable' })
      expect(fake.activations).toEqual([])
    })

    it('refuses a run with no output contract', async () => {
      const { runner, fake } = setup()
      expect(await runner.start(request({ outputSchema: undefined }))).toEqual({
        status: 'rejected',
        code: 'schema-rejected',
        detail: 'the run carried no object-rooted output contract',
      })
      expect(fake.activations).toEqual([])
    })

    it('refuses a contract that is not object-rooted', async () => {
      const { runner } = setup()
      expect(await runner.start(request({ outputSchema: { type: 'array' } }))).toMatchObject({
        status: 'rejected',
        code: 'schema-rejected',
      })
      expect(await runner.start(request({ outputSchema: 'not a schema' }))).toMatchObject({
        status: 'rejected',
        code: 'schema-rejected',
      })
    })

    it('refuses a card with no skill selected', async () => {
      const { runner } = setup({ selection: {} })
      expect(await runner.start(request())).toEqual({
        status: 'rejected',
        code: 'not-configured',
        detail: 'no skill is configured for this card',
      })
    })

    it('refuses a card with no template for its skill', async () => {
      const { runner } = setup({ selection: { skill: 'git-repo', workspace: { path: WORKSPACE_PATH } } })
      expect(await runner.start(request())).toEqual({
        status: 'rejected',
        code: 'template-missing',
        detail: 'no template is stored for skill "git-repo"',
      })
    })

    it('refuses a card with no workspace directory, instead of running in the session', async () => {
      // The card is otherwise ready, so the one thing missing is where the run would happen.
      // Falling back to the session's directory would execute work somewhere the user never
      // chose and label the result as if they had.
      const { runner, fake } = setup({ selection: { skill: 'git-repo', template: '<b>{{a}}</b>' } })
      const outcome = await runner.start(request())
      expect(outcome).toMatchObject({ status: 'rejected', code: 'workspace-missing' })
      expect(outcome.status === 'rejected' ? outcome.detail : '').toContain('skill-card')
      expect(fake.activations).toEqual([])
    })

    it('refuses a card whose workspace is no longer a directory, naming the path', async () => {
      // A moved or deleted folder is its own refusal: "somewhere else" is not an answer the
      // user asked for, and the message has to say which directory went missing.
      const { runner, fake } = setup({
        selection: { skill: 'git-repo', template: '<b>{{a}}</b>', workspace: { path: '/gone/project' } },
        directory: { exists: false, isDirectory: false, writable: false },
      })
      const outcome = await runner.start(request())
      expect(outcome).toMatchObject({ status: 'rejected', code: 'workspace-invalid' })
      expect(outcome.status === 'rejected' ? outcome.detail : '').toContain('/gone/project')
      expect(fake.activations).toEqual([])
    })

    it('refuses a path that exists but is a file', async () => {
      // `exists` alone is not enough: a run needs a directory, and a file at that path is the
      // same refusal as nothing at all.
      const { runner, fake } = setup({
        selection: { skill: 'git-repo', template: '<b>{{a}}</b>', workspace: { path: '/repo/README.md' } },
        directory: { exists: true, isDirectory: false, writable: false },
      })
      expect(await runner.start(request())).toMatchObject({ status: 'rejected', code: 'workspace-invalid' })
      expect(fake.activations).toEqual([])
    })

    it('refuses a bare run the same way, which is the template-button path', async () => {
      // A template button runs on the card that owns the button, so it has to have a
      // directory too — the check cannot live only on the "Run" control.
      const { runner, fake } = setup({ selection: {} })
      const outcome = await runner.start(request({ mode: { kind: 'bare', skill: 'git-repo' }, outputSchema: undefined }))
      expect(outcome).toMatchObject({ status: 'rejected', code: 'workspace-missing' })
      expect(fake.activations).toEqual([])
    })

    it('refuses a session with no live agent', async () => {
      const { runner } = setup({ live: false })
      expect(await runner.start(request())).toMatchObject({ status: 'rejected', code: 'session-not-live' })
    })

    it('refuses an unregistered or incapable backend', async () => {
      const missing = setup({ providers: {} })
      expect(await missing.runner.start(request())).toMatchObject({ status: 'rejected', code: 'provider-unavailable' })

      const incapable = setup({ providers: { spawn: { outputSchema: false } } })
      expect(await incapable.runner.start(request())).toMatchObject({ status: 'rejected', code: 'provider-unavailable' })
    })

    it('refuses a second run for the same card', async () => {
      const { runner } = setup({ outcomes: ['hang'] })
      expect((await runner.start(request())).status).toBe('started')
      expect(await runner.start(request())).toEqual({
        status: 'rejected',
        code: 'run-in-progress',
        detail: 'another run is already in flight',
      })
      runner.cancel('skill-card')
      await settle(runner)
    })

    it('refuses a run once the global concurrency limit is reached', async () => {
      const { runner } = setup({ outcomes: ['hang'] })
      expect((await runner.start(request())).status).toBe('started')
      expect(await runner.start(request({ cardId: 'other-card' }))).toMatchObject({
        status: 'rejected',
        code: 'run-in-progress',
      })
      runner.cancel('skill-card')
      await settle(runner)
    })
  })

  describe('the card model', () => {
    /** The route a card configured with a model names. */
    const MODEL = { provider: 'deepseek', model: 'deepseek-chat' }

    it('pins the child to the card model and stamps it on the record', async () => {
      // Criteria 74 and 75. The route travels as `agentOptions` — never as text in the
      // prompt, which the child could not honour — and the record keeps it so the result
      // page can name the model that produced what the user is reading.
      const { runner, fake, saved } = setup({
        selection: { skill: 'git-repo', template: '<b>{{a}}</b>', workspace: { path: WORKSPACE_PATH }, model: MODEL },
        outcomes: [{ output: [], stopReason: 'completed', structured: { html: '<b>a</b>' } }],
      })
      expect((await runner.start(request())).status).toBe('started')
      await settle(runner)
      expect(fake.activations[0]?.request.agentOptions).toEqual(MODEL)
      expect(saved[0]?.record.model).toEqual(MODEL)
    })

    it('passes no agentOptions at all when the card names no model', async () => {
      // Criterion 76. Omission is the promise: the child then inherits the session's model
      // exactly as it did before this feature existed, and the record says nothing about a
      // route the Host was never told.
      const { runner, fake, saved } = setup()
      expect((await runner.start(request())).status).toBe('started')
      await settle(runner)
      expect(fake.activations[0]?.request).not.toHaveProperty('agentOptions')
      expect(saved[0]?.record).not.toHaveProperty('model')
    })

    it('refuses a provider that does not advertise the capability, naming the route', async () => {
      // Criterion 77. A backend that cannot take a route must refuse rather than run on
      // the session's model: the card says one thing and the run would do another.
      const { runner, fake } = setup({
        selection: { skill: 'git-repo', template: '<b>{{a}}</b>', model: MODEL },
        providers: { spawn: { outputSchema: true, agentOptions: false } },
      })
      const outcome = await runner.start(request())
      expect(outcome).toMatchObject({ status: 'rejected', code: 'provider-unavailable' })
      expect(outcome.status === 'rejected' ? outcome.detail : '').toContain('deepseek/deepseek-chat')
      expect(fake.activations).toEqual([])
    })

    it('refuses a model provider this deployment does not route', async () => {
      // Criterion 78. The registry rejects for a provider it does not have, which is what
      // tells a missing provider apart from a model that left the catalog.
      const { runner, fake } = setup({
        selection: { skill: 'git-repo', template: '<b>{{a}}</b>', model: { provider: 'gone', model: 'large' } },
        models: { deepseek: ['deepseek-chat'] },
      })
      const outcome = await runner.start(request())
      expect(outcome).toMatchObject({ status: 'rejected', code: 'provider-unavailable' })
      expect(outcome.status === 'rejected' ? outcome.detail : '').toContain('gone/large')
      expect(fake.activations).toEqual([])
    })

    it('refuses a model the provider no longer offers', async () => {
      // Criterion 79. Missing from an answered catalog is its own refusal: the provider is
      // there, the model is not, and saying which one is gone is the whole point.
      const { runner, fake } = setup({
        selection: { skill: 'git-repo', template: '<b>{{a}}</b>', model: { provider: 'deepseek', model: 'retired' } },
        models: { deepseek: ['deepseek-chat'] },
      })
      const outcome = await runner.start(request())
      expect(outcome).toMatchObject({ status: 'rejected', code: 'model-unavailable' })
      expect(outcome.status === 'rejected' ? outcome.detail : '').toContain('deepseek/retired')
      expect(fake.activations).toEqual([])
    })
  })

  describe('execution', () => {
    it('runs the skill through a child and stores the captured value', async () => {
      const { runner, fake, saved } = setup({
        outcomes: [{ output: [{ type: 'text', text: 'done' }], stopReason: 'completed', structured: { branch: 'main' } }],
      })
      const started = await runner.start(request())
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

    it('runs the same card through the older channel one-shot seam', async () => {
      // 0.2.0-rc.2 — the stable channel this plugin ships into — has exactly the one-shot
      // start and no startActivation. Measured on a real host composition: the request
      // carries the same members (no cwd, no delivery), the child inherits the parent's
      // header and sandbox root, and the result resolves to the caller with the capture.
      const { runner, fake, saved } = setup({
        startActivation: false,
        start: true,
        outcomes: [{ output: [{ type: 'text', text: 'done' }], stopReason: 'completed', structured: { branch: 'main' } }],
      })
      const started = await runner.start(request())
      expect(started).toMatchObject({ status: 'started' })

      const state = await settle(runner)
      expect(state).toMatchObject({
        phase: 'settled',
        result: {
          skill: 'git-repo',
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

      // The one-shot call carried the whole request the activation request would have:
      // the rooted parent, the skill wrapper, the contract, and the provider name. No
      // `cwd` and no `delivery` exist on this seam, and none is needed.
      const call = fake.starts[0]
      expect(call?.provider).toBe('spawn')
      expect(call?.spec.parent).not.toBe(AGENT)
      expect(call?.spec.parent?.session?.header?.cwd).toBe('/repo')
      expect(call?.spec.label).toBe('workbench:skill-card')
      expect(call?.spec.outputSchema).toEqual({ type: 'object', properties: {} })
      expect(call?.spec.prompt[0]?.text).toContain('<skill_content name="git-repo">')
      expect(call?.spec).not.toHaveProperty('cwd')
      expect(call?.spec).not.toHaveProperty('delivery')
      expect(fake.activations).toEqual([])
      expect(fake.disposed.count).toBe(1)
    })

    it('keeps cancellation working through the one-shot seam', async () => {
      // The stop button and the deadline both cancel through the run's signal, which is
      // the canonical channel on this seam too: an abort settles the child as aborted.
      const { runner, fake } = setup({
        startActivation: false,
        start: true,
        outcomes: ['hang'],
      })
      await runner.start(request())
      runner.cancel('skill-card')
      const state = await settle(runner)
      expect(state).toMatchObject({ phase: 'cancelled' })
      expect(fake.disposed.count).toBe(1)
    })

    it('sends the canonical skill wrapper and inherits the agent scope', async () => {
      const { runner, fake } = setup()
      await runner.start(request())
      await settle(runner)

      const spec = fake.activations[0]
      expect(spec?.provider).toBe('spawn')
      expect(spec?.delivery).toBe('caller')
      // The card names a workspace, so the run hangs from an agent rooted at that
        // directory rather than from the session's: a child inherits its parent's
        // session header, and the sandbox derives its writable root from that header.
        expect(spec?.request.parent).not.toBe(AGENT)
        expect(spec?.request.parent?.session?.header?.cwd).toBe('/repo')
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
      const { runner, fake } = setup({
        selection: { skill: 'git-repo', template, workspace: { path: WORKSPACE_PATH } },
      })
      await runner.start(request())
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
      await runner.start(request())
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
      await runner.start(request())
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
      await runner.start(request())
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
      await runner.start(request())
      await claimChild()
      runner.observeAgentError('some-other-agent', new Error('unrelated'))
      fake.settleChild({ output: [], stopReason: 'error' })
      await claimChild()
      fake.settleChild({ output: [], stopReason: 'error' })
      const state = await settle(runner)
      expect(state?.failure).toBe('the run ended as error')
      expect(state?.result?.diagnostic).toBeUndefined()
    })

    it('streams what the child is doing, and keeps that trace in the settled record', async () => {
      // The trace is what a running card shows and what 运行详情 keeps, so it has to reach
      // both: the live state the poll reports, and the record the store writes. One array
      // feeds both, which is what keeps the stream and the record from disagreeing.
      const { runner, fake, saved } = setup({ outcomes: ['manual'] })
      await runner.start(request())
      for (let tick = 0; tick < 50; tick += 1) await Promise.resolve()
      const call = { type: 'tool/call', data: { turn: 1, step: 1, callId: 'c1', name: 'pwsh', arguments: '{"command":"echo hi"}' } }
      runner.observeChildEvent('child', call)
      runner.observeChildEvent('child', {
        type: 'tool/call',
        data: { turn: 1, step: 2, callId: 'c2', name: 'read', arguments: '{"path":"README.md"}' },
      })
      const live = runner.state('skill-card')
      expect(live?.phase).toBe('running')
      expect(live?.activity).toEqual([
        { kind: 'tool', tool: 'pwsh', argument: 'echo hi' },
        { kind: 'tool', tool: 'read', argument: 'README.md' },
      ])
      fake.settleChild({ output: [], stopReason: 'completed', structured: { html: '<b>a</b>' } })
      const state = await settle(runner)
      expect(state?.result?.activity).toEqual(live?.activity)
      expect(saved[0]?.record.activity).toEqual(live?.activity)
    })

    it('records nothing for a child that used no tools', async () => {
      // Absent is not an empty list: the result page draws no activity section for a run
      // that called nothing, so the field must not appear.
      const { runner, saved } = setup()
      await runner.start(request())
      const state = await settle(runner)
      expect(state?.activity).toBeUndefined()
      expect(state?.result === undefined ? {} : state.result).not.toHaveProperty('activity')
      expect(saved[0]?.record).not.toHaveProperty('activity')
    })

    it('ignores activity from an agent this runner did not start', async () => {
      const { runner, fake } = setup({ outcomes: ['manual'] })
      await runner.start(request())
      for (let tick = 0; tick < 50; tick += 1) await Promise.resolve()
      runner.observeChildEvent('some-other-agent', {
        type: 'tool/call',
        data: { name: 'read', arguments: '{"path":"private.txt"}' },
      })
      expect(runner.state('skill-card')?.activity).toBeUndefined()
      fake.settleChild({ output: [], stopReason: 'completed', structured: { html: '<b>a</b>' } })
      const state = await settle(runner)
      expect(state?.result).not.toHaveProperty('activity')
    })

    it('records nothing for an event type that is not a tool call', async () => {
      const { runner, fake } = setup({ outcomes: ['manual'] })
      await runner.start(request())
      for (let tick = 0; tick < 50; tick += 1) await Promise.resolve()
      for (const type of ['tool/result', 'assistant/message', 'turn/start', 'user/message']) {
        runner.observeChildEvent('child', { type, data: { name: 'read', arguments: '{"path":"a"}' } })
      }
      expect(runner.state('skill-card')?.activity).toBeUndefined()
      fake.settleChild({ output: [], stopReason: 'completed', structured: { html: '<b>a</b>' } })
      await settle(runner)
    })

    it('keeps a bare run trace out of the record it never stores', async () => {
      // A bare run answers only whether it worked, so nothing about it is written down —
      // the trace included. It is still visible on the live state, where the poll reads it.
      const { runner, fake, saved } = setup({ outcomes: ['manual'] })
      await runner.start(request({ mode: { kind: 'bare', skill: 'git-repo' }, outputSchema: undefined }))
      for (let tick = 0; tick < 50; tick += 1) await Promise.resolve()
      runner.observeChildEvent('child', { type: 'tool/call', data: { name: 'read', arguments: '{"path":"a"}' } })
      expect(runner.state('skill-card')?.activity).toHaveLength(1)
      fake.settleChild({ output: [], stopReason: 'completed' })
      const state = await settle(runner)
      expect(saved).toEqual([])
      expect(state?.result).not.toHaveProperty('activity')
    })

    it('names a child that answered without reporting a structured result', async () => {
      const { runner, fake, saved } = setup({
        outcomes: [
          { output: [{ type: 'text', text: 'first' }], stopReason: 'completed' },
          { output: [{ type: 'text', text: 'second' }], stopReason: 'completed' },
        ],
      })
      await runner.start(request())
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
      await runner.start(request())
      const state = await settle(runner)
      expect(fake.activations).toHaveLength(2)
      expect(state?.failure).toBe('the run ended as error: provider exploded')
    })

    it('does not repeat a child that refused or hit its ceiling', async () => {
      for (const stopReason of ['refusal', 'max-tokens']) {
        const { runner, fake } = setup({ outcomes: [{ output: [], stopReason }] })
        await runner.start(request())
        const state = await settle(runner)
        expect(state?.failure).toBe(`the run ended as ${stopReason}`)
        expect(fake.activations).toHaveLength(1)
      }
    })

    it('reports a skill that is no longer available', async () => {
      const { runner, fake } = setup({ definitions: {} })
      await runner.start(request())
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
      await runner.start(request())
      const state = await settle(runner)
      expect(state).toMatchObject({ phase: 'settled', failureCode: 'run-failed', failure: 'no working directory' })
      expect(warnings).toEqual(['workbench skill card run failed: no working directory'])
    })

    it('keeps the result when storing it fails', async () => {
      const { runner, warnings } = setup({
        saveResult: async () => { throw new Error('disk full') },
      })
      await runner.start(request())
      const state = await settle(runner)
      expect(state?.phase).toBe('settled')
      expect(state?.result?.structured).toEqual({ a: '1' })
      expect(warnings).toEqual(['workbench skill card result could not be stored: disk full'])
    })
  })

  describe('cancellation and timeouts', () => {
    it('cancels an in-flight run without retrying', async () => {
      const { runner, fake } = setup({ outcomes: ['hang'] })
      await runner.start(request())
      expect(runner.cancel('skill-card')).toBe(true)

      const state = await settle(runner)
      expect(state).toMatchObject({ phase: 'cancelled', failure: 'the run was cancelled', retried: false })
      expect(fake.activations).toHaveLength(1)
    })

    it('ignores a cancel for a card with no run in flight', async () => {
      const { runner } = setup()
      expect(runner.cancel('skill-card')).toBe(false)
      await runner.start(request())
      await settle(runner)
      expect(runner.cancel('skill-card')).toBe(false)
    })

    it('cancels a run that outlives its timeout', async () => {
      const { runner } = setup({ outcomes: ['hang'], runTimeoutMs: 10 })
      await runner.start(request())
      const state = await settle(runner)
      expect(state?.phase).toBe('cancelled')
    })

    it('signals every in-flight run on dispose', async () => {
      const { runner } = setup({ outcomes: ['hang', 'hang'], maxConcurrentRuns: 2 })
      await runner.start(request())
      await runner.start(request({ cardId: 'other-card' }))
      await runner.dispose()
      expect(runner.state('skill-card')).toBeUndefined()
      expect(runner.state('other-card')).toBeUndefined()
    })
  })
})

/**
 * The card's own agent is what fences a run.
 *
 * A child inherits its parent's session header, and the sandbox derives its writable root
 * from that header, so a card that names a workspace runs under an agent rooted there. The
 * fence itself is out-of-process behaviour (see the skipped workspace-sandbox spec); what
 * this block pins is the plugin's side of it: one agent per card, rooted at the directory,
 * reused across runs, rebuilt when the directory changes, and archived so its session does
 * not pile up in the sidebar.
 */
describe('the card agent that fences a run', () => {
  it('gives each run its own agent rooted at the card directory', async () => {
    const { runner, fake } = setup()
    await runner.start(request())
    await settle(runner)
    expect(fake.createdAgents).toHaveLength(1)
    expect(fake.createdAgents[0]?.session?.header?.cwd).toBe(WORKSPACE_PATH)
    // The first run's agent is archived and released when it settles, so a second run
    // gets a fresh session: an archived session cannot host a subagent descendant, and
    // reusing one would make the next run end as a refusal before its first step.
    expect(fake.disposedAgents).toEqual([fake.createdAgents[0]?.id])

    await runner.start(request())
    await settle(runner)
    expect(fake.createdAgents).toHaveLength(2)
    expect(fake.createdAgents[1]?.id).not.toBe(fake.createdAgents[0]?.id)
    expect(fake.activations[1]?.request.parent?.session?.header?.cwd).toBe(WORKSPACE_PATH)
  })

  it('rebuilds it when the workspace changes, because the root cannot be moved', async () => {
    const created = { ...fakeHostSelection('/repo') }
    const fake = fakeHost({})
    const runner = new WorkbenchSkillCardRunner({
      host: fake.host,
      workingDirectory: fake.workingDirectory,
      statDirectory: fake.statDirectory,
      subagentProvider: 'spawn',
      runTimeoutMs: 5_000,
      maxConcurrentRuns: 1,
      selection: () => ({ skill: 'git-repo', template: '<b>{{a}}</b>', workspace: { path: created.path } }),
      saveResult: async () => {},
      warn: () => {},
      now: () => 42,
    })
    await runner.start(request())
    await settle(runner)
    expect(fake.createdAgents[0]?.session?.header?.cwd).toBe('/repo')

    created.path = '/elsewhere'
    await runner.start(request())
    await settle(runner)
    expect(fake.createdAgents).toHaveLength(2)
    expect(fake.createdAgents[1]?.session?.header?.cwd).toBe('/elsewhere')
    // Each settled run retires its own agent, so both handles were released by the runs
    // themselves rather than by a rebuild.
    expect(fake.disposedAgents).toHaveLength(2)
    await runner.dispose()
  })

  it('archives each card session so the sidebar does not fill up', async () => {
    const { runner, fake } = setup()
    await runner.start(request())
    await settle(runner)
    expect(fake.archivedSessions).toEqual([fake.createdAgents[0]?.id])
  })

  it('publishes a fresh session id when an earlier app run already took the old one', async () => {
    // What a restart looks like to the host: the card agent from the previous app run
    // still exists durably under the id the counter alone would rebuild, so the create
    // must not ask for that id again — the run starts on a session this process minted.
    const { runner, fake } = setup({ persistedSessionIds: ['workbench-card-skill-card-0'] })
    await runner.start(request())
    const state = await settle(runner)
    expect(state).toMatchObject({ phase: 'settled', result: { stopReason: 'completed' } })
    expect(fake.createdAgents[0]?.id).not.toBe('workbench-card-skill-card-0')
    expect(fake.createdAgents[0]?.id).toMatch(/^workbench-card-skill-card-[a-z0-9]+-\d+$/)
  })

  it('creates no card agent for a card that names no directory', async () => {
    // The workspace is mandatory, so this path is refused before any agent exists — the
    // fallback inside the runner is a guard for a state the user cannot reach, not a
    // behaviour. Asserting the refusal is what actually holds.
    const { runner, fake } = setup({ selection: { skill: 'git-repo', template: '<b>{{a}}</b>' } })
    const outcome = await runner.start(request())
    expect(outcome).toMatchObject({ status: 'rejected', code: 'workspace-missing' })
    expect(fake.createdAgents).toHaveLength(0)
    expect(fake.activations).toHaveLength(0)
  })
})

/**
 * The permission mode a card's runs execute under.
 *
 * The mode is a session event on the card's own agent, and a child inherits its parent's
 * explicit override — so recording it there is what governs every run started from that
 * card, refinements and template-button runs included. What these cases pin is the plugin's
 * side of it: which mode is applied, when it is applied, when the agent is rebuilt, and what
 * happens when the mode cannot be applied at all. Whether the sandbox then refuses a write
 * outside the directory is out of this package (see the skipped workspace-sandbox spec).
 */
describe('the selection a run reads from one card', () => {
  it('carries every field the card record holds, and none the run does not read', () => {
    // Criterion 105's wiring half. The runner never sees a card record, only this projection,
    // so a field the record holds and this function forgets is a setting that silently stops
    // applying — the failure mode this whole feature exists to avoid. `permission` is the
    // field that made the split worth pinning.
    const model = { provider: 'deepseek', model: 'deepseek-chat' }
    const workspace = { path: '/repo' }
    expect(cardSelection({
      cardId: 'skill-card',
      skill: 'git-repo',
      template: '<b>x</b>',
      model,
      workspace,
      permission: 'read-only',
      templateSkills: ['git-repo'],
    })).toEqual({ skill: 'git-repo', template: '<b>x</b>', model, workspace, permission: 'read-only' })
    // A card with nothing stored selects nothing: no key holds `undefined`, which
    // `exactOptionalPropertyTypes` would otherwise let through unnoticed.
    expect(cardSelection(undefined)).toEqual({})
    for (const value of Object.values(cardSelection(undefined))) expect(value).toBeUndefined()
    expect(Object.hasOwn(cardSelection(undefined), 'permission')).toBe(false)
  })
})

describe('the permission mode a card runs under', () => {
  /** A selection a case can mutate between runs, as the configuration page would. */
  interface MutableSelection {
    skill: string
    template: string
    workspace: { path: string }
    permission?: WorkbenchSandboxMode
  }

  /** A captured result, repeated per attempt so no case pays for a retry it did not ask for. */
  const CAPTURED: WorkbenchSubagentResult = { output: [], stopReason: 'completed', structured: { a: '1' } }
  const CAPTURED_EVERY_TIME = { outcomes: [CAPTURED, CAPTURED, CAPTURED, CAPTURED, CAPTURED, CAPTURED] }

  it('applies the default mode to a card that names none', async () => {
    // Criterion 103. "No mode stored" is not "inherit": it means workspace-write, and this
    // is the one place that turns the absence into a mode.
    const { runner, fake } = setup()
    await runner.start(request())
    await settle(runner)
    expect(fake.sandboxModes).toEqual([
      { sessionId: fake.createdAgents[0]?.id, mode: 'workspace-write' },
    ])
  })

  it('applies the card’s mode once per agent, when it creates the agent', async () => {
    // Criterion 105. The mode is recorded on the run's own agent, not per step: the run's
    // child inherits that override. Each run now builds its own agent, so each one carries
    // the mode — but a single run still never appends a second event.
    const { runner, fake } = setup({
      ...CAPTURED_EVERY_TIME,
      selection: { skill: 'git-repo', template: '<b>{{a}}</b>', workspace: { path: WORKSPACE_PATH }, permission: 'read-only' },
    })
    await runner.start(request())
    await settle(runner)
    await runner.start(request())
    await settle(runner)
    expect(fake.sandboxModes).toEqual([
      { sessionId: fake.createdAgents[0]?.id, mode: 'read-only' },
      { sessionId: fake.createdAgents[1]?.id, mode: 'read-only' },
    ])
    expect(fake.createdAgents).toHaveLength(2)
    expect(fake.activations[1]?.request.parent).toBe(fake.createdAgents[1])
  })

  it('never mutates a live agent: a changed mode starts on a newer agent', async () => {
    // Criterion 106. A live agent's mode is not mutated, so a changed mode starts on a new
    // session rather than quietly continuing under the old one. Every settled run retires
    // its agent anyway, so what this pins is that the mode applied is always the card's
    // current selection, on an agent created for that run.
    const selection: MutableSelection = {
      skill: 'git-repo',
      template: '<b>{{a}}</b>',
      workspace: { path: WORKSPACE_PATH },
      permission: 'read-only',
    }
    const { runner, fake } = setup({ ...CAPTURED_EVERY_TIME, selection })
    await runner.start(request())
    await settle(runner)
    await runner.start(request())
    await settle(runner)
    expect(fake.createdAgents).toHaveLength(2)

    selection.permission = 'danger-full-access'
    await runner.start(request())
    await settle(runner)
    expect(fake.createdAgents).toHaveLength(3)
    expect(fake.sandboxModes.map(entry => entry.mode)).toEqual([
      'read-only',
      'read-only',
      'danger-full-access',
    ])
    // The new mode is on the new agent: the run hangs from the session that carries it.
    expect(fake.sandboxModes[2]?.sessionId).toBe(fake.createdAgents[2]?.id)
    expect(fake.activations[2]?.request.parent).toBe(fake.createdAgents[2])
  })

  it('refuses the start when the mode cannot be applied, naming the card and the mode', async () => {
    // Criterion 107. Refused rather than falling back to the default or to the session's
    // mode: a permission setting that quietly does nothing is worse than an error, because
    // the user reads it as enforced.
    const { runner, fake } = setup({
      modeFailure: 'the session is gone',
      selection: { skill: 'git-repo', template: '<b>{{a}}</b>', workspace: { path: WORKSPACE_PATH }, permission: 'read-only' },
    })
    const outcome = await runner.start(request())
    expect(outcome).toMatchObject({ status: 'rejected', code: 'permission-unavailable' })
    const detail = outcome.status === 'rejected' ? outcome.detail : ''
    expect(detail).toContain('skill-card')
    expect(detail).toContain('read-only')
    expect(detail).toContain('the session is gone')
    // Nothing ran, no run state was recorded, and the agent that could not take the mode was
    // released instead of being kept for the next attempt.
    expect(fake.activations).toEqual([])
    expect(fake.disposedAgents).toEqual([fake.createdAgents[0]?.id])
    expect(runner.state('skill-card')).toBeUndefined()
  })

  it('does not rebuild an agent a run in flight still hangs from', async () => {
    // Applying a changed mode disposes the card's agent, so the overlap check has to run
    // before the mode is applied: rebuilding on a start that is refused would tear down the
    // session the running child hangs from.
    const selection: MutableSelection = {
      skill: 'git-repo',
      template: '<b>{{a}}</b>',
      workspace: { path: WORKSPACE_PATH },
      permission: 'read-only',
    }
    const { runner, fake } = setup({ outcomes: ['hang'], selection })
    await runner.start(request())
    selection.permission = 'danger-full-access'
    const outcome = await runner.start(request())
    expect(outcome).toMatchObject({ status: 'rejected', code: 'run-in-progress' })
    expect(fake.disposedAgents).toEqual([])
    expect(fake.createdAgents).toHaveLength(1)
    await runner.dispose()
  })

  it('runs a card that asks for danger-full-access', async () => {
    // Criterion 108. Full access is allowed: the product decision is that a user may choose
    // it, and the configuration page states what it gives up. What must not happen is the
    // runner refusing or silently narrowing it.
    const { runner, fake } = setup({
      selection: {
        skill: 'git-repo',
        template: '<b>{{a}}</b>',
        workspace: { path: WORKSPACE_PATH },
        permission: 'danger-full-access',
      },
    })
    await runner.start(request())
    const state = await settle(runner)
    expect(state?.phase).toBe('settled')
    expect(fake.sandboxModes).toEqual([
      { sessionId: fake.createdAgents[0]?.id, mode: 'danger-full-access' },
    ])
    expect(fake.activations).toHaveLength(1)
  })
})

function fakeHostSelection(path: string): { path: string } {
  return { path }
}
describe('teardown', () => {
  it('releases a card agent a run in flight still hangs from', async () => {
    // A settled run retires its own agent; this is the one teardown path that still matters
    // — the agent of a run that has not settled when the plugin unloads.
    const { runner, fake } = setup({ outcomes: ['hang'] })
    await runner.start(request())
    expect(fake.disposedAgents).toHaveLength(0)
    await runner.dispose()
    expect(fake.disposedAgents).toEqual([fake.createdAgents[0]?.id])
  })
})