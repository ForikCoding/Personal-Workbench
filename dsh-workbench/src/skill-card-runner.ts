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
  WorkbenchCardModel,
  WorkbenchCardWorkspace,
  WorkbenchResultRecord,
  WorkbenchRunPhase,
  WorkbenchRunRequest,
  WorkbenchRunState,
  WorkbenchSkillCardErrorCode,
  WorkbenchSkillCatalogEntry,
} from './skill-card-contract.ts'
import type {
  WorkbenchActivationSeam,
  WorkbenchAgent,
  WorkbenchModelInfo,
  WorkbenchSkillCardHost,
  WorkbenchSkillDefinition,
  WorkbenchSkillLookup,
  WorkbenchSubagentResult,
  WorkbenchWorkingDirectory,
} from './skill-card-host.ts'
import type { WorkbenchDirectoryProbe } from './skill-card-directory.ts'
import { renderWorkbenchBarePrompt, renderWorkbenchRefinePrompt, renderWorkbenchSkillPrompt } from './skill-card-prompt.ts'

/**
 * Why a card run cannot start on a harness without the activation seam.
 *
 * One sentence naming the exact member the harness must provide and where it exists: this
 * text is an operator's remedy, so it says which version and channel has the seam.
 */
const SUBAGENT_SEAM_DETAIL =
  'this harness provides no subagents.startActivation, so a card run cannot start; card runs need a harness that exposes it (0.2.1-alpha.2, the beta channel)'

/** Outcome of reading one session's skill catalog. */
export type WorkbenchCatalogOutcome =
  | { readonly status: 'ok'; readonly entries: readonly WorkbenchSkillCatalogEntry[] }
  | { readonly status: 'failed'; readonly code: WorkbenchSkillCardErrorCode; readonly detail: string }

/** Outcome of asking one card's run to start. */
export type WorkbenchRunStartOutcome =
  | { readonly status: 'started'; readonly state: WorkbenchRunState }
  | { readonly status: 'rejected'; readonly code: WorkbenchSkillCardErrorCode; readonly detail: string }

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
}

/** Everything the runner depends on. */
export interface WorkbenchSkillCardRunnerOptions {
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
    readonly agent: WorkbenchAgent
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
    readonly agent: WorkbenchAgent
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
    readonly agent: WorkbenchAgent
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
   * @param request - card, session, what the run is asked to do, and the client's contract.
   * @returns the started run's state, or why it was refused.
   */
  async start(request: WorkbenchRunRequest): Promise<WorkbenchRunStartOutcome> {
    // The activation seam is the first capability every mode needs, and the composition
    // has already probed it once. This is the second line rather than a probe: a stale
    // click, a direct route call, or a template button that arrives on a harness without
    // the seam has to be refused here. Letting it through would reach the one call that
    // needs the seam and throw `undefined is not a function` out of the request handler,
    // which is a stack trace where a state belongs.
    const subagents = this.options.host.subagents
    const activation = subagents.startActivation
    if (typeof activation !== 'function') {
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
    const agent = this.options.host.agents.get(request.sessionId)
    if (agent === undefined) {
      return reject('session-not-live', `session "${request.sessionId}" has no live agent`)
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
    const model = selection.model
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
    // Checked after the two queries above, never before them, so the reservation below
    // stays synchronous: two starts that both awaited the same check must not both win.
    if (this.runs.get(request.cardId)?.phase === 'running' || this.active >= this.options.maxConcurrentRuns) {
      return reject('run-in-progress', 'another run is already in flight')
    }

    const pinned = model === undefined ? {} : { model }
    let input: RunInput
    if (mode.kind === 'bare') {
      input = {
        kind: 'bare',
        agent,
        skill,
        ...pinned,
        ...request.payload === undefined ? {} : { payload: request.payload },
      }
    } else {
      const template = selection.template
      if (template === undefined) {
        return reject('template-missing', `no template is stored for skill "${skill}"`)
      }
      input = mode.kind === 'refine'
        ? {
            kind: 'refine',
            agent,
            skill,
            template,
            ...pinned,
            previous: mode.previous,
            instruction: mode.instruction,
            ...request.payload === undefined ? {} : { payload: request.payload },
            outputSchema: request.outputSchema,
          }
        : {
            kind: 'card',
            agent,
            skill,
            template,
            ...pinned,
            ...request.payload === undefined ? {} : { payload: request.payload },
            outputSchema: request.outputSchema,
          }
    }

    const run: RunRecord = {
      cardId: request.cardId,
      startedAt: this.now(),
      controller: new AbortController(),
      bare: mode.kind === 'bare',
      phase: 'running',
      retried: false,
      timedOut: false,
    }
    run.timer = setTimeout(() => {
      // Recorded before the abort so the settle path can tell a deadline from a
      // caller's cancellation.
      run.timedOut = true
      run.controller.abort()
    }, this.options.runTimeoutMs)
    this.runs.set(request.cardId, run)
    this.active += 1

    // Bound to the service it came from: the attempt path calls it from a different
    // method, and the real one reads its own receiver.
    const execution = this.execute(run, input, activation.bind(subagents))
    this.inflight.add(execution)
    void execution
      .catch((error: unknown) => { this.options.warn(`workbench skill card runner faulted: ${messageOf(error)}`) })
      .finally(() => { this.inflight.delete(execution) })

    return { status: 'started', state: this.stateOf(run) }
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
   * Run one card's skill to a terminal state.
   * @param run - the run record to settle.
   * @param input - resolved agent, skill name, and output contract.
   * @param activate - the activation seam, already known to exist and bound to its service.
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
      const skill = await this.options.host.skills.get(input.skill, lookupFor(input.agent, cwd, signal))
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
    }
  }

  /**
   * Run the child once.
   * @param run - the run record owning cancellation.
   * @param input - the agent, skill, and either the card's template and contract or nothing.
   * @param cwd - the agent's working directory.
   * @param skill - the loaded skill.
   * @param activate - the activation seam, known to exist.
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
    // Omitting `toolFilter` is how this run inherits the session's full tool permissions.
    // Naming a route is the card's own choice: with no model configured nothing is passed
    // and the child inherits the session's model exactly as it always did.
    const activation = await activate({
      provider: this.options.subagentProvider,
      label: `workbench:${run.cardId}`,
      signal,
      delivery: 'caller',
      request: {
        parent: input.agent,
        prompt: [{
          type: 'text',
          text: input.kind === 'card'
            ? renderWorkbenchSkillPrompt(skill, input.template, input.payload)
            : input.kind === 'refine'
              ? renderWorkbenchRefinePrompt(skill, input.template, input.previous, input.instruction, input.payload)
              : renderWorkbenchBarePrompt(skill, input.payload),
        }],
        ...cwd === undefined ? {} : { cwd },
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
      const stored = input.kind === 'bare'
        ? toBareRecord(input.skill, result, this.now(), input.model)
        : toResultRecord(input.skill, result, this.now(), input.model)
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

    run.result = outcome.record
    run.phase = 'settled'
    if (outcome.kind === 'unusable') {
      run.failure = outcome.failure
      run.failureCode = 'run-failed'
    }
    // A bare run keeps nothing: its verdict stays in the run table for this session
    // and a reload leaves the card showing its own stored result.
    if (run.bare) return
    try {
      await this.options.saveResult(run.cardId, outcome.record)
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
function reject(code: WorkbenchSkillCardErrorCode, detail: string): WorkbenchRunStartOutcome {
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
 * @returns the stored record.
 */
function toResultRecord(
  skill: string,
  result: WorkbenchSubagentResult,
  executedAt: number,
  model: WorkbenchCardModel | undefined,
): WorkbenchResultRecord {
  const text = textOf(result.output)
  return {
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
 * verdict. The route is kept, because it is provenance rather than content.
 * @param skill - the skill that ran.
 * @param result - the child's terminal result.
 * @param executedAt - completion time.
 * @param model - the route the run was pinned to, when the card named one.
 * @returns the in-memory record.
 */
function toBareRecord(
  skill: string,
  result: WorkbenchSubagentResult,
  executedAt: number,
  model: WorkbenchCardModel | undefined,
): WorkbenchResultRecord {
  return {
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
