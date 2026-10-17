/** Ordering rules the workbench applies to the slot ledger and the layout. */

import { describe, expect, it } from 'vitest'
import type { WorkbenchCardLayoutRecord, WorkbenchLayoutSnapshot } from '../src/layout-contract.ts'
import { WORKBENCH_POSITION_BASE, WORKBENCH_POSITION_EPSILON } from '../src/layout-contract.ts'
import type { WorkbenchCardFact } from '../src/client/layout-store.ts'
import { layoutFromSnapshot, planWorkbenchMove, renumberEntries, resolveWorkbenchOrder } from '../src/client/layout-store.ts'

/**
 * Build ledger facts.
 * @param entries - id and default order pairs, in declaration order.
 * @returns card facts with a label equal to the id.
 */
function facts(...entries: readonly (readonly [string, number])[]): WorkbenchCardFact[] {
  return entries.map(([id, order]) => ({ id, order, label: id }))
}

/**
 * Build a layout map.
 * @param records - id to record pairs.
 * @returns the arrangement.
 */
function layout(records: Readonly<Record<string, WorkbenchCardLayoutRecord>>): Map<string, WorkbenchCardLayoutRecord> {
  return new Map(Object.entries(records))
}

describe('resolveWorkbenchOrder', () => {
  it('falls back to the declared order when nothing is arranged', () => {
    expect(resolveWorkbenchOrder(facts(['git-repo', 100], ['agent-runs', 200]), layout({})))
      .toEqual({ visible: ['git-repo', 'agent-runs'] })
  })

  it('breaks an equal declared order by card id so the sequence is stable', () => {
    expect(resolveWorkbenchOrder(facts(['b-card', 100], ['a-card', 100]), layout({})).visible)
      .toEqual(['a-card', 'b-card'])
  })

  it('honours stored positions over the declared order', () => {
    const order = resolveWorkbenchOrder(
      facts(['git-repo', 100], ['agent-runs', 200]),
      layout({ 'git-repo': { position: 5000 }, 'agent-runs': { position: 10 } }),
    )
    expect(order.visible).toEqual(['agent-runs', 'git-repo'])
  })

  it('places an unarranged card after the arranged card declared before it', () => {
    // The user moved the first card to the end; a later install at order 150
    // lands after the moved card, not at the very end.
    const order = resolveWorkbenchOrder(
      facts(['git-repo', 100], ['env-health', 150], ['agent-runs', 200]),
      layout({ 'git-repo': { position: 5000 } }),
    )
    expect(order.visible).toEqual(['git-repo', 'env-health', 'agent-runs'])
  })

  it('reads a record that carries a removed hidden field as visible', () => {
    // A stored document written by an older build still says `hidden: true`. There
    // is no migration step: the field is ignored, so the card comes back in the
    // sequence like any other.
    const stale = new Map([
      ['git-repo', { hidden: true } as unknown as WorkbenchCardLayoutRecord],
    ])
    const order = resolveWorkbenchOrder(facts(['git-repo', 100], ['agent-runs', 200]), stale)
    expect(order.visible).toEqual(['git-repo', 'agent-runs'])
  })

  it('keeps an unarranged card visible even when a record claims it is hidden', () => {
    const stale = new Map([
      ['git-repo', { position: 5000, hidden: true } as unknown as WorkbenchCardLayoutRecord],
      ['agent-runs', { position: 10 }],
    ])
    expect(resolveWorkbenchOrder(facts(['git-repo', 100], ['agent-runs', 200]), stale).visible)
      .toEqual(['agent-runs', 'git-repo'])
  })
})

describe('planWorkbenchMove', () => {
  it('writes one midpoint record when moving between arranged neighbours', () => {
    const arrangement = layout({
      'a-card': { position: 1024 },
      'b-card': { position: 2048 },
      'c-card': { position: 4096 },
    })
    const plan = planWorkbenchMove(['a-card', 'b-card', 'c-card'], arrangement, 'c-card', 1)
    expect(plan.visible).toEqual(['a-card', 'c-card', 'b-card'])
    expect(plan.entries).toEqual([{ id: 'c-card', position: 1536 }])
  })

  it('writes a position ahead of the first arranged card when moving to the front', () => {
    const arrangement = layout({ 'a-card': { position: 1024 }, 'b-card': { position: 2048 } })
    const plan = planWorkbenchMove(['a-card', 'b-card'], arrangement, 'b-card', 0)
    expect(plan.visible).toEqual(['b-card', 'a-card'])
    expect(plan.entries).toEqual([{ id: 'b-card', position: 512 }])
  })

  it('writes a trailing position after the last arranged card', () => {
    const arrangement = layout({ 'a-card': { position: 1024 }, 'b-card': { position: 2048 } })
    const plan = planWorkbenchMove(['a-card', 'b-card'], arrangement, 'a-card', 2)
    expect(plan.entries).toEqual([{ id: 'a-card', position: 2048 + WORKBENCH_POSITION_BASE }])
  })

  it('replaces an unarranged neighbour instead of renumbering the sequence', () => {
    const plan = planWorkbenchMove(['a-card', 'c-card'], layout({ 'a-card': { position: 1024 } }), 'c-card', 0)
    expect(plan.visible).toEqual(['c-card', 'a-card'])
    expect(plan.entries).toEqual([{ id: 'c-card', position: 512 }])
  })

  it('renumbers when two arranged neighbours sit closer than the position epsilon', () => {
    const tight = layout({ 'a-card': { position: 1024 }, 'b-card': { position: 1024 + WORKBENCH_POSITION_EPSILON / 2 } })
    const plan = planWorkbenchMove(['a-card', 'b-card', 'c-card'], tight, 'c-card', 1)
    expect(plan.entries).toHaveLength(3)
    expect(plan.entries.map(entry => entry.id)).toEqual(['a-card', 'c-card', 'b-card'])
  })

  it('anchors on the first slot when neither neighbour is arranged', () => {
    const plan = planWorkbenchMove(['a-card', 'c-card', 'b-card'], layout({}), 'b-card', 1)
    expect(plan.visible).toEqual(['a-card', 'b-card', 'c-card'])
    expect(plan.entries).toEqual([{ id: 'b-card', position: WORKBENCH_POSITION_BASE }])
  })

  it('plans nothing when the card is already at the requested index', () => {
    const plan = planWorkbenchMove(['a-card', 'b-card'], layout({}), 'a-card', 0)
    expect(plan.entries).toEqual([])
    expect(plan.visible).toEqual(['a-card', 'b-card'])
  })

  it('plans nothing for a card outside the visible sequence', () => {
    const plan = planWorkbenchMove(['a-card'], layout({}), 'missing-card', 0)
    expect(plan.entries).toEqual([])
    expect(plan.visible).toEqual(['a-card'])
  })

  it('clamps a target index beyond either end', () => {
    const arrangement = layout({ 'a-card': { position: 1024 }, 'b-card': { position: 2048 } })
    expect(planWorkbenchMove(['a-card', 'b-card'], arrangement, 'a-card', 99).visible)
      .toEqual(['b-card', 'a-card'])
    expect(planWorkbenchMove(['a-card', 'b-card'], arrangement, 'b-card', -5).visible)
      .toEqual(['b-card', 'a-card'])
  })
})

describe('renumberEntries', () => {
  it('spaces positions by the position step, starting at the base', () => {
    expect(renumberEntries(['a-card', 'b-card', 'c-card'])).toEqual([
      { id: 'a-card', position: WORKBENCH_POSITION_BASE },
      { id: 'b-card', position: WORKBENCH_POSITION_BASE * 2 },
      { id: 'c-card', position: WORKBENCH_POSITION_BASE * 4 },
    ])
  })
})

describe('layoutFromSnapshot', () => {
  it('keys records by card id and drops absent fields', () => {
    const map = layoutFromSnapshot({
      revision: '1:0',
      entries: [{ id: 'a-card', position: 10 }, { id: 'c-card' }],
    })
    expect([...map.entries()]).toEqual([
      ['a-card', { position: 10 }],
      ['c-card', {}],
    ])
  })

  it('ignores a hidden field still present in a stored snapshot', () => {
    const stale = {
      revision: '1:0',
      entries: [{ id: 'b-card', hidden: true }],
    } as unknown as WorkbenchLayoutSnapshot
    expect([...layoutFromSnapshot(stale).entries()]).toEqual([['b-card', {}]])
  })
})
