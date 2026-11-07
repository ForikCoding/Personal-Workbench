/**
 * Local skill discovery for the workbench, as its own `ctx.skills` provider.
 *
 * The shipped composition mounts `skill-filesystem` inside each agent preset, and in the
 * packaged desktop that row is dropped before any of its roots is read. Its bundled
 * `customSkillDirs` points inside `app.asar`, the filesystem service cannot list an archive
 * path, and one unlistable root fails the whole provider:
 *
 *     warn skill-registry: skill provider "filesystem" skipped:
 *     FsError: cannot list "…\resources\app.asar\node_modules\@deepseek-ai\dsh-agent-preset\skills"
 *
 * The preset's local roots therefore contribute nothing — not the bundled ones, and not
 * `~/.agents/skills` either, which is why a user's own skills never reach any catalog built
 * from this harness. Editing the pinned upstream or repackaging the desktop are not options
 * here, so the workbench reads the same local roots through a provider of its own: no asar
 * path is involved, and the read no longer depends on the preset row that is being skipped.
 *
 * Deliberately narrow: directory bundles with a `SKILL.md` at their root, the four roots a
 * local user keeps skills in, and the frontmatter the picker and the run prompt need. It
 * registers at host scope, so every catalog read sees it regardless of which agent answers.
 * @module dsh-workbench/skill-card-local-skills
 */

import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/** One skill as a provider reports it. Mirrors the registry's `SkillCandidate`. */
export interface WorkbenchLocalSkillCandidate {
  readonly path: string
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly invocation: { readonly modelInvocable: boolean; readonly userInvocable: boolean }
  readonly source: string
  readonly provider: string
  readonly resourceBase: { readonly kind: 'directory'; readonly path: string }
  readonly rank: number
  readonly locator: { readonly path: string }
}

/** One loaded skill. Mirrors the registry's `SkillDefinition`. */
export interface WorkbenchLocalSkillDefinition extends Omit<WorkbenchLocalSkillCandidate, 'locator' | 'rank'> {
  readonly content: string
}

/** The narrow slice of `ctx.skills` this module registers into. */
export interface WorkbenchSkillRegistrySeam {
  readonly registerProvider: (create: (control: { readonly signal: AbortSignal; readonly invalidate: () => void }) => {
    readonly name: string
    readonly list: (options: { readonly cwd?: string | undefined; readonly signal?: AbortSignal | undefined }) => Promise<readonly WorkbenchLocalSkillCandidate[]>
    readonly get: (
      candidate: WorkbenchLocalSkillCandidate,
      options: { readonly cwd?: string | undefined; readonly signal?: AbortSignal | undefined },
    ) => Promise<WorkbenchLocalSkillDefinition | undefined>
  }) => () => void
}

/** Provider name; also what a catalog entry reports as its `provider`. */
export const WORKBENCH_LOCAL_SKILL_PROVIDER = 'workbench-local'

/** Frontmatter fields this provider reads, and nothing else. */
interface ParsedSkill {
  readonly name: string
  readonly description: string
  readonly whenToUse?: string
  readonly modelInvocable: boolean
  readonly userInvocable: boolean
  readonly content: string
}

/** Skill name grammar, matching the registry's own rule. */
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Split one `SKILL.md` into frontmatter and body.
 * @param text - the file.
 * @returns the body and the parsed frontmatter lines, or undefined when there is no frontmatter.
 */
function splitFrontmatter(text: string): { readonly body: string; readonly fields: Map<string, string> } | undefined {
  const normalized = text.replaceAll('\r\n', '\n')
  if (!normalized.startsWith('---\n')) return undefined
  const end = normalized.indexOf('\n---', 3)
  if (end < 0) return undefined
  const raw = normalized.slice(4, end)
  const afterMarker = normalized.indexOf('\n', end + 1)
  // The blank line a writer leaves between the closing marker and the first heading is
  // separator, not content: the body starts at the first line after it.
  const body = afterMarker < 0 ? '' : normalized.slice(afterMarker + 1).replace(/^\n/, '')
  const fields = new Map<string, string>()
  let key: string | undefined
  let pending: string[] = []
  const flush = (): void => {
    if (key === undefined) return
    fields.set(key, pending.join(' ').trim())
    key = undefined
    pending = []
  }
  for (const line of raw.split('\n')) {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (match === null) {
      // A continuation line: folded scalars and indented prose both land here.
      if (key !== undefined && line.trim() !== '') pending.push(line.trim())
      continue
    }
    flush()
    key = match[1] ?? ''
    const value = (match[2] ?? '').trim()
    // A block scalar's own text follows on the indented lines.
    if (value !== '|' && value !== '>' && value !== '|-' && value !== '>-') pending.push(value)
  }
  flush()
  return { body, fields }
}

/**
 * Read the fields this provider needs out of one skill bundle.
 * @param text - the `SKILL.md` contents.
 * @param fallbackName - the directory name, used when the frontmatter names nothing usable.
 * @returns the parsed skill, or undefined when it has no usable name.
 */
function parseSkill(text: string, fallbackName: string): ParsedSkill | undefined {
  const split = splitFrontmatter(text)
  if (split === undefined) return undefined
  const declared = (split.fields.get('name') ?? '').replace(/^['"]|['"]$/g, '')
  const name = SKILL_NAME.test(declared) ? declared : fallbackName
  if (!SKILL_NAME.test(name)) return undefined
  const description = (split.fields.get('description') ?? '').replace(/^['"]|['"]$/g, '')
  if (description === '') return undefined
  const whenToUse = split.fields.get('when-to-use')
  const userInvocable = split.fields.get('user-invocable') !== 'false'
  const modelInvocable = split.fields.get('disable-model-invocation') !== 'true'
  return {
    name,
    description,
    ...whenToUse === undefined ? {} : { whenToUse },
    modelInvocable,
    userInvocable,
    content: split.body,
  }
}

/** One root the provider reads, in precedence order. */
interface LocalRoot {
  readonly path: string
  readonly source: string
  readonly rank: number
}

/**
 * Build the local roots for one lookup.
 * @param home - the user's home directory.
 * @param cwd - the workspace the catalog is being read for, when there is one.
 * @returns project roots first, then user roots.
 */
function localRoots(home: string, cwd: string | undefined): LocalRoot[] {
  const roots: LocalRoot[] = []
  if (cwd !== undefined) {
    roots.push(
      { path: join(cwd, '.dsh/skills'), source: 'project-dsh', rank: 100 },
      { path: join(cwd, '.agents/skills'), source: 'project-agents', rank: 200 },
    )
  }
  roots.push(
    { path: join(home, '.dsh/skills'), source: 'user-dsh', rank: 400 },
    { path: join(home, '.agents/skills'), source: 'user-agents', rank: 500 },
  )
  return roots
}

/** What the provider needs from its host. */
export interface WorkbenchLocalSkillProviderOptions {
  /** The user's home directory; `~/.agents/skills` is the root users keep skills in. */
  readonly home: string
  /** Where a root that cannot be read is reported. One line each, once per read. */
  readonly warn: (message: string) => void
  /** Directory and file readers, injectable so the provider is testable without a disk. */
  readonly readdir?: (path: string) => Promise<readonly { readonly name: string; readonly isDirectory: () => boolean }[]>
  readonly readFile?: (path: string) => Promise<string>
}

/**
 * Build the provider the workbench registers into `ctx.skills`.
 * @param options - home directory, warning sink, and the injected readers.
 * @returns a registry provider.
 */
export function createWorkbenchLocalSkillProvider(options: WorkbenchLocalSkillProviderOptions): {
  readonly name: string
  readonly list: (lookup: { readonly cwd?: string | undefined; readonly signal?: AbortSignal | undefined }) => Promise<readonly WorkbenchLocalSkillCandidate[]>
  readonly get: (
    candidate: WorkbenchLocalSkillCandidate,
    lookup: { readonly cwd?: string | undefined; readonly signal?: AbortSignal | undefined },
  ) => Promise<WorkbenchLocalSkillDefinition | undefined>
} {
  const readDir = options.readdir ?? (async (path: string) => await readdir(path, { withFileTypes: true }))
  const readFileText = options.readFile ?? (async (path: string) => await readFile(path, 'utf8'))

  /** Read one root's bundles; a root that cannot be read costs only itself. */
  const readRoot = async (root: LocalRoot): Promise<WorkbenchLocalSkillCandidate[]> => {
    let entries
    try {
      entries = await readDir(root.path)
    } catch (error) {
      // Missing is normal; unreadable is worth a line, because it is what hides skills.
      if ((error as { code?: string }).code !== 'ENOENT') {
        options.warn(`workbench local skills: cannot list ${root.path}: ${(error as Error).message}`)
      }
      return []
    }
    const found: WorkbenchLocalSkillCandidate[] = []
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      const path = join(root.path, entry.name, 'SKILL.md')
      let text: string
      try {
        text = await readFileText(path)
      } catch {
        continue
      }
      const parsed = parseSkill(text, entry.name)
      if (parsed === undefined) continue
      found.push({
        path,
        name: parsed.name,
        description: parsed.description,
        ...parsed.whenToUse === undefined ? {} : { whenToUse: parsed.whenToUse },
        invocation: { modelInvocable: parsed.modelInvocable, userInvocable: parsed.userInvocable },
        source: root.source,
        provider: WORKBENCH_LOCAL_SKILL_PROVIDER,
        resourceBase: { kind: 'directory', path: dirname(path) },
        rank: root.rank,
        locator: { path },
      })
    }
    return found
  }

  return {
    name: WORKBENCH_LOCAL_SKILL_PROVIDER,
    async list(lookup) {
      const roots = localRoots(options.home, lookup.cwd)
      const all: WorkbenchLocalSkillCandidate[] = []
      for (const root of roots) {
        lookup.signal?.throwIfAborted()
        all.push(...await readRoot(root))
      }
      return all
    },
    async get(candidate) {
      const path = candidate.locator.path
      let text: string
      try {
        text = await readFileText(path)
      } catch {
        return undefined
      }
      const parsed = parseSkill(text, candidate.name)
      if (parsed === undefined) return undefined
      return {
        path,
        name: parsed.name,
        description: parsed.description,
        ...parsed.whenToUse === undefined ? {} : { whenToUse: parsed.whenToUse },
        invocation: { modelInvocable: parsed.modelInvocable, userInvocable: parsed.userInvocable },
        source: candidate.source,
        provider: WORKBENCH_LOCAL_SKILL_PROVIDER,
        resourceBase: { kind: 'directory', path: dirname(path) },
        content: parsed.content,
      }
    },
  }
}
