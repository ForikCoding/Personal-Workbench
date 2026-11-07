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
/** One skill as a provider reports it. Mirrors the registry's `SkillCandidate`. */
export interface WorkbenchLocalSkillCandidate {
    readonly path: string;
    readonly name: string;
    readonly description: string;
    readonly whenToUse?: string;
    readonly invocation: {
        readonly modelInvocable: boolean;
        readonly userInvocable: boolean;
    };
    readonly source: string;
    readonly provider: string;
    readonly resourceBase: {
        readonly kind: 'directory';
        readonly path: string;
    };
    readonly rank: number;
    readonly locator: {
        readonly path: string;
    };
}
/** One loaded skill. Mirrors the registry's `SkillDefinition`. */
export interface WorkbenchLocalSkillDefinition extends Omit<WorkbenchLocalSkillCandidate, 'locator' | 'rank'> {
    readonly content: string;
}
/** The narrow slice of `ctx.skills` this module registers into. */
export interface WorkbenchSkillRegistrySeam {
    readonly registerProvider: (create: (control: {
        readonly signal: AbortSignal;
        readonly invalidate: () => void;
    }) => {
        readonly name: string;
        readonly list: (options: {
            readonly cwd?: string | undefined;
            readonly signal?: AbortSignal | undefined;
        }) => Promise<readonly WorkbenchLocalSkillCandidate[]>;
        readonly get: (candidate: WorkbenchLocalSkillCandidate, options: {
            readonly cwd?: string | undefined;
            readonly signal?: AbortSignal | undefined;
        }) => Promise<WorkbenchLocalSkillDefinition | undefined>;
    }) => () => void;
}
/** Provider name; also what a catalog entry reports as its `provider`. */
export declare const WORKBENCH_LOCAL_SKILL_PROVIDER = "workbench-local";
/** What the provider needs from its host. */
export interface WorkbenchLocalSkillProviderOptions {
    /** The user's home directory; `~/.agents/skills` is the root users keep skills in. */
    readonly home: string;
    /** Where a root that cannot be read is reported. One line each, once per read. */
    readonly warn: (message: string) => void;
    /** Directory and file readers, injectable so the provider is testable without a disk. */
    readonly readdir?: (path: string) => Promise<readonly {
        readonly name: string;
        readonly isDirectory: () => boolean;
    }[]>;
    readonly readFile?: (path: string) => Promise<string>;
}
/**
 * Build the provider the workbench registers into `ctx.skills`.
 * @param options - home directory, warning sink, and the injected readers.
 * @returns a registry provider.
 */
export declare function createWorkbenchLocalSkillProvider(options: WorkbenchLocalSkillProviderOptions): {
    readonly name: string;
    readonly list: (lookup: {
        readonly cwd?: string | undefined;
        readonly signal?: AbortSignal | undefined;
    }) => Promise<readonly WorkbenchLocalSkillCandidate[]>;
    readonly get: (candidate: WorkbenchLocalSkillCandidate, lookup: {
        readonly cwd?: string | undefined;
        readonly signal?: AbortSignal | undefined;
    }) => Promise<WorkbenchLocalSkillDefinition | undefined>;
};
