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
import { useSkillCard } from './controller.ts'
import type { WorkbenchCardProblem, WorkbenchCardView } from './controller.ts'
import type { WorkbenchSkillCardApi } from './api.ts'
import css from './skill-card.module.css'

/** Identity of the one skill card. */
export const SKILL_CARD_ID = 'skill-card'

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
  const { view, actions } = useSkillCard({ api, cardId, sessionId: runSessionId() })

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
    // Only the default card may fall back to the type's name: a nameless extra
    // instance would otherwise be indistinguishable from it on the grid.
    title: view.name ?? (cardId === SKILL_CARD_ID ? t('skillCardTitle') : cardId),
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
}

/**
 * Render the card's content.
 * @param props - the view and `t`.
 * @returns the body element.
 */
export function SkillCardBody({ view, t }: SkillCardBodyProps): ReactNode {
  return (
    <div className={css.body}>
      {cardContent(view, t)}
      {/* Every run inherits the session's full tool permissions, and the skill it
          executes is disk content. The user has to see that before pressing Run. */}
      <p className={css.permission}>{t('skillCardPermission')}</p>
    </div>
  )
}

/**
 * Render whichever content the card currently has.
 * @param view - the card view.
 * @param t - translator.
 * @returns the content element.
 */
function cardContent(
  view: WorkbenchCardView,
  t: (key: WorkbenchLocaleKey) => string,
): ReactNode {
  if (view.status === 'loading') {
    return <Notice title={t('skillCardLoading')} body={t('skillCardLoadingBody')} />
  }
  if (view.template === undefined) {
    return <Notice title={t('skillCardNoTemplateTitle')} body={t('skillCardNoTemplateBody')} />
  }
  if (view.run?.phase === 'running') {
    // A run in flight is a state of its own. Without this the page looked exactly
    // the same before and during a run, which is what made pressing Run look inert.
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
  return <ShadowHtml html={filledTemplate(view.template, filled)} className={css.template} />
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
  'schema-rejected': 'skillCardProblemContract',
  'template-invalid': 'skillCardProblemTemplateInvalid',
  'run-in-progress': 'skillCardProblemRunning',
  'run-failed': 'skillCardProblemRunFailed',
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
