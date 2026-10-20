/** Configuration, template, revision, and result behaviour of the skill card store. */

import { describe, expect, it } from 'vitest'
import { WorkbenchSkillCardStore } from '../src/skill-card-store.ts'
import type { SkillCardChangeSource, WorkbenchSkillCardStoreOptions } from '../src/skill-card-store.ts'
import { fakeSkillCardTables } from './support/fake-skill-card-tables.ts'
import type { FakeSkillCardSeed } from './support/fake-skill-card-tables.ts'

/** Change source double whose domain events the spec fires by hand. */
function changeSource(): { readonly source: SkillCardChangeSource; readonly fire: (domain: string) => void } {
  const listeners = new Set<(change: { readonly domain: string }) => void>()
  return {
    source: {
      on: (_event, listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    },
    fire: (domain) => { for (const listener of [...listeners]) listener({ domain }) },
  }
}

/** Overrides a spec may apply to the store's deployment budgets. */
interface SetupOptions {
  readonly seed?: FakeSkillCardSeed
  readonly bootStamp?: number
  readonly maxTemplateBytes?: number
  readonly maxTemplatesPerCard?: number
  readonly maxResultBytes?: number
}

/**
 * Build a store over fresh tables.
 * @param options - seed records and budget overrides.
 * @returns the store, its tables, and the change source to fire.
 */
function setup(options: SetupOptions = {}): {
  store: WorkbenchSkillCardStore
  tables: ReturnType<typeof fakeSkillCardTables>
  changes: ReturnType<typeof changeSource>
} {
  const tables = fakeSkillCardTables(options.seed)
  const changes = changeSource()
  const budgets: Pick<
    WorkbenchSkillCardStoreOptions,
    'maxTemplateBytes' | 'maxTemplatesPerCard' | 'maxResultBytes'
  > = {
    maxTemplateBytes: options.maxTemplateBytes ?? 1024,
    maxTemplatesPerCard: options.maxTemplatesPerCard ?? 4,
    maxResultBytes: options.maxResultBytes ?? 512,
  }
  const store = new WorkbenchSkillCardStore({
    domainName: 'workbench_skill_card',
    card: tables.card,
    template: tables.template,
    result: tables.result,
    events: changes.source,
    bootStamp: options.bootStamp ?? 7,
    ...budgets,
  })
  return { store, tables, changes }
}

describe('workbench skill card store', () => {
  it('reads an empty state at the boot revision', () => {
    const { store } = setup()
    expect(store.read()).toEqual({ cards: [], results: [], revision: '7:0' })
  })

  it('stores a skill selection', async () => {
    const { store, tables } = setup()
    const result = await store.write({ baseRevision: '7:0', cardId: 'skill-card', skill: 'git-repo' })
    expect(result.status).toBe('written')
    expect(tables.operations).toEqual([
      { table: 'card', kind: 'put', key: 'skill-card', value: { skill: 'git-repo' } },
    ])
    expect(store.read().cards).toEqual([{ cardId: 'skill-card', skill: 'git-repo', templateSkills: [] }])
  })

  it('stores the template before the selection it belongs to', async () => {
    const { store, tables } = setup()
    await store.write({
      baseRevision: '7:0',
      cardId: 'skill-card',
      skill: 'git-repo',
      template: { skill: 'git-repo', html: '<b>{{branch}}</b>' },
    })
    // The template lands first so a failed selection write leaves the previous
    // working pair in place rather than naming a skill whose template is missing.
    expect(tables.operations.map(operation => `${operation.table}:${operation.kind}`))
      .toEqual(['template:put', 'card:put'])
    expect(store.read().cards).toEqual([{
      cardId: 'skill-card',
      skill: 'git-repo',
      templateSkills: ['git-repo'],
      template: '<b>{{branch}}</b>',
    }])
  })

  it('lists a template whose skill is no longer selected', async () => {    const { store } = setup({ seed: { template: { 'skill-card_other': { html: 'x' } } } })
    expect(store.read().cards).toEqual([{ cardId: 'skill-card', templateSkills: ['other'] }])
  })

  it('clears a selection without dropping the stored templates', async () => {
    const { store, tables } = setup({
      seed: { card: { 'skill-card': { skill: 'git-repo' } }, template: { 'skill-card_git-repo': { html: 'x' } } },
    })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', skill: null })
    expect(tables.operations).toEqual([{ table: 'card', kind: 'delete', key: 'skill-card' }])
    expect(store.read().cards).toEqual([{ cardId: 'skill-card', templateSkills: ['git-repo'] }])
  })

  it('stores a card name and reads it back', async () => {
    const { store, tables } = setup()
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', name: 'Repo overview' })
    expect(tables.operations).toHaveLength(1)
    expect(tables.operations[0]).toMatchObject({ table: 'card', kind: 'put', key: 'skill-card' })
    expect(store.read().cards).toEqual([{ cardId: 'skill-card', name: 'Repo overview', templateSkills: [] }])
  })

  it('trims a name, because surrounding whitespace is not part of it', async () => {
    const { store } = setup()
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', name: '  Repo overview  ' })
    expect(store.read().cards).toEqual([{ cardId: 'skill-card', name: 'Repo overview', templateSkills: [] }])
  })

  it('keeps the name when the selection is cleared', async () => {
    // Name and selection share one record, so clearing the skill must merge rather
    // than replace: a delete here would silently drop the user's own label.
    const { store, tables } = setup({ seed: { card: { 'skill-card': { name: 'Repo overview', skill: 'git-repo' } } } })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', skill: null })
    expect(tables.operations[0]).toMatchObject({ table: 'card', kind: 'put', key: 'skill-card' })
    expect(store.read().cards).toEqual([{ cardId: 'skill-card', name: 'Repo overview', templateSkills: [] }])
  })

  it('keeps the selection when only the name changes', async () => {
    const { store } = setup({ seed: { card: { 'skill-card': { skill: 'git-repo' } } } })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', name: 'Repo overview' })
    expect(store.read().cards).toEqual([
      { cardId: 'skill-card', name: 'Repo overview', skill: 'git-repo', templateSkills: [] },
    ])
  })

  it('clears the name and the selection together into one delete', async () => {
    const { store, tables } = setup({ seed: { card: { 'skill-card': { name: 'Repo overview', skill: 'git-repo' } } } })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', name: null, skill: null })
    expect(tables.operations).toEqual([{ table: 'card', kind: 'delete', key: 'skill-card' }])
    expect(store.read().cards).toEqual([])
  })

  it('stores a card model as a pair and reads it back whole', async () => {
    // Criterion 71's storage half: the pair is stored as two fields, so a provider id
    // containing a slash survives the round trip unparsed.
    const { store, tables } = setup()
    const model = { provider: 'vendor/gateway', model: 'large' }
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', model })
    expect(tables.operations).toEqual([
      { table: 'card', kind: 'put', key: 'skill-card', value: { model } },
    ])
    expect(store.read().cards).toEqual([{ cardId: 'skill-card', model, templateSkills: [] }])
  })

  it('keeps the model when the skill changes, and the reverse', async () => {
    // Name, skill, and model share one record: every write merges against what is stored,
    // so choosing one of the three never clears the other two.
    const model = { provider: 'deepseek', model: 'deepseek-chat' }
    const seeded = setup({ seed: { card: { 'skill-card': { skill: 'git-repo', model } } } })
    await seeded.store.write({ baseRevision: '7:0', cardId: 'skill-card', name: 'Repo overview' })
    expect(seeded.store.read().cards).toEqual([
      { cardId: 'skill-card', name: 'Repo overview', skill: 'git-repo', model, templateSkills: [] },
    ])

    const renamed = setup({ seed: { card: { 'skill-card': { name: 'Repo overview' } } } })
    await renamed.store.write({ baseRevision: '7:0', cardId: 'skill-card', model })
    expect(renamed.store.read().cards).toEqual([
      { cardId: 'skill-card', name: 'Repo overview', model, templateSkills: [] },
    ])
  })

  it('clears a model without dropping the name or the selection', async () => {
    // `null` means "go back to inheriting the session's model". It is a field being
    // cleared, not the card being deleted, so the other two fields survive it.
    const { store, tables } = setup({
      seed: { card: { 'skill-card': { name: 'Repo overview', skill: 'git-repo', model: { provider: 'deepseek', model: 'deepseek-chat' } } } },
    })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', model: null })
    expect(tables.operations[0]).toMatchObject({ table: 'card', kind: 'put' })
    expect(store.read().cards).toEqual([
      { cardId: 'skill-card', name: 'Repo overview', skill: 'git-repo', templateSkills: [] },
    ])
  })

  it('stores the workspace as one absolute path and reads it back', async () => {
    // Not a workspace id: the card runs in whatever directory the user picked, which need
    // not be a registered workspace at all.
    const { store, tables } = setup()
    const workspace = { path: 'D:\\Git\\Personal-Workbench' }
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', skill: 'git-repo', workspace })
    expect(tables.operations.at(-1)).toEqual({
      table: 'card',
      kind: 'put',
      key: 'skill-card',
      value: { skill: 'git-repo', workspace },
    })
    expect(store.read().cards).toEqual([
      { cardId: 'skill-card', skill: 'git-repo', workspace, templateSkills: [] },
    ])
  })

  it('reads a card with no workspace without inventing one', async () => {
    // Every card created before this field existed is in this state, and it is the state
    // that means "cannot run yet" — not a directory inferred on the user's behalf.
    const { store } = setup({ seed: { card: { 'skill-card': { skill: 'git-repo' } } } })
    const [card] = store.read().cards
    expect(card).not.toHaveProperty('workspace')
  })

  it('keeps the workspace when an unrelated field is written', async () => {
    // Name, skill, model, and workspace share one record: a write of one must merge against
    // the others, or choosing a model would silently un-configure the card's directory.
    const workspace = { path: '/repo' }
    const model = { provider: 'deepseek', model: 'deepseek-chat' }
    const { store } = setup({ seed: { card: { 'skill-card': { skill: 'git-repo', workspace, name: 'Repo' } } } })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', model })
    expect(store.read().cards).toEqual([{
      cardId: 'skill-card',
      name: 'Repo',
      skill: 'git-repo',
      model,
      workspace,
      templateSkills: [],
    }])
  })

  it('clears the workspace alone, leaving the other fields in place', async () => {
    const { store } = setup({
      seed: { card: { 'skill-card': { skill: 'git-repo', name: 'Repo', workspace: { path: '/repo' } } } },
    })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', workspace: null })
    expect(store.read().cards).toEqual([
      { cardId: 'skill-card', name: 'Repo', skill: 'git-repo', templateSkills: [] },
    ])
  })

  it('stores the permission mode, reads it back, and merges it like the other fields', async () => {
    // The mode travels into the same record as the name, the skill, the route, and the
    // directory, so a write of one must merge against the rest: choosing a mode must not
    // un-configure the card's directory, and renaming must not lose the mode.
    const workspace = { path: '/repo' }
    const { store, tables } = setup({ seed: { card: { 'skill-card': { skill: 'git-repo', workspace } } } })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', permission: 'read-only' })
    expect(tables.operations.at(-1)).toEqual({
      table: 'card',
      kind: 'put',
      key: 'skill-card',
      value: { skill: 'git-repo', workspace, permission: 'read-only' },
    })
    expect(store.read().cards).toEqual([{
      cardId: 'skill-card',
      skill: 'git-repo',
      workspace,
      permission: 'read-only',
      templateSkills: [],
    }])
  })

  it('reads a card with no permission mode without inventing one', async () => {
    // Every card created before this field existed is in this state, and the effective mode
    // is applied at run time rather than written into storage on load.
    const { store } = setup({ seed: { card: { 'skill-card': { skill: 'git-repo' } } } })
    const [card] = store.read().cards
    expect(card).not.toHaveProperty('permission')
  })

  it('clears the permission mode alone, leaving the other fields in place', async () => {
    // Clearing means "back to the default", which is a real mode rather than an empty one.
    const { store } = setup({
      seed: { card: { 'skill-card': { skill: 'git-repo', name: 'Repo', permission: 'danger-full-access' } } },
    })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', permission: null })
    expect(store.read().cards).toEqual([
      { cardId: 'skill-card', name: 'Repo', skill: 'git-repo', templateSkills: [] },
    ])
  })

  it('deletes the record once name, skill, and model are all cleared', async () => {    // An empty record would keep a card alive with nothing left to configure it with.
    const { store, tables } = setup({
      seed: { card: { 'skill-card': { skill: 'git-repo', model: { provider: 'deepseek', model: 'deepseek-chat' } } } },
    })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', skill: null, model: null })
    expect(tables.operations).toEqual([{ table: 'card', kind: 'delete', key: 'skill-card' }])
    expect(store.read().cards).toEqual([])
  })

  it('removes a card together with every template it holds', async () => {
    // A removal that left the templates behind would keep records no card can ever
    // read again, and another card's records must survive it.
    const { store, tables } = setup({
      seed: {
        card: { 'skill-card': { name: 'Repo overview', skill: 'git-repo' } },
        template: {
          'skill-card_git-repo': { html: 'x' },
          'skill-card_other': { html: 'y' },
          'other-card_z': { html: 'z' },
        },
      },
    })
    await store.write({ baseRevision: '7:0', cardId: 'skill-card', remove: true })
    expect(store.read().cards).toEqual([{ cardId: 'other-card', templateSkills: ['z'] }])
    const deleted = tables.operations.filter(op => op.kind === 'delete').map(op => op.key).sort()
    expect(deleted).toEqual(['skill-card', 'skill-card_git-repo', 'skill-card_other'])
  })

  it('refuses a stale revision without writing', async () => {
    const { store, tables } = setup()
    const result = await store.write({ baseRevision: '0:9', cardId: 'skill-card', skill: 'git-repo' })
    expect(result).toEqual({ status: 'conflict', snapshot: { cards: [], results: [], revision: '7:0' } })
    expect(tables.operations).toEqual([])
  })

  it('reports why a patch cannot be stored', async () => {
    const cases: readonly { readonly patch: Parameters<WorkbenchSkillCardStore['write']>[0]; readonly reason: string }[] = [
      {
        patch: { baseRevision: '7:0', cardId: 'Skill-Card', skill: 'git-repo' },
        reason: 'card id "Skill-Card" is not a namespaced slug',
      },
      {
        patch: { baseRevision: '7:0', cardId: 'skill-card', skill: 'Git-Repo' },
        reason: 'skill "Git-Repo" is not a kebab-case skill name',
      },
      {
        patch: { baseRevision: '7:0', cardId: 'skill-card', template: { skill: 'Git-Repo', html: 'x' } },
        reason: 'template skill "Git-Repo" is not a kebab-case skill name',
      },
      {
        patch: { baseRevision: '7:0', cardId: 'skill-card', template: { skill: 'git-repo', html: 'x'.repeat(1025) } },
        reason: 'template is 1025 bytes, above the 1024 byte limit',
      },
      {
        patch: { baseRevision: '7:0', cardId: 'skill-card', name: '   ' },
        reason: 'card name must hold visible text within 60 characters',
      },
      {
        patch: { baseRevision: '7:0', cardId: 'skill-card', name: 'x'.repeat(61) },
        reason: 'card name must hold visible text within 60 characters',
      },
      {
        patch: { baseRevision: '7:0', cardId: 'skill-card', remove: true, name: 'Repo overview' },
        reason: 'a removal cannot carry a name, a skill, a model, a workspace, a permission, or a template',
      },
      {
        // A route is two ids or nothing. An empty half is not a route, and accepting it
        // would store a card that names a model it cannot run.
        patch: { baseRevision: '7:0', cardId: 'skill-card', model: { provider: 'deepseek', model: '' } },
        reason: 'model must name a non-empty provider and model id',
      },
      {
        // The directory is one absolute path. A relative one would name a different
        // directory to whoever resolved it, so it is refused rather than resolved.
        patch: { baseRevision: '7:0', cardId: 'skill-card', workspace: { path: 'relative/dir' } },
        reason: 'workspace must name one absolute directory path within 4096 characters',
      },
      {
        // An unknown mode is refused rather than stored: the page would show a permission
        // the sandbox never agreed to, and the run would execute under whatever applied.
        patch: {
          baseRevision: '7:0',
          cardId: 'skill-card',
          permission: 'full-control' as unknown as 'read-only',
        },
        reason: 'permission must be null or one of read-only, workspace-write, danger-full-access',
      },
    ]
    for (const { patch, reason } of cases) {
      const { store, tables } = setup()
      await expect(store.write(patch)).resolves.toEqual({ status: 'invalid', reason })
      expect(tables.operations).toEqual([])
    }
  })

  it('refuses a new template once the card is at its template limit', async () => {
    const { store } = setup({
      maxTemplatesPerCard: 2,
      seed: { template: { 'skill-card_a': { html: '1' }, 'skill-card_b': { html: '2' } } },
    })
    await expect(store.write({
      baseRevision: '7:0',
      cardId: 'skill-card',
      template: { skill: 'c', html: '3' },
    })).resolves.toEqual({
      status: 'invalid',
      reason: 'card already holds 2 templates, at the 2 limit',
    })
  })

  it('still accepts a template that replaces one the card already holds', async () => {
    const { store } = setup({
      maxTemplatesPerCard: 2,
      seed: { template: { 'skill-card_a': { html: '1' }, 'skill-card_b': { html: '2' } } },
    })
    await expect(store.write({
      baseRevision: '7:0',
      cardId: 'skill-card',
      template: { skill: 'b', html: '3' },
    })).resolves.toMatchObject({ status: 'written' })
  })

  it('advances its revision on this domain only', () => {
    const { store, changes } = setup()
    changes.fire('workbench_layout')
    expect(store.revision).toBe('7:0')
    changes.fire('workbench_skill_card')
    expect(store.revision).toBe('7:1')
  })

  it('stops observing changes once disposed', () => {
    const { store, changes } = setup()
    store.dispose()
    changes.fire('workbench_skill_card')
    expect(store.revision).toBe('7:0')
  })

  it('ignores template keys that are not composite', async () => {
    const { store } = setup({ seed: { template: { 'not-composite': { html: 'x' } } } })
    expect(store.read().cards).toEqual([])
  })

  describe('results', () => {
    it('stores a result that fits', async () => {
      const { store, tables } = setup()
      await store.putResult('skill-card', {
        skill: 'git-repo',
        executedAt: 12,
        stopReason: 'completed',
        structured: { branch: 'main' },
        outputText: 'done',
      })
      expect(tables.operations).toEqual([{
        table: 'result',
        kind: 'put',
        key: 'skill-card',
        value: {
          skill: 'git-repo',
          executedAt: 12,
          stopReason: 'completed',
          structured: { branch: 'main' },
          outputText: 'done',
        },
      }])
      expect(store.read().results).toEqual([{
        cardId: 'skill-card',
        skill: 'git-repo',
        executedAt: 12,
        stopReason: 'completed',
        structured: { branch: 'main' },
        outputText: 'done',
      }])
    })

    it('truncates the text output rather than the rendered value', async () => {
      const { store, tables } = setup({ maxResultBytes: 220 })
      await store.putResult('skill-card', {
        skill: 'git-repo',
        executedAt: 12,
        stopReason: 'completed',
        structured: { branch: 'main' },
        outputText: 'x'.repeat(500),
      })
      const [stored] = store.read().results
      expect(stored?.structured).toEqual({ branch: 'main' })
      expect(stored?.outputText?.length).toBeGreaterThan(0)
      expect(stored?.outputText?.length).toBeLessThan(500)
      // Measured on the stored record: the read view adds the card id on top.
      expect(Buffer.byteLength(JSON.stringify(tables.result.get('skill-card')), 'utf8')).toBeLessThanOrEqual(220)
    })

    it('drops the structured value when it alone exceeds the budget', async () => {
      const { store, tables } = setup({ maxResultBytes: 120 })
      await store.putResult('skill-card', {
        skill: 'git-repo',
        executedAt: 12,
        stopReason: 'completed',
        structured: { big: 'y'.repeat(500) },
        outputText: 'x'.repeat(500),
      })
      const record = tables.result.get('skill-card')
      expect(record?.structured).toBeUndefined()
      expect(record?.skill).toBe('git-repo')
      expect(Buffer.byteLength(JSON.stringify(record), 'utf8')).toBeLessThanOrEqual(120)
    })
  })
})
