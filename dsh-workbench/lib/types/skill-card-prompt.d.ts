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
 * What one run tells every step of it.
 *
 * Two facts a step cannot read off its own card. The values, because a value substituted into a
 * directory pointer reaches the model only as a path — it never learns that the number was
 * called "任务编号", which is why people used to type the same number into every card's
 * instruction. And the sentence, because someone running a whole pipeline says "this is the
 * task" once, not once per card.
 *
 * Told apart from a step's own `instruction` on purpose: that one is what the card does and is
 * the card's to keep, this one is which instance of it this run is. A run told neither produces
 * exactly the prompt this module produced before these blocks existed.
 */
export interface WorkbenchRunShare {
    /** Values the run was given, by name, as the person running it wrote them. */
    readonly values?: Readonly<Record<string, string>>;
    /** The sentence typed once for this whole run, verbatim; the panel calls it 运行指令. */
    readonly directive?: string;
}
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
 * @param share - what the run told every step of it; absent for a run that told nothing.
 * @returns the complete model-facing prompt text.
 */
export declare function renderWorkbenchSkillPrompt(skill: WorkbenchSkillDefinition, template: string, payload?: Record<string, unknown>, instruction?: string, budgetMs?: number, handoff?: string, cwd?: string, share?: WorkbenchRunShare): string;
/**
 * Put the run's values into the sentence where it named them.
 *
 * The same rule the records and the previews use: `{任务编号}` in the sentence becomes the value
 * this run was given, and a name no value answers stays between its braces — a sentence that
 * looked a token up by itself would be a second answer to a question the run already answered,
 * and a silently dropped one would leave a sentence that reads as if it never had a token.
 * @param text - the sentence as it was typed.
 * @param values - the run's values, by name; absent when it was given none.
 * @returns the sentence with every named value filled in.
 */
export declare function substituteValues(text: string, values: Readonly<Record<string, string>> | undefined): string;
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
