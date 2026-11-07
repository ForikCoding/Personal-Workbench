/**
 * Validation for the two bodies the document route answers with.
 *
 * Kept apart from the binder that requests them: the workbench panel lists the same
 * directories through the card API, and a module whose import graph pulls in React would be
 * a strange thing for a data read to depend on. The route is a process boundary, so what it
 * says is input rather than a typed value, and both callers validate it here.
 * @module dsh-workbench/client/skill-card/files-wire
 */

import type { WorkbenchFileEntry, WorkbenchFilesListing, WorkbenchFilesText } from '../../skill-card-contract.ts'
import { WORKBENCH_SKILL_CARD_API_VERSION } from '../../skill-card-contract.ts'

/**
 * Validate one listing body.
 * @param value - the decoded body.
 * @returns the listing, or undefined when a field is outside the contract.
 */
export function parseListing(value: unknown): WorkbenchFilesListing | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const body = value as { apiVersion?: unknown; kind?: unknown; path?: unknown; entries?: unknown; truncated?: unknown }
  if (body.apiVersion !== WORKBENCH_SKILL_CARD_API_VERSION || body.kind !== 'directory') return undefined
  if (typeof body.path !== 'string' || !Array.isArray(body.entries)) return undefined
  if (typeof body.truncated !== 'boolean') return undefined
  const entries: WorkbenchFileEntry[] = []
  for (const raw of body.entries) {
    if (typeof raw !== 'object' || raw === null) return undefined
    const entry = raw as { name?: unknown; path?: unknown; type?: unknown; size?: unknown }
    if (typeof entry.name !== 'string' || typeof entry.path !== 'string') return undefined
    if (entry.type !== 'directory' && entry.type !== 'file' && entry.type !== 'other') return undefined
    if (entry.size !== undefined && typeof entry.size !== 'number') return undefined
    entries.push({
      name: entry.name,
      path: entry.path,
      type: entry.type,
      ...entry.size === undefined ? {} : { size: entry.size },
    })
  }
  return { path: body.path, entries, truncated: body.truncated }
}

/**
 * Validate one file body.
 * @param value - the decoded body.
 * @returns the file, or undefined when a field is outside the contract.
 */
export function parseText(value: unknown): WorkbenchFilesText | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const body = value as { apiVersion?: unknown; kind?: unknown; path?: unknown; text?: unknown; bytes?: unknown }
  if (body.apiVersion !== WORKBENCH_SKILL_CARD_API_VERSION || body.kind !== 'file') return undefined
  if (typeof body.path !== 'string' || typeof body.text !== 'string') return undefined
  if (typeof body.bytes !== 'number') return undefined
  return { path: body.path, text: body.text, bytes: body.bytes }
}
