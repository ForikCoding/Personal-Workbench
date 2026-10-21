/**
 * The workbench panel page: its head, the card grid, and the two empty states.
 *
 * The page owns the layout controller and hands the grid plain data, so the
 * grid stays a rendering surface and the card shells stay independent of it.
 * @module dsh-workbench/client/WorkbenchPage
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { type ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { WorkbenchCardGrid } from './WorkbenchCardGrid.tsx'
import { useWorkbenchLayout } from './layout-controller.ts'
import type { WorkbenchLayoutApi } from './layout-api.ts'
import type { WorkbenchCardFact } from './layout-store.ts'
import type { WorkbenchCardSelection, WorkbenchCardsOwnerProps } from './contract.ts'
import type { WorkbenchSkillCardApi } from './skill-card/api.ts'
import type { WorkbenchCardSnapshot } from './skill-card/api.ts'
import type { WorkbenchModelSeat } from './skill-card/model.ts'
import type { WorkbenchWorkspacePicker } from './skill-card/workspace-picker.ts'
import { SKILL_CARD_ID } from './skill-card/SkillCard.tsx'
import { WorkbenchCreateCard } from './WorkbenchCreateCard.tsx'
import type { WorkbenchCardType } from './WorkbenchCreateCard.tsx'
import { SkillCardConfigPage, SkillCardResultPage } from './skill-card/SkillCardPages.tsx'
import type { WorkbenchLocaleKey } from './locales.ts'
import css from './workbench.module.css'

/** Cards plus the transport the page drives, as the registration injects them. */
export interface WorkbenchPageInjected {
  /** Card facts and the full-panel selection. */
  readonly hooks: {
    readonly cards: ObservableSnapshot<readonly WorkbenchCardFact[]>
    readonly selection: ObservableSnapshot<WorkbenchCardSelection | undefined>
  }
  /** Layout transport. */
  readonly api: WorkbenchLayoutApi
  /** Skill card transport, for the full-panel views the grid opens into. */
  readonly skillCards: {
    readonly api: WorkbenchSkillCardApi
    /**
     * Resolve the session a run hangs off.
     * @returns the session id, or undefined when none is available.
     */
    readonly runSessionId: () => string | undefined
    /**
     * Resolve the session the application's own model picker is attached to.
     *
     * Omitted is read as "the run session is the only session this host can name", which
     * is what a host without a session list can answer.
     * @returns the session id, or undefined while none is held.
     */
    readonly pickerSessionId?: () => string | undefined
    /** Model catalog the result and configuration pages read. */
    readonly models: WorkbenchModelSeat
    /** Directory picker the configuration page offers for the card's workspace. */
    readonly workspacePicker: WorkbenchWorkspacePicker
  }
  /** Return to the grid from whichever full-panel view is open. */
  readonly closeCard: () => void
  /**
   * Open one of a card's full-panel views.
   *
   * A card action whose target is a card starts that card's run and then shows it,
   * which is a navigation across cards rather than within one.
   */
  readonly openCard: (cardId: string, view: WorkbenchCardSelection['view']) => void
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

/**
 * Card types the workbench offers.
 *
 * Only the skill card creates anything today; the other two are listed so the user
 * can see they are planned rather than absent.
 */
const CARD_TYPE_SKILL = 'skill'
const CARD_TYPE_TEST = 'test'
const CARD_TYPE_MEMORY = 'memory'

/** One stored card, as the page needs it to lay a grid out. */
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
 * @param props - owner props, card render share, injected cards and transport, and `t`.
 * @returns the page element.
 */
export function WorkbenchPage(props: WorkbenchPageProps): ReactNode {
  const { useCards, useSelection, api, skillCards, closeCard, openCard, renderSlot, t, usePanelInfo } = props
  const cards = useCards(snapshot => snapshot)
  const selection = useSelection(snapshot => snapshot)
  const active = usePanelInfo(info => info.activePanelId === 'workbench')
  // User-created card instances are stored data, not slot registrations: the ledger
  // says which card TYPES exist, and the stored records say which instances of them
  // the user made. Only the extra instances are collected here; a stored record for
  // a registered card is that card, already in `cards`.
  const [stored, setStored] = useState<readonly WorkbenchStoredCard[]>([])
  const [revision, setRevision] = useState('')
  // A read that lands after a write would republish the older snapshot and the new
  // card would vanish. Every application of state takes a ticket, and a read only
  // applies while it still holds the newest one.
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
    // Only the stored cards are cards. The registered skill card is a renderer for
    // that type, not a card of its own: leaving it in would keep a deleted card on
    // the grid with nothing behind it, and removing the last card would still show
    // one.
    const registered = cards.filter(card => card.id !== SKILL_CARD_ID)
    // Ordered after every registered card: an instance has no declared order, and
    // the layout store's own positions take over once the user moves it.
    const extra = stored.map((instance, index) => ({
      id: instance.id,
      order: INSTANCE_ORDER_BASE + index,
      label: instance.name ?? instance.id,
    }))
    return [...registered, ...extra]
  }, [cards, stored])

  const createCard = useCallback((type: string) => {
    if (type !== CARD_TYPE_SKILL) return
    // The id only has to be unique and stable. The name is a starting point the user
    // renames on the card's own configuration page, so this entry stays one decision.
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
      // The write answers with the state it committed, so the new card appears
      // without a second read.
      applySnapshot(result.snapshot)
    })
  }, [applySnapshot, facts, revision, skillCards.api, t])

  const cardTypes = useMemo<readonly WorkbenchCardType[]>(() => [
    { id: CARD_TYPE_SKILL, label: t('cardTypeSkill'), enabled: true },
    { id: CARD_TYPE_TEST, label: t('cardTypeTest'), enabled: false },
    { id: CARD_TYPE_MEMORY, label: t('cardTypeMemory'), enabled: false },
  ], [t])
  const { view, actions } = useWorkbenchLayout(facts, api, active)
  const labelOf = useMemo(() => {
    const labels = new Map(facts.map(card => [card.id, card.label]))
    return (id: string): string => {
      const label = labels.get(id)
      return label === undefined || label.length === 0 ? id : label
    }
  }, [facts])

  const notice = view.write.phase === 'failed'
    ? `${t('writeFailed')}${view.write.message === undefined ? '' : ` · ${view.write.message === 'merged' ? t('mergedElsewhere') : view.write.message}`}`
    : undefined

  // A user-created instance is not its own slot entry: the registered skill card
  // entry renders it, told which instance it is rendering.
  const registered = useMemo(() => new Set(cards.map(card => card.id)), [cards])
  const renderEntry = (id: string, owner: WorkbenchCardsOwnerProps): ReactNode =>
    registered.has(id)
      ? renderSlot('workbench.cards', owner, { only: id })
      : renderSlot('workbench.cards', { ...owner, cardId: id }, { only: SKILL_CARD_ID })

  // The panel is one surface with three states: the grid, a card's result, and a
  // card's configuration. A card opens one of the last two through the injected
  // opener, so the card and the page never share a React tree.
  const content = selection === undefined
    ? (
      // The grid always renders. The creation entry lives in it, so an empty card
      // list is the normal first-run state: replacing the grid with an empty state
      // took the only way to create the first card with it.
      <WorkbenchCardGrid
        view={view}
        actions={actions}
        renderEntry={renderEntry}
        announce={(id, index) => t('announceMoved', { title: labelOf(id), index })}
        notice={notice}
        onCardsChanged={reloadInstances}
        trailing={(
          <WorkbenchCreateCard
            types={cardTypes}
            onCreate={createCard}
            label={t('createCard')}
            unavailableLabel={t('createCardCancel')}
          />
        )}
      />
    )
    : (() => {
      const page = {
        api: skillCards.api,
        cardId: selection.cardId,
        runSessionId: skillCards.runSessionId,
        ...skillCards.pickerSessionId === undefined ? {} : { pickerSessionId: skillCards.pickerSessionId },
        models: skillCards.models,
        workspacePicker: skillCards.workspacePicker,
        fallbackTitle: labelOf(selection.cardId),
        onBack: closeCard,
        openCard,
        t,
      }
      return selection.view === 'result'
        ? <SkillCardResultPage {...page} />
        : <SkillCardConfigPage {...page} />
    })()

  return (
    <div className={css.page}>
      {/* Every view of the workbench carries the workbench's own title, including the
          card pages: they are views of this panel, not separate destinations, and the
          card's own head (back control, name) sits below it. Without it a card page
          started flush at the top edge and read as a different place. */}
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
