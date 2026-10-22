/**
 * The activity trace's three boundaries: what becomes an entry, what a secret looks like,
 * and what a bound drops.
 *
 * Every shape asserted here was measured on a real host composition rather than inferred
 * from a type: `dsh-plugin-desktop/scratch/agent-cwd-probe.mjs` case [6] boots the shipped
 * bundle, starts a seam activation, and logs the bus. A `tool/call` arrives on
 * `session/event` as `{ type: 'tool/call', data: { turn, step, callId, name, arguments } }`,
 * where `name` is the tool and `arguments` is the raw JSON string the model produced. The
 * `pwsh` call it recorded was `{"description":"Probe one shell call","command":"echo …"}`,
 * with the tool schema itself listing `description` first.
 */

import { describe, expect, it } from 'vitest'
import {
  WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH,
  WORKBENCH_ACTIVITY_MAX_ENTRIES,
} from '../src/skill-card-contract.ts'
import type { WorkbenchActivityEntry, WorkbenchToolActivity } from '../src/skill-card-contract.ts'
import {
  WORKBENCH_ACTIVITY_ELLIPSIS,
  activityEntryFor,
  boundActivity,
  firstArgumentOf,
  redactActivityText,
  splitActivity,
  truncateActivityText,
  withActivityEntry,
} from '../src/skill-card-activity.ts'

/**
 * Build one `tool/call` event the way the bus delivered it.
 * @param name - tool name.
 * @param args - arguments object the model produced.
 * @returns the event.
 */
function call(name: string, args: unknown): { type: string; data: unknown } {
  return { type: 'tool/call', data: { turn: 1, step: 1, callId: 'call-1', name, arguments: JSON.stringify(args) } }
}

/**
 * Build one entry directly, for the bounding cases.
 * @param index - a stable marker for the case to assert on.
 * @returns the entry.
 */
function entry(index: number): WorkbenchToolActivity {
  return { kind: 'tool', tool: 'read', argument: `file-${String(index)}` }
}

describe('activity mapping', () => {
  it('reads the tool name and the first argument out of a measured tool/call payload', () => {
    const mapped = activityEntryFor(call('pwsh', { description: 'Probe one shell call', command: 'echo hi' }))
    expect(mapped).toEqual({ kind: 'tool', tool: 'pwsh', argument: 'Probe one shell call' })
  })

  it('uses the order the model produced, not an order this feature picks', () => {
    // The same two fields the other way round: "first" is positional, so reversing the
    // payload reverses the entry. A rule that preferred `command` would hide that.
    const mapped = activityEntryFor(call('pwsh', { command: 'echo hi', description: 'Probe one shell call' }))
    expect(mapped?.argument).toBe('echo hi')
  })

  it('carries a one-argument tool verbatim, which is the common case', () => {
    // Measured on `read`/`write`/`grep`: a path or a pattern, and nothing else.
    expect(activityEntryFor(call('read', { path: 'D:\\Git\\Personal-Workbench\\README.md' })))
      .toEqual({ kind: 'tool', tool: 'read', argument: 'D:\\Git\\Personal-Workbench\\README.md' })
  })

  it('serialises a first argument that is not a string', () => {
    expect(activityEntryFor(call('todo_write', { todos: [{ id: 1 }] }))?.argument).toBe('[{"id":1}]')
  })

  it('keeps an entry for a call whose arguments are empty or unreadable', () => {
    // The tool still ran, so the trace still names it. Only the argument is unknown.
    expect(activityEntryFor({ type: 'tool/call', data: { name: 'glob', arguments: '{}' } }))
      .toEqual({ kind: 'tool', tool: 'glob', argument: '' })
    expect(activityEntryFor({ type: 'tool/call', data: { name: 'glob', arguments: 'not json' } }))
      .toEqual({ kind: 'tool', tool: 'glob', argument: 'not json' })
    expect(activityEntryFor({ type: 'tool/call', data: { name: 'glob' } }))
      .toEqual({ kind: 'tool', tool: 'glob', argument: '' })
  })

  it('ignores every event that is not a tool call', () => {
    // `tool/result` carries no name at all (measured data keys: turn, step, message, meta),
    // and `command/run` is a slash command — it stayed silent during a real shell call.
    const others = [
      { type: 'tool/result', data: { turn: 1, step: 1, message: { callId: 'x' }, meta: {} } },
      { type: 'command/run', data: { commandId: 'c', name: 'goal' } },
      { type: 'assistant/message', data: { turn: 1, step: 1 } },
      { type: 'user/message', data: { role: 'user' } },
      { type: 'turn/start', data: { turn: 1 } },
    ]
    for (const event of others) expect(activityEntryFor(event)).toBeUndefined()
  })

  it('ignores a tool call that names no tool', () => {
    // A payload without a usable name cannot become "tool name + argument", so it is not an
    // entry rather than an entry with a blank name.
    expect(activityEntryFor({ type: 'tool/call', data: { name: '', arguments: '{}' } })).toBeUndefined()
    expect(activityEntryFor({ type: 'tool/call', data: { arguments: '{}' } })).toBeUndefined()
    expect(activityEntryFor({ type: 'tool/call', data: undefined })).toBeUndefined()
  })

  it('treats a non-object arguments payload as the text it is', () => {
    expect(firstArgumentOf('"just a string"')).toBe('just a string')
    expect(firstArgumentOf('[1,2]')).toBeUndefined()
    expect(firstArgumentOf('')).toBeUndefined()
    expect(firstArgumentOf(undefined)).toBeUndefined()
  })
})

describe('activity truncation', () => {
  it('cuts the first argument at 60 characters and says so', () => {
    const long = 'x'.repeat(200)
    const mapped = activityEntryFor(call('write', { path: long }))
    const argument = mapped?.argument ?? ''
    // 60 kept characters plus the marker that admits the cut. Without the marker the text
    // would read as a path that ends mid-word.
    expect(Array.from(argument)).toHaveLength(WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH + 1)
    expect(argument.endsWith(WORKBENCH_ACTIVITY_ELLIPSIS)).toBe(true)
    expect(argument).toBe(`${'x'.repeat(WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH)}${WORKBENCH_ACTIVITY_ELLIPSIS}`)
  })

  it('leaves an argument of exactly the limit alone', () => {
    const exact = 'y'.repeat(WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH)
    expect(truncateActivityText(exact)).toBe(exact)
  })

  it('counts code points, so a multi-byte character is never cut in half', () => {
    const cjk = '甘'.repeat(80)
    const cut = truncateActivityText(cjk)
    expect(Array.from(cut)).toHaveLength(WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH + 1)
    expect(cut).toBe(`${'甘'.repeat(WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH)}${WORKBENCH_ACTIVITY_ELLIPSIS}`)
  })
})

describe('activity redaction', () => {
  it('removes a credential a flag carries, keeping the flag', () => {
    expect(redactActivityText('--token abc123secret')).toBe('--token ***')
    expect(redactActivityText('--password=hunter2')).toBe('--password=***')
  })

  it('removes a named value, keeping the name', () => {
    expect(redactActivityText('password=hunter2')).toBe('password=***')
    expect(redactActivityText('token: abcdef')).toBe('token: ***')
    expect(redactActivityText('client_secret = "s3cr3t"')).toBe('client_secret = ***')
  })

  it('removes a bearer credential', () => {
    expect(redactActivityText('Authorization: Bearer abcdefghijklmnop')).toContain('***')
    expect(redactActivityText('Authorization: Bearer abcdefghijklmnop')).not.toContain('abcdefghijklmnop')
  })

  it('removes a prefixed credential whole', () => {
    expect(redactActivityText('sk-proj-abcdefghijklmnop')).toBe('***')
    expect(redactActivityText('ghp_abcdefghijklmnopqrst')).toBe('***')
    expect(redactActivityText('AKIAIOSFODNN7EXAMPLE')).toBe('***')
  })

  it('removes a long opaque run only when it looks like key material', () => {
    // A hex or base64 token: digits and letters together.
    expect(redactActivityText('0123456789abcdef0123456789abcdef01234567')).toBe('***')
    // A long ordinary word is not a secret, and masking it would delete the text the trace
    // exists to show.
    expect(redactActivityText('a'.repeat(48))).toBe('a'.repeat(48))
  })

  it('leaves an ordinary command, path, or pattern exactly as written', () => {
    for (const text of [
      'echo dsh-probe-tool-activity',
      'D:\\Git\\Personal-Workbench\\README.md',
      'src/skill-card-runner.ts',
      'Get-ChildItem -Recurse -Force D:\\Git\\Personal-Workbench',
    ]) expect(redactActivityText(text)).toBe(text)
  })

  it('redacts before it truncates, so a cut cannot leave a fragment of a key', () => {
    // The credential starts at character 56: cutting first would store "… sk-b" — a fragment
    // no pattern matches, and still a leaked prefix.
    const text = `${'A'.repeat(55)} sk-${'b'.repeat(30)}`
    const argument = activityEntryFor(call('pwsh', { command: text }))?.argument ?? ''
    expect(argument).not.toContain('sk-')
    expect(argument).toContain('***')
  })

  it('redacts the first argument of the stored entry, not the whole call', () => {
    // The leak boundary is the entry, so a secret anywhere in the argument that became the
    // entry is gone — while the second argument, which is never stored, is irrelevant.
    const mapped = activityEntryFor(call('pwsh', { command: 'curl --token abc123 https://example.test' }))
    expect(mapped?.argument).toBe('curl --token *** https://example.test')
  })
})

describe('activity bounding', () => {
  it('keeps the last entries and records how many it dropped', () => {
    let trace: WorkbenchActivityEntry[] = []
    const total = WORKBENCH_ACTIVITY_MAX_ENTRIES + 6
    for (let index = 0; index < total; index += 1) trace = withActivityEntry(trace, entry(index))
    const { tools, dropped } = splitActivity(trace)
    expect(dropped).toBe(6)
    expect(tools).toHaveLength(WORKBENCH_ACTIVITY_MAX_ENTRIES)
    // The survivors are the newest ones: the trace is read from its end.
    expect(tools[0]).toEqual(entry(6))
    expect(tools[tools.length - 1]).toEqual(entry(total - 1))
    // And the marker is a row in the trace, so a reader of the array alone sees the cut.
    expect(trace[0]).toEqual({ kind: 'truncated', dropped: 6 })
    expect(trace).toHaveLength(WORKBENCH_ACTIVITY_MAX_ENTRIES + 1)
  })

  it('accumulates the count across successive bounds', () => {
    // The bound runs on every append, so a run of 200 calls must not report "1 dropped" in
    // each of the last steps: the marker carries the running total.
    let trace: WorkbenchActivityEntry[] = []
    const total = WORKBENCH_ACTIVITY_MAX_ENTRIES * 3
    for (let index = 0; index < total; index += 1) trace = withActivityEntry(trace, entry(index))
    const { dropped } = splitActivity(trace)
    expect(dropped).toBe(total - WORKBENCH_ACTIVITY_MAX_ENTRIES)
    expect(boundActivity(trace)).toEqual(trace)
  })

  it('stays under the bound, and carries no marker, while nothing was dropped', () => {
    let trace: WorkbenchActivityEntry[] = []
    for (let index = 0; index < WORKBENCH_ACTIVITY_MAX_ENTRIES; index += 1) trace = withActivityEntry(trace, entry(index))
    expect(trace).toHaveLength(WORKBENCH_ACTIVITY_MAX_ENTRIES)
    expect(trace.every(one => one.kind === 'tool')).toBe(true)
  })

  it('costs a bounded trace a small fraction of the record budget', () => {
    // Why 64: a full trace has to stay well clear of WORKBENCH_RESULT_MAX_BYTES (64 KiB), so
    // it can never be what evicts the structured value the card renders.
    let trace: WorkbenchActivityEntry[] = []
    for (let index = 0; index < WORKBENCH_ACTIVITY_MAX_ENTRIES + 10; index += 1) {
      trace = withActivityEntry(trace, { kind: 'tool', tool: 'pwsh', argument: 'z'.repeat(60) })
    }
    expect(Buffer.byteLength(JSON.stringify(trace), 'utf8')).toBeLessThan(8 * 1024)
  })
})
