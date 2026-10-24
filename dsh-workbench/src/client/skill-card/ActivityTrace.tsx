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

import { useEffect, useState, type ReactNode } from 'react'
import {
  DisclosureRow,
  IconAgentPresetOutlineRegular,
  IconApiOutlineRegular,
  IconBrowseOutlineRegular,
  IconChevronDownOutlineRegular,
  IconCodeOutlineRegular,
  IconEditOutlineRegular,
  IconGlobeOutlineRegular,
  IconPlanOutlineRegular,
  IconQuestionOutlineRegular,
  IconSearchOutlineRegular,
  IconSparkleRegular,
  IconThinkOutlineRegular,
  TextShimmer,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  WorkbenchActivityEntry,
  WorkbenchNarrationActivity,
  WorkbenchRunState,
} from '../../skill-card-contract.ts'
import { WORKBENCH_ACTIVITY_STRUCTURED_OUTPUT_TOOL } from '../../skill-card-contract.ts'
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
   * How the trace's turn header reads, when the trace is settled.
   *
   * Absent keeps the trace headerless, for callers that bring their own header (the running
   * card's notice). Present renders the conversation-style turn-process row above the list.
   */
  readonly settled?: { readonly stopReason: string } | undefined
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
}

/**
 * The leading icon for one tool activity, by the same categories the conversation uses.
 *
 * The mapping is name-based and open-ended: unknown tools get the generic sparkle, the
 * same fallback `ui-chat` gives to uncategorized calls.
 * @param tool - the wire tool name.
 * @returns the 14px glyph for the category, or the generic tool glyph.
 */
function toolIcon(tool: string): ReactNode {
  if (tool === 'read') return <IconBrowseOutlineRegular size={14} />
  if (tool === 'read_image') return <IconBrowseOutlineRegular size={14} />
  if (tool === 'grep' || tool === 'glob' || tool.endsWith('_inspect')) return <IconSearchOutlineRegular size={14} />
  if (tool === 'write') return <IconEditOutlineRegular size={14} />
  if (tool === 'edit' || tool === 'apply_patch') return <IconEditOutlineRegular size={14} />
  if (tool === 'bash' || tool === 'pwsh' || tool === 'exec_command' || tool === 'write_stdin'
    || tool.startsWith('terminal_')) return <IconApiOutlineRegular size={14} />
  if (tool === 'run_code') return <IconCodeOutlineRegular size={14} />
  if (tool === 'web_search') return <IconGlobeOutlineRegular size={14} />
  if (tool === 'web_fetch') return <IconBrowseOutlineRegular size={14} />
  if (tool === 'subagent' || tool.startsWith('subagent_')) return <IconAgentPresetOutlineRegular size={14} />
  if (tool === 'todo_write' || tool === 'create_goal' || tool === 'update_goal'
    || tool === 'get_goal') return <IconPlanOutlineRegular size={14} />
  if (tool === 'ask_user_question' || tool === 'request_user_input') return <IconQuestionOutlineRegular size={14} />
  return <IconSparkleRegular size={14} />
}

/**
 * The first line of a span, for the collapsed summary of a row.
 *
 * The stored trace does not carry a streaming flag, so the summary is the plain first line
 * in every state: a collapsed row previews the span's opening, and the full text is one
 * click away.
 * @param text - the full span.
 * @returns its first line.
 */
function firstLine(text: string): string {
  const newline = text.indexOf('\n')
  return newline === -1 ? text : text.slice(0, newline)
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
export function ActivityTrace({ trace, settled, t }: ActivityTraceProps): ReactNode {
  const [folded, setFolded] = useState(false)
  const open = !folded
  return (
    <div className={css.runTraceList} data-run-activity="">
      {settled !== undefined && (
        <TurnProcessHeader
          stopReason={settled.stopReason}
          open={open}
          onToggle={() => { setFolded(value => !value) }}
          t={t}
        />
      )}
      {open && (
        <ol className={css.activityList}>
          {trace.map((entry, index) => {
            // The schema-emission call is not a step of the visible work (see
            // WORKBENCH_ACTIVITY_STRUCTURED_OUTPUT_TOOL). It is skipped on read as well as
            // on record, so a trace stored before the builder filtered it stops showing too.
            if (entry.kind === 'tool' && entry.tool === WORKBENCH_ACTIVITY_STRUCTURED_OUTPUT_TOOL) return null
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
                  <ToolRow entry={entry} t={t} />
                </li>
              )
            }
            if (entry.kind === 'truncated') {
              return (
                <li
                  key={`${String(index)}-truncated`}
                  className={css.activityItem}
                  data-activity-kind="truncated"
                  data-activity-dropped={String(entry.dropped)}
                >
                  <span className={css.activityTruncated}>{t('runActivityTruncated', { dropped: entry.dropped })}</span>
                </li>
              )
            }
            return (
              <li
                key={`${String(index)}-${entry.kind}`}
                className={css.activityItem}
                data-activity-kind={entry.kind}
              >
                <NarrationRow entry={entry} t={t} />
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

/** Props of the turn-process header for a settled trace. */
interface TurnProcessHeaderProps {
  /** Why the run ended, as the subagent reported it. */
  readonly stopReason: string
  /** Whether the trace below is unfolded. */
  readonly open: boolean
  /** Fold or unfold the trace. */
  readonly onToggle: () => void
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
}

/**
 * Render the settled turn-process header above the trace.
 *
 * Mirrors the conversation's Turn process row: a full-width button with the outcome word
 * and a chevron that folds the whole stream. Duration is deliberately absent: the stored
 * record has no start time, and a fabricated reading would be worse than none.
 * @param props - the outcome, fold state, toggle, and translator.
 * @returns the header button.
 */
function TurnProcessHeader({ stopReason, open, onToggle, t }: TurnProcessHeaderProps): ReactNode {
  const label = stopReason === 'aborted' ? t('runActivityStopped')
    : stopReason === 'error' || stopReason === 'failed' ? t('runActivityFailed')
      : t('runActivityCompleted')
  return (
    <button
      type="button"
      className={css.turnProcess}
      data-turn-process={stopReason}
      data-open={open || undefined}
      aria-expanded={open}
      onClick={onToggle}
    >
      <span className={css.turnProcessLabel}>{label}</span>
      <IconChevronDownOutlineRegular className={css.turnProcessChevron} />
    </button>
  )
}

/** Props of one tool row. */
interface ToolRowProps {
  /** The stored tool entry. */
  readonly entry: Extract<WorkbenchActivityEntry, { kind: 'tool' }>
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
}

/**
 * One tool call as a disclosure row, matching the conversation's Tool row.
 *
 * Collapsed: category icon, tool name, and the first line of the argument. Expanded: the
 * whole stored argument under the 参数 label, so a long argument the Host already bounded
 * stays reachable without widening the row.
 * @param props - the entry and the translator.
 * @returns the tool disclosure.
 */
function ToolRow({ entry, t }: ToolRowProps): ReactNode {
  const [expanded, setExpanded] = useState(false)
  const summary = firstLine(entry.argument)
  return (
    <div className={css.activityToolRow} data-activity-expanded={expanded ? 'true' : undefined}>
      <DisclosureRow
        rowClassName={css.activityRow}
        titleClassName={css.activityTitle}
        icon={toolIcon(entry.tool)}
        title={entry.tool}
        expandable
        expandOnRowClick
        open={expanded}
        onToggle={() => { setExpanded(value => !value) }}
        collapsedContent={(
          <>
            <span className={css.activitySep} data-shimmer-decoration aria-hidden />
            <span className={css.activitySummary}>
              <TextShimmer>{summary}</TextShimmer>
            </span>
          </>
        )}
      >
        <div className={css.activityBody}>
          <span className={css.activityBodyLabel}>{t('runActivityArgument')}</span>
          <span className={css.activityBodyText}>{entry.argument}</span>
        </div>
      </DisclosureRow>
    </div>
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
 * One span of the model's own words.
 *
 * Reasoning folds like the conversation's think row: think icon, one-line summary, full
 * text on expand. Reply text renders as a plain body — it is the model's answer, not a
 * step of the work, so it reads fully like an assistant message.
 * @param props - the entry and the translator.
 * @returns the reasoning disclosure or the plain reply body.
 */
function NarrationRow({ entry, t }: NarrationRowProps): ReactNode {
  const [expanded, setExpanded] = useState(false)
  if (entry.kind === 'text') {
    return (
      <p className={css.activityNarration}>
        {entry.text}
      </p>
    )
  }
  const summary = firstLine(entry.text)
  return (
    <div className={css.activityReasoning} data-activity-expanded={expanded ? 'true' : undefined}>
      <DisclosureRow
        rowClassName={css.activityRow}
        titleClassName={css.activityTitle}
        icon={<IconThinkOutlineRegular size={14} />}
        title={t('runActivityReasoning')}
        expandable
        expandOnRowClick
        open={expanded}
        onToggle={() => { setExpanded(value => !value) }}
        collapsedContent={(
          <>
            <span className={css.activitySep} data-shimmer-decoration aria-hidden />
            <span className={css.activitySummary}>
              <TextShimmer>{summary}</TextShimmer>
            </span>
          </>
        )}
      >
        <div className={css.activityBody}>
          <span className={css.activityBodyText}>{entry.text}</span>
        </div>
      </DisclosureRow>
    </div>
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
 * running title would read as a broken stream.
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
