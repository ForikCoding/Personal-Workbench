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
  WorkbenchSubagentResult,
  WorkbenchWorkingDirectory,
} from '../../src/skill-card-host.ts'

/** The agent every double answers with; it carries a session header cwd. */
export const AGENT: WorkbenchAgent = { id: 'session-1', session: { header: { cwd: '/header-repo' } } }

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
  readonly providers?: Readonly<Record<string, { readonly outputSchema: boolean }>>
  readonly outcomes?: readonly ScriptedResult[]
  readonly throwsOn?: 'ensure' | 'list'
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
  readonly activations: WorkbenchActivationSpec[]
  readonly lookups: WorkbenchSkillLookup[]
  readonly disposed: { count: number }
  /**
   * Settle the activation that was scripted as `'manual'`.
   * @param result - the child's terminal result.
   */
  readonly settleChild: (result: WorkbenchSubagentResult) => void
}

/**
 * Build a Host double.
 * @param options - what the double answers with.
 * @returns the host and its recorded calls.
 */
export function fakeHost(options: FakeHostOptions = {}): FakeHost {
  const activations: WorkbenchActivationSpec[] = []
  const lookups: WorkbenchSkillLookup[] = []
  const disposed = { count: 0 }
  const providers = options.providers ?? { spawn: { outputSchema: true } }
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

  const host: WorkbenchSkillCardHost = {
    agents: {
      get: (sessionId) => (options.live === false || sessionId !== AGENT.id ? undefined : AGENT),
      list: () => (options.live === false ? [] : [AGENT]),
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
        return capabilities === undefined ? undefined : { capabilities }
      },
      startActivation: async (spec): Promise<WorkbenchActivation> => {
        activations.push(spec)
        const scripted = outcomes[call] ?? { output: [], stopReason: 'completed' }
        call += 1
        if (scripted === 'hang') {
          const result = new Promise<WorkbenchSubagentResult>((resolve) => {
            const abort = (): void => { resolve({ output: [], stopReason: 'aborted' }) }
            // A cancel can land before the activation is even requested, so an
            // already-aborted signal has to settle immediately rather than wait
            // for an event that will never fire again.
            if (spec.signal.aborted) { abort(); return }
            spec.signal.addEventListener('abort', abort, { once: true })
          })
          return { childId: 'child', result, dispose: async () => { disposed.count += 1 } }
        }
        if (scripted === 'manual') {
          const result = new Promise<WorkbenchSubagentResult>((resolve) => { settleManual = resolve })
          return { childId: 'child', result, dispose: async () => { disposed.count += 1 } }
        }
        return { childId: 'child', result: Promise.resolve(scripted), dispose: async () => { disposed.count += 1 } }
      },
    },
  }
  return { host, workingDirectory, activations, lookups, disposed, settleChild }
}
