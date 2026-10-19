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
import type { WorkbenchCardModel, WorkbenchResultRecord, WorkbenchRunRequest, WorkbenchRunState, WorkbenchSkillCardErrorCode, WorkbenchSkillCatalogEntry } from './skill-card-contract.ts';
import type { WorkbenchSkillCardHost, WorkbenchWorkingDirectory } from './skill-card-host.ts';
/** Outcome of reading one session's skill catalog. */
export type WorkbenchCatalogOutcome = {
    readonly status: 'ok';
    readonly entries: readonly WorkbenchSkillCatalogEntry[];
} | {
    readonly status: 'failed';
    readonly code: WorkbenchSkillCardErrorCode;
    readonly detail: string;
};
/** Outcome of asking one card's run to start. */
export type WorkbenchRunStartOutcome = {
    readonly status: 'started';
    readonly state: WorkbenchRunState;
} | {
    readonly status: 'rejected';
    readonly code: WorkbenchSkillCardErrorCode;
    readonly detail: string;
};
/** What one card is configured to run. */
export interface WorkbenchCardSelection {
    /** Selected skill; absent means the card is unconfigured. */
    readonly skill?: string;
    /** Template stored for the selected skill; absent means the card cannot run. */
    readonly template?: string;
    /**
     * Model the card runs on; absent means its runs inherit the session's model.
     *
     * Read from storage rather than from the request: the route a card runs on is part of
     * what the card is, so a client cannot start a run on a route the card does not name.
     */
    readonly model?: WorkbenchCardModel;
}
/** Everything the runner depends on. */
export interface WorkbenchSkillCardRunnerOptions {
    /** Host services, narrowed. */
    readonly host: WorkbenchSkillCardHost;
    /**
     * Optional working-directory service.
     *
     * Absent on channels whose pinned harness predates it; the runner then reads
     * the directory from the agent's session header, as that channel does.
     */
    readonly workingDirectory?: WorkbenchWorkingDirectory;
    /** Configured child backend name. */
    readonly subagentProvider: string;
    /** Milliseconds one run may take before it is cancelled. */
    readonly runTimeoutMs: number;
    /** Runs allowed in flight across all cards. */
    readonly maxConcurrentRuns: number;
    /**
     * Read one card's stored configuration.
     *
     * The run request carries only what the client knows; whether a template
     * actually exists is the Host's own answer, and a template is the precondition
     * for running.
     */
    readonly selection: (cardId: string) => WorkbenchCardSelection;
    /**
     * Persist one card's settled result.
     * @param cardId - the card.
     * @param record - the complete result.
     * @returns resolution after durability.
     */
    readonly saveResult: (cardId: string, record: WorkbenchResultRecord) => Promise<void>;
    /** Host logger. */
    readonly warn: (message: string) => void;
    /** Clock seam; defaults to the wall clock. */
    readonly now?: () => number;
}
/**
 * Run one card's skill and own the outcome.
 *
 * One run at a time per card, bounded globally by the deployment's concurrency
 * limit. A run that produces no usable structured value is retried exactly once;
 * a cancelled run never is.
 */
export declare class WorkbenchSkillCardRunner {
    private readonly options;
    private readonly runs;
    private readonly inflight;
    private readonly now;
    private active;
    /**
     * @param options - host services, budgets, and the two storage seams.
     */
    constructor(options: WorkbenchSkillCardRunnerOptions);
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
    catalog(sessionId: string | undefined): Promise<WorkbenchCatalogOutcome>;
    /**
     * Choose the agent whose scope supplies the catalog.
     * @param sessionId - the session to read through, when the card has one.
     * @returns that agent, another live one, or undefined when none is live.
     */
    private catalogAgent;
    /**
     * Start one card's run.
     *
     * Every precondition is answered before anything is started, so a rejected
     * start never leaves a child behind and never costs a model call.
     * @param request - card, session, what the run is asked to do, and the client's contract.
     * @returns the started run's state, or why it was refused.
     */
    start(request: WorkbenchRunRequest): Promise<WorkbenchRunStartOutcome>;
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
    private modelRefusal;
    /**
     * Record a child agent's failure against the run that started it.
     *
     * The subagent seam turns a faulted child into `stopReason: 'error'` and drops the
     * error itself, so this bus reading is the only account of what went wrong. An
     * agent this runner did not start is ignored.
     * @param agentId - the failing agent's identity, which is its session id.
     * @param error - the failure the agent reported.
     */
    observeAgentError(agentId: string, error: unknown): void;
    /**
     * Read one card's run state.
     * @param cardId - the card.
     * @returns the state, or undefined when no run has been started for it.
     */
    state(cardId: string): WorkbenchRunState | undefined;
    /**
     * Cancel one card's in-flight run.
     * @param cardId - the card.
     * @returns whether a running run was signalled.
     */
    cancel(cardId: string): boolean;
    /**
     * Cancel every in-flight run and wait for them to settle.
     * @returns resolution once no run is still executing.
     */
    dispose(): Promise<void>;
    /**
     * Run one card's skill to a terminal state.
     * @param run - the run record to settle.
     * @param input - resolved agent, skill name, and output contract.
     * @param activate - the activation seam, already known to exist and bound to its service.
     * @returns resolution after the run reaches a terminal phase.
     */
    private execute;
    /**
     * Run the child once.
     * @param run - the run record owning cancellation.
     * @param input - the agent, skill, and either the card's template and contract or nothing.
     * @param cwd - the agent's working directory.
     * @param skill - the loaded skill.
     * @param activate - the activation seam, known to exist.
     * @returns the attempt's outcome.
     */
    private attempt;
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
    private finish;
    /**
     * Resolve the agent's effective working directory.
     *
     * The service is preferred when the deployment has it; otherwise the session
     * header carries the same value, which is how the older channel resolves it.
     * @param agent - the agent.
     * @param signal - cancellation.
     * @returns the directory, or undefined when neither source supplies one.
     */
    private cwdFor;
    /**
     * Project one run record onto the wire state.
     * @param run - the run record.
     * @returns the wire state.
     */
    private stateOf;
}
