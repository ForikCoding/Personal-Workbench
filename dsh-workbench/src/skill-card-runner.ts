/**
 * Skill card runner: reads one session's skill catalog, runs a card's skill
 * through an independent child agent, and owns the retry, cancellation, and
 * timeout policy.
 *
 * The runner holds no durable state: a settled result goes to the store, and the
 * run table only carries what a polling client has to see until the next run. A
 * bare run skips the store entirely, because its whole result is whether it worked.
 * @module dsh-workbench/skill-card-runner
 */

import type {
  WorkbenchActivityEntry,
  WorkbenchCardConfigView,
  WorkbenchCardModel,
  WorkbenchCardWorkspace,
  WorkbenchResultRecord,
  WorkbenchRunPhase,
  WorkbenchRunRequest,
  WorkbenchRunState,
  WorkbenchSandboxMode,
  WorkbenchSkillCardErrorCode,
  WorkbenchSkillCatalogEntry,
} from './skill-card-contract.ts'
import { effectiveWorkbenchSandboxMode } from './skill-card-contract.ts'
import type { WorkbenchActivityEvent } from './skill-card-activity.ts'
import { activityEntriesFor, withActivityEntries } from './skill-card-activity.ts'
import type {
  WorkbenchActivationSeam,
  WorkbenchAgent,
  WorkbenchAgentHandle,
  WorkbenchModelInfo,
  WorkbenchSkillCardHost,
  WorkbenchSkillDefinition,
  WorkbenchSkillLookup,
  WorkbenchSubagentHost,
  WorkbenchSubagentResult,
  WorkbenchWorkingDirectory,
} from './skill-card-host.ts'
import { WorkbenchSandboxModeError } from './skill-card-host.ts'
import type { WorkbenchDirectoryProbe } from './skill-card-directory.ts'
import { renderWorkbenchBarePrompt, renderWorkbenchRefinePrompt, renderWorkbenchSkillPrompt } from './skill-card-prompt.ts'

/**
 * Why a card run cannot start on a harness without either run seam.
 *
 * One sentence naming the exact members the harness must provide and where each exists:
 * this text is an operator's remedy, so it says which version and channel has which seam.
 */
const SUBAGENT_SEAM_DETAIL =
  'this harness provides neither subagents.startActivation (0.2.1-alpha.2, the beta channel) nor the one-shot subagents.start (0.2.0-rc.2, the stable channel), so a card run cannot start'

/**
 * Why a refinement with no session cannot start.
 *
 * A refinement continues the session that produced the document it revises. A result
 * stored before the workbench kept a session per run carries none, and neither the
 * current session nor a new one is the conversation that wrote it, so the run is refused
 * rather than started somewhere the result did not come from.
 */
const REFINE_SESSION_MISSING_DETAIL =
  'the run being refined recorded no session, so there is no session to revise it in'

/**
 * The error name a durable session store uses for an identity that is already taken.
 *
 * Matched by name because the class lives in the persistence package this plugin does not
 * depend on. It is the one failure a fresh session id may legitimately meet, and the only
 * one the runner retries.
 */
const SESSION_ALREADY_EXISTS = 'SessionAlreadyExistsError'

/** Outcome of reading one session's skill catalog. */
export type WorkbenchCatalogOutcome =
  | { readonly status: 'ok'; readonly entries: readonly WorkbenchSkillCatalogEntry[] }
  | { readonly status: 'failed'; readonly code: WorkbenchSkillCardErrorCode; readonly detail: string }

/** One refused start, shared by the two things a start resolves before it records a run. */
interface RejectedStart {
  readonly status: 'rejected'
  readonly code: WorkbenchSkillCardErrorCode
  readonly detail: string
}

/** Outcome of asking one card's run to start. */
export type WorkbenchRunStartOutcome =
  | { readonly status: 'started'; readonly state: WorkbenchRunState }
  | RejectedStart

/**
 * The session one run executes in, and what the runner owes it when the run settles.
 *
 * Resolved before a run is recorded, because the session is part of what the run is: its
 * id is stamped on the stored result, and its agent is the parent the child hangs from.
 * The agent whose scope resolves the skill definition is a separate choice — a card or
 * bare run may name the session the card was configured against, while a refinement
 * resolves through the session it continues. Settling the session belongs to the runner
 * rather than the caller, so a run that fails, is cancelled, or times out ends in the same
 * place: its session is archived out of the session list and its agent released.
 */
interface RunSession {
  /** Session identity the run executes in, recorded on the run's result. */
  readonly id: string
  /** Live agent of that session. */
  readonly agent: WorkbenchAgent
  /**
   * Leave the session as this feature keeps it, and release the agent this run acquired.
   *
   * Never throws: a captured result must not become a failure because teardown did.
   * @returns resolution once the archive is recorded and any owned agent is released.
   */
  settle(): Promise<void>
}

/** One run's session, or why it could not be resolved. */
type RunSessionOutcome =
  | { readonly status: 'resolved'; readonly session: RunSession }
  | RejectedStart

/** What one card is configured to run. */
export interface WorkbenchCardSelection {
  /** Selected skill; absent means the card is unconfigured. */
  readonly skill?: string
  /** Template stored for the selected skill; absent means the card cannot run. */
  readonly template?: string
  /**
   * Model the card runs on; absent means its runs inherit the session's model.
   *
   * Read from storage rather than from the request: the route a card runs on is part of
   * what the card is, so a client cannot start a run on a route the card does not name.
   */
  readonly model?: WorkbenchCardModel
  /**
   * Directory the card runs in; absent means the card cannot run.
   *
   * Read from storage for the same reason the route is: where a card runs is part of what
   * the card is. There is no fallback to the session's directory — a run would then happen
   * somewhere the user never chose, and every result would be about a different folder.
   */
  readonly workspace?: WorkbenchCardWorkspace
  /**
   * Sandbox mode the card's runs use; absent means the default mode applies.
   *
   * Read from storage for the same reason the route is: a permission is part of what the
   * card is, so a client cannot start a run under a mode the card does not name.
   */
  readonly permission?: WorkbenchSandboxMode
}

/**
 * Project one stored card onto the selection a run reads.
 *
 * One function rather than an inline object built at composition, because every field a run
 * needs from the card record passes through here: a field the record holds and this
 * projection forgets is one missing line, not something a reader has to notice inside a
 * route assembly callback. Omitting `permission` here would leave every card on the default
 * mode while the page still showed the stored one.
 * @param card - the card as storage returns it, or undefined when none is stored.
 * @returns the selection; an absent field stays absent rather than becoming `undefined`.
 */
export function cardSelection(card: WorkbenchCardConfigView | undefined): WorkbenchCardSelection {
  return {
    ...card?.skill === undefined ? {} : { skill: card.skill },
    ...card?.template === undefined ? {} : { template: card.template },
    ...card?.model === undefined ? {} : { model: card.model },
    ...card?.workspace === undefined ? {} : { workspace: card.workspace },
    ...card?.permission === undefined ? {} : { permission: card.permission },
  }
}

/** Everything the runner depends on. */export interface WorkbenchSkillCardRunnerOptions {
  /** Host services, narrowed. */
  readonly host: WorkbenchSkillCardHost
  /**
   * Optional working-directory service.
   *
   * Absent on channels whose pinned harness predates it; the runner then reads
   * the directory from the agent's session header, as that channel does.
   */
  readonly workingDirectory?: WorkbenchWorkingDirectory
  /**
   * The one filesystem read a start performs.
   *
   * Required rather than defaulted: every run is gated on it, so a composition that
   * forgot to wire it cannot quietly behave as if there were no gate.
   */
  readonly statDirectory: WorkbenchDirectoryProbe
  /** Configured child backend name. */
  readonly subagentProvider: string
  /** Milliseconds one run may take before it is cancelled. */
  readonly runTimeoutMs: number
  /** Runs allowed in flight across all cards. */
  readonly maxConcurrentRuns: number
  /**
   * Read one card's stored configuration.
   *
   * The run request carries only what the client knows; whether a template
   * actually exists is the Host's own answer, and a template is the precondition
   * for running.
   */
  readonly selection: (cardId: string) => WorkbenchCardSelection
  /**
   * Persist one card's settled result.
   * @param cardId - the card.
   * @param record - the complete result.
   * @returns resolution after durability.
   */
  readonly saveResult: (cardId: string, record: WorkbenchResultRecord) => Promise<void>
  /** Host logger. */
  readonly warn: (message: string) => void
  /** Clock seam; defaults to the wall clock. */
  readonly now?: () => number
}

/** One card's run, kept until the next run replaces it. */
interface RunRecord {
  readonly cardId: string
  readonly startedAt: number
  readonly controller: AbortController
  /**
   * The session this run executes in, resolved before the run was recorded.
   *
   * Owned by the run: whatever terminal phase it reaches, this is settled once, which is
   * what keeps a card's sessions archived and its agents released.
   */
  readonly session: RunSession
  /**
   * Whether this run fills a template.
   *
   * A bare run executes a skill and keeps nothing: no template, no contract, and no
   * stored result. The flag is what keeps that promise in the paths that persist.
   */
  readonly bare: boolean
  phase: WorkbenchRunPhase
  retried: boolean
  result?: WorkbenchResultRecord
  /** Readable terminal reason. */
  failure?: string
  /** Machine-readable terminal reason, so the client can act on it. */
  failureCode?: WorkbenchSkillCardErrorCode
  /**
   * Session identity of the child currently executing an attempt.
   *
   * Kept so an `agent/error` arriving on the host bus can be attributed to this run:
   * that event is the only place the child's failure detail exists, because the
   * subagent seam reduces a faulted child to `stopReason: 'error'` with no diagnostic.
   */
  childId?: string | undefined
  /** The child's own failure text, captured from the host bus during the attempt. */
  childError?: string | undefined
  /** Whether the deadline, rather than a caller, ended this run. */
  timedOut: boolean
  timer?: ReturnType<typeof setTimeout>
  /**
   * What the child has done so far, oldest first.
   *
   * The same array is both what a poll reports while the run is live and what settles into
   * the stored record, so the stream and 运行详情 can never disagree about what happened.
   * Kept whole for the run rather than per attempt: a retry is part of this run, and a trace
   * that started over would hide the work the first attempt did.
   */
  activity: WorkbenchActivityEntry[]
}

/**
 * What one attempt runs, in the shape its prompt needs.
 *
 * A discriminated union rather than a set of nullable fields: the runs that fill a
 * template always have one and a contract, a bare run never has either, and a refine
 * run additionally carries what it revises.
 */
type RunInput =
  | {
    readonly kind: 'card'
    /**
     * The run's session agent.
     *
     * It is the parent the child hangs from: a child inherits its parent's session header,
     * and the sandbox derives its writable root from that header, so rooting this agent at
     * the card's directory is the whole mechanism that fences the run. See
     * docs/workbench-workspace-fence-plan.md.
     */
    readonly agent: WorkbenchAgent
    /**
     * The agent whose scope resolves the skill definition; absent resolves through the
     * run's own agent (the global and project layers).
     */
    readonly scope?: WorkbenchAgent
    readonly skill: string
    /** The card's HTML for this skill, carried into the prompt as the output template. */
    readonly template: string
    /** Route this run is pinned to; absent inherits the session's. */
    readonly model?: WorkbenchCardModel
    /** The row that triggered this run, when a click did. */
    readonly payload?: Record<string, unknown>
    readonly outputSchema: unknown
  }
  | {
    readonly kind: 'refine'
    /** The run's session agent; see the card variant. */
    readonly agent: WorkbenchAgent
    /**
     * The agent whose scope resolves the skill definition; absent resolves through the
     * run's own agent (the global and project layers).
     */
    readonly scope?: WorkbenchAgent
    readonly skill: string
    /** The card's HTML for this skill, the same document a card run fills. */
    readonly template: string
    /** Route this run is pinned to; absent inherits the session's. */
    readonly model?: WorkbenchCardModel
    /** The region HTML the revision starts from, verbatim. */
    readonly previous: string
    /** What to change, verbatim. */
    readonly instruction: string
    /** The row that triggered this run, when a click did. */
    readonly payload?: Record<string, unknown>
    readonly outputSchema: unknown
  }
  | {
    readonly kind: 'bare'
    /** The run's session agent; see the card variant. */
    readonly agent: WorkbenchAgent
    /**
     * The agent whose scope resolves the skill definition; absent resolves through the
     * run's own agent (the global and project layers).
     */
    readonly scope?: WorkbenchAgent
    readonly skill: string
    /** Route this run is pinned to; absent inherits the session's. */
    readonly model?: WorkbenchCardModel
    /** The row that triggered this run, when a click did. */
    readonly payload?: Record<string, unknown>
  }

/** Outcome of one child execution. */
type AttemptOutcome =
  | { readonly kind: 'captured'; readonly record: WorkbenchResultRecord }
  | {
    readonly kind: 'unusable'
    readonly record: WorkbenchResultRecord
    readonly failure: string
    readonly retryable: boolean
  }
  | { readonly kind: 'cancelled'; readonly record: WorkbenchResultRecord }
  | { readonly kind: 'failed'; readonly code: WorkbenchSkillCardErrorCode; readonly failure: string }

/**
 * Run one card's skill and own the outcome.
 *
 * One run at a time per card, bounded globally by the deployment's concurrency
 * limit. A run that produces no usable structured value is retried exactly once;
 * a cancelled run never is.
 */
export class WorkbenchSkillCardRunner {
  private readonly runs = new Map<string, RunRecord>()
  private readonly inflight = new Set<Promise<void>>()
  private readonly now: () => number
  private active = 0

  /**
   * @param options - host services, budgets, and the two storage seams.
   */
  constructor(private readonly options: WorkbenchSkillCardRunnerOptions) {
    this.now = options.now ?? ((): number => Date.now())
  }

  /**
   * Highest session stamp published for each card, in this process.
   *
   * A session id cannot be published twice, and the id is the run's start — so two runs of
   * one card that start within the same millisecond, which is what a fixed clock in a spec
   * produces, would ask for the same id. Keeping the last stamp makes the second run's id
   * one greater than the first, so ids stay readable and unique without a random tag.
   */
  private readonly sessionStamps = new Map<string, number>()

  /**
   * Read the skill catalog a card can choose from.
   *
   * The read always goes through an agent scope. A scope-less read returns the
   * global layer alone, and the shipped web composition disables the host's own
   * skill provider there, so it would answer with an empty list instead of the
   * installed skills.
   *
   * The named session's agent is preferred, because that is the agent the run will
   * use. With no session yet the catalog falls back to any live agent: a card is
   * configured before it is first run, and the installed skills are the same list
   * whichever live agent supplies the scope.
   * @param sessionId - the session to read through, when the card has one.
   * @returns the catalog, or why it could not be read.
   */
  async catalog(sessionId: string | undefined): Promise<WorkbenchCatalogOutcome> {
    const agent = this.catalogAgent(sessionId)
    const controller = new AbortController()
    try {
      // With no session open there is no agent scope to read, so the global layer
      // answers instead. That is the installed catalog the Desktop layer mounts its
      // own host-plane provider for, and it is what lets a card be configured
      // before it is ever run.
      const cwd = agent === undefined ? undefined : await this.cwdFor(agent, controller.signal)
      const skills = await this.options.host.skills.list(lookupFor(agent, cwd, controller.signal))
      return { status: 'ok', entries: skills.map(toCatalogEntry) }
    } catch (error) {
      const detail = messageOf(error)
      this.options.warn(`workbench skill card catalog failed: ${detail}`)
      return { status: 'failed', code: 'catalog-failed', detail }
    }
  }

  /**
   * Choose the agent whose scope supplies the catalog.
   * @param sessionId - the session to read through, when the card has one.
   * @returns that agent, another live one, or undefined when none is live.
   */
  private catalogAgent(sessionId: string | undefined): WorkbenchAgent | undefined {
    if (sessionId !== undefined) {
      const named = this.options.host.agents.get(sessionId)
      if (named !== undefined) return named
    }
    return this.options.host.agents.list()[0]
  }

  /**
   * Start one card's run.
   *
   * Every precondition is answered before anything is started, so a rejected
   * start never leaves a child behind and never costs a model call.
   * @param request - card, what the run is asked to do, the session a refinement continues,
   * and the client's contract.
   * @returns the started run's state, or why it was refused.
   */
  async start(request: WorkbenchRunRequest): Promise<WorkbenchRunStartOutcome> {
    // A run seam is the first capability every mode needs, and the composition has
    // already probed it once. This is the second line rather than a probe: a stale
    // click, a direct route call, or a template button that arrives on a harness
    // without either seam has to be refused here. Letting it through would reach the
    // one call that needs a seam and throw `undefined is not a function` out of the
    // request handler, which is a stack trace where a state belongs.
    const subagents = this.options.host.subagents
    const activate = this.activationSeam(subagents)
    if (activate === undefined) {
      return reject('run-unavailable', SUBAGENT_SEAM_DETAIL)
    }
    const mode = request.mode
    // A bare run asks for no value, so a missing contract is not a defect there. Every
    // run that fills a template — a first fill or a revision — has one to satisfy.
    if (mode.kind !== 'bare' && !looksLikeContract(request.outputSchema)) {
      return reject('schema-rejected', 'the run carried no object-rooted output contract')
    }
    // Every mode reads the card's own selection: a bare run takes its skill from the
    // button, but it still runs on the card that owns the button, so the route and the
    // template precondition are answered from the same record a card run reads.
    const selection = this.options.selection(request.cardId)
    const skill = mode.kind === 'bare' ? mode.skill : selection.skill
    if (skill === undefined) {
      return reject('not-configured', 'no skill is configured for this card')
    }
    // A refinement continues the session the revised document came from, so that is the one
    // session a request can name. A record stored before the workbench kept one per run has
    // none, and neither the running session nor a new one is where the document came from.
    const refineSessionId = mode.kind === 'refine' ? request.sessionId : undefined
    if (mode.kind === 'refine' && refineSessionId === undefined) {
      return reject('session-not-live', REFINE_SESSION_MISSING_DETAIL)
    }
    // A document is what every mode but a bare run fills, so the template is answered here,
    // before a session is published: a card that lost its template is refused without
    // creating one. What the prompt says depends on the run's own agent, which does not
    // exist yet, so the run's input is built by the function below once the session is
    // resolved.
    const model = selection.model
    const pinned = model === undefined ? {} : { model }
    // The agent whose scope resolves the skill definition is separate from the run's own
    // session and is not known until that session is resolved, so the closures take it as a
    // parameter rather than reading it here.
    let inputOf: (agent: WorkbenchAgent, scope: WorkbenchAgent | undefined) => RunInput
    if (mode.kind === 'bare') {
      inputOf = (agent, scope) => ({
        kind: 'bare',
        agent,
        ...scope === undefined ? {} : { scope },
        skill,
        ...pinned,
        ...request.payload === undefined ? {} : { payload: request.payload },
      })
    } else {
      const template = selection.template
      if (template === undefined) {
        return reject('template-missing', `no template is stored for skill "${skill}"`)
      }
      inputOf = mode.kind === 'refine'
        ? (agent, scope) => ({
            kind: 'refine',
            agent,
            ...scope === undefined ? {} : { scope },
            skill,
            template,
            ...pinned,
            previous: mode.previous,
            instruction: mode.instruction,
            ...request.payload === undefined ? {} : { payload: request.payload },
            outputSchema: request.outputSchema,
          })
        : (agent, scope) => ({
            kind: 'card',
            agent,
            ...scope === undefined ? {} : { scope },
            skill,
            template,
            ...pinned,
            ...request.payload === undefined ? {} : { payload: request.payload },
            outputSchema: request.outputSchema,
          })
    }
    const providerName = this.options.subagentProvider
    const provider = this.options.host.subagents.getProvider(providerName)
    if (provider === undefined) {
      return reject('provider-unavailable', `subagent provider "${providerName}" is not registered`)
    }
    // Structured output is required by the runs that ask for a contract. A bare run
    // reads the child's stop reason instead, so it does not need that capability.
    if (request.outputSchema !== undefined && !provider.capabilities.outputSchema) {
      return reject('provider-unavailable', `subagent provider "${providerName}" cannot return structured output`)
    }
    // Refuse rather than fall back. A card that names a model the deployment cannot route
    // must not quietly run on the session's model: the card says one thing, the run would
    // do another, and the result would name a route it never used.
    if (model !== undefined) {
      const refusal = await this.modelRefusal(providerName, provider.capabilities.agentOptions, model)
      if (refusal !== undefined) return refusal
    }
    // Where the run happens is the card's own answer, checked before anything is started.
    // Refusing rather than falling back to the session's directory is the whole point: a
    // card whose folder was moved must stop, not quietly run somewhere the user never
    // picked and stamp a result that does not say so.
    const workspace = selection.workspace
    if (workspace === undefined) {
      return reject(
        'workspace-missing',
        `no workspace directory is configured for card "${request.cardId}"`,
      )
    }
    const found = await this.options.statDirectory(workspace.path)
    if (!found.exists || !found.isDirectory) {
      // The refusal names the full path, because "the directory is gone" is only actionable
      // when it says which directory.
      return reject(
        'workspace-invalid',
        `the workspace directory "${workspace.path}" does not exist or is not a directory`,
      )
    }
    // Checked here as well as below, and the earlier check is load-bearing: resolving a
    // run's session creates one, and a start that will be refused must not publish a
    // session — or restore one a running child still hangs from — on its way to a refusal.
    if (this.congested(request.cardId)) {
      return reject('run-in-progress', 'another run is already in flight')
    }
    // The session a run executes in, resolved before anything starts. A card run gets a
    // fresh one of its own, rooted at the card's directory and carrying its permission
    // mode: the mode is applied at creation, so a deployment that cannot apply it refuses
    // the start rather than letting the run proceed under whatever the session happens to
    // be set to. A refinement instead re-attaches the session recorded on the result it
    // revises, because revising a document means continuing the conversation that wrote it.
    const startedAt = this.now()
    let session: RunSession
    try {
      const resolved = refineSessionId === undefined
        ? await this.openRunSession(request.cardId, workspace.path, startedAt)
        : await this.attachRunSession(refineSessionId)
      if (resolved.status === 'rejected') return resolved
      session = resolved.session
    } catch (error) {
      if (error instanceof WorkbenchSandboxModeError) {
        return reject(
          'permission-unavailable',
          `card "${request.cardId}" cannot apply its permission mode: ${error.message}`,
        )
      }
      // Anything else is a fault from the agent layer, not a permission decision; it
      // travels as itself rather than being reported as one.
      throw error
    }
    // Checked again, immediately before the reservation: resolving the session above
    // awaits, and two starts that both awaited it must not both win. The session this start
    // published is settled first, so a refused start leaves nothing archived behind.
    if (this.congested(request.cardId)) {
      await session.settle()
      return reject('run-in-progress', 'another run is already in flight')
    }
    const agent = session.agent
    // The agent whose scope resolves the skill definition, resolved now that the run's
    // own session exists. The run executes elsewhere — in its own fresh session, or in
    // the session a refinement continues — and neither answers for the skill: a custom
    // skill was registered in the session the card was configured against, and only that
    // session's scope chain resolves it. The client names that live session, and only a
    // live agent can be a scope: a name with no live agent — or no name at all —
    // resolves through the run's own agent, whose chain carries only the global and
    // project layers.
    const scope = request.scopeSessionId === undefined
      ? undefined
      : this.options.host.agents.get(request.scopeSessionId)

    const run: RunRecord = {
      cardId: request.cardId,
      startedAt,
      controller: new AbortController(),
      bare: mode.kind === 'bare',
      session,
      phase: 'running',
      retried: false,
      timedOut: false,
      activity: [],
    }
    run.timer = setTimeout(() => {
      // Recorded before the abort so the settle path can tell a deadline from a
      // caller's cancellation.
      run.timedOut = true
      run.controller.abort()
    }, this.options.runTimeoutMs)
    this.runs.set(request.cardId, run)
    this.active += 1

    // Bound to the service it came from, and to the seam this harness offers: the
    // attempt path calls it from a different method, and the real ones read their
    // own receiver.
    const execution = this.execute(run, inputOf(agent, scope), activate)
    this.inflight.add(execution)
    void execution
      .catch((error: unknown) => { this.options.warn(`workbench skill card runner faulted: ${messageOf(error)}`) })
      .finally(() => { this.inflight.delete(execution) })

    return { status: 'started', state: this.stateOf(run) }
  }

  /**
   * Whether one more start would exceed the card's or the deployment's limit.
   *
   * Asked twice per start: once before the run's session is resolved, so a refused start
   * publishes no session and restores none underneath a child still running in it, and once
   * immediately before the run is recorded, so the reservation itself stays synchronous.
   * @param cardId - the card the run belongs to.
   * @returns whether another run is already in flight or the limit is reached.
   */
  private congested(cardId: string): boolean {
    return this.runs.get(cardId)?.phase === 'running' || this.active >= this.options.maxConcurrentRuns
  }

  /**
   * Resolve the run seam this harness offers, bound to its service.
   *
   * Which seam exists is a property of the installed harness, so the runner adapts
   * rather than requires one: `startActivation` (0.2.1-alpha.2) is used as-is, and the
   * older channel's one-shot `start` (0.2.0-rc.2) is wrapped — its request carries the
   * same `prompt`, `parent`, `signal`, `outputSchema` and `agentOptions` (no `cwd`, no
   * `delivery`: the child inherits the parent's header at start and the result resolves
   * to the caller — all measured on a real host composition), and its handle carries
   * `id` where an activation carries `childId`. A harness offering neither returns
   * `undefined`, which the start path refuses with the seam detail.
   * @param subagents - the subagent service.
   * @returns the bound seam, or undefined when this harness offers no run seam.
   */
  private activationSeam(subagents: WorkbenchSubagentHost): WorkbenchActivationSeam | undefined {
    const startActivation = subagents.startActivation
    if (typeof startActivation === 'function') return startActivation.bind(subagents)
    const start = subagents.start
    if (typeof start !== 'function') return undefined
    return async spec => {
      const handle = await start.call(subagents, spec.provider, {
        ...spec.label === undefined ? {} : { label: spec.label },
        prompt: spec.request.prompt,
        parent: spec.request.parent,
        signal: spec.signal,
        ...spec.request.outputSchema === undefined ? {} : { outputSchema: spec.request.outputSchema },
        ...spec.request.agentOptions === undefined ? {} : { agentOptions: spec.request.agentOptions },
      })
      return { childId: handle.id, result: handle.result, dispose: () => handle.dispose() }
    }
  }

  /**
   * Answer whether a card's route can actually be run here.
   *
   * Three separate reasons, and each refuses rather than falling back to the session's
   * model: a backend that cannot take a route, a provider this deployment does not route,
   * and a provider that no longer offers that model. The last two are told apart by the
   * registry itself — `listModels` rejects for a provider it does not have — and the
   * message names the route in every case, because "the model is gone" is only actionable
   * when it says which one.
   * @param providerName - configured subagent backend name.
   * @param canChooseModel - whether that backend advertises the `agentOptions` capability.
   * @param model - the route the card names.
   * @returns the refusal, or undefined when the route can be used.
   */
  private async modelRefusal(
    providerName: string,
    canChooseModel: boolean,
    model: WorkbenchCardModel,
  ): Promise<WorkbenchRunStartOutcome | undefined> {
    const route = `"${model.provider}/${model.model}"`
    if (!canChooseModel) {
      return reject(
        'provider-unavailable',
        `subagent provider "${providerName}" cannot run a chosen model, so ${route} cannot be used`,
      )
    }
    let offered: readonly WorkbenchModelInfo[]
    try {
      offered = await this.options.host.llm.listModels(model.provider)
    } catch (error) {
      return reject(
        'provider-unavailable',
        `model provider "${model.provider}" is not available, so ${route} cannot be used: ${messageOf(error)}`,
      )
    }
    if (!offered.some(entry => entry.id === model.model)) {
      return reject('model-unavailable', `provider "${model.provider}" does not offer the model ${route}`)
    }
    return undefined
  }

  /**
   * Record a child agent's failure against the run that started it.
   *
   * The subagent seam turns a faulted child into `stopReason: 'error'` and drops the
   * error itself, so this bus reading is the only account of what went wrong. An
   * agent this runner did not start is ignored.
   * @param agentId - the failing agent's identity, which is its session id.
   * @param error - the failure the agent reported.
   */
  observeAgentError(agentId: string, error: unknown): void {
    for (const run of this.runs.values()) {
      if (run.childId !== agentId || run.phase !== 'running') continue
      run.childError = messageOf(error)
    }
  }

  /**
   * Record one of a child agent's session events against the run that started it.
   *
   * The same bus, the same attribution rule, and the same "an agent this runner did not
   * start is ignored" contract as {@link observeAgentError}: the child's session id is the
   * identity both events carry. A `tool/call` becomes one call entry and an
   * `assistant/message` becomes its narration entries — the mapping lives in
   * `skill-card-activity.ts`, together with the redaction and the bounds.
   * @param sessionId - the session the event came from, which is the child's id.
   * @param event - the session event as the bus delivered it.
   */
  observeChildEvent(sessionId: string, event: WorkbenchActivityEvent): void {
    const entries = activityEntriesFor(event)
    if (entries.length === 0) return
    for (const run of this.runs.values()) {
      if (run.childId !== sessionId || run.phase !== 'running') continue
      run.activity = withActivityEntries(run.activity, entries)
    }
  }

  /**
   * Read one card's run state.
   * @param cardId - the card.
   * @returns the state, or undefined when no run has been started for it.
   */
  state(cardId: string): WorkbenchRunState | undefined {
    const run = this.runs.get(cardId)
    return run === undefined ? undefined : this.stateOf(run)
  }

  /**
   * Cancel one card's in-flight run.
   * @param cardId - the card.
   * @returns whether a running run was signalled.
   */
  cancel(cardId: string): boolean {
    const run = this.runs.get(cardId)
    if (run === undefined || run.phase !== 'running') return false
    run.controller.abort()
    return true
  }

  /**
   * Cancel every in-flight run and wait for them to settle.
   * @returns resolution once no run is still executing.
   */
  async dispose(): Promise<void> {
    for (const run of this.runs.values()) {
      if (run.phase === 'running') run.controller.abort()
    }
    await Promise.allSettled([...this.inflight])
    this.runs.clear()
  }

  /**
   * Publish the session one card run executes in, with the card's permission mode applied.
   *
   * A card's run gets a session of its own rather than joining the conversation the user is
   * having: the run is the card's work, and every card sharing one session would mix every
   * card's traffic into one conversation. The session is rooted at the card's directory, and
   * a child inherits its parent's session header — which is where the sandbox derives its
   * writable root from — so this agent is the whole mechanism that fences the run; no `cwd`
   * is passed and the seam stays untouched. See docs/workbench-workspace-fence-plan.md.
   *
   * The mode is applied once, here, at creation. A child inherits its parent's explicit
   * override, so recording it on this agent is what makes the card's permission govern the
   * run started from it.
   * @param cardId - the card whose run is starting.
   * @param cwd - the card's workspace directory, which roots the session.
   * @param startedAt - the run's start, used to name the session.
   * @returns the resolved session, or why it could not be published.
   * @throws {WorkbenchSandboxModeError} when the mode cannot be applied; the agent is
   * released first, so a refused start leaves nothing running under no mode.
   */
  private async openRunSession(cardId: string, cwd: string, startedAt: number): Promise<RunSessionOutcome> {
    const mode = effectiveWorkbenchSandboxMode(this.options.selection(cardId).permission)
    const handle = await this.publishRunSession(cardId, cwd, startedAt)
    try {
      this.options.host.sandbox.setMode(handle.agent.id, mode)
    } catch (error) {
      // The mode could not be recorded, so this agent must run nothing. Falling back to the
      // default mode here is the one thing this feature must not do — the card would execute
      // with a permission the user did not choose and the page would still show the old one.
      await this.releaseAgent(handle)
      throw error
    }
    return { status: 'resolved', session: this.ownedSession(handle.agent, handle) }
  }

  /**
   * Re-attach the session a refinement continues.
   *
   * The session was archived when its own run settled, and the harness refuses a model step
   * to an archived session or to a subagent descendant of one — so the run restores it,
   * runs there, and archives it again when it settles. A live agent is used as it is; one
   * that is gone is resumed from persistence, because `create` refuses an id that already
   * exists durably and a fresh session would be a different conversation.
   *
   * A session that is not archived is left that way: it is on screen because someone is in
   * it, and hiding a conversation the user has open is not this run's decision.
   * @param sessionId - the session recorded on the result being refined.
   * @returns the resolved session, or why it could not be restored.
   */
  private async attachRunSession(sessionId: string): Promise<RunSessionOutcome> {
    let owned: WorkbenchAgentHandle | undefined
    let agent = this.options.host.agents.get(sessionId)
    if (agent === undefined) {
      try {
        owned = await this.options.host.agents.resume({ resumeSessionId: sessionId })
      } catch (error) {
        return reject('session-not-live', `session "${sessionId}" cannot be re-attached: ${messageOf(error)}`)
      }
      agent = owned.agent
    }
    const archived = this.options.host.workspaceRegistry.archivedSessionIds.includes(sessionId)
    if (archived) {
      try {
        await this.options.host.workspaceRegistry.unarchiveSession(sessionId)
      } catch (error) {
        // Restoring is what lifts the archive gate, so a session that stays archived cannot
        // host the revision: the start is refused rather than left to fail as a blocked child.
        if (owned !== undefined) await this.releaseAgent(owned)
        return reject('session-not-live', `session "${sessionId}" could not be restored for the run: ${messageOf(error)}`)
      }
    }
    return { status: 'resolved', session: this.ownedSession(agent, owned, archived) }
  }

  /**
   * Wrap one agent as the run's session, owning the archive and the release together.
   *
   * One wrapper for both cases because the promise is the same either way: whatever the run
   * did, its session ends where it started — archived for a session this feature published,
   * archived again for one it restored — and the agent is released. Settling never throws,
   * because a captured result must not become a failure because teardown did; each step
   * warns instead.
   * @param agent - the run's live agent.
   * @param handle - the disposer that releases it, when this run is the one that acquired
   * it. Absent for an agent that was already live, which this run does not own.
   * @param archive - whether this session is archived when the run settles.
   * @returns the run's session.
   */
  private ownedSession(agent: WorkbenchAgent, handle: WorkbenchAgentHandle | undefined, archive = true): RunSession {
    return {
      id: agent.id,
      agent,
      settle: async () => {
        if (archive) {
          try {
            await this.options.host.workspaceRegistry.archiveSession(agent.id)
          } catch (error) {
            this.options.warn(`workbench card session archive failed: ${messageOf(error)}`)
          }
        }
        if (handle !== undefined) await this.releaseAgent(handle)
      },
    }
  }

  /**
   * Publish one fresh session for a run.
   *
   * The id is the card and the run's start, which is readable in a session list and needs
   * no random tag: a card runs once at a time, so the start is unique. A session id cannot
   * be published twice, though — a durable store still holds the session an earlier app run
   * created under the same millisecond — so a refused publication is retried once under the
   * next stamp instead of failing a run the user started.
   * @param cardId - the card whose run is starting.
   * @param cwd - the card's workspace directory, which roots the session.
   * @param startedAt - the run's start, used to name the session.
   * @returns the created agent and its handle.
   */
  private async publishRunSession(cardId: string, cwd: string, startedAt: number): Promise<WorkbenchAgentHandle> {
    const sessionId = this.nextSessionId(cardId, startedAt)
    try {
      return await this.options.host.agents.create({ sessionId, meta: { cwd } })
    } catch (error) {
      if (errorNameOf(error) !== SESSION_ALREADY_EXISTS) throw error
      return await this.options.host.agents.create({ sessionId: this.nextSessionId(cardId, startedAt), meta: { cwd } })
    }
  }

  /**
   * Name one run's session.
   *
   * The stamp never goes backwards for a card, so two runs that start within the same
   * millisecond — which a fixed clock in a spec produces — cannot ask for the same id.
   * @param cardId - the card whose run is starting.
   * @param startedAt - the run's start in milliseconds since the epoch.
   * @returns the session id.
   */
  private nextSessionId(cardId: string, startedAt: number): string {
    const stamp = Math.max(startedAt, (this.sessionStamps.get(cardId) ?? 0) + 1)
    this.sessionStamps.set(cardId, stamp)
    return `workbench-${cardId}-${String(stamp)}`
  }

  /**
   * Release one agent, warning instead of throwing.
   * @param handle - the agent to release.
   * @returns resolution once the release was attempted.
   */
  private async releaseAgent(handle: WorkbenchAgentHandle): Promise<void> {
    try {
      await handle.dispose()
    } catch (error) {
      // Teardown failure must not replace a captured result, and a leaked agent is the
      // lesser fault: the next run gets its own session either way.
      this.options.warn(`workbench card agent teardown failed: ${messageOf(error)}`)
    }
  }

  /**
   * Run one card's skill to a terminal state.
   * @param run - the run record to settle.
   * @param input - the run's agent, the agent whose scope resolves the skill definition,
   * the skill name, and the output contract.
   * @param activate - the run seam, already known to exist and bound to its service.
   * @returns resolution after the run reaches a terminal phase.
   */
  private async execute(
    run: RunRecord,
    input: RunInput,
    activate: WorkbenchActivationSeam,
  ): Promise<void> {
    const signal = run.controller.signal
    try {
      const cwd = await this.cwdFor(input.agent, signal)
      // Where the run executes is not where its skill lives: the run runs in a fresh
      // session of its own, but a custom skill was registered in the session the card was
      // configured against, and only that session's scope chain resolves it. The scope is
      // therefore the named session's agent when the request carried one, and the run's
      // own agent otherwise; the cwd stays the run's own, because the workspace is where
      // the run happens, not where the skill was registered.
      const skill = await this.options.host.skills.get(input.skill, lookupFor(input.scope ?? input.agent, cwd, signal))
      if (skill === undefined) {
        await this.finish(run, {
          kind: 'failed',
          code: 'skill-not-found',
          failure: `skill "${input.skill}" is not available to this session`,
        })
        return
      }

      let outcome = await this.attempt(run, input, cwd, skill, activate)
      // One retry, and only when repeating the ask could plausibly help: the
      // sentinel that a capture was missed is `unusable` plus `retryable`.
      if (outcome.kind === 'unusable' && outcome.retryable && !signal.aborted) {
        run.retried = true
        outcome = await this.attempt(run, input, cwd, skill, activate)
      }
await this.finish(run, outcome)
    } catch (error) {
      if (signal.aborted) {
        run.phase = 'cancelled'
        run.failure = 'the run was cancelled'
        return
      }
      const detail = messageOf(error)
      this.options.warn(`workbench skill card run failed: ${detail}`)
      run.phase = 'settled'
      run.failure = detail
      run.failureCode = 'run-failed'
    } finally {
      if (run.timer !== undefined) clearTimeout(run.timer)
      this.active -= 1
      // The run's session is settled with the run, whatever phase it reached: archived, so
      // it stays out of the session list, and its agent released. Archiving it here rather
      // than keeping the agent alive is what keeps one card's run from holding a live
      // session open forever; a refinement re-attaches through the archive, restoring the
      // session for the length of the run and archiving it again.
      await run.session.settle()
    }
  }

  /**
   * Run the child once.
   * @param run - the run record owning cancellation.
   * @param input - the agent, skill, and either the card's template and contract or nothing.
   * @param cwd - the agent's working directory.
   * @param skill - the loaded skill.
   * @param activate - the run seam, known to exist.
   * @returns the attempt's outcome.
   */
  private async attempt(
    run: RunRecord,
    input: RunInput,
    cwd: string | undefined,
    skill: WorkbenchSkillDefinition,
    activate: WorkbenchActivationSeam,
  ): Promise<AttemptOutcome> {
    const signal = run.controller.signal
    // The agent of the session this run executes in, created with its permission mode
    // applied: its session header carries the directory the card runs in, so the sandbox
    // root follows it.
    const parent = input.agent
    // The effective working directory must be the sandbox root, or relative paths resolve
    // where the fence forbids writing. The session's agent carries that directory in its
    // header, so the parent decides and the request follows it.
    const resolvedCwd = parent.session?.header?.cwd ?? cwd
    // Omitting `toolFilter` is how this run inherits the session's full tool permissions.
    // Naming a route is the card's own choice: with no model configured nothing is passed
    // and the child inherits the session's model exactly as it always did.
    const activation = await activate({
      provider: this.options.subagentProvider,
      label: `workbench:${run.cardId}`,
      signal,
      delivery: 'caller',
      request: {
        // The session's own agent. A child's session header is copied from its parent, and
        // the sandbox derives its writable root from that header — so rooting the parent at
        // the card's directory is what fences the run there.
        // See docs/workbench-workspace-fence-plan.md.
        parent,
        prompt: [{
          type: 'text',
          text: input.kind === 'card'
            ? renderWorkbenchSkillPrompt(skill, input.template, input.payload)
            : input.kind === 'refine'
              ? renderWorkbenchRefinePrompt(skill, input.template, input.previous, input.instruction, input.payload)
              : renderWorkbenchBarePrompt(skill, input.payload),
        }],
        ...resolvedCwd === undefined ? {} : { cwd: resolvedCwd },
        // Conditional on purpose: a bare run sends no contract at all, and the seam
        // treats its absence as "nothing to capture" rather than as a default.
        ...input.kind === 'bare' ? {} : { outputSchema: input.outputSchema },
        ...input.model === undefined ? {} : { agentOptions: input.model },
      },
    })
    // Bound before awaiting the result: the child may fault while it runs, and the bus
    // listener can only attribute that failure once this run claims the child.
    run.childId = activation.childId
    run.childError = undefined
    try {
      const result = await activation.result
      // A refine run settles exactly like a card run: it captured `{ html }`, so the
      // record is the same shape and the store, retry and failure paths are reused.
      // The run's own start is its identity: unique within the card, stable for its
      // whole life, and already carried by the record the page polls. The session is the
      // run's too, and it is what a later refinement continues.
      const runId = String(run.startedAt)
      const sessionId = run.session.id
      const stored = input.kind === 'bare'
        ? toBareRecord(input.skill, result, this.now(), input.model, runId, sessionId)
        : toResultRecord(input.skill, result, this.now(), input.model, runId, sessionId)
      // The child faulted and the provider authored nothing: its own report is the
      // only diagnostic there is, and the failure text reads from the record.
      const record = result.stopReason === 'error'
        && stored.diagnostic === undefined
        && run.childError !== undefined
        ? { ...stored, diagnostic: run.childError }
        : stored
      if (signal.aborted || result.stopReason === 'aborted') {
        // A bare run has no cancel control, so the only thing that aborts one is the
        // deadline — and a deadline is a failure with a reason, not a cancellation.
        if (input.kind === 'bare' && run.timedOut) {
          return { kind: 'unusable', record, failure: 'the skill run timed out', retryable: false }
        }
        return { kind: 'cancelled', record }
      }
      if (input.kind === 'bare') {
        // Nothing was asked for, so the child's own stop reason is the whole verdict.
        return result.stopReason === 'completed'
          ? { kind: 'captured', record }
          : {
            kind: 'unusable',
            record,
            failure: bareFailure(result, record.diagnostic),
            // Repeating a bare run would spend another model call for the same verdict.
            retryable: false,
          }
      }
      const usable = result.structured !== undefined && result.stopReason === 'completed'
      return usable
        ? { kind: 'captured', record }
        : { kind: 'unusable', record, failure: describeFailure(result, record.diagnostic), retryable: isRetryable(result) }
    } finally {
      run.childId = undefined
      try {
        await activation.dispose()
      } catch (error) {
        // Teardown failure must not replace a captured result.
        this.options.warn(`workbench skill card run teardown failed: ${messageOf(error)}`)
      }
    }
  }

  /**
   * Settle one run from its last attempt.
   *
   * Both a captured and an unusable result are kept: the card renders the value
   * when there is one, and the text output is what "view raw output" shows when
   * there is not. A bare run settles the same way but stores nothing.
   * @param run - the run record to settle.
   * @param outcome - the last attempt's outcome.
   * @returns resolution after the result is durable, or immediately for a bare run.
   */
  private async finish(run: RunRecord, outcome: AttemptOutcome): Promise<void> {
    if (outcome.kind === 'cancelled') {
      run.phase = 'cancelled'
      run.failure = 'the run was cancelled'
      return
    }
    if (outcome.kind === 'failed') {
      run.phase = 'settled'
      run.failure = outcome.failure
      run.failureCode = outcome.code
      return
    }

    // The trace joins the record here rather than in the attempt, because this is the one
    // place that decides what the run keeps: a bare run keeps nothing, and a run whose
    // child used no tools carries no field at all instead of an empty one.
    const record = run.bare || run.activity.length === 0
      ? outcome.record
      : { ...outcome.record, activity: run.activity }
    run.result = record
    run.phase = 'settled'
    if (outcome.kind === 'unusable') {
      run.failure = outcome.failure
      run.failureCode = 'run-failed'
    }
    // A bare run keeps nothing: its verdict stays in the run table for this session
    // and a reload leaves the card showing its own stored result.
    if (run.bare) return
    try {
      await this.options.saveResult(run.cardId, record)
    } catch (error) {
      // The card still reports the in-memory result; only the durable copy is lost.
      this.options.warn(`workbench skill card result could not be stored: ${messageOf(error)}`)
    }
  }

  /**
   * Resolve the agent's effective working directory.
   *
   * The service is preferred when the deployment has it; otherwise the session
   * header carries the same value, which is how the older channel resolves it.
   * @param agent - the agent.
   * @param signal - cancellation.
   * @returns the directory, or undefined when neither source supplies one.
   */
  private async cwdFor(agent: WorkbenchAgent, signal: AbortSignal): Promise<string | undefined> {
    const service = this.options.workingDirectory
    if (service !== undefined) return await service.ensure(agent, signal)
    return agent.session?.header?.cwd
  }

  /**
   * Project one run record onto the wire state.
   * @param run - the run record.
   * @returns the wire state.
   */
  private stateOf(run: RunRecord): WorkbenchRunState {
    return {
      cardId: run.cardId,
      phase: run.phase,
      startedAt: run.startedAt,
      retried: run.retried,
      ...run.activity.length === 0 ? {} : { activity: run.activity },
      ...run.result === undefined ? {} : { result: run.result },
      ...run.failure === undefined ? {} : { failure: run.failure },
      ...run.failureCode === undefined ? {} : { failureCode: run.failureCode },
    }
  }
}

/**
 * Build one skill view, omitting a cwd that could not be resolved.
 * @param agent - the reading agent.
 * @param cwd - the resolved directory, when there is one.
 * @param signal - cancellation.
 * @returns the view options.
 */
function lookupFor(
  agent: WorkbenchAgent | undefined,
  cwd: string | undefined,
  signal: AbortSignal,
): WorkbenchSkillLookup {
  return {
    ...cwd === undefined ? {} : { cwd },
    ...agent === undefined ? {} : { scope: agent },
    signal,
  }
}

/**
 * Build one rejected-start outcome.
 * @param code - machine-readable reason.
 * @param detail - readable reason.
 * @returns the rejected outcome.
 */
function reject(code: WorkbenchSkillCardErrorCode, detail: string): RejectedStart {
  return { status: 'rejected', code, detail }
}

/**
 * Project one catalog summary onto the wire entry.
 * @param skill - the summary.
 * @returns the wire entry.
 */
function toCatalogEntry(skill: {
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly invocation: { readonly userInvocable: boolean }
}): WorkbenchSkillCatalogEntry {
  return {
    name: skill.name,
    description: skill.description,
    ...skill.whenToUse === undefined ? {} : { whenToUse: skill.whenToUse },
    userInvocable: skill.invocation.userInvocable,
  }
}

/**
 * Project one child result onto the stored record.
 * @param skill - the skill that ran.
 * @param result - the child's terminal result.
 * @param executedAt - completion time.
 * @param model - the route the run was pinned to, when the card named one.
 * @param runId - the run identity, unique within the card.
 * @param sessionId - the session the run executed in.
 * @returns the stored record.
 */
function toResultRecord(
  skill: string,
  result: WorkbenchSubagentResult,
  executedAt: number,
  model: WorkbenchCardModel | undefined,
  runId: string,
  sessionId: string,
): WorkbenchResultRecord {
  const text = textOf(result.output)
  return {
    runId,
    sessionId,
    skill,
    executedAt,
    stopReason: result.stopReason,
    ...model === undefined ? {} : { model },
    ...result.structured === undefined ? {} : { structured: result.structured },
    ...text === '' ? {} : { outputText: text },
    ...result.diagnostic === undefined ? {} : { diagnostic: result.diagnostic },
  }
}

/**
 * Project one bare child result onto the in-memory record.
 *
 * Deliberately narrower than {@link toResultRecord}: a bare run answers only whether
 * it worked, so neither a structured value nor the output text is kept. Keeping them
 * would put a model's prose one field away from a surface that must show only the
 * verdict. The route and the session are kept, because they are provenance rather than
 * content.
 * @param skill - the skill that ran.
 * @param result - the child's terminal result.
 * @param executedAt - completion time.
 * @param model - the route the run was pinned to, when the card named one.
 * @param runId - the run identity, unique within the card.
 * @param sessionId - the session the run executed in.
 * @returns the in-memory record.
 */
function toBareRecord(
  skill: string,
  result: WorkbenchSubagentResult,
  executedAt: number,
  model: WorkbenchCardModel | undefined,
  runId: string,
  sessionId: string,
): WorkbenchResultRecord {
  return {
    runId,
    sessionId,
    skill,
    executedAt,
    stopReason: result.stopReason,
    ...model === undefined ? {} : { model },
    ...result.diagnostic === undefined ? {} : { diagnostic: result.diagnostic },
  }
}

/**
 * Join the text blocks of a child's final output.
 * @param output - the child's output blocks.
 * @returns the concatenated text.
 */
function textOf(output: readonly { readonly type: string; readonly text?: string }[]): string {
  return output.filter(block => block.type === 'text').map(block => block.text ?? '').join('')
}

/**
 * Describe why a bare run did not succeed.
 *
 * There is no capture to miss here, so the stop reason is the reason; the child's own
 * error text, when the bus carried one, is what makes it actionable.
 * @param result - the child's terminal result.
 * @param diagnostic - the diagnostic already read off the record, if any.
 * @returns a readable reason.
 */
function bareFailure(result: WorkbenchSubagentResult, diagnostic?: string): string {
  const detail = diagnostic ?? result.diagnostic
  return detail === undefined
    ? `the skill run ended as ${result.stopReason}`
    : `the skill run ended as ${result.stopReason}: ${detail}`
}

/**
 * Describe why a run produced nothing usable.
 *
 * A child that answered in prose and a child that genuinely faulted both arrive here
 * as `error`, because the seam rewrites a completed run that missed its structured
 * capture. The output tells them apart, and they call for different fixes: the first
 * needs a firmer instruction, the second needs its diagnostic read.
 * @param result - the child's terminal result.
 * @returns a readable reason.
 */
function describeFailure(result: WorkbenchSubagentResult, diagnostic?: string): string {
  // The same predicate that decides what gets stored, so the message and the evidence
  // under it can never disagree. A looser check here once claimed the child had
  // answered while the raw output showed nothing.
  const spoke = textOf(result.output) !== ''
  const base = spoke
    ? 'the child answered without reporting a structured result'
    : result.stopReason === 'completed'
      ? 'the run finished without a value matching the contract'
      : `the run ended as ${result.stopReason}`
  const detail = diagnostic ?? result.diagnostic
  return detail === undefined ? base : `${base}: ${detail}`
}

/**
 * Whether a settled child result is worth one more attempt.
 *
 * The seam rewrites a normally completed run that missed its structured capture
 * into `error`, so `error` is retryable. A refusal, a token ceiling, or an abort
 * is the child's own answer: repeating it only spends another model call.
 * @param result - the child's terminal result.
 * @returns whether repeating the ask could plausibly help.
 */
function isRetryable(result: WorkbenchSubagentResult): boolean {
  if (result.structured !== undefined) return false
  return result.stopReason === 'completed' || result.stopReason === 'error'
}

/**
 * Whether a value can be the object-rooted contract this feature sends.
 *
 * A cheap shape check rather than the upstream subset validation: the subagent
 * seam validates the full contract and rejects an unsupported one before any
 * child work. What this catches is a request carrying no usable contract at all,
 * which would otherwise spend a model call before failing.
 * @param value - the contract as received.
 * @returns whether it is a plain object declaring an object root.
 */
function looksLikeContract(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Reflect.get(value, 'type') === 'object'
}

/**
 * Render a failure for a log line.
 * @param error - the failure.
 * @returns a readable message.
 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Read one error's constructor name.
 *
 * Used instead of `instanceof` because the class that answers it lives in the session
 * persistence package this plugin does not depend on; the name is what that class sets on
 * itself, and it is the only stable signal available across that boundary.
 * @param error - the failure.
 * @returns the name, or an empty string for a value that is not an error.
 */
function errorNameOf(error: unknown): string {
  return error instanceof Error ? error.name : ''
}
