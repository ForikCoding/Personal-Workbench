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
import type { WorkbenchActivityEntry, WorkbenchNarrationActivity, WorkbenchToolActivity } from './skill-card-contract.ts';
/** One session event, as the Host bus delivers it. */
export interface WorkbenchActivityEvent {
    /** Event discriminator, e.g. `tool/call`. */
    readonly type: string;
    /** The event's payload; read only when the type is one this module maps. */
    readonly data?: unknown;
}
/** The suffix appended to an argument the length limit cut. */
export declare const WORKBENCH_ACTIVITY_ELLIPSIS = "\u2026";
/** What a redacted span is replaced with. */
export declare const WORKBENCH_ACTIVITY_REDACTED = "***";
/**
 * Remove anything in one argument that looks like a secret.
 *
 * Applied to the text before truncation, so a credential that straddles the cut is replaced
 * whole rather than left as an unmatched fragment.
 * @param text - the argument as it was read off the event.
 * @returns the same text with every match replaced by `***`.
 */
export declare function redactActivityText(text: string): string;
/**
 * Cut one argument to the stored length, marking the cut.
 *
 * The ellipsis is what makes truncation visible in the entry itself: a reader who sees one
 * knows the call carried more than the card is showing. Counted in code points so a
 * multi-byte character is never cut in half.
 * @param text - redacted argument.
 * @returns the text, unchanged when it fits.
 */
export declare function truncateActivityText(text: string): string;
/**
 * Cut one narration text to the stored length, marking the cut.
 * @param text - redacted narration.
 * @returns the text, unchanged when it fits.
 */
export declare function truncateNarrationText(text: string): string;
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
export declare function firstArgumentOf(raw: unknown): string | undefined;
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
export declare function activityEntriesFor(event: WorkbenchActivityEvent): WorkbenchActivityEntry[];
/**
 * Read one tool entry out of one session event.
 *
 * Kept as its own public mapping because the tool case is the one the trace's redaction and
 * truncation rules were first measured against; {@link activityEntriesFor} is what the
 * runner uses, because an event can contribute more than one entry.
 * @param event - one session event from the Host bus.
 * @returns the entry, or undefined for an event that is not a tool call.
 */
export declare function activityEntryFor(event: WorkbenchActivityEvent): WorkbenchToolActivity | undefined;
/**
 * Split a trace into its real entries and the number it already admits to dropping.
 * @param trace - a stored trace, possibly carrying markers from an earlier bound.
 * @returns the call and narration entries, oldest first, and the total dropped count.
 */
export declare function splitActivity(trace: readonly WorkbenchActivityEntry[] | undefined): {
    readonly entries: readonly (WorkbenchToolActivity | WorkbenchNarrationActivity)[];
    readonly dropped: number;
};
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
export declare function boundActivity(trace: readonly WorkbenchActivityEntry[]): WorkbenchActivityEntry[];
/**
 * Append entries to a trace and fit the result.
 * @param trace - the trace so far; absent starts an empty one.
 * @param entries - the entries just recorded, oldest first.
 * @returns the bounded trace.
 */
export declare function withActivityEntries(trace: readonly WorkbenchActivityEntry[] | undefined, entries: readonly WorkbenchActivityEntry[]): WorkbenchActivityEntry[];
/**
 * Append one entry to a trace and fit the result.
 * @param trace - the trace so far; absent starts an empty one.
 * @param entry - the call just recorded.
 * @returns the bounded trace.
 */
export declare function withActivityEntry(trace: readonly WorkbenchActivityEntry[] | undefined, entry: WorkbenchToolActivity): WorkbenchActivityEntry[];
