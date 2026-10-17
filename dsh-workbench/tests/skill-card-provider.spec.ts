/** Load-time validation of the configured subagent backend. */

import { describe, expect, it } from 'vitest'
import { assertSubagentProvider } from '../src/skill-card-provider.ts'
import type { SubagentProviderSource } from '../src/skill-card-provider.ts'

/** Subagent double backed by a fixed provider table. */
function subagents(providers: Readonly<Record<string, { readonly outputSchema: boolean }>>): SubagentProviderSource {
  return {
    list: () => Object.keys(providers),
    getProvider: name => {
      const capabilities = providers[name]
      return capabilities === undefined ? undefined : { capabilities }
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
