/**
 * The two full-panel views one skill card opens into.
 *
 * A card is an index entry: its face carries the name, the skill, and the way into
 * configuration. The result and the configuration each take the whole display
 * column, because both are wider than a grid cell: the result is arbitrary HTML the
 * user authored, and the configuration is a name field, a skill picker, a template
 * editor, a field list, and a preview.
 *
 * Each page builds its own card controller rather than receiving one. That is what
 * makes the hook call legal: a page is mounted only while it is the current view,
 * so the controller runs only for the card on screen.
 * @module dsh-workbench/client/skill-card/SkillCardPages
 */

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorkbenchLocaleKey } from '../locales.ts'
import type { WorkbenchInstructionMode, WorkbenchResultRecord } from '../../skill-card-contract.ts'
import type { WorkbenchSkillCardApi } from './api.ts'
import { runIdOf, useSkillCard } from './controller.ts'
import type {
  WorkbenchActionProblem,
  WorkbenchActionProblemCode,
  WorkbenchBareRunState,
  WorkbenchCardView,
  WorkbenchPendingAction,
} from './controller.ts'
import type { WorkbenchModelSeat } from './model.ts'
import { permissionLabelKey } from './permission.ts'
import type { WorkbenchWorkspacePicker } from './workspace-picker.ts'
import { SkillCardBody, cardFaceTitle, problemKey } from './SkillCard.tsx'
import { ActivityTrace } from './ActivityTrace.tsx'
import { SkillCardResultEditor } from './SkillCardResultEditor.tsx'
import { SkillCardSettings } from './SkillCardSettings.tsx'
import { resultHeadline, resultHtml } from './render.ts'
import type { WorkbenchScriptBinder } from './render.ts'
import { clockText, dayKey, latestRunText, runClockText } from './clock.ts'
import css from './skill-card.module.css'

/** One day's worth of runs: the day and the rows that completed on it. */
interface RunHistoryGroup {
  /** The day as `YYYY-MM-DD`, which is what the list groups by. */
  readonly key: string
  /** Any moment on that day; the group heading reads its date. */
  readonly at: number
  /** The day's rows, newest first. */
  readonly runs: WorkbenchResultRecord[]
}

/**
 * The heading one day's runs sit under.
 *
 * The two days a user is most likely to be reading get words; every other day is its own
 * date, because a list that says "10-25" for a run from last year says nothing.
 * @param at - any moment on that day.
 * @param t - translator.
 * @returns 今天, 昨天, or `YYYY-MM-DD`.
 */
function runDayLabel(
  at: number,
  t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string,
): string {
  const key = dayKey(at)
  const now = Date.now()
  if (key === dayKey(now)) return t('runHistoryDayToday')
  if (key === dayKey(now - 86_400_000)) return t('runHistoryDayYesterday')
  return key
}

/**
 * Split the newest-first run list into the days its rows completed on.
 * @param runs - the card's stored runs, newest first.
 * @returns one group per day, newest day first; a day with no run is absent.
 */
function groupRunsByDay(runs: readonly WorkbenchResultRecord[]): RunHistoryGroup[] {
  const groups: RunHistoryGroup[] = []
  for (const run of runs) {
    const key = dayKey(run.executedAt)
    const last = groups[groups.length - 1]
    if (last === undefined || last.key !== key) {
      groups.push({ key, at: run.executedAt, runs: [run] })
      continue
    }
    last.runs.push(run)
  }
  return groups
}

/**
 * The outcome word one settled run shows in the history list.
 *
 * The same outcomes the turn-process header names, so the list and the detail never
 * disagree about what a run became.
 *
 * The record's own verdict comes first. A run the Host stopped at its deadline reports
 * `aborted` from the seam, which is true of the child and false of the run: nobody cancelled
 * it. The record carries the verdict the page can act on.
 * @param record - the stored record.
 * @param t - translator.
 * @returns the localized outcome word.
 */
function runOutcomeText(
  record: Pick<WorkbenchResultRecord, 'stopReason' | 'failure'>,
  t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string,
): string {
  const { stopReason } = record
  // The in-flight row is a record the controller builds, not one a run stored; its
  // stop reason is the synthetic 'running', read before the settled outcomes so a live
  // run never reads as the completed fallback.
  return stopReason === 'running' ? t('runHistoryRunning')
    : record.failure !== undefined ? t('runActivityFailed')
      : stopReason === 'aborted' ? t('runActivityStopped')
        : stopReason === 'error' || stopReason === 'failed' ? t('runActivityFailed')
          : t('runActivityCompleted')
}

/**
 * State one bare run's progress or verdict.
 *
 * Only the verdict travels, because there is nothing else to show: no structured value
 * and no output text are kept for a bare run.
 * @param bare - the bare run's state.
 * @param t - translator.
 * @returns the one line to show.
 */
function bareRunText(
  bare: WorkbenchBareRunState,
  t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string,
): string {
  if (bare.phase === 'running') return t('bareRunRunning', { skill: bare.skill })
  const head = bare.ok ? t('bareRunDone') : t('bareRunFailed')
  return bare.diagnostic === undefined ? head : `${head} · ${bare.diagnostic}`
}

/**
 * Render one action problem.
 * @param problem - what went wrong.
 * @param t - translator.
 * @returns the alert.
 */
function ActionProblemLine({
  problem,
  t,
}: {
  readonly problem: WorkbenchActionProblem
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
}): ReactNode {
  return (
    <p className={css.runProblem} role="alert" data-action-problem={problem.code}>
      {t(actionProblemKey(problem.code))}
      {problem.detail === undefined ? '' : ` · ${problem.detail}`}
      {problem.candidates.length === 0
        ? ''
        : ` · ${t('actionCandidates', { names: problem.candidates.join(', ') })}`}
    </p>
  )
}

/**
 * Render the in-place confirmation panel.
 *
 * It replaces the card's display area rather than opening a dialog: the shared
 * primitives expose no dialog, and the editor already works the same way. The three
 * facts are fixed and ordered, and the payload is a text node — it came from a model,
 * and it is shown whole, because it is the only thing standing between that model's
 * data and the next run.
 * @param props - the pending action, the translator, and the two decisions.
 * @returns the panel.
 */
function ActionPanel({
  pending,
  t,
  onConfirm,
  onCancel,
}: {
  readonly pending: WorkbenchPendingAction
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly onConfirm: () => void
  readonly onCancel: () => void
}): ReactNode {
  return (
    <section className={css.actionPanel} aria-label={t('actionPanelTitle')} data-action-panel="">
      <dl className={css.actionFacts}>
        <dt>{t('actionFieldTarget')}</dt>
        <dd data-action-field="target">
          {pending.target.kind === 'card'
            ? t('actionTargetCard', { name: pending.target.name })
            : t('actionTargetSkill', { name: pending.target.name })}
        </dd>
        {/* A card target runs *its own* skill, so that is what has to be stated here:
            showing the clicked card's skill would have the user confirm the wrong run. */}
        <dt>{t('actionFieldSkill')}</dt>
        <dd data-action-field="skill">{pending.skill}</dd>
        <dt>{t('actionFieldPayload')}</dt>
        <dd data-action-field="payload">
          {/* Text, never HTML; scrollable, never truncated or collapsed. */}
          <pre className={css.actionPayload}>{JSON.stringify(pending.payload, null, 2)}</pre>
        </dd>
      </dl>
      <div className={css.settingsActions}>
        <Button variant="primary" size="sm" onClick={onConfirm} data-action-confirm="">
          {t('actionConfirm')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} data-action-cancel="">
          {t('actionCancel')}
        </Button>
      </div>
    </section>
  )
}

/**
 * Where the card's output ends: the run's activity trace.
 *
 * The card's output is what the run did — the model's own words and the tool calls it
 * made, in the order they happened. The trace opens under the settled turn-process header
 * (已完成 / 已停止 / 已失败), which folds the whole stream like the conversation's Turn
 * process row. The technical record that used to sit beside it (model, start time,
 * structured value, raw output, diagnostic) is gone by the product owner's decision: the
 * result above is the content, and the failure line above the surface already says why a
 * run produced none. Absent for a run that recorded no entry, and then the section is not
 * drawn at all — an empty list would say the run did nothing rather than that nothing was
 * recorded.
 * @param props - the card view and the translator.
 * @returns the trace section, or null when the run left no trace.
 */
function RunTrace({
  view,
  t,
}: {
  readonly view: WorkbenchCardView
  readonly t: (key: WorkbenchLocaleKey) => string
}): ReactNode {
  const result = view.result
  if (result === undefined || result.activity === undefined || result.activity.length === 0) return null
  return (
    <section className={css.runTrace} data-run-trace="">
      <ActivityTrace
        trace={result.activity}
        settled={{ stopReason: result.stopReason, ...result.failure === undefined ? {} : { failure: result.failure } }}
        t={t}
      />
    </section>
  )
}

/** What both pages need to show and change one card. */
export interface SkillCardPageProps {
  /** Transport. */
  readonly api: WorkbenchSkillCardApi
  /** Card being shown. */
  readonly cardId: string
  /**
   * The run a result view opens, when it is not the card's latest.
   *
   * A run-history row opens its own run by this id; absent means the latest. The run
   * history and the configuration pages ignore it.
   */
  readonly runId?: string
  /**
   * Resolve the session this page reads the installed skills through.
   *
   * Not the session a run executes in — a run is given one of its own — but the agent scope
   * a catalog read needs, and the fallback for the model field.
   * @returns the session id, or undefined when none is available.
   */
  readonly runSessionId: () => string | undefined
  /**
   * Resolve the session the application's own model picker is attached to.
   *
   * The model field reads this session's directory, so the card offers the catalog a user
   * choosing a model is looking at. Omitted falls back to this page's own session, which is
   * the only session a page without a session list can name.
   * @returns the session id, or undefined while none is held.
   */
  readonly pickerSessionId?: () => string | undefined
  /**
   * Read the model catalog, and what it knows about one session.
   *
   * Required rather than optional: a page that cannot see the directory cannot say which
   * model a run would use, and this feature never runs work it cannot name.
   */
  readonly models: WorkbenchModelSeat
  /**
   * Ask the user for a directory to use as this card's workspace.
   *
   * Required rather than optional: a page that silently offers no picker would leave a card
   * permanently unable to run with no way to say so.
   */
  readonly workspacePicker: WorkbenchWorkspacePicker
  /**
   * Shown in place of the name while the card has none.
   *
   * Only the result page reads it: the configuration page lets its own name field carry
   * that fact, so a head that repeated it would be the second, uneditable copy.
   */
  readonly fallbackTitle: string
  /** Leave the page and return to the grid. */
  readonly onBack: () => void
  /**
   * Open one of a card's full-panel views.
   *
   * A card-target action starts that card's run and then shows it, so the result page
   * is the one that needs this. `runId` names the run a result view opens.
   * @param cardId - the card to show.
   * @param view - which of its views.
   * @param runId - the run a result view shows, omitted for the latest.
   */
  readonly openCard: (cardId: string, view: 'result' | 'runs' | 'config', runId?: string) => void
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  /**
   * Builds the binding the rendered document's own script receives.
   *
   * The document a card renders is the user's own HTML, and its script may read the card's
   * directory. Omitted leaves that script running with no card behind it, which is what a
   * composition without the document route does.
   */
  readonly documents?: WorkbenchScriptBinder | undefined
}

/** Rows the revision field grows to before it scrolls instead. */
const COMPOSER_MAX_ROWS = 4

/**
 * Render the composer that revises the result, and this session's revision log.
 *
 * It sits under the result because a revision is a sentence about what is on screen: the
 * user reads the result, says what to change, and reads it again. The log reads as a
 * conversation — the instruction, then when it was applied — because that is the order
 * the two were said in.
 * @param props - the card view, the translator, whether the card is busy, and the actions.
 * @returns the composer.
 */
function RefinePanel({
  view,
  t,
  busy,
  onRefine,
  onUndo,
  onStop,
}: {
  readonly view: WorkbenchCardView
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  /** Whether a run holds the card, which disables everything here. */
  readonly busy: boolean
  readonly onRefine: (instruction: string) => void
  readonly onUndo: () => void
  /** Interrupts the run that holds the card. */
  readonly onStop: () => void
}): ReactNode {
  const [instruction, setInstruction] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)
  const empty = instruction.trim() === ''
  // An instruction is a sentence, not a label: it wraps, and a newline is a line. The
  // rows are the fallback height, so the field is already right when it cannot measure.
  const rows = Math.min(COMPOSER_MAX_ROWS, Math.max(1, instruction.split('\n').length))
  useLayoutEffect(() => {
    const element = field.current
    if (element === null) return
    // Measure from scratch: `scrollHeight` is the content height only while the box is
    // not already taller than its content.
    element.style.height = 'auto'
    // A field that cannot measure — jsdom, or a hidden mount — reports 0, and collapsing
    // to no height would hide the very thing the user is typing into.
    if (element.scrollHeight > 0) element.style.height = `${String(element.scrollHeight)}px`
  }, [instruction])
  const submit = (): void => {
    if (empty || busy) return
    onRefine(instruction)
    // The sentence has been sent; leaving it in the field would read as unapplied.
    setInstruction('')
  }
  return (
    <div className={css.composer} data-refine-composer="">
      <div className={css.composerRow}>
        <textarea
          ref={field}
          className={css.composerInput}
          rows={rows}
          value={instruction}
          placeholder={t('refinePlaceholder')}
          aria-label={t('refinePlaceholder')}
          disabled={busy}
          onChange={(event) => { setInstruction(event.target.value) }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            // Shift+Enter is the newline the field grows a row for.
            if (event.shiftKey) return
            // Enter also confirms an IME candidate list. Submitting there would send half
            // of the sentence the user is still writing.
            if (event.nativeEvent.isComposing) return
            event.preventDefault()
            submit()
          }}
        />
        {/* While a run holds the card the control stops it. A long task must be
            interruptible from where the user is looking: the head's run control is at
            the top of a page that grows with the result, so it scrolls out of reach. */}
        {busy
          ? (
            <Button variant="ghost" size="sm" onClick={onStop} data-refine-stop="">
              {t('refineStop')}
            </Button>
          )
          : (
            <Button variant="primary" size="sm" disabled={empty} onClick={submit}>
              {t('refineAction')}
            </Button>
          )}
      </div>
      {view.refineProblem === undefined ? null : (
        // Under the composer rather than above the result: this is where the ask came
        // from, and the result beside it is the one that was left untouched.
        <p className={css.composerProblem} role="alert" data-refine-problem={view.refineProblem.code}>
          {t(problemKey(view.refineProblem.code))}
          {view.refineProblem.detail === undefined || view.refineProblem.detail === ''
            ? ''
            : ` · ${view.refineProblem.detail}`}
        </p>
      )}
      {view.refinements.length === 0 && view.previous === undefined ? null : (
        <div className={css.refineLog} data-refine-log="">
          {/* One header for the two facts about the whole log: how many revisions it
              holds, and the single step back that undoes the last of them. */}
          <div className={css.refineLogHead}>
            <p className={css.refineLogTitle}>
              {t('refineLogCount', { count: view.refinements.length })}
            </p>
            {view.previous === undefined
              ? null
              : (
                <Button variant="ghost" size="sm" onClick={onUndo} data-refine-undo="">
                  {t('refineUndo')}
                </Button>
              )}
          </div>
          <ol className={css.refineLogList}>
            {view.refinements.map((entry, index) => (
              <li key={`${String(entry.at)}-${String(index)}`} className={css.refineLogItem}>
                <span className={css.refineLogInstruction}>{entry.instruction}</span>
                <span className={css.refineLogTime}>{clockText(entry.at)}</span>
              </li>
            ))}
          </ol>
          {/* The last line of the block, because it covers all of it: neither the log nor
              the version behind 回到上一版 survives a reload, and a user who finds them
              gone should have been told they would be. */}
          <p className={css.refineLogNote}>{t('refineSessionOnly')}</p>
        </div>
      )}
    </div>
  )
}

/** Rows the run bar's field shows before it scrolls. */
const RUN_BAR_MAX_ROWS = 3

/** Prefix of the session-scoped draft key, one per card. */
const DRAFT_PREFIX = 'dsh-workbench:instruction:'

/**
 * Read one card's unsent instruction back.
 *
 * A draft rather than a stored value: it belongs to the page the user is on, and a card's
 * next run should not inherit a sentence left behind hours ago. Session storage rather
 * than memory because the two pages a run starts from are separate mounts — navigating
 * from the history to a row's result would otherwise drop the half-written ask.
 * @param cardId - the card whose draft is read.
 * @returns the draft, or an empty string when none was kept or storage is unavailable.
 */
function readDraft(cardId: string): string {
  try {
    return globalThis.sessionStorage?.getItem(`${DRAFT_PREFIX}${cardId}`) ?? ''
  } catch {
    // Storage can be denied outright; a tab without a draft is still a working tab.
    return ''
  }
}

/**
 * Keep or clear one card's unsent instruction.
 * @param cardId - the card whose draft is written.
 * @param text - the draft; an empty string clears it.
 */
function writeDraft(cardId: string, text: string): void {
  try {
    if (text === '') globalThis.sessionStorage?.removeItem(`${DRAFT_PREFIX}${cardId}`)
    else globalThis.sessionStorage?.setItem(`${DRAFT_PREFIX}${cardId}`, text)
  } catch {
    // As above: losing the draft costs a retype, not the run.
  }
}

/**
 * The one composer a card's runs are started from, in the bar that holds the run control.
 *
 * One bar rather than a composer per page, and beside the control rather than in a dialog:
 * the ask and the button that spends it are one decision, so they read as one line. What the
 * card's mode decides is only whether the bar is there at all and what an empty field means
 * — `none` keeps the plain run control, `optional` says the field may stay empty, and
 * `required` refuses to send nothing and says so in place instead of disabling the control,
 * because a disabled button explains nothing.
 * @param props - the mode, the page's own state, and the two controls.
 * @returns the run bar.
 */
function RunBar({
  cardId,
  mode,
  recent,
  t,
  running,
  disabled,
  onRun,
  onCancel,
}: {
  readonly cardId: string
  /** The card's effective instruction mode. */
  readonly mode: WorkbenchInstructionMode
  /** Instructions this card's recent runs carried, newest first. */
  readonly recent: readonly string[]
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  /** Whether a run holds the card, which turns the control into 取消. */
  readonly running: boolean
  /** Whether the control is closed for a reason other than an empty field. */
  readonly disabled: boolean
  readonly onRun: (instruction: string) => void
  readonly onCancel: () => void
}): ReactNode {
  const [text, setText] = useState(() => readDraft(cardId))
  // Whether the user pressed Run with nothing written. Cleared as soon as they type, so the
  // sentence disappears the moment it stops being true.
  const [refused, setRefused] = useState(false)
  const field = useRef<HTMLTextAreaElement>(null)
  const empty = text.trim() === ''
  const rows = Math.min(RUN_BAR_MAX_ROWS, Math.max(1, text.split('\n').length))
  useLayoutEffect(() => {
    const element = field.current
    if (element === null) return
    element.style.height = 'auto'
    // A field that cannot measure reports 0; collapsing to no height would hide the field.
    if (element.scrollHeight > 0) element.style.height = `${String(element.scrollHeight)}px`
  }, [text, mode])
  const submit = (): void => {
    if (disabled) return
    if (empty) {
      if (mode !== 'required') {
        // Optional and none both treat an empty field as "no instruction": the run goes
        // ahead on what the card is, which is exactly what those modes promise.
        onRun('')
        return
      }
      // Required, and nothing was written. The run is not sent: the refusal happens here,
      // in view, with the field focused — the one thing a disabled control could not do.
      setRefused(true)
      field.current?.focus()
      return
    }
    setRefused(false)
    setText('')
    writeDraft(cardId, '')
    onRun(text)
  }
  // A card that needs no instruction keeps its plain header control and renders no bar at
  // all, so its page is byte-for-byte what it was before this feature existed. The pages
  // ask for the bar only when the mode calls for one; this branch is the second guard, for
  // a mode that changed while the page was open.
  if (mode === 'none') return null
  return (
    <div className={css.runBar} data-run-bar={mode}>
      {running
        ? null
        : (
          <div className={css.runBarRow}>
            <textarea
              ref={field}
              className={css.runBarInput}
              rows={rows}
              value={text}
              placeholder={t(mode === 'required' ? 'runInstructionPlaceholderRequired' : 'runInstructionPlaceholderOptional')}
              aria-label={t('runInstructionField')}
              disabled={disabled}
              onChange={(event) => {
                setText(event.target.value)
                writeDraft(cardId, event.target.value)
                if (refused && event.target.value.trim() !== '') setRefused(false)
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return
                if (event.key !== 'Enter') return
                // Ctrl/Cmd+Enter is "send regardless", which is the only way to submit a
                // multi-line ask. A bare Enter submits only while the ask is one line, because
                // past that it is the field's own newline.
                if (event.metaKey || event.ctrlKey) {
                  event.preventDefault()
                  submit()
                  return
                }
                if (event.shiftKey) return
                if (text.includes('\n')) return
                event.preventDefault()
                submit()
              }}
            />
          </div>
        )}
      {/* The control sits in the same bar as the field: the ask and the button that
          spends it are one action, even when the ask is empty. */}
      <Button
        variant="primary"
        size="sm"
        disabled={disabled}
        onClick={() => { if (running) onCancel(); else submit() }}
      >
        {running ? t('skillCardCancel') : t('skillCardRun')}
      </Button>
      {refused
        ? (
          <p className={css.runBarHint} role="alert" data-run-instruction-required="">
            {t('runInstructionRequired')}
          </p>
        )
        : null}
      {running || recent.length === 0
        ? null
        : (
          <div className={css.runChips} data-run-instruction-recent="">
            <span className={css.runChipsLabel}>{t('runInstructionRecent')}</span>
            {recent.map(instruction => (
              <button
                key={instruction}
                type="button"
                className={css.runChip}
                // Refill rather than run: the chip's text is a starting point the user
                // almost always edits before sending.
                onClick={() => {
                  setText(instruction)
                  writeDraft(cardId, instruction)
                  setRefused(false)
                  field.current?.focus()
                }}
                data-run-instruction-chip=""
              >
                {instruction}
              </button>
            ))}
          </div>
        )}
    </div>
  )
}

/**
 * Render the card's run history in the whole display column.
 *
 * Every card opens here first: the list names each run and its outcome, newest first,
 * and a row opens that run's result. Running from this page is the one control the list
 * carries, because a card that has not run yet is exactly the state this page shows.
 * @param props - transport, card identity, session resolver, title fallback, back, and `t`.
 * @returns the run history page.
 */
export function SkillCardRunsPage(props: SkillCardPageProps): ReactNode {
  const { api, cardId, runSessionId, pickerSessionId, models, workspacePicker, fallbackTitle, onBack, openCard, t } = props
  const cardTitle = useCallback(
    (id: string, name: string | undefined): string => cardFaceTitle({ cardId: id, name }, t),
    [t],
  )
  const { view, actions } = useSkillCard({
    api,
    cardId,
    session: runSessionId,
    ...pickerSessionId === undefined ? {} : { pickerSession: pickerSessionId },
    models,
    workspacePicker,
    openCard,
    // A run another card's button started can be in flight when this list opens; the
    // history page owns the run control for this card, so it adopts it like the result
    // page does.
    watchRun: true,
    cardTitle,
  })
  const bareRunning = view.bareRun?.phase === 'running'
  // The header always starts a run, even while others are in flight: a card may run
  // several at once, so the control that used to toggle to 取消 would now have to choose
  // which of them to stop. Stopping is per row, where the run is named.
  // The history rows stay open either way: a stored run is a read-only record, and the
  // row of the run in flight is the way to watch it — refusing the click left the list
  // looking like dead rows.
  // The newest stored run, if the card has one: the heading states when the card last
  // produced something, which is the one fact a history page's visitor wants before
  // reading seven rows.
  const newest = view.runs[0]
  // Ordinals count from the card's first run, so "第 3 次" keeps meaning the same run as
  // more runs arrive; the list itself is newest first.
  const ordinalOf = new Map(view.runs.map((run, index) => [run.runId, view.runs.length - index]))
  return (
    <section className={css.pageView}>
      <header className={css.pageViewHead}>
        <Button variant="ghost" size="sm" onClick={onBack}>{t('skillCardBack')}</Button>
        <div className={css.runsHeadText}>
          <h2 className={css.runsHeadTitle}>{view.name ?? fallbackTitle}</h2>
          <p className={css.runsHeadMeta}>
            {view.skill === undefined ? null : <span className={css.pageViewSubtitle}>{view.skill}</span>}
            <span className={css.runHistoryCount} data-run-history-count="">
              {t('runHistoryCount', { count: view.runs.length })}
            </span>
            {newest === undefined
              ? null
              : (
                <span className={css.runHistoryCount}>
                  {t('runHistoryLatest', { time: latestRunText(newest.executedAt) })}
                </span>
              )}
          </p>
        </div>
        {/* The header's own control, for a card whose runs need no instruction. A card that
            takes one gets the bar below instead — one control, never two. */}
        {view.instructionMode === 'none'
          ? (
            <Button
              variant="primary"
              size="sm"
              disabled={bareRunning || !view.runnable}
              onClick={() => { actions.run() }}
            >
              {t('skillCardRun')}
            </Button>
          )
          : null}
      </header>
      {/* The bar starts every run from this page, so running is one click whether the ask is
          empty or not. Never in-flight here: this page starts runs alongside others. */}
      <RunBar
        cardId={cardId}
        mode={view.instructionMode}
        recent={view.recentInstructions}
        t={t}
        running={false}
        disabled={bareRunning || !view.runnable}
        onRun={(instruction) => { actions.run(instruction) }}
        onCancel={() => { actions.cancel() }}
      />
      {/* The same sentences the result page states, so a run this list's button cannot
          start says why here too: the list is where the user pressed it. */}
      {view.modelField.kind === 'unavailable'
        ? <p className={css.runProblem} data-run-model-unavailable="">{t('skillCardModelUnavailable')}</p>
        : null}
      {view.workspaceField.kind === 'missing'
        ? (
          <p className={css.runProblem} data-run-workspace-missing="">
            {t(problemKey('workspace-missing'))}
          </p>
        )
        : null}
      {view.workspaceField.kind === 'invalid' && view.workspaceField.checked
        ? (
          <p className={css.runProblem} data-run-workspace-invalid="">
            {t(problemKey('workspace-invalid'))}
            {` · ${view.workspaceField.path}`}
          </p>
        )
        : null}
      {view.runUnavailable === undefined
        ? null
        : (
          <p className={css.runProblem} data-run-unavailable="">
            {t(problemKey(view.runUnavailable.code))}
          </p>
        )}
      {/* Stated here whenever there is one, including after a failed refinement: the
          refinement's own sentence lives under its composer, and this page is where the
          user lands when they come back — a page that showed nothing at all left them
          reading a five-minute gap as a card that had simply never run. */}
      {view.problem === undefined ? null : (
        <p className={css.runProblem} role="alert" data-run-problem={view.problem.code}>
          {t(problemKey(view.problem.code))}
          {view.problem.detail === '' ? '' : ` · ${view.problem.detail}`}
        </p>
      )}
      {view.bareRun === undefined ? null : (
        <p className={css.bareRun} data-bare-run={view.bareRun.phase}>
          {bareRunText(view.bareRun, t)}
        </p>
      )}
      {view.runs.length === 0
        ? (
          <p className={css.runHistoryEmpty} data-run-history-empty="">
            {t('runHistoryEmpty')}
          </p>
        )
        : (
          <div className={css.runHistoryList} data-run-history-list="">
            {groupRunsByDay(view.runs).map(group => (
              <section className={css.runHistoryGroup} key={group.key}>
                <p className={css.runHistoryDay} data-run-history-day="">{runDayLabel(group.at, t)}</p>
                <ol className={css.runHistoryItems}>
                  {group.runs.map(run => (
                    <RunHistoryRow
                      key={run.runId}
                      run={run}
                      ordinal={ordinalOf.get(run.runId) ?? 1}
                      t={t}
                      onOpen={() => { openCard(cardId, 'result', run.runId) }}
                      // Only a run that is still going can be stopped; its row is the one
                      // place that names it, so it is the one place that can stop just it.
                      {...run.stopReason === 'running'
                        ? { onStop: () => { actions.cancelRun(run.runId) } }
                        : {}}
                    />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
    </section>
  )
}

/**
 * One row of the run history: what the run produced, then the facts that tell it apart
 * from the runs around it, and its outcome on the right.
 *
 * The content comes first because that is what a reader scans for; the moment, the route,
 * and the run's place in the card's history are the second line, because they separate
 * two runs of one task from each other and nothing more. The outcome sits opposite as a
 * quiet dot and word — the list's rows are mostly the same outcome, so an equal-weight
 * word on every row would be seven copies of "已完成" competing with the seven titles.
 *
 * The row is a button because the whole row is the way in. Never disabled: a stored run
 * is read-only, and the row of a run in flight opens that run's live view.
 * @param props - the run, its ordinal, the translator, and the open action.
 * @returns the row.
 */
function RunHistoryRow({
  run,
  ordinal,
  t,
  onOpen,
  onStop,
}: {
  readonly run: WorkbenchResultRecord
  readonly ordinal: number
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly onOpen: () => void
  /** Present for a run in flight: stopping one run is stopping that row. */
  readonly onStop?: () => void
}): ReactNode {
  const headline = resultHeadline(resultHtml(run.structured) ?? '')
  return (
    <li className={css.runHistoryItem}>
      <div className={css.runHistoryRow}>
        <button
          type="button"
          className={css.runHistoryOpen}
          onClick={onOpen}
          data-run-history-row=""
          data-run-outcome={run.stopReason}
        >
          <span className={css.runHistoryBody}>
            {headline === undefined
              ? null
              : <span className={css.runHistoryTitle} data-run-history-summary="">{headline}</span>}
            <span className={css.runHistoryMeta}>
              <span className={css.runHistoryTime} data-run-history-time="">
                {runClockText(run.executedAt)}
              </span>
              {run.model === undefined
                ? null
                : <span className={css.runHistoryModel}>{run.model.model}</span>}
              {ordinal <= 1
                ? null
                : <span className={css.runHistoryOrdinal}>{t('runHistoryOrdinal', { n: ordinal })}</span>}
              {run.editedAt === undefined
                ? null
                : <span className={css.runHistoryEdited} data-run-history-edited="">{t('runHistoryEdited')}</span>}
            </span>
            {/* What the run was asked for, in the one line the row has for it. Two runs of
                one card differ by this sentence, so it is the row's own title's context
                rather than a separate field: the headline says what came out, this says
                what went in. */}
            {run.instruction === undefined || run.instruction === ''
              ? null
              : (
                <span className={css.runHistoryInstruction} data-run-history-instruction="">
                  {t('runHistoryInstruction', { text: run.instruction })}
                </span>
              )}
          </span>
          <span className={css.runHistorySide}>
            <span className={css.runHistoryOutcome} data-run-history-outcome="">
              <span className={css.runHistoryDot} aria-hidden="true" />
              {runOutcomeText(run, t)}
            </span>
            <span className={css.runHistoryChevron} aria-hidden="true">›</span>
          </span>
        </button>
        {onStop === undefined
          ? null
          : (
            <button
              type="button"
              className={css.runHistoryStop}
              onClick={onStop}
              data-run-history-stop=""
            >
              {t('refineStop')}
            </button>
          )}
      </div>
    </li>
  )
}

/**
 * Render the card's result in the whole display column, with its run control.
 * @param props - transport, card identity, session resolver, title fallback, back, and `t`.
 * @returns the result page.
 */
export function SkillCardResultPage(props: SkillCardPageProps): ReactNode {
  const { api, cardId, runSessionId, pickerSessionId, models, workspacePicker, fallbackTitle, onBack, openCard, t, documents } = props
  // The face's own naming rule, reused so an action declaration can address this card
  // by the title the user actually reads on it.
  const cardTitle = useCallback(
    (id: string, name: string | undefined): string => cardFaceTitle({ cardId: id, name }, t),
    [t],
  )
  const { view, actions } = useSkillCard({
    api,
    cardId,
    ...props.runId === undefined ? {} : { runId: props.runId },
    session: runSessionId,
    ...pickerSessionId === undefined ? {} : { pickerSession: pickerSessionId },
    models,
    workspacePicker,
    openCard,
    // This page is where another card's button lands after starting this card's run.
    watchRun: true,
    cardTitle,
  })
  // Any of this card's runs in flight. The header's run control keys on it — pressing the
  // button while one is running must cancel that run, whatever record the page shows.
  const cardRunning = view.run?.phase === 'running'
  // The run in flight is the page's subject only when the page was not opened for a record
  // that names a different run: the card above can be running its own run while a history
  // row the user opened shows that row's settled record. The record is the page then, and
  // the run the card is busy with is not it — this is the same rule {@link cardContent}
  // draws, so the busy states and the body cannot disagree.
  const running = cardRunning
    && (view.run === undefined
      || view.runId === undefined
      || view.result === undefined
      || view.result?.runId === runIdOf(view.run))
  const bareRunning = view.bareRun?.phase === 'running'
  // Any run holding the card: the composer and the hand-edit stay off while one is,
  // because a revision or edit would race the run the user is watching. A settled record
  // opened from the history alongside the run is a read-only view of its own, which is
  // what the subject-aware `running` above separates from this.
  const busy = cardRunning || bareRunning
  // A refinement is a run that revises what is on screen. Its composer stays: it is the row
  // the instruction was just sent from, and it carries that run's stop control.
  const refining = view.refining === true
  // The composer needs something to revise: a card that has never run, or a stored
  // result from before the region language, has no HTML to start from.
  const refinable = resultHtml(view.result?.structured) !== undefined
  // Editing the stored result by hand. The editor replaces the rendered document in place
  // rather than opening a dialog: there is no dialog primitive in this product, and the
  // configuration page already works this way.
  const [editing, setEditing] = useState(false)
  // The control is offered while a result exists and no run holds the card. The fragment
  // itself is read from the record the page shows, never from the rendered DOM: the DOM is
  // the template's document with the fragment spliced into it, and its text is not the
  // value the splice needs.
  const editable = view.result !== undefined && !busy
  return (
    <section className={css.pageView}>
      <header className={css.pageViewHead}>
        <Button variant="ghost" size="sm" onClick={onBack}>{t('skillCardBack')}</Button>
        <h2 className={css.pageViewTitle}>{view.name ?? fallbackTitle}</h2>
        {view.skill !== undefined && <span className={css.pageViewSubtitle}>{view.skill}</span>}
        {/* Editing is secondary to running, so it sits to the left of the run control and
            only while there is a result to edit. While the editor is open it is gone: its
            own two controls are how this mode ends. */}
        {editable && !editing
          ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setEditing(true) }}
              data-result-edit-start=""
            >
              {t('skillCardResultEdit')}
            </Button>
          )
          : null}
        {/* The run control lives here: this is the page that shows what a run produces.
            A bare run holds this card's run slot, so pressing Run during one would only
            be refused; the control waits instead. It also waits while the editor is open,
            because a run replaces the very result the draft is being kept against.
            A card that takes an instruction has no control here — the bar below owns the one
            control, so pressing Run always spends the ask in the field. */}
        {view.instructionMode === 'none'
          ? (
            <Button
              variant="primary"
              size="sm"
              disabled={bareRunning || editing || (!cardRunning && !view.runnable)}
              onClick={() => { if (cardRunning) actions.cancel(); else actions.run() }}
            >
              {cardRunning ? t('skillCardCancel') : t('skillCardRun')}
            </Button>
          )
          : null}
      </header>
      {/* While a run holds the card the bar keeps only its control, which stops that run:
          the field would offer a second start that the Host would refuse. */}
      <RunBar
        cardId={cardId}
        mode={view.instructionMode}
        recent={view.recentInstructions}
        t={t}
        running={cardRunning}
        disabled={cardRunning ? false : bareRunning || editing || !view.runnable}
        onRun={(instruction) => { actions.run(instruction) }}
        onCancel={() => { actions.cancel() }}
      />
      {/* A disabled run control with no sentence beside it is the same defect the catalog
          notice fixes on the configuration page: the user cannot tell what is missing. */}
      {view.modelField.kind === 'unavailable'
        ? <p className={css.runProblem} data-run-model-unavailable="">{t('skillCardModelUnavailable')}</p>
        : null}
      {/* Where the card would run, when it cannot. Its own line rather than part of the
          model one: the two are separate configuration, and a user fixing one should not
          read a sentence about the other. */}
      {view.workspaceField.kind === 'missing'
        ? (
          <p className={css.runProblem} data-run-workspace-missing="">
            {t(problemKey('workspace-missing'))}
          </p>
        )
        : null}
      {view.workspaceField.kind === 'invalid' && view.workspaceField.checked
        ? (
          <p className={css.runProblem} data-run-workspace-invalid="">
            {t(problemKey('workspace-invalid'))}
            {` · ${view.workspaceField.path}`}
          </p>
        )
        : null}
      {/* The run control is disabled because this harness has no activation seam. The
          sentence names what is missing and which harness provides it, so the state is
          readable before the control is pressed rather than after it fails. */}
      {view.runUnavailable === undefined
        ? null
        : (
          <p className={css.runProblem} data-run-unavailable="">
            {t(problemKey(view.runUnavailable.code))}
          </p>
        )}
      {/* A refinement's failure is stated under the composer, which sits on this same page:
          saying it here as well put the same sentence on screen twice. What the page itself
          owed the user was a panel that named the run instead of reading "not run yet", and
          that is the body's own notice — see `SkillCardBody`. */}
      {view.problem === undefined || view.refineProblem !== undefined ? null : (
        <p className={css.runProblem} role="alert" data-run-problem={view.problem.code}>
          {t(problemKey(view.problem.code))}
          {view.problem.detail === '' ? '' : ` · ${view.problem.detail}`}
        </p>
      )}
      {view.actionProblem === undefined
        ? null
        : <ActionProblemLine problem={view.actionProblem} t={t} />}
      {view.bareRun === undefined ? null : (
        <p className={css.bareRun} data-bare-run={view.bareRun.phase}>
          {bareRunText(view.bareRun, t)}
        </p>
      )}
      {/* The panel takes the display area, exactly as the editor does. */}
      {view.pendingAction === undefined
        ? (
          <>
            {/* The rendered document is the content, and content without a frame reads as
                the page's own. The surface is only a frame now — border, radius and
                padding — and the padding is what keeps the document off that border: it
                carried a heading row until the product owner removed it as noise. */}
            <section className={css.resultSurface} data-result-surface="">
              {/* The editor takes the surface's content slot, and the thing being edited
                  is the same thing that was rendered a moment ago. */}
              {editing
                ? (
                  <SkillCardResultEditor
                    html={resultHtml(view.result?.structured) ?? ''}
                    t={t}
                    onSave={async (html) => {
                      // The editor stays open unless the Host stored the fragment, so a
                      // refused save leaves the draft exactly where it is.
                      if (await actions.saveResultEdit(html)) setEditing(false)
                    }}
                    onCancel={() => { setEditing(false) }}
                  />
                )
                : (
                  <div data-result-busy={running ? 'true' : 'false'} aria-busy={running ? true : undefined}>
                    <SkillCardBody
                      view={view}
                      cardId={cardId}
                      t={t}
                      onAction={actions.click}
                      documents={documents}
                    />
                  </div>
                )}
            </section>
            {/* Revising with a sentence and revising by hand are two modes of the same
                paragraph, and only one can be on screen: while the editor is open, the
                composer would be asking a model to replace the draft being written. A
                refinement keeps it, because that run's stop control lives in it. */}
            {refinable && !editing && (refining || !busy)
              ? (
                <RefinePanel
                  view={view}
                  t={t}
                  busy={busy}
                  onRefine={actions.refine}
                  onUndo={actions.undoRefine}
                  onStop={actions.cancel}
                />
              )
              : null}
          </>
        )
        : (
          <ActionPanel
            pending={view.pendingAction}
            t={t}
            onConfirm={actions.confirmAction}
            onCancel={actions.cancelAction}
          />
        )}
      {/* The settled trace belongs to the record the page shows. While the run in flight
          is the page's subject the live stream above is it, and a 「已完成」 header under it
          would label a record nobody is reading; a record a history row opened has its own
          trace, and hiding it because the card is busy with a different run would repeat
          the defect this page just fixed for the body. */}
      {running ? null : <RunTrace view={view} t={t} />}
      {/* What this card's runs may write, stated beneath everything because it is not the
          content and still has to be readable before pressing Run. The skill it executes is
          disk content, so the mode is the sentence that says how far that can reach — and a
          mode nobody can see is a permission nobody checked. */}
      <p className={css.permission} data-run-permission={view.permission}>
        {t('skillCardRunsWithPermission', { mode: t(permissionLabelKey(view.permission)) })}
      </p>
    </section>
  )
}

/**
 * Render the card's configuration in the whole display column.
 *
 * The head is the way back and nothing else. The card's name and skill were repeated
 * here *and* in the fields below, which made the page state the same two facts twice
 * and the head's copy the one that could not be edited. Removing the card lives in the
 * footer instead, apart from the controls a user presses without reading.
 * @param props - transport, card identity, session resolver, title fallback, back, and `t`.
 * @returns the configuration page.
 */
export function SkillCardConfigPage(props: SkillCardPageProps): ReactNode {
  const { api, cardId, runSessionId, pickerSessionId, models, workspacePicker, onBack, t } = props
  // The face's own naming rule, reused here so the editor checks a declared card target
  // against the title the user reads on the grid — which is the name the click path
  // resolves — instead of against the card id a nameless card would otherwise show as.
  const cardTitle = useCallback(
    (id: string, name: string | undefined): string => cardFaceTitle({ cardId: id, name }, t),
    [t],
  )
  const { view, actions } = useSkillCard({
    api,
    cardId,
    session: runSessionId,
    ...pickerSessionId === undefined ? {} : { pickerSession: pickerSessionId },
    models,
    workspacePicker,
    withCatalog: true,
    cardTitle,
  })
  return (
    <section className={css.pageView}>
      <header className={css.pageViewHead}>
        <Button variant="ghost" size="sm" onClick={onBack}>{t('skillCardBack')}</Button>
      </header>
      <SkillCardSettings
        // Keyed on the skill so the draft re-seeds from that skill's template.
        key={view.skill ?? ''}
        view={view}
        t={t}
        onChoose={actions.chooseSkill}
        onChooseModel={actions.chooseModel}
        onChoosePermission={actions.choosePermission}
        onChooseInstructionMode={actions.chooseInstructionMode}
        onChooseWorkspace={actions.chooseWorkspace}
        onSave={actions.saveTemplate}
        onRename={actions.rename}
        onClose={onBack}
        // Leaving is deferred until the Host has committed, so the grid cannot read
        // the card again.
        onDelete={() => { void actions.remove().then(onBack) }}
      />
    </section>
  )
}

/**
 * Choose the message for one action failure.
 * @param code - the failure code.
 * @returns the locale key. Exhaustive over the code union.
 */
function actionProblemKey(code: WorkbenchActionProblemCode): WorkbenchLocaleKey {
  return ACTION_PROBLEM_KEYS[code]
}

/**
 * Locale key for every reason a clicked action cannot run.
 *
 * A record rather than a lookup with a fallback, so a new code fails compilation here
 * until it has copy in both dictionaries.
 */
const ACTION_PROBLEM_KEYS: Record<WorkbenchActionProblemCode, WorkbenchLocaleKey> = {
  'missing-action': 'actionProblemMissingAction',
  // Never reported by the controller — a button without a row gets the card's own
  // document instead — but the union includes it so the table stays exhaustive.
  'missing-payload': 'actionProblemMissingPayload',
  'malformed-payload': 'actionProblemMalformedPayload',
  'oversized-payload': 'actionProblemOversizedPayload',
  'unknown-action': 'actionProblemUnknownAction',
  'target-card-missing': 'actionProblemCardMissing',
  'target-card-ambiguous': 'actionProblemCardAmbiguous',
  'target-skill-missing': 'actionProblemSkillMissing',
  'target-busy': 'actionProblemBusy',
  'target-unavailable': 'actionProblemUnavailable',
  // The card that would run has nowhere to run. Same two messages the run control and the
  // configuration field use, so one fact never gets two different sentences.
  'target-workspace-missing': 'skillCardProblemWorkspaceMissing',
  'target-workspace-invalid': 'skillCardProblemWorkspaceInvalid',
}
