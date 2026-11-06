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
import type {
  WorkbenchCardConfigView,
  WorkbenchCardResult,
  WorkbenchSkillCardApi,
} from './skill-card/api.ts'
import { permissionLabelKey } from './skill-card/permission.ts'
import { resultHtml } from './skill-card/render.ts'
import type { WorkbenchLocaleKey } from './locales.ts'

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
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
}

/** How long a delete confirmation stays armed. */
const CONFIRM_MS = 4_000

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
  const { pipelines, run, facts, api, renderCard, onCreateCard, t } = props
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [focus, setFocus] = useState<Focus | undefined>(undefined)
  const [tab, setTab] = useState<InspectorTab>('activity')
  const [cards, setCards] = useState<readonly WorkbenchCardConfigView[]>([])
  const [results, setResults] = useState<readonly WorkbenchCardResult[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [stepMenu, setStepMenu] = useState<number | undefined>(undefined)
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

  // The menus close on the next click anywhere, which is what a menu has to do. The
  // dialogs close on Escape and their scrim instead.
  useEffect(() => {
    if (!menuOpen && stepMenu === undefined) return
    const close = (): void => { setMenuOpen(false); setStepMenu(undefined) }
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
                            onClick={() => {
                              setPicker({ at: 0 })
                              setPickerQuery('')
                            }}
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
                                  onClick={() => { setPicker({ at: step.index }); setPickerQuery('') }}
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
                              <span className={css.nodeTitle}>{step.label}</span>
                              <span className={css.nodeState}>
                                {markOf(step.phase)}
                                {stateText(step.phase)}
                              </span>
                              <span className={css.nodeDur}>
                                {step.phase === 'running' ? '…' : formatDuration(step.tookMs)}
                              </span>
                            </div>
                            <div className={css.nodeFoot} data-s={step.phase}>
                              {footOf(step, t)}
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
                        onClick={() => { setPicker({ at: active.steps.length }); setPickerQuery('') }}
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
                        className={`${css.stepMenuRow} ${css.hError}`}
                        role="menuitem"
                        aria-label={t('pipeRemoveStep')}
                        data-remove-step=""
                        onClick={() => { setStepMenu(undefined); void removeStep(selected.index) }}
                      >
                        {t('pipeRemoveStep')}
                      </button>
                      <div className={css.stepMenuNote}>{t('pipeRemoveNote')}</div>
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
                              t={t}
                              onEdit={() => { openReader(selected.cardId) }}
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
                {menuFacts
                  .filter(fact => pickerQuery.trim() === ''
                    ? true
                    : fact.label.toLowerCase().includes(pickerQuery.trim().toLowerCase())
                      || fact.id.includes(pickerQuery.trim()))
                  .map(fact => {
                    const used = active?.steps.some(step => step.cardId === fact.id) ?? false
                    return (
                      <button
                        key={fact.id}
                        type="button"
                        className={css.pickerRow}
                        data-pick-card={fact.id}
                        disabled={used}
                        onClick={() => { void insertStep(fact.id, picker.at) }}
                      >
                        <span className={css.pickerRowMain}>
                          <span className={css.pickerRowTitle}>{fact.label}</span>
                          <span className={css.pickerRowSub}>{fact.id}</span>
                        </span>
                        {used ? <span className={css.pickerUsed}>{t('pipePickerUsed')}</span> : MARK.plus}
                      </button>
                    )
                  })}
                {menuFacts.length === 0
                  ? <p className={css.pickerEmpty}>{t('pipePickerEmpty')}</p>
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
const MARK: Record<'dash' | 'clock' | 'check' | 'warn' | 'x' | 'plus' | 'play' | 'chev' | 'search' | 'dots' | 'back', ReactNode> = {
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
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly onEdit: () => void
}): ReactNode {
  const { step, shared, t, onEdit } = props
  const [view, setView] = useState<'preview' | 'source'>('preview')
  const template = step.card?.template
  return (
    <>
      <div className={css.cfgBlock}>
        <div className={css.cfgBlockHead}>
          <span>{t('pipeCfgPipeline')}</span>
          <em>{t('pipeCfgPipelineNote')}</em>
        </div>
        <div className={css.ruleRow}>
          <span className={css.ruleLabel}>{t('pipeCfgModel')}</span>
          <span className={css.ruleValue}>
            {shared?.model === undefined
              ? <span className={css.hint}>{t('pipeCfgModelInherit')}</span>
              : <span className={css.val}>{`${shared.model.provider}/${shared.model.model}`}</span>}
          </span>
        </div>
        <div className={css.ruleRow}>
          <span className={css.ruleLabel}>{t('pipeCfgPermission')}</span>
          <span className={css.ruleValue}>
            <span className={css.val}>{t(permissionLabelKey(shared?.permission ?? 'workspace-write'))}</span>
          </span>
        </div>
        <div className={css.ruleRow}>
          <span className={css.ruleLabel}>{t('pipeCfgWorkspace')}</span>
          <span className={css.ruleValue}>
            <span className={`${css.val} ${css.mono}`}>{shared?.workspace?.path ?? t('pipeCfgNoWorkspace')}</span>
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
            <span className={`${css.val} ${css.mono}`}>{step.skill ?? t('pipeCfgNoSkill')}</span>
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
            : <pre className={css.docSrc} data-cfg-source="">{template}</pre>}
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
}): ReactNode {
  const { initial, onCommit, onCancel, t } = props
  const [value, setValue] = useState(initial)
  const [abandoned, setAbandoned] = useState(false)
  return (
    <input
      className={css.renameInput}
      value={value}
      aria-label={t('pipeRenameLabel')}
      maxLength={24}
      autoFocus
      onChange={(event) => { setValue(event.target.value) }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') { onCommit(value.trim()) }
        // Escape must not let the blur that follows it commit: the field is being
        // abandoned, and committing here would rename on the way out.
        if (event.key === 'Escape') { setAbandoned(true); onCancel() }
      }}
      onBlur={() => { if (!abandoned) onCommit(value.trim()) }}
    />
  )
}
