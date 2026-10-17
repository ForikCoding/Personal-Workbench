/**
 * Validation of the subagent backend the skill card is configured to run on.
 *
 * The check lives outside the plugin entry so it can be exercised without a
 * Cordis context, and so the entry stays a pure assembly step.
 * @module dsh-workbench/skill-card-provider
 */
import type { WorkbenchSubagentHost } from './skill-card-host.ts';
/** The part of the subagent surface this check reads. */
export type SubagentProviderSource = Pick<WorkbenchSubagentHost, 'list' | 'getProvider'>;
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
export declare function assertSubagentProvider(subagents: SubagentProviderSource, providerName: string): void;
