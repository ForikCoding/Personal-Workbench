/**
 * Dictionary parity for the `workbench` locale namespace.
 *
 * `en` is annotated `Record<keyof typeof zh, string>`, so a key missing from the
 * English dictionary is already a compile error. Nothing catches an **extra**
 * English key, and a key with no reader is a defect in this repository — so the
 * key sets are pinned here as well.
 */

import { describe, expect, it } from 'vitest'
import { en, zh } from '../src/client/locales.ts'

describe('workbench dictionaries', () => {
  it('carry exactly the same keys in both languages', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
  })

  it('hold no empty value', () => {
    for (const [key, value] of Object.entries(zh)) {
      expect(value.length, `zh.${key}`).toBeGreaterThan(0)
    }
    for (const [key, value] of Object.entries(en)) {
      expect(value.length, `en.${key}`).toBeGreaterThan(0)
    }
  })
})
