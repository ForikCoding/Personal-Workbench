/**
 * The document read behind a card's own script.
 *
 * These cases run against a real directory rather than a double: the whole point of the
 * service is that a path which escapes the card's workspace is refused, and a double would
 * only answer about the paths the spec already thought of.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { WorkbenchFileError, listCardDirectory, readCardFile } from '../src/skill-card-files.ts'
import { WORKBENCH_FILES_MAX_BYTES, WORKBENCH_FILES_MAX_ENTRIES } from '../src/skill-card-contract.ts'

/** The card the spec's workspace belongs to. */
const CARD = 'card-under-test'

describe('workbench card documents', () => {
  /** The case's own root, so a sibling directory can be a target for the escape cases. */
  let root = ''

  /** The card's workspace: one temp directory per case. */
  let workspace = ''

  /** A directory outside it, which every escape case aims at. */
  let outside = ''

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'dsh-wb-'))
    workspace = join(root, 'ws')
    outside = join(root, 'out')
    await mkdir(join(workspace, '任务分析', '子目录'), { recursive: true })
    await mkdir(outside, { recursive: true })
    await writeFile(join(workspace, '任务分析', 'a.md'), '# A\n', 'utf8')
    await writeFile(join(workspace, '任务分析', 'b.txt'), 'B', 'utf8')
    await writeFile(join(workspace, 'top.md'), 'top', 'utf8')
    await writeFile(join(outside, 'secret.md'), 'secret', 'utf8')
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  /**
   * The workspace lookup the service reads.
   * @param path - the directory it answers with; `null` is a card that has none, which is a
   * distinct case from "use the default".
   * @returns the lookup.
   */
  function options(path: string | null = workspace): { workspaceOf: () => string | undefined } {
    return { workspaceOf: () => path ?? undefined }
  }

  /**
   * Run one read that is expected to fail.
   * @param work - the call to make.
   * @returns the failure's code.
   */
  async function codeOf(work: Promise<unknown>): Promise<string> {
    try {
      await work
    } catch (error) {
      if (error instanceof WorkbenchFileError) return error.code
      throw error
    }
    throw new Error('the read was expected to be refused')
  }

  describe('listing', () => {
    it('lists the workspace itself when the request names no path', async () => {
      const listing = await listCardDirectory(options(), CARD, '')
      expect(listing.path).toBe('')
      expect(listing.entries.map(entry => entry.name)).toEqual(['任务分析', 'top.md'])
      expect(listing.truncated).toBe(false)
    })

    it('puts directories first, then names in numeric order', async () => {
      await writeFile(join(workspace, '10.md'), '', 'utf8')
      await writeFile(join(workspace, '2.md'), '', 'utf8')
      const listing = await listCardDirectory(options(), CARD, '')
      expect(listing.entries.map(entry => entry.name)).toEqual(['任务分析', '2.md', '10.md', 'top.md'])
    })

    it('names each entry the way the request named its directory', async () => {
      // A script passes an entry's own path straight back to `read`, so a listing asked for
      // relatively must answer relatively: an absolute path would be a different question.
      const listing = await listCardDirectory(options(), CARD, '任务分析')
      expect(listing.entries.map(entry => entry.path)).toEqual([
        '任务分析/子目录',
        '任务分析/a.md',
        '任务分析/b.txt',
      ])
    })

    it('states a size for a file and no size for a directory', async () => {
      const listing = await listCardDirectory(options(), CARD, '任务分析')
      const file = listing.entries.find(entry => entry.name === 'a.md')
      const directory = listing.entries.find(entry => entry.name === '子目录')
      expect(file?.size).toBe(4)
      expect(file?.type).toBe('file')
      expect(directory?.size).toBeUndefined()
      expect(directory?.type).toBe('directory')
    })

    it('answers an absolute request with absolute entry paths', async () => {
      const listing = await listCardDirectory(options(), CARD, workspace)
      expect(listing.entries.every(entry => entry.path.startsWith(workspace))).toBe(true)
    })

    it('truncates a directory that holds more entries than the limit', async () => {
      const crowded = await mkdtemp(join(tmpdir(), 'dsh-wb-many-'))
      try {
        await Promise.all(Array.from({ length: WORKBENCH_FILES_MAX_ENTRIES + 5 }, (_, index) =>
          writeFile(join(crowded, `f-${String(index).padStart(4, '0')}.md`), '', 'utf8')))
        const listing = await listCardDirectory({ workspaceOf: () => crowded }, CARD, '')
        expect(listing.entries).toHaveLength(WORKBENCH_FILES_MAX_ENTRIES)
        expect(listing.truncated).toBe(true)
      } finally {
        await rm(crowded, { recursive: true, force: true })
      }
    })
  })

  describe('reading', () => {
    it('reads one UTF-8 file and states its size', async () => {
      const file = await readCardFile(options(), CARD, '任务分析/a.md')
      expect(file.text).toBe('# A\n')
      expect(file.bytes).toBe(4)
    })

    it('refuses a path that climbs out of the workspace', async () => {
      expect(await codeOf(readCardFile(options(), CARD, '../out/secret.md'))).toBe('outside-workspace')
      expect(await codeOf(readCardFile(options(), CARD, '任务分析/../../out/secret.md'))).toBe('outside-workspace')
    })

    it('refuses an absolute path outside the workspace', async () => {
      expect(await codeOf(readCardFile(options(), CARD, join(outside, 'secret.md')))).toBe('outside-workspace')
    })

    it('refuses a directory link that points out of the workspace', async () => {
      // Confinement is decided on the resolved path, which is the only form a link cannot
      // travel in: the link itself is inside the workspace, and what it names is not.
      const kind = process.platform === 'win32' ? 'junction' : 'dir'
      await symlink(outside, join(workspace, 'linked'), kind)
      expect(await codeOf(listCardDirectory(options(), CARD, 'linked'))).toBe('outside-workspace')
      expect(await codeOf(readCardFile(options(), CARD, 'linked/secret.md'))).toBe('outside-workspace')
    })

    it('refuses a directory and a missing path', async () => {
      expect(await codeOf(readCardFile(options(), CARD, '任务分析'))).toBe('not-file')
      expect(await codeOf(readCardFile(options(), CARD, 'nope.md'))).toBe('not-found')
    })

    it('refuses an empty path and a card without a workspace', async () => {
      expect(await codeOf(readCardFile(options(), CARD, '  '))).toBe('invalid-request')
      expect(await codeOf(readCardFile(options(null), CARD, 'top.md'))).toBe('no-workspace')
      expect(await codeOf(listCardDirectory(options('/gone/really'), CARD, ''))).toBe('no-workspace')
    })

    it('refuses a binary file', async () => {
      await writeFile(join(workspace, 'binary.bin'), Buffer.from([0x00, 0x01, 0x02]))
      expect(await codeOf(readCardFile(options(), CARD, 'binary.bin'))).toBe('not-text')
    })

    it('refuses bytes that are not UTF-8 at all', async () => {
      await writeFile(join(workspace, 'latin.txt'), Buffer.from([0xff, 0xfe, 0x41]))
      expect(await codeOf(readCardFile(options(), CARD, 'latin.txt'))).toBe('not-text')
    })

    it('refuses a file above the size limit without reading it into the answer', async () => {
      await writeFile(join(workspace, 'big.md'), Buffer.alloc(WORKBENCH_FILES_MAX_BYTES + 1, 0x61))
      expect(await codeOf(readCardFile(options(), CARD, 'big.md'))).toBe('too-large')
    })
  })
})
