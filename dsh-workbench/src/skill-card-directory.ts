/**
 * The one filesystem read this feature performs: whether a directory a card was pointed
 * at is still there.
 *
 * One narrow question rather than a filesystem bridge. The card stores the path the user
 * picked, and a run is gated on that path still naming a directory — which is a fact only
 * the Host can answer. Every answer is a value: a path that cannot be read is reported as
 * "nothing is there" rather than thrown, because a refused run has to be a state the page
 * can show instead of an error boundary.
 * @module dsh-workbench/skill-card-directory
 */

import { constants } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import type { WorkbenchDirectoryStat } from './skill-card-contract.ts'
import { isWorkbenchWorkspacePath } from './skill-card-contract.ts'

/** One directory check, as the runner and the route consume it. */
export type WorkbenchDirectoryProbe = (path: string) => Promise<WorkbenchDirectoryStat>

/**
 * The answer when nothing could be read at that path.
 *
 * Frozen and shared, so every failed check — a missing path, a permission error, a path
 * the contract would not accept — produces the one value that means "a card may not run
 * here": there is no error shape for a caller to interpret differently.
 */
export const NO_DIRECTORY_STAT: WorkbenchDirectoryStat = Object.freeze({
  exists: false,
  isDirectory: false,
  writable: false,
})

/**
 * Read one path's directory state.
 *
 * The validation is the contract's, not a second rule: a value the store would refuse is
 * refused here too, so the route and the store cannot disagree about what a workspace is.
 * Nothing is ever read about the directory's *contents* — existence, kind, and whether an
 * entry could be created are the whole of the question.
 * @param path - absolute directory path, as stored for the card.
 * @returns what is at that path; {@link NO_DIRECTORY_STAT} when nothing readable is.
 */
export async function statDirectory(path: string): Promise<WorkbenchDirectoryStat> {
  if (!isWorkbenchWorkspacePath(path)) return NO_DIRECTORY_STAT
  try {
    const found = await stat(path)
    // `isDirectory` is answered either way: a file where a directory is expected is a
    // different mistake from a missing path, and the client's copy covers both.
    if (!found.isDirectory()) return { exists: true, isDirectory: false, writable: false }
    return { exists: true, isDirectory: true, writable: await isWritable(path) }
  } catch {
    // Any failure — absent, unreadable, a path too long for the platform — is the same
    // answer to the only question asked: this path is not a directory the Host can confirm.
    return NO_DIRECTORY_STAT
  }
}

/**
 * Ask whether an entry could be created in one directory.
 *
 * Advisory only: it is reported beside the two facts that decide validity, because a
 * read-only directory is still a directory a run can start in — the run reads its skill
 * and stores its result elsewhere. A check that fails for any reason reads as not writable.
 * @param path - an existing directory.
 * @returns whether the process could create an entry in it.
 */
async function isWritable(path: string): Promise<boolean> {
  try {
    await access(path, constants.W_OK)
    return true
  } catch {
    return false
  }
}
