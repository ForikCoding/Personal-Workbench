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
import type { WorkbenchCardConfigView, WorkbenchCardModel, WorkbenchCardWorkspace, WorkbenchResultRecord, WorkbenchRunRequest, WorkbenchRunState, WorkbenchSandboxMode, WorkbenchSkillCardErrorCode, WorkbenchSkillCatalogEntry } from './skill-card-contract.ts';
import type { WorkbenchActivityEvent } from './skill-card-activity.ts';
import type { WorkbenchSkillCardHost, WorkbenchWorkingDirectory } from './skill-card-host.ts';
import type { WorkbenchDirectoryProbe } from './skill-card-directory.ts';
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
    /**
     * Directory the card runs in; absent means the card cannot run.
     *
     * Read from storage for the same reason the route is: where a card runs is part of what
     * the card is. There is no fallback to the session's directory — a run would then happen
     * somewhere the user never chose, and every result would be about a different folder.
     */
    readonly workspace?: WorkbenchCardWorkspace;
    /**
     * Sandbox mode the card's runs use; absent means the default mode applies.
     *
     * Read from storage for the same reason the route is: a permission is part of what the
     * card is, so a client cannot start a run under a mode the card does not name.
     */
    readonly permission?: WorkbenchSandboxMode;
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
export declare function cardSelection(card: WorkbenchCardConfigView | undefined): WorkbenchCardSelection;
/** Everything the runner depends on. */ export interface WorkbenchSkillCardRunnerOptions {
    /** Host services, narrowed. */
    readonly host: WorkbenchSkillCardHost;
    /**
     * Optional working-directory service.
     *
     * Absent on channels whose pinned harness predates it; the runner then reads
     * the directory from the agent's session header, as that channel does.
     */
    readonly workingDirectory?: WorkbenchWorkingDirectory;
    /**
     * The one filesystem read a start performs.
     *
     * Required rather than defaulted: every run is gated on it, so a composition that
     * forgot to wire it cannot quietly behave as if there were no gate.
     */
    readonly statDirectory: WorkbenchDirectoryProbe;
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
     * One rooted agent per card, created on the card's first run and reused after that.
     *
     * Reuse is not an optimisation: the directory and the permission mode are fixed when the
     * agent is created, so a second run of the same card can only keep both by keeping the
     * agent. The path and the mode are stored beside the handle so a change to either is
     * detected and rebuilt — a mode is a session event, and this runner never mutates a live
     * agent's mode.
     */
    private readonly cardAgents;
    /** Distinguishes successive card agents; a session id cannot be published twice. */
    private cardAgentSeq;
    /**
     * Per-process tag beside the counter: the counter restarts at zero every boot, while a
     * session published by a previous boot still exists durably, so an id made of the card
     * and the counter alone would collide with it on the first run after a restart.
     */
    private readonly cardAgentBoot;
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
     * Whether one more start would exceed the card's or the deployment's limit.
     *
     * Asked twice per start: once before the card's agent is resolved, so a refused start
     * cannot rebuild an agent a run still hangs from, and once immediately before the run is
     * recorded, so the reservation itself stays synchronous.
     * @param cardId - the card the run belongs to.
     * @returns whether another run is already in flight or the limit is reached.
     */
    private congested;
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
    private activationSeam;
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
     * Record one of a child agent's session events against the run that started it.
     *
     * The same bus, the same attribution rule, and the same "an agent this runner did not
     * start is ignored" contract as {@link observeAgentError}: the child's session id is the
     * identity both events carry. Only `tool/call` produces an entry — the mapping lives in
     * `skill-card-activity.ts`, together with the redaction and the two bounds.
     * @param sessionId - the session the event came from, which is the child's id.
     * @param event - the session event as the bus delivered it.
     */
    observeChildEvent(sessionId: string, event: WorkbenchActivityEvent): void;
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
     * The agent a card's run should hang from, with the card's permission mode applied.
     *
     * A card that names a workspace gets an agent rooted at that directory; a card that
     * does not falls back to the session's agent, which is what every run used before
     * workspaces existed. The sandbox derives its writable root from the session header,
     * and a child inherits its parent's header, so this is the whole mechanism that fences
     * a run — no `cwd` is passed and the seam stays untouched.
     *
     * An agent lives for exactly one run: the runner retires it when the run settles
     * (archiving its session and releasing it), because an archived session cannot host a
     * subagent descendant. Within one run the cache still matters: a workspace change
     * rebuilds, and the same path and mode reuse the agent the current run started from.
     *
     * The mode is applied once, here, at creation. A child inherits its parent's explicit
     * override, so recording it on this agent is what makes the card's permission govern
     * every run started from it, refinements and template-button runs included.
     * @param cardId - the card whose agent is wanted.
     * @param fallback - the session's agent, used when the card names no directory.
     * @returns the agent to start the run from.
     * @throws {WorkbenchSandboxModeError} when the mode cannot be applied; the new agent is
     * disposed first, so a refused start leaves nothing running under no mode.
     */
    private cardAgent;
    /**
     * Run one card's skill to a terminal state.
     * @param run - the run record to settle.
     * @param input - resolved agent, skill name, and output contract.
     * @param activate - the run seam, already known to exist and bound to its service.
     * @returns resolution after the run reaches a terminal phase.
     */
    private execute;
    /**
     * Run the child once.
     * @param run - the run record owning cancellation.
     * @param input - the agent, skill, and either the card's template and contract or nothing.
     * @param cwd - the agent's working directory.
     * @param skill - the loaded skill.
     * @param activate - the run seam, known to exist.
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
     * Retire the agent one finished run hung from: archive its session, then release it.
     *
     * Creating a published agent also creates a session, and the sidebar lists sessions —
     * so each finished run's session is archived to keep it out of the default list. The
     * agent is released in the same step because an archived session cannot host a model
     * step: the harness rejects a subagent descendant of one before its first step and
     * reports that as `refusal`. The next run therefore builds a fresh agent — and a fresh
     * session — instead of reusing this one.
     * @param cardId - the card whose finished agent should be retired.
     * @returns resolution once the session is archived and the agent released; neither
     *   step may turn a captured result into a failure, so both only warn.
     */
    private retireCardAgent;
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
