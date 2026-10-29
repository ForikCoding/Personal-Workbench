/**
 * The documents a card wrote, as the card's own template script reads them.
 *
 * A page has no filesystem, so a card that wants to list and open the files a run produced
 * asks the Host. This module is that one read: list a directory, read a text file, both
 * confined to the card's own workspace directory and bounded in size and entry count.
 *
 * Every failure is a {@link WorkbenchFileError} carrying a code the route reports and the
 * client renders, because a card has to show "this directory is not inside the card's
 * folder" beside the list it could not draw rather than replacing itself with an error.
 * @module dsh-workbench/skill-card-files
 */

import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { isAbsolute, join, resolve, sep } from 'node:path'
import {
  WORKBENCH_FILES_MAX_BYTES,
  WORKBENCH_FILES_MAX_ENTRIES,
} from './skill-card-contract.ts'
import type {
  WorkbenchFileEntry,
  WorkbenchFileErrorCode,
  WorkbenchFilesListing,
  WorkbenchFilesText,
} from './skill-card-contract.ts'

/** Why one document read was refused, in the route's own vocabulary. */
export class WorkbenchFileError extends Error {
  /**
   * @param code - the code the route reports and the client renders.
   * @param message - an operator-facing reason; never echoes the request path.
   */
  constructor(
    readonly code: WorkbenchFileErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'WorkbenchFileError'
  }
}

/** What the document service reads from its owner. */
export interface WorkbenchFilesOptions {
  /**
   * The stored workspace directory of one card.
   * @param cardId - the card.
   * @returns its absolute directory path, or undefined when it has none.
   */
  readonly workspaceOf: (cardId: string) => string | undefined
}

/** One path resolved to where it really is, and whether the request named it relatively. */
interface LocatedPath {
  /** The resolved absolute path, symlinks followed. */
  readonly absolute: string
  /** The card's own directory, resolved the same way. */
  readonly root: string
  /** Whether the request named the path relatively, which decides how entries are named. */
  readonly relative: boolean
}

/**
 * List one directory inside a card's workspace.
 * @param options - the workspace lookup.
 * @param cardId - the card whose documents are being read.
 * @param requested - directory path relative to the workspace, absolute, or empty for the workspace itself.
 * @returns its direct entries, directories first.
 * @throws {WorkbenchFileError} when the path is outside the workspace or is not a directory.
 */
export async function listCardDirectory(
  options: WorkbenchFilesOptions,
  cardId: string,
  requested: string,
): Promise<WorkbenchFilesListing> {
  const located = await locate(options, cardId, requested)
  const found = await stat(located.absolute).catch(() => undefined)
  if (found === undefined) throw new WorkbenchFileError('not-found', 'the directory is not there')
  if (!found.isDirectory()) throw new WorkbenchFileError('not-directory', 'the path is not a directory')

  const dirents = await readdir(located.absolute, { withFileTypes: true }).catch(() => undefined)
  if (dirents === undefined) throw new WorkbenchFileError('not-directory', 'the directory cannot be read')

  const entries: WorkbenchFileEntry[] = []
  for (const dirent of dirents) {
    const type = dirent.isDirectory() ? 'directory' : dirent.isFile() ? 'file' : 'other'
    const name = dirent.name
    // A size is a stat per file, which is why it is read last and allowed to fail: a card
    // that cannot state a size still lists the file.
    const size = type === 'file'
      ? await stat(join(located.absolute, name)).then(found => found.size).catch(() => undefined)
      : undefined
    entries.push({
      name,
      path: joinRequested(requested, name, isAbsolute(requested)),
      type,
      ...size === undefined ? {} : { size },
    })
  }
  entries.sort(compareEntries)
  const truncated = entries.length > WORKBENCH_FILES_MAX_ENTRIES
  return {
    path: requested,
    entries: truncated ? entries.slice(0, WORKBENCH_FILES_MAX_ENTRIES) : entries,
    truncated,
  }
}

/**
 * Read one text file inside a card's workspace.
 * @param options - the workspace lookup.
 * @param cardId - the card whose documents are being read.
 * @param requested - file path relative to the workspace, or absolute.
 * @returns its decoded text and size.
 * @throws {WorkbenchFileError} when the path is outside the workspace, is not a regular
 * file, is too large, or does not hold text.
 */
export async function readCardFile(
  options: WorkbenchFilesOptions,
  cardId: string,
  requested: string,
): Promise<WorkbenchFilesText> {
  if (requested.trim() === '') {
    throw new WorkbenchFileError('invalid-request', 'a file read has to name a file')
  }
  const located = await locate(options, cardId, requested)
  const found = await stat(located.absolute).catch(() => undefined)
  if (found === undefined) throw new WorkbenchFileError('not-found', 'the file is not there')
  if (!found.isFile()) throw new WorkbenchFileError('not-file', 'the path is not a regular file')
  // Refused from the size the directory already stated, so a large file is not read first
  // and rejected afterwards.
  if (found.size > WORKBENCH_FILES_MAX_BYTES) {
    throw new WorkbenchFileError('too-large', 'the file is above the read limit')
  }
  const buffer = await readFile(located.absolute).catch(() => undefined)
  if (buffer === undefined) throw new WorkbenchFileError('not-found', 'the file cannot be read')
  if (buffer.byteLength > WORKBENCH_FILES_MAX_BYTES) {
    throw new WorkbenchFileError('too-large', 'the file is above the read limit')
  }
  const text = decodeText(buffer)
  return { path: requested, text, bytes: buffer.byteLength }
}

/**
 * Decode one buffer as UTF-8 text, refusing a binary.
 *
 * Two independent tests, because neither covers the other: a NUL byte is what a binary file
 * almost always carries, and a strict decoder refuses bytes that are not UTF-8 at all.
 * @param buffer - the file's bytes.
 * @returns the decoded text.
 * @throws {WorkbenchFileError} when the buffer is not text.
 */
function decodeText(buffer: Buffer): string {
  if (buffer.includes(0)) throw new WorkbenchFileError('not-text', 'the file holds binary content')
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    throw new WorkbenchFileError('not-text', 'the file is not UTF-8 text')
  }
}

/**
 * Resolve one requested path and confirm it stays inside the card's workspace.
 *
 * Confinement is decided on the resolved path, after symlinks are followed: that is the only
 * form in which a path cannot escape by naming a link that points out of the directory.
 * @param options - the workspace lookup.
 * @param cardId - the card whose workspace fences the read.
 * @param requested - the requested path.
 * @returns the resolved path, its root, and which form the request used.
 * @throws {WorkbenchFileError} when the card has no workspace, the path is not there, or it
 * resolves outside the workspace.
 */
async function locate(options: WorkbenchFilesOptions, cardId: string, requested: string): Promise<LocatedPath> {
  const workspace = options.workspaceOf(cardId)
  if (workspace === undefined) {
    throw new WorkbenchFileError('no-workspace', 'the card has no workspace directory')
  }
  const root = await realpath(workspace).catch(() => undefined)
  if (root === undefined) {
    throw new WorkbenchFileError('no-workspace', 'the workspace directory is not there')
  }
  const relative = !isAbsolute(requested)
  const candidate = relative ? resolve(root, requested) : requested
  const absolute = await realpath(candidate).catch(() => undefined)
  if (absolute === undefined) throw new WorkbenchFileError('not-found', 'the path is not there')
  if (!isInside(root, absolute)) {
    throw new WorkbenchFileError('outside-workspace', 'the path is outside the workspace directory')
  }
  return { absolute, root, relative }
}

/**
 * Whether one resolved path lies inside one resolved directory.
 *
 * The trailing separator is what keeps `/a/bc` from reading as inside `/a/b`; the case
 * folding is what keeps a Windows path from reading as outside because of its volume's case.
 * @param root - the resolved directory.
 * @param target - the resolved path.
 * @returns whether the path is the directory itself or below it.
 */
function isInside(root: string, target: string): boolean {
  const fold = (value: string): string => (process.platform === 'win32' ? value.toLowerCase() : value)
  const base = fold(root).replace(/[\\/]+$/, '')
  const probe = fold(target)
  if (probe === base) return true
  return probe.startsWith(base + sep) || probe.startsWith(`${base}/`)
}

/**
 * Name one entry the way the request named its directory.
 *
 * A listing asked for relatively answers with relative entry paths, because the script that
 * asked will pass one straight back to `read`: an absolute path answered to a relative
 * question would travel the card's filesystem into the document for no gain.
 * @param requested - the directory the request named.
 * @param name - the entry's base name.
 * @param absoluteRequest - whether the request named the directory absolutely.
 * @returns the entry's path, in the request's own form.
 */
function joinRequested(requested: string, name: string, absoluteRequest: boolean): string {
  if (absoluteRequest) return join(requested, name)
  const base = requested.replace(/[\\/]+$/, '')
  return base === '' ? name : `${base}/${name}`
}

/**
 * Order a listing: directories first, then by name.
 *
 * The order a reader needs, and the one the wire cannot carry: a listing states no
 * modification time, so name is the only field left to sort by within each kind.
 * @param left - one entry.
 * @param right - the other entry.
 * @returns the comparator's answer.
 */
function compareEntries(left: WorkbenchFileEntry, right: WorkbenchFileEntry): number {
  const leftDirectory = left.type === 'directory' ? 0 : 1
  const rightDirectory = right.type === 'directory' ? 0 : 1
  if (leftDirectory !== rightDirectory) return leftDirectory - rightDirectory
  return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
}
