/**
 * Host double for the skill card specs.
 *
 * The runner is the only production consumer of the narrow Host surface, so both
 * the runner spec and the route spec drive it through this double rather than
 * stubbing the runner class.
 */
import type {
  WorkbenchActivation,
  WorkbenchActivationSpec,
  WorkbenchAgent,
  WorkbenchSkillCardHost,
  WorkbenchSkillDefinition,
  WorkbenchSkillLookup,
  WorkbenchSkillSummary,
  WorkbenchStartHandle,
  WorkbenchStartSpec,
  WorkbenchSubagentResult,
  WorkbenchWorkingDirectory,
} from '../../src/skill-card-host.ts'
import { WorkbenchSandboxModeError } from '../../src/skill-card-host.ts'
import type { WorkbenchDirectoryStat, WorkbenchSandboxMode } from '../../src/skill-card-contract.ts'
import type { WorkbenchDirectoryProbe } from '../../src/skill-card-directory.ts'

/** The agent every double answers with; it carries a session header cwd. */
export const AGENT: WorkbenchAgent = { id: 'session-1', session: { header: { cwd: '/header-repo' } } }

/**
 * The directory every double says exists and every default selection points at.
 *
 * A POSIX path, because the specs run wherever the suite runs and nothing here touches a
 * real filesystem: the probe is a double too.
 */
export const WORKSPACE_PATH = '/repo'

/** A directory check that found a writable directory. */
export const PRESENT_DIRECTORY: WorkbenchDirectoryStat = { exists: true, isDirectory: true, writable: true }

/** A loaded skill the fake registry can return. */
export const SKILL: WorkbenchSkillDefinition = {
  name: 'git-repo',
  description: 'Report repository health',
  invocation: { modelInvocable: true, userInvocable: true },
  content: 'Inspect the repository and report its state.',
  provider: 'filesystem',
  resourceBase: { kind: 'directory', path: '/repo/.agents/skills/git-repo' },
}

/**
 * Build one catalog summary.
 * @param name - skill name.
 * @param userInvocable - whether a human may invoke it.
 * @returns the summary.
 */
export function summary(name: string, userInvocable = true): WorkbenchSkillSummary {
  return {
    name,
    description: `${name} description`,
    invocation: { modelInvocable: true, userInvocable },
  }
}

/**
 * What the fake child does on the nth activation.
 *
 * `'manual'` hands the settlement to the spec, so a case can do something to the run
 * while the child is still in flight.
 */
export type ScriptedResult = WorkbenchSubagentResult | 'hang' | 'manual'

/** Options the fake host varies on. */
export interface FakeHostOptions {
  readonly live?: boolean
  readonly cwd?: string
  readonly skills?: readonly WorkbenchSkillSummary[]
  readonly definitions?: Readonly<Record<string, WorkbenchSkillDefinition>>
  /**
   * Registered backends and their capabilities.
   *
   * `agentOptions` defaults to true because that is what the `spawn` backend this
   * deployment configures advertises; a case that exercises a backend without it says so.
   */
  readonly providers?: Readonly<Record<string, { readonly outputSchema: boolean; readonly agentOptions?: boolean }>>
  /** Models the LLM registry answers with, per provider route; an unlisted route rejects. */
  readonly models?: Readonly<Record<string, readonly string[]>>
  readonly outcomes?: readonly ScriptedResult[]
  readonly throwsOn?: 'ensure' | 'list'
  /**
   * Whether the double exposes the activation seam.
   *
   * `false` models a harness that replaced it — `0.2.1-alpha.2` provides the seam, and a
   * case without it models the older channel. Every case that does not say otherwise
   * keeps the seam.
   */
  readonly startActivation?: boolean
  /**
   * Whether the double exposes the older channel's one-shot `start`.
   *
   * `true` models `0.2.0-rc.2` — the stable channel, whose subagent service has exactly
   * this method and no `startActivation`. Defaults to `false`, so a case that wants the
   * older channel says so; a case that wants a run-less harness keeps both seams off.
   */
  readonly start?: boolean
  /**
   * What the directory probe answers.
   *
   * Defaults to a present, writable directory: a run in these specs is about something
   * else, and the workspace cases say what they want instead.
   */
  readonly directory?: Partial<WorkbenchDirectoryStat>
  /**
   * When set, applying a permission mode fails with this detail.
   *
   * The double throws the typed error the real wiring throws, so a case can prove the
   * runner refuses the start rather than running under a mode nobody applied.
   */
  readonly modeFailure?: string
}

/** The fake host plus what a spec wants to assert about. */
export interface FakeHost {
  readonly host: WorkbenchSkillCardHost
  /**
   * The optional working-directory service.
   *
   * A spec passes it to the runner, or omits it to exercise the session-header
   * fallback that the older Desktop channel relies on.
   */
  readonly workingDirectory: WorkbenchWorkingDirectory
  /** The one filesystem read the runner gates a start on. */
  readonly statDirectory: WorkbenchDirectoryProbe
  readonly activations: WorkbenchActivationSpec[]
  /** One-shot `start` calls the plugin made, in order; empty unless the case opted in. */
  readonly starts: WorkbenchStartCall[]
    /** Card agents the plugin created, in order; each carries the directory it rooted at. */
    readonly createdAgents: WorkbenchAgent[]
    /** Session ids of card agents the plugin tore down. */
    readonly disposedAgents: string[]
    /** Session ids the plugin archived to keep them out of the sidebar. */
    readonly archivedSessions: string[]
  /**
   * Permission modes the plugin applied, in order, with the session each was recorded on.
   *
   * The mode is a session event in the real host; here it is a recorded call, which is what
   * lets a case prove it was applied once per card agent and under which mode.
   */
  readonly sandboxModes: { readonly sessionId: string; readonly mode: WorkbenchSandboxMode }[]
  readonly lookups: WorkbenchSkillLookup[]
  readonly disposed: { count: number }
  /**
   * Settle the activation that was scripted as `'manual'`.
   * @param result - the child's terminal result.
   */
  readonly settleChild: (result: WorkbenchSubagentResult) => void
}

/** One recorded one-shot `start` call: the provider name and the mapped spec. */
export interface WorkbenchStartCall {
  readonly provider: string
  readonly spec: WorkbenchStartSpec
}

/**
 * Build a Host double.
 * @param options - what the double answers with.
 * @returns the host and its recorded calls.
 */
export function fakeHost(options: FakeHostOptions = {}): FakeHost {
  const activations: WorkbenchActivationSpec[] = []
  const starts: WorkbenchStartCall[] = []
  const lookups: WorkbenchSkillLookup[] = []
  const disposed = { count: 0 }
  const providers = options.providers ?? { spawn: { outputSchema: true } }
  const models = options.models ?? { deepseek: ['deepseek-chat'] }
  const outcomes = options.outcomes ?? [{ output: [], stopReason: 'completed', structured: { a: '1' } }]
  let call = 0
  let settleManual: ((result: WorkbenchSubagentResult) => void) | undefined
  /**
   * Settle the activation that was scripted as `'manual'`.
   * @param result - the child's terminal result.
   */
  const settleChild = (result: WorkbenchSubagentResult): void => {
    if (settleManual === undefined) throw new Error('no manual activation is pending')
    settleManual(result)
  }

  const workingDirectory: WorkbenchWorkingDirectory = {
    ensure: async () => {
      if (options.throwsOn === 'ensure') throw new Error('no working directory')
      return options.cwd ?? '/repo'
    },
  }

  const statDirectory: WorkbenchDirectoryProbe = async () => ({ ...PRESENT_DIRECTORY, ...options.directory })

  // Card agents the plugin asked for, and the ones it tore down. Both are read from
  // `FakeSkillCardHost` so a case can prove creation and disposal actually happened.
  const createdAgents: WorkbenchAgent[] = []
  const disposedAgents: string[] = []
  const archivedSessions: string[] = []
  const sandboxModes: { sessionId: string; mode: WorkbenchSandboxMode }[] = []

  /**
   * Script one child run's result promise.
   *
   * Shared by both seams, because the runner's behaviour under a script must not
   * depend on which seam carried it: `'hang'` settles on abort, `'manual'` hands
   * settlement to the spec, anything else settles immediately.
   * @param signal - the cancellation signal the run started with.
   * @returns the child's terminal result promise.
   */
  const scriptedChild = (signal: AbortSignal): Promise<WorkbenchSubagentResult> => {
    const scripted = outcomes[call] ?? { output: [], stopReason: 'completed' }
    call += 1
    if (scripted === 'hang') {
      return new Promise<WorkbenchSubagentResult>((resolve) => {
        const abort = (): void => { resolve({ output: [], stopReason: 'aborted' }) }
        // A cancel can land before the activation is even requested, so an
        // already-aborted signal has to settle immediately rather than wait
        // for an event that will never fire again.
        if (signal.aborted) { abort(); return }
        signal.addEventListener('abort', abort, { once: true })
      })
    }
    if (scripted === 'manual') {
      return new Promise<WorkbenchSubagentResult>((resolve) => { settleManual = resolve })
    }
    return Promise.resolve(scripted)
  }

  const host: WorkbenchSkillCardHost = {
    agents: {
      get: (sessionId) => (options.live === false || sessionId !== AGENT.id ? undefined : AGENT),
      list: () => (options.live === false ? [] : [AGENT]),
      // A card agent is only ever interesting for the cwd it roots its session at, so the
      // fake keeps that and nothing else. `disposeCount` lets a case prove the plugin
      // actually tears one down when the workspace changes.
      create: async (createOptions) => {
        const created: WorkbenchAgent = {
          id: createOptions.sessionId,
          session: { header: { cwd: createOptions.meta.cwd } },
        }
        createdAgents.push(created)
        return {
          agent: created,
          dispose: async () => { disposedAgents.push(createOptions.sessionId) },
        }
      },
    },
    // The mode is recorded, not simulated, for the same reason archiving is: the plugin's
    // side of the permission mechanism is "applied once, under this mode", and the sandbox
    // obeying it is out-of-process behaviour.
    sandbox: {
      setMode: (sessionId, mode) => {
        if (options.modeFailure !== undefined) {
          throw new WorkbenchSandboxModeError(sessionId, mode, options.modeFailure)
        }
        sandboxModes.push({ sessionId, mode })
      },
    },
    // Archiving is recorded, not simulated: a case can then prove the plugin hid the
    // session a card agent published instead of leaving it in the sidebar.
    workspaceRegistry: {
      archiveSession: async (sessionId: string) => { archivedSessions.push(sessionId) },
    },
    skills: {
      list: async (lookup) => {
        lookups.push(lookup)
        if (options.throwsOn === 'list') throw new Error('registry unavailable')
        return options.skills ?? [summary('git-repo'), summary('hidden', false)]
      },
      get: async (name, lookup) => {
        lookups.push(lookup)
        const definitions = options.definitions ?? { 'git-repo': SKILL }
        return definitions[name]
      },
    },
    subagents: {
      list: () => Object.keys(providers),
      getProvider: (name) => {
        const capabilities = providers[name]
        return capabilities === undefined
          ? undefined
          : { capabilities: { outputSchema: capabilities.outputSchema, agentOptions: capabilities.agentOptions ?? true } }
      },
      ...options.startActivation === false ? {} : {
        startActivation: async (spec: WorkbenchActivationSpec): Promise<WorkbenchActivation> => {
          activations.push(spec)
          return { childId: 'child', result: scriptedChild(spec.signal), dispose: async () => { disposed.count += 1 } }
        },
      },
      ...options.start === true ? {
        start: async (provider: string, spec: WorkbenchStartSpec): Promise<WorkbenchStartHandle> => {
          starts.push({ provider, spec })
          return { id: 'child', result: scriptedChild(spec.signal), dispose: async () => { disposed.count += 1 } }
        },
      } : {},
    },
    llm: {
      listModels: async (provider) => {
        const offered = models[provider]
        // A missing provider rejects here for the same reason the real registry does: the
        // route is not mounted, which is a different refusal from a model that left.
        if (offered === undefined) throw new Error(`no provider "${provider}" is mounted`)
        return offered.map(id => ({ id }))
      },
    },
  }
  return { host, workingDirectory, statDirectory, activations, starts, lookups, disposed, createdAgents, disposedAgents, archivedSessions, sandboxModes, settleChild }
}
