/**
 * Skill card state: what one card shows and what it can do.
 *
 * The card never talks to the Host directly; it renders this view and calls these
 * actions. Failures travel as codes so the component localizes them, with the
 * Host's own text kept as secondary detail.
 * @module dsh-workbench/client/skill-card/controller
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  WorkbenchResultRecord,
  WorkbenchRunState,
  WorkbenchSkillCardErrorCode,
  WorkbenchSkillCatalogEntry,
} from '../../skill-card-contract.ts'
import { WORKBENCH_OUTPUT_SCHEMA } from '../../skill-card-contract.ts'
import type { WorkbenchCardSnapshot, WorkbenchConfigWrite, WorkbenchSkillCardApi } from './api.ts'
import { analyzeTemplate } from './template.ts'

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
  /** Whether a run can start: a skill, a template, and a live session. */
  readonly runnable: boolean
  /** Skills the session's agent can invoke. */
  readonly catalog: readonly WorkbenchSkillCatalogEntry[]
  /** Whether the catalog has been read. */
  readonly catalogStatus: WorkbenchCatalogStatus
  /** Why the catalog could not be read, when it could not. */
  readonly catalogFailure: WorkbenchSkillCardErrorCode | 'unavailable' | undefined
}

/** What one card can do. */
export interface WorkbenchCardActions {
  /** Start a run. */
  run(): void
  /** Cancel the in-flight run. */
  cancel(): void
  /** Re-read the stored configuration and result. */
  refresh(): void
  /** Store a new skill selection. */
  chooseSkill(skill: string): void
  /** Store a template for the selected skill. */
  saveTemplate(template: string): void
  /** Store the card's name; an empty name clears it back to the registered label. */
  rename(name: string): void
  /**
   * Remove the card and everything stored for it.
   * @returns resolution once the Host has committed the removal.
   */
  remove(): Promise<void>
}

/** What the hook needs. */
export interface WorkbenchSkillCardOptions {
  /** Transport. */
  readonly api: WorkbenchSkillCardApi
  /** Card identity. */
  readonly cardId: string
  /** Session the run hangs off; undefined when none is available. */
  readonly sessionId: string | undefined
  /**
   * Whether this card needs the skill catalog.
   *
   * Only the configuration view lists skills, so only it asks for the catalog. The
   * grid renders one face per card, and loading the catalog for each of them would
   * issue a request per card for a list none of them shows.
   */
  readonly withCatalog?: boolean
}

/** Configuration as read, before it is projected onto one card. */
type ConfigState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly snapshot: WorkbenchCardSnapshot }
  | { readonly kind: 'unavailable'; readonly reason: string }

/**
 * Drive one skill card.
 * @param options - transport, card identity, session, and panel activity.
 * @returns the card's view and actions.
 */
export function useSkillCard(options: WorkbenchSkillCardOptions): {
  readonly view: WorkbenchCardView
  readonly actions: WorkbenchCardActions
} {
  const { api, cardId, sessionId, withCatalog = false } = options
  const [config, setConfig] = useState<ConfigState>({ kind: 'loading' })
  const [run, setRun] = useState<WorkbenchRunState | undefined>(undefined)
  const [problem, setProblem] = useState<WorkbenchCardProblem | undefined>(undefined)
  const [catalog, setCatalog] = useState<readonly WorkbenchSkillCatalogEntry[]>([])
  const [catalogStatus, setCatalogStatus] = useState<WorkbenchCatalogStatus>('idle')
  const [catalogFailure, setCatalogFailure] = useState<WorkbenchSkillCardErrorCode | 'unavailable' | undefined>(undefined)

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

  // Poll only while a run is in flight; a settled run needs no further traffic.
  const running = run?.phase === 'running'
  useEffect(() => {
    if (!running) return
    let stopped = false
    const timer = setInterval(() => {
      void api.poll(cardId).then((result) => {
        if (stopped) return
        if (result.status === 'ok') {
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
  }, [api, cardId, running])

  const card = config.kind === 'ready'
    ? config.snapshot.cards.find(entry => entry.cardId === cardId)
    : undefined
  const stored = config.kind === 'ready'
    ? config.snapshot.results.find(entry => entry.cardId === cardId)
    : undefined

  const start = useCallback(() => {
    // A refused start says why. Returning silently here is what made pressing Run
    // look like nothing happened at all.
    if (sessionId === undefined) {
      setProblem({ code: 'session-not-live', detail: '' })
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
    // One fixed contract: the child returns the filled region, so nothing about the
    // result can fail on shape.
    void api.start({ cardId, sessionId, outputSchema: WORKBENCH_OUTPUT_SCHEMA }).then((outcome) => {
      if (outcome.status === 'ok') {
        setRun(outcome.state)
        setProblem(undefined)
        return
      }
      setProblem(outcome.status === 'rejected'
        ? { code: asErrorCode(outcome.code), detail: outcome.message }
        : { code: 'unavailable', detail: outcome.reason })
    })
  }, [api, cardId, sessionId, card?.skill, card?.template])

  const cancel = useCallback(() => { void api.cancel(cardId) }, [api, cardId])

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

  const saveTemplate = useCallback((template: string) => {
    const skill = card?.skill
    if (revision === undefined || skill === undefined) return
    void api.write({
      baseRevision: revision,
      cardId,
      skill,
      template: { skill, html: template },
    }).then(applyWrite)
  }, [api, applyWrite, cardId, revision, card?.skill])

  const rename = useCallback((name: string) => {
    if (revision === undefined) return
    // An emptied field clears the name rather than storing blank text, so the card
    // falls back to its registered label instead of rendering an empty title.
    void api.write({ baseRevision: revision, cardId, name: name.trim() === '' ? null : name }).then(applyWrite)
  }, [api, applyWrite, cardId, revision])

  const remove = useCallback(async () => {
    if (revision === undefined) return
    applyWrite(await api.write({ baseRevision: revision, cardId, remove: true }))
  }, [api, applyWrite, cardId, revision])

  const actions = useMemo<WorkbenchCardActions>(
    () => ({ run: start, cancel, refresh, chooseSkill, saveTemplate, rename, remove }),
    [start, cancel, refresh, chooseSkill, saveTemplate, rename, remove],
  )

  const result = run?.result ?? stored
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
    ...effective === undefined ? {} : { problem: effective },
    runnable: sessionId !== undefined && card?.skill !== undefined && card.template !== undefined,
    catalog,
    catalogStatus,
    catalogFailure,
  }), [config, run, problem, sessionId, card?.name, card?.skill, card?.template, result, catalog, catalogStatus, catalogFailure])

  return { view, actions }
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
  'schema-rejected': true,
  'run-in-progress': true,
}

/**
 * Read one refused-start code as a localizable failure code.
 * @param code - the code the Host reported.
 * @returns the code when this client knows it, otherwise `unavailable`.
 */
function asErrorCode(code: string): WorkbenchSkillCardErrorCode | 'unavailable' {
  return Object.hasOwn(LOCALIZED_CODES, code) ? code as WorkbenchSkillCardErrorCode : 'unavailable'
}
