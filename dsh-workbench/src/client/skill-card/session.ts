/**
 * Choosing the session a skill card run hangs off.
 *
 * A root-scoped panel gets no "current session" seat, so the workbench states the
 * rule itself. The read happens when the user asks, which is also the freshest
 * point: a session opened after the card rendered is still found.
 * @module dsh-workbench/client/skill-card/session
 */

/** The part of one session row the picker reads. */
export interface WorkbenchSessionRow {
  /** Durable origin for navigation filtering; a subagent child is not a run target. */
  readonly origin?: 'subagent'
  /** Views currently holding this session; the main view is the one on screen. */
  readonly retainedBy?: { readonly mainView?: number } | undefined
  /** Last activity, used to rank sessions the main view is not holding. */
  readonly updatedAt: number
}

/**
 * Pick the session a run should hang off.
 *
 * A session the main view still holds wins, because that is the one the user is
 * working in. The rest are ranked by recency.
 *
 * A blank session is an ordinary candidate. "Blank" means no messages yet, which
 * says nothing about whether the session can run: a freshly opened session has a
 * live agent, and the Host refuses a session without one on its own terms. The
 * picker must not pre-empt that judgement, because excluding blank sessions leaves
 * a first-run user with no candidate at all.
 * @param ids - session list order.
 * @param byId - rows addressed by id.
 * @returns the chosen session id, or undefined when none qualifies.
 */
export function pickRunSession(
  ids: readonly string[],
  byId: Readonly<Record<string, WorkbenchSessionRow | undefined>>,
): string | undefined {
  let best: string | undefined
  let bestRank = -1
  let bestAt = Number.NEGATIVE_INFINITY
  for (const id of ids) {
    const row = byId[id]
    if (row === undefined || row.origin === 'subagent') continue
    const rank = (row.retainedBy?.mainView ?? 0) > 0 ? 1 : 0
    if (best !== undefined && (rank < bestRank || (rank === bestRank && row.updatedAt <= bestAt))) continue
    best = id
    bestRank = rank
    bestAt = row.updatedAt
  }
  return best
}
