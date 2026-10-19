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
      start: async (request) => {
        recording.requests.push(request)
        return await start(request)
      },
    },
  }
}

describe('starting a card run', () => {
  it('asks for one card run with the fixed contract, for any card id', async () => {
    const { api: transport, recording } = api(async request => ({
      status: 'ok',
      state: { cardId: request.cardId, phase: 'running', startedAt: 1, retried: false },
    }))
    const outcome = await startCardRun(transport, 'other-card', 'session-1')
    // No controller, no mount, and no read of that card's configuration: the request is
    // the whole interaction.
    expect(recording.requests).toEqual([{
      cardId: 'other-card',
      sessionId: 'session-1',
      mode: { kind: 'card' },
      outputSchema: WORKBENCH_OUTPUT_SCHEMA,
    }])
    expect(outcome.status).toBe('ok')
  })

  it('passes the Host’s refusal through as it stands', async () => {
    // The check-then-start race is settled here: the route refuses a concurrent run and
    // that refusal is what the user is shown. No lock is invented around it.
    const { api: transport } = api(async () => ({
      status: 'rejected',
      code: 'run-in-progress',
      message: 'another run is already in flight',
    }))
    await expect(startCardRun(transport, 'other-card', 'session-1')).resolves.toEqual({
      status: 'rejected',
      code: 'run-in-progress',
      message: 'another run is already in flight',
    })
  })

  it('passes an unreachable Host through as it stands', async () => {
    const { api: transport } = api(async () => ({ status: 'unavailable', reason: 'route answered 500' }))
    await expect(startCardRun(transport, 'other-card', 'session-1')).resolves.toEqual({
      status: 'unavailable',
      reason: 'route answered 500',
    })
  })
})

describe('starting a refine run', () => {
  it('asks for a refine of the HTML on screen, with the same fixed contract', async () => {
    // The template stays the Host's to read from storage, so the request carries only the
    // instruction and the result being revised.
    const { api: transport, recording } = api(async request => ({
      status: 'ok',
      state: { cardId: request.cardId, phase: 'running', startedAt: 1, retried: false },
    }))
    const outcome = await startCardRefine(transport, 'skill-card', 'session-1', '按时间倒序', '<b>旧</b>')
    expect(recording.requests).toEqual([{
      cardId: 'skill-card',
      sessionId: 'session-1',
      mode: { kind: 'refine', instruction: '按时间倒序', previous: '<b>旧</b>' },
      outputSchema: WORKBENCH_OUTPUT_SCHEMA,
    }])
    expect(outcome.status).toBe('ok')
  })

  it('passes a refusal through as it stands', async () => {
    const { api: transport } = api(async () => ({
      status: 'rejected',
      code: 'run-in-progress',
      message: 'another run is already in flight',
    }))
    await expect(startCardRefine(transport, 'skill-card', 'session-1', 'i', 'p')).resolves.toEqual({
      status: 'rejected',
      code: 'run-in-progress',
      message: 'another run is already in flight',
    })
  })
})
