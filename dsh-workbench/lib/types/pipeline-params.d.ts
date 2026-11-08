/**
 * The values a pipeline run has to be told, derived from the cards it arranges.
 *
 * A card's template states where its result goes through {@link WORKBENCH_RESULT_FILES_ATTRIBUTE},
 * and a directory may name parts that only the run knows:
 *
 * ```html
 * <article data-dsh-files="{任务编号}/docs/任务分析">…</article>
 * ```
 *
 * Nothing else declares a parameter. There is no per-pipeline switch, no per-step field and no
 * list to keep in sync: a pipeline needs exactly the values its cards name between braces, which
 * is why a chain of cards that name none asks for nothing at all.
 *
 * The rules live here, on the host side of the wire, because the panel that asks and the run that
 * substitutes must not have two opinions about what a token is.
 */
/** Longest name a braced token may carry, in characters. */
export declare const WORKBENCH_PARAM_NAME_MAX_LENGTH = 20;
/** Longest value a run may be given for one name, in characters. */
export declare const WORKBENCH_PARAM_VALUE_MAX_LENGTH = 40;
/**
 * Most names one run may be told.
 *
 * A pipeline's cards bound this in practice — one name per token they write — and a value is a
 * bounded string, so this only keeps a hand-written body from carrying a map nobody asked for.
 */
export declare const WORKBENCH_PARAM_MAX_NAMES = 64;
/** One value a pipeline needs, and the steps that need it. */
export interface WorkbenchPipelineParam {
    /** The name as written between the braces. */
    readonly name: string;
    /** Zero-based indexes of the steps whose card names it, ascending. */
    readonly steps: readonly number[];
}
/** Why a value cannot be used, as a code the panel turns into its own sentence. */
export type WorkbenchParamValueProblem = 'empty' | 'charset' | 'length';
/**
 * The names one directory names.
 *
 * Order is the order they appear, and a name repeated in one path is reported once: the run asks
 * for `{任务编号}` once whether the path names it twice or once.
 * @param path - a result directory as its card writes it; absent when the card has none.
 * @returns the names, in the order the path states them.
 */
export declare function paramNamesOf(path: string | undefined): readonly string[];
/**
 * Every value a pipeline needs, and which steps need it.
 *
 * The union, in step order: a card that names nothing adds nothing, and a name two cards share is
 * asked once and substituted in both. This is the whole of "does this step need a parameter" —
 * the answer is the card's, not the step's.
 * @param paths - one entry per step, in step order; a step whose card writes no files passes
 *   `undefined`, which is why the array is allowed to be sparse in meaning rather than in shape.
 * @returns one entry per distinct name, ordered by where it first appears.
 */
export declare function pipelineParamPlan(paths: readonly (string | undefined)[]): readonly WorkbenchPipelineParam[];
/**
 * A directory with the values a run holds put in place of its tokens.
 *
 * A token with no value is left as it was written rather than blanked or dropped: the panel shows
 * the path before a run and after it, and `{任务编号}/docs` states plainly that this part is still
 * open, while an empty span says the card's path is broken.
 * @param path - the directory as the card writes it.
 * @param values - what the run holds, by name.
 * @returns the directory as the run will use it.
 */
export declare function resolveResultPath(path: string, values: Readonly<Record<string, string>>): string;
/**
 * The names a run still has to be told, in the order the plan states them.
 * @param plan - what the pipeline needs.
 * @param values - what the run holds.
 * @returns the open names; empty means the run can start.
 */
export declare function missingParamValues(plan: readonly WorkbenchPipelineParam[], values: Readonly<Record<string, string>>): readonly string[];
/**
 * A card's template with the values a run holds put into its result pointer.
 *
 * Only the pointer is touched. A template is not a path: it is HTML, CSS and a script, all of which
 * may contain braces of their own, so substituting across the whole document would reach into a
 * rule or a string that has nothing to do with where the product goes. Comments are left as written
 * for the same reason — a header that quotes `data-dsh-files="{编号}/docs"` explains the pointer, and
 * rewriting it would make the explanation describe something else.
 * @param template - the card's template as stored.
 * @param values - what the run holds, by name.
 * @returns the template to run with.
 */
export declare function resolveTemplateParams(template: string, values: Readonly<Record<string, string>>): string;
/**
 * A card's template whose result pointer states one directory already resolved.
 *
 * The substitution happens in the Host while a run is being prepared, so the template it worked
 * from is not the template that is stored — and the stored one is what the page renders. A card's
 * own script reads the pointer to list the directory its result lives in, which is why the rendered
 * document has to carry the resolved path too: without it the script asks for `{任务编号}/docs`, the
 * Host answers that no such directory exists, and the card prints an error under a result it wrote
 * perfectly well.
 *
 * The resolved directory is used whole rather than a value per token, because that is exactly what
 * the run recorded: one path, already resolved, and no second reading of the braces.
 * @param template - the card's template as stored.
 * @param path - the directory the run recorded, with the tokens already filled.
 * @returns the template to render; the template unchanged when it names no pointer or the path is empty.
 */
export declare function resolveTemplatePointer(template: string, path: string): string;
/** One stretch of a directory: literal text, or a name the run has to fill. */
export type WorkbenchResultPathPart = {
    readonly kind: 'text';
    readonly text: string;
} | {
    readonly kind: 'name';
    readonly name: string;
};
/**
 * A directory cut into the parts a panel draws differently.
 *
 * The token rule has to be applied by whoever renders the path, so it is applied here rather than
 * in the panel: two readers of the same braces would eventually disagree about what is a name, and
 * the panel that draws `{任务编号}` as a chip is the one place a mistake would be visible.
 * @param path - the directory as the card writes it.
 * @returns the parts in order; adjacent text is not merged, and an empty path has no parts.
 */
export declare function paramPartsOf(path: string): readonly WorkbenchResultPathPart[];
/**
 * Whether a value can be used, and why not when it cannot.
 * @param value - what the user typed or the run remembered.
 * @returns the reason it cannot be used, or `undefined` when it can.
 */
export declare function paramValueProblem(value: string): WorkbenchParamValueProblem | undefined;
/**
 * Whether a string can be the name of a parameter.
 *
 * Asked twice per name, from two sides: by a reader of a path, and by the route that receives values
 * from a page. One rule for both, because a name a panel asks for and a name the Host refuses would
 * be a run that cannot start and cannot say why.
 * @param name - candidate name, as written between braces.
 * @returns whether the name has the shape a token allows.
 */
export declare function isWorkbenchParamName(name: string): boolean;
