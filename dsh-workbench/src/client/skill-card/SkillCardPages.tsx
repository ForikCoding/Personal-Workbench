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
import type { WorkbenchSkillCardApi } from './api.ts'
import { useSkillCard } from './controller.ts'
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
import { SkillCardResultEditor } from './SkillCardResultEditor.tsx'
import { SkillCardSettings } from './SkillCardSettings.tsx'
import { dedentedHtml, resultHtml } from './render.ts'
import css from './skill-card.module.css'

/**
 * Format one moment as a 24-hour clock time.
 *
 * Written by hand rather than through `toLocaleTimeString`: the revision log reads one
 * time per line, and a locale that renders a 12-hour clock would change the shape the
 * times are scanned as.
 * @param at - milliseconds since the epoch.
 * @returns `HH:MM:SS` in the browser's own time zone.
 */
function clockText(at: number): string {
  const date = new Date(at)
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map(part => String(part).padStart(2, '0'))
    .join(':')
}

/**
 * Chinese and English copy for every stop reason this build knows by name.
 *
 * The upstream stop-reason union is merge-extensible, so this is a partial map rather
 * than an exhaustive one: a value that is not here arrived from a build newer than this
 * one, and it has no copy to borrow.
 */
const STOP_REASON_KEYS: Readonly<Record<string, WorkbenchLocaleKey | undefined>> = {
  completed: 'runStopCompleted',
  error: 'runStopError',
  aborted: 'runStopAborted',
}

/**
 * Name one run's stop reason.
 * @param reason - the reason exactly as the run reported it.
 * @param t - translator.
 * @returns the localized name, or the raw value when this build has no copy for it —
 * printing the value is honest, while a made-up label would not be.
 */
function stopReasonText(reason: string, t: (key: WorkbenchLocaleKey) => string): string {
  const key = STOP_REASON_KEYS[reason]
  return key === undefined ? reason : t(key)
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
 * primitives expose no dialog, and the editor already works the same way. The four
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
        <dt>{t('actionFieldSession')}</dt>
        <dd data-action-field="session">{pending.sessionId}</dd>
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
 * One structured value, split for display.
 *
 * `html` is the region the document renders, so it is shown as the HTML it is. Every
 * other field stays JSON: it is the run's raw record, and re-formatting a value would
 * make the record disagree with what was stored.
 */
type StructuredParts =
  | { readonly kind: 'html'; readonly html: string; readonly rest?: string }
  | { readonly kind: 'json'; readonly json: string }

/**
 * Split one structured value into the HTML it carries and what is left over.
 * @param value - the result's structured value, which is never undefined here.
 * @returns the parts to render.
 */
function readStructured(value: unknown): StructuredParts {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    // Nothing to lift out, so the value stays exactly what it serialises to.
    return { kind: 'json', json: JSON.stringify(value, null, 2) }
  }
  const html = resultHtml(value)
  if (html === undefined) return { kind: 'json', json: JSON.stringify(value, null, 2) }
  // Copied field by field rather than destructured, so the remaining fields keep the
  // order they were stored in.
  const rest: Record<string, unknown> = {}
  for (const [key, field] of Object.entries(value)) {
    if (key !== 'html') rest[key] = field
  }
  return Object.keys(rest).length === 0
    ? { kind: 'html', html }
    : { kind: 'html', html, rest: JSON.stringify(rest, null, 2) }
}

/**
 * Render everything a finished run left behind.
 *
 * The structured value is what the template renders; the raw output, the stop reason,
 * and the provider's diagnostic are what answer "why is there no data". Every part of it
 * is omitted when it carries nothing: a row whose value is absent is a row that says
 * "empty", not a row that says what happened.
 * @param props - the card view and the translator.
 * @returns the output block.
 */
function RunOutput({
  view,
  t,
}: {
  readonly view: WorkbenchCardView
  readonly t: (key: WorkbenchLocaleKey) => string
}): ReactNode {
  const result = view.result
  if (result === undefined) return null
  const parts = result.structured === undefined ? undefined : readStructured(result.structured)
  const outputText = result.outputText === undefined || result.outputText.trim() === ''
    ? undefined
    : result.outputText
  return (
    // Collapsed on purpose, and the simplest way to say so is to give the element no
    // `open`: this block is the run's raw record, while the result above is the content.
    // Only a reader asking "why is this empty" opens it.
    <details className={css.runOutput} data-run-detail="">
      {/* The summary names the whole block. It used to read "raw output", which named
          one of the four rows inside it and buried the other three. */}
      <summary className={css.runOutputSummary}>{t('runDetailSummary')}</summary>
      <dl className={css.runFacts}>
        <dt>{t('runStopReason')}</dt>
        <dd data-run-stop-reason={result.stopReason}>{stopReasonText(result.stopReason, t)}</dd>
        {/* The route this result came from. Absent for a run that inherited the session's
            model: the Host was never told which route that resolved to, and inventing one
            would be worse than saying nothing. */}
        {result.model === undefined ? null : (
          <>
            <dt>{t('runModel')}</dt>
            <dd data-run-model={`${result.model.provider}/${result.model.model}`}>
              {result.model.provider}
              {' / '}
              {result.model.model}
            </dd>
          </>
        )}
        <dt>{t('runStartedAt')}</dt>
        <dd>{new Date(result.executedAt).toLocaleString()}</dd>
        {/* A hand-edited result states that it was edited, on its own row and with its own
            time: the record still carries the run's skill and stop reason, so nothing else
            here would say a person changed the HTML. */}
        {result.editedAt === undefined ? null : (
          <>
            <dt>{t('runEditedAt')}</dt>
            <dd data-run-edited-at={String(result.editedAt)}>{new Date(result.editedAt).toLocaleString()}</dd>
          </>
        )}
        {result.diagnostic === undefined ? null : (
          <>
            <dt>{t('runDiagnostic')}</dt>
            <dd>{result.diagnostic}</dd>
          </>
        )}
      </dl>
      {parts === undefined ? null : (
        <>
          <p className={css.runOutputLabel}>{t('runStructured')}</p>
          {parts.kind === 'json'
            ? <pre className={css.runPre}>{parts.json}</pre>
            // Indentation is the template region's, not the fragment's: it is dropped
            // for display only, and the stored value keeps it for the splice.
            : <pre className={css.runPreHtml} data-run-html="">{dedentedHtml(parts.html)}</pre>}
          {parts.kind === 'html' && parts.rest !== undefined
            ? (
              <>
                <p className={css.runOutputLabel}>{t('runStructuredRest')}</p>
                <pre className={css.runPre}>{parts.rest}</pre>
              </>
            )
            : null}
        </>
      )}
      {outputText === undefined ? null : (
        <>
          <p className={css.runOutputLabel}>{t('runRawOutput')}</p>
          <pre className={css.runPre}>{outputText}</pre>
        </>
      )}
    </details>
  )
}

/** What both pages need to show and change one card. */
export interface SkillCardPageProps {
  /** Transport. */
  readonly api: WorkbenchSkillCardApi
  /** Card being shown. */
  readonly cardId: string
  /**
   * Resolve the session a run hangs off.
   * @returns the session id, or undefined when none is available.
   */
  readonly runSessionId: () => string | undefined
  /**
   * Resolve the session the application's own model picker is attached to.
   *
   * The model field reads this session's directory, so the card offers the catalog a user
   * choosing a model is looking at. Omitted falls back to the run session, which is the
   * only session a page without a session list can name.
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
   * is the one that needs this.
   * @param cardId - the card to show.
   * @param view - which of its two views.
   */
  readonly openCard: (cardId: string, view: 'result' | 'config') => void
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
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

/**
 * Render the card's result in the whole display column, with its run control.
 * @param props - transport, card identity, session resolver, title fallback, back, and `t`.
 * @returns the result page.
 */
export function SkillCardResultPage(props: SkillCardPageProps): ReactNode {
  const { api, cardId, runSessionId, pickerSessionId, models, workspacePicker, fallbackTitle, onBack, openCard, t } = props
  // The face's own naming rule, reused so an action declaration can address this card
  // by the title the user actually reads on it.
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
    // This page is where another card's button lands after starting this card's run.
    watchRun: true,
    cardTitle,
  })
  const running = view.run?.phase === 'running'
  const bareRunning = view.bareRun?.phase === 'running'
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
  const editable = view.result !== undefined && !running && !bareRunning
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
            because a run replaces the very result the draft is being kept against. */}
        <Button
          variant="primary"
          size="sm"
          disabled={bareRunning || editing || (!running && !view.runnable)}
          onClick={running ? actions.cancel : actions.run}
        >
          {running ? t('skillCardCancel') : t('skillCardRun')}
        </Button>
      </header>
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
      {/* A refinement's failure is reported under the composer instead; stating it here
          too would put the same failure on the page twice. */}
      {view.problem === undefined || view.refineProblem !== undefined ? null : (
        <p className={css.runProblem} role="alert">
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
                    <SkillCardBody view={view} t={t} onAction={actions.click} />
                  </div>
                )}
            </section>
            {/* Revising with a sentence and revising by hand are two modes of the same
                paragraph, and only one can be on screen: while the editor is open, the
                composer would be asking a model to replace the draft being written. */}
            {refinable && !editing
              ? (
                <RefinePanel
                  view={view}
                  t={t}
                  busy={running || bareRunning}
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
      <RunOutput view={view} t={t} />
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
