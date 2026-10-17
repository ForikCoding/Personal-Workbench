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
import type { WorkbenchSkillDefinition } from './skill-card-host.ts';
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
export declare function renderWorkbenchSkillPrompt(skill: WorkbenchSkillDefinition, template: string): string;
