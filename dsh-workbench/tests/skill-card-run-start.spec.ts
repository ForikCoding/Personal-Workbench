/**
 * Starting a card's run from outside that card.
 *
 * The trigger for a card target is a button on a different card, so the start cannot
 * depend on the target card's page existing. These cases pin the request it sends and
 * the refusals it passes through unchanged.
 */

import { describe, expect, it } from 'vitest'
import { startCardRefine, startCardRun } from '../src/client/skill-card/run-start.ts'
import { WORKBENCH_OUTPUT_SCHEMA } from '../src/skill-card-contract.ts'
import type { WorkbenchRunRequest, WorkbenchSkillCardPatch } from '../src/skill-card-contract.ts'
import type { WorkbenchRunStart, WorkbenchSkillCardApi } from '../src/client/skill-card/api.ts'

/** What one case records about the transport. */
interface Recording {
  readonly requests: WorkbenchRunRequest[]
}

/**
 * Build an api whose only interesting method is `start`.
 * @param start - what the Host answers.
 * @returns the api and the requests it received.
 */
function api(start: (request: WorkbenchRunRequest) => Promise<WorkbenchRunStart>): {
  api: WorkbenchSkillCardApi
  recording: Recording
} {
  const recording: Recording = { requests: [] }
  return {
    recording,
    api: {
      read: async () => ({ status: 'unavailable', reason: 'not used' }),
      write: async (_patch: WorkbenchSkillCardPatch) => ({ status: 'failed', reason: 'not used' }),
      catalog: async () => ({ status: 'ok', entries: [] }),
      poll: async () => ({ status: 'missing' }),
      cancel: async () => {},
      saveResult: async () => ({ status: 'unavailable', reason: 'not used' }),
      // The directory check belongs to the page that gates its own run control; a start
      // issued from another card's button carries no directory of its own.
      statDirectory: async () => ({ status: 'unavailable', reason: 'not used' }),
      // Nor does it list directories: the result rows are the panel's, not a start's.
      listFiles: async () => ({ status: 'unavailable', reason: 'not used' }),
      start: async (request) => {
        recording.requests.push(request)
        return await start(request)
      },
    },
  }
}

describe('starting a card run', () => {
  it('asks for one card run with the fixed contract, for any card id, and names no session when the caller has none', async () => {
    const { api: transport, recording } = api(async request => ({
      status: 'ok',
      state: { cardId: request.cardId, phase: 'running', startedAt: 1, retried: false },
    }))
    const outcome = await startCardRun(transport, 'other-card', undefined)
    // No controller, no mount, and no read of that card's configuration: the request is
    // the whole interaction. And no session: the caller named none, so the skill resolves
    // through the fresh agent the Host creates for the run.
    expect(recording.requests).toEqual([{
      cardId: 'other-card',
      mode: { kind: 'card' },
      outputSchema: WORKBENCH_OUTPUT_SCHEMA,
    }])
    expect(recording.requests[0]).not.toHaveProperty('scopeSessionId')
    expect(outcome.status).toBe('ok')
  })

  it('names the session whose scope resolves the skill definition when one is given', async () => {
    // The session travels as the skill's scope, not as the run's home: the Host still
    // executes the run in a fresh session of its own.
    const { api: transport, recording } = api(async request => ({
      status: 'ok',
      state: { cardId: request.cardId, phase: 'running', startedAt: 1, retried: false },
    }))
    const outcome = await startCardRun(transport, 'other-card', 'session-1')
    expect(recording.requests).toEqual([{
      cardId: 'other-card',
      scopeSessionId: 'session-1',
      mode: { kind: 'card' },
      outputSchema: WORKBENCH_OUTPUT_SCHEMA,
    }])
    expect(outcome.status).toBe('ok')
  })

  it('carries the clicked row with the run', async () => {
    const { api: transport, recording } = api(async request => ({
      status: 'ok',
      state: { cardId: request.cardId, phase: 'running', startedAt: 1, retried: false },
    }))
    await startCardRun(transport, 'other-card', undefined, { payload: { task_number: 'CP-1' } })
    expect(recording.requests[0]?.payload).toEqual({ task_number: 'CP-1' })
  })

  it('carries the instruction, trimmed, and sends none when it says nothing', async () => {
    const { api: transport, recording } = api(async request => ({
      status: 'ok',
      state: { cardId: request.cardId, phase: 'running', startedAt: 1, retried: false },
    }))
    await startCardRun(transport, 'other-card', undefined, { instruction: '  分析 T202601010001  ' })
    expect(recording.requests[0]?.instruction).toBe('分析 T202601010001')
    // Blank is not an instruction: sending it would reach the prompt as an empty ask.
    await startCardRun(transport, 'other-card', undefined, { instruction: '   ' })
    expect(recording.requests[1]).not.toHaveProperty('instruction')
  })

  it('passes the Host’s refusal through as it stands', async () => {
    // The check-then-start race is settled here: the route refuses a concurrent run and
    // that refusal is what the user is shown. No lock is invented around it.
    const { api: transport } = api(async () => ({
      status: 'rejected',
      code: 'run-in-progress',
      message: 'another run is already in flight',
    }))
    await expect(startCardRun(transport, 'other-card', undefined)).resolves.toEqual({
      status: 'rejected',
      code: 'run-in-progress',
      message: 'another run is already in flight',
    })
  })

  it('passes an unreachable Host through as it stands', async () => {
    const { api: transport } = api(async () => ({ status: 'unavailable', reason: 'route answered 500' }))
    await expect(startCardRun(transport, 'other-card', undefined)).resolves.toEqual({
      status: 'unavailable',
      reason: 'route answered 500',
    })
  })
})

describe('starting a refine run', () => {
  it('asks for a refine of the HTML on screen in the session the result came from', async () => {
    // The template stays the Host's to read from storage, so the request carries only the
    // instruction, the result being revised, and the one session the Host does need: the
    // session that result was produced in, which is where the revision has to run.
    const { api: transport, recording } = api(async request => ({
      status: 'ok',
      state: { cardId: request.cardId, phase: 'running', startedAt: 1, retried: false },
    }))
    const outcome = await startCardRefine(transport, 'skill-card', 'session-run-7', 'session-1', '按时间倒序', '<b>旧</b>')
    expect(recording.requests).toEqual([{
      cardId: 'skill-card',
      sessionId: 'session-run-7',
      scopeSessionId: 'session-1',
      mode: { kind: 'refine', instruction: '按时间倒序', previous: '<b>旧</b>' },
      outputSchema: WORKBENCH_OUTPUT_SCHEMA,
    }])
    expect(outcome.status).toBe('ok')
  })

  it('sends no session at all when the result recorded none', async () => {
    // A record written before the workbench kept a session per run. The Host refuses the
    // run rather than choosing a session; this side must not invent one either.
    const { api: transport, recording } = api(async request => ({
      status: 'ok',
      state: { cardId: request.cardId, phase: 'running', startedAt: 1, retried: false },
    }))
    await startCardRefine(transport, 'skill-card', undefined, undefined, 'i', 'p')
    expect(recording.requests[0]).not.toHaveProperty('sessionId')
    expect(recording.requests[0]).not.toHaveProperty('scopeSessionId')
  })

  it('passes a refusal through as it stands', async () => {
    const { api: transport } = api(async () => ({
      status: 'rejected',
      code: 'run-in-progress',
      message: 'another run is already in flight',
    }))
    await expect(startCardRefine(transport, 'skill-card', 'session-run-7', 'session-1', 'i', 'p')).resolves.toEqual({
      status: 'rejected',
      code: 'run-in-progress',
      message: 'another run is already in flight',
    })
  })
})
