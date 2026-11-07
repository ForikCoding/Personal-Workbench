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
 * Render one skill, the row that triggered the run, and the document to fill.
 *
 * The whole document travels, comments included: the region's markers say what to fill,
 * and the comments around them say how. Only the region comes back, so the document is
 * carried verbatim rather than re-serialized — parsing it here would delete the
 * comments, which are the instruction. Its size is bounded by the byte budget enforced
 * when the template was stored.
 * @param skill - the loaded skill.
 * @param template - the card's own HTML for this skill.
 * @param payload - the clicked row's raw fields; absent for a run no row triggered.
 * @param instruction - what the user asked this run to do; absent for a run that said nothing.
 * @param budgetMs - the deadline the run has, when it has one.
 * @param handoff - notes the steps before this one left, when this run cannot continue
 * their conversation.
 * @param cwd - the directory this run executes in, when it has one; the base a relative
 * deliverable directory resolves against.
 * @returns the complete model-facing prompt text.
 */
export declare function renderWorkbenchSkillPrompt(skill: WorkbenchSkillDefinition, template: string, payload?: Record<string, unknown>, instruction?: string, budgetMs?: number, handoff?: string, cwd?: string): string;
/**
 * Render one skill, the document, the result to revise, and the revision request.
 *
 * The document travels whole for the same reason a card run sends it whole: the
 * comments in it are the instruction for the region, and the region is what comes back.
 * The previous result is carried verbatim rather than summarized — a summary of the
 * HTML is a second, lossy source of truth, and the child is being asked to keep the
 * parts the request does not name.
 * @param skill - the loaded skill.
 * @param template - the card's own HTML for this skill.
 * @param previous - the region HTML the revision starts from, verbatim.
 * @param instruction - what the user asked to change, verbatim.
 * @param payload - the clicked row's raw fields; absent for a run no row triggered.
 * @returns the complete model-facing prompt text.
 */
export declare function renderWorkbenchRefinePrompt(skill: WorkbenchSkillDefinition, template: string, previous: string, instruction: string, payload?: Record<string, unknown>, budgetMs?: number): string;
/**
 * Render one skill, the row that triggered the run, and its task line, with no document.
 *
 * A skill target has no template, so carrying an `<output_document>` would ask the
 * child for a region nobody can render. Everything the child could be told about the
 * skill still travels.
 * @param skill - the loaded skill.
 * @param payload - the clicked row's raw fields; absent for a run no row triggered.
 * @returns the complete model-facing prompt text.
 */
export declare function renderWorkbenchBarePrompt(skill: WorkbenchSkillDefinition, payload?: Record<string, unknown>): string;
/**
 * Write one deadline the way a person reads it.
 *
 * Shared by the prompt and the failure a deadline produces, so the budget the child was
 * given and the sentence that reports it running out cannot disagree.
 * @param milliseconds - the deadline.
 * @returns the duration, in minutes when it is a whole number of them, else in seconds.
 */
export declare function describeDuration(milliseconds: number): string;
