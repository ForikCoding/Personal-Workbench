/**
 * Load-time validation and capability probes for the subagent seam the card runs on.
 *
 * The checks live outside the plugin entry so they can be exercised without a Cordis
 * context, and so the entry stays a pure assembly step.
 * @module dsh-workbench/skill-card-provider
 */

import type { WorkbenchRunCapabilities } from './skill-card-contract.ts'
import type { WorkbenchSubagentHost } from './skill-card-host.ts'

/** The part of the subagent surface this check reads. */
export type SubagentProviderSource = Pick<WorkbenchSubagentHost, 'list' | 'getProvider'>

/** The part of the subagent surface the seam probe reads. */
export type SubagentSeamSource = Pick<WorkbenchSubagentHost, 'startActivation'>

/**
 * Refuse a subagent backend that cannot produce structured output.
 *
 * The check runs only once some provider has registered. A backend row that
 * applies later would otherwise turn a slow composition into a startup failure,
 * so while the list is still empty the decision is deferred to the first run —
 * the earliest point at which that answer is resolvable.
 * @param subagents - the subagent service.
 * @param providerName - configured backend name.
 * @throws {Error} when the registered backends do not satisfy the configuration.
 */
export function assertSubagentProvider(subagents: SubagentProviderSource, providerName: string): void {
  if (subagents.list().length === 0) return
  const provider = subagents.getProvider(providerName)
  if (provider === undefined) {
    throw new Error(`workbench: subagent provider "${providerName}" is not registered`)
  }
  if (!provider.capabilities.outputSchema) {
    throw new Error(`workbench: subagent provider "${providerName}" does not support structured output`)
  }
}

/**
 * Record whether the subagent service exposes the seam a card run needs.
 *
 * The answer is a property of the composition, so it is read once, where the Host half is
 * assembled, and never again per run: it is the same for every card and every click. The
 * recorded value travels to the client, which disables its run control and states the
 * requirement, and the runner keeps its own refusal for a call that arrives anyway.
 * @param subagents - the subagent service.
 * @returns the recorded capability; `startActivation: false` on a harness that predates it.
 */
export function probeSubagentSeam(subagents: SubagentSeamSource): WorkbenchRunCapabilities {
  return { startActivation: typeof subagents.startActivation === 'function' }
}
