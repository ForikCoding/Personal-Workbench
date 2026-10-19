/** Load-time validation of the configured subagent backend, and the seam probe. */

import { describe, expect, it } from 'vitest'
import { assertSubagentProvider, probeSubagentSeam } from '../src/skill-card-provider.ts'
import type { SubagentProviderSource } from '../src/skill-card-provider.ts'
import { fakeHost } from './support/fake-skill-card-host.ts'

/** Subagent double backed by a fixed provider table. */
function subagents(providers: Readonly<Record<string, { readonly outputSchema: boolean }>>): SubagentProviderSource {
  return {
    list: () => Object.keys(providers),
    getProvider: name => {
      const capabilities = providers[name]
      // The load-time check reads only the structured-output capability; the model
      // capability is answered for completeness because the narrowed host requires it.
      return capabilities === undefined
        ? undefined
        : { capabilities: { outputSchema: capabilities.outputSchema, agentOptions: true } }
    },
  }
}

describe('subagent provider validation', () => {
  it('accepts a registered backend that supports structured output', () => {
    expect(() => { assertSubagentProvider(subagents({ spawn: { outputSchema: true } }), 'spawn') }).not.toThrow()
  })

  it('refuses an unregistered backend by name', () => {
    expect(() => { assertSubagentProvider(subagents({ spawn: { outputSchema: true } }), 'missing') })
      .toThrow('workbench: subagent provider "missing" is not registered')
  })

  it('refuses a backend without the structured-output capability', () => {
    expect(() => { assertSubagentProvider(subagents({ acp: { outputSchema: false } }), 'acp') })
      .toThrow('workbench: subagent provider "acp" does not support structured output')
  })

  it('defers while no backend has registered yet', () => {
    // A backend row that applies later must not turn a slow composition into a
    // startup failure; the runner re-checks on the first run instead.
    expect(() => { assertSubagentProvider(subagents({}), 'spawn') }).not.toThrow()
  })
})

describe('subagent seam probe', () => {
  it('records the seam when the service exposes it', () => {
    // The beta channel's harness: 0.2.1-alpha.2 provides startActivation.
    expect(probeSubagentSeam(fakeHost().host.subagents)).toEqual({ startActivation: true })
  })

  it('records its absence on a harness that predates it', () => {
    // The stable channel pins 0.2.0-rc.2, whose subagent service has start and
    // startContinuable and no activation seam. That is a capability answer, not a fault
    // of the composition, so the probe returns a verdict instead of throwing.
    expect(probeSubagentSeam(fakeHost({ startActivation: false }).host.subagents))
      .toEqual({ startActivation: false })
  })
})
