/** Local skill discovery: the roots, the frontmatter, and the two calls the registry makes. */

import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createWorkbenchLocalSkillProvider, WORKBENCH_LOCAL_SKILL_PROVIDER } from '../src/skill-card-local-skills.ts'

/** One absolute path in the invented tree, in the host's own separators. */
const at = (...parts: readonly string[]): string => join(...parts)

/** The invented home and workspace. */
const HOME = at('', 'home', 'u')
const REPO = at('', 'repo')

/** One in-memory tree: absolute directory paths to their entries, and files to their text. */
interface Tree {
  readonly dirs: Readonly<Record<string, readonly string[]>>
  readonly files: Readonly<Record<string, string>>
}

/**
 * Build the injected readers over one in-memory tree.
 * @param tree - directories and files.
 * @returns the two readers plus the paths each was asked for.
 */
function readers(tree: Tree): {
  readonly asked: string[]
  readonly readdir: (path: string) => Promise<readonly { readonly name: string; readonly isDirectory: () => boolean }[]>
  readonly readFile: (path: string) => Promise<string>
} {
  const asked: string[] = []
  return {
    asked,
    readdir: async (path) => {
      asked.push(`dir:${path}`)
      const entries = tree.dirs[path]
      if (entries === undefined) throw Object.assign(new Error(`ENOENT ${path}`), { code: 'ENOENT' })
      return entries.map(name => ({ name, isDirectory: () => true }))
    },
    readFile: async (path) => {
      asked.push(`file:${path}`)
      const text = tree.files[path]
      if (text === undefined) throw Object.assign(new Error(`ENOENT ${path}`), { code: 'ENOENT' })
      return text
    },
  }
}

/** One skill file with the frontmatter a real user writes. */
const CHECKLIST = `---
name: checklist
description: Walk a checklist before shipping.
when-to-use: When a release is about to go out.
user-invocable: false
---

# Checklist

Run it.
`

/** Where a user keeps their own skills, and where a workspace keeps its own. */
const USER_AGENTS = at(HOME, '.agents', 'skills')
const USER_DSH = at(HOME, '.dsh', 'skills')
const REPO_AGENTS = at(REPO, '.agents', 'skills')
const REPO_DSH = at(REPO, '.dsh', 'skills')

describe('local skill provider', () => {
  it('reads the user root the app stopped reaching', async () => {
    const tree: Tree = {
      dirs: { [USER_AGENTS]: ['checklist'], [USER_DSH]: [] },
      files: { [at(USER_AGENTS, 'checklist', 'SKILL.md')]: CHECKLIST },
    }
    const { readdir, readFile } = readers(tree)
    const provider = createWorkbenchLocalSkillProvider({ home: HOME, warn: vi.fn(), readdir, readFile })

    await expect(provider.list({})).resolves.toEqual([
      {
        path: at(USER_AGENTS, 'checklist', 'SKILL.md'),
        name: 'checklist',
        description: 'Walk a checklist before shipping.',
        whenToUse: 'When a release is about to go out.',
        invocation: { modelInvocable: true, userInvocable: false },
        source: 'user-agents',
        provider: WORKBENCH_LOCAL_SKILL_PROVIDER,
        resourceBase: { kind: 'directory', path: at(USER_AGENTS, 'checklist') },
        rank: 500,
        locator: { path: at(USER_AGENTS, 'checklist', 'SKILL.md') },
      },
    ])
  })

  it('puts project roots ahead of user roots so a workspace copy wins', async () => {
    const tree: Tree = {
      dirs: { [REPO_DSH]: [], [REPO_AGENTS]: ['checklist'], [USER_DSH]: ['notes'], [USER_AGENTS]: ['checklist'] },
      files: {
        [at(REPO_AGENTS, 'checklist', 'SKILL.md')]: CHECKLIST,
        [at(USER_DSH, 'notes', 'SKILL.md')]: '---\nname: notes\ndescription: Keep notes.\n---\nbody\n',
        [at(USER_AGENTS, 'checklist', 'SKILL.md')]: CHECKLIST,
      },
    }
    const { readdir, readFile } = readers(tree)
    const provider = createWorkbenchLocalSkillProvider({ home: HOME, warn: vi.fn(), readdir, readFile })

    const names = (await provider.list({ cwd: REPO })).map(candidate => `${candidate.name}:${candidate.rank}`)
    expect(names).toEqual(['checklist:200', 'notes:400', 'checklist:500'])
  })

  it('costs only itself when one root cannot be read, and says so once', async () => {
    const tree: Tree = {
      dirs: { [USER_DSH]: [], [USER_AGENTS]: ['checklist'] },
      files: { [at(USER_AGENTS, 'checklist', 'SKILL.md')]: CHECKLIST },
    }
    const { readdir, readFile } = readers(tree)
    const warn = vi.fn()
    const provider = createWorkbenchLocalSkillProvider({
      home: HOME,
      warn,
      readdir: async (path) => {
        // A directory that exists but cannot be listed: the packaged desktop's asar case.
        if (path === USER_DSH) throw Object.assign(new Error('cannot list'), { code: 'EPERM' })
        return await readdir(path)
      },
      readFile,
    })

    await expect(provider.list({})).resolves.toHaveLength(1)
    expect(warn).toHaveBeenCalledWith(`workbench local skills: cannot list ${USER_DSH}: cannot list`)
  })

  it('stays quiet about a root that is simply absent', async () => {
    const { readdir, readFile } = readers({ dirs: {}, files: {} })
    const warn = vi.fn()
    const provider = createWorkbenchLocalSkillProvider({ home: HOME, warn, readdir, readFile })

    await expect(provider.list({})).resolves.toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })

  it('skips a bundle without frontmatter or without a description', async () => {
    const tree: Tree = {
      dirs: { [USER_AGENTS]: ['bare', 'nodesc', 'empty'] },
      files: {
        [at(USER_AGENTS, 'bare', 'SKILL.md')]: '# Just prose\n',
        [at(USER_AGENTS, 'nodesc', 'SKILL.md')]: '---\nname: nodesc\ndescription:\n---\nbody\n',
        [at(USER_AGENTS, 'empty', 'SKILL.md')]: '---\nname: empty\ndescription: Fine.\n---\n',
      },
    }
    const { readdir, readFile } = readers(tree)
    const provider = createWorkbenchLocalSkillProvider({ home: HOME, warn: vi.fn(), readdir, readFile })

    await expect(provider.list({})).resolves.toMatchObject([{ name: 'empty' }])
  })

  it('prefers the declared name, and falls back to the directory name', async () => {
    const tree: Tree = {
      dirs: { [USER_AGENTS]: ['dir-name', 'Not_A_Name'] },
      files: {
        [at(USER_AGENTS, 'dir-name', 'SKILL.md')]: '---\nname: declared\ndescription: Fine.\n---\nbody\n',
        [at(USER_AGENTS, 'Not_A_Name', 'SKILL.md')]: '---\nname: Also_Not_\ndescription: Fine.\n---\nbody\n',
      },
    }
    const { readdir, readFile } = readers(tree)
    const provider = createWorkbenchLocalSkillProvider({ home: HOME, warn: vi.fn(), readdir, readFile })

    // The second bundle's directory name cannot be a skill name either, so it is not offered.
    await expect(provider.list({})).resolves.toMatchObject([{ name: 'declared' }])
  })

  it('folds a block description and keeps the body after the frontmatter', async () => {
    const tree: Tree = {
      dirs: { [USER_AGENTS]: ['long'] },
      files: {
        [at(USER_AGENTS, 'long', 'SKILL.md')]: [
          '---',
          'name: long',
          'description: >',
          '  A description that a user',
          '  wrapped across lines.',
          'disable-model-invocation: true',
          '---',
          '',
          '# Long',
          '',
          'Step one.',
          '',
        ].join('\n'),
      },
    }
    const { readdir, readFile } = readers(tree)
    const provider = createWorkbenchLocalSkillProvider({ home: HOME, warn: vi.fn(), readdir, readFile })

    const [candidate] = await provider.list({})
    expect(candidate?.description).toBe('A description that a user wrapped across lines.')
    expect(candidate?.invocation).toEqual({ modelInvocable: false, userInvocable: true })
    const loaded = await provider.get(candidate!, {})
    expect(loaded?.content).toBe('# Long\n\nStep one.\n')
  })

  it('loads a listed skill from its own file, and reports one that vanished', async () => {
    const tree: Tree = {
      dirs: { [USER_AGENTS]: ['checklist'] },
      files: { [at(USER_AGENTS, 'checklist', 'SKILL.md')]: CHECKLIST },
    }
    const { readdir, readFile } = readers(tree)
    const provider = createWorkbenchLocalSkillProvider({ home: HOME, warn: vi.fn(), readdir, readFile })

    const [candidate] = await provider.list({})
    await expect(provider.get(candidate!, {})).resolves.toMatchObject({
      name: 'checklist',
      content: '# Checklist\n\nRun it.\n',
      resourceBase: { kind: 'directory', path: at(USER_AGENTS, 'checklist') },
    })
    const moved = { ...candidate!, locator: { path: at('', 'gone', 'SKILL.md') } }
    await expect(provider.get(moved, {})).resolves.toBeUndefined()
  })

  it('stops reading when the caller aborts', async () => {
    const { readdir, readFile } = readers({ dirs: { [USER_DSH]: [] }, files: {} })
    const provider = createWorkbenchLocalSkillProvider({ home: HOME, warn: vi.fn(), readdir, readFile })
    const controller = new AbortController()
    controller.abort()

    await expect(provider.list({ signal: controller.signal })).rejects.toThrow()
  })
})
