/**
 * The Host services the skill card consumes, declared narrowly.
 *
 * The plugin reads only these members, so it states them here rather than
 * depending on upstream declaration files — the same choice the layout route
 * makes for Connection's trust fence.
 * @module dsh-workbench/skill-card-host
 */
/** One live agent. The agent object doubles as the skill registry's scope key. */
export interface WorkbenchAgent {
    /** Shared agent/session identity. */
    readonly id: string;
    /**
     * The agent's session.
     *
     * Its header carries the effective working directory, which is the fallback
     * for channels that predate the working-directory service.
     */
    readonly session?: {
        readonly header?: {
            readonly cwd?: string;
        };
    };
}
/** Base a loaded skill resolves the relative paths it mentions against. */
export type WorkbenchSkillResourceBase = {
    readonly kind: 'directory';
    readonly path: string;
} | {
    readonly kind: 'url';
    readonly url: string;
} | {
    readonly kind: 'opaque';
    readonly description: string;
};
/** Resolved model and user invocation controls. */
export interface WorkbenchSkillInvocation {
    readonly modelInvocable: boolean;
    readonly userInvocable: boolean;
}
/** One skill as the catalog lists it. */
export interface WorkbenchSkillSummary {
    /** Kebab-case identifier. */
    readonly name: string;
    /** Short routing description. */
    readonly description: string;
    /** Optional extra routing guidance. */
    readonly whenToUse?: string;
    /** Invocation controls. */
    readonly invocation: WorkbenchSkillInvocation;
}
/** One loaded skill, including the instruction body. */
export interface WorkbenchSkillDefinition extends WorkbenchSkillSummary {
    /** Markdown instruction body. */
    readonly content: string;
    /** Provider that owns the body. */
    readonly provider: string;
    /** Provider-specific base for relative resources. */
    readonly resourceBase?: WorkbenchSkillResourceBase;
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
    readonly cwd?: string;
    /** Reading agent; absent reads the global layer alone. */
    readonly scope?: WorkbenchAgent;
    /** Cancellation. */
    readonly signal: AbortSignal;
}
/** One block of a child's final output, narrowed to the text this feature keeps. */
export interface WorkbenchContentBlock {
    readonly type: string;
    readonly text?: string;
}
/**
 * Terminal outcome of one child run.
 *
 * `stopReason` is a plain string because the upstream union is merge-extensible;
 * a non-`completed` reason means the output may be partial.
 */
export interface WorkbenchSubagentResult {
    readonly output: readonly WorkbenchContentBlock[];
    /** Validated structured value, absent when no valid capture was committed. */
    readonly structured?: unknown;
    /** Provider-authored failure detail. */
    readonly diagnostic?: string;
    readonly stopReason: string;
}
/** One started child execution. */
export interface WorkbenchActivation {
    readonly childId: string;
    readonly result: Promise<WorkbenchSubagentResult>;
    /**
     * Stop the run and release its resources.
     * @returns resolution after teardown.
     */
    dispose(): Promise<void>;
}
/**
 * One requested child execution.
 *
 * `agentOptions` and `toolFilter` are deliberately absent: omitting them is how
 * a run inherits the session's model and its full tool permissions.
 */
export interface WorkbenchActivationSpec {
    readonly provider: string;
    readonly label: string;
    readonly signal: AbortSignal;
    /** `caller` returns the result without notifying the parent model loop. */
    readonly delivery: 'parent' | 'caller';
    readonly request: {
        readonly parent: WorkbenchAgent;
        readonly prompt: readonly WorkbenchContentBlock[];
        /** Initial child directory; omitted inherits the parent's at start. */
        readonly cwd?: string;
        /**
         * Output contract the child must satisfy; omitted asks for no structured value.
         *
         * A bare run omits it: nothing is asked for, so nothing can fail to arrive, and the
         * child's own stop reason is the verdict.
         */
        readonly outputSchema?: unknown;
    };
}
/** Subagent surface, narrowed to provider discovery and one activation. */
export interface WorkbenchSubagentHost {
    /**
     * Registered backend names.
     * @returns every currently registered provider name.
     */
    list(): readonly string[];
    /**
     * Look one backend up.
     * @param name - provider name.
     * @returns the provider when registered, otherwise undefined.
     */
    getProvider(name: string): {
        readonly capabilities: {
            readonly outputSchema: boolean;
        };
    } | undefined;
    /**
     * Start one child execution.
     * @param spec - provider, label, cancellation, delivery, and request.
     * @returns the started activation.
     */
    startActivation(spec: WorkbenchActivationSpec): Promise<WorkbenchActivation>;
}
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
    ensure(agent: WorkbenchAgent, signal: AbortSignal): Promise<string>;
}
/** The Host services one skill card run needs. */
export interface WorkbenchSkillCardHost {
    readonly agents: {
        /**
         * Look up the live agent driving one session.
         * @param sessionId - session identity.
         * @returns the agent, or undefined when no live agent has that id.
         */
        get(sessionId: string): WorkbenchAgent | undefined;
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
        list(): readonly WorkbenchAgent[];
    };
    readonly skills: {
        /**
         * List the catalog one agent's scope chain selects.
         * @param options - cwd, scope, and cancellation.
         * @returns the merged catalog.
         */
        list(options: WorkbenchSkillLookup): Promise<readonly WorkbenchSkillSummary[]>;
        /**
         * Load one skill's body.
         * @param name - skill name.
         * @param options - cwd, scope, and cancellation.
         * @returns the loaded skill, or undefined when it is not available.
         */
        get(name: string, options: WorkbenchSkillLookup): Promise<WorkbenchSkillDefinition | undefined>;
    };
    readonly subagents: WorkbenchSubagentHost;
}
