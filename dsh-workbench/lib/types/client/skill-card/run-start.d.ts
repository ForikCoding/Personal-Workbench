/**
 * Starting one card's run from outside that card.
 *
 * A card's controller only exists while that card's page is mounted, but a run can be
 * triggered from a different card's button. This module is that path: one function,
 * plain data in and out, so the trigger does not depend on the target card's component
 * — or on any component at all — being mounted.
 * @module dsh-workbench/client/skill-card/run-start
 */
import type { WorkbenchRunStart, WorkbenchSkillCardApi } from './api.ts';
/**
 * Start a run for any stored card.
 *
 * The route is the existing one, and the contract is the one every card run uses: a
 * card run fills its template's region, so it always asks for `{ html }`. Nothing here
 * checks whether the card is free — the Host refuses a concurrent run and its refusal
 * is reported as it stands, which is the documented way this race is handled.
 *
 * The session, when the caller has one, is named only so the Host resolves the skill
 * definition through the right scope: a custom skill was registered against the session
 * the card was configured in, and a fresh run session does not carry it. The run itself
 * still executes in a fresh session the Host creates, so it never joins — or leaves its
 * traffic in — the conversation the user is having.
 * @param api - transport. Taken here rather than bound to a controller, so this works
 * for a card that is nowhere on screen.
 * @param cardId - the card to run.
 * @param sessionId - the session whose scope resolves the skill definition; undefined
 * resolves through the run's own fresh agent (the global and project layers).
 * @param payload - the clicked row's raw fields; omitted for a run no row triggered.
 * @returns the accepted run state, or the Host's own refusal.
 */
export declare function startCardRun(api: WorkbenchSkillCardApi, cardId: string, sessionId: string | undefined, payload?: Record<string, unknown>): Promise<WorkbenchRunStart>;
/**
 * Ask any stored card to revise a result it already produced.
 *
 * The same shape as {@link startCardRun} with the refine mode in place of the card
 * mode, plus the one session the Host does need named: the session the revised result was
 * produced in. Unlike a plain card run — whose named session is only the skill
 * definition's scope — a refinement both executes in and resolves its skill through that
 * session, so it is neither the session the user is in now nor a new one. The template and
 * the contract are not the client's to state, and the previous HTML travels verbatim so
 * the child revises the pixels the user is looking at. Both request shapes live here so
 * the mode union is constructed in one module.
 * @param api - transport.
 * @param cardId - the card whose result is being revised.
 * @param sessionId - the session recorded on the result being revised; undefined when the
 * record carries none, which the Host refuses rather than running somewhere else.
 * @param instruction - what to change, as the user wrote it.
 * @param previous - the region HTML the revision starts from.
 * @returns the accepted run state, or the Host's own refusal.
 */
export declare function startCardRefine(api: WorkbenchSkillCardApi, cardId: string, sessionId: string | undefined, instruction: string, previous: string): Promise<WorkbenchRunStart>;
