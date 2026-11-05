/**
 * The pipeline workbench: a rail of pipelines and single cards, a canvas of steps, and
 * an inspector showing the focused step.
 *
 * The three zones are the panel's whole surface — there is no separate grid behind them.
 * A pipeline is an ordered list of cards, so a step is a card plus its position; the
 * cards themselves are configured, run and read through the same pages the panel already
 * had, which the inspector mounts rather than reimplements.
 * @module dsh-workbench/client/WorkbenchPipeline
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { WorkbenchPipeline, WorkbenchPipelineStep } from '../pipeline-contract.ts'
import type { WorkbenchPipelinesFace } from './pipeline-controller.ts'
import { tookOf } from './pipeline/pipeline-run.ts'
import type { ChainStepOutcome, PipelineChain, PipelineRunFace } from './pipeline/pipeline-run.ts'
import type { WorkbenchCardFact } from './layout-store.ts'
import type { WorkbenchLocaleKey } from './locales.ts'
import css from './workbench.module.css'

/** The two zones that can hold focus. */
type PipelineFocus =
  | { readonly kind: 'step'; readonly pipelineId: string; readonly index: number }
  | { readonly kind: 'card'; readonly cardId: string }

/** The inspector's three tabs, in the order the user reads them: what happened first. */
type PipelineTab = 'activity' | 'config' | 'result'

/** One card's full-panel views the inspector can mount. */
type CardView = 'config' | 'runs' | 'result'

/** Props of the pipeline workbench. */
export interface WorkbenchPipelineProps {
  /** Stored pipelines and the mutations the rail offers. */
  readonly pipelines: WorkbenchPipelinesFace
  /** The run engine the canvas drives. */
  readonly run: PipelineRunFace
  /** Cards the workbench knows about, as the rail lists them. */
  readonly facts: readonly WorkbenchCardFact[]
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

/**
 * Render the pipeline workbench.
 * @param props - stored pipelines, run engine, cards, the inspector's card views, and `t`.
 * @returns the three-zone surface.
 */
export function WorkbenchPipeline(props: WorkbenchPipelineProps): ReactNode {
  const { pipelines, run, facts, renderCard, onCreateCard, t } = props
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [focus, setFocus] = useState<PipelineFocus | undefined>(undefined)
  const [tab, setTab] = useState<PipelineTab>('activity')
  const [menuFor, setMenuFor] = useState<string | undefined>(undefined)
  const [confirmDelete, setConfirmDelete] = useState<string | undefined>(undefined)
  const [renaming, setRenaming] = useState<string | undefined>(undefined)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerNote, setPickerNote] = useState<string | undefined>(undefined)

  const active = useMemo<WorkbenchPipeline | undefined>(() => {
    const found = pipelines.pipelines.find(pipeline => pipeline.id === activeId)
    // The first pipeline is the one on screen until the user picks another. Falling back
    // rather than rendering nothing is what makes the panel open onto work.
    return found ?? pipelines.pipelines[0]
  }, [activeId, pipelines.pipelines])

  const labelOf = useCallback((cardId: string): string => {
    const fact = facts.find(entry => entry.id === cardId)
    const label = fact?.label ?? ''
    return label.length === 0 ? cardId : label
  }, [facts])

  // A delete confirmation disarms itself: an armed row that stayed armed would turn a
  // later stray click into the deletion.
  useEffect(() => {
    if (confirmDelete === undefined) return
    const timer = setTimeout(() => { setConfirmDelete(undefined) }, CONFIRM_MS)
    return () => { clearTimeout(timer) }
  }, [confirmDelete])

  // The menu closes on any click outside it, which is what a rail menu has to do.
  useEffect(() => {
    if (menuFor === undefined) return
    const close = (): void => { setMenuFor(undefined) }
    document.addEventListener('pointerdown', close)
    return () => { document.removeEventListener('pointerdown', close) }
  }, [menuFor])

  const stepCardId = focus?.kind === 'step' ? active?.steps[focus.index]?.cardId : undefined
  const focusCardId = focus?.kind === 'card' ? focus.cardId : stepCardId
  const focusCardMissing = focusCardId !== undefined && !facts.some(fact => fact.id === focusCardId)
  const chainOfActive = run.chain !== undefined && active !== undefined && run.chain.pipelineId === active.id
    ? run.chain
    : undefined

  const writeSteps = useCallback(async (steps: readonly WorkbenchPipelineStep[]) => {
    if (active === undefined) return
    await pipelines.setSteps(active.id, steps)
  }, [active, pipelines])

  const addStep = useCallback(async (cardId: string) => {
    if (active === undefined) return
    if (active.steps.some(step => step.cardId === cardId)) {
      setPickerNote(t('pipeDuplicateStep'))
      return
    }
    setPickerNote(undefined)
    setPickerOpen(false)
    const next = [...active.steps, { cardId }]
    await writeSteps(next)
    setFocus({ kind: 'step', pipelineId: active.id, index: next.length - 1 })
    setTab('activity')
  }, [active, t, writeSteps])

  const moveStep = useCallback(async (index: number, by: number) => {
    if (active === undefined) return
    const target = index + by
    if (target < 0 || target >= active.steps.length) return
    const next = [...active.steps]
    const moved = next[index]
    const displaced = next[target]
    if (moved === undefined || displaced === undefined) return
    next[index] = displaced
    next[target] = moved
    await writeSteps(next)
    // Focus follows the step the user moved, which is where their attention is.
    setFocus({ kind: 'step', pipelineId: active.id, index: target })
  }, [active, writeSteps])

  const removeStep = useCallback(async (index: number) => {
    if (active === undefined) return
    const next = active.steps.filter((_unused, at) => at !== index)
    await writeSteps(next)
    setFocus(undefined)
  }, [active, writeSteps])

  const createPipeline = useCallback(async () => {
    const id = await pipelines.create(`${t('pipeRail')} ${String(pipelines.pipelines.length + 1)}`)
    if (id !== undefined) {
      setActiveId(id)
      setFocus(undefined)
    }
  }, [pipelines, t])

  const notice = pipelines.notice === 'conflict'
    ? t('mergedElsewhere')
    : pipelines.notice ?? pipelines.reason

  const running = chainOfActive?.phase === 'running'

  return (
    <div className={css.shell}>
      <aside className={css.rail} aria-label={t('pipeRail')}>
        <div className={css.railHead}>
          <span className={css.railTitle}>{t('pipeRail')}</span>
          <button type="button" className={css.railAction} onClick={() => { void createPipeline() }}>
            ＋ {t('pipeNew')}
          </button>
        </div>
        {pipelines.pipelines.length === 0
          ? (
            <p className={css.railEmpty}>
              {pipelines.phase === 'loading' ? t('skillCardLoading') : t('pipeEmptyTitle')}
            </p>
          )
          : (
            <ul className={css.railList}>
              {pipelines.pipelines.map((pipeline) => {
                const selected = pipeline.id === active?.id
                const armed = confirmDelete === pipeline.id
                return (
                  <li key={pipeline.id} data-pipeline-row={pipeline.id}>
                    {renaming === pipeline.id
                      ? (
                        <PipelineRename
                          initial={pipeline.name}
                          label={t('pipeRename')}
                          onCommit={(name) => { setRenaming(undefined); void pipelines.rename(pipeline.id, name) }}
                          onCancel={() => { setRenaming(undefined) }}
                        />
                      )
                      : (
                        <div className={selected ? `${css.railRow} ${css.railRowActive}` : css.railRow}>
                          <button
                            type="button"
                            className={css.railRowMain}
                            data-select-pipeline={pipeline.id}
                            aria-pressed={selected}
                            onClick={() => {
                              setActiveId(pipeline.id)
                              setFocus(undefined)
                              setTab('activity')
                            }}
                          >
                            <span className={css.railRowName}>{pipeline.name}</span>
                            <span className={css.railCount}>
                              {t('pipeStepCount', { count: pipeline.steps.length })}
                            </span>
                          </button>
                          <button
                            type="button"
                            className={css.menuBtn}
                            aria-haspopup="menu"
                            aria-expanded={menuFor === pipeline.id}
                            aria-label={t('pipeRename')}
                            onClick={(event) => {
                              event.stopPropagation()
                              setMenuFor(menuFor === pipeline.id ? undefined : pipeline.id)
                            }}
                          >
                            ⋯
                          </button>
                          {menuFor === pipeline.id
                            ? (
                              <div
                                className={css.menu}
                                role="menu"
                                // The outside-click listener must not close the menu on the
                                // click that is about to choose a row in it.
                                onPointerDown={event => { event.stopPropagation() }}
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  className={css.menuRow}
                                  onClick={() => { setMenuFor(undefined); setRenaming(pipeline.id) }}
                                >
                                  {t('pipeRename')}
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className={`${css.menuRow} ${css.menuRowDanger}`}
                                  onClick={() => {
                                    if (!armed) {
                                      setConfirmDelete(pipeline.id)
                                      return
                                    }
                                    setMenuFor(undefined)
                                    setConfirmDelete(undefined)
                                    void pipelines.remove(pipeline.id)
                                    if (active?.id === pipeline.id) setFocus(undefined)
                                  }}
                                >
                                  {armed ? t('pipeDeleteConfirm') : t('pipeDelete')}
                                </button>
                              </div>
                            )
                            : null}
                        </div>
                      )}
                  </li>
                )
              })}
            </ul>
          )}

        <div className={css.railHead}>
          <span className={css.railTitle}>{t('pipeTasks')}</span>
          <button type="button" className={css.railAction} onClick={onCreateCard}>
            ＋ {t('createCard')}
          </button>
        </div>
        <ul className={css.railList}>
          {facts.map(fact => (
            <li key={fact.id}>
              <button
                type="button"
                className={focus?.kind === 'card' && focus.cardId === fact.id
                  ? `${css.railRow} ${css.railRowActive} ${css.railRowTask}`
                  : `${css.railRow} ${css.railRowTask}`}
                data-select-card={fact.id}
                aria-pressed={focus?.kind === 'card' && focus.cardId === fact.id}
                onClick={() => { setFocus({ kind: 'card', cardId: fact.id }); setTab('activity') }}
              >
                <span className={css.railRowName}>{labelOf(fact.id)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className={css.canvas} aria-label={active?.name ?? t('pipeRail')}>
        {active === undefined
          ? (
            <div className={css.empty}>
              <h2 className={css.emptyTitle}>{t('pipeEmptyTitle')}</h2>
              <p className={css.emptyBody}>{t('pipeEmptyBody')}</p>
              <button type="button" className={css.primaryBtn} onClick={() => { void createPipeline() }}>
                ＋ {t('pipeNew')}
              </button>
            </div>
          )
          : (
            <>
              <header className={css.canvasHead}>
                <div className={css.canvasTitleGroup}>
                  <h2 className={css.canvasTitle}>{active.name}</h2>
                  <span className={css.canvasMeta}>{t('pipeStepCount', { count: active.steps.length })}</span>
                </div>
                <div className={css.runBar}>
                  {running
                    ? (
                      <button type="button" className={css.stopBtn} onClick={run.stop}>
                        {t('pipeStop')}
                      </button>
                    )
                    : (
                      <button
                        type="button"
                        className={css.primaryBtn}
                        disabled={active.steps.length === 0}
                        onClick={() => { run.runAll(active); setTab('activity') }}
                      >
                        {t('pipeRunAll')}
                      </button>
                    )}
                </div>
              </header>

              {chainOfActive === undefined ? null : <ChainStatus chain={chainOfActive} pipeline={active} labelOf={labelOf} t={t} />}

              {active.steps.length === 0
                ? <p className={css.canvasHint}>{t('pipeNoSteps')}</p>
                : (
                  <ol className={css.stepList}>
                    {active.steps.map((step, index) => (
                      <StepNode
                        key={`${step.cardId}-${String(index)}`}
                        index={index}
                        step={step}
                        label={labelOf(step.cardId)}
                        missing={!facts.some(fact => fact.id === step.cardId)}
                        selected={focus?.kind === 'step' && focus.pipelineId === active.id && focus.index === index}
                        outcome={chainOfActive?.steps[index]}
                        running={running}
                        last={index === active.steps.length - 1}
                        onSelect={() => { setFocus({ kind: 'step', pipelineId: active.id, index }); setTab('activity') }}
                        onRun={() => { run.runOne(active, index); setTab('activity') }}
                        onUp={index === 0 ? undefined : () => { void moveStep(index, -1) }}
                        onDown={index === active.steps.length - 1 ? undefined : () => { void moveStep(index, 1) }}
                        onRemove={() => { void removeStep(index) }}
                        t={t}
                      />
                    ))}
                  </ol>
                )}

              {pickerOpen
                ? (
                  <div className={css.picker}>
                    <div className={css.pickerHead}>{t('pipePickerTitle')}</div>
                    {facts.length === 0
                      ? <p className={css.pickerEmpty}>{t('pipePickerEmpty')}</p>
                      : facts.map(fact => (
                        <button
                          key={fact.id}
                          type="button"
                          className={css.pickerRow}
                          data-pick-card={fact.id}
                          onClick={() => { void addStep(fact.id) }}
                        >
                          {labelOf(fact.id)}
                        </button>
                      ))}
                    <button type="button" className={css.linkBtn} onClick={() => { setPickerOpen(false); setPickerNote(undefined) }}>
                      {t('createCardCancel')}
                    </button>
                  </div>
                )
                : (
                  <button
                    type="button"
                    className={css.addStep}
                    onClick={() => { setPickerOpen(true); setPickerNote(undefined) }}
                  >
                    ＋ {t('pipeNewStep')}
                  </button>
                )}
              {pickerNote === undefined ? null : <p className={css.canvasHint}>{pickerNote}</p>}
            </>
          )}
      </section>

      <section className={css.inspector} aria-label={active?.name ?? t('pipeRail')}>
        <div className={css.tabs} role="tablist" aria-label={active?.name ?? t('pipeRail')}>
          {(['activity', 'config', 'result'] as const).map(entry => (
            <button
              key={entry}
              type="button"
              role="tab"
              id={`workbench-pipeline-tab-${entry}`}
              aria-selected={tab === entry}
              aria-controls={`workbench-pipeline-panel-${entry}`}
              tabIndex={tab === entry ? 0 : -1}
              className={tab === entry ? `${css.tab} ${css.tabActive}` : css.tab}
              data-tab={entry}
              onClick={() => { setTab(entry) }}
            >
              {t(entry === 'activity' ? 'pipeTabActivity' : entry === 'config' ? 'pipeTabConfig' : 'pipeTabResult')}
            </button>
          ))}
        </div>
        <div
          className={css.tabBody}
          role="tabpanel"
          id={`workbench-pipeline-panel-${tab}`}
          aria-labelledby={`workbench-pipeline-tab-${tab}`}
        >
          {notice === undefined ? null : <p className={css.notice}>{notice}</p>}
          {focusCardId === undefined
            ? (
              <div className={css.noFocus}>
                <h3 className={css.emptyTitle}>{t('pipeNoFocusTitle')}</h3>
                <p className={css.emptyBody}>{t('pipeNoFocusBody')}</p>
              </div>
            )
            : focusCardMissing
              ? <p className={css.canvasHint}>{t('pipeMissingCard')}</p>
              : renderCard(
                  focusCardId,
                  tab === 'activity' ? 'runs' : tab === 'config' ? 'config' : 'result',
                  () => { setTab('activity') },
                )}
        </div>
      </section>
    </div>
  )
}

/** Props of one canvas node. */
interface StepNodeProps {
  /** Position in the pipeline, zero-based. */
  readonly index: number
  /** The step itself. */
  readonly step: WorkbenchPipelineStep
  /** The card's label. */
  readonly label: string
  /** Whether the card behind this step is gone. */
  readonly missing: boolean
  /** Whether the inspector is showing this step. */
  readonly selected: boolean
  /** How this step stands in the current chain, when one is on screen. */
  readonly outcome: ChainStepOutcome | undefined
  /** Whether the chain is running, which hides the per-step controls. */
  readonly running: boolean
  /** Whether this is the last step. */
  readonly last: boolean
  /** Focus it in the inspector. */
  readonly onSelect: () => void
  /** Run this step alone. */
  readonly onRun: () => void
  /** Move it earlier; absent on the first step. */
  readonly onUp?: (() => void) | undefined
  /** Move it later; absent on the last step. */
  readonly onDown?: (() => void) | undefined
  /** Take it out of the pipeline. */
  readonly onRemove: () => void
  /** Translator. */
  readonly t: WorkbenchPipelineProps['t']
}

/**
 * Render one step of the canvas.
 * @param props - the step, its chain outcome, and its controls.
 * @returns the node element.
 */
function StepNode(props: StepNodeProps): ReactNode {
  const { index, step, label, missing, selected, outcome, running, last, onSelect, onRun, onUp, onDown, onRemove, t } = props
  const phase = outcome?.phase ?? 'idle'
  const chip = chipOf(phase, t)
  return (
    <li
      className={selected ? `${css.step} ${css.stepSelected}` : css.step}
      data-step-index={index}
      data-step-phase={phase}
    >
      <div className={css.stepRow}>
        <button type="button" className={css.stepBadge} onClick={onSelect} aria-label={`${String(index + 1)}. ${label}`}>
          {String(index + 1)}
        </button>
        <button type="button" className={css.stepMain} onClick={onSelect} aria-pressed={selected}>
          <span className={missing ? `${css.stepName} ${css.stepNameMissing}` : css.stepName}>{label}</span>
          <span className={css.stepSub}>
            <span className={`${css.chip} ${chip.className}`}>{chip.text}</span>
            {outcome?.tookMs === undefined ? null : (
              <span className={css.stepTook}>{tookOf(outcome.tookMs)}</span>
            )}
            {step.instruction === undefined ? null : <span className={css.stepAsk}>{step.instruction}</span>}
          </span>
        </button>
      </div>
      {running
        ? null
        : (
          <div className={css.stepTools}>
            <button type="button" className={css.toolBtn} data-run-step={index} onClick={onRun}>
              {t('pipeRunStep')}
            </button>
            {onUp === undefined ? null : (
              <button type="button" className={css.toolBtn} aria-label={t('pipeStepUp')} onClick={onUp}>↑</button>
            )}
            {onDown === undefined ? null : (
              <button type="button" className={css.toolBtn} aria-label={t('pipeStepDown')} onClick={onDown}>↓</button>
            )}
            <button type="button" className={css.toolBtn} aria-label={t('pipeStepRemove')} onClick={onRemove}>✕</button>
          </div>
        )}
      {last ? null : <span className={css.connector} aria-hidden="true" />}
    </li>
  )
}

/**
 * Describe one chain step's state as a chip.
 * @param phase - the step's phase.
 * @param t - translator.
 * @returns the chip's text and class.
 */
function chipOf(phase: ChainStepOutcome['phase'], t: WorkbenchPipelineProps['t']): { text: string; className: string | undefined } {
  switch (phase) {
    case 'running':
      return { text: t('statusOngoing'), className: css.chipRunning }
    case 'done':
      return { text: t('statusDone'), className: css.chipDone }
    case 'failed':
      return { text: t('statusError'), className: css.chipFailed }
    case 'stopped':
      return { text: t('pipeStop'), className: css.chipStopped }
    case 'queued':
      // A queued step is one the chain has not reached yet; it is waiting, not idle.
      return { text: t('statusOngoing'), className: css.chipQueued }
    default:
      return { text: t('statusIdle'), className: css.chipIdle }
  }
}

/** Props of the chain summary line under the canvas head. */
interface ChainStatusProps {
  /** The chain on screen. */
  readonly chain: PipelineChain
  /** The pipeline it belongs to. */
  readonly pipeline: WorkbenchPipeline
  /** Card label lookup. */
  readonly labelOf: (cardId: string) => string
  /** Translator. */
  readonly t: WorkbenchPipelineProps['t']
}

/**
 * Render the one-line summary of the chain: which step is running, or how it ended.
 * @param props - the chain, its pipeline, the label lookup, and `t`.
 * @returns the summary element.
 */
function ChainStatus(props: ChainStatusProps): ReactNode {
  const { chain, pipeline, labelOf, t } = props
  const total = pipeline.steps.length
  if (chain.phase === 'running' && chain.activeIndex !== undefined) {
    const step = pipeline.steps[chain.activeIndex]
    return (
      <p className={css.chainLine} role="status">
        {t('pipeRunning', {
          index: chain.activeIndex + 1,
          total,
          name: step === undefined ? '' : labelOf(step.cardId),
        })}
      </p>
    )
  }
  if (chain.phase === 'failed' && chain.failureIndex !== undefined) {
    return (
      <p className={`${css.chainLine} ${css.chainLineFailed}`} role="status">
        {t('pipeFailedAt', { index: chain.failureIndex + 1, reason: chain.failure ?? t('statusError') })}
      </p>
    )
  }
  if (chain.phase === 'stopped') {
    return <p className={css.chainLine} role="status">{t('pipeStop')}</p>
  }
  const ran = chain.steps.filter(step => step.phase === 'done').length
  return <p className={css.chainLine} role="status">{t('pipeSettled', { count: ran })}</p>
}

/** Props of the inline rename field. */
interface PipelineRenameProps {
  /** Name the field starts with. */
  readonly initial: string
  /** Accessible label. */
  readonly label: string
  /** Commit the typed name. */
  readonly onCommit: (name: string) => void
  /** Abandon the rename. */
  readonly onCancel: () => void
}

/**
 * Render the rail's inline rename field.
 * @param props - the starting name and the two outcomes.
 * @returns the field element.
 */
function PipelineRename(props: PipelineRenameProps): ReactNode {
  const { initial, label, onCommit, onCancel } = props
  const [value, setValue] = useState(initial)
  const ref = useRef<HTMLInputElement | null>(null)
  // Escape unmounts the field, and unmounting fires blur — which would commit the very
  // name the user just abandoned. The flag is what tells the two apart.
  const abandoned = useRef(false)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  return (
    <input
      ref={ref}
      className={css.renameInput}
      aria-label={label}
      value={value}
      onChange={(event) => { setValue(event.target.value) }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onCommit(value)
        if (event.key === 'Escape') {
          abandoned.current = true
          onCancel()
        }
      }}
      onBlur={() => {
        if (abandoned.current) return
        onCommit(value)
      }}
    />
  )
}

