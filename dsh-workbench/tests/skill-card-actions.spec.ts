/** @vitest-environment jsdom */
/**
 * Reading a child-authored button's action, and the closed attribute allowlist.
 *
 * The payload is the one place remote data reaches a later run, so the reading rules
 * here are the feature's safety boundary: a payload is either read whole or the click
 * is refused.
 */

import { describe, expect, it } from 'vitest'
import {
  WORKBENCH_ACTION_ATTRIBUTES,
  WORKBENCH_ACTION_PAYLOAD_MAX_BYTES,
} from '../src/skill-card-contract.ts'
import { readActionEvent } from '../src/client/skill-card/render.ts'
import { parseTemplate } from '../src/client/skill-card/template.ts'

/**
 * Build one element from HTML, as the real parser would.
 * @param html - the button markup.
 * @returns the first element in the fragment.
 */
function element(html: string): Element {
  const found = parseTemplate(html).querySelector('button')
  if (found === null) throw new Error('the fixture produced no button')
  return found
}

describe('workbench skill card actions', () => {
  describe('the attribute allowlist', () => {
    it('is closed at exactly the two attributes the reader understands', () => {
      // Driving the reader from a list rather than from a prefix is what makes an
      // unknown or misspelled attribute do nothing instead of becoming a new action.
      expect(WORKBENCH_ACTION_ATTRIBUTES).toEqual(['data-dsh-action', 'data-dsh-row'])
    })
  })

  describe('reading an action', () => {
    it('reads the key and the raw fields', () => {
      const button = element('<button data-dsh-action="finish" data-dsh-row=\'{"task_status":1}\'>go</button>')
      expect(readActionEvent(button)).toEqual({
        kind: 'action',
        key: 'finish',
        payload: { task_status: 1 },
      })
    })

    it('keeps the raw value, not a rendered one', () => {
      // The same row displays 进行中; the payload must stay 1 so a later run can still
      // act on the code rather than on a translation of it.
      const button = element('<button data-dsh-action="finish" data-dsh-row=\'{"task_status":1}\'>进行中</button>')
      const event = readActionEvent(button)
      expect(event.kind).toBe('action')
      expect(event.kind === 'action' ? event.payload.task_status : undefined).toBe(1)
    })

    it('refuses a button that carries no payload', () => {
      // The row's fields are what the run receives, so a missing payload is not an
      // empty one.
      const button = element('<button data-dsh-action="finish">go</button>')
      expect(readActionEvent(button)).toEqual({ kind: 'invalid', reason: 'malformed-payload' })
    })

    it('refuses a payload that is not JSON', () => {
      const button = element('<button data-dsh-action="finish" data-dsh-row=\'not json\'>go</button>')
      expect(readActionEvent(button)).toEqual({ kind: 'invalid', reason: 'malformed-payload' })
    })

    it('refuses a payload that is not an object', () => {
      // A bare array or scalar cannot describe one row's fields.
      for (const raw of ['[]', '[{"a":1}]', '"text"', '7', 'null']) {
        const button = element(`<button data-dsh-action="finish" data-dsh-row='${raw}'>go</button>`)
        expect(readActionEvent(button)).toEqual({ kind: 'invalid', reason: 'malformed-payload' })
      }
    })

    it('refuses a missing or unusable key', () => {
      for (const key of ['', '   ', 'has space', 'a'.repeat(33), '中文']) {
        const button = element(`<button data-dsh-action="${key}" data-dsh-row='{"a":1}'>go</button>`)
        expect(readActionEvent(button)).toEqual({ kind: 'invalid', reason: 'missing-action' })
      }
    })

    it('refuses a payload over budget rather than truncating it', () => {
      // A truncated payload would let the confirmation panel show one set of
      // parameters while the run used another.
      const long = 'x'.repeat(WORKBENCH_ACTION_PAYLOAD_MAX_BYTES)
      const button = element(`<button data-dsh-action="finish" data-dsh-row='{"a":"${long}"}'>go</button>`)
      expect(readActionEvent(button)).toEqual({ kind: 'invalid', reason: 'oversized-payload' })
    })

    it('accepts a payload exactly at budget', () => {
      const fill = 'x'.repeat(WORKBENCH_ACTION_PAYLOAD_MAX_BYTES - '{"a":""}'.length)
      const raw = `{"a":"${fill}"}`
      expect(new TextEncoder().encode(raw).length).toBe(WORKBENCH_ACTION_PAYLOAD_MAX_BYTES)
      const button = element(`<button data-dsh-action="finish" data-dsh-row='${raw}'>go</button>`)
      expect(readActionEvent(button).kind).toBe('action')
    })
  })

  describe('quotes inside a payload', () => {
    it('reads a value that escapes its single quote', () => {
      // The attribute is single-quoted, so a quote inside a value has to be &#39;.
      const button = element('<button data-dsh-action="finish" data-dsh-row=\'{"name":"O&#39;Reilly"}\'>go</button>')
      expect(readActionEvent(button)).toEqual({
        kind: 'action',
        key: 'finish',
        payload: { name: "O'Reilly" },
      })
    })

    it('refuses a value that leaves its single quote unescaped', () => {
      // This is the failure the escaping rule exists for: the attribute ends at the
      // stray quote, so what arrives is a fragment that cannot be parsed — and the
      // whole click is refused instead of running on a partial payload.
      const button = element('<button data-dsh-action="finish" data-dsh-row=\'{"name":"O\'Reilly"}\'>go</button>')
      expect(readActionEvent(button)).toEqual({ kind: 'invalid', reason: 'malformed-payload' })
    })
  })

  describe('attributes outside the allowlist', () => {
    it('ignores an unknown data-dsh attribute', () => {
      // A misspelled or unfamiliar attribute must do nothing, not silently act.
      const button = element(
        '<button data-dsh-action="finish" data-dsh-row=\'{"a":1}\' data-dsh-act="other">go</button>',
      )
      const event = readActionEvent(button)
      expect(event.kind).toBe('action')
      expect(event.kind === 'action' ? event.key : undefined).toBe('finish')
    })
  })
})
