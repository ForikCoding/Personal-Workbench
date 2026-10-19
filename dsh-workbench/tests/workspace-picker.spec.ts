/**
 * The directory picker: which source answers, and what every outcome means.
 *
 * The picker is the only way a card can name a directory, so its failure modes decide what
 * a user can do at all. These cases pin the platform choice, cancellation, and the promise
 * that an absent desktop route degrades to "no picker" instead of throwing into the page.
 */

import { describe, expect, it } from 'vitest'
import {
  createWorkspacePicker,
  readDesktopPicker,
} from '../src/client/skill-card/workspace-picker.ts'
import type { WorkbenchWorkspacePickerSources } from '../src/client/skill-card/workspace-picker.ts'

/** The path a source answers with unless the case scripts something else. */
const PICKED = 'D:\\Git\\Personal-Workbench'

/**
 * Build a picker over fixed sources.
 * @param sources - the sources the picker reads.
 * @returns the picker.
 */
function picker(sources: WorkbenchWorkspacePickerSources) {
  return createWorkspacePicker(() => sources)
}

describe('choosing a picker', () => {
  it('prefers the Desktop window seam, which is Windows-only', async () => {
    // On Windows both sources can exist. The desktop route is the one the app's own browse
    // panel opens, so reaching for `pickDirectory()` there would take a second native path
    // for the same question.
    const asked: string[] = []
    const window = {
      __DSH_DESKTOP_PICK_DIRECTORY__: async (): Promise<string | null> => {
        asked.push('desktop')
        return PICKED
      },
    }
    // `native` is optional, so under exactOptionalPropertyTypes it must be absent rather
    // than explicitly undefined when this page published no desktop picker.
    const native = readDesktopPicker(window)
    const subject = picker({
      ...native === undefined ? {} : { native },
      workspace: async () => {
        asked.push('workspace')
        return '/repo'
      },
    })
    await expect(subject.pick()).resolves.toEqual({ status: 'picked', path: PICKED })
    expect(asked).toEqual(['desktop'])
  })

  it('falls back to the workspace UI everywhere else', async () => {
    // macOS, Linux, and the plain web composition publish no window seam, so the workspace
    // UI's own picker is the one that answers. A member that is not a function is not a
    // seam either: an older or partially loaded plugin must not look like a picker.
    expect(readDesktopPicker({})).toBeUndefined()
    expect(readDesktopPicker({ __DSH_DESKTOP_PICK_DIRECTORY__: 'not a function' })).toBeUndefined()
    const subject = picker({ workspace: async () => '/home/user/project' })
    expect(subject.available()).toBe(true)
    await expect(subject.pick()).resolves.toEqual({ status: 'picked', path: '/home/user/project' })
  })

  it('reports no picker at all as unavailable, without throwing', async () => {
    // A composition with neither source has no way to name a directory. That is a state the
    // page states, not a failure it throws: the button is disabled and the field says why.
    const subject = picker({})
    expect(subject.available()).toBe(false)
    await expect(subject.pick()).resolves.toMatchObject({ status: 'unavailable' })
  })

  it('degrades a refused desktop route instead of letting it escape', async () => {
    // The route is desktop-only, and an older desktop build does not serve it: the fetch
    // throws. That has to read as "no picker here", not as a page that crashed.
    const subject = picker({
      native: async () => { throw new Error('DSH Desktop could not open the system folder picker') },
    })
    expect(subject.available()).toBe(true)
    await expect(subject.pick()).resolves.toEqual({
      status: 'unavailable',
      reason: 'DSH Desktop could not open the system folder picker',
    })
  })

  it('reads a cancelled chooser as cancelled, not as an error', async () => {
    // Closing the chooser is an answer. The stored path must stay exactly as it was, which is
    // why this is its own status rather than a rejection or an empty path.
    const subject = picker({ native: async () => null })
    await expect(subject.pick()).resolves.toEqual({ status: 'cancelled' })
  })

  it('refuses a path that is not an absolute one', async () => {
    // A picker that answers with a relative path names a different directory to whoever
    // resolves it. Refusing here keeps it out of storage entirely, instead of writing it and
    // reading a storage failure for the picker's mistake.
    const subject = picker({ native: async () => 'relative/dir' })
    await expect(subject.pick()).resolves.toMatchObject({ status: 'unavailable' })
  })

  it('reads the sources fresh on each call, because they arrive as plugins load', async () => {
    // The workspace UI is injected scoped and can land after the page was built. A picker
    // that captured its sources would stay unavailable forever.
    const sources: { workspace?: () => Promise<string | null> } = {}
    const subject = createWorkspacePicker(() => sources)
    expect(subject.available()).toBe(false)
    sources.workspace = async () => '/repo'
    expect(subject.available()).toBe(true)
    await expect(subject.pick()).resolves.toEqual({ status: 'picked', path: '/repo' })
  })
})
