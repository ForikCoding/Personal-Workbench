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
import { useWorkbenchReorder } from '../WorkbenchCardGrid.tsx'
import { ShadowHtml } from './ShadowHtml.tsx'
import { filledTemplate, resultHtml } from './render.ts'
import type { WorkbenchActionEvent } from './render.ts'
import { useSkillCard } from './controller.ts'
import type { WorkbenchCardProblem, WorkbenchCardView } from './controller.ts'
import type { WorkbenchSkillCardApi } from './api.ts'
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

/** Injected share of the skill card entry. */
export interface SkillCardFace {
  /** Transport. */
  readonly api: WorkbenchSkillCardApi
  /**
   * Read the session a run should hang off.
   *
   * A callback rather than a value: the read happens when the card asks, which is
   * the freshest point and finds a session opened after the card rendered. The
   * `useSessions` hook belongs to `ui-session`'s standard props, which this
   * package cannot type without depending on that plugin's client entry.
   * @returns the session id, or undefined when none qualifies.
   */
  readonly runSessionId: () => string | undefined
  /**
   * Open one of this card's full-panel views in the whole display column.
   * @param cardId - the card to show.
   * @param view - which of its two views.
   */
  readonly openCard: (cardId: string, view: 'result' | 'config') => void
}

/** Composed props of the skill card entry. */
export type SkillCardProps =
  PropsRuntime<'workbench.cards'>
  & PropsRenderFactories
  & InjectFace<SkillCardFace>
  & {
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey) => string
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
  // runs, and the way into its configuration. The result and the configuration each
  // take the whole display column, so neither is rendered inside a grid cell.
  const actionsSlot = useMemo(
    () => () => (
      <div className={css.cardActions}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { openCard(cardId, 'config') }}
        >
          {t('skillCardSettings')}
        </Button>
      </div>
    ),
    [cardId, openCard, t],
  )

  return renderFactorySlot('workbench.card', {
    id: cardId,
    title: cardFaceTitle({ cardId, name: view.name }, t),
    ...view.skill === undefined ? {} : { subtitle: view.skill },
    ...view.problem === undefined ? {} : { failure: t(problemKey(view.problem.code)) },
    onActivate: () => { openCard(cardId, 'result') },
    // The card owns the removal, and the panel owns the list it renders from, so the
    // panel is told once the Host has committed.
    onRemove: () => { void actions.remove().then(onCardsChanged) },
    reorderable: reorder?.reorderable ?? false,
    position: Math.max(1, visibleIds.indexOf(cardId) + 1),
    total: Math.max(1, visibleIds.length),
  }, { slots: { actions: actionsSlot } })
}

/** Props of the card body. */
export interface SkillCardBodyProps {
  /** What the card currently shows. */
  readonly view: WorkbenchCardView
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
export function SkillCardBody({ view, t, onAction }: SkillCardBodyProps): ReactNode {
  return <div className={css.body}>{cardContent(view, t, onAction)}</div>
}

/**
 * Render whichever content the card currently has.
 * @param view - the card view.
 * @param t - translator.
 * @param onAction - click outlet for buttons the document carries.
 * @returns the content element.
 */
function cardContent(
  view: WorkbenchCardView,
  t: (key: WorkbenchLocaleKey) => string,
  onAction: ((event: WorkbenchActionEvent) => void) | undefined,
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
  if (view.run?.phase === 'running' && view.refining !== true) {
    return <Notice title={t('runStatusRunning')} body={t('skillCardRunningBody')} />
  }
  if (view.result === undefined) {
    return <Notice title={t('skillCardNotRunTitle')} body={t('skillCardNotRunBody')} />
  }
  const filled = resultHtml(view.result.structured)
  if (filled === undefined) {
    // A result stored before the region language existed carries named values instead
    // of HTML. It cannot be shown, so the card reads as not run rather than as empty.
    return <Notice title={t('skillCardNotRunTitle')} body={t('skillCardNotRunBody')} />
  }
  // The template's skeleton stays exactly as written; only its region came from the run.
  return (
    <ShadowHtml
      html={filledTemplate(view.template, filled)}
      className={css.template}
      onAction={onAction}
    />
  )
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
  // A harness without the activation seam: the one failure that is about the deployment
  // rather than about this card, and the only one whose copy names a version to install.
  'run-unavailable': 'skillCardProblemRunUnavailable',
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
