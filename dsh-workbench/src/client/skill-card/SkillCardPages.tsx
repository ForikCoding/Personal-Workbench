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
import {
  Button,
  IconChevronLeftOutlineRegular,
  IconChevronRightOutlineRegular,
  IconCloseOutlineMedium,
  IconCodeOutlineRegular,
  IconEditOutlineRegular,
  IconPlayOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorkbenchLocaleKey } from '../locales.ts'
import type { WorkbenchResultRecord } from '../../skill-card-contract.ts'
import type { WorkbenchSkillCardApi } from './api.ts'
import { runIdOf, useSkillCard } from './controller.ts'
import type {
  WorkbenchActionProblem,
  WorkbenchActionProblemCode,
  WorkbenchBareRunState,
  WorkbenchCardView,
  WorkbenchPendingAction,
  WorkbenchWorkspaceTypedProblem,
} from './controller.ts'
import { WorkspacePathField } from './WorkspaceField.tsx'
import type { WorkbenchModelSeat } from './model.ts'
import { permissionLabelKey } from './permission.ts'
import type { WorkbenchWorkspacePicker } from './workspace-picker.ts'
import {
  RunProblemLines,
  RunWorkspaceLine,
  SkillCardBody,
  cardFaceTitle,
  problemKey,
} from './SkillCard.tsx'
import { RunTraceList, RunTraceToggle } from './ActivityTrace.tsx'
import { SkillCardResultEditor } from './SkillCardResultEditor.tsx'
import { SkillCardSettings } from './SkillCardSettings.tsx'
import { resultHeadline, resultHtml } from './render.ts'
import { COMPOSER_MAX_ROWS, InstructionField, RunPrompt } from './CardRun.tsx'
import { PromptDialog } from './PromptDialog.tsx'
import { holdScroll, releaseScroll, revealAnchor, type ScrollHold } from './scroll-hold.ts'
import type { WorkbenchScriptBinder } from './render.ts'
import { clockText, dayKey, latestRunText, runClockText } from './clock.ts'
import css from './skill-card.module.css'

/** What every full-panel view needs to state where it is. */
interface PageHeadProps {
  /** The way back to the grid. */
  readonly onBack: () => void
  /** The card's name; omitted by the configuration view, whose own field states it. */
  readonly title?: string | undefined
  /** The facts about the view, separated by the sheet. */
  readonly meta?: ReactNode
  /** Translator, for the way back. */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
}

/**
 * The head the three full-panel views share.
 *
 * Tiered rather than one row. The way back sits above the title, so the title and
 * everything under it — the facts, the composer, the run history — begin on the page's
 * one left edge; inline, the back control indented the heading and every row below it
 * started somewhere else.
 * @param props - the way back, the title, and the view's facts.
 * @returns the head.
 */
function PageHead({ onBack, title, meta, t }: PageHeadProps): ReactNode {
  return (
    <header className={css.pageHead}>
      <div className={css.pageHeadBar}>
        <Button
          variant="ghost"
          size="sm"
          icon={<IconChevronLeftOutlineRegular />}
          onClick={onBack}
        >
          {t('skillCardBack')}
        </Button>
      </div>
      {title === undefined ? null : <h2 className={css.pageHeadTitle}>{title}</h2>}
      {meta === undefined ? null : <div className={css.pageHeadMeta}>{meta}</div>}
    </header>
  )
}

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
  workspaceProblem,
  t,
  onSetWorkspace,
  onConfirm,
  onCancel,
}: {
  readonly pending: WorkbenchPendingAction
  readonly workspaceProblem: WorkbenchWorkspaceTypedProblem | undefined
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  /** Change the directory this one invocation happens in. */
  readonly onSetWorkspace: (path: string) => void
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
        {/* Where this invocation happens. Stated as a fact of the run, like the skill: the
            card whose button was pressed supplies the value, because the material the run
            was triggered from is in that card's folder — and it is changeable here, because
            the same row is often read in a folder the reader had to go and find. */}
        <dt>{t('actionFieldWorkspace')}</dt>
        <dd data-action-field="workspace">
          <div data-action-workspace="">
            <WorkspacePathField
              value={pending.workspace}
              fieldKind="ready"
              problem={workspaceProblem}
              t={t}
              onCommit={onSetWorkspace}
            />
          </div>
          <p className={css.fieldNote} data-action-workspace-note="">
            {t('actionWorkspaceNote')}
          </p>
        </dd>
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

/** The three ways the result page lets a user change what it shows. */
type ResultChange = 'revise' | 'fresh' | 'edit'

/**
 * The selector's label for each way of changing the result.
 *
 * A record rather than a chain of comparisons, so a fourth way fails compilation here
 * until it has copy in both dictionaries.
 */
const CHANGE_LABELS: Record<ResultChange, WorkbenchLocaleKey> = {
  revise: 'resultReviseMode',
  fresh: 'resultFreshMode',
  edit: 'skillCardResultEdit',
}


/**
 * Render this session's revision log, and why the last revision was refused.
 *
 * It stays on the page rather than inside the dialog the ask is written in: the log is a
 * record of what the document already went through, and a reader deciding what to say next
 * wants to read it while the document is in front of them. It reads as a conversation — the
 * instruction, then when it was applied — because that is the order the two were said in.
 * @param props - the card view, the translator, and the one step back.
 * @returns the log, or nothing when this session has changed nothing.
 */
function RefineHistory({
  view,
  t,
  onUndo,
}: {
  readonly view: WorkbenchCardView
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly onUndo: () => void
}): ReactNode {
  const empty = view.refineProblem === undefined && view.refinements.length === 0 && view.previous === undefined
  if (empty) return null
  return (
    <div className={css.refineLog} data-refine-log="">
      {view.refineProblem === undefined ? null : (
        // Under the block rather than above the result: this is where the ask came from,
        // and the result beside it is the one that was left untouched.
        <p className={css.composerProblem} role="alert" data-refine-problem={view.refineProblem.code}>
          {t(problemKey(view.refineProblem.code))}
          {view.refineProblem.detail === undefined || view.refineProblem.detail === ''
            ? ''
            : ` · ${view.refineProblem.detail}`}
        </p>
      )}
      {view.refinements.length === 0 && view.previous === undefined
        ? null
        : (
          <>
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
          </>
        )}
    </div>
  )
}

/**
 * The dialog a revision's sentence is written in.
 *
 * The block under the document offers the three ways of changing it as three quiet controls;
 * the two that need a sentence take it here, where there is room to write one and the
 * document stays behind the panel instead of the page jumping to make space for a field.
 * @param props - the translator, whether the card is busy, and the two ways out.
 * @returns the dialog.
 */
function RevisePrompt({
  t,
  busy,
  onRefine,
  onCancel,
}: {
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly busy: boolean
  readonly onRefine: (instruction: string) => void
  readonly onCancel: () => void
}): ReactNode {
  const [instruction, setInstruction] = useState('')
  const empty = instruction.trim() === ''
  const submit = (): void => {
    if (empty || busy) return
    onRefine(instruction)
  }
  return (
    <PromptDialog
      title={t('resultReviseMode')}
      hint={t('promptReviseHint')}
      submitLabel={t('refineAction')}
      submitDisabled={empty}
      cancelLabel={t('skillCardCancel')}
      closeLabel={t('promptClose')}
      busy={busy}
      onCancel={onCancel}
      onSubmit={submit}
    >
      <InstructionField
        className={css.dialogField}
        value={instruction}
        onChange={setInstruction}
        rows={Math.min(COMPOSER_MAX_ROWS, Math.max(2, instruction.split('\n').length))}
        placeholder={t('refinePlaceholder')}
        ariaLabel={t('refinePlaceholder')}
        submitOn="enter"
        onSubmit={submit}
        focus
      />
    </PromptDialog>
  )
}


/**
 * Render the card's run history in the whole display column.
 *
 * Every card opens here first: the list names each run and its outcome, newest first,
 * and a row opens that run's result. No run starts from this page — starting one is an
 * action on the card, and the card's face in the grid carries it — but a run in flight is
 * stopped from its own row, because the row is what names it.
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
  // Stopping is per row, where the run is named: a card may run several at once, so one
  // header toggle would have to choose which of them to stop.
  // The history rows stay open: a stored run is a read-only record, and the row of the run
  // in flight is the way to watch it — refusing the click left the list looking like dead
  // rows.
  // The newest stored run, if the card has one: the heading states when the card last
  // produced something, which is the one fact a history page's visitor wants before
  // reading seven rows.
  const newest = view.runs[0]
  // Ordinals count from the card's first run, so "第 3 次" keeps meaning the same run as
  // more runs arrive; the list itself is newest first.
  const ordinalOf = new Map(view.runs.map((run, index) => [run.runId, view.runs.length - index]))
  return (
    <section className={css.pageView}>
      <PageHead
        onBack={onBack}
        title={view.name ?? fallbackTitle}
        t={t}
        meta={(
          <>
            {view.skill === undefined ? null : <span className={css.pageHeadChip}>{view.skill}</span>}
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
          </>
        )}
      />
      {/* The same sentences the result page states, so a card whose face cannot start a run
          says why here too: this page is where the user comes to find out why it has not. */}
      <RunProblemLines view={view} t={t} />
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
  // The row of the run in flight is the synthetic record the controller builds, and its stop
  // reason is the word that says so.
  const running = run.stopReason === 'running'
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
            {/* A run that stored nothing still states that in the row's first line. Left
                empty, the row was a lone grey meta line, indistinguishable from a row that
                had failed to load.

                A run still going is the other case, and not the same one: it has no content
                *yet*, so the row said the run was over and empty while its own outcome
                column said 运行中. */}
            {headline === undefined
              ? (
                running
                  ? (
                    <span className={css.runHistoryTitle} data-run-history-pending="">
                      {t('runHistoryRunningTitle')}
                    </span>
                  )
                  : (
                    <span className={css.runHistoryTitle} data-empty="true" data-run-history-nothing="">
                      {t('runHistoryNoContent')}
                    </span>
                  )
              )
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
            <span className={css.runHistoryChevron} aria-hidden="true">
              <IconChevronRightOutlineRegular />
            </span>
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
  // A revision needs something to revise: a card that has never run, or a stored result from
  // before the region language, has no HTML to start from.
  const refinable = resultHtml(view.result?.structured) !== undefined

  // The steps the record the page shows actually took. Its fold control is one more thing on
  // the block's own line — beside the ways of changing the result, because a reader deciding
  // what to do next is exactly who wants to see how the last run went — and the steps open
  // under that line. While a run is in flight the live stream in the body is the run, so the
  // settled record's steps stay out of the way.
  const trace = view.result?.activity ?? []
  const traceable = !busy && trace.length > 0
  // Which record's fold is open, by run id: opening another run's record starts folded again
  // without an effect to reset it.
  const [openTraceOf, setOpenTraceOf] = useState<string | undefined>(undefined)
  const traceOpen = traceable && view.result !== undefined && openTraceOf === view.result.runId

  // Which of the two sentences is being written, if either. The block's third way — the hand
  // edit — needs no dialog: the editor replaces the document in place, where the fragment is
  // already readable.
  const [prompt, setPrompt] = useState<'revise' | 'fresh' | undefined>(undefined)
  // The hand edit is offered while a result exists and no run holds the card. The fragment
  // itself is read from the record the page shows, never from the rendered DOM: the DOM is
  // the template's document with the fragment spliced into it, and its text is not the
  // value the splice needs.
  const editable = view.result !== undefined && !busy
  // Editing the stored result by hand. The editor replaces the rendered document in place
  // rather than opening a dialog: the fragment is long, and a dialog over the document it is
  // a fragment *of* would put the two out of view of each other.
  const [editing, setEditing] = useState(false)
  // Where the reader stood when the document was swapped for the editor.
  //
  // The document is thousands of pixels of template output and the editor is one bounded
  // pane, so opening the edit collapses the page and the browser clamps the scroll position
  // to what still exists — the top. The document then comes back at its full height with the
  // reader still up there, a page away from the act block they were using: cancelling an edit
  // to go and press 运行 meant scrolling the whole document again.
  //
  // What is kept is the act block's place on screen, not a pixel offset, because an edit may
  // change the document's own height: a taller document has to be scrolled further to put the
  // same block in the same spot.
  const pageRoot = useRef<HTMLElement>(null)
  const actBlock = useRef<HTMLElement>(null)
  const heldScroll = useRef<ScrollHold | undefined>(undefined)
  // Opening the editor holds the reader's place first, while the block being anchored to is
  // still on screen: the editor takes the document's place and the block goes with it.
  const openEditor = (): void => {
    heldScroll.current = holdScroll(pageRoot.current, actBlock.current)
    setEditing(true)
  }
  const wasEditing = useRef(editing)
  const restoreFrame = useRef<number | undefined>(undefined)
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useLayoutEffect(() => {
    const exited = !editing && wasEditing.current
    wasEditing.current = editing
    if (!exited) return
    const held = heldScroll.current
    heldScroll.current = undefined
    if (held === undefined) return
    // Restored on this commit, before the browser paints the taller page: reading the block's
    // position forces the layout that the offset must be measured against. Each pass corrects
    // from the offset this commit found the page at, so repeating it is the same as doing it
    // once — which is what makes the frames after it safe.
    const clamped = held.box.scrollTop
    // Every pass ends by asking the browser for the block itself.
    //
    // The arithmetic can be right and still leave the reader at the top: the shell may scroll
    // a container this page's walk up from its own root does not find, or reset the offset
    // after the swap. Asking for the block works through whatever container is really
    // scrolled, and costs nothing when the arithmetic already landed — the block is on screen
    // then, and `nearest` does not move a visible element.
    const restore = (): void => {
      releaseScroll(held, actBlock.current, clamped)
      revealAnchor(actBlock.current)
    }
    let passes = 0
    const pass = (): void => {
      restore()
      passes += 1
      if (passes >= 3 || typeof requestAnimationFrame !== 'function') return
      restoreFrame.current = requestAnimationFrame(pass)
    }
    pass()
    // One more look after the frames: the document's own content can attach a moment later,
    // and the reader is not going to have moved in a fifth of a second.
    restoreTimer.current = setTimeout(restore, 120)
  }, [editing])
  // The passes after the first are cancelled as soon as the page changes again: a reader who
  // has started scrolling away must not be pulled back by a frame that was queued before they
  // moved.
  useLayoutEffect(() => () => {
    if (restoreTimer.current !== undefined) {
      clearTimeout(restoreTimer.current)
      restoreTimer.current = undefined
    }
    if (restoreFrame.current === undefined || typeof cancelAnimationFrame !== 'function') return
    cancelAnimationFrame(restoreFrame.current)
    restoreFrame.current = undefined
  }, [editing])
  return (
    <section className={css.pageView} ref={pageRoot}>
      <PageHead
        onBack={onBack}
        title={view.name ?? fallbackTitle}
        t={t}
        meta={(
          <>
            {view.skill === undefined ? null : <span className={css.pageHeadChip}>{view.skill}</span>}
            {/* Where this result came out, in the head rather than under the document: it is
                one of the facts that name the result, alongside the skill that made it, and a
                line after the document put it below whatever length that document happened to
                have. */}
            <RunWorkspaceLine view={view} t={t} />
          </>
        )}
      />
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
          </>
        )
        : (
          <ActionPanel
            pending={view.pendingAction}
            workspaceProblem={view.actionWorkspaceProblem}
            t={t}
            onSetWorkspace={actions.setActionWorkspace}
            onConfirm={actions.confirmAction}
            onCancel={actions.cancelAction}
          />
        )}
      {/* The page's one place to act. Three ways to change the result — revise what is on
          screen, run the card again from scratch, edit the fragment by hand — as one row of
          quiet controls where the document they change ends, and the sentences two of them
          need in a dialog over it. The row is a row and not a segmented control any more:
          there is no longer a mode to be *in*, because choosing one of the first two opens a
          dialog rather than swapping the block's contents for a field.
          The editor keeps the block off screen: its own two controls are how that mode ends,
          and a switch beside a half-written draft would leave the draft without a question. */}
      {editing
        ? null
        : (
          <section className={css.actBlock} ref={actBlock} data-result-composer="">
            <div className={css.actRow} role="group" aria-label={t('resultChangeLabel')}>
              <button
                type="button"
                className={css.actAction}
                data-change-mode="revise"
                disabled={!refinable || busy}
                onClick={() => { setPrompt('revise') }}
              >
                <IconEditOutlineRegular size={14} />
                <span>{t(CHANGE_LABELS.revise)}</span>
              </button>
              <button
                type="button"
                className={css.actAction}
                data-change-mode="fresh"
                // While a run holds the card this control is that run's stop. It is the only
                // thing on the page that acts on a run, so it stays one control and changes
                // what it says, rather than growing a second button beside itself — and it is
                // here, at the end of the result, because the head is at the top of a page
                // that grows with that result. Otherwise it waits for the directory check.
                disabled={busy ? false : bareRunning || !view.runnable}
                onClick={() => {
                  if (busy) {
                    actions.cancel()
                    return
                  }
                  // Every run asks first: the dialog confirms or changes the directory this
                  // run happens in, and that question is put whether or not the card's skill
                  // takes an instruction.
                  setPrompt('fresh')
                }}
              >
                {busy ? <IconCloseOutlineMedium size={14} /> : <IconPlayOutlineRegular size={14} />}
                <span>{t(busy ? 'skillCardCancel' : CHANGE_LABELS.fresh)}</span>
              </button>
              {editable
                ? (
                  <button
                    type="button"
                    className={css.actAction}
                    data-change-mode="edit"
                    data-result-edit-start=""
                    // Through the setter that holds the reader's place: opening the editor
                    // collapses the page, and leaving it must not put the reader back at the
                    // top of a document they had scrolled to the end of.
                    onClick={openEditor}
                  >
                    <IconCodeOutlineRegular size={14} />
                    <span>{t(CHANGE_LABELS.edit)}</span>
                  </button>
                )
                : null}
              {/* Last on the line, because it is the one control here that changes nothing:
                  it says how the run behind this result went, and opens its steps. */}
              {traceable && view.result !== undefined
                ? (
                  <RunTraceToggle
                    trace={trace}
                    settled={{
                      stopReason: view.result.stopReason,
                      ...view.result.failure === undefined ? {} : { failure: view.result.failure },
                    }}
                    open={traceOpen}
                    onToggle={() => { setOpenTraceOf(traceOpen ? undefined : view.result?.runId) }}
                    t={t}
                  />
                )
                : null}
            </div>
            {traceOpen ? <RunTraceList trace={trace} t={t} /> : null}
            <RefineHistory view={view} t={t} onUndo={actions.undoRefine} />
          </section>
        )}
      {/* The two sentences, in the order the block offers them. Each dialog owns its own
          field, so closing it throws away a draft the user did not send — which is what
          cancelling a dialog means. */}
      {prompt === 'revise'
        ? (
          <RevisePrompt
            t={t}
            busy={busy}
            onRefine={(instruction) => {
              actions.refine(instruction)
              setPrompt(undefined)
            }}
            onCancel={() => { setPrompt(undefined) }}
          />
        )
        : null}
      {prompt === 'fresh'
        ? (
          <RunPrompt
            cardId={cardId}
            title={t('resultFreshMode')}
            view={view}
            mode={view.instructionMode}
            recent={view.recentInstructions}
            t={t}
            onChooseWorkspace={actions.chooseWorkspace}
            onSetWorkspace={actions.setWorkspace}
            onRun={(instruction) => {
              actions.run(instruction)
              setPrompt(undefined)
            }}
            onCancel={() => { setPrompt(undefined) }}
          />
        )
        : null}
      {/* Why the control just above cannot be pressed, stated under it rather than at the top
          of the page: the sentence belongs to the button it explains. */}
      <RunProblemLines view={view} t={t} />
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
      {/* The configuration view names itself now. Its head used to be the way back and
          nothing else, because the name and the skill were also in the fields below and a
          second, uneditable copy of a fact is what a page should not show. That still holds
          for the *values* — but a page with no title of its own borrows the panel's, and the
          panel's title is the home page's. The title here tracks the name field, so it is
          the same fact seen from the top of a long page rather than a copy that can drift. */}
      <PageHead
        onBack={onBack}
        t={t}
        title={cardTitle(cardId, view.name)}
        meta={(
          <>
            <span>{t('skillCardSettings')}</span>
            {view.skill === undefined ? null : <span className={css.pageHeadChip}>{view.skill}</span>}
            <span>{t(permissionLabelKey(view.permission))}</span>
          </>
        )}
      />
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
        onSetWorkspace={actions.setWorkspace}
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
