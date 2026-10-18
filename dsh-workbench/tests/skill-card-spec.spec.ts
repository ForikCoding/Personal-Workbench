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
})
