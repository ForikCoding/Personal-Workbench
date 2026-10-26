/**
 * Choosing the session a skill card reads its catalog through.
 *
 * A root-scoped panel gets no "current session" seat, so the workbench states the
 * rule itself. The read happens when the user asks, which is also the freshest
 * point: a session opened after the card rendered is still found.
 *
 * It is not the session a run executes in: a run is given one of its own by the Host, so a
 * card's traffic never lands in this conversation. What this session still supplies is the
 * agent scope a catalog read needs, and the fallback model directory.
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
 * Pick the session a card's catalog read should go through.
 *
 * A session the main view still holds wins, because that is the one the user is
 * working in. The rest are ranked by recency.
 *
 * A blank session is an ordinary candidate. "Blank" means no messages yet, which
 * says nothing about whether the catalog can be read through it: a freshly opened session
 * has a live agent, and the Host answers a catalog read with the global layer when no
 * session can supply a scope. The picker must not pre-empt that judgement, because
 * excluding blank sessions leaves a first-run user with no candidate at all.
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
