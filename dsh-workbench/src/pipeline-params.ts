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
export const WORKBENCH_PARAM_NAME_MAX_LENGTH = 20

/** Longest value a run may be given for one name, in characters. */
export const WORKBENCH_PARAM_VALUE_MAX_LENGTH = 40

/**
 * Most names one run may be told.
 *
 * A pipeline's cards bound this in practice — one name per token they write — and a value is a
 * bounded string, so this only keeps a hand-written body from carrying a map nobody asked for.
 */
export const WORKBENCH_PARAM_MAX_NAMES = 64

/**
 * What a value may be made of.
 *
 * A value ends up in a path, so it is held to what every filesystem takes without quoting:
 * letters, digits, dot, underscore and hyphen. A space or a slash is refused rather than escaped,
 * because a parameter is a name the user types, not a path they assemble.
 */
const PARAM_VALUE_PATTERN = /^[A-Za-z0-9._-]+$/

/**
 * One braced token in a directory: `{任务编号}` names `任务编号`.
 *
 * Braces nest nowhere, so anything between the first opening and the next closing brace is a
 * name: `{v1.2}` and `{版本号}` are both names, and neither is a regular expression. The source is
 * kept, not the compiled pattern: both callers build their own, so no `lastIndex` is carried from
 * one path to the next.
 */
const PARAM_TOKEN_SOURCE = `\\{([^{}]{1,${String(WORKBENCH_PARAM_NAME_MAX_LENGTH)}})\\}`

/** One value a pipeline needs, and the steps that need it. */
export interface WorkbenchPipelineParam {
  /** The name as written between the braces. */
  readonly name: string
  /** Zero-based indexes of the steps whose card names it, ascending. */
  readonly steps: readonly number[]
}

/** Why a value cannot be used, as a code the panel turns into its own sentence. */
export type WorkbenchParamValueProblem = 'empty' | 'charset' | 'length'

/**
 * The names one directory names.
 *
 * Order is the order they appear, and a name repeated in one path is reported once: the run asks
 * for `{任务编号}` once whether the path names it twice or once.
 * @param path - a result directory as its card writes it; absent when the card has none.
 * @returns the names, in the order the path states them.
 */
export function paramNamesOf(path: string | undefined): readonly string[] {
  return namesIn(path === undefined ? '' : path)
}

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
export function pipelineParamPlan(
  paths: readonly (string | undefined)[],
): readonly WorkbenchPipelineParam[] {
  const order: string[] = []
  const steps = new Map<string, number[]>()
  paths.forEach((path, index) => {
    for (const name of namesIn(path === undefined ? '' : path)) {
      const known = steps.get(name)
      if (known === undefined) {
        order.push(name)
        steps.set(name, [index])
        continue
      }
      // One entry per step even when a path names the same token twice.
      if (known[known.length - 1] !== index) known.push(index)
    }
  })
  return order.map(name => ({ name, steps: steps.get(name) ?? [] }))
}

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
export function resolveResultPath(path: string, values: Readonly<Record<string, string>>): string {
  return path.replace(new RegExp(PARAM_TOKEN_SOURCE, 'g'), (whole, name: string) => {
    const value = values[name]
    return value === undefined || value === '' ? whole : value
  })
}

/**
 * The names a run still has to be told, in the order the plan states them.
 * @param plan - what the pipeline needs.
 * @param values - what the run holds.
 * @returns the open names; empty means the run can start.
 */
export function missingParamValues(
  plan: readonly WorkbenchPipelineParam[],
  values: Readonly<Record<string, string>>,
): readonly string[] {
  return plan
    .filter(param => (values[param.name] ?? '').trim() === '')
    .map(param => param.name)
}

/** The pointer attribute as written, so it can be rewritten in place. */
const RESULT_POINTER_SOURCE = /(data-dsh-files\s*=\s*")([^"]{1,512})(")/gi

/** A template's comments, which are documentation rather than instruction. */
const TEMPLATE_COMMENT_SOURCE = /(<!--[\s\S]*?-->)/

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
export function resolveTemplateParams(template: string, values: Readonly<Record<string, string>>): string {
  // Odd indexes are the comments, because the split captures them.
  return template
    .split(TEMPLATE_COMMENT_SOURCE)
    .map((part, index) => index % 2 === 1
      ? part
      : part.replace(RESULT_POINTER_SOURCE, (_whole, open: string, path: string, close: string) => (
        `${open}${resolveResultPath(path, values)}${close}`
      )))
    .join('')
}

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
export function resolveTemplatePointer(template: string, path: string): string {
  if (path === '') return template
  // Odd indexes are the comments, as above: an explanation that quotes the pointer keeps its text.
  return template
    .split(TEMPLATE_COMMENT_SOURCE)
    .map((part, index) => index % 2 === 1
      ? part
      : part.replace(RESULT_POINTER_SOURCE, (_whole, open: string, _path: string, close: string) => (
        `${open}${path}${close}`
      )))
    .join('')
}

/** One stretch of a directory: literal text, or a name the run has to fill. */
export type WorkbenchResultPathPart =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'name'; readonly name: string }

/**
 * A directory cut into the parts a panel draws differently.
 *
 * The token rule has to be applied by whoever renders the path, so it is applied here rather than
 * in the panel: two readers of the same braces would eventually disagree about what is a name, and
 * the panel that draws `{任务编号}` as a chip is the one place a mistake would be visible.
 * @param path - the directory as the card writes it.
 * @returns the parts in order; adjacent text is not merged, and an empty path has no parts.
 */
export function paramPartsOf(path: string): readonly WorkbenchResultPathPart[] {
  const parts: WorkbenchResultPathPart[] = []
  let at = 0
  for (const match of path.matchAll(new RegExp(PARAM_TOKEN_SOURCE, 'g'))) {
    const index = match.index ?? 0
    if (index > at) parts.push({ kind: 'text', text: path.slice(at, index) })
    parts.push({ kind: 'name', name: match[1] ?? '' })
    at = index + match[0].length
  }
  if (at < path.length) parts.push({ kind: 'text', text: path.slice(at) })
  return parts
}

/**
 * Whether a value can be used, and why not when it cannot.
 * @param value - what the user typed or the run remembered.
 * @returns the reason it cannot be used, or `undefined` when it can.
 */
export function paramValueProblem(value: string): WorkbenchParamValueProblem | undefined {
  const trimmed = value.trim()
  if (trimmed === '') return 'empty'
  if (trimmed.length > WORKBENCH_PARAM_VALUE_MAX_LENGTH) return 'length'
  return PARAM_VALUE_PATTERN.test(trimmed) ? undefined : 'charset'
}

/**
 * Whether a string can be the name of a parameter.
 *
 * Asked twice per name, from two sides: by a reader of a path, and by the route that receives values
 * from a page. One rule for both, because a name a panel asks for and a name the Host refuses would
 * be a run that cannot start and cannot say why.
 * @param name - candidate name, as written between braces.
 * @returns whether the name has the shape a token allows.
 */
export function isWorkbenchParamName(name: string): boolean {
  if (name.length === 0 || name.length > WORKBENCH_PARAM_NAME_MAX_LENGTH) return false
  return !name.includes('{') && !name.includes('}')
}

/**
 * The names in one path, deduplicated, in first-appearance order.
 * @param path - the path to read.
 * @returns the names it states.
 */
function namesIn(path: string): readonly string[] {
  if (path === '') return []
  const found: string[] = []
  // A fresh pattern per call: a shared global regex carries `lastIndex` between callers, and this
  // one is called once per step per render.
  const pattern = new RegExp(PARAM_TOKEN_SOURCE, 'g')
  for (const match of path.matchAll(pattern)) {
    const name = match[1]
    if (name !== undefined && !found.includes(name)) found.push(name)
  }
  return found
}
