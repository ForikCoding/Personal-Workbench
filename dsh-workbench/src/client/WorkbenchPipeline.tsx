/**
 * 流水线工作台：左边是这条流水线本身，右边是选中的这一步。
 *
 * 结构与 `docs/prototypes/workbench-pipeline-v2.html` 一一对应：面板头 → 两栏（画布 + 检查器）
 * → 运行条，四个弹层（阅读器 / 运行记录 / 审核 / 选择器）都是面板内的覆盖层，不另开窗口。
 * 样式逐条取自原型，只把原型的固定色板换成 DSH 令牌，于是插件跟 DSH 一起换肤。
 *
 * 步骤的“是什么”全在它自己的卡片里（模板、技能、模型、工作目录），流水线只记住顺序，
 * 所以这里从不编辑卡片的模板：要改就进卡片自己的页面。
 * @module dsh-workbench/client/WorkbenchPipeline
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import './pipeline.css'
import css from './pipeline-classes.ts'
import type { WorkbenchPipelinesFace } from './pipeline-controller.ts'
import type { PipelineRunFace, PipelineStepPhase } from './pipeline/pipeline-run.ts'
import type { PipelineRunEntry, StepProduct } from './pipeline/pipeline-view.ts'
import { formatDuration, formatWhen, productOf, stateView } from './pipeline/pipeline-view.ts'
import type { WorkbenchCardFact } from './layout-store.ts'
import type { WorkbenchPipeline, WorkbenchPipelineStep } from '../pipeline-contract.ts'
import type { WorkbenchSkillCatalogEntry } from '../skill-card-contract.ts'
import type { WorkbenchCatalogStatus } from './skill-card/controller.ts'
import type {
  WorkbenchCardConfigView,
  WorkbenchCardResult,
  WorkbenchSkillCardApi,
} from './skill-card/api.ts'
import { permissionLabelKey } from './skill-card/permission.ts'
import { resultHtml } from './skill-card/render.ts'
import type { WorkbenchLocaleKey } from './locales.ts'
import { modelKey, parseModelKey, type WorkbenchModelGroup } from './skill-card/model.ts'
import { WORKBENCH_REGION_BEGIN, WORKBENCH_REGION_END } from '../skill-card-contract.ts'
import type { WorkbenchCardModel, WorkbenchCardWorkspace, WorkbenchSandboxMode } from '../skill-card-contract.ts'
import type { WorkbenchWorkspacePicker } from './skill-card/workspace-picker.ts'

/** One card's full-panel views the reader can mount. */
type CardView = 'config' | 'runs' | 'result'

/** Which inspector tab is showing. */
type InspectorTab = 'activity' | 'config' | 'result'

/** What the inspector is looking at. */
type Focus = { readonly kind: 'step'; readonly index: number } | { readonly kind: 'card'; readonly cardId: string }

/** Props of the pipeline workbench. */
export interface WorkbenchPipelineProps {
  /** Stored pipelines and the mutations the menu offers. */
  readonly pipelines: WorkbenchPipelinesFace
  /** The run engine the canvas drives. */
  readonly run: PipelineRunFace
  /** Cards the workbench knows about, as the menu lists them. */
  readonly facts: readonly WorkbenchCardFact[]
  /** Transport, so a step's stored result is read here rather than threaded through the page. */
  readonly api: WorkbenchSkillCardApi
  /**
   * Mount one card's own view.
   * @param cardId - the card to show.
   * @param view - which of its views.
   * @param onBack - what its back control returns to.
   * @returns the view.
   */
  readonly renderCard: (cardId: string, view: CardView, onBack: () => void) => ReactNode
  /** Create a new single card, from the menu's own entry. */
  readonly onCreateCard: () => void
  /**
   * Installed skills the add-step picker offers.
   *
   * A step is a skill bound to a card, so the picker lists the skills this session can
   * actually invoke rather than the cards already made: picking one is what makes a step.
   */
  readonly catalog: readonly WorkbenchSkillCatalogEntry[]
  /** Whether that catalogue has been read yet. */
  readonly catalogStatus: WorkbenchCatalogStatus
  /** Why the catalogue could not be read, when it could not; `session-not-live` is its own case. */
  readonly catalogFailure: string | undefined
  /** Ask for the catalogue again, which a picker that is about to open its list does. */
  readonly onCatalogNeeded: () => void
  /**
   * Create the card one skill runs as.
   * @param skill - the skill to bind the new card to.
   * @returns the new card's id, or undefined when the card could not be created.
   */
  readonly createCardForSkill: (skill: string) => Promise<string | undefined>
  /**
   * Rename the card one step runs as, which is the name the step shows.
   * @param cardId - the step's card.
   * @param name - the new name; the caller ignores an empty or unchanged one.
   */
  readonly renameStepCard: (cardId: string, name: string) => void
  /**
   * Write one field into every step's card, one card at a time.
   *
   * The cards are written in order and each write carries the revision the previous one
   * produced, so "change once, every step follows" cannot tear halfway through on a
   * conflict.
   * @param cardIds - the cards to write, in step order.
   * @param patch - the fields to set; `null` clears a field.
   */
  readonly patchStepCards: (cardIds: readonly string[], patch: StepCardPatch) => Promise<boolean>
  /** Open one card's own page, which is where its template is written. */
  readonly openCardPage: (cardId: string) => void
  /** Provider groups the model row offers; empty means the directory answered nothing. */
  readonly modelGroups: readonly WorkbenchModelGroup[]
  /**
   * The platform's directory chooser; absent means this page has no picker at all.
   *
   * A path is never typed here: a text field would let a step name a directory no chooser
   * ever confirmed, which is the decision this product already made once.
   */
  readonly workspacePicker: WorkbenchWorkspacePicker | undefined
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
}

/** How long a delete confirmation stays armed. */
const CONFIRM_MS = 4_000

/** Fields the pipeline may set on every step's card at once. */
export interface StepCardPatch {
  /** Model the cards run on; `null` clears it back to following the session. */
  readonly model?: WorkbenchCardModel | null
  /** Permission mode the cards' runs use. */
  readonly permission?: WorkbenchSandboxMode
  /** Directory the cards run in; `null` clears it. */
  readonly workspace?: WorkbenchCardWorkspace | null
  /** Skill the cards run; `null` clears it. */
  readonly skill?: string | null
  /** Instruction the cards' runs are given; `null` clears it. */
  readonly instruction?: string | null
}


/**
 * The two comments a template marks its region with, taken from the contract so a renamed
 * marker cannot leave this view highlighting text that no longer means anything.
 */
const REGION_MARKER = new RegExp(`(<!--\\s*(?:${WORKBENCH_REGION_BEGIN}|${WORKBENCH_REGION_END})\\s*-->)`)

/**
 * Render template source with the region markers called out.
 * @param source - the template as stored.
 * @returns the text with each marker wrapped for emphasis.
 */
function regionMarked(source: string): ReactNode {
  return (
    <>
      {source.split(REGION_MARKER).map((part, index) => (
        index % 2 === 1
          ? <span key={index} className={css.mk}>{part}</span>
          : part
      ))}
    </>
  )
}

/** The permission modes in the order the row offers them: ordinary first, broad last. */
const PERMISSION_ORDER: readonly WorkbenchSandboxMode[] = ['workspace-write', 'read-only', 'danger-full-access']

/** One step as the canvas and the inspector draw it. */
interface StepView {
  readonly index: number
  readonly cardId: string
  readonly label: string
  readonly skill: string | undefined
  readonly phase: PipelineStepPhase
  readonly tookMs: number | undefined
  readonly failure: string | undefined
  readonly product: StepProduct
  readonly html: string | undefined
  readonly card: WorkbenchCardConfigView | undefined
  readonly result: WorkbenchCardResult | undefined
  /** Which run of this pipeline last produced the step's product, when one is known. */
  readonly runNo: number | undefined
}

/**
 * Render the pipeline workbench.
 * @param props - stored pipelines, run engine, cards, transport, card views, and `t`.
 * @returns the two-column surface with its overlays.
 */
export function WorkbenchPipeline(props: WorkbenchPipelineProps): ReactNode {
  const {
    pipelines, run, facts, api, renderCard, onCreateCard, t,
    catalog, catalogStatus, catalogFailure, onCatalogNeeded, createCardForSkill, renameStepCard,
    patchStepCards, modelGroups, workspacePicker, openCardPage,
  } = props
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [focus, setFocus] = useState<Focus | undefined>(undefined)
  const [tab, setTab] = useState<InspectorTab>('activity')
  const [cards, setCards] = useState<readonly WorkbenchCardConfigView[]>([])
  const [results, setResults] = useState<readonly WorkbenchCardResult[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [stepMenu, setStepMenu] = useState<number | undefined>(undefined)
  // Which step's name is being edited in place, and which remove row is armed. Both are
  // per-step, so a menu opened on another step never inherits the armed remove.
  const [stepRename, setStepRename] = useState<number | undefined>(undefined)
  const [confirmRemove, setConfirmRemove] = useState<number | undefined>(undefined)
  /** Why the last config write did not land, stated where the user made it. */
  const [configProblem, setConfigProblem] = useState<string | undefined>(undefined)
  const [confirmDelete, setConfirmDelete] = useState<string | undefined>(undefined)
  const [renaming, setRenaming] = useState<string | undefined>(undefined)
  const [picker, setPicker] = useState<{ readonly at: number } | undefined>(undefined)
  const [pickerQuery, setPickerQuery] = useState('')
  const [reader, setReader] = useState<{ readonly cardId: string } | undefined>(undefined)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyAt, setHistoryAt] = useState<number | undefined>(undefined)
  const [review, setReview] = useState<{ readonly cardId: string } | undefined>(undefined)
  const [reviewText, setReviewText] = useState('')

  const active = useMemo<WorkbenchPipeline | undefined>(() => {
    const found = pipelines.pipelines.find(pipeline => pipeline.id === activeId)
    // The first pipeline is the one on screen until the user picks another. Falling back
    // rather than rendering nothing is what makes the panel open onto work.
    return found ?? pipelines.pipelines[0]
  }, [activeId, pipelines.pipelines])

  // The page hands over the cards it can see from more than one place, so the same card can
  // arrive twice; the menu lists each one once.
  const menuFacts = useMemo<readonly WorkbenchCardFact[]>(() => {
    const seen = new Set<string>()
    return facts.filter(fact => {
      if (seen.has(fact.id)) return false
      seen.add(fact.id)
      return true
    })
  }, [facts])

  const labelOf = useCallback((cardId: string): string => {
    const fact = menuFacts.find(entry => entry.id === cardId)
    const label = fact?.label ?? ''
    return label.length === 0 ? cardId : label
  }, [menuFacts])

  /** Read the stored cards and results, which every panel reads from. */
  const reload = useCallback(async () => {
    const read = await api.read()
    if (read.status !== 'ok') return
    setCards(read.snapshot.cards)
    setResults(read.snapshot.results)
  }, [api])

  useEffect(() => { void reload() }, [reload])

  // A run that just settled is what changes a step's product, so the read is refreshed
  // once it ends rather than polled alongside it.
  const chainPhase = run.chain?.phase
  useEffect(() => {
    if (chainPhase === 'settled' || chainPhase === 'failed' || chainPhase === 'stopped') void reload()
  }, [chainPhase, reload])

  // A delete confirmation disarms itself: an armed row that stayed armed would turn a
  // later stray click into the deletion.
  useEffect(() => {
    if (confirmDelete === undefined) return
    const timer = setTimeout(() => { setConfirmDelete(undefined) }, CONFIRM_MS)
    return () => { clearTimeout(timer) }
  }, [confirmDelete])

  // An armed remove disarms itself: a row that stayed armed would turn a later stray
  // click into the removal.
  useEffect(() => {
    if (confirmRemove === undefined) return
    const timer = setTimeout(() => { setConfirmRemove(undefined) }, CONFIRM_MS)
    return () => { clearTimeout(timer) }
  }, [confirmRemove])

  // Renaming and arming are per-step and per-pipeline: switching either drops both.
  useEffect(() => {
    setStepRename(undefined)
    setConfirmRemove(undefined)
  }, [active?.id])

  // The menus close on the next click anywhere, which is what a menu has to do. The
  // dialogs close on Escape and their scrim instead.
  //
  // A pointerdown *inside* an open menu is the first half of a click on one of its rows,
  // so it must not close anything: the menu would be unmounted before the click landed and
  // every row in it — rename, delete, move step — would silently do nothing.
  useEffect(() => {
    if (!menuOpen && stepMenu === undefined) return
    const close = (event: PointerEvent): void => {
      const from = event.target
      if (from instanceof Element && from.closest('[data-title-menu], [data-step-menu]') !== null) return
      setMenuOpen(false)
      setStepMenu(undefined)
      setConfirmRemove(undefined)
    }
    document.addEventListener('pointerdown', close)
    return () => { document.removeEventListener('pointerdown', close) }
  }, [menuOpen, stepMenu])

  const anyOverlay = reader !== undefined || historyOpen || review !== undefined || picker !== undefined
  useEffect(() => {
    if (!anyOverlay) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      setReader(undefined)
      setHistoryOpen(false)
      setReview(undefined)
      setPicker(undefined)
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [anyOverlay])

  const chain = run.chain !== undefined && active !== undefined && run.chain.pipelineId === active.id
    ? run.chain
    : undefined
  const running = chain?.phase === 'running'
  const history = useMemo<readonly PipelineRunEntry[]>(
    () => (active === undefined ? [] : run.history(active.id)),
    [active, run, chainPhase],
  )

  /** One step's stored result, if the card has one. */
  const resultOf = useCallback((cardId: string): WorkbenchCardResult | undefined => (
    results.find(entry => entry.cardId === cardId)
  ), [results])

  const stepViews = useMemo<readonly StepView[]>(() => {
    if (active === undefined) return []
    return active.steps.map((step, index) => {
      const card = cards.find(entry => entry.cardId === step.cardId)
      const result = resultOf(step.cardId)
      const html = resultHtml(result?.structured)
      const chainStep = chain?.steps[index]
      // Without a chain in this panel, a step that has a stored result has run before: it
      // reads as done rather than idle, because that is what the user can see it produced.
      const phase: PipelineStepPhase = chainStep !== undefined && chainStep.phase !== 'idle'
        ? chainStep.phase
        : result === undefined ? 'idle' : 'done'
      const producing = history.find(entry => entry.steps.some(
        item => item.cardId === step.cardId && item.phase === 'done',
      ))
      return {
        index,
        cardId: step.cardId,
        label: labelOf(step.cardId),
        skill: card?.skill,
        phase,
        tookMs: chainStep?.tookMs,
        failure: chainStep?.failure ?? result?.failure,
        product: productOf(html),
        html,
        card,
        result,
        runNo: producing?.no,
      }
    })
  }, [active, cards, chain, history, labelOf, resultOf])

  const selectedIndex = focus?.kind === 'step' ? focus.index : 0
  const selected = stepViews[selectedIndex]

  // A skill already on a step is listed but not addable: the same skill twice would leave
  // the run history unable to say which step produced what.
  const usedSkills = useMemo<ReadonlySet<string>>(() => {
    const used = new Set<string>()
    for (const step of stepViews) if (step.skill !== undefined) used.add(step.skill)
    return used
  }, [stepViews])

  const pickerRows = useMemo<readonly WorkbenchSkillCatalogEntry[]>(() => {
    const query = pickerQuery.trim().toLowerCase()
    if (query === '') return catalog
    return catalog.filter(entry => (
      entry.name.toLowerCase().includes(query)
      || entry.description.toLowerCase().includes(query)
    ))
  }, [catalog, pickerQuery])

  /** What the picker says instead of rows: a catalogue on its way, one that failed, or no match. */
  const pickerEmptyText = (): string => {
    if (catalogStatus === 'idle' || catalogStatus === 'loading') return t('skillCardCatalogLoading')
    if (catalogStatus === 'failed') {
      return t(catalogFailure === 'session-not-live' ? 'skillCardNoSession' : 'skillCardCatalogFailed')
    }
    return pickerQuery.trim() === '' ? t('skillCardCatalogEmpty') : t('pipePickerEmpty')
  }

  const writeSteps = useCallback(async (steps: readonly WorkbenchPipelineStep[]) => {
    if (active === undefined) return
    await pipelines.setSteps(active.id, steps)
  }, [active, pipelines])

  const insertStep = useCallback(async (cardId: string, at: number) => {
    if (active === undefined) return
    if (active.steps.some(step => step.cardId === cardId)) return
    const next = [...active.steps]
    next.splice(at, 0, { cardId })
    setPicker(undefined)
    setPickerQuery('')
    await writeSteps(next)
    setFocus({ kind: 'step', index: at })
  }, [active, writeSteps])

  /** Open the picker at one slot, and make sure the skills it lists are the current ones. */
  const openPicker = useCallback((at: number) => {
    onCatalogNeeded()
    setPicker({ at })
    setPickerQuery('')
  }, [onCatalogNeeded])

  /**
   * Turn one picked skill into a step: the card is what carries the skill, so the card is
   * made first and the step is the new card's place in the pipeline.
   * @param skill - the picked skill.
   */
  const addSkillStep = useCallback(async (skill: string) => {
    if (picker === undefined) return
    const at = picker.at
    const cardId = await createCardForSkill(skill)
    if (cardId === undefined) return
    await insertStep(cardId, at)
  }, [createCardForSkill, insertStep, picker])

  const moveStep = useCallback(async (index: number, delta: number) => {
    if (active === undefined) return
    const target = index + delta
    if (target < 0 || target >= active.steps.length) return
    const next = [...active.steps]
    const moved = next[index]
    const displaced = next[target]
    if (moved === undefined || displaced === undefined) return
    next[index] = displaced
    next[target] = moved
    await writeSteps(next)
    setFocus({ kind: 'step', index: target })
  }, [active, writeSteps])

  const removeStep = useCallback(async (index: number) => {
    if (active === undefined) return
    const next = active.steps.filter((_step, at) => at !== index)
    await writeSteps(next)
    setFocus(next.length === 0 ? undefined : { kind: 'step', index: Math.min(index, next.length - 1) })
  }, [active, writeSteps])

  /**
   * Commit one inline step name. An empty or unchanged name is not a rename, and the
   * step's card keeps the name it had.
   * @param cardId - the step's card.
   * @param name - the typed name.
   */
  // A path is never typed here: the platform's own chooser answers, and what it returns is
  // written to every step's card. Cancelling writes nothing, so the steps keep what they had.
  const canPickWorkspace = workspacePicker !== undefined && workspacePicker.available()
  // Every config row goes through here. The write answers whether it landed, and the panel
  // re-reads the cards afterwards: the panel renders what the store holds, so a write that
  // is not followed by a read looks exactly like a write that never happened.
  const applyPatch = useCallback((patch: StepCardPatch) => {
    void patchStepCards(stepViews.map(view => view.cardId), patch).then((written) => {
      if (!written) {
        setConfigProblem(t('pipeCfgWriteFailed'))
        return
      }
      setConfigProblem(undefined)
      void reload()
    })
  }, [patchStepCards, reload, stepViews, t])

  const chooseWorkspaceForSteps = useCallback(() => {
    if (workspacePicker === undefined) return
    void workspacePicker.pick().then((picked) => {
      // Cancelling is an answer, not a failure: nothing is written and nothing is reported.
      if (picked.status === 'cancelled') return
      if (picked.status === 'unavailable') {
        setConfigProblem(t('pipeCfgPickerRefused'))
        return
      }
      applyPatch({ workspace: { path: picked.path } })
    })
  }, [applyPatch, t, workspacePicker])

  const commitStepRename = useCallback((cardId: string, name: string) => {
    setStepRename(undefined)
    const current = stepViews.find(step => step.cardId === cardId)
    if (name === '' || name === current?.label) return
    renameStepCard(cardId, name)
  }, [renameStepCard, stepViews])

  const createPipeline = useCallback(() => {
    void (async () => {
      const created = await pipelines.create(t('pipeNewPipelineName'))
      if (created !== undefined) {
        setActiveId(created)
        setFocus(undefined)
      }
    })()
  }, [pipelines, t])

  const stateText = (phase: PipelineStepPhase): string => t(`pipeStepState_${stateView(phase).key}` as WorkbenchLocaleKey)
  const markOf = (phase: PipelineStepPhase): ReactNode => MARK[stateView(phase).mark]

  const chainState: PipelineStepPhase = chain === undefined
    ? 'idle'
    : chain.phase === 'running' ? 'running'
      : chain.phase === 'failed' ? 'failed'
        : chain.phase === 'stopped' ? 'stopped' : 'done'

  const metaOf = (pipeline: WorkbenchPipeline): string => {
    const runs = run.history(pipeline.id)
    const count = pipeline.steps.length
    if (count === 0) return t('pipeMetaNoSteps')
    if (runs.length === 0) return t('pipeMetaNeverRan', { count })
    return t('pipeMetaRan', {
      no: runs[0]?.no ?? 0,
      count,
      when: formatWhen(runs[0]?.startedAt ?? Date.now(), Date.now()),
    })
  }

  const doneCount = chain === undefined ? 0 : chain.steps.filter(step => step.phase === 'done').length
  const failedAt = chain?.failureIndex

  const runNoise = (): ReactNode => {
    if (chain === undefined) {
      return <span>{active === undefined || active.steps.length === 0 ? t('pipeNoSteps') : t('pipeNotRun')}</span>
    }
    if (chain.phase === 'running') {
      return <span>{t('pipeRunningStep', { at: (chain.activeIndex ?? 0) + 1, count: active?.steps.length ?? 0 })}</span>
    }
    if (chain.phase === 'failed') {
      return <span>{t('pipeFailedAt', { done: doneCount, count: active?.steps.length ?? 0, at: (failedAt ?? doneCount) + 1 })}</span>
    }
    if (chain.phase === 'stopped') {
      return <span>{t('pipeStopped', { done: doneCount, count: active?.steps.length ?? 0 })}</span>
    }
    return <span>{t('pipeAllDone', { count: active?.steps.length ?? 0 })}</span>
  }

  const openReader = (cardId: string): void => { setReader({ cardId }) }

  return (
    <div className={`${css.root} ${css.panel}`} data-workbench-pipeline="">
      {/* 面板头：整块面板唯一的一行标题，动作靠右，和原型一样 58px */}
      <header className={css.panelHead}>
        <h1>{t('title')}</h1>
        <div className={css.headSpacer} />
        <button
          type="button"
          className={`${css.btn} ${css.ghost}`}
          data-head-new-pipeline=""
          onClick={createPipeline}
        >
          {MARK.plus}
          <span className={css.headLabel}>{t('pipeNewPipeline')}</span>
        </button>
        <button
          type="button"
          className={`${css.btn} ${css.primary}`}
          data-run-all=""
          disabled={running || active === undefined || active.steps.length === 0}
          onClick={() => { if (active !== undefined) run.runAll(active) }}
        >
          {MARK.play}
          <span className={css.headLabel}>{t('pipeRunAll')}</span>
        </button>
      </header>
      <div className={css.panelBody}>
        <section className={css.pipelineView}>
          <div className={css.panes}>
            {/* ── 画布：这条流水线长什么样，现在在干什么 ── */}
            <div className={css.canvas} data-canvas="">
              <div className={css.canvasHead}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className={css.canvasTitleRow}>
                    <span>
                      {renaming !== undefined
                        ? (
                          <RenameField
                            t={t}
                            initial={active?.name ?? ''}
                            onCommit={(name) => {
                              setRenaming(undefined)
                              if (name !== '' && name !== active?.name) void pipelines.rename(renaming, name)
                            }}
                            onCancel={() => { setRenaming(undefined) }}
                          />
                          )
                        : active === undefined
                          ? <span className={css.canvasTitleBtn}>{t('pipeColumnLabel')}</span>
                          : (
                            <button
                              type="button"
                              className={css.canvasTitleBtn}
                              data-canvas-title=""
                              aria-expanded={menuOpen}
                              aria-haspopup="menu"
                              onClick={(event) => {
                                event.stopPropagation()
                                setMenuOpen(!menuOpen)
                              }}
                            >
                              <span>{active.name}</span>
                              {MARK.chev}
                            </button>
                            )}
                    </span>
                    <span className={css.chipState} data-canvas-state={chainState}>
                      <span className={css.dot} data-s={chainState} />
                      {stateText(chainState)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={css.canvasMeta}
                    data-canvas-meta=""
                    aria-label={t('pipeHistoryTitle')}
                    disabled={active === undefined || active.steps.length === 0}
                    onClick={() => { setHistoryOpen(true); setHistoryAt(undefined) }}
                  >
                    {active === undefined ? t('pipeMetaNoPipeline') : metaOf(active)}
                  </button>
                </div>
                {menuOpen
                  ? (
                    <div className={css.canvasMenu} data-title-menu="" role="menu">
                      {pipelines.pipelines.map(pipeline => (
                        <button
                          key={pipeline.id}
                          type="button"
                          className={css.menuRow}
                          role="menuitem"
                          data-pipeline-row={pipeline.id}
                          aria-current={pipeline.id === active?.id}
                          onClick={() => { setMenuOpen(false); setActiveId(pipeline.id); setFocus(undefined) }}
                        >
                          <span className={css.menuRowMain}>{pipeline.name}</span>
                          <span className={css.menuRowTail}>{pipeline.steps.length}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className={css.menuRow}
                        role="menuitem"
                        data-new-pipeline=""
                        onClick={() => { setMenuOpen(false); createPipeline() }}
                      >
                        {MARK.plus}
                        <span className={css.menuRowMain}>{t('pipeNewPipeline')}</span>
                      </button>
                      <div className={css.menuSep} />
                      <div className={css.menuSect}>{t('pipeRailTasks')}</div>
                      {menuFacts.map(fact => (
                        <button
                          key={fact.id}
                          type="button"
                          className={css.menuRow}
                          role="menuitem"
                          data-card-row={fact.id}
                          onClick={() => { setMenuOpen(false); setFocus({ kind: 'card', cardId: fact.id }); setTab('result') }}
                        >
                          <span className={css.menuRowMain}>{fact.label}</span>
                          <span className={css.menuRun}>{MARK.play}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className={css.menuRow}
                        role="menuitem"
                        data-create-card=""
                        onClick={() => { setMenuOpen(false); onCreateCard() }}
                      >
                        {MARK.plus}
                        <span className={css.menuRowMain}>{t('pipeCreateCard')}</span>
                      </button>
                      {active === undefined
                        ? null
                        : (
                          <>
                            <div className={css.menuSep} />
                            <button
                              type="button"
                              className={css.menuRow}
                              role="menuitem"
                              onClick={() => { setMenuOpen(false); setRenaming(active.id) }}
                            >
                              <span className={css.menuRowMain}>{t('pipeRename')}</span>
                            </button>
                            <button
                              type="button"
                              className={confirmDelete === active.id ? `${css.menuRow} ${css.hError}` : css.menuRow}
                              role="menuitem"
                              data-delete-pipeline=""
                              onClick={() => {
                                if (confirmDelete !== active.id) { setConfirmDelete(active.id); return }
                                setConfirmDelete(undefined)
                                setMenuOpen(false)
                                void pipelines.remove(active.id)
                                setFocus(undefined)
                              }}
                            >
                              <span className={css.menuRowMain}>
                                {confirmDelete === active.id ? t('pipeDeleteConfirm') : t('pipeDelete')}
                              </span>
                            </button>
                          </>
                          )}
                    </div>
                    )
                  : null}
              </div>

              <div className={`${css.canvasScroll} ${css.scroll}`}>
                {active === undefined || active.steps.length === 0
                  ? (
                    // 没流水线和流水线没步骤是两件事：前者要造一条，后者要往里放第一步。
                    <div className={css.emptyFlow} data-empty-pipeline="">
                      <span className={css.emptyMark}>{MARK.plus}</span>
                      <h4>{active === undefined ? t('pipeNoPipeline') : t('pipeEmptyTitle')}</h4>
                      <p>{active === undefined ? t('pipeEmptyPipelineBody') : t('pipeEmptyBody')}</p>
                      {active === undefined
                        ? (
                          <button
                            type="button"
                            className={`${css.btn} ${css.primary}`}
                            data-new-pipeline=""
                            onClick={createPipeline}
                          >
                            {MARK.plus}
                            {t('pipeNewPipeline')}
                          </button>
                          )
                        : (
                          <button
                            type="button"
                            className={`${css.btn} ${css.primary}`}
                            data-add-step="0"
                            onClick={() => { openPicker(0) }}
                          >
                            {MARK.plus}
                            {t('pipeAddFirstStep')}
                          </button>
                          )}
                    </div>
                    )
                  : (
                    <div className={css.flow}>
                      {stepViews.map(step => (
                        <div key={`${step.cardId}-${String(step.index)}`}>
                          {step.index > 0
                            ? (
                              <div className={css.connector}>
                                <button
                                  type="button"
                                  className={css.insertBtn}
                                  data-insert-step={step.index}
                                  aria-label={t('pipeInsertHere', { at: step.index + 1 })}
                                  onClick={() => { openPicker(step.index) }}
                                >
                                  {MARK.plus}
                                </button>
                              </div>
                              )
                            : null}
                          <div
                            className={css.node}
                            data-node={step.index}
                            data-step-index={step.index}
                            data-s={step.phase}
                            role="button"
                            tabIndex={0}
                            aria-selected={step.index === selectedIndex}
                            onClick={() => {
                              setFocus({ kind: 'step', index: step.index })
                              setStepMenu(undefined)
                              setConfirmRemove(undefined)
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== 'Enter' && event.key !== ' ') return
                              event.preventDefault()
                              setFocus({ kind: 'step', index: step.index })
                              setStepMenu(undefined)
                            }}
                          >
                            <div className={css.nodeTop}>
                              <span className={css.nodeIndex}>{String(step.index + 1).padStart(2, '0')}</span>
                              {stepRename === step.index
                                ? (
                                  <RenameField
                                    className={css.nodeNameInput}
                                    t={t}
                                    label={t('pipeStepNameLabel')}
                                    initial={step.label}
                                    onCommit={(name) => { commitStepRename(step.cardId, name) }}
                                    onCancel={() => { setStepRename(undefined) }}
                                  />
                                  )
                                : <span className={css.nodeTitle}>{step.label}</span>}
                              <span className={css.nodeState}>
                                {markOf(step.phase)}
                                {stateText(step.phase)}
                              </span>
                              <span className={css.nodeDur}>
                                {step.phase === 'running' ? '…' : formatDuration(step.tookMs)}
                              </span>
                            </div>
                            <div className={css.nodeFoot} data-s={step.phase}>
                              {stepRename === step.index ? <span>{t('pipeRenameHint')}</span> : footOf(step, t)}
                              {step.runNo === undefined
                                ? null
                                : <span className={css.nodeRun} title={t('pipeRunOf', { no: step.runNo })}>{`#${String(step.runNo)}`}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className={css.connectorShort} />
                      <button
                        type="button"
                        className={css.addStep}
                        data-add-step={String(active.steps.length)}
                        onClick={() => { openPicker(active.steps.length) }}
                      >
                        {MARK.plus} {t('pipeAddStep')}
                      </button>
                    </div>
                    )}
              </div>

              {/* 窄面板时画布让位，这一条替它：每步一个可选中的小块。 */}
              <div className={css.stepStrip} role="tablist" aria-label={t('pipeTabsLabel')}>
                {stepViews.map(step => (
                  <button
                    key={`strip-${step.cardId}`}
                    type="button"
                    role="tab"
                    className={css.stepChip}
                    data-s={step.phase}
                    data-strip-step={step.index}
                    aria-selected={step.index === selectedIndex}
                    onClick={() => { setFocus({ kind: 'step', index: step.index }) }}
                  >
                    <b>{String(step.index + 1).padStart(2, '0')}</b>
                    <span className={css.dot} data-s={step.phase} />
                    {step.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── 检查器：选中这一步的结果、活动、配置 ── */}
            <aside className={css.inspector} data-inspector="">
              <div className={css.inspHead}>
                <div className={css.inspKicker} data-insp-kicker="">
                  {focus?.kind === 'card'
                    ? t('pipeCardKicker')
                    : selected === undefined
                      ? t('pipeNoStepKicker')
                      : t('pipeStepKicker', {
                        at: selected.index + 1,
                        count: active?.steps.length ?? 0,
                        name: active?.name ?? '',
                      })}
                </div>
                <div className={css.inspTitleRow}>
                  <h2 className={css.inspTitle} data-insp-title="">
                    {focus?.kind === 'card' ? labelOf(focus.cardId) : selected?.label ?? t('pipeNoStep')}
                  </h2>
                  {selected === undefined || focus?.kind === 'card'
                    ? null
                    : (
                      <>
                        <button
                          type="button"
                          className={css.runOne}
                          data-run-one=""
                          disabled={running}
                          onClick={() => { if (active !== undefined) run.runOne(active, selected.index) }}
                        >
                          {MARK.play}
                          {t('pipeRunOne')}
                        </button>
                        <button
                          type="button"
                          className={css.iconBtn}
                          aria-label={t('pipeStepMenu')}
                          aria-haspopup="menu"
                          aria-expanded={stepMenu === selectedIndex}
                          data-step-menu-btn=""
                          onClick={() => {
                            setStepMenu(stepMenu === selectedIndex ? undefined : selectedIndex)
                          }}
                        >
                          {MARK.dots}
                        </button>
                      </>
                      )}
                </div>
                {stepMenu !== undefined && stepMenu === selectedIndex && selected !== undefined
                  ? (
                    <div className={css.stepMenu} role="menu" data-step-menu="">
                      <button
                        type="button"
                        className={css.stepMenuRow}
                        role="menuitem"
                        data-move-up=""
                        disabled={selected.index === 0}
                        onClick={() => { setStepMenu(undefined); void moveStep(selected.index, -1) }}
                      >
                        {t('pipeMoveUp')}
                      </button>
                      <button
                        type="button"
                        className={css.stepMenuRow}
                        role="menuitem"
                        data-move-down=""
                        disabled={selected.index === (active?.steps.length ?? 1) - 1}
                        onClick={() => { setStepMenu(undefined); void moveStep(selected.index, 1) }}
                      >
                        {t('pipeMoveDown')}
                      </button>
                      <div className={css.stepMenuSep} />
                      <button
                        type="button"
                        className={css.stepMenuRow}
                        role="menuitem"
                        data-rename-step=""
                        onClick={() => {
                          setConfirmRemove(undefined)
                          setStepMenu(undefined)
                          setStepRename(selected.index)
                        }}
                      >
                        {t('pipeRenameStep')}
                      </button>
                      <button
                        type="button"
                        className={`${css.stepMenuRow} ${css.hError}`}
                        role="menuitem"
                        aria-label={confirmRemove === selected.index ? t('pipeRemoveStepArmed') : t('pipeRemoveStep')}
                        data-remove-step=""
                        data-armed={confirmRemove === selected.index ? '' : undefined}
                        onClick={() => {
                          // Two clicks: removing a step drops its product from the results,
                          // so the row asks once and names what it is about to remove.
                          if (confirmRemove !== selected.index) {
                            setConfirmRemove(selected.index)
                            return
                          }
                          setConfirmRemove(undefined)
                          setStepMenu(undefined)
                          void removeStep(selected.index)
                        }}
                      >
                        {confirmRemove === selected.index ? t('pipeRemoveStepArmed') : t('pipeRemoveStep')}
                      </button>
                      <div className={css.stepMenuNote}>
                        {confirmRemove === selected.index
                          ? t('pipeRemoveNoteName', { name: selected.label })
                          : t('pipeRemoveNote')}
                      </div>
                    </div>
                    )
                  : null}
                {selected === undefined
                  ? null
                  : (
                    <div className={css.inspMeta} data-insp-meta="">
                      {selected.skill === undefined ? null : <code className={css.mono}>{selected.skill}</code>}
                      {selected.card?.model === undefined
                        ? null
                        : <span>{`${selected.card.model.provider}/${selected.card.model.model}`}</span>}
                      <span className={css.chipTag} data-s={selected.phase}>
                        {markOf(selected.phase)}
                        {stateText(selected.phase)}
                      </span>
                    </div>
                    )}
                {focus?.kind === 'card'
                  ? null
                  : (
                    <div className={css.inspTabs} role="tablist" aria-label={t('pipeTabsLabel')}>
                      {(['activity', 'config', 'result'] as const).map(key => (
                        <button
                          key={key}
                          type="button"
                          role="tab"
                          className={css.inspTab}
                          data-insp-tab={key}
                          aria-selected={tab === key}
                          aria-controls={`pipe-panel-${key}`}
                          tabIndex={tab === key ? 0 : -1}
                          onClick={() => { setTab(key) }}
                        >
                          {t(TAB_KEY[key])}
                          {key === 'activity' && selected?.result !== undefined
                            ? <em>{selected.result.activity?.length ?? 0}</em>
                            : null}
                        </button>
                      ))}
                    </div>
                    )}
              </div>

              <div className={`${css.inspScroll} ${css.scroll}`}>
                {focus?.kind === 'card'
                  ? (
                    <div className={css.resultPanel} data-panel="card">
                      <div className={css.cfgBlock}>
                        <div className={css.cfgBlockHead}><span>{t('pipeCardPanel')}</span></div>
                        <p className={css.hint}>{t('pipeCardPanelNote')}</p>
                        <button
                          type="button"
                          className={`${css.btn} ${css.ghost}`}
                          data-open-card=""
                          onClick={() => { openReader(focus.cardId) }}
                        >
                          {t('pipeOpenResult')}
                        </button>
                      </div>
                    </div>
                    )
                  : selected === undefined
                    ? (
                      // 加第一步的入口只在画布上给一个：同一屏上放两个相同的按钮，
                      // 看起来像两件事。
                      <div className={css.resultPanel} data-panel="empty">
                        <div className={css.stateBlock}>
                          <h6>{t('pipeEmptyPanelTitle')}</h6>
                          <p>{t('pipeEmptyPanelBody')}</p>
                        </div>
                      </div>
                      )
                    : tab === 'activity'
                      ? (
                        <div className={css.activityPanel} id="pipe-panel-activity" role="tabpanel" data-panel="activity">
                          <ActivityPanel
                            step={selected}
                            t={t}
                            onOpenCard={() => { openReader(selected.cardId) }}
                          />
                        </div>
                        )
                      : tab === 'config'
                        ? (
                          <div className={css.configPanel} id="pipe-panel-config" role="tabpanel" data-panel="config">
                            <ConfigPanel
                              step={selected}
                              shared={stepViews[0]?.card}
                              models={modelGroups}
                              skills={catalog}
                              onPickWorkspace={workspacePicker === undefined || !canPickWorkspace
                                ? undefined
                                : () => { chooseWorkspaceForSteps() }}
                              problem={configProblem}
                              t={t}
                              onEdit={() => { openCardPage(selected.cardId) }}
                              onPatch={applyPatch}
                            />
                          </div>
                          )
                        : (
                          <div className={css.resultPanel} id="pipe-panel-result" role="tabpanel" data-panel="result">
                            <ResultPanel
                              step={selected}
                              t={t}
                              onOpen={() => { openReader(selected.cardId) }}
                              onRun={() => { if (active !== undefined) run.runOne(active, selected.index) }}
                              onReview={() => { setReview({ cardId: selected.cardId }) }}
                            />
                          </div>
                          )}
              </div>
            </aside>
          </div>

          <div className={css.runbar}>
            <div className={css.segBar}>
              {stepViews.map(step => (
                <i key={`seg-${step.cardId}`} data-s={step.phase} />
              ))}
            </div>
            <div className={css.runNoise} data-run-noise={chain?.phase ?? 'idle'}>
              {runNoise()}
            </div>
            {/* 运行在面板头，停止只在跑的时候出现：两个开关不同时在屏幕上 */}
            <div className={css.runActions}>
              {running
                ? (
                  <button type="button" className={`${css.btn} ${css.ghost}`} data-stop="" onClick={() => { run.stop() }}>
                    {t('pipeStop')}
                  </button>
                  )
                : null}
            </div>
          </div>
        </section>
      </div>

      {/* ── 阅读器：整块面板，正文只在这里读 ── */}
      {reader === undefined
        ? null
        : (
          <div className={css.zoomWrap} data-reader={reader.cardId}>
            <div className={css.zoomScrim} onClick={() => { setReader(undefined) }} />
            <div className={css.zoom} role="dialog" aria-modal="true" aria-labelledby="pipe-zoom-title">
              <div className={css.zoomHead}>
                <span className={css.zoomKicker} id="pipe-zoom-title">{t('pipeReaderTitle')}</span>
                <span className={css.zoomMeta}>{labelOf(reader.cardId)}</span>
                <span className={css.zoomHint}>{t('pipeEscHint')}</span>
                <button
                  type="button"
                  className={`${css.btn} ${css.ghost} ${css.zoomReview}`}
                  data-review-open=""
                  onClick={() => { setReview({ cardId: reader.cardId }); setReviewText('') }}
                >
                  {t('pipeReviewTitle')}
                </button>
                <button
                  type="button"
                  className={css.iconBtn}
                  aria-label={t('pipeClose')}
                  data-reader-back=""
                  onClick={() => { setReader(undefined) }}
                >
                  {MARK.x}
                </button>
              </div>
              <div className={css.zoomBody}>
                {renderCard(reader.cardId, 'result', () => { setReader(undefined) })}
              </div>
            </div>
          </div>
          )}

      {/* ── 运行记录 ── */}
      {historyOpen
        ? (
          <div className={css.zoomWrap} data-history="">
            <div className={css.zoomScrim} onClick={() => { setHistoryOpen(false) }} />
            <div className={css.zoom} role="dialog" aria-modal="true" aria-labelledby="pipe-hist-title">
              <div className={css.zoomHead}>
                {historyAt === undefined
                  ? null
                  : (
                    <button
                      type="button"
                      className={`${css.iconBtn} ${css.histBack}`}
                      aria-label={t('pipeHistoryBack')}
                      onClick={() => { setHistoryAt(undefined) }}
                    >
                      {MARK.back}
                    </button>
                    )}
                <span className={css.zoomKicker} id="pipe-hist-title" data-hist-title="">
                  {historyAt === undefined
                    ? t('pipeHistoryTitle')
                    : t('pipeHistoryRun', { no: history[historyAt]?.no ?? 0 })}
                </span>
                <span className={css.zoomMeta} data-hist-meta="">
                  {historyAt === undefined
                    ? history.length === 0 ? t('pipeHistoryEmptyMeta') : t('pipeHistoryCount', { count: history.length })
                    : (history[historyAt] === undefined
                        ? ''
                        : `${formatWhen(history[historyAt]?.startedAt ?? 0, Date.now())} · ${formatDuration(history[historyAt]?.tookMs)}`)}
                </span>
                <span className={css.zoomHint}>{t('pipeEscHint')}</span>
                <button type="button" className={css.iconBtn} aria-label={t('pipeClose')} onClick={() => { setHistoryOpen(false) }}>
                  {MARK.x}
                </button>
              </div>
              <div className={css.histBody}>
                {historyAt === undefined
                  ? history.length === 0
                    ? <div className={css.stateBlock}><p>{t('pipeHistoryEmpty')}</p></div>
                    : (
                      <div>
                        {history.map((entry, at) => (
                          <button
                            key={`hist-${String(entry.no)}`}
                            type="button"
                            className={css.histRow}
                            data-hist-run={at}
                            onClick={() => { setHistoryAt(at) }}
                          >
                            <span className={css.histNo}>{`#${String(entry.no)}`}</span>
                            <span className={css.histWhen}>{formatWhen(entry.startedAt, Date.now())}</span>
                            <span className={css.histSum}>{entry.steps.map(step => labelOf(step.cardId)).join(' → ')}</span>
                            <span className={css.histTook}>{formatDuration(entry.tookMs)}</span>
                            <span className={css.histBadge} data-s={entry.phase}>{entry.phase}</span>
                          </button>
                        ))}
                      </div>
                      )
                  : (history[historyAt]?.steps ?? []).map((step, at) => (
                    <div key={`hist-step-${String(at)}`} className={css.hStep}>
                      <button
                        type="button"
                        className={css.hStepHead}
                        data-hist-step={at}
                        onClick={() => {
                          setHistoryOpen(false)
                          openReader(step.cardId)
                        }}
                      >
                        <span className={css.hStepNo}>{String(at + 1)}</span>
                        <span className={css.hStepName}>{labelOf(step.cardId)}</span>
                        <span className={css.hStepMeta}>{productLine(step.html, t)}</span>
                        <span className={css.hStepTook}>{formatDuration(step.tookMs)}</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          )
        : null}

      {/* ── 审核：提要求 → 重新生成 ── */}
      {review === undefined
        ? null
        : (
          <div className={css.reviewWrap} data-review="">
            <div className={css.reviewScrim} onClick={() => { setReview(undefined) }} />
            <div className={css.review} role="dialog" aria-modal="true" aria-label={t('pipeReviewTitle')}>
              <div className={css.reviewHead}>
                <div className={css.reviewTitle}>
                  <span>{t('pipeReviewTitle')}</span>
                  <em>{t('pipeReviewSubtitle')}</em>
                </div>
                <div className={css.reviewWho}>{labelOf(review.cardId)}</div>
              </div>
              <div className={css.reviewBody}>
                <textarea
                  className={css.reviewArea}
                  rows={3}
                  value={reviewText}
                  data-review-text=""
                  placeholder={t('pipeReviewPlaceholder')}
                  onChange={(event) => { setReviewText(event.target.value) }}
                />
                <div className={css.reviewChips}>
                  {(['pipeChipEdges', 'pipeChipTable', 'pipeChipShorter'] as const).map(key => (
                    <button
                      key={key}
                      type="button"
                      className={css.reviewChip}
                      onClick={() => {
                        setReviewText(prev => (prev.trim() === '' ? t(key) : `${prev}，${t(key)}`))
                      }}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
                <div className={css.reviewNote}>{t('pipeReviewWarn')}</div>
              </div>
              <div className={css.reviewFoot}>
                <div className={css.spacer} />
                <button type="button" className={`${css.btn} ${css.ghost}`} onClick={() => { setReview(undefined) }}>
                  {t('pipeCancel')}
                </button>
                <button
                  type="button"
                  className={`${css.btn} ${css.primary}`}
                  data-review-submit=""
                  disabled={reviewText.trim() === ''}
                  onClick={() => {
                    const at = stepViews.findIndex(step => step.cardId === review.cardId)
                    const instruction = reviewText.trim()
                    setReview(undefined)
                    setReviewText('')
                    if (active === undefined || at < 0 || instruction === '') return
                    setReader(undefined)
                    run.refine(active, at, instruction)
                  }}
                >
                  {t('pipeRegenerate')}
                </button>
              </div>
            </div>
          </div>
          )}

      {/* ── 任务选择器 ── */}
      {picker === undefined
        ? null
        : (
          <div className={css.pickerWrap} data-picker="">
            <div className={css.pickerScrim} onClick={() => { setPicker(undefined) }} />
            <div className={css.picker} role="dialog" aria-modal="true" aria-labelledby="pipe-picker-title">
              <div className={css.pickerHead}>
                <div className={css.pickerTitle}>
                  <span id="pipe-picker-title" data-picker-title="">{t('pipePickerTitle')}</span>
                  <em>{t('pipePickerAt', { at: picker.at + 1 })}</em>
                </div>
                <label className={css.searchField}>
                  {MARK.search}
                  <input
                    type="text"
                    autoFocus
                    value={pickerQuery}
                    data-picker-search=""
                    placeholder={t('pipePickerSearch')}
                    autoComplete="off"
                    onChange={(event) => { setPickerQuery(event.target.value) }}
                  />
                </label>
              </div>
              <div className={css.pickerList}>
                {pickerRows.map(entry => {
                  const used = usedSkills.has(entry.name)
                  return (
                    <button
                      key={entry.name}
                      type="button"
                      className={css.pickerRow}
                      data-pick-skill={entry.name}
                      disabled={used}
                      onClick={() => { void addSkillStep(entry.name) }}
                    >
                      <span className={css.pickerRowMain}>
                        <span className={css.pickerRowTitle}>{entry.name}</span>
                        <span className={css.pickerRowDesc}>{entry.description}</span>
                      </span>
                      {used ? <span className={css.pickerUsed}>{t('pipePickerUsed')}</span> : MARK.plus}
                    </button>
                  )
                })}
                {pickerRows.length === 0
                  ? <p className={css.pickerEmpty}>{pickerEmptyText()}</p>
                  : null}
              </div>
            </div>
          </div>
          )}
    </div>
  )
}

/**
 * Render one step's foot line: what it produced, or why it stopped.
 * @param step - the step.
 * @param t - translator.
 * @returns the line.
 */
function footOf(step: StepView, t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string): ReactNode {
  if (step.phase === 'failed') {
    return (
      <>
        {MARK.warn}
        <span>{step.failure ?? t('pipeFailed')}</span>
      </>
    )
  }
  if (step.phase === 'queued') return <span>{t('pipeQueued', { at: step.index })}</span>
  if (step.phase === 'running') {
    return (
      <>
        <span className={css.nodeProg}><i /></span>
        <span>{t('pipeWorking')}</span>
      </>
    )
  }
  if (step.phase === 'stopped') return <span>{t('pipeStepState_stopped')}</span>
  if (step.phase === 'idle') return <span>{t('pipeNeverRan')}</span>
  if (step.product.kind === 'directory') return <span>{step.product.path}</span>
  if (step.product.kind === 'inline') return <span>{step.product.text}</span>
  return <span>{t('pipeNoProduct')}</span>
}

/**
 * Read one run step's product as a single line.
 * @param html - the step's stored region.
 * @param t - translator.
 * @returns the path for a directory product, otherwise what the region is.
 */
function productLine(html: string | undefined, t: (key: WorkbenchLocaleKey) => string): string {
  const product = productOf(html)
  if (product.kind === 'directory') return product.path
  return product.kind === 'inline' ? t('pipeInlineProduct') : t('pipeNoProduct')
}

/** The marks a state is drawn with, so colour is never the only signal. */
const MARK: Record<'slot' | 'dash' | 'clock' | 'check' | 'warn' | 'x' | 'plus' | 'play' | 'chev' | 'search' | 'dots' | 'back', ReactNode> = {
  // 方框要在 10px 上还是方框：直角、实线。虚线圆是排队中，两个状态不能共用记号。
  slot: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3.4" y="3.4" width="9.2" height="9.2" rx="1" /></svg>,
  dash: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="5.3" strokeDasharray="2.2 2.2" /></svg>,
  clock: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="5.7" /><path d="M8 4.8V8l2.2 1.4" /></svg>,
  check: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3.6 8.4 2.8 2.6 5.9-6" /></svg>,
  warn: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2.6l5.6 9.8H2.4z" /><path d="M8 6.2v3.2M8 11.2v.1" /></svg>,
  x: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" /></svg>,
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3.4v9.2M3.4 8h9.2" /></svg>,
  play: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.6 2.9c0-.5.5-.8.9-.6l7.1 4.2c.4.2.4.8 0 1l-7.1 4.2c-.4.2-.9-.1-.9-.6z" /></svg>,
  chev: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m4.4 6.4 3.6 3.4 3.6-3.4" /></svg>,
  search: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7.2" cy="7.2" r="4.4" /><path d="m10.6 10.6 2.6 2.6" /></svg>,
  dots: <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="3.4" cy="8" r="1.15" /><circle cx="8" cy="8" r="1.15" /><circle cx="12.6" cy="8" r="1.15" /></svg>,
  back: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.6 3.6 5.2 8l4.4 4.4" /></svg>,
}

/** Tab titles by tab. */
const TAB_KEY: Record<InspectorTab, WorkbenchLocaleKey> = {
  activity: 'pipeTabActivity',
  config: 'pipeTabConfig',
  result: 'pipeTabResult',
}

/** What one step's activity panel shows: what it did, in order. */
function ActivityPanel(props: {
  readonly step: StepView
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly onOpenCard: () => void
}): ReactNode {
  const { step, t, onOpenCard } = props
  const activity = step.result?.activity ?? []
  if (step.phase === 'running') {
    return (
      <div className={css.stateBlock}>
        <h6>{t('pipeActivityRunning')}</h6>
        <p>{t('pipeActivityRunningBody')}</p>
      </div>
    )
  }
  if (step.phase === 'failed') {
    return (
      <div className={css.stateBlock} data-tone="danger">
        <h6>{t('pipeActivityFailed')}</h6>
        <p>{step.failure ?? t('pipeNoProduct')}</p>
        <button type="button" className={`${css.btn} ${css.ghost}`} onClick={onOpenCard}>{t('pipeOpenRuns')}</button>
      </div>
    )
  }
  if (activity.length === 0) {
    return (
      <div className={css.stateBlock}>
        <h6>{t('pipeActivityNone')}</h6>
        <p>{t('pipeActivityNoneBody')}</p>
      </div>
    )
  }
  return (
    <div className={css.actList}>
      {activity.map((entry, at) => (
        <div key={`act-${String(at)}`} className={css.act} data-kind={entry.kind}>
          <span className={css.actIcon}>{entry.kind === 'tool' ? MARK.dash : MARK.clock}</span>
          <div className={css.actBody}>
            <div className={css.actTop}>
              <span className={css.actName}>
                {entry.kind === 'tool'
                  ? entry.tool
                  : entry.kind === 'truncated' ? t('pipeActivityTruncated') : t('pipeActivityNarration')}
              </span>
              {entry.kind === 'tool' ? <span className={css.actArg}>{entry.argument}</span> : null}
            </div>
            {entry.kind === 'tool' ? null : (
              <div className={css.actMsg}>{entry.kind === 'truncated' ? '' : entry.text}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/** What one step's config panel shows: what it is, and what its document looks like. */
function ConfigPanel(props: {
  readonly step: StepView
  readonly shared: WorkbenchCardConfigView | undefined
  /** Models the pipeline's cards may be pointed at; empty means the directory said nothing. */
  readonly models: readonly WorkbenchModelGroup[]
  /** Skills a step may run, in catalog order. */
  readonly skills: readonly WorkbenchSkillCatalogEntry[]
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly onEdit: () => void
  /** Write one field into every step's card; this is what makes one edit reach all of them. */
  readonly onPatch: (patch: StepCardPatch) => void
  /** Ask the platform for one directory; disabled when there is no chooser. */
  readonly onPickWorkspace: (() => void) | undefined
  /** Why the last write did not land; absent when it did. */
  readonly problem: string | undefined
}): ReactNode {
  const { step, shared, models, skills, t, onEdit, onPatch, onPickWorkspace, problem } = props
  const [view, setView] = useState<'preview' | 'source'>('preview')
  const template = step.card?.template
  // What "the whole pipeline" is: the first step's card. The rows that change it write
  // every step's card, which is what "change once, every step follows" promises.
  const model = shared?.model
  const permission = shared?.permission ?? 'workspace-write'
  return (
    <>
      <div className={css.cfgBlock}>
        <div className={css.cfgBlockHead}>
          <span>{t('pipeCfgPipeline')}</span>
          <em>{t('pipeCfgPipelineNote')}</em>
        </div>
        {/* A write that did not land says so here, in the block it was made in. */}
        {problem === undefined ? null : <p className={css.cfgProblem} data-cfg-problem>{problem}</p>}
        <div className={css.ruleRow}>
          <span className={css.ruleLabel}>{t('pipeCfgModel')}</span>
          <span className={css.ruleValue}>
            {models.length === 0
              ? (
                <span className={css.val}>
                  {model === undefined ? t('pipeCfgModelInherit') : `${model.provider}/${model.model}`}
                </span>
                )
              : (
                <select
                  className={css.ruleSelect}
                  data-cfg-model=""
                  aria-label={t('pipeCfgModel')}
                  value={model === undefined ? '' : modelKey(model)}
                  onChange={(event) => {
                    onPatch({ model: event.target.value === '' ? null : parseModelKey(event.target.value) ?? null })
                  }}
                >
                  <option value="">{t('pipeCfgModelInherit')}</option>
                  {models.map(group => (
                    <optgroup key={group.id} label={group.name}>
                      {group.models.map(entry => (
                        <option key={entry.id} value={modelKey({ provider: group.id, model: entry.id })}>{entry.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                )}
            {model === undefined ? <span className={css.hint}>{t('pipeCfgModelInheritNote')}</span> : null}
          </span>
        </div>
        <div className={css.ruleRow}>
          <span className={css.ruleLabel}>{t('pipeCfgPermission')}</span>
          <span className={css.ruleValue}>
            <select
              className={css.ruleSelect}
              data-cfg-permission=""
              aria-label={t('pipeCfgPermission')}
              value={permission}
              onChange={(event) => {
                const next = event.target.value
                if (next === 'read-only' || next === 'workspace-write' || next === 'danger-full-access') {
                  onPatch({ permission: next })
                }
              }}
            >
              {PERMISSION_ORDER.map(mode => (
                <option key={mode} value={mode}>{t(permissionLabelKey(mode))}</option>
              ))}
            </select>
            <span className={css.hint}>{t('pipeCfgPermissionNote')}</span>
          </span>
        </div>
        <div className={css.ruleRow}>
          <span className={css.ruleLabel}>{t('pipeCfgWorkspace')}</span>
          <span className={css.ruleValue}>
            {/* The platform's own chooser, opened from a row that shows the confirmed path.
                There is no text field: a typed path is a directory no chooser ever confirmed. */}
            <button
              type="button"
              className={css.rulePath}
              data-cfg-workspace=""
              aria-label={t('pipeCfgWorkspacePick')}
              disabled={onPickWorkspace === undefined}
              onClick={() => { onPickWorkspace?.() }}
            >
              <span className={`${css.rulePathText} ${shared?.workspace === undefined ? '' : css.mono}`}>
                {shared?.workspace?.path ?? t('pipeCfgNoWorkspace')}
              </span>
              <span className={css.rulePathPick}>{onPickWorkspace === undefined ? t('pipeCfgWorkspaceNoPicker') : t('pipeCfgWorkspacePick')}</span>
            </button>
            <span className={css.hint}>{t('pipeCfgWorkspaceNote')}</span>
          </span>
        </div>
      </div>

      <div className={css.cfgBlock}>
        <div className={css.cfgBlockHead}>
          <span>{t('pipeCfgStep')}</span>
          <em>{t('pipeCfgStepNote', { at: step.index + 1 })}</em>
        </div>
        <div className={css.ruleRow}>
          <span className={css.ruleLabel}>{t('pipeCfgSkill')}</span>
          <span className={css.ruleValue}>
            <select
              className={css.ruleSelect}
              data-cfg-skill=""
              aria-label={t('pipeCfgSkill')}
              value={shared?.skill ?? ''}
              onChange={(event) => {
                const next = event.target.value
                onPatch({ skill: next === '' ? null : next })
              }}
            >
              <option value="">{t('pipeCfgNoSkill')}</option>
              {skills.filter(entry => entry.userInvocable).map(entry => (
                <option key={entry.name} value={entry.name}>{entry.name}</option>
              ))}
            </select>
            <span className={css.hint}>{shared?.skill === undefined ? t('pipeCfgSkillNoNote') : (skills.find(entry => entry.name === shared.skill)?.description ?? t('pipeCfgSkillNoNote'))}</span>
          </span>
        </div>
        <div className={css.ruleRow}>
          <span className={css.ruleLabel}>{t('pipeCfgInstruction')}</span>
          <span className={css.ruleValue}>
            {/* A text box, because the instruction is the user's own sentence. Committed on
                blur for the same reason as the directory: a write per keystroke would rewrite
                every step's card on every letter. */}
            <textarea
              className={css.ruleArea}
              data-cfg-instruction=""
              aria-label={t('pipeCfgInstruction')}
              rows={2}
              spellCheck={false}
              defaultValue={shared?.instruction ?? ''}
              onBlur={(event) => {
                const next = event.currentTarget.value.trim()
                if (next === (shared?.instruction ?? '')) return
                onPatch({ instruction: next === '' ? null : next })
              }}
            />
            <span className={css.hint}>{t('pipeCfgInstructionNote')}</span>
          </span>
        </div>
        <div className={css.ruleRow}>
          <span className={css.ruleLabel}>{t('pipeCfgFailure')}</span>
          <span className={css.ruleValue}>
            <span className={css.val}>{t('pipeCfgFailureStop')}</span>
            <span className={css.hint}>{t('pipeCfgFailureNote')}</span>
          </span>
        </div>
      </div>

      <div className={css.cfgBlock}>
        <div className={css.cfgBlockHead}>
          <span>{t('pipeCfgTemplate')}</span>
          <span className={css.segTiny}>
            <button type="button" data-cfg-view="preview" aria-pressed={view === 'preview'} onClick={() => { setView('preview') }}>
              {t('pipeCfgPreview')}
            </button>
            <button type="button" data-cfg-view="source" aria-pressed={view === 'source'} onClick={() => { setView('source') }}>
              {t('pipeCfgSource')}
            </button>
          </span>
        </div>
        {template === undefined
          ? <p className={css.hint}>{t('pipeCfgNoTemplate')}</p>
          : view === 'preview'
            ? (
              <div>
                <div className={css.tplSlotLabel}>{t('pipeCfgPreviewNote')}</div>
                <div className={css.tplSlotBox}>
                  <span className={css.tplSlotTag}>{t('pipeCfgRegion')}</span>
                  <span className={css.tplSlotText}>{t('pipeCfgRegionBody')}</span>
                </div>
              </div>
              )
            : (
              <div>
                {/* The prototype marks the region between the two markers: it is the one part
                    the model rewrites on every run, and it is invisible inside 90 lines. */}
                <p className={css.srcNote}>{t('pipeCfgSourceNote')}</p>
                <pre className={css.docSrc} data-cfg-source="">{regionMarked(template)}</pre>
              </div>
              )}
        {/* The editor for a template is the card's own page, which is where a template is
            written; this button opens that page for this step's card. */}
        <button type="button" className={`${css.btn} ${css.ghost}`} data-edit-card="" onClick={onEdit}>
          {t('pipeCfgEdit')}
        </button>
      </div>
    </>
  )
}

/** What one step's result panel shows: what it handed over, and how to read it. */
function ResultPanel(props: {
  readonly step: StepView
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly onOpen: () => void
  readonly onRun: () => void
  readonly onReview: () => void
}): ReactNode {
  const { step, t, onOpen, onRun, onReview } = props
  if (step.phase === 'running') {
    return (
      <div className={css.stateBlock}>
        <h6>{t('pipeResultRunning')}</h6>
        <p>{t('pipeResultRunningBody')}</p>
      </div>
    )
  }
  if (step.phase === 'queued') {
    return (
      <div className={css.stateBlock}>
        <h6>{t('pipeResultQueued')}</h6>
        <p>{t('pipeResultQueuedBody', { at: step.index })}</p>
        <button type="button" className={`${css.btn} ${css.ghost}`} onClick={onRun}>{t('pipeRunThisStep')}</button>
      </div>
    )
  }
  if (step.phase === 'failed') {
    return (
      <div className={css.stateBlock} data-tone="danger">
        <h6>{t('pipeResultFailed')}</h6>
        <p>{step.failure ?? t('pipeNoProduct')}</p>
        <button type="button" className={`${css.btn} ${css.ghost}`} onClick={onRun}>{t('pipeRetryStep')}</button>
      </div>
    )
  }
  if (step.phase === 'idle' || step.result === undefined) {
    return (
      <div className={css.stateBlock}>
        <h6>{t('pipeResultNone')}</h6>
        <p>{t('pipeResultNoneBody')}</p>
        <button type="button" className={`${css.btn} ${css.ghost}`} onClick={onRun}>{t('pipeRunOne')}</button>
      </div>
    )
  }
  return (
    <div className={css.resBlock}>
      <div className={css.resBlockHead}>
        <span>{t('pipeResultWhat')}</span>
        {step.product.kind === 'directory' ? <em>{step.product.path}</em> : null}
      </div>
      {step.result.editedAt === undefined ? null : (
        <p className={css.revised} data-edited="">{t('pipeResultEdited')}</p>
      )}
      <div className={css.resList}>
        <button type="button" className={css.resItem} data-open-result="" onClick={onOpen}>
          <span className={css.resItemName}>
            {step.product.kind === 'directory' ? t('pipeResultOpenDir') : t('pipeResultOpenInline')}
          </span>
          <span className={css.resItemSize}>{formatWhen(step.result.executedAt, Date.now())}</span>
        </button>
      </div>
      <div className={css.resOpen}>
        <button type="button" className={`${css.btn} ${css.ghost}`} data-result-review="" onClick={onReview}>
          {t('pipeRegenerate')}
        </button>
      </div>
      <p className={css.hint}>{t('pipeResultReadNote')}</p>
    </div>
  )
}

/** The inline rename field: Enter or blur commits, Escape abandons. */
function RenameField(props: {
  readonly initial: string
  readonly onCommit: (name: string) => void
  readonly onCancel: () => void
  readonly t: (key: WorkbenchLocaleKey) => string
  /** Which field style to use; the node's title and the pipeline's title differ. */
  readonly className?: string
  /** Accessible name, when the default one does not fit the surface. */
  readonly label?: string
}): ReactNode {
  const { initial, onCommit, onCancel, t, className, label } = props
  const [value, setValue] = useState(initial)
  const [abandoned, setAbandoned] = useState(false)
  return (
    <input
      className={className ?? css.renameInput}
      value={value}
      aria-label={label ?? t('pipeRenameLabel')}
      maxLength={24}
      autoFocus
      onChange={(event) => { setValue(event.target.value) }}
      onKeyDown={(event) => {
        // The node this field sits in is a button; a space typed here would activate it
        // and Enter would move the selection instead of committing.
        event.stopPropagation()
        if (event.key === 'Enter') { onCommit(value.trim()) }
        // Escape must not let the blur that follows it commit: the field is being
        // abandoned, and committing here would rename on the way out.
        if (event.key === 'Escape') { setAbandoned(true); onCancel() }
      }}
      onBlur={() => { if (!abandoned) onCommit(value.trim()) }}
    />
  )
}
