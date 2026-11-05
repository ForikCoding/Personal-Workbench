/** What a step that cannot join its chain's conversation is told instead. */

import { describe, expect, it } from 'vitest'
import { renderWorkbenchSkillPrompt } from '../src/skill-card-prompt.ts'
import type { WorkbenchSkillDefinition } from '../src/skill-card-host.ts'

/** A skill with just enough body to render. */
const SKILL: WorkbenchSkillDefinition = {
  name: 'git-repo',
  description: 'Reads a repository',
  invocation: { modelInvocable: true, userInvocable: true },
  content: 'Read the repository and report what changed.',
  provider: 'test',
}

/** A template with a marked region. */
const TEMPLATE = '<!doctype html><p><!-- template-begin --><!-- template-end --></p>'

describe('renderWorkbenchSkillPrompt with a hand-off', () => {
  it('says nothing about earlier steps when there are none', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE)
    expect(prompt).not.toContain('<previous_steps>')
    expect(prompt).not.toContain('The steps before this one')
  })

  it('quotes the notes and says the conversation is what is missing', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, undefined, undefined, '## Step 1\n\nthree commits')
    expect(prompt).toContain('<previous_steps>\n## Step 1\n\nthree commits\n</previous_steps>')
    expect(prompt).toContain('Their conversation is')
    // The notes are the subject, not a second instruction set: the document and the region
    // ask still come after them.
    expect(prompt.indexOf('<previous_steps>')).toBeLessThan(prompt.indexOf('<output_document>'))
    expect(prompt).toContain('<!-- template-begin -->')
  })

  it('ignores a note that is only whitespace', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, undefined, undefined, '   \n\t ')
    expect(prompt).not.toContain('<previous_steps>')
  })

  it('keeps the run instruction ahead of the notes', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, 'write the summary', undefined, 'step one did the reading')
    expect(prompt.indexOf('<run_instruction>')).toBeLessThan(prompt.indexOf('<previous_steps>'))
  })
})
