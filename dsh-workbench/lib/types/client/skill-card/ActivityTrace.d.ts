/**
 * The run activity stream: what the child did, while it is doing it and after.
 *
 * Three things live here and they belong together. The trace list is one rendering used
 * twice — under a running card, and inside 运行详情 — so the stream a user watches and the
 * record they open afterwards cannot drift apart. The clock is local: 用时 is computed from
 * `startedAt` on this component's own timer, never from the value a poll happened to carry,
 * because a poll is a snapshot of the Host and 用时 is a fact about the browser's clock. And
 * the running notice keeps the card's previous static sentence for a run that has recorded
 * nothing yet, so the card never shows an empty frame.
 *
 * The rows match the conversation's run record: each tool call and each reasoning span is a
 * disclosure row with a leading icon, a title, and a one-line summary that expands to the
 * full stored text — the same chrome `ui-chat` gives a Tool row and a Reasoning row. The
 * model's reply text stays a plain body, like an assistant message in the conversation,
 * because it is the reply rather than a step of the work. A settled trace opens under a
 * turn-process header (已完成 / 已停止 / 已失败) that folds the whole stream, mirroring the
 * conversation's Turn process header.
 *
 * Nothing here redacts or truncates. Both happened on the Host, before the entry was stored
 * or sent: a client-side filter would leave the raw argument in the wire payload, which is
 * the one place it must not be.
 * @module dsh-workbench/client/skill-card/ActivityTrace
 */
import { type ReactNode } from 'react';
import type { WorkbenchActivityEntry, WorkbenchRunState } from '../../skill-card-contract.ts';
import type { WorkbenchLocaleKey } from '../locales.ts';
/**
 * Format one duration as a clock reading.
 *
 * Hours are dropped while the run is under one: a card run that is still going is measured
 * in minutes, and a fixed `00:00:07` puts two leading zeros in front of the only digits
 * that matter.
 * @param milliseconds - elapsed time; negative values read as zero.
 * @returns `mm:ss`, or `h:mm:ss` once an hour has passed.
 */
export declare function elapsedText(milliseconds: number): string;
/** Props of the trace list. */
export interface ActivityTraceProps {
    /** Entries as the Host recorded them, oldest first. */
    readonly trace: readonly WorkbenchActivityEntry[];
    /**
     * How the trace's turn header reads, when the trace is settled.
     *
     * Absent keeps the trace headerless, for callers that bring their own header (the running
     * card's notice). Present renders the conversation-style turn-process row above the list.
     */
    readonly settled?: {
        readonly stopReason: string;
    } | undefined;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
}
/**
 * Render one activity trace as an ordered list of disclosure rows.
 *
 * One row per entry, oldest first, in the order the child produced them: a tool call
 * (category icon, tool name, one-line argument summary, full argument on expand; already
 * redacted and already cut on the Host, with the ellipsis that says so), the model's own
 * reasoning (think icon, one-line summary, full text on expand), its reply text as a plain
 * body, and the truncation marker as a row of its own, because a bounded trace that stayed
 * silent would read as a complete one.
 * @param props - the entries, the optional settled header, and the translator.
 * @returns the list.
 */
export declare function ActivityTrace({ trace, settled, t }: ActivityTraceProps): ReactNode;
/** Props of the running notice. */
export interface RunningNoticeProps {
    /** The run in flight, for its start time and its trace. */
    readonly run: WorkbenchRunState;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
}
/**
 * Render the card's content while a run is in flight.
 *
 * The trace when there is one, and the card's own previous sentence when there is not: a run
 * whose first tool has not been called yet has nothing to list, and an empty list under a
 * running title would read as a broken stream.
 * @param props - the run and the translator.
 * @returns the notice.
 */
export declare function RunningNotice({ run, t }: RunningNoticeProps): ReactNode;
