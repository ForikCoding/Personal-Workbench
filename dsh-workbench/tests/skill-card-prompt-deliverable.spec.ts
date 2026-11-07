/** What a card whose result is files asks the run for, and what it leaves optional. */

import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderWorkbenchSkillPrompt } from '../src/skill-card-prompt.ts'
import type { WorkbenchSkillDefinition } from '../src/skill-card-host.ts'

/** A skill that produces a document. */
const SKILL: WorkbenchSkillDefinition = {
  name: 'task-analysis',
  description: 'Writes one analysis document',
  invocation: { modelInvocable: true, userInvocable: true },
  content: 'Analyse the task and write one document.',
  provider: 'test',
}

/** A template that says its result is files in a directory. */
const FILES_TEMPLATE = [
  '<!doctype html>',
  '<div data-dsh-files="docs/详细设计" hidden></div>',
  '<div id="run-out"><!-- template-begin --><!-- template-end --></div>',
].join('\n')

/** A template whose result is the region itself. */
const REGION_TEMPLATE = '<!doctype html><p><!-- template-begin --><!-- template-end --></p>'

/** The run directory a relative pointer resolves against. */
const CWD = '/repo'

describe('a files-shaped card is asked for its files', () => {
  it('names the directory, resolved against the run directory', () => {
    // Declared relative, resolved here: the prompt is the one place that knows what the
    // card's shorthand is relative to, and the panel reads the result from that same directory.
    const prompt = renderWorkbenchSkillPrompt(SKILL, FILES_TEMPLATE, undefined, undefined, undefined, undefined, CWD)
    expect(prompt).toContain(`<deliverable_directory>${resolve(CWD, 'docs/详细设计')}</deliverable_directory>`)
    expect(prompt).toContain('This deliverable is files in one directory, not the region alone')
    expect(prompt).toContain('creating the directory if it is missing')
  })

  it('names the file tools and refuses the shell as an excuse', () => {
    // The run that skipped its files did so because it believed it had to build the directory
    // through the shell, the shell was refused, and nothing had asked it for files anyway -
    // so it reported the region and settled. Both halves of that are closed here: which tool
    // to use, and the fact that a refused shell is not a reason to skip the work.
    const prompt = renderWorkbenchSkillPrompt(SKILL, FILES_TEMPLATE, undefined, undefined, undefined, undefined, CWD)
    expect(prompt).toContain('`write`, `edit`')
    expect(prompt).toContain('refused shell command is never a reason')
    expect(prompt).toContain('to leave the files unwritten')
  })

  it('keeps the region required and says neither half replaces the other', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, FILES_TEMPLATE, undefined, undefined, undefined, undefined, CWD)
    expect(prompt).toContain('report only that part through the structured-output tool as `html`')
    expect(prompt).toContain('The region is still required and is not a substitute for the files')
    expect(prompt).toContain('The files are not a substitute for it either')
    // The document travels whole ahead of the ask, as it does for every run.
    expect(prompt.indexOf('<output_document>')).toBeLessThan(prompt.indexOf('<deliverable_directory>'))
  })

  it('makes a run with no file say so instead of leaving a silent directory', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, FILES_TEMPLATE, undefined, undefined, undefined, undefined, CWD)
    expect(prompt).toContain('the region must say so in one sentence')
    expect(prompt).toContain('An empty directory and a silent region together are a failed run')
  })

  it('keeps a declared path as written when the run has no directory', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, FILES_TEMPLATE)
    expect(prompt).toContain('<deliverable_directory>docs/详细设计</deliverable_directory>')
  })

  it('leaves an absolute pointer alone', () => {
    const target = resolve('/elsewhere/docs')
    const prompt = renderWorkbenchSkillPrompt(
      SKILL,
      `<div data-dsh-files="${target}" hidden></div><p><!-- template-begin --><!-- template-end --></p>`,
      undefined,
      undefined,
      undefined,
      undefined,
      CWD,
    )
    expect(prompt).toContain(`<deliverable_directory>${target}</deliverable_directory>`)
  })
})

describe('a region-shaped card is asked for no files', () => {
  it('says nothing about a directory or files', () => {
    // A table, a report, a summary: the region is the whole deliverable, and demanding a
    // directory here would make every such card invent a file to satisfy the prompt.
    const prompt = renderWorkbenchSkillPrompt(SKILL, REGION_TEMPLATE, undefined, undefined, undefined, undefined, CWD)
    expect(prompt).not.toContain('<deliverable_directory>')
    expect(prompt).not.toContain('files in one directory')
    expect(prompt).not.toContain('`write`, `edit`')
    expect(prompt).toContain('<!-- template-begin -->')
  })
})
