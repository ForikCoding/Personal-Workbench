/**
 * The workspace field: its three states, and the name it shows for a directory.
 *
 * The resolver is the one owner of "can this card run": the configuration field, the run
 * control, and every entry point read this answer. These cases pin the three states and the
 * pure leaf computation, including the two shapes that trip a naive `split` — a drive root
 * and a path written with a trailing separator.
 */

import { describe, expect, it } from 'vitest'
import { PRESENT_DIRECTORY } from './support/fake-skill-card-host.ts'
import { resolveWorkspaceField, workspaceLeaf } from '../src/client/skill-card/workspace.ts'

/** A missing directory: nothing occupies the path. */
const ABSENT = { exists: false, isDirectory: false, writable: false }

/** A file where a directory is expected. */
const A_FILE = { exists: true, isDirectory: false, writable: false }

describe('the workspace leaf', () => {
  it('names the last segment of a Windows path', () => {
    expect(workspaceLeaf('D:\\Git\\Personal-Workbench')).toBe('Personal-Workbench')
    expect(workspaceLeaf('\\\\server\\share\\folder')).toBe('folder')
  })

  it('names the last segment of a POSIX path', () => {
    expect(workspaceLeaf('/home/user/project')).toBe('project')
  })

  it('drops trailing separators, so a path written both ways reads the same', () => {
    // A picked path may arrive with a trailing separator, and `'a/b/'.split('/')` ends on an
    // empty segment: the field would show a blank primary value for a perfectly good
    // directory.
    for (const path of ['D:\\Git\\Personal-Workbench\\', '/home/user/project/', '/home/user/project//']) {
      expect(workspaceLeaf(path)).toBe(path.includes('Personal') ? 'Personal-Workbench' : 'project')
    }
  })

  it('keeps a drive root, which has no last segment', () => {
    // `C:\` trims to `C:`, which on Windows names the process's current directory on that
    // drive rather than the root. The drive with the separator the user picked is what the
    // field has to show.
    expect(workspaceLeaf('C:\\')).toBe('C:\\')
    expect(workspaceLeaf('C:/')).toBe('C:/')
    expect(workspaceLeaf('d:\\')).toBe('d:\\')
  })

  it('falls back to the path itself when it is only separators', () => {
    // The POSIX root, and a UNC prefix with nothing after it: there is no segment to name.
    expect(workspaceLeaf('/')).toBe('/')
    expect(workspaceLeaf('\\\\')).toBe('\\\\')
  })
})

describe('resolving the workspace field', () => {
  it('reports nothing chosen as missing, whatever the check answered', () => {
    // No path and no workspace are the same state: a card created before this field existed
    // cannot run, and no directory is invented for it.
    expect(resolveWorkspaceField(undefined, undefined)).toEqual({ kind: 'missing' })
    expect(resolveWorkspaceField(undefined, PRESENT_DIRECTORY)).toEqual({ kind: 'missing' })
  })

  it('reports a path nobody confirmed as invalid, carrying the full path', () => {
    // The check is asynchronous, so a stored path is unconfirmed for a moment. An
    // unconfirmed directory is one a card may not run in: the safe direction is closed.
    // `checked: false` is what keeps the page from claiming the folder is gone before
    // anything looked at it.
    expect(resolveWorkspaceField({ path: '/repo' }, undefined)).toEqual({
      kind: 'invalid',
      path: '/repo',
      leaf: 'repo',
      checked: false,
    })
  })

  it('reports a path that is gone as invalid, naming the whole path', () => {
    // The message the field and the run control show is derived from this: "the directory is
    // gone" is only actionable when it says which directory.
    expect(resolveWorkspaceField({ path: 'D:\\Git\\Gone\\' }, ABSENT)).toEqual({
      kind: 'invalid',
      path: 'D:\\Git\\Gone\\',
      leaf: 'Gone',
      checked: true,
    })
  })

  it('reports a file where a directory is expected as invalid', () => {
    // Existing is not enough: a run needs a directory to run in.
    expect(resolveWorkspaceField({ path: '/repo/README.md' }, A_FILE)).toMatchObject({ kind: 'invalid', checked: true })
  })

  it('reports a confirmed directory as ready, with its leaf', () => {
    expect(resolveWorkspaceField({ path: '/repo/project' }, PRESENT_DIRECTORY)).toEqual({
      kind: 'ready',
      path: '/repo/project',
      leaf: 'project',
    })
  })

  it('does not gate on writability, because a run does not write into the card’s folder', () => {
    // The read reports it, and the field may show it later, but a read-only directory is a
    // directory a card can run in: its result goes to the workbench's own storage.
    expect(resolveWorkspaceField({ path: '/repo' }, { exists: true, isDirectory: true, writable: false }))
      .toMatchObject({ kind: 'ready' })
  })
})
