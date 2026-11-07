/**
 * Browser-side client for the skill card's private routes.
 *
 * Every failure is a structured result rather than a throw, because the card has
 * to render an unavailable state instead of an error boundary. Responses are
 * validated here: this is a process boundary, so the Host's JSON is input, not a
 * typed value.
 * @module dsh-workbench/client/skill-card/api
 */

import type {
  WorkbenchCardConfigView,
  WorkbenchCardResult,
  WorkbenchDirectoryStat,
  WorkbenchFilesListing,
  WorkbenchRunCapabilities,
  WorkbenchRunPhase,
  WorkbenchRunRequest,
  WorkbenchRunState,
  WorkbenchSkillCardPatch,
  WorkbenchSkillCatalogEntry,
} from '../../skill-card-contract.ts'

export type { WorkbenchCardConfigView, WorkbenchCardResult } from '../../skill-card-contract.ts'
// One parser for one wire shape: the document route and this read answer with the same
// listing, so validating it twice would let the two drift.
import { parseListing } from './files-wire.ts'
import {
  WORKBENCH_SKILL_CARD_API_VERSION,
  WORKBENCH_SKILL_CARD_CATALOG_PATH,
  WORKBENCH_SKILL_CARD_DIRECTORY_PATH,
  WORKBENCH_SKILL_CARD_FILES_PATH,
  WORKBENCH_SKILL_CARD_PATH,
  WORKBENCH_SKILL_CARD_RESULT_PATH,
  WORKBENCH_SKILL_CARD_RUN_PATH,
  isWorkbenchCardModel,
  isWorkbenchCardInstruction,
  isWorkbenchCardName,
  isWorkbenchCardWorkspace,
  isWorkbenchInstructionMode,
  isWorkbenchSandboxMode,
  isWorkbenchSkillName,
} from '../../skill-card-contract.ts'
import { isWorkbenchCardId } from '../../layout-contract.ts'

/** Fetch seam so tests can drive transport without a server. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/** Configuration and results the page renders from. */
export interface WorkbenchCardSnapshot {
  readonly cards: readonly WorkbenchCardConfigView[]
  readonly results: readonly WorkbenchCardResult[]
  readonly revision: string
  /**
   * What the Host recorded about running a card, at composition.
   *
   * Absent means the Host sent no verdict — a build that predates the field — and the
   * card is then treated as able to run: its run route answers for real, and refuses
   * with `run-unavailable` when the seam is in fact missing.
   */
  readonly capabilities?: WorkbenchRunCapabilities
}

/** Outcome of one configuration read. */
export type WorkbenchConfigRead =
  | { readonly status: 'ok'; readonly snapshot: WorkbenchCardSnapshot }
  | { readonly status: 'unavailable'; readonly reason: string }

/** Outcome of one run-state read. */
export type WorkbenchRunRead =
  | {
    readonly status: 'ok'
    /** The card's newest run, which is what a single-run reader wants. */
    readonly state: WorkbenchRunState
    /**
     * Every run the Host keeps for the card, newest first.
     *
     * One card may have several runs in flight, so a page that draws rows needs them all.
     * Optional like the field on the wire: a Host that predates concurrent runs sends only
     * `state`, and a reader then reads that one state as the list.
     */
    readonly states?: readonly WorkbenchRunState[]
  }
  | { readonly status: 'missing' }
  | { readonly status: 'unavailable'; readonly reason: string }

/** Outcome of starting one run. */
export type WorkbenchRunStart =
  | { readonly status: 'ok'; readonly state: WorkbenchRunState }
  | { readonly status: 'rejected'; readonly code: string; readonly message: string }
  | { readonly status: 'unavailable'; readonly reason: string }

/** Outcome of one configuration write. */
export type WorkbenchConfigWrite =
  | { readonly status: 'ok'; readonly snapshot: WorkbenchCardSnapshot }
  | { readonly status: 'conflict'; readonly snapshot: WorkbenchCardSnapshot }
  | { readonly status: 'failed'; readonly reason: string }

/** Outcome of one catalog read. */
export type WorkbenchCatalogRead =
  | { readonly status: 'ok'; readonly entries: readonly WorkbenchSkillCatalogEntry[] }
  | { readonly status: 'failed'; readonly code: string; readonly message: string }

/**
 * Outcome of one directory check.
 *
 * There is no "this path is not a directory" failure: that is an `ok` answer holding
 * `isDirectory: false`. Only a transport that could not answer lands in `unavailable`, and
 * the caller reads it as "nothing was confirmed" rather than as an exception.
 */
export type WorkbenchDirectoryStatRead =
  | { readonly status: 'ok'; readonly stat: WorkbenchDirectoryStat }
  | { readonly status: 'unavailable'; readonly reason: string }

/**
 * Outcome of one directory listing.
 *
 * A listing rather than a throw, for the same reason the directory check is one: the panel
 * that asks is drawing rows, and "no rows and why" is a shape it can render. A directory
 * that could not be read is not the same fact as an empty one, so the two stay apart.
 */
export type WorkbenchFilesRead =
  | { readonly status: 'ok'; readonly listing: WorkbenchFilesListing }
  | { readonly status: 'unavailable'; readonly reason: string }

/** Outcome of storing one hand-edited result. */
export type WorkbenchResultWrite =
  | {
    readonly status: 'ok'
    /** Revision the write landed on. */
    readonly revision: string
    /** The record as stored, so the caller needs no second read. */
    readonly result: WorkbenchCardResult
  }
  | { readonly status: 'rejected'; readonly code: string; readonly message: string }
  | { readonly status: 'unavailable'; readonly reason: string }

/** The read/write face the card consumes. */
export interface WorkbenchSkillCardApi {
  /**
   * Read the stored configuration and results.
   * @param signal - caller-owned cancellation.
   * @returns the snapshot, or an unavailable reason.
   */
  read(signal?: AbortSignal): Promise<WorkbenchConfigRead>
  /**
   * Send one configuration patch; writes are serialized.
   * @param patch - card, selection, and optional template.
   * @returns the write outcome.
   */
  write(patch: WorkbenchSkillCardPatch): Promise<WorkbenchConfigWrite>
  /**
   * Read the skills a card can be pointed at.
   * @param sessionId - the session whose agent is preferred, when the card has one.
   * @param signal - caller-owned cancellation.
   * @returns the catalog, or why it could not be read.
   */
  catalog(sessionId: string | undefined, signal?: AbortSignal): Promise<WorkbenchCatalogRead>
  /**
   * Read one card's run state.
   * @param cardId - the card.
   * @param signal - caller-owned cancellation.
   * @returns the state, that none exists, or an unavailable reason.
   */
  poll(cardId: string, signal?: AbortSignal): Promise<WorkbenchRunRead>
  /**
   * Start one card's run.
   * @param request - card, session, and output contract.
   * @returns the accepted state, or the refusal.
   */
  start(request: WorkbenchRunRequest): Promise<WorkbenchRunStart>
  /**
   * Cancel one of a card's in-flight runs, or all of them.
   * @param cardId - the card.
   * @param runId - the run to stop; absent stops every run the card has in flight.
   * @returns resolution after the Host answers.
   */
  cancel(cardId: string, runId?: string): Promise<void>
  /**
   * Store one hand-edited region fragment as that card's result.
   *
   * A write of its own rather than a run: it spends no model call, and the Host keeps the
   * record's run facts — the skill and the stop reason — as they are.
   * @param cardId - the card whose result is being replaced.
   * @param runId - which of the card's runs the edit applies to.
   * @param html - the region HTML to store, verbatim.
   * @returns the stored record and revision, or the refusal.
   */
  saveResult(cardId: string, runId: string, html: string): Promise<WorkbenchResultWrite>
  /**
   * Ask the Host whether one path is a directory a card may run in.
   *
   * One narrow read rather than a filesystem bridge: this is the only filesystem fact the
   * page needs, and it decides whether the run control opens.
   * @param path - absolute directory path, as stored for the card.
   * @param signal - caller-owned cancellation.
   * @returns the three facts, or why the check could not be answered.
   */
  statDirectory(path: string, signal?: AbortSignal): Promise<WorkbenchDirectoryStatRead>
  /**
   * List one directory in a card's workspace.
   *
   * The result tab names the files a run produced, so the panel asks for the directory the
   * card's template points at once and draws a row per file from the answer.
   * @param cardId - the card whose workspace is read.
   * @param path - path within that workspace; empty for the workspace itself.
   * @param signal - caller-owned cancellation.
   * @returns the listing, or why it could not be read.
   */
  listFiles(cardId: string, path: string, signal?: AbortSignal): Promise<WorkbenchFilesRead>
}

/** Queue depth above which the oldest waiting change is dropped. */
const MAX_QUEUED_WRITES = 8

/** What the API needs from its host. */
export interface WorkbenchSkillCardApiOptions {
  /** Transport; defaults to `globalThis.fetch`. */
  readonly fetcher?: FetchLike
}

/** The four phases the wire may report. */
const RUN_PHASES: readonly WorkbenchRunPhase[] = ['idle', 'running', 'settled', 'cancelled']

/**
 * Build the skill card API.
 * @param options - transport seam.
 * @returns the read/write face.
 */
export function createWorkbenchSkillCardApi(options: WorkbenchSkillCardApiOptions = {}): WorkbenchSkillCardApi {
  const fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init))
  let tail: Promise<WorkbenchConfigWrite> = Promise.resolve({ status: 'failed', reason: 'no write was issued' })
  let queued = 0

  const readError = async (response: Response): Promise<string> => {
    const body = await readJson(response)
    const message = errorMessageOf(body)
    return message ?? `skill card route answered ${String(response.status)}`
  }

  return {
    async read(signal) {
      let response: Response
      try {
        response = await fetcher(WORKBENCH_SKILL_CARD_PATH, {
          method: 'GET',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
          ...signal === undefined ? {} : { signal },
        })
      } catch (error) {
        return { status: 'unavailable', reason: `skill card request failed: ${messageOf(error)}` }
      }
      if (!response.ok) return { status: 'unavailable', reason: await readError(response) }
      const snapshot = parseSnapshot(await readJson(response))
      return snapshot === undefined
        ? { status: 'unavailable', reason: 'skill card response did not match the contract' }
        : { status: 'ok', snapshot }
    },

    async write(patch) {
      if (queued >= MAX_QUEUED_WRITES) {
        return { status: 'failed', reason: 'too many pending skill card changes' }
      }
      queued += 1
      const send = async (): Promise<WorkbenchConfigWrite> => {
        let response: Response
        try {
          response = await fetcher(WORKBENCH_SKILL_CARD_PATH, {
            method: 'PATCH',
            credentials: 'same-origin',
            redirect: 'error',
            cache: 'no-store',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
          })
        } catch (error) {
          return { status: 'failed', reason: `skill card request failed: ${messageOf(error)}` }
        }
        if (response.status === 409) {
          const snapshot = parseSnapshot(await readJson(response))
          return snapshot === undefined
            ? { status: 'failed', reason: 'conflict response was not readable' }
            : { status: 'conflict', snapshot }
        }
        if (!response.ok) return { status: 'failed', reason: await readError(response) }
        const snapshot = parseSnapshot(await readJson(response))
        return snapshot === undefined
          ? { status: 'failed', reason: 'skill card response did not match the contract' }
          : { status: 'ok', snapshot }
      }
      const result = tail.then(send).finally(() => { queued -= 1 })
      tail = result
      return await result
    },

    async catalog(sessionId, signal) {
      // The card is configured before it is ever run, so the id is optional: the
      // host lists the installed skills through a live agent either way.
      const query = sessionId === undefined ? '' : `?sessionId=${encodeURIComponent(sessionId)}`
      let response: Response
      try {
        response = await fetcher(
          `${WORKBENCH_SKILL_CARD_CATALOG_PATH}${query}`,
          {
            method: 'GET',
            credentials: 'same-origin',
            redirect: 'error',
            cache: 'no-store',
            headers: { 'Accept': 'application/json' },
            ...signal === undefined ? {} : { signal },
          },
        )
      } catch (error) {
        return { status: 'failed', code: 'unavailable', message: `skill card request failed: ${messageOf(error)}` }
      }
      const body = await readJson(response)
      if (!response.ok) {
        const error = errorOf(body)
        return error === undefined
          ? { status: 'failed', code: 'unavailable', message: `skill card route answered ${String(response.status)}` }
          : { status: 'failed', code: error.code, message: error.message }
      }
      const entries = parseCatalog(body)
      return entries === undefined
        ? { status: 'failed', code: 'unavailable', message: 'catalog response did not match the contract' }
        : { status: 'ok', entries }
    },

    async poll(cardId, signal) {
      let response: Response
      try {
        response = await fetcher(`${WORKBENCH_SKILL_CARD_RUN_PATH}?cardId=${encodeURIComponent(cardId)}`, {
          method: 'GET',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
          ...signal === undefined ? {} : { signal },
        })
      } catch (error) {
        return { status: 'unavailable', reason: `skill card request failed: ${messageOf(error)}` }
      }
      if (response.status === 404) return { status: 'missing' }
      if (!response.ok) return { status: 'unavailable', reason: await readError(response) }
      const body = await readJson(response)
      const state = parseRunResponse(body)
      if (state === undefined) {
        return { status: 'unavailable', reason: 'run response did not match the contract' }
      }
      return { status: 'ok', state, states: parseRunStates(body, state) }
    },

    async start(request) {
      let response: Response
      try {
        response = await fetcher(WORKBENCH_SKILL_CARD_RUN_PATH, {
          method: 'POST',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
      } catch (error) {
        return { status: 'unavailable', reason: `skill card request failed: ${messageOf(error)}` }
      }
      const body = await readJson(response)
      if (response.ok) {
        const state = parseRunResponse(body)
        return state === undefined
          ? { status: 'unavailable', reason: 'run response did not match the contract' }
          : { status: 'ok', state }
      }
      const error = errorOf(body)
      return error === undefined
        ? { status: 'unavailable', reason: `skill card route answered ${String(response.status)}` }
        : { status: 'rejected', code: error.code, message: error.message }
    },

    async cancel(cardId, runId) {
      const query = runId === undefined
        ? `?cardId=${encodeURIComponent(cardId)}`
        : `?cardId=${encodeURIComponent(cardId)}&runId=${encodeURIComponent(runId)}`
      try {
        await fetcher(`${WORKBENCH_SKILL_CARD_RUN_PATH}${query}`, {
          method: 'DELETE',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
        })
      } catch (error) {
        // Cancellation is best effort: the next poll reports the run's real state.
        console.warn('skill card cancel failed:', messageOf(error))
      }
    },

    async saveResult(cardId, runId, html) {
      let response: Response
      try {
        response = await fetcher(WORKBENCH_SKILL_CARD_RESULT_PATH, {
          method: 'PUT',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId, runId, html }),
        })
      } catch (error) {
        return { status: 'unavailable', reason: `skill card request failed: ${messageOf(error)}` }
      }
      const body = await readJson(response)
      if (response.ok) {
        const stored = parseResultEdit(body)
        return stored === undefined
          ? { status: 'unavailable', reason: 'result response did not match the contract' }
          : { status: 'ok', revision: stored.revision, result: stored.result }
      }
      const error = errorOf(body)
      return error === undefined
        ? { status: 'unavailable', reason: `skill card route answered ${String(response.status)}` }
        : { status: 'rejected', code: error.code, message: error.message }
    },

    async statDirectory(path, signal) {
      const query = `?path=${encodeURIComponent(path)}`
      let response: Response
      try {
        response = await fetcher(`${WORKBENCH_SKILL_CARD_DIRECTORY_PATH}${query}`, {
          method: 'GET',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
          ...signal === undefined ? {} : { signal },
        })
      } catch (error) {
        return { status: 'unavailable', reason: `skill card request failed: ${messageOf(error)}` }
      }
      const body = await readJson(response)
      if (!response.ok) {
        const error = errorOf(body)
        return {
          status: 'unavailable',
          reason: error?.message ?? `skill card route answered ${String(response.status)}`,
        }
      }
      const stat = parseDirectoryStat(body)
      return stat === undefined
        ? { status: 'unavailable', reason: 'directory response did not match the contract' }
        : { status: 'ok', stat }
    },

    async listFiles(cardId, path, signal) {
      const query = `?cardId=${encodeURIComponent(cardId)}&path=${encodeURIComponent(path)}`
      let response: Response
      try {
        response = await fetcher(`${WORKBENCH_SKILL_CARD_FILES_PATH}${query}`, {
          method: 'GET',
          credentials: 'same-origin',
          redirect: 'error',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
          ...signal === undefined ? {} : { signal },
        })
      } catch (error) {
        return { status: 'unavailable', reason: `skill card request failed: ${messageOf(error)}` }
      }
      const body = await readJson(response)
      if (!response.ok) {
        const error = errorOf(body)
        return {
          status: 'unavailable',
          reason: error?.message ?? `skill card route answered ${String(response.status)}`,
        }
      }
      const listing = parseListing(body)
      return listing === undefined
        ? { status: 'unavailable', reason: 'listing response did not match the contract' }
        : { status: 'ok', listing }
    },
  }
}

/**
 * Read one response body as JSON.
 * @param response - the response.
 * @returns the decoded value, or undefined when it is not JSON.
 */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    // A route that failed before answering still has to be reportable.
    return undefined
  }
}

/**
 * Read the error body of one response.
 * @param body - the decoded body.
 * @returns the error fields, or undefined when the body is not an error.
 */
function errorOf(body: unknown): { readonly code: string; readonly message: string } | undefined {
  if (typeof body !== 'object' || body === null) return undefined
  const error = (body as { error?: unknown }).error
  if (typeof error !== 'object' || error === null) return undefined
  const fields = error as { code?: unknown; message?: unknown }
  if (typeof fields.code !== 'string' || typeof fields.message !== 'string') return undefined
  return { code: fields.code, message: fields.message }
}

/**
 * Read the message of one error body.
 * @param body - the decoded body.
 * @returns the message, or undefined when the body is not an error.
 */
function errorMessageOf(body: unknown): string | undefined {
  return errorOf(body)?.message
}

/**
 * Whether a decoded value is an absent or usable session id.
 *
 * Shared by the two records that carry one so the rule cannot drift between the snapshot
 * read and the hand-edit response: absent is every record written before the field
 * existed, and a present value has to be a non-empty string.
 * @param value - the decoded field.
 * @returns whether it is absent, or a usable session id.
 */
function isOptionalSessionId(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && value.length > 0)
}

/**
 * Validate one configuration snapshot body.
 * @param value - decoded body.
 * @returns the snapshot, or undefined when a field is outside the contract.
 */
export function parseSnapshot(value: unknown): WorkbenchCardSnapshot | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const body = value as {
    apiVersion?: unknown
    revision?: unknown
    cards?: unknown
    results?: unknown
    capabilities?: unknown
  }
  if (body.apiVersion !== WORKBENCH_SKILL_CARD_API_VERSION) return undefined
  if (typeof body.revision !== 'string') return undefined
  if (!Array.isArray(body.cards) || !Array.isArray(body.results)) return undefined
  // A capability the client cannot read is refused whole rather than dropped: treating a
  // malformed verdict as "no verdict" would enable a run control the Host may have
  // disabled, and the card would then say two different things about the same harness.
  const capabilities = body.capabilities === undefined ? undefined : parseCapabilities(body.capabilities)
  if (body.capabilities !== undefined && capabilities === undefined) return undefined

  const cards: WorkbenchCardConfigView[] = []
  for (const raw of body.cards) {
    if (typeof raw !== 'object' || raw === null) return undefined
    const entry = raw as {
      cardId?: unknown
      name?: unknown
      skill?: unknown
      instruction?: unknown
      model?: unknown
      workspace?: unknown
      permission?: unknown
      instructionMode?: unknown
      templateSkills?: unknown
      template?: unknown
    }
    if (typeof entry.cardId !== 'string' || !isWorkbenchCardId(entry.cardId)) return undefined
    if (entry.name !== undefined && (typeof entry.name !== 'string' || !isWorkbenchCardName(entry.name))) {
      return undefined
    }
    if (entry.skill !== undefined && (typeof entry.skill !== 'string' || !isWorkbenchSkillName(entry.skill))) {
      return undefined
    }
    // Free text, but bounded and non-blank: the page shows this field and the run is given
    // what it shows, so a value the contract would refuse is dropped rather than displayed.
    const instruction = entry.instruction
    if (instruction !== undefined && (typeof instruction !== 'string' || !isWorkbenchCardInstruction(instruction))) {
      return undefined
    }
    const model = entry.model
    // A route the contract would not accept is refused whole rather than rendered as a
    // half-read pair: the field shows what the run will use, so it cannot hold junk.
    if (model !== undefined && !isWorkbenchCardModel(model)) return undefined
    // Same rule for the directory: a path the Host could not have stored is not a workspace
    // this page may show or gate a run on.
    const workspace = entry.workspace
    if (workspace !== undefined && !isWorkbenchCardWorkspace(workspace)) return undefined
    // And the same for the permission mode: the page shows which mode the card runs under,
    // so a value the contract would not accept is refused rather than displayed as if the
    // sandbox had agreed to it.
    const permission = entry.permission
    if (permission !== undefined && !isWorkbenchSandboxMode(permission)) return undefined
    // And for the instruction mode, which decides whether the page draws a field at all: the
    // run control is drawn from this value, so dropping it left every card reading as "no
    // instruction needed" while the Host still refused the run it could not see an ask for.
    const instructionMode = entry.instructionMode
    if (instructionMode !== undefined && !isWorkbenchInstructionMode(instructionMode)) return undefined
    if (!Array.isArray(entry.templateSkills) || entry.templateSkills.some(name => typeof name !== 'string')) {
      return undefined
    }
    if (entry.template !== undefined && typeof entry.template !== 'string') return undefined
    cards.push({
      cardId: entry.cardId,
      ...entry.name === undefined ? {} : { name: entry.name as string },
      ...entry.skill === undefined ? {} : { skill: entry.skill as string },
      ...instruction === undefined ? {} : { instruction: instruction as string },
      ...model === undefined ? {} : { model },
      ...workspace === undefined ? {} : { workspace: { path: (workspace as { path: string }).path } },
      ...permission === undefined ? {} : { permission },
      ...instructionMode === undefined ? {} : { instructionMode },
      templateSkills: entry.templateSkills as readonly string[],
      ...entry.template === undefined ? {} : { template: entry.template },
    })
  }

  const results: WorkbenchCardResult[] = []
  for (const raw of body.results) {
    if (typeof raw !== 'object' || raw === null) return undefined
    const entry = raw as {
      runId?: unknown
      cardId?: unknown
      sessionId?: unknown
      skill?: unknown
      executedAt?: unknown
      stopReason?: unknown
      model?: unknown
    }
    if (typeof entry.runId !== 'string' || entry.runId.length === 0) return undefined
    if (typeof entry.cardId !== 'string' || !isWorkbenchCardId(entry.cardId)) return undefined
    // The session travels back to the Host when this result is refined, so a value that is
    // not a usable id is refused whole rather than sent back as if it named a session. A
    // record written before the field existed carries none, and that is accepted.
    if (!isOptionalSessionId(entry.sessionId)) return undefined
    if (typeof entry.skill !== 'string' || typeof entry.executedAt !== 'number' || typeof entry.stopReason !== 'string') {
      return undefined
    }
    // The run-detail row names the route straight from this value, so a malformed one is
    // refused here rather than printed as if it were real provenance.
    if (entry.model !== undefined && !isWorkbenchCardModel(entry.model)) return undefined
    results.push({ ...(raw as WorkbenchCardResult), runId: entry.runId, cardId: entry.cardId })
  }

  return {
    cards,
    results,
    revision: body.revision,
    ...capabilities === undefined ? {} : { capabilities },
  }
}

/**
 * Validate the run capability the Host recorded.
 * @param value - the decoded `capabilities` field.
 * @returns the capability, or undefined when it is outside the contract.
 */
function parseCapabilities(value: unknown): WorkbenchRunCapabilities | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const body = value as { startActivation?: unknown; start?: unknown }
  if (typeof body.startActivation !== 'boolean' && typeof body.start !== 'boolean') return undefined
  // Either field decides the run gate, so a missing one reads as `false` rather than
  // being carried through: an absent seam is exactly what the gate states.
  return { startActivation: body.startActivation === true, start: body.start === true }
}

/**
 * Validate one directory-check body.
 *
 * The three answers are read as booleans rather than passed through: the field decides
 * whether the run control opens from them, and a missing one would read as `false` by
 * accident — a card that can never run for no stated reason.
 * @param value - decoded body.
 * @returns the three facts, or undefined when a field is outside the contract.
 */
export function parseDirectoryStat(value: unknown): WorkbenchDirectoryStat | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const body = value as {
    apiVersion?: unknown
    path?: unknown
    exists?: unknown
    isDirectory?: unknown
    writable?: unknown
  }
  if (body.apiVersion !== WORKBENCH_SKILL_CARD_API_VERSION) return undefined
  if (typeof body.path !== 'string') return undefined
  if (typeof body.exists !== 'boolean' || typeof body.isDirectory !== 'boolean') return undefined
  if (typeof body.writable !== 'boolean') return undefined
  return { exists: body.exists, isDirectory: body.isDirectory, writable: body.writable }
}

/**
 * Validate one catalog response body.
 * @param value - decoded body.
 * @returns the entries, or undefined when a field is outside the contract.
 */
export function parseCatalog(value: unknown): readonly WorkbenchSkillCatalogEntry[] | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const body = value as { apiVersion?: unknown; skills?: unknown }
  if (body.apiVersion !== WORKBENCH_SKILL_CARD_API_VERSION) return undefined
  if (!Array.isArray(body.skills)) return undefined
  const entries: WorkbenchSkillCatalogEntry[] = []
  for (const raw of body.skills) {
    if (typeof raw !== 'object' || raw === null) return undefined
    const entry = raw as { name?: unknown; description?: unknown; whenToUse?: unknown; userInvocable?: unknown }
    if (typeof entry.name !== 'string' || !isWorkbenchSkillName(entry.name)) return undefined
    if (typeof entry.description !== 'string' || typeof entry.userInvocable !== 'boolean') return undefined
    if (entry.whenToUse !== undefined && typeof entry.whenToUse !== 'string') return undefined
    entries.push({
      name: entry.name,
      description: entry.description,
      ...entry.whenToUse === undefined ? {} : { whenToUse: entry.whenToUse },
      userInvocable: entry.userInvocable,
    })
  }
  return entries
}

/**
 * Validate one result-edit response body.
 * @param value - decoded body.
 * @returns the revision and record, or undefined when a field is outside the contract.
 */
export function parseResultEdit(
  value: unknown,
): { readonly revision: string; readonly result: WorkbenchCardResult } | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const body = value as { apiVersion?: unknown; revision?: unknown; result?: unknown }
  if (body.apiVersion !== WORKBENCH_SKILL_CARD_API_VERSION) return undefined
  if (typeof body.revision !== 'string') return undefined
  if (typeof body.result !== 'object' || body.result === null) return undefined
  const raw = body.result as {
    runId?: unknown
    cardId?: unknown
    sessionId?: unknown
    skill?: unknown
    executedAt?: unknown
    stopReason?: unknown
    model?: unknown
    editedAt?: unknown
  }
  if (typeof raw.runId !== 'string' || raw.runId.length === 0) return undefined
  if (typeof raw.cardId !== 'string' || !isWorkbenchCardId(raw.cardId)) return undefined
  // The edited record still names the session it came from: 重新生成 reads it from here, so
  // the same rule the snapshot read applies.
  if (!isOptionalSessionId(raw.sessionId)) return undefined
  if (typeof raw.skill !== 'string' || typeof raw.executedAt !== 'number' || typeof raw.stopReason !== 'string') {
    return undefined
  }
  if (raw.model !== undefined && !isWorkbenchCardModel(raw.model)) return undefined
  // The provenance field is read rather than passed through blind: the row the page draws
  // from it must not render a value the contract would not accept.
  if (raw.editedAt !== undefined && (typeof raw.editedAt !== 'number' || !Number.isFinite(raw.editedAt))) {
    return undefined
  }
  return {
    revision: body.revision,
    result: { ...(body.result as WorkbenchCardResult), runId: raw.runId, cardId: raw.cardId },
  }
}

/**
 * Validate one run-state response body.
 * @param value - decoded body.
 * @returns the state, or undefined when a field is outside the contract.
 */
export function parseRunResponse(value: unknown): WorkbenchRunState | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const body = value as { apiVersion?: unknown; state?: unknown }
  if (body.apiVersion !== WORKBENCH_SKILL_CARD_API_VERSION) return undefined
  return parseRunState(body.state)
}

/**
 * Validate one run state.
 * @param value - the decoded state, with no envelope around it.
 * @returns the state, or undefined when a field is outside the contract.
 */
function parseRunState(value: unknown): WorkbenchRunState | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const state = value as { cardId?: unknown; phase?: unknown; retried?: unknown; runId?: unknown }
  if (typeof state.cardId !== 'string' || !isWorkbenchCardId(state.cardId)) return undefined
  if (!RUN_PHASES.includes(state.phase as WorkbenchRunPhase)) return undefined
  if (typeof state.retried !== 'boolean') return undefined
  if (state.runId !== undefined && typeof state.runId !== 'string') return undefined
  return value as WorkbenchRunState
}

/**
 * Read the run list a state response carries.
 *
 * The list is optional on the wire, and a Host that predates concurrent runs sends none —
 * so an absent or unusable list is read as the one state the response always carried
 * rather than as a malformed answer. A state the contract refuses is dropped from the
 * list, for the same reason: one bad entry must not cost the page the runs it can read.
 * @param value - the decoded response body.
 * @param state - the newest state, already validated.
 * @returns the list, never empty.
 */
function parseRunStates(value: unknown, state: WorkbenchRunState): readonly WorkbenchRunState[] {
  if (typeof value !== 'object' || value === null) return [state]
  const listed = (value as { states?: unknown }).states
  if (!Array.isArray(listed)) return [state]
  const states = listed
    .map(entry => parseRunState(entry))
    .filter((entry): entry is WorkbenchRunState => entry !== undefined)
  return states.length === 0 ? [state] : states
}

/**
 * Render one failure for a log line.
 * @param error - the failure.
 * @returns a readable message.
 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
