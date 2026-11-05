/**
 * The workbench panel page: its head, and the pipeline workbench below it.
 *
 * The panel is one surface with two states. Normally it is the pipeline workbench — the
 * rail, the canvas and the inspector. When something outside the panel opens a card's own
 * view (a card action whose target is another card), that view takes the whole surface and
 * the workbench stands behind it, which is what the injected `selection` says.
 * @module dsh-workbench/client/WorkbenchPage
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { usePipelines } from './pipeline-controller.ts'
import { usePipelineRun } from './pipeline/pipeline-run.ts'
import { WorkbenchPipeline } from './WorkbenchPipeline.tsx'
import type { WorkbenchPipelineApi } from './pipeline-api.ts'
import type { WorkbenchCardFact } from './layout-store.ts'
import type { WorkbenchCardSelection } from './contract.ts'
import type { WorkbenchSkillCardApi } from './skill-card/api.ts'
import type { WorkbenchCardSnapshot } from './skill-card/api.ts'
import type { WorkbenchModelSeat } from './skill-card/model.ts'
import type { WorkbenchWorkspacePicker } from './skill-card/workspace-picker.ts'
import type { WorkbenchScriptBinder } from './skill-card/render.ts'
import { SKILL_CARD_ID } from './skill-card/SkillCard.tsx'
import { SkillCardConfigPage, SkillCardResultPage, SkillCardRunsPage } from './skill-card/SkillCardPages.tsx'
import type { WorkbenchLocaleKey } from './locales.ts'
import css from './workbench.module.css'

/** Cards plus the transports the page drives, as the registration injects them. */
export interface WorkbenchPageInjected {
  /** Card facts and the full-panel selection. */
  readonly hooks: {
    readonly cards: ObservableSnapshot<readonly WorkbenchCardFact[]>
    readonly selection: ObservableSnapshot<WorkbenchCardSelection | undefined>
  }
  /** Pipeline-definition transport. */
  readonly pipelines: WorkbenchPipelineApi
  /** Skill card transport, for the card views the inspector mounts. */
  readonly skillCards: {
    readonly api: WorkbenchSkillCardApi
    /**
     * Resolve the session the card reads the installed skills through.
     *
     * Not the session a run executes in: a run is given one of its own.
     * @returns the session id, or undefined when none is available.
     */
    readonly runSessionId: () => string | undefined
    /**
     * Resolve the session the application's own model picker is attached to.
     *
     * Omitted is read as "this page's own session is the only one this host can name",
     * which is what a host without a session list can answer.
     * @returns the session id, or undefined while none is held.
     */
    readonly pickerSessionId?: () => string | undefined
    /** Model catalog the result and configuration pages read. */
    readonly models: WorkbenchModelSeat
    /** Directory picker the configuration page offers for the card's workspace. */
    readonly workspacePicker: WorkbenchWorkspacePicker
    /**
     * Binding the rendered document's own script receives.
     *
     * Omitted is read as "the document runs on its own", which is what a host without the
     * document route can offer: the template's script still runs, and a read it asks for
     * finds no card behind it.
     */
    readonly documents?: WorkbenchScriptBinder | undefined
  }
  /** Leave a card's full-panel view and return to the workbench. */
  readonly closeCard: () => void
  /**
   * Open one of a card's full-panel views.
   *
   * A card action whose target is a card starts that card's run and then shows it,
   * which is a navigation across cards rather than within one. `runId` names the
   * run a result view opens; omitted resolves to the card's latest run.
   */
  readonly openCard: (cardId: string, view: WorkbenchCardSelection['view'], runId?: string) => void
}

/** Composed props of the workbench page. */
export type WorkbenchPageProps =
  PropsRuntime<'main'>
  & PropsRenderSlots<'workbench.cards'>
  & InjectFace<WorkbenchPageInjected>
  & {
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  }

/** Owner where a user-created card instance sorts before any stored position. */
const INSTANCE_ORDER_BASE = 10_000

/** One stored card, as the page needs it to lay the rail out. */
interface WorkbenchStoredCard {
  readonly id: string
  readonly name: string | undefined
}

/**
 * Read the cards out of a stored snapshot.
 * @param cards - the snapshot's card records.
 * @returns one entry per stored card.
 */
function storedCardsFrom(cards: readonly { readonly cardId: string; readonly name?: string }[]): readonly WorkbenchStoredCard[] {
  return cards.map(card => ({ id: card.cardId, name: card.name }))
}

/**
 * Render the workbench page.
 * @param props - owner props, injected cards and transports, and `t`.
 * @returns the page element.
 */
export function WorkbenchPage(props: WorkbenchPageProps): ReactNode {
  const { useCards, useSelection, skillCards, pipelines: pipelineApi, closeCard, openCard, t } = props
  const cards = useCards(snapshot => snapshot)
  const selection = useSelection(snapshot => snapshot)
  // User-created card instances are stored data, not slot registrations: the ledger says
  // which card TYPES exist, and the stored records say which instances of them the user
  // made. Only the extra instances are collected here; a stored record for a registered
  // card is that card, already in `cards`.
  const [stored, setStored] = useState<readonly WorkbenchStoredCard[]>([])
  const [revision, setRevision] = useState('')
  // A read that lands after a write would republish the older snapshot and the new card
  // would vanish. Every application of state takes a ticket, and a read only applies
  // while it still holds the newest one.
  const tickets = useRef(0)
  const applySnapshot = useCallback((snapshot: WorkbenchCardSnapshot) => {
    tickets.current += 1
    setRevision(snapshot.revision)
    setStored(storedCardsFrom(snapshot.cards))
  }, [])
  const reloadInstances = useCallback(() => {
    tickets.current += 1
    const mine = tickets.current
    void skillCards.api.read().then((result) => {
      if (result.status !== 'ok' || tickets.current !== mine) return
      applySnapshot(result.snapshot)
    })
  }, [applySnapshot, skillCards.api])
  useEffect(() => { reloadInstances() }, [reloadInstances, selection])
  const facts = useMemo<readonly WorkbenchCardFact[]>(() => {
    // Only the stored cards are cards. The registered skill card is a renderer for that
    // type, not a card of its own: leaving it in would keep a deleted card in the rail
    // with nothing behind it, and removing the last card would still show one.
    const registered = cards.filter(card => card.id !== SKILL_CARD_ID)
    // Ordered after every registered card: an instance has no declared order.
    const extra = stored.map((instance, index) => ({
      id: instance.id,
      order: INSTANCE_ORDER_BASE + index,
      label: instance.name ?? instance.id,
    }))
    return [...registered, ...extra]
  }, [cards, stored])

  const labelOf = useMemo(() => {
    const labels = new Map(facts.map(card => [card.id, card.label]))
    return (id: string): string => {
      const label = labels.get(id)
      return label === undefined || label.length === 0 ? id : label
    }
  }, [facts])

  const createCard = useCallback(() => {
    // The id only has to be unique and stable. The name is a starting point the user
    // renames on the card's own configuration view, so this entry stays one decision.
    const taken = new Set(facts.map(card => card.id))
    let index = 1
    while (taken.has(`${SKILL_CARD_ID}-${String(index)}`)) index += 1
    const cardId = `${SKILL_CARD_ID}-${String(index)}`
    void skillCards.api.write({
      baseRevision: revision,
      cardId,
      name: `${t('cardTypeSkill')} ${String(index)}`,
    }).then((result) => {
      if (result.status !== 'ok') return
      // The write answers with the state it committed, so the new card appears without
      // a second read.
      applySnapshot(result.snapshot)
    })
  }, [applySnapshot, facts, revision, skillCards.api, t])

  const pipelines = usePipelines(pipelineApi)
  const run = usePipelineRun({ api: skillCards.api, scopeSessionId: skillCards.runSessionId })

  const renderCard = useCallback((cardId: string, view: 'config' | 'runs' | 'result', onBack: () => void): ReactNode => {
    // The inspector's three tabs are the card's own views, mounted rather than
    // reimplemented: the result view keeps its preview, its source and its 重新生成, and
    // the Setup view keeps the template editor. `onBack` is the inspector's own
    // "return to the activity tab", so a view that offers a back control lands on the
    // step's run history rather than leaving the panel.
    const page = {
      api: skillCards.api,
      cardId,
      runSessionId: skillCards.runSessionId,
      ...skillCards.pickerSessionId === undefined ? {} : { pickerSessionId: skillCards.pickerSessionId },
      models: skillCards.models,
      workspacePicker: skillCards.workspacePicker,
      fallbackTitle: labelOf(cardId),
      openCard,
      t,
      ...skillCards.documents === undefined ? {} : { documents: skillCards.documents },
      onBack,
    }
    if (view === 'result') return <SkillCardResultPage {...page} />
    if (view === 'runs') return <SkillCardRunsPage {...page} />
    return <SkillCardConfigPage {...page} />
  }, [labelOf, openCard, skillCards, t])

  // A card action that targets another card still takes the whole surface: it is a
  // navigation, and the workbench behind it must not keep stealing the click.
  const content = selection === undefined
    ? (
      <WorkbenchPipeline
        pipelines={pipelines}
        run={run}
        facts={facts}
        renderCard={renderCard}
        onCreateCard={createCard}
        t={t}
      />
    )
    : (() => {
      const page = {
        api: skillCards.api,
        cardId: selection.cardId,
        ...selection.runId === undefined ? {} : { runId: selection.runId },
        runSessionId: skillCards.runSessionId,
        ...skillCards.pickerSessionId === undefined ? {} : { pickerSessionId: skillCards.pickerSessionId },
        models: skillCards.models,
        workspacePicker: skillCards.workspacePicker,
        fallbackTitle: labelOf(selection.cardId),
        openCard,
        t,
        ...skillCards.documents === undefined ? {} : { documents: skillCards.documents },
        onBack: selection.view === 'result'
          ? () => openCard(selection.cardId, 'runs')
          : closeCard,
      }
      if (selection.view === 'result') return <SkillCardResultPage {...page} />
      if (selection.view === 'runs') return <SkillCardRunsPage {...page} />
      return <SkillCardConfigPage {...page} />
    })()

  return (
    <div className={selection === undefined ? `${css.page} ${css.pagePipeline}` : css.page}>
      {/* Every view of the workbench carries the workbench's own title, including the
          card pages: they are views of this panel, not separate destinations, and the
          card's own head sits below it. */}
      <header className={css.pageHead}>
        <div>
          <h1 className={css.pageTitle}>{t('title')}</h1>
          <p className={css.pageIntro}>{t('subtitle')}</p>
        </div>
      </header>
      {content}
    </div>
  )
}
