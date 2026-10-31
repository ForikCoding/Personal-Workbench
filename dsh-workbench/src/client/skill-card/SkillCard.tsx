/**
 * The skill card: one HTML template the user wrote, filled with the value a child
 * agent produced.
 *
 * The card owns no frame. It hands the shared shell its presentation facts and
 * supplies its content through the shell's body slot.
 * @module dsh-workbench/client/skill-card/SkillCard
 */

import { useMemo, type ReactNode } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsRenderFactories, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { WorkbenchLocaleKey } from '../locales.ts'
import type { WorkbenchCardState } from '../contract.ts'
import { useWorkbenchReorder } from '../WorkbenchCardGrid.tsx'
import { ShadowHtml } from './ShadowHtml.tsx'
import { filledTemplate, resultHeadline, resultHtml } from './render.ts'
import type { WorkbenchActionEvent, WorkbenchScriptBinder } from './render.ts'
import { useSkillCard } from './controller.ts'
import type { WorkbenchCardProblem, WorkbenchCardView } from './controller.ts'
import { CardRunButton } from './CardRun.tsx'
import type { WorkbenchSkillCardApi } from './api.ts'
import { latestRunText } from './clock.ts'
import { RunningNotice } from './ActivityTrace.tsx'
import css from './skill-card.module.css'

/** Identity of the one skill card. */
export const SKILL_CARD_ID = 'skill-card'

/**
 * Read the title one card face shows.
 *
 * Kept next to the face that applies it, because an action declaration addresses a
 * card by the name the user sees: resolving that name has to fall back exactly the
 * same way, or a declaration pointing at a nameless card would never resolve.
 * @param stored - the stored card record.
 * @param stored.cardId - the card's identity.
 * @param stored.name - the user's name for it, when one is stored.
 * @param t - translator, for the default card's own label.
 * @returns the visible title.
 */
export function cardFaceTitle(
  stored: { readonly cardId: string; readonly name?: string | undefined },
  t: (key: WorkbenchLocaleKey) => string,
): string {
  // Only the default card may fall back to the type's name: a nameless extra instance
  // would otherwise be indistinguishable from it on the grid.
  return stored.name ?? (stored.cardId === SKILL_CARD_ID ? t('skillCardTitle') : stored.cardId)
}

/**
 * Where one card stands, as the face's status dot reports it.
 *
 * A run in flight outranks everything: the card is working, whatever its last record says.
 * With nothing running, the newest stored run is the verdict — and a run that ended
 * without usable content is an error rather than a success, which is the distinction the
 * record's own `failure` carries (see `run-timeout`).
 * @param view - what the card currently shows.
 * @returns the state the shared shell paints.
 */
export function cardFaceStanding(view: WorkbenchCardView): WorkbenchCardState {
  if (view.run?.phase === 'running') return 'ongoing'
  const latest = view.runs[0]
  if (latest === undefined) return 'idle'
  return latest.failure === undefined ? 'done' : 'error'
}

/** Injected share of the skill card entry. */
export interface SkillCardFace {
  /** Transport. */
  readonly api: WorkbenchSkillCardApi
  /**
   * Read the session the card reads the installed skills through.
   *
   * Not the session a run executes in: a run is given one of its own. This one supplies the
   * agent scope a catalog read needs. A callback rather than a value: the read happens when
   * the card asks, which is the freshest point and finds a session opened after the card
   * rendered. The `useSessions` hook belongs to `ui-session`'s standard props, which this
   * package cannot type without depending on that plugin's client entry.
   * @returns the session id, or undefined when none qualifies.
   */
  readonly runSessionId: () => string | undefined
  /**
   * Open one of this card's full-panel views in the whole display column.
   * @param cardId - the card to show.
   * @param view - which of its views; `result` without a run opens the latest run.
   */
  readonly openCard: (cardId: string, view: 'result' | 'runs' | 'config') => void
}

/** Composed props of the skill card entry. */
export type SkillCardProps =
  PropsRuntime<'workbench.cards'>
  & PropsRenderFactories
  & InjectFace<SkillCardFace>
  & {
    /**
     * Translate one workbench string.
     *
     * Takes parameters because the face counts and dates its own runs, and a count is
     * part of the sentence rather than something appended to it.
     * @param key - dictionary key.
     * @param params - named values the sentence interpolates.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  }

/**
 * Render the skill card.
 * @param props - owner props, shell render share, transport, session lookup, and `t`.
 * @returns the card element.
 */
export function SkillCard(props: SkillCardProps): ReactNode {
  const { t, api, runSessionId, openCard, renderFactorySlot, visibleIds, cardId, onCardsChanged } = props
  const reorder = useWorkbenchReorder()
  // Only the face's facts are read here. The controller is built again by whichever
  // page the card opens, and that page is the one that runs and renders.
  const { view, actions } = useSkillCard({ api, cardId, session: runSessionId })

  // The card face is an index entry: the user's name for the card, the skill it
  // runs, the way to run it, and the way into its configuration. The result and the
  // configuration each take the whole display column, so neither is rendered inside a
  // grid cell.
  //
  // Running is here rather than on the card's own page: starting a run is an action *on*
  // a card, and the grid is where the cards are — so a card can be run without being
  // opened, which is what a user with five cards actually does.
  const actionsSlot = useMemo(
    () => () => (
      <div className={css.cardActions}>
        <CardRunButton cardId={cardId} view={view} actions={actions} t={t} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { openCard(cardId, 'config') }}
        >
          {t('skillCardSettings')}
        </Button>
      </div>
    ),
    [actions, cardId, openCard, t, view],
  )

  // The face's body is a summary, not a preview: the first line the last run actually
  // produced, so a grid of cards says what each one last said instead of showing three
  // empty frames. The whole document stays on the result page, where there is room for it.
  const latest = view.runs[0]
  // Parsed once per result rather than once per render: reading a headline means building
  // a document from the region HTML, and the face re-renders on every run-state poll.
  const result = view.result
  const headline = useMemo(
    () => (result === undefined ? undefined : resultHeadline(resultHtml(result) ?? '')),
    [result],
  )
  const bodySlot = useMemo(
    () => () => (
      <div className={css.faceBody}>
        <p
          className={css.faceSummary}
          data-face-summary={headline === undefined ? 'empty' : 'text'}
        >
          {headline ?? t('skillCardNotRunBody')}
        </p>
        {/* Only the count: the status beside the title already says when the last run
            finished, and printing the same moment twice on one card is noise. */}
        {latest === undefined ? null : (
          <p className={css.faceFoot}>{t('runHistoryCount', { count: view.runs.length })}</p>
        )}
      </div>
    ),
    [headline, latest, t, view.runs.length],
  )

  // The face's own verdict: what a glance at the grid has to answer — is this card
  // working, did its last run end well, and when. The dot is the shell's, so every card
  // in the workbench reads the same way; the text beside it is this card's own fact.
  const state = cardFaceStanding(view)
  const statusText = state === 'ongoing'
    ? t('statusOngoing')
    : latest === undefined ? t('skillCardNotRunTitle') : latestRunText(latest.executedAt)

  return renderFactorySlot('workbench.card', {
    id: cardId,
    title: cardFaceTitle({ cardId, name: view.name }, t),
    ...view.skill === undefined ? {} : { subtitle: view.skill },
    state,
    status: statusText,
    ...view.problem === undefined ? {} : { failure: t(problemKey(view.problem.code)) },
    // A card opens on its run history: the list names every run and each row opens
    // that run's result, while the grid's naked result read gave no way to the past.
    onActivate: () => { openCard(cardId, 'runs') },
    // The card owns the removal, and the panel owns the list it renders from, so the
    // panel is told once the Host has committed.
    onRemove: () => { void actions.remove().then(onCardsChanged) },
    reorderable: reorder?.reorderable ?? false,
    position: Math.max(1, visibleIds.indexOf(cardId) + 1),
    total: Math.max(1, visibleIds.length),
  }, { slots: { actions: actionsSlot, body: bodySlot } })
}

/** Props of the card body. */
export interface SkillCardBodyProps {
  /** What the card currently shows. */
  readonly view: WorkbenchCardView
  /**
   * The card this body belongs to; the document's own script is bound to it.
   *
   * Absent renders the document unbound: its own logic runs, and a read it asks for finds no
   * card behind it. Both pages that show a card always have one; a preview need not.
   */
  readonly cardId?: string | undefined
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey) => string
  /**
   * Called when a button inside the rendered document is clicked.
   *
   * Omitted leaves the document inert, which is the whole of what a card without a
   * confirmation panel should do with a child-authored button.
   * @param event - the action the click resolved to, or why it could not be read.
   */
  readonly onAction?: ((event: WorkbenchActionEvent) => void) | undefined
  /** Builds the binding the rendered document's own script receives. */
  readonly documents?: WorkbenchScriptBinder | undefined
}

/**
 * Render the card's content.
 *
 * The permission note is not here: the result page carries it as a footnote beneath
 * everything, because it is a statement about the page rather than part of the document
 * the card renders.
 * @param props - the view, `t`, and the click outlet.
 * @returns the body element.
 */
export function SkillCardBody({ view, cardId, t, onAction, documents }: SkillCardBodyProps): ReactNode {
  return <div className={css.body}>{cardContent(view, cardId, t, onAction, documents)}</div>
}

/**
 * Render whichever content the card currently has.
 * @param view - the card view.
 * @param cardId - the card the body belongs to.
 * @param t - translator.
 * @param onAction - click outlet for buttons the document carries.
 * @param documents - binding factory for the rendered document's own script.
 * @returns the content element.
 */
function cardContent(
  view: WorkbenchCardView,
  cardId: string | undefined,
  t: (key: WorkbenchLocaleKey) => string,
  onAction: ((event: WorkbenchActionEvent) => void) | undefined,
  documents: WorkbenchScriptBinder | undefined,
): ReactNode {
  if (view.status === 'loading') {
    return <Notice title={t('skillCardLoading')} body={t('skillCardLoadingBody')} />
  }
  if (view.template === undefined) {
    return <Notice title={t('skillCardNoTemplateTitle')} body={t('skillCardNoTemplateBody')} />
  }
  // A run in flight is a state of its own. Without this the page looked exactly the same
  // before and during a run, which is what made pressing Run look inert.
  //
  // A refinement is the exception: it edits the result already on screen, so replacing
  // that result with a progress notice hides the very thing being revised. The surface
  // stays, marked busy, and is swapped when the new version arrives.
  //
  // So is a page opened from the history onto a record that is not the run in flight:
  // the card above is busy with its own run, but the record a row opened is what that
  // page shows. The notice is the run in flight, and the run in flight is the subject
  // only when no record was named — or when the row named is the running row itself,
  // which has no stored record yet, so the live run is all there is until it settles.
  //
  // The notice carries the run's own activity stream — the tool calls the child has made
  // so far — and falls back to this card's previous sentence when there is nothing to list
  // yet. See {@link RunningNotice}.
  const subjectIsTheRun = view.run?.startedAt === undefined
    || view.runId === undefined
    || view.result === undefined
    || view.result?.runId === String(view.run.startedAt)
  if (view.run?.phase === 'running' && view.refining !== true && subjectIsTheRun) {
    return <RunningNotice run={view.run} t={t} />
  }
  // Why the record on screen has nothing to show, when the run said why.
  //
  // Read from the record first and the live run second: the record is what survives a
  // reload, and the run is what carries the verdict while it is still in memory. Without
  // this a failed run and a card nobody has run looked identical — "not run yet" beside a
  // trace that plainly showed the run happening.
  const sameRun = view.result !== undefined && view.run?.result?.runId === view.result.runId
  const failure = view.result?.failure ?? (sameRun ? view.run?.failure : undefined)
  const failureCode = view.result?.failureCode ?? (sameRun ? view.run?.failureCode : undefined)
  if (view.result === undefined) {
    return failure === undefined
      ? <Notice title={t('skillCardNotRunTitle')} body={t('skillCardNotRunBody')} />
      : <Notice title={failureTitle(failureCode, t)} body={failure} />
  }
  const filled = resultHtml(view.result.structured)
  if (filled === undefined) {
    if (failure !== undefined) return <Notice title={failureTitle(failureCode, t)} body={failure} />
    // A result stored before the region language existed carries named values instead
    // of HTML. It cannot be shown, so the card reads as not run rather than as empty.
    return <Notice title={t('skillCardNotRunTitle')} body={t('skillCardNotRunBody')} />
  }
  // The template's skeleton stays exactly as written; only its region came from the run.
  // The document's own script runs here too, bound to this card: it is the user's code, and
  // the directory it reads is the card's own.
  return (
    <ShadowHtml
      html={filledTemplate(view.template, filled)}
      className={css.template}
      onAction={onAction}
      cardId={cardId}
      runId={view.result.runId}
      documents={documents}
    />
  )
}

/**
 * Choose the heading of a card that has no content to show because a run failed.
 *
 * A deadline gets its own words: it is not a fault and saying "failed" would send the user
 * looking for one. Any other code reads as the plain failure it is.
 * @param code - the failure code stored on the record, when one was stored.
 * @param t - translator.
 * @returns the heading.
 */
function failureTitle(
  code: string | undefined,
  t: (key: WorkbenchLocaleKey) => string,
): string {
  return code === 'run-timeout'
    ? t('skillCardResultTimeoutTitle')
    : t('skillCardResultFailedTitle')
}

/** One empty-state block. */
function Notice({ title, body }: { readonly title: string; readonly body: string }): ReactNode {
  return (
    <div className={css.notice}>
      <p className={css.noticeTitle}>{title}</p>
      <p className={css.noticeBody}>{body}</p>
    </div>
  )
}

/**
 * Choose the status line for a higher-priority fact.
 * @param code - the failure code.
 * @returns the locale key. Exhaustive over the code union.
 */
export function problemKey(code: WorkbenchCardProblem['code']): WorkbenchLocaleKey {
  return PROBLEM_KEYS[code]
}

/**
 * Locale key for every failure the card can report.
 *
 * A record rather than a lookup with a fallback, so a new failure code fails
 * compilation here until it has copy.
 */
const PROBLEM_KEYS: Record<WorkbenchCardProblem['code'], WorkbenchLocaleKey> = {
  'not-configured': 'skillCardProblemNotConfigured',
  'template-missing': 'skillCardProblemNoTemplate',
  'session-not-live': 'skillCardProblemNoSession',
  'skill-not-found': 'skillCardProblemSkillMissing',
  'provider-unavailable': 'skillCardProblemProvider',
  'model-unavailable': 'skillCardProblemModelUnavailable',
  'schema-rejected': 'skillCardProblemContract',
  'template-invalid': 'skillCardProblemTemplateInvalid',
  'run-in-progress': 'skillCardProblemRunning',
  'run-failed': 'skillCardProblemRunFailed',
  // A deadline is not a fault: the sentence names the clock, because running again is the
  // remedy and looking for something that broke is not.
  'run-timeout': 'skillCardProblemRunTimeout',
  // A harness without the activation seam: the one failure that is about the deployment
  // rather than about this card, and the only one whose copy names a version to install.
  'run-unavailable': 'skillCardProblemRunUnavailable',
  // A card with no directory chosen, and one whose directory is gone. Both close the run
  // control, and both name the fact the user has to fix rather than a generic failure.
  'workspace-missing': 'skillCardProblemWorkspaceMissing',
  'workspace-invalid': 'skillCardProblemWorkspaceInvalid',
  // The card's permission mode could not be applied, so the run was refused rather than
  // executed under a mode nobody chose.
  'permission-unavailable': 'skillCardProblemPermissionUnavailable',
  // A card that declares its runs need an instruction and was started without one. The
  // composer refuses the same case before sending, so this text is what a stale page or a
  // declared action sees.
  'instruction-missing': 'skillCardProblemInstructionMissing',
  'too-large': 'skillCardProblemTooLarge',
  'unavailable': 'skillCardProblemUnavailable',
  'unauthorized': 'skillCardProblemGeneric',
  'forbidden': 'skillCardProblemGeneric',
  'invalid-request': 'skillCardProblemGeneric',
  'conflict': 'skillCardProblemGeneric',
  'not-found': 'skillCardProblemGeneric',
  'storage-failure': 'skillCardProblemGeneric',
  'catalog-failed': 'skillCardProblemGeneric',
}
