/**
 * Starting one card's run from outside that card.
 *
 * A card's controller only exists while that card's page is mounted, but a run can be
 * triggered from a different card's button. This module is that path: one function,
 * plain data in and out, so the trigger does not depend on the target card's component
 * — or on any component at all — being mounted.
 * @module dsh-workbench/client/skill-card/run-start
 */

import { WORKBENCH_OUTPUT_SCHEMA } from '../../skill-card-contract.ts'
import type { WorkbenchRunStart, WorkbenchSkillCardApi } from './api.ts'

/**
 * Start a run for any stored card.
 *
 * The route is the existing one, and the contract is the one every card run uses: a
 * card run fills its template's region, so it always asks for `{ html }`. Nothing here
 * checks whether the card is free — the Host refuses a concurrent run and its refusal
 * is reported as it stands, which is the documented way this race is handled.
 * @param api - transport. Taken here rather than bound to a controller, so this works
 * for a card that is nowhere on screen.
 * @param cardId - the card to run.
 * @param sessionId - the session the run belongs to.
 * @param payload - the clicked row's raw fields; omitted for a run no row triggered.
 * @returns the accepted run state, or the Host's own refusal.
 */
export async function startCardRun(
  api: WorkbenchSkillCardApi,
  cardId: string,
  sessionId: string,
  payload?: Record<string, unknown>,
): Promise<WorkbenchRunStart> {
  return await api.start({
    cardId,
    sessionId,
    mode: { kind: 'card' },
    // The row the user confirmed travels with the run: the panel gates nothing unless
    // what it displayed is what the child reads.
    ...payload === undefined ? {} : { payload },
    outputSchema: WORKBENCH_OUTPUT_SCHEMA,
  })
}

/**
 * Ask any stored card to revise a result it already produced.
 *
 * The same shape as {@link startCardRun} with the refine mode in place of the card
 * mode: the template and the contract are not the client's to state, and the previous
 * HTML travels verbatim so the child revises the pixels the user is looking at. Both
 * request shapes live here so the mode union is constructed in one module.
 * @param api - transport.
 * @param cardId - the card whose result is being revised.
 * @param sessionId - the session the run belongs to.
 * @param instruction - what to change, as the user wrote it.
 * @param previous - the region HTML the revision starts from.
 * @returns the accepted run state, or the Host's own refusal.
 */
export async function startCardRefine(
  api: WorkbenchSkillCardApi,
  cardId: string,
  sessionId: string,
  instruction: string,
  previous: string,
): Promise<WorkbenchRunStart> {
  return await api.start({
    cardId,
    sessionId,
    mode: { kind: 'refine', instruction, previous },
    outputSchema: WORKBENCH_OUTPUT_SCHEMA,
  })
}
