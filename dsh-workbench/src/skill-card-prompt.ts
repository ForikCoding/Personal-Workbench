/**
 * Build the prompt one skill card run sends to its child agent.
 *
 * The `<skill_content>` wrapper is reproduced from the skill registry's own
 * renderer (`renderSkillContent` in `@deepseek-ai/dsh-skill`), which is the shape
 * the model already sees when a user invokes `/name` and in the skill tool's
 * result. It is reproduced rather than imported for two reasons: that package is
 * not a resolvable runtime dependency of this outer workspace, and the two
 * Desktop channels pin different upstream versions, so importing would make the
 * prompt drift with whichever copy happened to resolve.
 *
 * If upstream changes the wrapper, this module has to follow.
 * @module dsh-workbench/skill-card-prompt
 */

import type { WorkbenchSkillDefinition } from './skill-card-host.ts'

/**
 * What the child is asked to do beyond the skill's own instructions.
 *
 * The subagent seam already appends its own instruction telling the child to
 * report through the structured-output tool, so this text covers what only the
 * template can say: which values to produce and how a repeated element maps onto
 * a list. It carries no UI or transport vocabulary.
 */
const TASK_INSTRUCTION = [
  'Apply the skill above to the current workspace now.',
  '',
  'Then fill in the part of the document below that sits between <!-- template-begin --> and',
  '<!-- template-end -->, and report only that part through the structured-output tool as `html`.',
  '',
  '- The comments inside the document state what each part must contain. Read them and follow them.',
  '- Everything outside that region is kept exactly as written, so do not restate or modify it.',
  '- Report HTML, not a description of it.',
  '- Build one entry per item the skill returned. Do not invent entries to fill the document out.',
].join('\n')

/**
 * Render one skill, its task line, and the document the result has to fill.
 *
 * The whole document travels, comments included: the region's markers say what to fill,
 * and the comments around them say how. Only the region comes back, so the document is
 * carried verbatim rather than re-serialized — parsing it here would delete the
 * comments, which are the instruction. Its size is bounded by the byte budget enforced
 * when the template was stored.
 * @param skill - the loaded skill.
 * @param template - the card's own HTML for this skill.
 * @returns the complete model-facing prompt text.
 */
export function renderWorkbenchSkillPrompt(skill: WorkbenchSkillDefinition, template: string): string {
  return [
    `<skill_content name="${escapeAttr(skill.name)}">`,
    '<skill_resources>',
    ...resourceHint(skill),
    '</skill_resources>',
    '',
    '<skill_instructions>',
    skill.content,
    '</skill_instructions>',
    '</skill_content>',
    '',
    '<output_document>',
    template,
    '</output_document>',
    '',
    TASK_INSTRUCTION,
  ].join('\n')
}

/**
 * Name where the skill's relative resources resolve from.
 * @param skill - the loaded skill.
 * @returns the resource hint lines.
 */
function resourceHint(skill: WorkbenchSkillDefinition): string[] {
  const base = skill.resourceBase
  if (base === undefined) {
    return [
      `Resources for this skill are managed by provider "${escapeText(skill.provider)}".`,
      'Load referenced resources only as needed.',
    ]
  }
  switch (base.kind) {
    case 'directory':
      return [
        `Base directory for this skill: ${escapeText(base.path)}`,
        'Resolve relative paths mentioned by this skill against the base directory before using them. Load referenced resources only as needed.',
      ]
    case 'url':
      return [
        `Base URL for this skill: ${escapeText(base.url)}`,
        'Resolve relative URLs mentioned by this skill against the base URL before using them. Load referenced resources only as needed.',
      ]
    case 'opaque':
      return [
        `Resources for this skill: ${escapeText(base.description)}`,
        'Load referenced resources only as needed.',
      ]
  }
}

/**
 * Escape a value embedded in a skill markup attribute.
 * @param value - raw value.
 * @returns the escaped attribute text.
 */
function escapeAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

/**
 * Escape provider-supplied prose so it cannot open or close the framing tags.
 * @param value - raw prose.
 * @returns the escaped text.
 */
function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
