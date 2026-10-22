/**
 * The activity trace: turning one child's session events into the short, bounded log a
 * running card shows and a settled record keeps.
 *
 * Four boundaries live here, and each exists because the input is not trusted:
 *
 * - **shape**: two session events become entries — a `tool/call` (one call entry) and an
 *   `assistant/message` (one narration entry per reasoning or text block). The field names
 *   were measured on a real host composition (`dsh-plugin-desktop/scratch/agent-cwd-probe.mjs`,
 *   case [6]), not read off a type: `session/event` delivers `{ type: 'tool/call', data:
 *   { turn, step, callId, name, arguments } }`, where `data.name` is the tool and
 *   `data.arguments` is the raw JSON string the model produced; an assistant message
 *   carries `data.message.content`, an ordered block array.
 * - **secrets**: arguments and narration are model-authored, so either can carry a token
 *   the model was handed. {@link redactActivityText} removes what looks like one before
 *   the text is stored, shown, or truncated — truncating first could cut a secret into a
 *   fragment no pattern matches.
 * - **size**: an argument is cut to {@link WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH}, a
 *   narration to {@link WORKBENCH_ACTIVITY_TEXT_MAX_LENGTH}, and a trace keeps the last
 *   {@link WORKBENCH_ACTIVITY_MAX_ENTRIES} entries, with the count it dropped recorded as
 *   an entry of its own so nothing disappears silently.
 * @module dsh-workbench/skill-card-activity
 */

import type {
  WorkbenchActivityEntry,
  WorkbenchNarrationActivity,
  WorkbenchToolActivity,
  WorkbenchTraceTruncation,
} from './skill-card-contract.ts'
import {
  WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH,
  WORKBENCH_ACTIVITY_MAX_ENTRIES,
  WORKBENCH_ACTIVITY_TEXT_MAX_LENGTH,
  WORKBENCH_ACTIVITY_TOTAL_TEXT_MAX_LENGTH,
} from './skill-card-contract.ts'

/** One session event, as the Host bus delivers it. */
export interface WorkbenchActivityEvent {
  /** Event discriminator, e.g. `tool/call`. */
  readonly type: string
  /** The event's payload; read only when the type is one this module maps. */
  readonly data?: unknown
}

/** The suffix appended to an argument the length limit cut. */
export const WORKBENCH_ACTIVITY_ELLIPSIS = '…'

/** What a redacted span is replaced with. */
export const WORKBENCH_ACTIVITY_REDACTED = '***'

/**
 * Every secret that names itself in a model-authored argument.
 *
 * Ordered, and applied before truncation. The rule is deliberately shape-based rather than
 * a list of values this product happens to know: it has to catch a key the child was handed,
 * whatever issued it. The families are:
 *
 * - **flag values** — `--token abc`, `--password=abc`: the flag stays so the trace still
 *   says what the call was doing, and its value goes.
 * - **named values** — `password=abc`, `token: abc`, `api_key=abc`: the name and the
 *   separator stay, the value goes.
 * - **bearer credentials** — `Authorization: Bearer abc`.
 * - **prefixed credentials** — `sk-…`, `ghp_…`, `github_pat_…`, `AKIA…`: recognizable on
 *   their own, so the whole token goes.
 */
const NAMED_SECRET_PATTERNS: readonly {
  readonly pattern: RegExp
  /** Replacement for a match; `$1`/`$2` keep what the pattern captured on purpose. */
  readonly replacement: string
}[] = [
  // `--token abc`, `--password=abc`: the flag stays, its value goes.
  {
    pattern: /(?<![A-Za-z0-9])(--?(?:password|passwd|token|secret|api[-_]?key|access[-_]?key))(\s+|=)(?:"[^"]*"|'[^']*'|\S+)/gi,
    replacement: `$1$2${WORKBENCH_ACTIVITY_REDACTED}`,
  },
  // `password=abc`, `token: abc`, `client_secret = "abc"`: name and separator stay.
  {
    pattern: /\b(password|passwd|secret|token|api[-_]?key|access[-_]?key|client[-_]?secret)(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|\S+)/gi,
    replacement: `$1$2${WORKBENCH_ACTIVITY_REDACTED}`,
  },
  // `Authorization: Bearer abc`.
  {
    pattern: /(?<![A-Za-z0-9])bearer\s+[A-Za-z0-9._\-+/=]{8,}/gi,
    replacement: `Bearer ${WORKBENCH_ACTIVITY_REDACTED}`,
  },
  // Provider-prefixed keys: OpenAI-style `sk-`, GitHub, AWS.
  {
    pattern: /(?<![A-Za-z0-9])(?:sk|pk|rk)-[A-Za-z0-9_-]{8,}/g,
    replacement: WORKBENCH_ACTIVITY_REDACTED,
  },
  {
    pattern: /(?<![A-Za-z0-9])(?:gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{16,})/g,
    replacement: WORKBENCH_ACTIVITY_REDACTED,
  },
  {
    pattern: /(?<![A-Za-z0-9])AKIA[0-9A-Z]{12,}/g,
    replacement: WORKBENCH_ACTIVITY_REDACTED,
  },
]

/**
 * A long unbroken run of key material: what a base64 or hex token looks like once nothing
 * names it.
 *
 * A candidate is only replaced when it holds both a digit and a letter, which is what tells
 * a token apart from a long ordinary word — otherwise a 40-character identifier in an
 * argument would be masked for no reason, and the trace would lose the very text it exists
 * to show.
 */
const OPAQUE_SECRET_RUN = /(?<![A-Za-z0-9+/_-])[A-Za-z0-9+/_-]{32,}={0,2}(?![A-Za-z0-9+/_=-])/g

/**
 * Remove anything in one argument that looks like a secret.
 *
 * Applied to the text before truncation, so a credential that straddles the cut is replaced
 * whole rather than left as an unmatched fragment.
 * @param text - the argument as it was read off the event.
 * @returns the same text with every match replaced by `***`.
 */
export function redactActivityText(text: string): string {
  let redacted = text
  for (const { pattern, replacement } of NAMED_SECRET_PATTERNS) {
    // A fresh last index per pass: a shared global regex carries it between callers.
    pattern.lastIndex = 0
    redacted = redacted.replace(pattern, replacement)
  }
  OPAQUE_SECRET_RUN.lastIndex = 0
  redacted = redacted.replace(OPAQUE_SECRET_RUN, run =>
    (/[0-9]/.test(run) && /[A-Za-z]/.test(run) ? WORKBENCH_ACTIVITY_REDACTED : run))
  return redacted
}

/**
 * Cut one argument to the stored length, marking the cut.
 *
 * The ellipsis is what makes truncation visible in the entry itself: a reader who sees one
 * knows the call carried more than the card is showing. Counted in code points so a
 * multi-byte character is never cut in half.
 * @param text - redacted argument.
 * @returns the text, unchanged when it fits.
 */
export function truncateActivityText(text: string): string {
  return truncateTo(text, WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH)
}

/**
 * Cut one narration text to the stored length, marking the cut.
 * @param text - redacted narration.
 * @returns the text, unchanged when it fits.
 */
export function truncateNarrationText(text: string): string {
  return truncateTo(text, WORKBENCH_ACTIVITY_TEXT_MAX_LENGTH)
}

/**
 * Cut a string to a character budget, marking the cut.
 *
 * Counted in code points so a multi-byte character is never cut in half; the ellipsis is
 * what makes truncation visible in the entry itself.
 * @param text - the text to fit.
 * @param max - the budget in code points.
 * @returns the text, unchanged when it fits.
 */
function truncateTo(text: string, max: number): string {
  const points = Array.from(text)
  if (points.length <= max) return text
  return `${points.slice(0, max).join('')}${WORKBENCH_ACTIVITY_ELLIPSIS}`
}

/**
 * Read the first argument out of one `tool/call` payload.
 *
 * "First" is the first key of the parsed arguments object in the order the model produced
 * it — never a key this feature picked. Measured on `pwsh`, whose schema lists
 * `description` before `command`, that is the human-readable summary the tool schema itself
 * says is shown in the UI; on `read` it is the path. A string value travels verbatim, any
 * other value is serialised, and a payload that is not a JSON object falls back to its raw
 * text so an entry still exists for the call.
 * @param raw - `data.arguments`, the unparsed JSON string the model produced.
 * @returns the argument text, or undefined when the event carried none.
 */
export function firstArgumentOf(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return raw
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return typeof parsed === 'string' ? parsed : undefined
  }
  for (const value of Object.values(parsed)) {
    if (typeof value === 'string') return value
    const serialised = JSON.stringify(value)
    if (serialised !== undefined) return serialised
  }
  return undefined
}

/**
 * Read the entries one session event contributes.
 *
 * Two event types are mapped and nothing else is guessed at:
 *
 * - `tool/call` — one tool entry. Nothing is inferred from the tool's own name, and no
 *   other event type is guessed at: a `tool/result` carries no name at all (measured: its
 *   data keys are `turn`, `step`, `message`, `meta`), and a shell command is exactly a
 *   `tool/call` naming `pwsh` or `bash`.
 * - `assistant/message` — one narration entry per reasoning or text content block, in the
 *   order the model produced them, so the card reads like a conversation rather than a
 *   tool log. Tool-call blocks in the same message are already covered by their own
 *   `tool/call` event and are not repeated here.
 * @param event - one session event from the Host bus.
 * @returns the entries, in order; empty for an event the trace does not record.
 */
export function activityEntriesFor(event: WorkbenchActivityEvent): WorkbenchActivityEntry[] {
  if (event.type === 'assistant/message') return narrationEntriesFor(event.data)
  const tool = activityEntryFor(event)
  return tool === undefined ? [] : [tool]
}

/**
 * Read the narration blocks out of one `assistant/message` payload.
 *
 * Measured shape: `data.message.content` is an ordered block array, where a reasoning
 * block is `{ type: 'reasoning', text }` and a reply block is `{ type: 'text', text }`.
 * Empty blocks are dropped: a step that only called a tool has nothing to narrate, and an
 * empty row would read as a step that said nothing on purpose.
 * @param data - the event payload.
 * @returns one entry per non-empty reasoning or text block.
 */
function narrationEntriesFor(data: unknown): WorkbenchNarrationActivity[] {
  if (typeof data !== 'object' || data === null) return []
  const message: unknown = Reflect.get(data, 'message')
  if (typeof message !== 'object' || message === null) return []
  const content: unknown = Reflect.get(message, 'content')
  if (!Array.isArray(content)) return []
  const entries: WorkbenchNarrationActivity[] = []
  for (const block of content) {
    if (typeof block !== 'object' || block === null) continue
    const type: unknown = Reflect.get(block, 'type')
    if (type !== 'reasoning' && type !== 'text') continue
    const text: unknown = Reflect.get(block, 'text')
    if (typeof text !== 'string') continue
    const trimmed = text.trim()
    if (trimmed === '') continue
    entries.push({ kind: type, text: truncateNarrationText(redactActivityText(trimmed)) })
  }
  return entries
}

/**
 * Read one tool entry out of one session event.
 *
 * Kept as its own public mapping because the tool case is the one the trace's redaction and
 * truncation rules were first measured against; {@link activityEntriesFor} is what the
 * runner uses, because an event can contribute more than one entry.
 * @param event - one session event from the Host bus.
 * @returns the entry, or undefined for an event that is not a tool call.
 */
export function activityEntryFor(event: WorkbenchActivityEvent): WorkbenchToolActivity | undefined {
  if (event.type !== 'tool/call') return undefined
  const data = event.data
  if (typeof data !== 'object' || data === null) return undefined
  const name: unknown = Reflect.get(data, 'name')
  if (typeof name !== 'string' || name === '') return undefined
  const argument = firstArgumentOf(Reflect.get(data, 'arguments'))
  return {
    kind: 'tool',
    tool: name,
    // Absent argument is an empty string rather than a dropped field: the entry still says
    // which tool ran, which is the fact the user is reading the trace for.
    argument: truncateActivityText(redactActivityText(argument ?? '')),
  }
}

/**
 * Split a trace into its real entries and the number it already admits to dropping.
 * @param trace - a stored trace, possibly carrying markers from an earlier bound.
 * @returns the call and narration entries, oldest first, and the total dropped count.
 */
export function splitActivity(trace: readonly WorkbenchActivityEntry[] | undefined): {
  readonly entries: readonly (WorkbenchToolActivity | WorkbenchNarrationActivity)[]
  readonly dropped: number
} {
  const entries: (WorkbenchToolActivity | WorkbenchNarrationActivity)[] = []
  let dropped = 0
  for (const entry of trace ?? []) {
    if (entry.kind === 'truncated') dropped += entry.dropped
    else entries.push(entry)
  }
  return { entries, dropped }
}

/**
 * Fit one trace to the entry and narration budgets, keeping the newest entries.
 *
 * Two limits bite here and whichever binds first decides: the entry count
 * ({@link WORKBENCH_ACTIVITY_MAX_ENTRIES}) bounds a run that calls many tools, and the
 * narration characters ({@link WORKBENCH_ACTIVITY_TOTAL_TEXT_MAX_LENGTH}) bound a run whose
 * thinking is long. Entries are dropped from the front, and the count of everything dropped
 * is carried as the marker entry rather than as a second field on the record, so it
 * survives the same round trip as the entries do and cannot be lost by a reader that
 * ignores it.
 * @param trace - the trace to fit, already carrying any earlier marker.
 * @returns the entries kept, newest last, plus one marker when anything was dropped.
 */
export function boundActivity(trace: readonly WorkbenchActivityEntry[]): WorkbenchActivityEntry[] {
  const { entries, dropped } = splitActivity(trace)
  let first = Math.max(0, entries.length - WORKBENCH_ACTIVITY_MAX_ENTRIES)
  let kept = entries.slice(first)
  let narration = narrationCharacters(kept)
  while (narration > WORKBENCH_ACTIVITY_TOTAL_TEXT_MAX_LENGTH && kept.length > 1) {
    const shed = kept[0]
    if (shed === undefined) break
    kept = kept.slice(1)
    first += 1
    narration -= shed.kind === 'tool' ? 0 : Array.from(shed.text).length
  }
  const total = dropped + first
  const marker: WorkbenchTraceTruncation[] = total === 0 ? [] : [{ kind: 'truncated', dropped: total }]
  return [...marker, ...kept]
}

/**
 * Count the narration characters one trace carries.
 * @param entries - the entries to measure.
 * @returns their combined narration length in characters.
 */
function narrationCharacters(entries: readonly (WorkbenchToolActivity | WorkbenchNarrationActivity)[]): number {
  let total = 0
  for (const entry of entries) {
    if (entry.kind !== 'tool') total += Array.from(entry.text).length
  }
  return total
}

/**
 * Append entries to a trace and fit the result.
 * @param trace - the trace so far; absent starts an empty one.
 * @param entries - the entries just recorded, oldest first.
 * @returns the bounded trace.
 */
export function withActivityEntries(
  trace: readonly WorkbenchActivityEntry[] | undefined,
  entries: readonly WorkbenchActivityEntry[],
): WorkbenchActivityEntry[] {
  return boundActivity([...(trace ?? []), ...entries])
}

/**
 * Append one entry to a trace and fit the result.
 * @param trace - the trace so far; absent starts an empty one.
 * @param entry - the call just recorded.
 * @returns the bounded trace.
 */
export function withActivityEntry(
  trace: readonly WorkbenchActivityEntry[] | undefined,
  entry: WorkbenchToolActivity,
): WorkbenchActivityEntry[] {
  return withActivityEntries(trace, [entry])
}
