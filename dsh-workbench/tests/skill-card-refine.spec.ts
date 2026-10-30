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
 * The session the revised result was produced in.
 *
 * Not the live agent's id: a refinement continues a run's own session, which is archived
 * once that run settles and has to be restored and re-attached for the revision.
 */
const REFINED_SESSION = 'workbench-skill-card-42'

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
  // The refined run's session exists durably and its own run archived it, which is the
  // state every refinement starts from.
  const fake = fakeHost({
    persistedSessionIds: [REFINED_SESSION],
    archivedSessionIds: [REFINED_SESSION],
    ...options,
  })
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
 *
 * The session is the one the revised result was produced in, when the record carries one:
 * a refinement continues that conversation. A record stored before the workbench kept a
 * session per run has none, and the request then names no session so the run falls back
 * to a fresh one. The skill definition is not resolved in the run's session — a custom
 * skill lives in the user's live session — so a scope is named separately, exactly as a
 * card run does.
 * @param overrides - fields the case varies.
 * @returns the request.
 */
function refine(overrides: Partial<WorkbenchRunRequest> = {}): WorkbenchRunRequest {
  return {
    cardId: 'skill-card',
    sessionId: REFINED_SESSION,
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

  it('says the region is content, not a pointer to where the content lives', async () => {
    // A child that wrote a file sometimes reported the folder instead of the report, and the
    // page — which renders what came back, not a directory tree — showed a read failure. The
    // line has to be in the prompt because the skill's own text cannot be relied on to say it.
    const prompt = renderWorkbenchRefinePrompt(SKILL, TEMPLATE, PREVIOUS, INSTRUCTION)
    expect(prompt).toContain('Report the content itself, not a pointer to it')
    expect(prompt).toContain('data-dsh-files')
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
      persistedSessionIds: [REFINED_SESSION],
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
        runId: '42',
        sessionId: REFINED_SESSION,
        skill: 'git-repo',
        executedAt: 42,
        stopReason: 'completed',
        structured: { html: '<b>新</b>' },
        outputText: 'ok',
        // The revision request is kept too: a refined run's row has to say which request it
        // answered, exactly as a first run's row says what it was asked for.
        instruction: INSTRUCTION,
      },
    }])
  })

  it('runs in the session of the run being refined, and creates none', async () => {
    // The whole point of naming the session: a revision continues the conversation that
    // wrote the document. It is not the session the user is in, and it is not a new one,
    // so nothing about this run may publish a session of its own.
    const { runner, fake } = setup()
    expect(await runner.start(refine())).toMatchObject({ status: 'started' })
    await settle(runner)

    expect(fake.createdAgents).toEqual([])
    expect(fake.resumedSessions).toEqual([REFINED_SESSION])
    // The session was archived when its own run settled, and an archived session's
    // subagent descendants are refused a model step — so it is restored for the run and
    // archived again when the run settles.
    expect(fake.unarchivedSessions).toEqual([REFINED_SESSION])
    expect(fake.archivedSessions).toEqual([REFINED_SESSION])
    // The child hangs from the refined run's session, which is what puts it in that
    // conversation and keeps the sandbox rooted where that run happened.
    expect(fake.activations[0]?.request.parent?.id).toBe(REFINED_SESSION)
  })

  it('resolves the refined document’s skill through the named live scope, not the session it continues', async () => {
    // The bug this pins: a refine executed in the session the result was produced in —
    // since 2.0.46 that is a Host-created fresh run session, which never carried the
    // custom skill — so its skill lookup fell back to that agent and refused the run as
    // "not available to this session". Execution still continues the recorded session,
    // but the definition resolves through the user's live session, exactly as a card run.
    const { runner, fake } = setup()
    expect(await runner.start(refine({ scopeSessionId: AGENT.id }))).toMatchObject({ status: 'started' })
    await settle(runner)
    expect(fake.activations[0]?.request.parent?.id).toBe(REFINED_SESSION)
    expect(fake.lookups[0]?.scope?.id).toBe(AGENT.id)
  })

  it('uses a session that is still live instead of re-attaching it, and leaves it on screen', async () => {
    // A session the user has open already has an agent: re-attaching one would take a
    // second write ownership of the same log, which the store refuses. And because it is on
    // screen rather than archived, the run neither restores nor hides it.
    const { runner, fake } = setup()
    expect(await runner.start(refine({ sessionId: AGENT.id, scopeSessionId: AGENT.id }))).toMatchObject({ status: 'started' })
    await settle(runner)
    expect(fake.resumedSessions).toEqual([])
    expect(fake.createdAgents).toEqual([])
    expect(fake.activations[0]?.request.parent?.id).toBe(AGENT.id)
    expect(fake.unarchivedSessions).toEqual([])
    expect(fake.archivedSessions).toEqual([REFINED_SESSION])
  })

  it('refuses a refine run whose session cannot be restored', async () => {
    // Restoring is what lifts the archive gate, so a session that stays archived cannot
    // host the revision: the start is refused rather than left to fail as a blocked child.
    const { runner, fake } = setup({ unarchiveFailure: 'storage is read-only' })
    const outcome = await runner.start(refine())
    expect(outcome).toMatchObject({ status: 'rejected', code: 'session-not-live' })
    expect(outcome.status === 'rejected' ? outcome.detail : '').toContain('storage is read-only')
    expect(fake.activations).toEqual([])
    // The agent the refusal re-attached was released rather than left holding the log.
    expect(fake.disposedAgents).toEqual([REFINED_SESSION])
  })

  it('refines a legacy result with no recorded session in a fresh one of its own', async () => {
    // A result stored before the workbench kept a session per run carries none. There is
    // no earlier conversation to continue, so the run opens a fresh session like a card
    // run does — refusing would shut off 重新生成 on every old result.
    const { runner, fake } = setup()
    const { sessionId: _sessionId, ...legacy } = refine()
    expect(await runner.start(legacy)).toMatchObject({ status: 'started' })
    await settle(runner)
    expect(fake.resumedSessions).toEqual([])
    // A fresh session was published for the run, then archived as its own — on top of the
    // seeded archived session the fixture restored nothing for (it was never resumed).
    expect(fake.createdAgents).toHaveLength(1)
    expect(fake.archivedSessions).toEqual([REFINED_SESSION, fake.createdAgents[0]?.id])
    expect(fake.activations[0]?.request.parent?.id).toBe(fake.createdAgents[0]?.id)
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
