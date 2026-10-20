/**
 * The Host services the skill card consumes, declared narrowly.
 *
 * The plugin reads only these members, so it states them here rather than
 * depending on upstream declaration files — the same choice the layout route
 * makes for Connection's trust fence.
 * @module dsh-workbench/skill-card-host
 */

import type { WorkbenchSandboxMode } from './skill-card-contract.ts'

/**
 * Raised when one session cannot take a sandbox mode.
 *
 * Typed rather than a plain `Error` so the runner can turn exactly this failure into a
 * refusal naming the mode it could not apply, while a fault raised anywhere else still
 * travels as itself instead of being reported as a permission problem.
 */
export class WorkbenchSandboxModeError extends Error {
  /**
   * @param sessionId - the session the mode was meant for.
   * @param mode - the mode that could not be recorded.
   * @param detail - why, when the cause has a message of its own.
   */
  constructor(
    readonly sessionId: string,
    readonly mode: WorkbenchSandboxMode,
    detail?: string,
  ) {
    super(detail === undefined
      ? `session "${sessionId}" cannot take permission mode "${mode}"`
      : `session "${sessionId}" cannot take permission mode "${mode}": ${detail}`)
    this.name = 'WorkbenchSandboxModeError'
  }
}

/** One live agent. The agent object doubles as the skill registry's scope key. */
export interface WorkbenchAgent {
  /** Shared agent/session identity. */
  readonly id: string
  /**
   * The agent's session.
   *
   * Its header carries the effective working directory, which is the fallback
   * for channels that predate the working-directory service.
   */
  readonly session?: {
    readonly header?: { readonly cwd?: string }
  }
}

/** Base a loaded skill resolves the relative paths it mentions against. */
export type WorkbenchSkillResourceBase =
  | { readonly kind: 'directory'; readonly path: string }
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'opaque'; readonly description: string }

/** Resolved model and user invocation controls. */
export interface WorkbenchSkillInvocation {
  readonly modelInvocable: boolean
  readonly userInvocable: boolean
}

/** One skill as the catalog lists it. */
export interface WorkbenchSkillSummary {
  /** Kebab-case identifier. */
  readonly name: string
  /** Short routing description. */
  readonly description: string
  /** Optional extra routing guidance. */
  readonly whenToUse?: string
  /** Invocation controls. */
  readonly invocation: WorkbenchSkillInvocation
}

/** One loaded skill, including the instruction body. */
export interface WorkbenchSkillDefinition extends WorkbenchSkillSummary {
  /** Markdown instruction body. */
  readonly content: string
  /** Provider that owns the body. */
  readonly provider: string
  /** Provider-specific base for relative resources. */
  readonly resourceBase?: WorkbenchSkillResourceBase
}

/**
 * View options every skill read takes.
 *
 * `scope` selects the reading agent's layers. The upstream Web composition
 * registers no filesystem provider in the global layer and disables the host row,
 * so a scope-less read returns nothing there; the Desktop layer mounts its own
 * host-plane provider instead, which is what makes the installed catalog readable
 * before any session exists.
 */
export interface WorkbenchSkillLookup {
  /** Workspace directory selecting project roots; absent when none is resolvable. */
  readonly cwd?: string
  /** Reading agent; absent reads the global layer alone. */
  readonly scope?: WorkbenchAgent
  /** Cancellation. */
  readonly signal: AbortSignal
}

/** One block of a child's final output, narrowed to the text this feature keeps. */
export interface WorkbenchContentBlock {
  readonly type: string
  readonly text?: string
}

/**
 * Terminal outcome of one child run.
 *
 * `stopReason` is a plain string because the upstream union is merge-extensible;
 * a non-`completed` reason means the output may be partial.
 */
export interface WorkbenchSubagentResult {
  readonly output: readonly WorkbenchContentBlock[]
  /** Validated structured value, absent when no valid capture was committed. */
  readonly structured?: unknown
  /** Provider-authored failure detail. */
  readonly diagnostic?: string
  readonly stopReason: string
}

/** One started child execution. */
export interface WorkbenchActivation {
  readonly childId: string
  readonly result: Promise<WorkbenchSubagentResult>
  /**
   * Stop the run and release its resources.
   * @returns resolution after teardown.
   */
  dispose(): Promise<void>
}

/**
 * One model a provider route advertises, narrowed to the field this feature checks.
 *
 * Only membership matters here: the display name a picker would show comes from the
 * Client's own catalog, never from the Host's validation query.
 */
export interface WorkbenchModelInfo {
  readonly id: string
}

/**
 * Child Agent route override for one run.
 *
 * Structurally the upstream `AgentOptions` fields this feature sets, declared here for
 * the same reason the rest of this module is: the plugin reads only these members. The
 * upstream type also carries `reasoningEffort` and `maxTokens`, which v1 deliberately
 * does not send — an effort the card never chose would be a value it never had.
 */
export interface WorkbenchAgentOptions {
  /** Provider route owning the model. */
  readonly provider: string
  /** Model id the provider advertises. */
  readonly model: string
}

/**
 * One requested child execution.
 *
 * `toolFilter` is deliberately absent: omitting it is how a run inherits the session's
 * full tool permissions. `agentOptions` is present but optional, and a run that omits it
 * inherits the session's model — which is what a card with no model selected does.
 */
export interface WorkbenchActivationSpec {
  readonly provider: string
  readonly label: string
  readonly signal: AbortSignal
  /** `caller` returns the result without notifying the parent model loop. */
  readonly delivery: 'parent' | 'caller'
  readonly request: {
    readonly parent: WorkbenchAgent
    readonly prompt: readonly WorkbenchContentBlock[]
    /** Initial child directory; omitted inherits the parent's at start. */
    readonly cwd?: string
    /**
     * Output contract the child must satisfy; omitted asks for no structured value.
     *
     * A bare run omits it: nothing is asked for, so nothing can fail to arrive, and the
     * child's own stop reason is the verdict.
     */
    readonly outputSchema?: unknown
    /**
     * Route the child runs on; omitted inherits the parent's route at start.
     *
     * The seam merges this over the parent's own route, so naming a provider and a model
     * replaces both and a partial override cannot happen. The seam also rejects it
     * outright for a backend without {@link WorkbenchSubagentHost.getProvider}'s
     * `agentOptions` capability, which is why the runner checks that first.
     */
    readonly agentOptions?: WorkbenchAgentOptions
  }
}

/** Subagent surface, narrowed to provider discovery and one activation. */
export interface WorkbenchSubagentHost {
  /**
   * Registered backend names.
   * @returns every currently registered provider name.
   */
  list(): readonly string[]
  /**
   * Look one backend up.
   * @param name - provider name.
   * @returns the provider when registered, otherwise undefined.
   */
  getProvider(name: string): {
    readonly capabilities: {
      readonly outputSchema: boolean
      /** Whether the backend accepts a per-run {@link WorkbenchAgentOptions} override. */
      readonly agentOptions: boolean
    }
  } | undefined
  /**
   * Start one child execution.
   *
   * Optional because the harness this plugin is installed into may predate the seam: the
   * stable channel pins `0.2.0-rc.2`, whose subagent service offers `start` and
   * `startContinuable` but no `startActivation`. A deployment without it is still a valid
   * one — the workbench loads and its cards stay readable and editable — so the surface
   * says so instead of pretending the method exists.
   * @param spec - provider, label, cancellation, delivery, and request.
   * @returns the started activation.
   */
  startActivation?(spec: WorkbenchActivationSpec): Promise<WorkbenchActivation>
}

/**
 * The activation seam itself, once the harness is known to provide it.
 *
 * Bound to the subagent service before it is carried around: the real method reads its
 * own receiver, so a bare function reference would not be callable outside it.
 */
export type WorkbenchActivationSeam = (spec: WorkbenchActivationSpec) => Promise<WorkbenchActivation>

/**
 * Working-directory service.
 *
 * It arrived after the stable channel's pinned harness, so a deployment may not
 * provide it at all. The runner therefore reads it optionally and falls back to
 * the session header, which is how the older channel resolves the same value.
 */
export interface WorkbenchWorkingDirectory {
  /**
   * Resolve the agent's effective working directory.
   * @param agent - the agent.
   * @param signal - cancellation.
   * @returns the absolute directory.
   */
  ensure(agent: WorkbenchAgent, signal: AbortSignal): Promise<string>
}

/** The Host services one skill card run needs. */
export interface WorkbenchSkillCardHost {
  readonly agents: {
    /**
     * Look up the live agent driving one session.
     * @param sessionId - session identity.
     * @returns the agent, or undefined when no live agent has that id.
     */
    get(sessionId: string): WorkbenchAgent | undefined
    /**
     * Every live agent, in registration order.
     *
     * The installed catalog is only visible through an agent scope: the shipped
     * web composition disables the host's own skill provider so each preset owns
     * local discovery, which leaves the global layer empty. A card is configured
     * before it is ever run, so the catalog falls back to any live agent rather
     * than refusing until the user opens the session it will run in.
     * @returns the live agents.
     */
    list(): readonly WorkbenchAgent[]
    /**
     * Create an agent whose session header carries its own `cwd`.
     *
     * This is the only way a card can own a file-sandbox root: the sandbox policy
     * derives `workspaceRoot` from `session.header.cwd`, and the subagent seam copies a
     * child's header from its **parent**. A card agent created here therefore fences
     * every run started with it as `parent`, without teaching the seam anything new.
     *
     * `sessionId` is required: creating without one fails at publish time with
     * `agent id "undefined" does not match session id`.
     * @param options - session identity, the directory to root it at, and its parent.
     * @returns the created agent and the handle that tears it down.
     */
    create(options: {
      readonly sessionId: string
      readonly meta: { readonly cwd: string }
      readonly parentAgent?: WorkbenchAgent
    }): Promise<WorkbenchAgentHandle>
  }
  /**
   * The sandbox mode a card's own agent runs under.
   *
   * A setter rather than a field on the created agent: a mode is recorded as a session
   * event, and the policy service that reads it has no writer of its own. The card's agent
   * is the session that decides every run started from it, because a child inherits its
   * parent's explicit override — so this one call is what makes the card's mode govern its
   * runs.
   */
  readonly sandbox: {
    /**
     * Record one sandbox mode on one live agent's session.
     * @param sessionId - session whose mode changes; the card's own agent.
     * @param mode - the mode every later confined call in that session runs under.
     * @throws {WorkbenchSandboxModeError} when no live agent has that session, or the
     * session refuses the event.
     */
    setMode(sessionId: string, mode: WorkbenchSandboxMode): void
  }
  readonly skills: {
    /**
     * List the catalog one agent's scope chain selects.
     * @param options - cwd, scope, and cancellation.
     * @returns the merged catalog.
     */
    list(options: WorkbenchSkillLookup): Promise<readonly WorkbenchSkillSummary[]>
    /**
     * Load one skill's body.
     * @param name - skill name.
     * @param options - cwd, scope, and cancellation.
     * @returns the loaded skill, or undefined when it is not available.
     */
    get(name: string, options: WorkbenchSkillLookup): Promise<WorkbenchSkillDefinition | undefined>
  }
  /**
   * Session lifecycle the workbench needs but no other service exposes.
   *
   * A card's run hangs from an agent the plugin creates, and creating a published agent
   * also creates a session — which the sidebar would otherwise list for every card the
   * user ever ran. Archiving is `archivedSessionIds` bookkeeping, not deletion: the
   * session stays readable and the agent stays reusable.
   */
  readonly workspaceRegistry: {
    /**
     * Hide a session from the default list.
     * @param sessionId - the session to archive.
     * @returns resolution once the archive is recorded.
     */
    archiveSession(sessionId: string): Promise<void>
  }

  readonly subagents: WorkbenchSubagentHost
  /**
   * LLM registry, narrowed to the one query a start consults.
   *
   * A card that names a model has to be checked against what the deployment can actually
   * route *before* a child is created. Refusing here is what keeps a stale card from
   * silently running on the session's model instead of the one it displays.
   */
  readonly llm: {
    /**
     * Discover models advertised by one provider route.
     *
     * Rejects for a provider this registry does not have, which is how a start tells a
     * missing provider apart from a missing model.
     * @param provider - provider route to inspect.
     * @returns the advertised models.
     */
    listModels(provider: string): Promise<readonly WorkbenchModelInfo[]>
  }
}

/**
 * A created agent and the handle that tears it down.
 *
 * The handle is separate because disposal is not the agent's concern: the plugin owns the
 * lifetime — create on the card's first run, dispose when the card's workspace changes or
 * the card is removed.
 */
export interface WorkbenchAgentHandle {
  readonly agent: WorkbenchAgent
  dispose(): Promise<void>
}
