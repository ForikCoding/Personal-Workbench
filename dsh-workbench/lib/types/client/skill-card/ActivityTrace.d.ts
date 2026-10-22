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
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
}
/**
 * Render one activity trace as an ordered list.
 *
 * One row per tool call: the tool's own name, then the first argument exactly as the Host
 * stored it — already redacted and already cut, with the ellipsis that says so. The
 * truncation marker is a row of its own, because a bounded trace that stayed silent would
 * read as a complete one.
 * @param props - the entries and the translator.
 * @returns the list.
 */
export declare function ActivityTrace({ trace, t }: ActivityTraceProps): ReactNode;
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
 * running title reads as a broken stream rather than as a run that has not got there.
 * 用时 sits on the title line, where it advances on this component's timer.
 * @param props - the run and the translator.
 * @returns the notice.
 */
export declare function RunningNotice({ run, t }: RunningNoticeProps): ReactNode;
