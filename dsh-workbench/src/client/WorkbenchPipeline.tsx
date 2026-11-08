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
import type { PipelineRunEntry, PipelineStand, RunScopeRow, StepProduct } from './pipeline/pipeline-view.ts'
import {
  canStartAt,
  formatBytes,
  formatDuration,
  formatWhen,
  phaseOfResult,
  productOf,
  resultDirectory,
  resumeFrom,
  runScopeOf,
  runScopeRows,
  standOf,
  stateView,
} from './pipeline/pipeline-view.ts'
import type { WorkbenchCardFact } from './layout-store.ts'
import type { WorkbenchPipeline, WorkbenchPipelineStep } from '../pipeline-contract.ts'
import type { WorkbenchSkillCatalogEntry } from '../skill-card-contract.ts'
import type { WorkbenchCatalogStatus } from './skill-card/controller.ts'
import { pickOpenPipeline, readOpenPipeline, rememberOpenPipeline } from './pipeline-memory.ts'
import type { WorkbenchPipelineRunsFace } from './pipeline-runs.ts'
import { filledTemplate } from './skill-card/render.ts'
import { findRegion } from './skill-card/template.ts'
import { ShadowHtml } from './skill-card/ShadowHtml.tsx'
import type {
  WorkbenchCardConfigView,
  WorkbenchCardResult,
  WorkbenchFilesRead,
  WorkbenchSkillCardApi,
} from './skill-card/api.ts'
import { permissionLabelKey } from './skill-card/permission.ts'
import { resultHtml } from './skill-card/render.ts'
import type { WorkbenchLocaleKey } from './locales.ts'
import { modelKey, parseModelKey, type WorkbenchModelGroup } from './skill-card/model.ts'

import type { WorkbenchActivityEntry, WorkbenchCardModel, WorkbenchCardWorkspace, WorkbenchFileEntry, WorkbenchSandboxMode } from '../skill-card-contract.ts'
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
  /** Stored execution records, for the 运行记录 the canvas opens. */
  readonly runs: WorkbenchPipelineRunsFace
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
  readonly renderCard: (cardId: string, view: CardView, onBack: () => void, openFile?: string) => ReactNode
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
  readonly createCardForSkill: (
    skill: string,
  ) => Promise<{ readonly cardId: string } | { readonly reason: string }>
  /** Remove one card this panel made, when the step it was made for was refused. */
  readonly removeCard: (cardId: string) => Promise<boolean>
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
  /** Store one card's template, exactly as the user typed it. */
  readonly saveStepTemplate: (cardId: string, html: string, skill: string) => Promise<boolean>
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
 * What the preview puts where the model will write.
 *
 * Inline-styled on purpose: it is rendered inside the card's own shadow root, where the
 * workbench's stylesheet does not reach and the template's rules would restyle it. The words
 * come from the locale, because this note is read by a person, not by the template.
 *
 * The shape depends on where the region sits. A `div` inside `tbody` is not a table row, and a
 * parser asked to make sense of one lifts it out of the table entirely — which is how the note
 * ends up above the header it belongs under. So a region inside a table becomes a row.
 * @param template - the stored template, used only to read the region's surroundings.
 * @param region - the label for the region, e.g. "区域内容".
 * @param body - what happens to the region at run time.
 * @returns the placeholder markup, valid where the region is.
 */
function regionPlaceholder(template: string, region: string, body: string): string {
  const chip = 'display:inline-block;padding:2px 7px;border-radius:5px;background:rgba(128,131,138,0.14);font-family:ui-monospace,monospace;font-size:11px'
  const text = 'font-size:11px;color:#8a8f98'
  const box = 'margin:12px 0;padding:12px;border:1px dashed rgba(128,131,138,0.5);border-radius:8px'
  const note = `<div style="${box}"><span style="${chip}">${escapeHtml(region)}</span> <span style="${text}">${escapeHtml(body)}</span></div>`
  const bounds = findRegion(template)
  if (bounds === undefined) return note
  const before = template.slice(0, bounds.start).toLowerCase()
  const open = (tag: string): boolean => before.split(`<${tag}`).length > before.split(`</${tag}`).length
  // The span has to be the table's real column count. A bigger number does not "span everything":
  // it adds columns, each column then gets a share of the width, the header cells collapse to a
  // few pixels and their unwrapped text draws over its neighbour.
  const span = columnCount(template)
  if (open('td') || open('th')) return `<td colspan="${span}" style="padding:4px">${note}</td>`
  if (open('tr') || open('tbody') || open('thead') || open('table')) {
    return `<tr><td colspan="${span}" style="padding:4px">${note}</td></tr>`
  }
  return note
}

/**
 * How many columns the template's table has.
 * @param template - the stored template.
 * @returns the header cell count, else the colgroup count, else the first row's, at least 1.
 */
function columnCount(template: string): number {
  const cells = (scope: string): number => (scope.match(/<t[hd][\s>]/gi) ?? []).length
  const head = /<thead[\s\S]*?<\/thead>/i.exec(template)?.[0] ?? ''
  const fromHead = cells(head)
  if (fromHead > 0) return fromHead
  const fromCols = (template.match(/<col[\s>]/gi) ?? []).length
  if (fromCols > 0) return fromCols
  const row = /<tr[\s\S]*?<\/tr>/i.exec(template)?.[0] ?? ''
  const fromRow = cells(row)
  return Math.max(1, Math.min(24, fromRow > 0 ? fromRow : 1))
}

/**
 * Escape the three characters that would end the text early inside a generated document.
 * @param text - a locale string.
 * @returns it, safe to splice into HTML.
 */
function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
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
  /**
   * What the run in flight has done so far; absent once it is over.
   *
   * A running step has no stored result yet, so this is the only trace there is while it
   * works. The stored result takes over the moment the step settles.
   */
  readonly live: readonly WorkbenchActivityEntry[] | undefined
  /** Which run of this pipeline last produced the step's product, when one is known. */
  readonly runNo: number | undefined
  /** What that run covered: the whole chain, this step, or this step again on request. */
  readonly runScope: 'full' | 'single' | 'refine' | undefined
}

/**
 * Render the pipeline workbench.
 * @param props - stored pipelines, run engine, cards, transport, card views, and `t`.
 * @returns the two-column surface with its overlays.
 */
export function WorkbenchPipeline(props: WorkbenchPipelineProps): ReactNode {
  const {
    pipelines, runs: recordedRuns, run, facts, api, renderCard, onCreateCard, t,
    catalog, catalogStatus, catalogFailure, onCatalogNeeded, createCardForSkill, renameStepCard,
    patchStepCards, modelGroups, workspacePicker, saveStepTemplate, removeCard,
  } = props
  // Seeded from what the panel last showed, so the first render after a remount is already
  // the right pipeline rather than the first stored one flashing and then correcting.
  const [activeId, setActiveId] = useState<string | undefined>(() => readOpenPipeline())
  const [focus, setFocus] = useState<Focus | undefined>(undefined)
  const [tab, setTab] = useState<InspectorTab>('activity')
  const [cards, setCards] = useState<readonly WorkbenchCardConfigView[]>([])
  const [results, setResults] = useState<readonly WorkbenchCardResult[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  /** Whether the run button's range menu is open; the button itself is always there. */
  const [runMenu, setRunMenu] = useState(false)
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
  /** Why the step the user just picked was not added, stated in the picker that asked. */
  const [pickerProblem, setPickerProblem] = useState<string | undefined>(undefined)
  // `file` is the file the result tab asked to see: the reader opens the card's result view,
  // and that view's template decides whether it starts on this file or on its own default.
  const [reader, setReader] = useState<
    { readonly cardId: string; readonly file?: string } | undefined
  >(undefined)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyAt, setHistoryAt] = useState<number | undefined>(undefined)
  const [review, setReview] = useState<{ readonly cardId: string } | undefined>(undefined)
  const [reviewText, setReviewText] = useState('')

  // Which pipeline is open is remembered across mounts and restarts: the panel is one mount
  // of the page, and opening a card and coming back would otherwise land on the first stored
  // pipeline again. The remembered id is only a hint — `pickOpenPipeline` falls back to the
  // most recently changed one, so a deleted pipeline never leaves the canvas blank.
  const active = useMemo<WorkbenchPipeline | undefined>(
    () => pickOpenPipeline(pipelines.pipelines, activeId),
    [activeId, pipelines.pipelines],
  )
  const activeKey = active?.id
  useEffect(() => {
    if (activeKey === undefined) return
    // Written from what is actually on screen, so the memory follows a fallback, a create and
    // a deletion without any of those paths having to remember to keep it.
    rememberOpenPipeline(activeKey)
  }, [activeKey])

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
    if (!menuOpen && !runMenu && stepMenu === undefined) return
    const close = (event: PointerEvent): void => {
      const from = event.target
      if (from instanceof Element && from.closest('[data-title-menu], [data-step-menu], [data-run-menu], [data-run-split]') !== null) return
      setMenuOpen(false)
      setRunMenu(false)
      setStepMenu(undefined)
      setConfirmRemove(undefined)
    }
    document.addEventListener('pointerdown', close)
    return () => { document.removeEventListener('pointerdown', close) }
  }, [menuOpen, runMenu, stepMenu])

  // A range menu names a start point and what it costs; a run that started without it, or a
  // pipeline that changed under it, leaves it describing a chain that is no longer there.
  useEffect(() => { setRunMenu(false) }, [active?.id])

  // Menus are overlays too, and Escape is the key a keyboard user reaches for: one handler
  // closes whatever is open, so nothing opens by keyboard and only closes by mouse.
  const anyOverlay = reader !== undefined || historyOpen || review !== undefined || picker !== undefined
    || menuOpen || runMenu || stepMenu !== undefined
  useEffect(() => {
    if (!anyOverlay) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      setReader(undefined)
      setHistoryOpen(false)
      setReview(undefined)
      setPicker(undefined)
      setMenuOpen(false)
      setRunMenu(false)
      setStepMenu(undefined)
      setConfirmRemove(undefined)
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [anyOverlay])

  const chain = run.chain !== undefined && active !== undefined && run.chain.pipelineId === active.id
    ? run.chain
    : undefined
  // A run on its way out is still running. `stopping` is not a fourth state of its own: it
  // is what the run reports between the stop being asked for and the run admitting it.
  const stopping = chain?.phase === 'stopping'
  const running = chain?.phase === 'running' || stopping
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
      // The run in this panel knows how each of its steps ended. Without one — a page that
      // was reopened, a run this panel never saw — the stored result states it, and its
      // verdict is what the state is read from. A record exists for a failed run too, so
      // "there is a result" would report a step that produced nothing as finished: that is
      // how a step whose run died on a 429 kept its ✓ while the result page said 已失败.
      const phase: PipelineStepPhase = chainStep !== undefined && chainStep.phase !== 'idle'
        ? chainStep.phase
        : phaseOfResult(result)
      const producing = history.find(entry => entry.steps.some(
        item => item.cardId === step.cardId && item.phase === 'done',
      ))
      // The run history lives in this page, so it is gone after a reload — but the product
      // itself records what produced it. Reading the fallback here is what keeps a step run
      // alone from being reported as an unexplained result once the page is young again.
      const keptScope = result?.pipeline?.id === active.id ? result.pipeline.scope : undefined
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
        live: chainStep?.activity,
        runNo: producing?.no,
        runScope: producing?.scope ?? keptScope,
      }
    })
  }, [active, cards, chain, history, labelOf, resultOf])

  const selectedIndex = focus?.kind === 'step' ? focus.index : 0
  const selected = stepViews[selectedIndex]
  // The badge counts what the tab is about to show, so a step in flight carries a count too.
  const traceCount = selected === undefined ? 0 : (selected.live ?? selected.result?.activity ?? []).length

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

  const writeSteps = useCallback(async (steps: readonly WorkbenchPipelineStep[]): Promise<boolean> => {
    if (active === undefined) return false
    return await pipelines.setSteps(active.id, steps)
  }, [active, pipelines])

  /**
   * Put one card into the pipeline at a slot.
   *
   * The picker closes only after the steps are stored: a step that failed to write would
   * otherwise leave the dialog gone and the canvas unchanged, which reads as a click that
   * did nothing at all.
   * @param cardId - the card the step runs.
   * @param at - zero-based slot.
   * @returns whether the steps were stored.
   */
  const insertStep = useCallback(async (cardId: string, at: number): Promise<boolean> => {
    if (active === undefined) return false
    if (active.steps.some(step => step.cardId === cardId)) return false
    const next = [...active.steps]
    next.splice(at, 0, { cardId })
    const written = await writeSteps(next)
    if (!written) return false
    setPicker(undefined)
    setPickerQuery('')
    setFocus({ kind: 'step', index: at })
    return true
  }, [active, writeSteps])

  /** Open the picker at one slot, and make sure the skills it lists are the current ones. */
  const openPicker = useCallback((at: number) => {
    onCatalogNeeded()
    setPicker({ at })
    setPickerQuery('')
    // A reason stated for the previous attempt belongs to that attempt, not to this one.
    setPickerProblem(undefined)
  }, [onCatalogNeeded])

  /**
   * Turn one picked skill into a step: the card is what carries the skill, so the card is
   * made first and the step is the new card's place in the pipeline.
   * @param skill - the picked skill.
   */
  const addSkillStep = useCallback(async (skill: string) => {
    if (picker === undefined) return
    const at = picker.at
    setPickerProblem(undefined)
    const made = await createCardForSkill(skill)
    // What the Host said, in its own words: a card that could not be made is the reason the
    // step is missing, and it is the only thing that can tell a user what to do about it.
    if ('reason' in made) {
      setPickerProblem(t('pipeAddProblem', { reason: made.reason }))
      return
    }
    if (await insertStep(made.cardId, at)) return
    // The card is not a step: take it back, so a click that fails leaves nothing behind and
    // the next click does not add one more orphan card to the board.
    await removeCard(made.cardId)
    setPickerProblem(t('pipeAddProblem', { reason: t('pipeCfgWriteFailed') }))
  }, [createCardForSkill, insertStep, picker, removeCard, t])

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

  /**
   * Write one field into one step's card.
   *
   * Skill and instruction are the step's own: a step that is 详细设计 must not be able to
   * change what the step before it runs, and must not be shown the other step's answer.
   * @param cardId - the step's card.
   * @param patch - the field to store.
   */
  const applyStepPatch = useCallback((cardId: string, patch: StepCardPatch) => {
    void patchStepCards([cardId], patch).then((written) => {
      if (!written) {
        setConfigProblem(t('pipeCfgWriteFailed'))
        return
      }
      setConfigProblem(undefined)
      void reload()
    })
  }, [patchStepCards, reload, t])

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

  // Whether the chain on screen is a run of the whole pipeline or of one step. The chain's
  // own scope answers it: counting the steps it touched cannot, because a run of the only
  // step of a one-step pipeline touches them all without being a run of the pipeline.
  const chainWhole = chain !== undefined && active !== undefined
    && chain.pipelineId === active.id
    && chain.scope === 'full'

  // The stop is the run button's other state, and each run has exactly one of it: the
  // header's button for a run of the whole pipeline, the step's own button for a run of one
  // step. Neither ever appears next to the other.
  const wholeInFlight = running && chainWhole
  /** The step running alone right now, when it is the one the panel is showing. */
  const soloHere = running && chain !== undefined && !chainWhole
    ? chain.activeIndex
    : undefined
  const stopTitle = stopping ? t('pipeStoppingHint') : t('pipeStopWholeHint')
  /** Whether the step the inspector shows is the one running alone, which owns the stop. */
  const soloRunning = soloHere !== undefined && soloHere === selected?.index
  const runOneTitle = soloRunning
    ? (stopping ? t('pipeStoppingHint') : t('pipeStopSoloHint'))
    : running ? t('pipeRunOneBusyHint') : t('pipeRunOneHint')
  /** The word this chain's next whole run travels under: 运行 / 接着跑 / 重跑. */
  const runWord = (word: 'run' | 'resume' | 'again'): WorkbenchLocaleKey => (
    word === 'run' ? 'pipeRunAll' : word === 'resume' ? 'pipeRunResume' : 'pipeRunAgain'
  )
  /**
   * One range menu row, in words.
   *
   * Two sentences in a fixed order — the steps it covers, then what it replaces — because
   * the second one is what a re-run actually costs. The badge marks the row the button
   * itself performs, so the menu explains the button instead of contradicting it.
   * @param row - the row's numbers.
   * @returns its title, its second line, and whether it is the default.
   */
  const scopeRowOf = (row: RunScopeRow): { title: string; note: string; badge: boolean } => {
    const title = row.kind === 'all'
      ? t('pipeRunScopeAll')
      : row.kind === 'resume'
        // 菜单里的每一行都在回答"跑哪一段"，所以这里说「从头跑」，而不是按钮自己那个
        // 名字「运行」——那是控件的名字，不是一段范围的名字。
        ? t(row.at === 0 ? 'pipeRunScopeStart' : 'pipeRunResume')
        : t('pipeRunScopeFrom', { at: row.at + 1 })
    const range = row.first === row.last
      ? t('pipeRunScopeOneStep', { at: row.first })
      : t('pipeRunScopeSteps', { from: row.first, to: row.last })
    const cost = row.replacing === 0 ? t('pipeRunScopeFree') : t('pipeRunScopeCost', { count: row.replacing })
    return { title, note: `${range} · ${cost}`, badge: row.at === scope.at }
  }

  const stepCount = active?.steps.length ?? 0
  const doneCount = stepViews.filter(step => step.phase === 'done').length
  const failedAt = chain?.failureIndex ?? stepViews.findIndex(step => step.phase === 'failed')
  const stand = standOf({
    stepCount,
    doneCount,
    ...chain === undefined ? {} : { chain: { phase: chain.phase, whole: chainWhole } },
    runs: history,
    scopes: stepViews.map(step => step.runScope),
    failedAt: stepViews.findIndex(step => step.phase === 'failed'),
  })
  // Steps that hold a result but were not produced by a run of the whole chain. They are
  // what the run bar names, and what a resumed run will pass over.
  const alone = stepViews
    .filter(step => step.phase === 'done' && step.runScope !== 'full')
    .map(step => step.index + 1)
  const phases = stepViews.map(step => step.phase)
  const resumeAt = resumeFrom(phases)
  // What the run button would run, and what it calls itself. One reading feeds the button's
  // word, its default start and the menu's first row, so the three cannot drift apart.
  const scope = runScopeOf(phases)
  const scopeRows = runScopeRows({ phases, selected: selectedIndex })
  // The button's title says what pressing it will run, in the same word the button carries.
  const runAllTitle = running
    ? t('pipeRunAllBusyHint')
    : scope.word === 'run'
      ? t('pipeRunAllHint')
      : scope.word === 'resume' ? t('pipeRunResumeHint', { at: scope.at + 1 }) : t('pipeRunAgainHint')
  // The range menu is for a chain of steps that is not running: a run in flight has exactly
  // one thing to press, and it is not "some other range".
  const showScope = active !== undefined && stepCount > 0 && !running

  /**
   * Run the whole chain from one step.
   *
   * The only way a whole run starts, so the rule that a start needs its predecessors
   * finished lives here once: a step's own menu, the range menu's rows and the button all
   * arrive through this door, and a start that would leave the chain half-empty is refused
   * rather than performed.
   * @param at - zero-based step to start at.
   */
  const startAt = (at: number): void => {
    setRunMenu(false)
    if (active === undefined || running) return
    if (!canStartAt(phases, at)) return
    // The step before the first one this run takes, when it ran in this panel: the resumed
    // step continues that session instead of opening a cold one.
    const prior = at > 0 ? chain?.steps[at - 1]?.sessionId : undefined
    run.runAll(active, at, prior)
  }

  /**
   * How any stored pipeline stands, for the menu rows.
   *
   * The one on screen answers with the same reading the canvas title uses, so the row and
   * the title can never disagree; the others are read from their records alone.
   * @param pipeline - the pipeline to read.
   * @returns how it stands.
   */
  const standOfId = (pipeline: WorkbenchPipeline): PipelineStand => {
    if (pipeline.id === active?.id) return stand
    const mine = chain !== undefined && chain.pipelineId === pipeline.id ? chain : undefined
    const whole = mine !== undefined && mine.scope === 'full'
    const scopes = pipeline.steps.map(step => {
      const result = results.find(entry => entry.cardId === step.cardId)
      return result?.pipeline?.id === pipeline.id ? result.pipeline.scope : undefined
    })
    return standOf({
      stepCount: pipeline.steps.length,
      // A record that states a failure is not a product: counting it here is what let a
      // pipeline whose only run died read as 完成 in the switcher.
      doneCount: pipeline.steps.filter(step => results.some(
        entry => entry.cardId === step.cardId && entry.failure === undefined,
      )).length,
      ...mine === undefined ? {} : { chain: { phase: mine.phase, whole } },
      runs: run.history(pipeline.id),
      scopes,
      failedAt: pipeline.steps.findIndex(step => results.some(
        entry => entry.cardId === step.cardId && entry.failure !== undefined,
      )),
    })
  }

  /**
   * How long the run that finished the pipeline took.
   *
   * The steps' own durations added up, so the bar and the canvas cannot tell two different
   * stories about the same run; a pipeline with no timing reads as unknown, not as zero.
   */
  const runTook = chain !== undefined
    ? chain.phase === 'running'
      ? undefined
      : chain.steps.reduce<number | undefined>(
        (sum, step) => (step.tookMs === undefined ? sum : (sum ?? 0) + step.tookMs),
        undefined,
      )
    : history[0]?.tookMs

  /** What one run-bar segment is drawn as; `solo` is the hollow one. */
  const segState = (phase: PipelineStepPhase): string => (
    phase === 'done' && (stand === 'solo' || stand === 'kept') ? 'solo' : phase
  )

  /**
   * How a finished run reads in the run list.
   *
   * A chain's own word for its outcome ("settled") is not a word a reader knows, and the
   * list's colour rule is keyed on this smaller set, so the two are chosen together here.
   * @param phase - how the run ended.
   * @returns the colour key and the locale key that names it.
   */
  const runStateOf = (phase: PipelineRunEntry['phase']): { s: string; key: WorkbenchLocaleKey } => (
    phase === 'settled'
      ? { s: 'ok', key: 'pipeRunState_ok' }
      : phase === 'failed' ? { s: 'fail', key: 'pipeRunState_fail' }
        : phase === 'stopped' ? { s: 'stopped', key: 'pipeRunState_stopped' }
          : { s: 'running', key: 'pipeRunState_running' }
  )

  /**
   * What one run covered, named rather than numbered.
   *
   * A whole run lists the steps it took in order; a run of one step names that step, which
   * is the only thing that tells the two apart in a list of otherwise identical rows.
   * @param entry - the run.
   * @returns a phrase for the row.
   */
  const runScopeLabelOf = (entry: PipelineRunEntry): string => {
    if (entry.scope === 'full') return entry.steps.map(step => labelOf(step.cardId)).join(' → ')
    // A one-step run records that step and nothing else, so the record names it.
    const name = labelOf(entry.steps[0]?.cardId ?? '')
    return entry.scope === 'single' ? t('pipeScopeOnly', { name }) : t('pipeScopeRefined', { name })
  }

  /**
   * One run's header line: when, what it covered, how long, how it ended.
   * @param entry - the run, when one is open.
   * @returns the line, or nothing while no run is open.
   */
  const runMetaOf = (entry: PipelineRunEntry | undefined): string => entry === undefined
    ? ''
    : [
        formatWhen(entry.startedAt, Date.now()),
        runScopeLabelOf(entry),
        formatDuration(entry.tookMs),
        t(runStateOf(entry.phase).key),
      ].join(' · ')

  const metaOf = (pipeline: WorkbenchPipeline): string => {
    const runs = run.history(pipeline.id)
    const count = pipeline.steps.length
    if (count === 0) return t('pipeMetaNoSteps')
    // The chip above already says how the pipeline stands; this line is about the runs, so
    // with no run to name it says what the pipeline is made of and nothing more.
    if (runs.length === 0) return t('pipeMetaSteps', { count })
    return t('pipeMetaRan', {
      no: runs[0]?.no ?? 0,
      count,
      when: formatWhen(runs[0]?.startedAt ?? Date.now(), Date.now()),
    })
  }

  const runNoise = (): ReactNode => {
    if (stepCount === 0) return <span>{t('pipeNoSteps')}</span>
    if (stopping) {
      // 收尾中：既不是还在跑（已经喊停了），也不是停好了（还没落下来），所以单独一句。
      const at = (chain?.activeIndex ?? 0) + 1
      return (
        <span>
          {chainWhole
            ? t('pipeStoppingAt', { at, done: doneCount })
            : t('pipeStoppingOne', { at })}
        </span>
      )
    }
    if (stand === 'running') {
      const at = (chain?.activeIndex ?? 0) + 1
      // A step running on its own is not the pipeline running: saying "step 2 of 5" would
      // claim a queue that does not exist.
      return <span>{chainWhole ? t('pipeRunningStep', { at, count: stepCount }) : t('pipeRunningOne', { at })}</span>
    }
    if (stand === 'failed') {
      return <span>{t('pipeFailedAt', { done: doneCount, count: stepCount, at: (failedAt < 0 ? doneCount : failedAt) + 1 })}</span>
    }
    if (stand === 'stopped') {
      // 停在哪一步、再点「运行」会从哪一步接着跑：停机的位置和运行的起点是同一处算出来的，
      // 所以两句话不会互相矛盾。这一次运行不在屏幕上（记录里那次停过）时只报已有的那部分，
      // 不编一个停在哪一步。
      const cut = chain?.steps.findIndex(step => step.phase === 'stopped') ?? -1
      if (cut < 0) return <span>{t('pipeStoppedPlain', { done: doneCount, count: stepCount })}</span>
      return (
        <span>
          {t('pipeStopped', { done: doneCount, count: stepCount, at: cut + 1, from: resumeAt + 1 })}
        </span>
      )
    }
    if (stand === 'done') {
      // 整条完成，但各步的产物不一定来自同一次：重跑后半段之后，前几步还停在上一次。
      // 一个「完成」把这件事盖住，看结果的人就不知道手里这些东西是不是一套。
      const ages = stepViews.map(step => step.runNo).filter((no): no is number => no !== undefined)
      const newest = ages.length === 0 ? undefined : Math.max(...ages)
      const older = stepViews
        .filter(step => step.runNo !== undefined && newest !== undefined && step.runNo < newest)
        .map(step => step.index + 1)
      if (newest !== undefined && older.length > 0) {
        return (
          <>
            <span>{t('pipeBarMixedHead')}</span>
            <span>·</span>
            <span>
              {t('pipeBarMixedAges', {
                steps: older.join(t('pipeListSeparator')),
                was: Math.min(...ages),
                now: newest,
              })}
            </span>
            <span>·</span>
            <span>{t('pipeBarMixedNext')}</span>
          </>
        )
      }
      // 用时是这一步一步加起来的时间，和画布上每一步的时长同源；没有一步计时就只说完成了几步
      return <span>{runTook === undefined
        ? t('pipeAllDone', { count: stepCount })
        : t('pipeAllDoneAt', { count: stepCount, took: formatDuration(runTook) })}</span>
    }
    if (stand === 'idle') {
      return (
        <>
          <span>{t('pipeStand_idle')}</span>
          <span>·</span>
          <span>{t('pipeBarIdle', { count: stepCount })}</span>
        </>
      )
    }
    // Some steps hold results, the whole chain never ran here. Name those steps and say
    // where a run would start — the same rule the engine applies, read from resumeFrom.
    const which = stand === 'kept'
      ? t('pipeBarKeptWhich', { steps: alone.join(t('pipeListSeparator')) })
      : t('pipeBarSoloWhich', { steps: alone.join(t('pipeListSeparator')) })
    const next = doneCount === stepCount
      ? t('pipeBarSoloNextAll')
      : resumeAt === 0 ? t('pipeBarSoloNextFirst') : t('pipeBarSoloNextResume', { at: resumeAt + 1 })
    return (
      <>
        {stand === 'solo' ? <span>{t('pipeBarSoloHead')}</span> : null}
        {stand === 'solo' ? <span>·</span> : null}
        <span>{which}</span>
        <span>·</span>
        <span>{next}</span>
      </>
    )
  }

  const openReader = (cardId: string, file?: string): void => {
    setReader(file === undefined ? { cardId } : { cardId, file })
  }

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
        {/* 运行和它的范围是同一个控件：左边按下去跑默认的那一段，右半边那道缝后面
            才换范围。两个半块同高、共用一圈圆角——缝本身就在说"这里还能再选"。 */}
        <div
          className={css.runSplit}
          data-run-split=""
          data-open={runMenu && showScope ? '1' : '0'}
          data-caret={showScope ? '1' : '0'}
        >
          <button
            type="button"
            className={`${css.btn} ${wholeInFlight ? css.stop : css.primary}`}
            data-run-all=""
            data-stop={wholeInFlight ? '1' : '0'}
            data-word={wholeInFlight ? 'stop' : scope.word}
            disabled={stopping || active === undefined || active.steps.length === 0 || (running && !chainWhole)}
            aria-label={wholeInFlight ? stopTitle : runAllTitle}
            title={wholeInFlight ? stopTitle : runAllTitle}
            onClick={() => {
              // The same button both ways: a run in flight is stopped where it was started,
              // so the reader never has to look for a second control to make this one stop.
              if (wholeInFlight) { run.stop(); return }
              startAt(scope.at)
            }}
          >
            {wholeInFlight ? MARK.stop : MARK.play}
            <span className={css.headLabel}>
              {wholeInFlight
                ? (stopping ? t('pipeStopping') : t('pipeStop'))
                : t(runWord(scope.word))}
            </span>
          </button>
          {showScope
            ? (
              <button
                type="button"
                className={css.runSplitCaret}
                data-run-scope=""
                aria-haspopup="menu"
                aria-expanded={runMenu}
                aria-label={t('pipeRunScopeHint')}
                title={t('pipeRunScopeHint')}
                onClick={() => { setRunMenu(!runMenu) }}
              >
                {MARK.chev}
              </button>
              )
            : null}
          {showScope && runMenu
            ? (
              <div className={css.runMenu} role="menu" data-run-menu="">
                {scopeRows.map((row) => {
                  const text = scopeRowOf(row)
                  return (
                    <button
                      key={row.kind}
                      type="button"
                      role="menuitem"
                      className={css.runMenuRow}
                      data-run-scope-row={row.kind}
                      data-at={row.at}
                      disabled={!canStartAt(phases, row.at)}
                      onClick={() => { startAt(row.at) }}
                    >
                      <span>
                        <b>{text.title}</b>
                        {text.badge ? <i>{t('pipeRunScopeDefault')}</i> : null}
                      </span>
                      <em>{text.note}</em>
                    </button>
                  )
                })}
                <div className={css.stepMenuSep} />
                <div className={css.stepMenuNote}>{t('pipeRunScopeNote')}</div>
              </div>
              )
            : null}
        </div>
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
                    {/* data-s 是上色用的，data-canvas-state 是读的：两枚都得有，
                        少一枚这枚 chip 就永远是默认灰的 */}
                    <span className={css.chipState} data-s={stand} data-canvas-state={stand}>
                      <span className={css.dot} data-s={stand} />
                      {t(`pipeStand_${stand}` as WorkbenchLocaleKey)}
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
                          {/* 菜单里每一行报的也是「整条」的状态，和标题旁那一枚同源——否则
                              同一条流水线在这两处会一个写「未整体运行」、一个写「单步跑过」 */}
                          <span className={css.dot} data-s={standOfId(pipeline)} />
                          <span className={css.menuRowMain}>
                            <span className={css.menuRowTitle}>{pipeline.name}</span>
                            <span className={css.menuRowSub}>
                              {t('pipeMenuSub', {
                                count: pipeline.steps.length,
                                state: t(`pipeStand_${standOfId(pipeline)}` as WorkbenchLocaleKey),
                              })}
                            </span>
                          </span>
                          <span className={css.menuRowTail}>{formatWhen(pipeline.updatedAt, Date.now())}</span>
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
                              {/*
                                The badge is a property of a product, so only a step that has one
                                carries it. While a step runs, what is on screen is still the
                                previous product — and labelling that one here read as a claim
                                about the run in flight: a node running as part of the whole chain
                                said 「单步」, because the product it was replacing came from a run
                                of that step alone.
                              */}
                              {step.phase !== 'done' || step.runScope === undefined
                                ? null
                                : step.runScope === 'full'
                                  // A whole-chain run that no record numbers: the badge needs the
                                  // number, and inventing one is worse than carrying none.
                                  ? step.runNo === undefined
                                    ? null
                                    : <span className={css.nodeRun} title={t('pipeRunOf', { no: step.runNo })}>{`#${String(step.runNo)}`}</span>
                                  // The product says it was made by a run of this step alone, but
                                  // the page no longer holds the run that numbered it: naming the
                                  // step's own provenance is enough, and a made-up #n is not.
                                  : step.runNo === undefined
                                    ? <span className={css.nodeRun} data-solo="1" title={t('pipeRunOfSingleNoTitle')}>{t('pipeRunOfSingleNo')}</span>
                                    : (
                                      <span
                                        className={css.nodeRun}
                                        data-solo="1"
                                        title={t('pipeRunOfSingleTitle', { no: step.runNo })}
                                      >
                                        {t('pipeRunOfSingle', { no: step.runNo })}
                                      </span>
                                      )}
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
                          className={`${css.runOne} ${soloRunning ? css.stop : ''}`}
                          data-run-one=""
                          data-stop={soloRunning ? '1' : '0'}
                          data-again={selected.phase === 'done' ? '1' : '0'}
                          disabled={stopping || (running && !soloRunning)}
                          aria-label={soloRunning
                            ? runOneTitle
                            : selected.phase === 'done' ? t('pipeRunAgainOneHint') : runOneTitle}
                          title={soloRunning
                            ? runOneTitle
                            : selected.phase === 'done' ? t('pipeRunAgainOneHint') : runOneTitle}
                          onClick={() => {
                            // This step is the run: the button that started it is the one
                            // that stops it, and stopping it leaves the rest of the
                            // pipeline alone.
                            if (soloRunning) { run.stop(); return }
                            if (active !== undefined) run.runOne(active, selected.index)
                          }}
                        >
                          {soloRunning ? MARK.stop : selected.phase === 'done' ? MARK.replay : MARK.play}
                          {soloRunning
                            ? (stopping ? t('pipeStopping') : t('pipeStop'))
                            // 跑过的步骤上这颗按钮不是"试试看"，是"再来一遍"：同一个位置、
                            // 同一件事，但两种心情，字要说对。
                            : selected.phase === 'done' ? t('pipeRunAgainOne') : t('pipeRunOne')}
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
                      {/* 改了这一步的指令、只想从这里往下重跑：这一行就是那句话的入口。
                          放在分隔线以上，因为它和上移下移一样是"对这一步做什么"，
                          不是分隔线下面那组"改这一步的定义"。 */}
                      <button
                        type="button"
                        className={css.stepMenuRow}
                        role="menuitem"
                        data-rerun-step=""
                        disabled={running || !canStartAt(phases, selected.index)}
                        onClick={() => { startAt(selected.index) }}
                      >
                        {MARK.replay}
                        <span>{t('pipeRerunFromStep')}</span>
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
                          {key === 'activity' && traceCount !== 0 ? <em>{traceCount}</em> : null}
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
                              onSaveTemplate={(html) => {
                                const skill = selected.skill
                                if (skill === undefined) return
                                void saveStepTemplate(selected.cardId, html, skill).then((written) => {
                                  if (!written) { setConfigProblem(t('pipeCfgWriteFailed')); return }
                                  setConfigProblem(undefined)
                                  void reload()
                                })
                              }}
                              onPatch={applyPatch}
                              onStepPatch={(patch) => { applyStepPatch(selected.cardId, patch) }}
                            />
                          </div>
                          )
                        : (
                          <div className={css.resultPanel} id="pipe-panel-result" role="tabpanel" data-panel="result">
                            <ResultPanel
                              step={selected}
                              t={t}
                              template={cards.find(card => card.cardId === selected.cardId)?.template}
                              listFiles={api.listFiles}
                              onOpen={(file) => { openReader(selected.cardId, file) }}
                              busy={running}
                              onRun={() => { if (active !== undefined) run.runOne(active, selected.index) }}
                            />
                          </div>
                          )}
              </div>
            </aside>
          </div>

          <div className={css.runbar}>
            <div className={css.segBar}>
              {stepViews.map(step => (
                // A step finished by a run of its own is drawn hollow: filled means the
                // whole chain ran. Only while no whole run has happened — a step run again
                // after the pipeline finished is not the pipeline looking unfinished.
                <i key={`seg-${step.cardId}`} data-seg={String(step.index)} data-s={segState(step.phase)} />
              ))}
            </div>
            {/* 运行条只说跑到哪了：停止在启动这次运行的那颗按钮上，这里不再放第二个 */}
            <div className={css.runNoise} data-run-noise={chain?.phase ?? 'idle'}>
              {runNoise()}
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
                {renderCard(reader.cardId, 'result', () => { setReader(undefined) }, reader.file)}
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
                    : runMetaOf(history[historyAt])}
                </span>
                <span className={css.zoomHint}>{t('pipeEscHint')}</span>
                <button type="button" className={css.iconBtn} aria-label={t('pipeClose')} onClick={() => { setHistoryOpen(false) }}>
                  {MARK.x}
                </button>
              </div>
              <div className={css.histBody}>
                {/* 一条记录没写进去，运行本身可能已经跑完了；这时候缺的正是这一页要说的话。 */}
                {recordedRuns.notice === undefined ? null : (
                  <p className={css.histProblem} data-hist-problem="">
                    {t('pipeHistoryStoreProblem', { reason: recordedRuns.notice })}
                  </p>
                )}
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
                            <span className={css.histSum}>{runScopeLabelOf(entry)}</span>
                            <span className={css.histTook}>{formatDuration(entry.tookMs)}</span>
                            <span className={css.histBadge} data-s={runStateOf(entry.phase).s}>
                              {t(runStateOf(entry.phase).key)}
                            </span>
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
                {pickerProblem === undefined
                  ? null
                  : <p className={css.pickerProblem} data-picker-problem="">{pickerProblem}</p>}
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
        <span>{step.failure ?? t('pipeFailureUnstated')}</span>
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
const MARK: Record<'slot' | 'dash' | 'clock' | 'file' | 'check' | 'warn' | 'x' | 'plus' | 'play' | 'stop' | 'chev' | 'replay' | 'search' | 'dots' | 'back', ReactNode> = {
  // 方框要在 10px 上还是方框：直角、实线。虚线圆是排队中，两个状态不能共用记号。
  slot: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3.4" y="3.4" width="9.2" height="9.2" rx="1" /></svg>,
  dash: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="5.3" strokeDasharray="2.2 2.2" /></svg>,
  clock: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="5.7" /><path d="M8 4.8V8l2.2 1.4" /></svg>,
  file: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9.2 2.4H4.6a1 1 0 0 0-1 1v9.2a1 1 0 0 0 1 1h6.8a1 1 0 0 0 1-1V5.6z" /><path d="M9.2 2.4v3.2h3.2" /></svg>,
  check: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3.6 8.4 2.8 2.6 5.9-6" /></svg>,
  warn: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2.6l5.6 9.8H2.4z" /><path d="M8 6.2v3.2M8 11.2v.1" /></svg>,
  x: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" /></svg>,
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3.4v9.2M3.4 8h9.2" /></svg>,
  play: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.6 2.9c0-.5.5-.8.9-.6l7.1 4.2c.4.2.4.8 0 1l-7.1 4.2c-.4.2-.9-.1-.9-.6z" /></svg>,
  // 三角换方块：形状先说话，比颜色先被看见。同一颗按钮只换记号，位置和字宽都不动。
  stop: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="4.2" y="4.2" width="7.6" height="7.6" rx="1.3" /></svg>,
  chev: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m4.4 6.4 3.6 3.4 3.6-3.4" /></svg>,
  // 一个圈着一个箭头：这个记号只出现在"再来一遍"上，不用于"开始"。
  replay: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 8a5 5 0 1 1-1.9-3.9" /><path d="M13.2 2.6v3.2H10" /></svg>,
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
  // While it runs, the poll's own trace is the truth: a step re-run would otherwise show the
  // previous run's list until this one settled. Once it is over, the stored result wins,
  // because that list also carries the last poll before the run reported itself finished;
  // the chain's copy is what keeps the panel from blinking empty in between.
  const activity = step.phase === 'running'
    ? step.live ?? []
    : step.result?.activity ?? step.live ?? []
  if (step.phase === 'running') {
    // Nothing to list yet is the only case that gets a sentence instead of a list. Once the
    // child has done something, the same rows the finished step shows appear here, live.
    if (activity.length === 0) {
      return (
        <div className={css.stateBlock}>
          <h6>{t('pipeActivityRunning')}</h6>
          <p>{t('pipeActivityRunningBody')}</p>
        </div>
      )
    }
  }
  if (step.phase === 'failed') {
    return (
      <div className={css.stateBlock} data-tone="danger">
        <h6>{t('pipeActivityFailed')}</h6>
        <p>{step.failure ?? t('pipeFailureUnstated')}</p>
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
  /** Write one field into every step's card; this is what makes one edit reach all of them. */
  readonly onPatch: (patch: StepCardPatch) => void
  /**
   * Write one field into this step's card only.
   *
   * The rows above the 这一步 heading are the pipeline's (model, permission, directory) and go
   * to every step. Skill and instruction belong to one step, so they are read from that step's
   * card and written to it alone — through the same call, they used to read the first step's
   * card and write all of them, which showed one step's skill on another and renamed skills
   * the user never touched.
   */
  readonly onStepPatch: (patch: StepCardPatch) => void
  /** Store this step's template; the box commits on blur, not per keystroke. */
  readonly onSaveTemplate: (html: string) => void
  /** Ask the platform for one directory; disabled when there is no chooser. */
  readonly onPickWorkspace: (() => void) | undefined
  /** Why the last write did not land; absent when it did. */
  readonly problem: string | undefined
}): ReactNode {
  const { step, shared, models, skills, t, onSaveTemplate, onPatch, onStepPatch, onPickWorkspace, problem } = props
  const template = step.card?.template
  // This step's own card: the rows under 这一步 speak for this step, whatever the pipeline's
  // first card happens to hold.
  const mine = step.card
  // The box owns what the user is typing; the card owns what is stored. They meet on blur.
  const [draft, setDraft] = useState(template ?? '')
  useEffect(() => { setDraft(template ?? '') }, [template])
  const [view, setView] = useState<'preview' | 'source'>('preview')
  // The region is where the model writes; its placeholder is what shows while nothing is written.
  const placeholder = regionPlaceholder(template ?? '', t('pipeCfgRegion'), t('pipeCfgRegionBody'))
  const rendered = template === undefined ? '' : filledTemplate(template, placeholder)
  const regionInTemplate = template !== undefined && rendered !== template
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
              value={mine?.skill ?? ''}
              onChange={(event) => {
                const next = event.target.value
                onStepPatch({ skill: next === '' ? null : next })
              }}
            >
              <option value="">{t('pipeCfgNoSkill')}</option>
              {skills.filter(entry => entry.userInvocable).map(entry => (
                <option key={entry.name} value={entry.name}>{entry.name}</option>
              ))}
            </select>
            <span className={css.hint}>{mine?.skill === undefined ? t('pipeCfgSkillNoNote') : (skills.find(entry => entry.name === mine.skill)?.description ?? t('pipeCfgSkillNoNote'))}</span>
          </span>
        </div>
        <div className={css.ruleRow}>
          <span className={css.ruleLabel}>{t('pipeCfgInstruction')}</span>
          <span className={css.ruleValue}>
            {/* A text box, because the instruction is the user's own sentence. Committed on
                blur for the same reason as the directory: a write per keystroke would rewrite
                the card on every letter. Keyed by the step: an uncontrolled box keeps the text
                it was born with, so without the key it showed the step the panel opened on. */}
            <textarea
              key={step.cardId}
              className={css.ruleArea}
              data-cfg-instruction=""
              aria-label={t('pipeCfgInstruction')}
              rows={2}
              spellCheck={false}
              defaultValue={mine?.instruction ?? ''}
              onBlur={(event) => {
                const next = event.currentTarget.value.trim()
                if (next === (mine?.instruction ?? '')) return
                onStepPatch({ instruction: next === '' ? null : next })
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
        {view === 'preview'
          ? (
            template === undefined
              // Nothing to render yet: say what to do, in the place the render will appear.
              ? <p className={css.hint} data-cfg-empty="">{t('pipeCfgNoTemplate')}</p>
              : <div>
                  <div className={css.tplSlotLabel} data-cfg-preview-note="">{t('pipeCfgPreviewNote')}</div>
                  {/* The preview is the template rendered in its own styles — the frame is the
                      card, not a picture of it. Where the model will write there is a placeholder,
                      because what it will write does not exist yet. */}
                  <div className={css.tplPreviewBody} data-cfg-preview="">
                    <ShadowHtml html={rendered} className={css.tplPreviewFrame} />
                  </div>
                  {/* A template from before the region markers existed has nowhere to put the
                      placeholder, so the note is shown under the frame rather than not at all. */}
                  {regionInTemplate
                    ? null
                    : (
                      <div className={css.tplRegion} data-cfg-region="">
                        <span className={css.tplRegionTag}>{t('pipeCfgRegion')}</span>
                        <span className={css.tplRegionText}>{t('pipeCfgRegionBody')}</span>
                      </div>
                      )}
                </div>
            )
          : (
            /* 「源码」就是一个编辑框，和原型同一块地方：模板在这里读，也在这里改。
               没有模板的时候它照样在，只是空的，占位提示就是"先给这张卡片写一个模板"——
               否则这张卡片没有任何地方可以动手，整块就是"不能用"。
               值由本地 draft 拿着，而不是 defaultValue：这张面板会跟着运行状态重渲染，
               非受控输入框碰上重渲染就是"打字打不进去"的经典现场。
               失焦才写，理由和目录一样——逐键写等于每敲一个字重写一遍卡片。 */
            <textarea
              className={css.docSrc}
              data-cfg-template=""
              aria-label={t('pipeCfgSource')}
              spellCheck={false}
              placeholder={t('pipeCfgNoTemplate')}
              value={draft}
              onChange={(event) => { setDraft(event.target.value) }}
              onBlur={() => {
                if (draft.trim() === '' || draft === template) return
                onSaveTemplate(draft)
              }}
            />
            )}
      </div>
    </>
  )
}

/** What one step's result panel shows: what it handed over, and how to read it. */
function ResultPanel(props: {
  readonly step: StepView
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  /** The card's template: where a directory result states which directory it covers. */
  readonly template?: string | undefined
  readonly listFiles: (cardId: string, path: string) => Promise<WorkbenchFilesRead>
  readonly onOpen: (file?: string) => void
  /** Whether a run is in flight, which is when no other run may be started from here. */
  readonly busy: boolean
  readonly onRun: () => void
}): ReactNode {
  const { step, t, template, listFiles, onOpen, busy, onRun } = props
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
        <button type="button" className={`${css.btn} ${css.ghost}`} disabled={busy} onClick={onRun}>{t('pipeRunThisStep')}</button>
      </div>
    )
  }
  if (step.phase === 'failed') {
    return (
      <div className={css.stateBlock} data-tone="danger">
        <h6>{t('pipeResultFailed')}</h6>
        <p>{step.failure ?? t('pipeFailureUnstated')}</p>
        <button type="button" className={`${css.btn} ${css.ghost}`} disabled={busy} onClick={onRun}>{t('pipeRetryStep')}</button>
      </div>
    )
  }
  if (step.phase === 'idle' || step.result === undefined) {
    return (
      <div className={css.stateBlock}>
        <h6>{t('pipeResultNone')}</h6>
        <p>{t('pipeResultNoneBody')}</p>
        <button type="button" className={`${css.btn} ${css.ghost}`} disabled={busy} onClick={onRun}>{t('pipeRunOne')}</button>
      </div>
    )
  }
  // 完成。这个 tab 只回答一件事：这次交了什么 —— 和原型同一个形状：目录一行一个文件，
  // 没有目录就是一行「查看结果」加摘要。时间不在这儿：它属于活动，正文属于阅读器。
  const product = step.product
  const summary = product.kind === 'inline' && product.text !== '' ? product.text : t('pipeInlineProduct')
  // 目录先问模板：指针写在模板里，才不会被这次运行盖掉（区域每次都被替换）
  const dir = resultDirectory(template, product)
  return (
    <div className={css.resBlock}>
      <div className={css.resBlockHead}>
        <span>{t('pipeResultWhat')}</span>
        {dir === undefined ? null : <em>{dir}</em>}
      </div>
      {step.result.editedAt === undefined ? null : (
        <p className={css.revised} data-edited="">{t('pipeResultEdited')}</p>
      )}
      <div className={css.resList}>
        {dir === undefined
          ? (
            <button type="button" className={css.resOpen} data-open-result="" onClick={() => { onOpen() }}>
              {MARK.file}
              <span>{t('pipeResultOpenInline')}</span>
              <em data-result-summary="">{summary}</em>
              {MARK.chev}
            </button>
            )
          : (
            <ResultFiles
              cardId={step.cardId}
              dir={dir}
              t={t}
              listFiles={listFiles}
              onOpen={onOpen}
            />
            )}
      </div>
    </div>
  )
}

/**
 * One row per file the result's directory holds, and the row that opens the reader.
 *
 * The directory is listed once and the rows are drawn from it, because "3 个文件" is a fact
 * the panel would otherwise state without naming them. Reading is the first state rather
 * than a spinner: the directory row is already a working way into the reader, so the list
 * arriving late replaces a usable row instead of gating it.
 */
function ResultFiles(props: {
  readonly cardId: string
  readonly dir: string
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly listFiles: (cardId: string, path: string) => Promise<WorkbenchFilesRead>
  readonly onOpen: (file?: string) => void
}): ReactNode {
  const { cardId, dir, t, listFiles, onOpen } = props
  const [read, setRead] = useState<
    | { readonly phase: 'reading' }
    | { readonly phase: 'ready'; readonly files: readonly WorkbenchFileEntry[] }
    | { readonly phase: 'failed'; readonly reason: string }
  >({ phase: 'reading' })

  useEffect(() => {
    let live = true
    setRead({ phase: 'reading' })
    void listFiles(cardId, dir).then(result => {
      if (!live) return
      if (result.status !== 'ok') {
        setRead({ phase: 'failed', reason: result.reason })
        return
      }
      // 目录不算文件：这一行说的是「交了什么文件」，而一个子目录要开的东西在下一层
      setRead({ phase: 'ready', files: result.listing.entries.filter(entry => entry.type === 'file') })
    })
    return () => { live = false }
  }, [cardId, dir, listFiles])

  const wholeDirectory = (
    <button type="button" className={css.resItem} data-open-result="" onClick={() => { onOpen() }}>
      {MARK.file}
      <span className={css.resItemName}>{baseName(dir)}</span>
      {MARK.chev}
    </button>
  )

  if (read.phase !== 'ready' || read.files.length === 0) {
    // 还没读到、读不到、目录里确实没有文件：都给这一行，阅读器至少进得去；
    // 读不到要说出为什么，否则这一步看起来只是「没有文件」。
    return (
      <>
        {wholeDirectory}
        {read.phase === 'failed'
          ? (
            <p className={css.resProblem} data-files-problem="">
              {t('pipeResultFilesProblem', { reason: read.reason })}
            </p>
            )
          : null}
      </>
    )
  }

  return (
    <>
      {read.files.map(entry => (
        <button
          key={entry.path}
          type="button"
          className={css.resItem}
          data-result-file={entry.path}
          onClick={() => { onOpen(entry.path) }}
        >
          {MARK.file}
          <span className={css.resItemName}>{entry.name}</span>
          {entry.size === undefined
            ? null
            : <em className={css.resItemSize} data-result-size="">{formatBytes(entry.size)}</em>}
          {MARK.chev}
        </button>
      ))}
    </>
  )
}

/**
 * The last segment of a stored path, for a row that names one file.
 * @param path - an absolute path in either separator.
 * @returns the last segment, or the path when it has none.
 */
function baseName(path: string): string {
  const parts = path.split(/[\\/]/).filter(part => part !== '')
  return parts[parts.length - 1] ?? path
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
