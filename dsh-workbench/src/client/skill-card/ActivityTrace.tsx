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

import { useEffect, useState, type ReactNode } from 'react'
import type {
  WorkbenchActivityEntry,
  WorkbenchNarrationActivity,
  WorkbenchRunState,
} from '../../skill-card-contract.ts'
import { WORKBENCH_ACTIVITY_PREVIEW_LENGTH } from '../../skill-card-contract.ts'
import type { WorkbenchLocaleKey } from '../locales.ts'
import css from './skill-card.module.css'

/** How often the local 用时 clock re-reads the wall clock. */
const ELAPSED_TICK_MS = 1_000

/**
 * Format one duration as a clock reading.
 *
 * Hours are dropped while the run is under one: a card run that is still going is measured
 * in minutes, and a fixed `00:00:07` puts two leading zeros in front of the only digits
 * that matter.
 * @param milliseconds - elapsed time; negative values read as zero.
 * @returns `mm:ss`, or `h:mm:ss` once an hour has passed.
 */
export function elapsedText(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1_000))
  const seconds = String(total % 60).padStart(2, '0')
  const minutes = Math.floor(total / 60) % 60
  const hours = Math.floor(total / 3_600)
  if (hours === 0) return `${String(minutes).padStart(2, '0')}:${seconds}`
  return `${String(hours)}:${String(minutes).padStart(2, '0')}:${seconds}`
}

/**
 * Track how long ago a run started, on a local timer.
 *
 * The interval exists so the reading advances even when no poll lands: a run whose Host has
 * stopped answering still shows its own elapsed time, and a second of silence does not look
 * like a stopped clock. `startedAt` absent means there is no run to measure.
 * @param startedAt - start of the run, milliseconds since the epoch.
 * @returns elapsed milliseconds, recomputed once per second.
 */
function useElapsedMs(startedAt: number | undefined): number {
  const [now, setNow] = useState((): number => Date.now())
  useEffect(() => {
    if (startedAt === undefined) return
    // Read once on mount so a card that appears mid-run does not start its clock at zero.
    setNow(Date.now())
    const timer = setInterval(() => { setNow(Date.now()) }, ELAPSED_TICK_MS)
    return () => { clearInterval(timer) }
  }, [startedAt])
  return startedAt === undefined ? 0 : Math.max(0, now - startedAt)
}

/** Props of the trace list. */
export interface ActivityTraceProps {
  /** Entries as the Host recorded them, oldest first. */
  readonly trace: readonly WorkbenchActivityEntry[]
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
}

/**
 * Render one activity trace as an ordered list.
 *
 * One row per entry, oldest first, in the order the child produced them: a tool call
 * (tool's own name, then the first argument exactly as the Host stored it — already
 * redacted and already cut, with the ellipsis that says so), the model's own narration
 * (its reasoning under a 思考 label, its reply text as plain narration), and the
 * truncation marker as a row of its own, because a bounded trace that stayed silent would
 * read as a complete one.
 * @param props - the entries and the translator.
 * @returns the list.
 */
export function ActivityTrace({ trace, t }: ActivityTraceProps): ReactNode {
  return (
    <ol className={css.activityList} data-run-activity="">
      {trace.map((entry, index) => {
        if (entry.kind === 'tool') {
          return (
            <li
              // Entries carry no identity of their own: the trace is append-only and bounded
              // at its front, so position within it is the stable name a row needs.
              key={`${String(index)}-tool`}
              className={css.activityItem}
              data-activity-kind="tool"
              data-activity-tool={entry.tool}
            >
              <span className={css.activityTool}>{entry.tool}</span>
              <span className={css.activityArgument}>{entry.argument}</span>
            </li>
          )
        }
        if (entry.kind === 'truncated') {
          return (
            <li
              key={`${String(index)}-truncated`}
              className={css.activityTruncated}
              data-activity-kind="truncated"
              data-activity-dropped={String(entry.dropped)}
            >
              {t('runActivityTruncated', { dropped: entry.dropped })}
            </li>
          )
        }
        return <NarrationRow key={`${String(index)}-${entry.kind}`} entry={entry} t={t} />
      })}
    </ol>
  )
}

/** Props of one narration row. */
interface NarrationRowProps {
  /** The span the model wrote, reasonings or reply. */
  readonly entry: WorkbenchNarrationActivity
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
}

/**
 * One span of the model's own words, clamped to two lines until the user opens it.
 *
 * The whole stored span is in the DOM either way — expanding is a class change, not a
 * fetch — so a card read offline and a card read live show the same text. The 展开/收起
 * control appears only when the text is longer than what two lines can show; a toggle that
 * expands nothing would be noise.
 * @param props - the entry and the translator.
 * @returns the row.
 */
function NarrationRow({ entry, t }: NarrationRowProps): ReactNode {
  const [expanded, setExpanded] = useState(false)
  const long = Array.from(entry.text).length > WORKBENCH_ACTIVITY_PREVIEW_LENGTH
  const reasoning = entry.kind === 'reasoning'
  return (
    <li
      className={reasoning ? css.activityReasoning : css.activityNarration}
      data-activity-kind={entry.kind}
      data-activity-expanded={long ? String(expanded) : undefined}
    >
      {reasoning ? <span className={css.activityReasoningLabel}>{t('runActivityReasoning')}</span> : null}
      <span className={`${css.activityText} ${expanded ? '' : css.activityTextClamped}`.trim()}>
        {entry.text}
      </span>
      {long
        ? (
          <button
            type="button"
            className={css.activityToggle}
            data-activity-toggle=""
            aria-expanded={expanded}
            onClick={() => { setExpanded(open => !open) }}
          >
            {expanded ? t('runActivityCollapse') : t('runActivityExpand')}
          </button>
        )
        : null}
    </li>
  )
}

/** Props of the running notice. */
export interface RunningNoticeProps {
  /** The run in flight, for its start time and its trace. */
  readonly run: WorkbenchRunState
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
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
export function RunningNotice({ run, t }: RunningNoticeProps): ReactNode {
  const elapsed = useElapsedMs(run.startedAt)
  const trace = run.activity ?? []
  return (
    <div className={css.notice} data-run-stream="">
      <p className={css.noticeTitle}>
        {t('runStatusRunning')}
        {/* A run whose Host never supplied a start time has nothing to measure, and a clock
            that reads 00:00 forever would be worse than none. */}
        {run.startedAt === undefined
          ? null
          : ` · ${t('runElapsed')} ${elapsedText(elapsed)}`}
      </p>
      {trace.length === 0
        ? <p className={css.noticeBody}>{t('skillCardRunningBody')}</p>
        : <ActivityTrace trace={trace} t={t} />}
    </div>
  )
}
