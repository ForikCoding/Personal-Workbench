/**
 * Skill card state: what one card shows and what it can do.
 *
 * The card never talks to the Host directly; it renders this view and calls these
 * actions. Failures travel as codes so the component localizes them, with the
 * Host's own text kept as secondary detail.
 *
 * Two of the states here are deliberately transient and never stored: the action
 * waiting for confirmation, and a bare run's progress. A reload loses both, which is
 * what makes a skill target's result a property of the screen rather than of the card.
 *
 * The refinement state — the revision log and the one version kept for a step back —
 * is transient for the same reason: the stored result stays the only durable thing,
 * and a reload starts the conversation over.
 * @module dsh-workbench/client/skill-card/controller
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  WorkbenchActionDeclaration,
  WorkbenchActionTarget,
  WorkbenchCardConfigView,
  WorkbenchCardModel,
  WorkbenchCardResult,
  WorkbenchDirectoryStat,
  WorkbenchResultRecord,
  WorkbenchRunState,
  WorkbenchSandboxMode,
  WorkbenchSkillCardErrorCode,
  WorkbenchSkillCatalogEntry,
} from '../../skill-card-contract.ts'
import { effectiveWorkbenchSandboxMode } from '../../skill-card-contract.ts'
import type {
  WorkbenchCardSnapshot,
  WorkbenchConfigWrite,
  WorkbenchRunStart,
  WorkbenchSkillCardApi,
} from './api.ts'
import type { WorkbenchActionErrorCode, WorkbenchActionLookup } from './actions.ts'
import { resolveAction } from './actions.ts'
import type { WorkbenchModelDirectoryView, WorkbenchModelField, WorkbenchModelSeat } from './model.ts'
import { NO_MODEL_DIRECTORY, resolveModelField } from './model.ts'
import type { WorkbenchActionEvent } from './render.ts'
import { resultHtml } from './render.ts'
import { startCardRefine, startCardRun } from './run-start.ts'
import { analyzeTemplate } from './template.ts'
import type { WorkbenchWorkspaceField } from './workspace.ts'
import { NO_DIRECTORY_STAT, resolveWorkspaceField } from './workspace.ts'
import type { WorkbenchWorkspacePicker } from './workspace-picker.ts'

/** How often a running card asks the Host for its state. */
const POLL_INTERVAL_MS = 1000

/** Whether the editor's skill catalog has been read. */
export type WorkbenchCatalogStatus = 'idle' | 'loading' | 'ready' | 'failed'

/** Why a card cannot show or do what it should. */
export interface WorkbenchCardProblem {
  /**
   * Code the component localizes.
   *
   * `unavailable` covers a read that never arrived; `template-invalid` covers a
   * stored template that no longer derives a usable contract.
   */
  readonly code: WorkbenchSkillCardErrorCode | 'unavailable' | 'template-invalid'
  /** Operator-facing detail shown as secondary text. */
  readonly detail?: string
}

/**
 * Every reason a clicked action cannot run.
 *
 * The three payload reasons come from reading the button, the rest from resolving what
 * it points at. Both sets are reported the same way, on the card the user is looking
 * at.
 */
export type WorkbenchActionProblemCode =
  | WorkbenchActionErrorCode
  /** A click whose own key or payload could not be read; see {@link WorkbenchActionEvent}. */
  | Extract<WorkbenchActionEvent, { readonly kind: 'invalid' }>['reason']
  /**
   * The card that would run has no workspace directory.
   *
   * Its own codes rather than one generic "unavailable": a run refused for where it would
   * happen is not a target that is missing or busy, and the user's remedy is to configure
   * that card's directory.
   */
  | 'target-workspace-missing'
  | 'target-workspace-invalid'

/** Why one clicked action cannot run. */
export interface WorkbenchActionProblem {
  /** Code the panel localizes. */
  readonly code: WorkbenchActionProblemCode
  /** Everything the user could have meant, for the message to list; empty when none. */
  readonly candidates: readonly string[]
  /** The Host's own text, when the failure has one. */
  readonly detail?: string
}

/**
 * One action waiting for confirmation.
 *
 * Carries everything the panel states, read at the moment of the click, so the values
 * the user confirms are the values that run.
 */
export interface WorkbenchPendingAction {
  /** Action key the button carried. */
  readonly key: string
  /** What that key resolves to. */
  readonly target: WorkbenchActionTarget
  /** Target identity resolved at click time: a card id, or a skill name. */
  readonly reference: string
  /** The skill that will run: a card target's own skill, or the skill target itself. */
  readonly skill: string
  /** That row's raw fields, unchanged. */
  readonly payload: Record<string, unknown>
  /** Session the run belongs to. */
  readonly sessionId: string
}

/**
 * One bare run's state.
 *
 * There is no result to keep, so there is nothing to store: a skill target answers
 * whether it worked, and the card underneath keeps showing its own stored result.
 */
export type WorkbenchBareRunState =
  | { readonly phase: 'running'; readonly skill: string; readonly startedAt: number }
  | {
    readonly phase: 'settled'
    readonly skill: string
    /** Whether the child ended normally. */
    readonly ok: boolean
    /** Why it did not, when it did not. */
    readonly diagnostic?: string
  }

/**
 * One accepted refinement, as the result page's log shows it.
 *
 * Kept in memory only: the log is a conversation with this page, not a property of the
 * card, so a reload starts it empty.
 */
export interface WorkbenchRefinement {
  /** What the user asked for, verbatim. */
  readonly instruction: string
  /** When the refinement was applied, in milliseconds since the epoch. */
  readonly at: number
}

/**
 * The result one refinement replaced, kept for a single step back.
 *
 * In memory only for the same reason as the log, and replaced — not appended to — on
 * every refinement: the step back is one version deep by design.
 */
export interface WorkbenchPreviousResult {
  /** The region HTML the surface showed before the last refinement. */
  readonly html: string
  /** When that result was executed, in milliseconds since the epoch. */
  readonly at: number
}

/**
 * What an in-flight refinement needs once its run settles.
 *
 * Held in a ref rather than in state: the polling callback reads it without the state
 * update that would resubscribe the interval on every render.
 */
interface RefinementIntent {
  /** What the user asked for, verbatim. */
  readonly instruction: string
  /** The result the surface was showing; put back when the run fails. */
  readonly prior: WorkbenchResultRecord | undefined
  /** Its region HTML, which is the revision's starting point. */
  readonly priorHtml: string
}

/** What one card renders. */
export interface WorkbenchCardView {
  /** Whether the stored configuration has been read yet. */
  readonly status: 'loading' | 'ready' | 'unavailable'
  /** User-assigned card name; absent means the card's registered label stands. */
  readonly name?: string
  /** Selected skill, when one is configured. */
  readonly skill?: string
  /** Stored template for the selected skill, when one exists. */
  readonly template?: string
  /** Most recent result: the live run's, or the stored one. */
  readonly result?: WorkbenchResultRecord
  /** Live run state, once a run has been started in this session. */
  readonly run?: WorkbenchRunState
  /** Present when the card cannot show or do what it should. */
  readonly problem?: WorkbenchCardProblem
  /**
   * Why this card cannot run at all, when the deployment cannot start a child.
   *
   * Separate from {@link problem} because it is not a fault of the card: reading,
   * configuring, and hand-editing it all still work, so the card must keep rendering
   * its content while this states what the run control waits for.
   */
  readonly runUnavailable?: WorkbenchCardProblem
  /** The action waiting for confirmation; while present the panel replaces the body. */
  readonly pendingAction?: WorkbenchPendingAction
  /** The last clicked action's refusal, shown as an alert. */
  readonly actionProblem?: WorkbenchActionProblem
  /** This session's bare run, when a skill target was triggered. */
  readonly bareRun?: WorkbenchBareRunState
  /**
   * Refinements applied in this session, oldest first.
   *
   * Read as a conversation log by the result page. Never stored, so a reload starts it
   * empty — an accepted cost of keeping the stored result the only durable thing.
   */
  readonly refinements: readonly WorkbenchRefinement[]
  /** The result the last refinement replaced, for one step back; in memory only. */
  readonly previous: WorkbenchPreviousResult | undefined
  /**
   * Why the last refinement failed.
   *
   * Separate from {@link problem} because the page reports it under the composer, where
   * the ask came from, instead of above the result the user is still reading.
   */
  readonly refineProblem?: WorkbenchCardProblem
  /**
   * Whether the running run is a refinement of what is shown.
   *
   * The surface keeps the current result while this is true: a refinement changes the
   * result, so hiding it removes the thing the user is reviewing.
   */
  readonly refining?: boolean
  /** Whether a run can start: a skill, a template, a live session, a model, and a directory. */
  readonly runnable: boolean
  /**
   * What the model field offers, and whether a run can name its route.
   *
   * Carried on the view rather than read by each page, because the field's state and the
   * run control's answer have to be the same answer.
   */
  readonly modelField: WorkbenchModelField
  /**
   * Where this card runs, and whether that directory was confirmed.
   *
   * Carried on the view for the same reason as the model field: the picker's own state and
   * the run control's answer are one answer, and both the configuration page and the result
   * page read it from here.
   */
  readonly workspaceField: WorkbenchWorkspaceField
  /**
   * The permission mode this card's runs use, as the effective one.
   *
   * Never absent: a card that stores no mode runs under the default, so the configuration
   * page shows that mode rather than an empty option. The result page names it too, because
   * a mode is a safety fact about the run the user is reading.
   */
  readonly permission: WorkbenchSandboxMode
  /**
   * Whether a directory picker can be offered at all.
   *
   * False on a page whose composition has no picker, and after one refused: the field then
   * states that instead of offering a button that cannot do anything.
   */
  readonly canChooseWorkspace: boolean
  /** Skills the session's agent can invoke. */
  readonly catalog: readonly WorkbenchSkillCatalogEntry[]
  /** Whether the catalog has been read. */
  readonly catalogStatus: WorkbenchCatalogStatus
  /** Why the catalog could not be read, when it could not. */
  readonly catalogFailure: WorkbenchSkillCardErrorCode | 'unavailable' | undefined
  /**
   * Titles of every stored card, as a declaration must address them.
   *
   * The editor checks a declared card target against this list. It is carried on the
   * view rather than read by the analyser because the analyser is a pure text function
   * with no catalog and no storage, and because these names are the ones the click path
   * resolves against: a second rule here would let a declaration resolve differently in
   * the editor than it does when clicked.
   */
  readonly cardTitles: readonly string[]
}

/** What one card can do. */
export interface WorkbenchCardActions {
  /** Start a run. */
  run(): void
  /** Cancel the in-flight run. */
  cancel(): void
  /**
   * Ask for the current result to be revised.
   *
   * The run is a card run with the same contract, so its result replaces the card's
   * stored result; this session keeps the previous HTML and appends one log entry.
   * @param instruction - what to change, as the user typed it.
   */
  refine(instruction: string): void
  /**
   * Put the result the last refinement — or the last hand edit — replaced back on screen.
   *
   * One step only: the previous version is consumed, and this never writes storage. The
   * undo stack is deliberately separate from the revision log, so a hand edit is undoable
   * without becoming an entry in a log that records instructions.
   */
  undoRefine(): void
  /**
   * Store one hand-edited region fragment as this card's result.
   *
   * The record's run facts — the skill and the stop reason — are the Host's to keep; this
   * replaces the filled region and nothing else. The pre-edit result is kept for one step
   * back, and the edit is deliberately not appended to the revision log.
   * @param html - the fragment as the editor shows it.
   * @returns whether it was stored; a refusal is reported as {@link WorkbenchCardView.problem}.
   */
  saveResultEdit(html: string): Promise<boolean>
  /** Re-read the stored configuration and result. */
  refresh(): void
  /** Store a new skill selection. */
  chooseSkill(skill: string): void
  /**
   * Store the model this card's runs use.
   *
   * The pair travels whole: two ids, never a joined string, so a provider id containing a
   * slash cannot be misread as a separator.
   * @param model - the route the user chose.
   */
  chooseModel(model: WorkbenchCardModel): void
  /**
   * Ask the user for a directory, and store it as this card's workspace.
   *
   * The picker is the only way in: there is no field to type a path into, because a typed
   * path is a directory nobody confirmed. A cancelled pick writes nothing.
   */
  chooseWorkspace(): void
  /**
   * Store the permission mode this card's runs use.
   *
   * A run rebuilt from a changed mode is a different run: the Host disposes the card's
   * agent and creates one under the new mode, so the next run cannot execute under the old
   * one. Nothing here mutates a live run.
   * @param mode - the mode the user chose.
   */
  choosePermission(mode: WorkbenchSandboxMode): void
  /**
   * Store a template for the selected skill, together with the card's name.
   * @param template - the HTML to store.
   * @param name - the card's name as the editor shows it; an empty value clears it.
   */
  saveTemplate(template: string, name: string): void
  /** Store the card's name; an empty name clears it back to the registered label. */
  rename(name: string): void
  /**
   * Remove the card and everything stored for it.
   * @returns resolution once the Host has committed the removal.
   */
  remove(): Promise<void>
  /**
   * Read one click on a button a child authored.
   *
   * Resolves the key at the moment of the click and either opens the confirmation
   * panel or reports why it cannot run. Nothing is executed here.
   * @param event - the action the click resolved to, or why it could not be read.
   */
  click(event: WorkbenchActionEvent): void
  /** Carry out the pending action; the panel is one-shot. */
  confirmAction(): void
  /** Drop the pending action. Nothing else happens: no run, no write, no navigation. */
  cancelAction(): void
}

/** What the hook needs. */
export interface WorkbenchSkillCardOptions {
  /** Transport. */
  readonly api: WorkbenchSkillCardApi
  /** Card identity. */
  readonly cardId: string
  /**
   * Read the session a run hangs off.
   *
   * A callback rather than a value, because the click path has to know whether a
   * session is live *when the click happens*: opening a session after the page rendered
   * must make the next click resolvable rather than refusing it.
   * @returns the session id, or undefined when none is available.
   */
  readonly session: () => string | undefined
  /**
   * Whether this card needs the skill catalog.
   *
   * Only the configuration view lists skills, so only it asks for the catalog. The
   * grid renders one face per card, and loading the catalog for each of them would
   * issue a request per card for a list none of them shows.
   */
  readonly withCatalog?: boolean
  /**
   * Read the model catalog this card's field offers.
   *
   * Omitted by the card face, which neither shows the field nor has a run control. A page
   * that omits it resolves every card to "no model known", which is the honest answer for
   * a view that cannot see the directory.
   */
  readonly models?: WorkbenchModelSeat
  /**
   * Ask the user for this card's workspace directory.
   *
   * Omitted by a page with no picker to offer, which then states that instead of pretending
   * a control exists. There is no fallback to a text field: the product owner rejected
   * typing a path, because nothing would have confirmed it names a directory.
   */
  readonly workspacePicker?: WorkbenchWorkspacePicker
  /**
   * Read the title one card face shows.
   *
   * A declaration addresses a card by the name the user sees, so resolution has to
   * fall back exactly the way the face does.
   * @param cardId - the card.
   * @param name - its stored name, when it has one.
   * @returns the visible title.
   */
  readonly cardTitle?: (cardId: string, name: string | undefined) => string
  /**
   * Open one of a card's full-panel views.
   *
   * A card target starts its run and then jumps to that card, which is a navigation
   * only the panel can perform.
   * @param cardId - the card to show.
   * @param view - which of its two views.
   */
  readonly openCard?: (cardId: string, view: 'result' | 'config') => void
  /**
   * Whether to adopt a run that is already in flight for this card.
   *
   * A run can be started by another card's button before this card's page exists, and
   * only this card's own controller can show what became of it.
   */
  readonly watchRun?: boolean
}

/** Configuration as read, before it is projected onto one card. */
type ConfigState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly snapshot: WorkbenchCardSnapshot }
  | { readonly kind: 'unavailable'; readonly reason: string }

/**
 * Drive one skill card.
 * @param options - transport, card identity, session, and the panel's own callbacks.
 * @returns the card's view and actions.
 */
export function useSkillCard(options: WorkbenchSkillCardOptions): {
  readonly view: WorkbenchCardView
  readonly actions: WorkbenchCardActions
} {
  const {
    api,
    cardId,
    session,
    withCatalog = false,
    models,
    workspacePicker,
    cardTitle = defaultCardTitle,
    openCard,
    watchRun = false,
  } = options
  // The render-time answer, for what the card shows. Every click asks again, because
  // the session may have been opened since this render.
  const sessionId = session()
  const [config, setConfig] = useState<ConfigState>({ kind: 'loading' })
  const [run, setRun] = useState<WorkbenchRunState | undefined>(undefined)
  const [problem, setProblem] = useState<WorkbenchCardProblem | undefined>(undefined)
  const [pendingAction, setPendingAction] = useState<WorkbenchPendingAction | undefined>(undefined)
  const [actionProblem, setActionProblem] = useState<WorkbenchActionProblem | undefined>(undefined)
  const [bareRun, setBareRun] = useState<WorkbenchBareRunState | undefined>(undefined)
  const [refinements, setRefinements] = useState<readonly WorkbenchRefinement[]>([])
  const [previousResult, setPreviousResult] = useState<WorkbenchResultRecord | undefined>(undefined)
  // The record an undo — or a failed refinement — puts in place of the shown one. A
  // display override, never a write: nothing in this session's refinement state is
  // stored, and no route stores a result on a client's behalf.
  const [resultOverride, setResultOverride] = useState<WorkbenchResultRecord | undefined>(undefined)
  const [refineProblem, setRefineProblem] = useState<WorkbenchCardProblem | undefined>(undefined)
  const refinement = useRef<RefinementIntent | undefined>(undefined)

  /**
   * Record what a settled refinement run means for the surface.
   *
   * Called wherever a run state turns terminal — the start response and every poll —
   * so a refinement answered before the first poll is recorded exactly like one
   * answered by it.
   * @param state - the run state just read.
   */
  const settleRefinement = useCallback((state: WorkbenchRunState): void => {
    const intent = refinement.current
    if (intent === undefined) return
    if (state.phase !== 'settled' && state.phase !== 'cancelled') return
    refinement.current = undefined
    // A cancelled refinement produced no result, so it is reported like a failure at the
    // place the ask was made: the composer, not the run's status line.
    if (state.phase === 'cancelled' || state.failure !== undefined || state.failureCode !== undefined) {
      setResultOverride(intent.prior)
      setRefineProblem({
        code: state.failureCode ?? 'run-failed',
        ...state.failure === undefined ? {} : { detail: state.failure },
      })
      return
    }
    setPreviousResult(intent.prior)
    setRefinements(entries => [...entries, { instruction: intent.instruction, at: Date.now() }])
    // The run's own record is the new result, so no override is left behind.
    setResultOverride(undefined)
  }, [])
  const [catalog, setCatalog] = useState<readonly WorkbenchSkillCatalogEntry[]>([])
  const [catalogStatus, setCatalogStatus] = useState<WorkbenchCatalogStatus>('idle')
  const [catalogFailure, setCatalogFailure] = useState<WorkbenchSkillCardErrorCode | 'unavailable' | undefined>(undefined)
  const [directory, setDirectory] = useState<WorkbenchModelDirectoryView>(NO_MODEL_DIRECTORY)
  // A pick that found no picker disables the control for the rest of the session: the
  // composition cannot change under a mounted page, and a button that keeps failing reads
  // as a broken control rather than as a platform without one.
  const [pickerRefused, setPickerRefused] = useState(false)

  // The directory is an outside store, so it is read into state and watched rather than
  // read during render: it loads after the page mounts, and a field that never re-rendered
  // would stay empty after the catalog arrived.
  useEffect(() => {
    if (models === undefined) return
    const read = (): void => { setDirectory(models.read(sessionId)) }
    read()
    return models.subscribe(sessionId, read)
  }, [models, sessionId])

  // The catalog belongs to the view that lists skills, so it is loaded by that view
  // being rendered rather than by an action someone has to remember to call.
  useEffect(() => {
    if (!withCatalog) return
    setCatalogStatus('loading')
    void api.catalog(sessionId).then((result) => {
      if (result.status === 'ok') {
        setCatalog(result.entries)
        setCatalogStatus('ready')
        setCatalogFailure(undefined)
        return
      }
      setCatalogStatus('failed')
      setCatalogFailure(asErrorCode(result.code))
    })
  }, [api, sessionId, withCatalog])

  const refresh = useCallback(() => {
    // A re-read shows what is stored, so a result an undo put on screen stops being
    // the answer: the stored one is newer than the step back.
    setResultOverride(undefined)
    void api.read().then((result) => {
      if (result.status === 'ok') {
        setConfig({ kind: 'ready', snapshot: result.snapshot })
        setProblem(undefined)
        return
      }
      setConfig({ kind: 'unavailable', reason: result.reason })
    })
  }, [api])

  // One read when the card mounts. The panel mounts its cards when the workbench
  // is opened, and this read touches storage only — opening the workbench must
  // never cost a model call.
  useEffect(() => { refresh() }, [refresh])

  // A run started elsewhere is already in flight when this page appears, and only a
  // read of the run route can find it. Adopting just the running phase keeps an old
  // settled run — cancellation included — from reappearing as if it were news.
  useEffect(() => {
    if (!watchRun) return
    void api.poll(cardId).then((result) => {
      if (result.status !== 'ok' || result.state.phase !== 'running') return
      setRun(result.state)
    })
  }, [api, cardId, watchRun])

  // Poll only while a run is in flight; a settled run needs no further traffic.
  const running = run?.phase === 'running'
  useEffect(() => {
    if (!running) return
    let stopped = false
    const timer = setInterval(() => {
      void api.poll(cardId).then((result) => {
        if (stopped) return
        if (result.status === 'ok') {
          // The moment a refinement becomes news: its own page is the only reader, so
          // the log and the step back are recorded here rather than in an effect that
          // would see the transition a frame late.
          settleRefinement(result.state)
          setRun(result.state)
          return
        }
        if (result.status === 'missing') setRun(undefined)
        // An unavailable poll keeps the last known state and tries again next tick.
      })
    }, POLL_INTERVAL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [api, cardId, running, settleRefinement])

  // A bare run reports only its verdict, so the loop stops at the first terminal
  // phase and nothing beyond the diagnostic is read off the state.
  const bareRunning = bareRun?.phase === 'running'
  useEffect(() => {
    if (!bareRunning || bareRun === undefined) return
    const skill = bareRun.skill
    let stopped = false
    const timer = setInterval(() => {
      void api.poll(cardId).then((result) => {
        if (stopped || result.status !== 'ok') return
        const state = result.state
        if (state.phase === 'idle' || state.phase === 'running') return
        // A cancelled bare run is a timeout, and a timeout is a failure (B6).
        const ok = state.phase === 'settled' && state.failure === undefined
        const diagnostic = state.failure ?? state.result?.diagnostic
        setBareRun({
          phase: 'settled',
          skill,
          ok,
          ...diagnostic === undefined ? {} : { diagnostic },
        })
      })
    }, POLL_INTERVAL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [api, cardId, bareRun, bareRunning])

  const card = config.kind === 'ready'
    ? config.snapshot.cards.find(entry => entry.cardId === cardId)
    : undefined
  const stored = config.kind === 'ready'
    ? config.snapshot.results.find(entry => entry.cardId === cardId)
    : undefined
  // A card's own route wins and the session's selection is only the default it shows. The
  // field answers both questions at once: what the picker offers, and whether a run can
  // name the model it would use.
  const modelField = useMemo<WorkbenchModelField>(
    () => resolveModelField(card?.model, directory),
    [card?.model, directory],
  )
  // What the Host answered about this card's directory, tagged with the path it is about. The
  // tag matters: a card that is pointed at another directory must not inherit the previous
  // answer for a frame, and clearing state inside the effect would render exactly that.
  const [workspaceCheck, setWorkspaceCheck] = useState<
    { readonly path: string; readonly stat: WorkbenchDirectoryStat } | undefined
  >(undefined)
  // Whether the stored directory is still a directory is the Host's answer, so it is read
  // once per stored path rather than during render.
  const workspacePath = card?.workspace?.path
  useEffect(() => {
    if (workspacePath === undefined) return
    let live = true
    void api.statDirectory(workspacePath).then((outcome) => {
      if (!live) return
      // A check that never answered is "nothing is there": an unconfirmed directory is one a
      // card may not run in. The field says nothing about it until an answer arrives, which is
      // what the `checked` flag on the field is for.
      setWorkspaceCheck({
        path: workspacePath,
        stat: outcome.status === 'ok' ? outcome.stat : NO_DIRECTORY_STAT,
      })
    })
    return () => { live = false }
  }, [api, workspacePath])
  const workspaceStat = workspacePath !== undefined && workspaceCheck?.path === workspacePath
    ? workspaceCheck.stat
    : undefined
  // The one place that decides whether this card has a directory to run in. The field, the
  // run control, and every entry point read this answer.
  const workspaceField = useMemo<WorkbenchWorkspaceField>(
    () => resolveWorkspaceField(card?.workspace, workspaceStat),
    [card?.workspace, workspaceStat],
  )
  // A pick that found no picker closes the control for this page: `pickerRefused` wins over
  // the seat's own answer, which cannot change while the page is mounted.
  const canChooseWorkspace = !pickerRefused && workspacePicker !== undefined && workspacePicker.available()
  // Recorded by the Host once, at composition, and read here rather than asked per click.
  // Memoized on the configuration so the view's own identity stays stable between renders.
  const runUnavailable = useMemo<WorkbenchCardProblem | undefined>(
    () => config.kind === 'ready' && config.snapshot.capabilities?.startActivation === false
      ? { code: 'run-unavailable' }
      : undefined,
    [config],
  )
  // The override wins over a settled run: the only ways it is set are an undo and a
  // refinement that failed, and both mean "show the result that run was replacing".
  const result = resultOverride ?? run?.result ?? stored
  // The step back is stated as the pair the page reads, derived from the record it
  // restores, so what the control says and what it puts back cannot drift apart.
  const previous = useMemo<WorkbenchPreviousResult | undefined>(() => {
    if (previousResult === undefined) return undefined
    const html = resultHtml(previousResult.structured)
    return html === undefined ? undefined : { html, at: previousResult.executedAt }
  }, [previousResult])

  const start = useCallback(() => {
    // A fresh run replaces the result outright, so the revision state stops describing
    // it: the step back is no longer "the version before the last change", and an
    // intent left over by a refinement must not be credited to this run.
    refinement.current = undefined
    setResultOverride(undefined)
    setPreviousResult(undefined)
    setRefineProblem(undefined)
    // A refused start says why. Returning silently here is what made pressing Run
    // look like nothing happened at all.
    const live = session()
    if (live === undefined) {
      setProblem({ code: 'session-not-live', detail: '' })
      return
    }
    // Refuse rather than fall back to the session's directory. A run that happened somewhere
    // the user did not choose would be a result about a different folder.
    const refused = workspaceRefusal(workspaceField)
    if (refused !== undefined) {
      setProblem(refused)
      return
    }
    if (card?.skill === undefined) {
      setProblem({ code: 'not-configured', detail: '' })
      return
    }
    const template = card.template
    if (template === undefined) {
      setProblem({ code: 'template-missing', detail: '' })
      return
    }
    const analysis = analyzeTemplate(template)
    const first = analysis.violations[0]
    if (first !== undefined) {
      setProblem({ code: 'template-invalid', detail: first.location })
      return
    }
    // The one card-run path, shared with a run started from another card's button.
    void startCardRun(api, cardId, live).then((outcome) => {
      if (outcome.status === 'ok') {
        setRun(outcome.state)
        setProblem(undefined)
        return
      }
      setProblem(outcome.status === 'rejected'
        ? { code: asErrorCode(outcome.code), detail: outcome.message }
        : { code: 'unavailable', detail: outcome.reason })
    })
  }, [api, cardId, session, card?.skill, card?.template, workspaceField])

  const cancel = useCallback(() => { void api.cancel(cardId) }, [api, cardId])

  const refine = useCallback((instruction: string) => {
    const text = instruction.trim()
    // The composer disables its button on empty input; the same rule is enforced here,
    // because this is the boundary that actually spends a model call.
    if (text === '') return
    if (run?.phase === 'running') return
    const live = session()
    if (live === undefined) {
      setProblem({ code: 'session-not-live', detail: '' })
      return
    }
    // A refinement is a card run with a narrower ask, so it happens in the same directory
    // and is refused for the same reason: nowhere chosen means nowhere to revise.
    const refused = workspaceRefusal(workspaceField)
    if (refused !== undefined) {
      setRefineProblem(refused)
      return
    }
    if (card?.skill === undefined) {
      setProblem({ code: 'not-configured', detail: '' })
      return
    }
    if (card.template === undefined) {
      setProblem({ code: 'template-missing', detail: '' })
      return
    }
    // What is on screen is what gets revised, an undone version included: the request
    // carries the same HTML the surface shows, not a re-read of storage.
    const priorHtml = resultHtml(result?.structured)
    if (priorHtml === undefined) {
      // Nothing to revise. The composer is only offered beside a rendered result, so
      // this is the stale-click guard rather than a state the user can reach.
      setRefineProblem({ code: 'run-failed', detail: '' })
      return
    }
    setRefineProblem(undefined)
    setProblem(undefined)
    refinement.current = { instruction: text, prior: result, priorHtml }
    void startCardRefine(api, cardId, live, text, priorHtml).then((outcome) => {
      if (outcome.status !== 'ok') {
        // A refused start never became a run, so nothing was replaced: the refusal is
        // reported under the composer and the result stays as it was.
        refinement.current = undefined
        setRefineProblem(refineStartProblem(outcome))
        return
      }
      // Recorded from the start response too, so a run that settled before the first
      // poll still lands in the log.
      settleRefinement(outcome.state)
      setRun(outcome.state)
    })
  }, [api, card?.skill, card?.template, cardId, result, run?.phase, session, settleRefinement, workspaceField])

  const undoRefine = useCallback(() => {
    const kept = previousResult
    if (kept === undefined) return
    // Back on screen, not into storage: the step back is part of this session's view of
    // the result, and it is spent by using it.
    setResultOverride(kept)
    setPreviousResult(undefined)
    setRefineProblem(undefined)
  }, [previousResult])

  const saveResultEdit = useCallback(async (html: string): Promise<boolean> => {
    // Two guards the editor already enforces, restated here because this is the boundary
    // that spends a stored write: an empty region renders as a broken card, and a run in
    // flight is about to replace whatever this would store.
    if (html.trim() === '') return false
    if (run?.phase === 'running') {
      setProblem({ code: 'run-in-progress', detail: '' })
      return false
    }
    const prior = result
    const outcome = await api.saveResult(cardId, html)
    if (outcome.status !== 'ok') {
      // A stored write that failed used to leave the screen looking like a success, which
      // is the defect this branch exists to avoid: the editor stays open and the page
      // states why above the surface.
      setProblem(outcome.status === 'rejected'
        ? { code: asErrorCode(outcome.code), detail: outcome.message }
        : { code: 'unavailable', detail: outcome.reason })
      return false
    }
    // The response carries both halves of what changed, so nothing is read a second time.
    setConfig((state) => {
      if (state.kind !== 'ready') return state
      return {
        kind: 'ready',
        snapshot: {
          ...state.snapshot,
          revision: outcome.revision,
          results: replaceResult(state.snapshot.results, outcome.result),
        },
      }
    })
    // What this replaced is what 回到上一版 recovers. The revision log stays untouched: it
    // records instructions, and a hand edit is not one.
    if (prior !== undefined) setPreviousResult(prior)
    setResultOverride(undefined)
    setRefineProblem(undefined)
    setProblem(undefined)
    return true
  }, [api, cardId, result, run?.phase])

  const revision = config.kind === 'ready' ? config.snapshot.revision : undefined

  const applyWrite = useCallback((result: WorkbenchConfigWrite) => {
    if (result.status === 'failed') {
      setProblem({ code: 'unavailable', detail: result.reason })
      return
    }
    // A conflict is not retried blind: the Host's state replaces the draft so the
    // user edits against what is actually stored.
    setConfig({ kind: 'ready', snapshot: result.snapshot })
    setProblem(result.status === 'conflict' ? { code: 'conflict' } : undefined)
  }, [])

  const chooseSkill = useCallback((skill: string) => {
    if (revision === undefined) return
    void api.write({ baseRevision: revision, cardId, skill }).then(applyWrite)
  }, [api, applyWrite, cardId, revision])

  const chooseModel = useCallback((model: WorkbenchCardModel) => {
    if (revision === undefined) return
    void api.write({ baseRevision: revision, cardId, model }).then(applyWrite)
  }, [api, applyWrite, cardId, revision])

  const chooseWorkspace = useCallback(() => {
    if (workspacePicker === undefined) {
      // No picker means no way to name a directory. Saying so is the whole answer: there is
      // deliberately no text field to fall back to, because a typed path is a directory
      // nothing confirmed.
      setPickerRefused(true)
      return
    }
    void workspacePicker.pick().then((picked) => {
      // A cancelled pick is not an error and not a change: the stored path stays exactly as
      // it was, which is what the user asked for by closing the chooser.
      if (picked.status === 'cancelled') return
      if (picked.status === 'unavailable') {
        setPickerRefused(true)
        return
      }
      const send = (baseRevision: string): void => {
        void api.write({ baseRevision, cardId, workspace: { path: picked.path } }).then(applyWrite)
      }
      if (revision !== undefined) {
        send(revision)
        return
      }
      // A page opened a moment ago may not hold a revision yet. Reading the missing one is
      // what keeps the choice from being dropped on the floor, which is the bug the rename
      // path had before it read the revision it needed.
      void api.read().then((outcome) => {
        if (outcome.status !== 'ok') {
          setProblem({ code: 'unavailable', detail: outcome.reason })
          return
        }
        send(outcome.snapshot.revision)
      })
    })
  }, [api, applyWrite, cardId, revision, workspacePicker])

  const choosePermission = useCallback((mode: WorkbenchSandboxMode) => {
    if (revision === undefined) return
    // The chosen mode is written as an absolute value, never merged with what was stored:
    // the three modes are the whole choice, and "unset" is displayed as the default rather
    // than picked separately.
    void api.write({ baseRevision: revision, cardId, permission: mode }).then(applyWrite)
  }, [api, applyWrite, cardId, revision])

  const saveTemplate = useCallback((template: string, name: string) => {    const skill = card?.skill
    if (revision === undefined || skill === undefined) return
    // The name travels with the template: "保存" is the one action the user takes, and
    // persisting the name through a separate blur write meant a revision advance between
    // the two dropped it while the input still showed the text.
    const patch = {
      cardId,
      skill,
      template: { skill, html: template },
      name: name.trim() === '' ? null : name,
    }
    const send = (baseRevision: string, retried: boolean): void => {
      void api.write({ ...patch, baseRevision }).then((result) => {
        if (result.status !== 'conflict') {
          applyWrite(result)
          return
        }
        // A save states the whole card, so a moved revision is not a conflicting edit.
        if (retried) {
          applyWrite(result)
          return
        }
        send(result.snapshot.revision, true)
      })
    }
    send(revision, false)
  }, [api, applyWrite, cardId, revision, card?.skill])

  const rename = useCallback((name: string) => {
    // An emptied field clears the name rather than storing blank text, so the card
    // falls back to its registered label instead of rendering an empty title.
    const patch = { cardId, name: name.trim() === '' ? null : name }
    const send = (baseRevision: string, retried: boolean): void => {
      void api.write({ ...patch, baseRevision }).then((result) => {
        if (result.status !== 'conflict') {
          applyWrite(result)
          return
        }
        // A rename sets one field to an absolute value, so a moved revision means the
        // revision advanced, not that this would clobber another edit. One retry
        // against the state the Host just returned; a second conflict is reported.
        if (retried) {
          applyWrite(result)
          return
        }
        send(result.snapshot.revision, true)
      })
    }
    if (revision !== undefined) {
      send(revision, false)
      return
    }
    // Returning here used to drop the edit outright: the input already shows the new
    // text, so the user reads a silent return as "saved" while nothing was written.
    // Read the revision that is missing, then write.
    void api.read().then((outcome) => {
      if (outcome.status !== 'ok') {
        setProblem({ code: 'unavailable', detail: '' })
        return
      }
      send(outcome.snapshot.revision, false)
    })
  }, [api, applyWrite, cardId, revision])

  const remove = useCallback(async () => {
    if (revision === undefined) return
    applyWrite(await api.write({ baseRevision: revision, cardId, remove: true }))
  }, [api, applyWrite, cardId, revision])

  /**
   * Ask which of the cards a declaration could mean are already running.
   *
   * The stored snapshot carries what a card *is*, never what it is doing, so the run
   * route is asked — and only about the cards the clicked key actually names.
   */
  const runningTargets = useCallback(async (
    declaration: WorkbenchActionDeclaration | undefined,
    cards: readonly WorkbenchCardConfigView[],
  ): Promise<ReadonlySet<string>> => {
    const busy = new Set<string>()
    if (declaration?.target.kind !== 'card') return busy
    const name = declaration.target.name
    const named = cards.filter(entry => cardTitle(entry.cardId, entry.name) === name)
    await Promise.all(named.map(async (entry) => {
      const state = await api.poll(entry.cardId)
      if (state.status === 'ok' && state.state.phase === 'running') busy.add(entry.cardId)
    }))
    return busy
  }, [api, cardTitle])

  const resolveClick = useCallback(async (
    key: string,
    payload: Record<string, unknown>,
  ): Promise<void> => {
    setActionProblem(undefined)
    // Whether a session is live decides a skill target, and the answer is read now
    // rather than taken from the render that produced the button.
    const live = session()
    // Both halves of the lookup are re-read now rather than taken from the mount-time
    // snapshot: a card may have been deleted or a skill uninstalled since.
    const [found, catalogRead] = await Promise.all([api.read(), api.catalog(live)])
    if (found.status !== 'ok') {
      setPendingAction(undefined)
      setActionProblem({ code: 'target-unavailable', candidates: [], detail: found.reason })
      return
    }
    const snapshot = found.snapshot
    const template = snapshot.cards.find(entry => entry.cardId === cardId)?.template
    if (template === undefined) {
      setPendingAction(undefined)
      setActionProblem({ code: 'target-unavailable', candidates: [] })
      return
    }
    const declarations = analyzeTemplate(template).actions
    const declaration = declarations.find(item => item.key === key)
    if (declaration?.target.kind === 'skill' && catalogRead.status !== 'ok') {
      // Answering "no such skill" against a list that could not be read would send the
      // user hunting for an uninstalled package that is installed.
      setPendingAction(undefined)
      setActionProblem({ code: 'target-unavailable', candidates: [], detail: catalogRead.message })
      return
    }
    const busy = await runningTargets(declaration, snapshot.cards)
    const lookup: WorkbenchActionLookup = {
      cards: snapshot.cards.map(entry => ({
        cardId: entry.cardId,
        name: cardTitle(entry.cardId, entry.name),
        running: busy.has(entry.cardId),
      })),
      skills: catalogRead.status === 'ok'
        ? catalogRead.entries.filter(entry => entry.userInvocable).map(entry => entry.name)
        : [],
      live: live !== undefined,
    }
    const resolution = resolveAction(declarations, lookup, key, payload)
    if (resolution.kind === 'failed') {
      setPendingAction(undefined)
      setActionProblem({ code: resolution.code, candidates: resolution.candidates })
      return
    }
    // The panel cannot open without stating these two, and neither is in the
    // resolution: which skill a card target will actually run, and where a skill target
    // would run. Reporting them as one "unavailable" beats confirming a run that the
    // Host is certain to refuse.
    const skill = resolution.target.kind === 'card'
      ? snapshot.cards.find(entry => entry.cardId === resolution.reference)?.skill
      : resolution.target.name
    if (live === undefined || skill === undefined) {
      setPendingAction(undefined)
      setActionProblem({ code: 'target-unavailable', candidates: [] })
      return
    }
    // Where the run will happen, resolved for the card that will actually run: a card
    // target runs on its own stored directory, not on the directory of the card whose
    // button was pressed. Confirming a run the Host is certain to refuse wastes the one
    // thing the panel exists to protect — the user's attention.
    const runnerCardId = resolution.target.kind === 'card' ? resolution.reference : cardId
    const runnerCard = snapshot.cards.find(entry => entry.cardId === runnerCardId)
    const stat = runnerCard?.workspace === undefined
      ? undefined
      : await api.statDirectory(runnerCard.workspace.path)
    const field = resolveWorkspaceField(
      runnerCard?.workspace,
      stat === undefined ? undefined : stat.status === 'ok' ? stat.stat : NO_DIRECTORY_STAT,
    )
    if (field.kind !== 'ready') {
      setPendingAction(undefined)
      setActionProblem(field.kind === 'missing'
        ? { code: 'target-workspace-missing', candidates: [] }
        : { code: 'target-workspace-invalid', candidates: [], detail: field.path })
      return
    }
    setPendingAction({
      key: resolution.key,
      target: resolution.target,
      reference: resolution.reference,
      skill,
      payload: resolution.payload,
      sessionId: live,
    })
  }, [api, cardId, cardTitle, runningTargets, session])

  const click = useCallback((event: WorkbenchActionEvent): void => {
    setPendingAction(undefined)
    if (event.kind === 'invalid') {
      // A payload that cannot be read whole never reaches the panel: a shortened
      // parameter list would make the confirmed and the executed data two things.
      setActionProblem({ code: event.reason, candidates: [] })
      return
    }
    void resolveClick(event.key, event.payload)
  }, [resolveClick])

  const confirmAction = useCallback(() => {
    const pending = pendingAction
    if (pending === undefined) return
    // The panel is one-shot: closing it before anything starts is what keeps a second
    // click from running the same action twice.
    setPendingAction(undefined)
    setActionProblem(undefined)
    if (pending.target.kind === 'card') {
      // Started before the jump: a refusal then lands on the card the user is looking
      // at, instead of moving them first and reporting the failure afterwards.
      // The confirmed row travels with the run, so the target card executes the row the
      // user saw rather than a run with no idea which row it was for.
      //
      // The target card's directory was resolved when the panel opened. A run that still
      // arrives without one is refused by the route, which reads that card's own record —
      // this page holds no stat for another card to re-check at confirm time.
      void startCardRun(api, pending.reference, pending.sessionId, pending.payload).then((outcome) => {
        if (outcome.status !== 'ok') {
          setActionProblem(startProblem(outcome))
          return
        }
        openCard?.(pending.reference, 'result')
      })
      return
    }
    // A skill target runs on this card, so this card's directory decides whether it can.
    const refused = workspaceRefusal(workspaceField)
    if (refused !== undefined) {
      setActionProblem({
        code: refused.code === 'workspace-missing' ? 'target-workspace-missing' : 'target-workspace-invalid',
        candidates: [],
        ...refused.detail === undefined || refused.detail === '' ? {} : { detail: refused.detail },
      })
      return
    }
    void api.start({
      cardId,
      sessionId: pending.sessionId,
      mode: { kind: 'bare', skill: pending.skill },
      // Same rule for a skill target: the row it was triggered from is its input.
      payload: pending.payload,
    }).then((outcome) => {
      if (outcome.status !== 'ok') {
        setActionProblem(startProblem(outcome))
        return
      }
      setBareRun({
        phase: 'running',
        skill: pending.skill,
        startedAt: outcome.state.startedAt ?? Date.now(),
      })
    })
  }, [api, cardId, openCard, pendingAction, workspaceField])

  const cancelAction = useCallback(() => {
    // Deliberately nothing else: no run, no write, no navigation. Cancelling is only
    // ever the removal of the question.
    setPendingAction(undefined)
  }, [])

  const actions = useMemo<WorkbenchCardActions>(
    () => ({
      run: start,
      cancel,
      refine,
      undoRefine,
      saveResultEdit,
      refresh,
      chooseSkill,
      chooseModel,
      chooseWorkspace,
      choosePermission,
      saveTemplate,
      rename,
      remove,
      click,
      confirmAction,
      cancelAction,
    }),
    [
      start,
      cancel,
      refine,
      undoRefine,
      saveResultEdit,
      refresh,
      chooseSkill,
      chooseModel,
      chooseWorkspace,
      choosePermission,
      saveTemplate,
      rename,
      remove,
      click,
      confirmAction,
      cancelAction,
    ],
  )

  const problemOfRun = run?.failureCode === undefined
    ? undefined
    : { code: run.failureCode, ...run.failure === undefined ? {} : { detail: run.failure } }
  const effective = problem ?? problemOfRun ?? (config.kind === 'unavailable'
    ? { code: 'unavailable' as const, detail: config.reason }
    : undefined)

  // Memoized so the card's body keeps a stable identity: it is handed to the
  // shared shell as a local slot component, and a fresh identity there remounts
  // that subtree. The identity changes only when the displayed data does.
  const view = useMemo<WorkbenchCardView>(() => ({
    status: config.kind === 'loading' ? 'loading' : config.kind === 'ready' ? 'ready' : 'unavailable',
    ...card?.name === undefined ? {} : { name: card.name },
    ...card?.skill === undefined ? {} : { skill: card.skill },
    ...card?.template === undefined ? {} : { template: card.template },
    ...result === undefined ? {} : { result },
    ...run === undefined ? {} : { run },
    // A refinement revises what is on screen, so the screen keeps showing it until the
    // new version arrives. Replacing the result with a progress notice threw away the
    // very thing being reviewed.
    ...run?.phase === 'running' && refinement.current !== undefined ? { refining: true } : {},
    ...effective === undefined ? {} : { problem: effective },
    ...runUnavailable === undefined ? {} : { runUnavailable },
    ...pendingAction === undefined ? {} : { pendingAction },
    ...actionProblem === undefined ? {} : { actionProblem },
    ...bareRun === undefined ? {} : { bareRun },
    refinements,
    previous,
    ...refineProblem === undefined ? {} : { refineProblem },
    // The deciding question is whether there is a model the run could name, never whether
    // the picker loaded: a known route keeps a card runnable with no catalog at all. A
    // harness without the activation seam is the one answer that closes this off for
    // every card, and the view states it beside the disabled control. The directory is the
    // same kind of answer: a card only runs where the user put it.
    runnable: runUnavailable === undefined
      && sessionId !== undefined
      && card?.skill !== undefined
      && card.template !== undefined
      && modelField.kind !== 'unavailable'
      && workspaceField.kind === 'ready',
    modelField,
    workspaceField,
    // Never absent: a card that stores no mode runs under the default, and the page shows
    // that mode rather than an empty choice.
    permission: effectiveWorkbenchSandboxMode(card?.permission),
    canChooseWorkspace,
    catalog,
    catalogStatus,
    catalogFailure,
    // The same naming rule the click path resolves a card target with, so a declaration
    // the editor accepts is one that can actually be found when a button carries it.
    cardTitles: config.kind === 'ready'
      ? config.snapshot.cards.map(entry => cardTitle(entry.cardId, entry.name))
      : [],
  }), [
    config,
    run,
    problem,
    sessionId,
    card?.name,
    card?.skill,
    card?.template,
    modelField,
    workspaceField,
    card?.permission,
    canChooseWorkspace,
    result,
    catalog,
    catalogStatus,
    catalogFailure,
    pendingAction,
    actionProblem,
    bareRun,
    refinements,
    previous,
    refineProblem,
    cardTitle,
    runUnavailable,
  ])

  return { view, actions }
}

/**
 * Read the title one card face shows, when nothing else supplies that rule.
 * @param cardId - the card.
 * @param name - its stored name, when it has one.
 * @returns the name, or the card id it falls back to.
 */
function defaultCardTitle(cardId: string, name: string | undefined): string {
  return name ?? cardId
}

/**
 * Put one written result into a snapshot's result list.
 *
 * Replaced in place rather than appended: the list is ordered by card id and one card has
 * exactly one result, so appending would show the same card twice from one read onwards.
 * @param results - the snapshot's results, ascending by card id.
 * @param written - the record the Host just stored.
 * @returns a new list holding that record.
 */
function replaceResult(
  results: readonly WorkbenchCardResult[],
  written: WorkbenchCardResult,
): readonly WorkbenchCardResult[] {
  let found = false
  const next = results.map((entry) => {
    if (entry.cardId !== written.cardId) return entry
    found = true
    return written
  })
  if (!found) next.push(written)
  return next.sort((left, right) => (left.cardId < right.cardId ? -1 : left.cardId > right.cardId ? 1 : 0))
}

/**
 * Read one workspace field as the refusal a run reports.
 *
 * One function for every entry point, so the header control, a refinement, and a template
 * button cannot disagree about whether the card has somewhere to run.
 * @param field - the resolved field.
 * @returns the problem to report, or undefined when the directory is confirmed.
 */
function workspaceRefusal(field: WorkbenchWorkspaceField): WorkbenchCardProblem | undefined {
  if (field.kind === 'ready') return undefined
  return field.kind === 'missing'
    ? { code: 'workspace-missing', detail: '' }
    // The message carries the full path: "that directory is gone" is only actionable when
    // it says which one.
    : { code: 'workspace-invalid', detail: field.path }
}

/**
 * Read one refused start as an action problem.
 *
 * A concurrent run is the one refusal with a name of its own: the click already
 * checked, so only the window between checking and starting can produce it — and the
 * Host refuses rather than queueing, which is exactly what is reported.
 * @param outcome - the refusal, which is never an accepted run.
 * @returns the problem to report on the card the user is looking at.
 */
function startProblem(outcome: Exclude<WorkbenchRunStart, { readonly status: 'ok' }>): WorkbenchActionProblem {
  const detail = outcome.status === 'rejected' ? outcome.message : outcome.reason
  const code: WorkbenchActionProblemCode = outcome.status === 'rejected' && outcome.code === 'run-in-progress'
    ? 'target-busy'
    : 'target-unavailable'
  return { code, candidates: [], ...detail === '' ? {} : { detail } }
}

/**
 * Read one refused refine start as the failure the composer shows.
 *
 * A concurrent run is the one refusal with a name of its own, exactly as it is for a
 * plain run; the difference is only where the answer lands — under the composer, since
 * that is where the ask came from.
 * @param outcome - the refusal, which is never an accepted run.
 * @returns the problem to report under the composer.
 */
function refineStartProblem(
  outcome: Exclude<WorkbenchRunStart, { readonly status: 'ok' }>,
): WorkbenchCardProblem {
  if (outcome.status === 'rejected') {
    return { code: asErrorCode(outcome.code), detail: outcome.message }
  }
  return { code: 'unavailable', detail: outcome.reason }
}

/**
 * Codes this client localizes.
 *
 * A record rather than a list, so adding a code to the contract fails compilation
 * here until it is listed.
 */
const LOCALIZED_CODES: Record<WorkbenchSkillCardErrorCode, true> = {
  unauthorized: true,
  forbidden: true,
  'invalid-request': true,
  'too-large': true,
  conflict: true,
  'not-found': true,
  'storage-failure': true,
  'run-failed': true,
  'not-configured': true,
  'session-not-live': true,
  'skill-not-found': true,
  'template-missing': true,
  'catalog-failed': true,
  'provider-unavailable': true,
  'model-unavailable': true,
  'schema-rejected': true,
  'run-in-progress': true,
  'run-unavailable': true,
  'workspace-missing': true,
  'workspace-invalid': true,
  'permission-unavailable': true,
}

/**
 * Read one refused-start code as a localizable failure code.
 * @param code - the code the Host reported.
 * @returns the code when this client knows it, otherwise `unavailable`.
 */
function asErrorCode(code: string): WorkbenchSkillCardErrorCode | 'unavailable' {
  return Object.hasOwn(LOCALIZED_CODES, code) ? code as WorkbenchSkillCardErrorCode : 'unavailable'
}
