/**
 * The pipeline workbench: routes on the left, the chain in the middle, one step on the right.
 *
 * Three zones that answer three different questions, and none of them duplicates another:
 * the rail says which pipelines exist, the canvas says what the chain is doing, and the
 * inspector says what one step produced, did, and is configured to do. Everything a step
 * *is* lives in its card — the pipeline only holds an order — so this surface never edits a
 * card's template; the inspector mounts the card's own page for that.
 * @module dsh-workbench/client/WorkbenchPipeline
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import css from './workbench.module.css'
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

/** What the middle of the surface is showing. */
type Focus = { readonly kind: 'step'; readonly index: number } | { readonly kind: 'card'; readonly cardId: string }

/** Props of the pipeline workbench. */
export interface WorkbenchPipelineProps {
  /** Stored pipelines and the mutations the rail offers. */
  readonly pipelines: WorkbenchPipelinesFace
  /** The run engine the canvas drives. */
  readonly run: PipelineRunFace
  /** Cards the workbench knows about, as the rail lists them. */
  readonly facts: readonly WorkbenchCardFact[]
  /** Transport, so a step's stored result can be read without threading it through the page. */
  readonly api: WorkbenchSkillCardApi
  /**
   * Mount one card's own view.
   * @param cardId - the card to show.
   * @param view - which of its views.
   * @param onBack - what its back control returns to.
   * @returns the view.
   */
  readonly renderCard: (cardId: string, view: CardView, onBack: () => void) => ReactNode
  /** Create a new single card, from the rail's own entry. */
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
 * @returns the three-zone surface.
 */
export function WorkbenchPipeline(props: WorkbenchPipelineProps): ReactNode {
  const { pipelines, run, facts, api, renderCard, onCreateCard, t } = props
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [focus, setFocus] = useState<Focus | undefined>(undefined)
  const [tab, setTab] = useState<InspectorTab>('activity')
  const [cards, setCards] = useState<readonly WorkbenchCardConfigView[]>([])
  const [results, setResults] = useState<readonly WorkbenchCardResult[]>([])
  const [menuFor, setMenuFor] = useState<string | undefined>(undefined)
  const [confirmDelete, setConfirmDelete] = useState<string | undefined>(undefined)
  const [renaming, setRenaming] = useState<string | undefined>(undefined)
  const [titleMenu, setTitleMenu] = useState(false)
  const [picker, setPicker] = useState<{ readonly at: number } | undefined>(undefined)
  const [pickerQuery, setPickerQuery] = useState('')
  const [reader, setReader] = useState<{ readonly cardId: string } | undefined>(undefined)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyAt, setHistoryAt] = useState<number | undefined>(undefined)
  const [stepMenu, setStepMenu] = useState<number | undefined>(undefined)

  const active = useMemo<WorkbenchPipeline | undefined>(() => {
    const found = pipelines.pipelines.find(pipeline => pipeline.id === activeId)
    // The first pipeline is the one on screen until the user picks another. Falling back
    // rather than rendering nothing is what makes the panel open onto work.
    return found ?? pipelines.pipelines[0]
  }, [activeId, pipelines.pipelines])

  // The page hands over the cards it can see from more than one place, so the same card can
  // arrive twice; the rail lists each one once.
  const railFacts = useMemo<readonly WorkbenchCardFact[]>(() => {
    const seen = new Set<string>()
    return facts.filter(fact => {
      if (seen.has(fact.id)) return false
      seen.add(fact.id)
      return true
    })
  }, [facts])

  const labelOf = useCallback((cardId: string): string => {
    const fact = facts.find(entry => entry.id === cardId)
    const label = fact?.label ?? ''
    return label.length === 0 ? cardId : label
  }, [facts])

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

  // Both menus close on the next click anywhere, which is what a menu has to do.
  useEffect(() => {
    if (menuFor === undefined && !titleMenu) return
    const close = (): void => { setMenuFor(undefined); setTitleMenu(false) }
    document.addEventListener('pointerdown', close)
    return () => { document.removeEventListener('pointerdown', close) }
  }, [menuFor, titleMenu])

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
      // Without a chain in this page, a step that has a stored result has run before: it
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

  // The reader takes the whole panel: it is the one place a result is read, and reading it
  // inside a 320px column would be the same mistake as reading it in two places.
  if (reader !== undefined) {
    return (
      <div className={css.pagePipeline} data-reader={reader.cardId}>
        <div className={css.readerBar}>
          <button
            type="button"
            className={css.ghostBtn}
            data-reader-back=""
            onClick={() => { setReader(undefined) }}
          >
            {t('pipeReaderBack')}
          </button>
        </div>
        <div className={css.readerBody}>
          {renderCard(reader.cardId, 'result', () => { setReader(undefined) })}
        </div>
      </div>
    )
  }

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

  return (
    <div className={css.pagePipeline} data-workbench-pipeline="">
      <div className={css.shell}>
        {/* ── 轨道：有哪些流水线，有哪些单任务 ── */}
        <nav className={css.rail} data-rail="">
          <div className={css.railHead}>
            <span>{t('pipeRailPipelines')}</span>
            <button type="button" className={css.railAction} data-new-pipeline="" onClick={createPipeline}>
              {t('pipeNewPipeline')}
            </button>
          </div>
          {pipelines.pipelines.length === 0
            ? <p className={css.railEmpty}>{t('pipeRailNoPipelines')}</p>
            : (
              <ul className={css.railList}>
                {pipelines.pipelines.map(pipeline => {
                  const current = pipeline.id === active?.id
                  const armed = confirmDelete === pipeline.id
                  return (
                    <li key={pipeline.id} className={css.railItem}>
                      {renaming === pipeline.id
                        ? (
                          <RenameField
                            t={t}
                            initial={pipeline.name}
                            onCommit={(name) => {
                              setRenaming(undefined)
                              if (name !== '' && name !== pipeline.name) void pipelines.rename(pipeline.id, name)
                            }}
                            onCancel={() => { setRenaming(undefined) }}
                          />
                        )
                        : (
                          <button
                            type="button"
                            className={current ? `${css.railRow} ${css.railRowCurrent}` : css.railRow}
                            data-pipeline-row={pipeline.id}
                            aria-current={current}
                            onClick={() => { setActiveId(pipeline.id); setFocus(undefined) }}
                          >
                            <span className={css.railName}>{pipeline.name}</span>
                            <span className={css.railCount}>{pipeline.steps.length}</span>
                          </button>
                        )}
                      <button
                        type="button"
                        className={css.railDots}
                        aria-label={t('pipeRailMenu')}
                        aria-expanded={menuFor === pipeline.id}
                        onClick={(event) => {
                          event.stopPropagation()
                          setMenuFor(menuFor === pipeline.id ? undefined : pipeline.id)
                        }}
                      >
                        ⋯
                      </button>
                      {menuFor === pipeline.id
                        ? (
                          <div className={css.menu} data-pipeline-menu={pipeline.id}>
                            <button
                              type="button"
                              className={css.menuRow}
                              onClick={() => { setMenuFor(undefined); setRenaming(pipeline.id) }}
                            >
                              {t('pipeRename')}
                            </button>
                            <button
                              type="button"
                              className={armed ? `${css.menuRow} ${css.menuRowDanger}` : css.menuRow}
                              data-delete-pipeline=""
                              onClick={() => {
                                if (!armed) { setConfirmDelete(pipeline.id); return }
                                setConfirmDelete(undefined)
                                setMenuFor(undefined)
                                void pipelines.remove(pipeline.id)
                                if (pipeline.id === active?.id) setFocus(undefined)
                              }}
                            >
                              {armed ? t('pipeDeleteConfirm') : t('pipeDelete')}
                            </button>
                          </div>
                        )
                        : null}
                    </li>
                  )
                })}
              </ul>
              )}
          <div className={css.railHead}>
            <span>{t('pipeRailTasks')}</span>
            <button type="button" className={css.railAction} data-create-card="" onClick={onCreateCard}>
              {t('pipeCreateCard')}
            </button>
          </div>
          <ul className={css.railList}>
            {railFacts.map(fact => (
              <li key={fact.id} className={css.railItem}>
                <button
                  type="button"
                  className={focus?.kind === 'card' && focus.cardId === fact.id
                    ? `${css.railRow} ${css.railRowCurrent}`
                    : css.railRow}
                  data-card-row={fact.id}
                  onClick={() => { setFocus({ kind: 'card', cardId: fact.id }); setTab('result') }}
                >
                  <span className={css.railName}>{fact.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── 画布：这条流水线长什么样，现在在干什么 ── */}
        <section className={css.canvas} data-canvas="">
          <div className={css.canvasHead}>
            <div className={css.canvasTitleWrap}>
              <div className={css.canvasTitleRow}>
                <button
                  type="button"
                  className={css.canvasTitle}
                  data-canvas-title=""
                  aria-expanded={titleMenu}
                  disabled={active === undefined}
                  onClick={(event) => {
                    event.stopPropagation()
                    setTitleMenu(!titleMenu)
                  }}
                >
                  {active?.name ?? t('pipeNoPipeline')}
                  <span className={css.chev}>{MARK.chev}</span>
                </button>
                {active === undefined
                  ? null
                  : (
                    <span className={css.stateChip} data-canvas-state={chainState}>
                      <i className={css.dot} data-s={chainState} />
                      {stateText(chainState)}
                    </span>
                    )}
              </div>
              <button
                type="button"
                className={css.canvasMeta}
                data-canvas-meta=""
                disabled={active === undefined || active.steps.length === 0}
                onClick={() => { setHistoryOpen(true); setHistoryAt(undefined) }}
              >
                {active === undefined ? t('pipeMetaNoPipeline') : metaOf(active)}
              </button>
            </div>
            {titleMenu && active !== undefined
              ? (
                <div className={css.menu} data-title-menu="">
                  {pipelines.pipelines.map(pipeline => (
                    <button
                      key={pipeline.id}
                      type="button"
                      className={css.menuRow}
                      aria-current={pipeline.id === active.id}
                      onClick={() => { setTitleMenu(false); setActiveId(pipeline.id); setFocus(undefined) }}
                    >
                      <i className={css.dot} data-s="idle" />
                      <span className={css.menuRowMain}>{pipeline.name}</span>
                      <span className={css.menuTail}>{pipeline.steps.length}</span>
                    </button>
                  ))}
                  <div className={css.menuSep} />
                  <button type="button" className={css.menuRow} onClick={() => { setTitleMenu(false); createPipeline() }}>
                    {t('pipeNewPipeline')}
                  </button>
                  <button type="button" className={css.menuRow} onClick={() => { setTitleMenu(false); setRenaming(active.id) }}>
                    {t('pipeRename')}
                  </button>
                </div>
                )
              : null}
          </div>

          <div className={css.canvasScroll}>
            {active === undefined || active.steps.length === 0
              ? (
                <div className={css.emptyFlow} data-empty-pipeline="">
                  <span className={css.emptyMark}>{MARK.plus}</span>
                  <h4>{active === undefined ? t('pipeNoPipeline') : t('pipeEmptyTitle')}</h4>
                  <p>{t('pipeEmptyBody')}</p>
                  <button
                    type="button"
                    className={css.primaryBtn}
                    data-add-step="0"
                    onClick={() => {
                      if (active === undefined) return
                      setPicker({ at: 0 })
                      setPickerQuery('')
                    }}
                  >
                    {MARK.plus}
                    {t('pipeAddFirstStep')}
                  </button>
                </div>
                )
              : (
                <div className={css.flow}>
                  {stepViews.map(step => (
                    <div key={`${step.cardId}-${String(step.index)}`} className={css.nodeWrap}>
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
                        className={step.index === selectedIndex ? `${css.node} ${css.nodeSelected}` : css.node}
                        data-step-index={step.index}
                        data-s={step.phase}
                        role="button"
                        tabIndex={0}
                        aria-selected={step.index === selectedIndex}
                        onClick={() => { setFocus({ kind: 'step', index: step.index }) }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.preventDefault()
                          setFocus({ kind: 'step', index: step.index })
                        }}
                      >
                        <div className={css.nodeTop}>
                          <span className={css.nodeIndex}>{String(step.index + 1).padStart(2, '0')}</span>
                          <span className={css.nodeTitle}>{step.label}</span>
                          <span className={css.nodeState} data-s={step.phase}>
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

          <div className={css.runBar}>
            <div className={css.segBar}>
              {stepViews.map(step => (
                <i key={`seg-${step.cardId}`} data-s={step.phase} />
              ))}
            </div>
            <div className={css.runNoise} data-run-noise={chain?.phase ?? 'idle'}>
              {chain === undefined
                ? <span>{active === undefined || active.steps.length === 0 ? t('pipeNoSteps') : t('pipeNotRun')}</span>
                : chain.phase === 'running'
                  ? <span>{t('pipeRunningStep', { at: (chain.activeIndex ?? 0) + 1, count: active?.steps.length ?? 0 })}</span>
                  : chain.phase === 'failed'
                    ? <span>{t('pipeFailedAt', { done: doneCount, count: active?.steps.length ?? 0, at: (failedAt ?? doneCount) + 1 })}</span>
                    : chain.phase === 'stopped'
                      ? <span>{t('pipeStopped', { done: doneCount, count: active?.steps.length ?? 0 })}</span>
                      : <span>{t('pipeAllDone', { count: active?.steps.length ?? 0 })}</span>}
            </div>
            <div className={css.runActions}>
              {running
                ? (
                  <button type="button" className={css.ghostBtn} data-stop="" onClick={() => { run.stop() }}>
                    {t('pipeStop')}
                  </button>
                  )
                : (
                  <button
                    type="button"
                    className={css.primaryBtn}
                    data-run-all=""
                    disabled={active === undefined || active.steps.length === 0}
                    onClick={() => { if (active !== undefined) run.runAll(active) }}
                  >
                    {MARK.play}
                    {t('pipeRunAll')}
                  </button>
                  )}
            </div>
          </div>
        </section>

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
                      aria-expanded={stepMenu === selectedIndex}
                      data-step-menu-btn=""
                      onClick={() => { setStepMenu(stepMenu === selectedIndex ? undefined : selectedIndex) }}
                    >
                      ⋯
                    </button>
                  </>
                  )}
            </div>
            {selected === undefined
              ? null
              : (
                <div className={css.inspMeta} data-insp-meta="">
                  {selected.skill === undefined ? null : <code>{selected.skill}</code>}
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
                      className={tab === key ? `${css.tab} ${css.tabActive}` : css.tab}
                      data-insp-tab={key}
                      aria-selected={tab === key}
                      tabIndex={tab === key ? 0 : -1}
                      onClick={() => { setTab(key) }}
                    >
                      {t(TAB_KEY[key])}
                      {key === 'activity' && selected?.result !== undefined
                        ? <em className={css.tabCount}>{selected.result.activity?.length ?? 0}</em>
                        : null}
                    </button>
                  ))}
                </div>
                )}
          </div>

          <div className={css.inspScroll}>
            {focus?.kind === 'card'
              ? (
                <div className={css.panelBody} data-panel="card">
                  <div className={css.cfgBlock}>
                    <div className={css.cfgBlockHead}><span>{t('pipeCardPanel')}</span></div>
                    <p className={css.panelNote}>{t('pipeCardPanelNote')}</p>
                    <button
                      type="button"
                      className={css.ghostBtn}
                      data-open-card=""
                      onClick={() => { setReader({ cardId: focus.cardId }) }}
                    >
                      {t('pipeOpenResult')}
                    </button>
                  </div>
                </div>
                )
              : selected === undefined
                ? (
                  <div className={css.panelBody} data-panel="empty">
                    <div className={css.stateBlock}>
                      <h6>{t('pipeEmptyPanelTitle')}</h6>
                      <p>{t('pipeEmptyPanelBody')}</p>
                      <button
                        type="button"
                        className={css.ghostBtn}
                        data-add-step="0"
                        onClick={() => { setPicker({ at: 0 }); setPickerQuery('') }}
                      >
                        {MARK.plus}
                        {t('pipeAddFirstStep')}
                      </button>
                    </div>
                  </div>
                  )
                : tab === 'activity'
                  ? (
                    <div className={css.panelBody} data-panel="activity">
                      <ActivityPanel step={selected} t={t} onOpenCard={() => { setReader({ cardId: selected.cardId }) }} />
                    </div>
                    )
                  : tab === 'config'
                    ? (
                      <div className={css.panelBody} data-panel="config">
                        <ConfigPanel
                          step={selected}
                          shared={stepViews[0]?.card}
                          t={t}
                          onEdit={() => { setReader({ cardId: selected.cardId }) }}
                        />
                      </div>
                      )
                    : (
                      <div className={css.panelBody} data-panel="result">
                        <ResultPanel
                          step={selected}
                          t={t}
                          onOpen={() => { setReader({ cardId: selected.cardId }) }}
                          onRun={() => { if (active !== undefined) run.runOne(active, selected.index) }}
                        />
                      </div>
                      )}

            {stepMenu !== undefined && stepMenu === selectedIndex && selected !== undefined && focus?.kind === 'step'
              ? (
                <div className={css.stepMenu} data-step-menu="">
                  <button
                    type="button"
                    className={css.menuRow}
                    data-move-up=""
                    disabled={selected.index === 0}
                    onClick={() => { setStepMenu(undefined); void moveStep(selected.index, -1) }}
                  >
                    {MARK.up}{t('pipeMoveUp')}
                  </button>
                  <button
                    type="button"
                    className={css.menuRow}
                    data-move-down=""
                    disabled={selected.index === (active?.steps.length ?? 1) - 1}
                    onClick={() => { setStepMenu(undefined); void moveStep(selected.index, 1) }}
                  >
                    {MARK.down}{t('pipeMoveDown')}
                  </button>
                  <div className={css.menuSep} />
                  <button
                    type="button"
                    className={`${css.menuRow} ${css.menuRowDanger}`}
                    aria-label={t('pipeRemoveStep')}
                    data-remove-step=""
                    onClick={() => { setStepMenu(undefined); void removeStep(selected.index) }}
                  >
                    {MARK.trash}{t('pipeRemoveStep')}
                  </button>
                  <p className={css.menuNote}>{t('pipeRemoveNote')}</p>
                </div>
                )
              : null}
          </div>
        </aside>
      </div>

      {/* ── 运行记录 ── */}
      {historyOpen
        ? (
          <Modal onClose={() => { setHistoryOpen(false) }} labelledBy="pipe-hist-title">
            <div className={css.modalHead}>
              <span className={css.modalKicker} id="pipe-hist-title" data-hist-title="">
                {historyAt === undefined
                  ? t('pipeHistoryTitle')
                  : t('pipeHistoryRun', { no: history[historyAt]?.no ?? 0 })}
              </span>
              <span className={css.modalMeta} data-hist-meta="">
                {historyAt === undefined
                  ? history.length === 0 ? t('pipeHistoryEmptyMeta') : t('pipeHistoryCount', { count: history.length })
                  : (history[historyAt] === undefined
                      ? ''
                      : `${formatWhen(history[historyAt]?.startedAt ?? 0, Date.now())} · ${formatDuration(history[historyAt]?.tookMs)}`)}
              </span>
              {historyAt === undefined
                ? null
                : (
                  <button type="button" className={css.ghostBtn} onClick={() => { setHistoryAt(undefined) }}>
                    {t('pipeHistoryBack')}
                  </button>
                  )}
              <button type="button" className={css.iconBtn} aria-label={t('pipeClose')} onClick={() => { setHistoryOpen(false) }}>
                {MARK.x}
              </button>
            </div>
            <div className={css.modalBody}>
              {historyAt === undefined
                ? history.length === 0
                  ? <div className={css.stateBlock}><p>{t('pipeHistoryEmpty')}</p></div>
                  : (
                    <div className={css.histList}>
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
                          <span className={css.histSum}>
                            {`${entry.steps.map(step => labelOf(step.cardId)).join(' → ')}`}
                          </span>
                          <span className={css.histTook}>{formatDuration(entry.tookMs)}</span>
                          <span className={css.histBadge} data-s={entry.phase}>{entry.phase}</span>
                        </button>
                      ))}
                    </div>
                    )
                : (
                  <div className={css.histDetail}>
                    {(history[historyAt]?.steps ?? []).map((step, at) => (
                      <div key={`hist-step-${String(at)}`} className={css.histStep}>
                        <button
                          type="button"
                          className={css.histStepHead}
                          data-hist-step={at}
                          onClick={() => {
                            setHistoryOpen(false)
                            setReader({ cardId: step.cardId })
                          }}
                        >
                          <span className={css.histStepNo}>{String(at + 1)}</span>
                          <span className={css.histStepName}>{labelOf(step.cardId)}</span>
                          <span className={css.histStepMeta}>
                            {(() => {
                              const product = productOf(step.html)
                              if (product.kind === 'directory') return product.path
                              return product.kind === 'inline' ? t('pipeInlineProduct') : t('pipeNoProduct')
                            })()}
                          </span>
                          <span className={css.histStepTook}>{formatDuration(step.tookMs)}</span>
                          <span className={css.chev}>{MARK.chev}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  )}
            </div>
          </Modal>
          )
        : null}

      {/* ── 技能选择器 ── */}
      {picker === undefined
        ? null
        : (
          <Modal onClose={() => { setPicker(undefined) }} labelledBy="pipe-picker-title" width="narrow">
            <div className={css.modalHead}>
              <span className={css.modalKicker} id="pipe-picker-title" data-picker-title="">
                {t('pipePickerTitle')}
              </span>
              <span className={css.modalMeta}>{t('pipePickerAt', { at: picker.at + 1 })}</span>
              <button type="button" className={css.iconBtn} aria-label={t('pipeClose')} onClick={() => { setPicker(undefined) }}>
                {MARK.x}
              </button>
            </div>
            <div className={css.modalBody}>
              <label className={css.searchField}>
                {MARK.search}
                <input
                  type="text"
                  autoFocus
                  value={pickerQuery}
                  data-picker-search=""
                  placeholder={t('pipePickerSearch')}
                  onChange={(event) => { setPickerQuery(event.target.value) }}
                />
              </label>
              <div className={css.pickerList}>
                {railFacts
                  .filter(fact => pickerQuery.trim() === ''
                    ? true
                    : fact.label.toLowerCase().includes(pickerQuery.trim().toLowerCase()) || fact.id.includes(pickerQuery.trim()))
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
                {railFacts.length === 0
                  ? <p className={css.panelNote}>{t('pipePickerEmpty')}</p>
                  : null}
              </div>
            </div>
          </Modal>
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
  if (step.phase === 'queued') return <span>{t('pipeQueued')}</span>
  if (step.phase === 'running') return <span>{t('pipeWorking')}</span>
  if (step.phase === 'stopped') return <span>{t('pipeStepState_stopped')}</span>
  if (step.phase === 'idle') return <span>{t('pipeNeverRan')}</span>
  if (step.product.kind === 'directory') return <span>{step.product.path}</span>
  if (step.product.kind === 'inline') return <span>{step.product.text}</span>
  return <span>{t('pipeNoProduct')}</span>
}

/** The marks a state is drawn with, so colour is never the only signal. */
const MARK: Record<'dash' | 'clock' | 'check' | 'warn' | 'x' | 'plus' | 'play' | 'chev' | 'search' | 'up' | 'down' | 'trash', ReactNode> = {
  dash: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="5.3" strokeDasharray="2.2 2.2" /></svg>,
  clock: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="5.7" /><path d="M8 4.8V8l2.2 1.4" /></svg>,
  check: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3.6 8.4 2.8 2.6 5.9-6" /></svg>,
  warn: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2.6l5.6 9.8H2.4z" /><path d="M8 6.2v3.2M8 11.2v.1" /></svg>,
  x: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" /></svg>,
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3.4v9.2M3.4 8h9.2" /></svg>,
  play: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.6 2.9c0-.5.5-.8.9-.6l7.1 4.2c.4.2.4.8 0 1l-7.1 4.2c-.4.2-.9-.1-.9-.6z" /></svg>,
  chev: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4.4 6.4 3.6 3.4 3.6-3.4" /></svg>,
  search: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7.2" cy="7.2" r="4.4" /><path d="m10.6 10.6 2.6 2.6" /></svg>,
  up: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12.6V3.6M4.2 7.2 8 3.4l3.8 3.8" /></svg>,
  down: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3.4v9M4.2 8.8 8 12.6l3.8-3.8" /></svg>,
  trash: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2.8 4.4h10.4M6.2 4.4V2.9h3.6v1.5M4.1 4.4l.6 8.3a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9l.6-8.3" /></svg>,
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
        <button type="button" className={css.ghostBtn} onClick={onOpenCard}>{t('pipeOpenRuns')}</button>
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
            <span className={css.val}>
              {t(permissionLabelKey(shared?.permission ?? 'workspace-write'))}
            </span>
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
          ? <p className={css.panelNote}>{t('pipeCfgNoTemplate')}</p>
          : view === 'preview'
            ? (
              <div className={css.tplSlot}>
                <div className={css.tplSlotLabel}>{t('pipeCfgPreviewNote')}</div>
                <div className={css.tplSlotBox}>
                  <span className={css.tplSlotTag}>{t('pipeCfgRegion')}</span>
                  <span className={css.tplSlotText}>{t('pipeCfgRegionBody')}</span>
                </div>
              </div>
              )
            : <pre className={css.docSrc} data-cfg-source="">{template}</pre>}
        <button type="button" className={css.ghostBtn} data-edit-card="" onClick={onEdit}>
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
}): ReactNode {
  const { step, t, onOpen, onRun } = props
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
        <p>{t('pipeResultQueuedBody', { at: step.index + 1 })}</p>
        <button type="button" className={css.ghostBtn} onClick={onRun}>{MARK.play}{t('pipeRunThisStep')}</button>
      </div>
    )
  }
  if (step.phase === 'failed') {
    return (
      <div className={css.stateBlock} data-tone="danger">
        <h6>{t('pipeResultFailed')}</h6>
        <p>{step.failure ?? t('pipeNoProduct')}</p>
        <button type="button" className={css.ghostBtn} onClick={onRun}>{MARK.play}{t('pipeRetryStep')}</button>
      </div>
    )
  }
  if (step.phase === 'idle' || step.result === undefined) {
    return (
      <div className={css.stateBlock}>
        <h6>{t('pipeResultNone')}</h6>
        <p>{t('pipeResultNoneBody')}</p>
        <button type="button" className={css.ghostBtn} onClick={onRun}>{MARK.play}{t('pipeRunOne')}</button>
      </div>
    )
  }
  return (
    <div className={css.resBlock}>
      <div className={css.cfgBlockHead}>
        <span>{t('pipeResultWhat')}</span>
        {step.product.kind === 'directory' ? <em>{step.product.path}</em> : null}
      </div>
      {step.result.editedAt === undefined ? null : (
        <p className={css.panelNote} data-edited="">{t('pipeResultEdited')}</p>
      )}
      <div className={css.resList}>
        <button type="button" className={css.resItem} data-open-result="" onClick={onOpen}>
          {MARK.dash}
          <span className={css.resItemName}>
            {step.product.kind === 'directory' ? t('pipeResultOpenDir') : t('pipeResultOpenInline')}
          </span>
          <span className={css.resItemSize}>{formatWhen(step.result.executedAt, Date.now())}</span>
          <span className={css.chev}>{MARK.chev}</span>
        </button>
      </div>
      <p className={css.panelNote}>{t('pipeResultReadNote')}</p>
    </div>
  )
}

/** One overlay, scrim plus dialog, closed by Escape and by its scrim. */
function Modal(props: {
  readonly onClose: () => void
  readonly labelledBy: string
  readonly width?: 'narrow'
  readonly children: ReactNode
}): ReactNode {
  const { onClose, labelledBy, width, children } = props
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [onClose])
  return (
    <div className={css.modalWrap}>
      <div className={css.scrim} onClick={onClose} />
      <div
        className={width === 'narrow' ? `${css.modal} ${css.modalNarrow}` : css.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
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
