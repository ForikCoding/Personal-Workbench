/**
 * The activity trace: turning one child's session events into the short, bounded log a
 * running card shows and a settled record keeps.
 *
 * Three boundaries live here, and each exists because the input is not trusted:
 *
 * - **shape**: only a session `tool/call` becomes an entry. The event names and the field
 *   that carries the tool name and the argument were measured on a real host composition
 *   (`dsh-plugin-desktop/scratch/agent-cwd-probe.mjs`, case [6]), not read off a type:
 *   `session/event` delivers `{ type: 'tool/call', data: { turn, step, callId, name,
 *   arguments } }`, where `data.name` is the tool and `data.arguments` is the raw JSON
 *   string the model produced.
 * - **secrets**: the argument is model-authored, so it can carry a token it was handed.
 *   {@link redactActivityText} removes what looks like one before the text is stored,
 *   shown, or truncated — truncating first could cut a secret into a fragment no pattern
 *   matches.
 * - **size**: an argument is cut to {@link WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH} and a
 *   trace keeps the last {@link WORKBENCH_ACTIVITY_MAX_ENTRIES} entries, with the count it
 *   dropped recorded as an entry of its own so nothing disappears silently.
 * @module dsh-workbench/skill-card-activity
 */

import type {
  WorkbenchActivityEntry,
  WorkbenchToolActivity,
  WorkbenchTraceTruncation,
} from './skill-card-contract.ts'
import {
  WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH,
  WORKBENCH_ACTIVITY_MAX_ENTRIES,
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
  const points = Array.from(text)
  if (points.length <= WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH) return text
  return `${points.slice(0, WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH).join('')}${WORKBENCH_ACTIVITY_ELLIPSIS}`
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
 * Read one entry out of one session event.
 *
 * The only event type mapped is `tool/call`. Nothing is inferred from the tool's own name
 * and no other event type is guessed at: a `tool/result` carries no name at all (measured:
 * its data keys are `turn`, `step`, `message`, `meta`), and a shell command is exactly a
 * `tool/call` naming `pwsh` or `bash` — `command/run` is a slash command, not a shell one,
 * and was measured to stay silent during a shell tool call.
 * @param event - one session event from the Host bus.
 * @returns the entry, or undefined for an event the trace does not record.
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
 * Split a trace into its tool entries and the number it already admits to dropping.
 * @param trace - a stored trace, possibly carrying markers from an earlier bound.
 * @returns the tool entries, oldest first, and the total dropped count.
 */
export function splitActivity(trace: readonly WorkbenchActivityEntry[] | undefined): {
  readonly tools: readonly WorkbenchToolActivity[]
  readonly dropped: number
} {
  const tools: WorkbenchToolActivity[] = []
  let dropped = 0
  for (const entry of trace ?? []) {
    if (entry.kind === 'tool') tools.push(entry)
    else dropped += entry.dropped
  }
  return { tools, dropped }
}

/**
 * Fit one trace to the entry bound, keeping the newest entries.
 *
 * The dropped count is carried as the marker entry rather than as a second field on the
 * record, so it survives the same round trip as the entries do and cannot be lost by a
 * reader that ignores it.
 * @param trace - the trace to fit, already carrying any earlier marker.
 * @returns a trace of at most {@link WORKBENCH_ACTIVITY_MAX_ENTRIES} entries plus its marker.
 */
export function boundActivity(trace: readonly WorkbenchActivityEntry[]): WorkbenchActivityEntry[] {
  const { tools, dropped } = splitActivity(trace)
  const over = Math.max(0, tools.length - WORKBENCH_ACTIVITY_MAX_ENTRIES)
  const kept = over === 0 ? tools : tools.slice(over)
  const total = dropped + over
  const marker: WorkbenchTraceTruncation[] = total === 0 ? [] : [{ kind: 'truncated', dropped: total }]
  return [...marker, ...kept]
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
  return boundActivity([...(trace ?? []), entry])
}
