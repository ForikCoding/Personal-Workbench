/** Behaviour of the workbench layout storage domain declaration. */

import { describe, expect, it } from 'vitest'
import { descriptorOf, defineDomain } from '@deepseek-ai/dsh-storage-domain'
import {
  WORKBENCH_LAYOUT_DOMAIN,
  WORKBENCH_LAYOUT_TABLE,
  workbenchCardLayoutSchema,
} from '../src/layout-spec.ts'

describe('workbench layout domain', () => {
  it('is a per-record domain whose single table holds card layouts', () => {
    const descriptor = descriptorOf(WORKBENCH_LAYOUT_DOMAIN)
    expect(descriptor.name).toBe('workbench_layout')
    expect(descriptor.layout).toBe('per-record')
    expect(descriptor.tables).toEqual([WORKBENCH_LAYOUT_TABLE])
    expect(descriptor.hasGlobal).toBe(false)
  })

  it('survives an unreadable record instead of refusing to open', () => {
    // The whole point of the table layout: `global` has no skip policy, so a
    // single bad document would otherwise cost the workbench at startup.
    expect(WORKBENCH_LAYOUT_DOMAIN.invalidRecords).toBe('backup-and-skip')
  })

  it('accepts an arranged record and an empty one', () => {
    expect(workbenchCardLayoutSchema.parse({ position: 1024 })).toEqual({ position: 1024 })
    expect(workbenchCardLayoutSchema.parse({})).toEqual({})
  })

  it('drops a hidden field a stored document still carries', () => {
    // Hiding is not a capability any more, and there is no migration step: the
    // field is not part of the schema, so it is simply not read back.
    expect(workbenchCardLayoutSchema.parse({ position: 1024, hidden: true })).toEqual({ position: 1024 })
    expect(workbenchCardLayoutSchema.parse({ hidden: true })).toEqual({})
  })

  it('rejects a position that is not a finite non-negative number', () => {
    expect(() => workbenchCardLayoutSchema.parse({ position: -1 })).toThrow()
    expect(() => workbenchCardLayoutSchema.parse({ position: Number.POSITIVE_INFINITY })).toThrow()
    expect(() => workbenchCardLayoutSchema.parse({ position: 'first' })).toThrow()
  })

  it('refuses a domain name outside the storage naming rule', () => {
    expect(() => defineDomain({ name: 'workbench-layout', version: 1, tables: {} })).toThrow(/must match/)
  })
})
