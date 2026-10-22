/**
 * The stored shape of the skill card domain.
 *
 * A field the store writes but this schema does not declare survives the write and is
 * dropped on the next load, which the user experiences as "it saved, then reverted
 * after a restart". These cases exist so that class of bug fails here instead.
 */

import { describe, expect, it } from 'vitest'
import {
  workbenchCardConfigSchema,
  workbenchResultSchema,
  workbenchTemplateSchema,
} from '../src/skill-card-spec.ts'

describe('workbench storage schemas', () => {
  it('keeps the card name across a load', () => {
    // The card's selection and its name share one record. Declaring only the selection
    // dropped every rename on the next start while the skill name kept showing, because
    // that field happened to be declared.
    const stored = { skill: 'xiaoneng-task-detail', name: '效能任务' }
    expect(workbenchCardConfigSchema.parse(stored)).toEqual(stored)
  })

  it('keeps a card that has a name but no selection, and the reverse', () => {
    expect(workbenchCardConfigSchema.parse({ name: '效能任务' })).toEqual({ name: '效能任务' })
    expect(workbenchCardConfigSchema.parse({ skill: 'git-repo' })).toEqual({ skill: 'git-repo' })
  })

  it('accepts an empty record, because absence means not configured yet', () => {
    expect(workbenchCardConfigSchema.parse({})).toEqual({})
  })

  it('keeps a template and a result whole', () => {
    expect(workbenchTemplateSchema.parse({ html: '<p>a</p>' })).toEqual({ html: '<p>a</p>' })
    const result = { skill: 'git-repo', executedAt: 1, stopReason: 'completed', structured: { html: '<p>a</p>' } }
    expect(workbenchResultSchema.parse(result)).toEqual(result)
  })

  it('keeps the moment of a hand edit across a load', () => {
    // Criterion 70. `editedAt` is written by the store's hand-edit path, so it has to be
    // declared here in the same change: an undeclared field survives the write and is
    // dropped on the next load, and the 手工编辑 row then disappears after a restart.
    const result = {
      skill: 'git-repo',
      executedAt: 2,
      editedAt: 2,
      stopReason: 'completed',
      structured: { html: '<p>a</p>' },
    }
    expect(workbenchResultSchema.parse(result)).toEqual(result)
  })

  it('leaves a result that no one edited without provenance', () => {
    // Absent and zero are not the same fact: a record with no `editedAt` says "a run wrote
    // every byte of this", and the schema must not invent one.
    const parsed = workbenchResultSchema.parse({ skill: 'git-repo', executedAt: 1, stopReason: 'completed' })
    expect(parsed).not.toHaveProperty('editedAt')
    expect(workbenchResultSchema.parse({ skill: 'git-repo', executedAt: 1, editedAt: 0, stopReason: 'completed' }))
      .toHaveProperty('editedAt', 0)
  })

  it('keeps the card permission mode across a load', () => {
    // Criterion 102. The mode is written by the configuration page, so it has to be declared
    // here in the same change. Losing it is the worst of the four fields: the card would come
    // back under the default and run with wider write access than the page showed.
    const stored = { skill: 'git-repo', name: 'Repo', permission: 'read-only' }
    expect(workbenchCardConfigSchema.parse(stored)).toEqual(stored)
    // The whole record, because every field shares it: a mode may not cost another field.
    const whole = {
      skill: 'xiaoneng-task-detail',
      name: '效能任务',
      model: { provider: 'vendor/gateway', model: 'large' },
      workspace: { path: 'D:\\Git\\Personal-Workbench' },
      permission: 'danger-full-access',
    }
    expect(workbenchCardConfigSchema.parse(whole)).toEqual(whole)
  })

  it('leaves a card that names no permission mode without one', () => {
    // Absence is the state of every card created before this field existed, and it is not
    // the same fact as a card that chose the default: the schema must invent neither.
    const parsed = workbenchCardConfigSchema.parse({ skill: 'git-repo' })
    expect(parsed).not.toHaveProperty('permission')
  })

  it('refuses a permission mode this build does not know', () => {
    // The enum is the sandbox vocabulary, so a mode outside it fails here (and the domain
    // backs the record up and skips it) rather than reaching a session as an event nothing
    // enforces.
    for (const permission of ['full-control', '', 'READ-ONLY', 3]) {
      expect(workbenchCardConfigSchema.safeParse({ skill: 'git-repo', permission }).success)
        .toBe(false)
    }
  })

  it('keeps the card model across a load, as a pair rather than one string', () => {    // Criterion 71. The route is written by the configuration page, so it has to be
    // declared in the same change: an undeclared field survives the write and is dropped on
    // the next load, which the user reads as "the model reverted after a restart".
    // The provider id deliberately contains a slash: a `"provider/model"` string could not
    // be split back into these two fields without guessing.
    const stored = { skill: 'xiaoneng-task-detail', name: '效能任务', model: { provider: 'vendor/gateway', model: 'large' } }
    expect(workbenchCardConfigSchema.parse(stored)).toEqual(stored)
  })

  it('leaves a card that names no model without one', () => {
    // Absent means "this card inherits the session's model", which is the state every card
    // created before this field existed is in. The schema must not invent a route.
    const parsed = workbenchCardConfigSchema.parse({ skill: 'git-repo' })
    expect(parsed).not.toHaveProperty('model')
  })

  it('keeps the card workspace across a load', () => {
    // The directory is written by the configuration page, so it has to be declared here in
    // the same change: a card that lost its path after a restart would silently stop being
    // runnable, with nothing on screen to say why.
    // The provider id in `model` deliberately contains a slash, and the path is a Windows
    // one: neither field may be re-interpreted on the way through.
    const stored = {
      skill: 'xiaoneng-task-detail',
      name: '效能任务',
      model: { provider: 'vendor/gateway', model: 'large' },
      workspace: { path: 'D:\\Git\\Personal-Workbench' },
    }
    expect(workbenchCardConfigSchema.parse(stored)).toEqual(stored)
  })

  it('keeps a workspace written on its own, and leaves an unrelated field alone', () => {
    // Absence is the state of every card created before this field existed: they cannot run
    // until one is configured, and the schema must not invent a directory for them.
    expect(workbenchCardConfigSchema.parse({ workspace: { path: '/repo' } }))
      .toEqual({ workspace: { path: '/repo' } })
    const parsed = workbenchCardConfigSchema.parse({ skill: 'git-repo', name: 'Repo' })
    expect(parsed).not.toHaveProperty('workspace')
    // And the other fields survive a record that carries one.
    const both = workbenchCardConfigSchema.parse({ name: 'Repo', workspace: { path: '/repo' } })
    expect(both).toEqual({ name: 'Repo', workspace: { path: '/repo' } })
  })

  it('keeps the model a result ran on across a load', () => {
    // Criterion 72. The runner stamps the route it used, so the result page can name it
    // after a restart; a record written with the field and read without it would leave the
    // user guessing which model produced what they are reading.
    const result = {
      skill: 'git-repo',
      executedAt: 1,
      stopReason: 'completed',
      model: { provider: 'deepseek', model: 'deepseek-chat' },
      structured: { html: '<p>a</p>' },
    }
    expect(workbenchResultSchema.parse(result)).toEqual(result)
  })

  it('leaves a result that inherited a model without one', () => {
    const parsed = workbenchResultSchema.parse({ skill: 'git-repo', executedAt: 1, stopReason: 'completed' })
    expect(parsed).not.toHaveProperty('model')
  })

  it('keeps the run activity trace across a load', () => {
    // The fifth field added this way. The runner writes the trace and 运行详情 renders it, so
    // the schema has to declare it in the same change: an undeclared field survives the write
    // and is dropped on the next load, which would show the stream while the run is live and
    // lose every line of it after a restart.
    const result = {
      skill: 'git-repo',
      executedAt: 1,
      stopReason: 'completed',
      activity: [
        { kind: 'tool', tool: 'pwsh', argument: 'Probe one shell call' },
        { kind: 'tool', tool: 'read', argument: 'D:\\Git\\Personal-Workbench\\README.md' },
      ],
    }
    const parsed = workbenchResultSchema.parse(result)
    expect(parsed).toEqual(result)
    // Round trip in the shape storage actually performs: stringify, parse, parse again.
    expect(workbenchResultSchema.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(result)
  })

  it('keeps the truncation marker, which is the trace admitting what it dropped', () => {
    const result = {
      skill: 'git-repo',
      executedAt: 1,
      stopReason: 'completed',
      activity: [{ kind: 'truncated', dropped: 6 }, { kind: 'tool', tool: 'read', argument: 'a' }],
    }
    expect(workbenchResultSchema.parse(result)).toEqual(result)
  })

  it('leaves a run that called no tools without a trace field', () => {
    // Absent is not the same fact as an empty list: the result page draws no activity
    // section for it, and the schema must not invent an empty one.
    const parsed = workbenchResultSchema.parse({ skill: 'git-repo', executedAt: 1, stopReason: 'completed' })
    expect(parsed).not.toHaveProperty('activity')
  })

  it('refuses an activity entry this build cannot render', () => {
    // A record with a kind nothing maps would be drawn as a blank row, so it fails here and
    // the domain backs it up and skips it — the same treatment every other unreadable
    // record gets.
    for (const activity of [
      [{ kind: 'thought', tool: 'read', argument: 'a' }],
      [{ kind: 'tool', argument: 'a' }],
      [{ kind: 'tool', tool: '', argument: 'a' }],
      [{ kind: 'truncated', dropped: 0 }],
      [{ kind: 'truncated', dropped: -1 }],
      [{ kind: 'tool', tool: 'read', argument: 'a' }, 'oops'],
    ]) {
      expect(workbenchResultSchema.safeParse({ skill: 'git-repo', executedAt: 1, stopReason: 'completed', activity }).success)
        .toBe(false)
    }
  })
})
