/**
 * The notes a pipeline's steps leave for each other on disk.
 *
 * A chain's real hand-off is its conversation: step two continues the session step one
 * ran in, and sees everything. That only holds while the session does. A chain finished
 * yesterday, a session the profile archived, or a single step started on its own all
 * reach a step with no conversation behind it — and a step that then runs blind is a step
 * that quietly answers from nothing.
 *
 * So each step writes one note into its own workspace, named by the pipeline and the
 * position in it, and a step that cannot continue the conversation is handed the notes of
 * the steps before it instead. One file per (pipeline, step), overwritten each run: the
 * note is the step's latest account of itself, not a log.
 *
 * Writing is best effort, always. A note that could not be written costs the fallback, not
 * the run; a step that ran is worth more than the bookkeeping about it.
 * @module dsh-workbench/pipeline-handoff
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { WorkbenchPipelineHandoff } from './skill-card-contract.ts'

/** Directory, relative to the workspace, the notes live under. */
export const WORKBENCH_HANDOFF_DIR = '.workbench/handoff'

/** How much of one note is carried into a prompt. */
export const WORKBENCH_HANDOFF_NOTE_MAX_BYTES = 8 * 1024

/** How much of all the notes together is carried into a prompt. */
export const WORKBENCH_HANDOFF_TOTAL_MAX_BYTES = 24 * 1024

/** How many earlier steps a prompt is told about. */
export const WORKBENCH_HANDOFF_MAX_STEPS = 32

/**
 * Turn a pipeline id into a directory name.
 *
 * The id is the client's, and a client is free to name a pipeline anything, so it cannot
 * be used as a path segment as-is: a slash would write outside the pipeline's own folder
 * and a leading dot would hide it. Everything outside a conservative set becomes `_`,
 * which keeps two different pipelines apart in every case that matters and collapses the
 * ones that would only have differed by a character a filesystem refuses anyway.
 * @param pipelineId - the pipeline's identity.
 * @returns the directory name to use.
 */
export function handoffDirectoryName(pipelineId: string): string {
  const safe = pipelineId.replace(/[^A-Za-z0-9._-]/g, '_')
  // `.` and `..` are path steps, not names.
  return safe === '' || safe === '.' || safe === '..' ? '_' : safe
}

/**
 * Where one step's note lives.
 * @param workspace - the directory the step runs in.
 * @param handoff - which pipeline and which step.
 * @returns the note's absolute path.
 */
export function handoffPathFor(workspace: string, handoff: WorkbenchPipelineHandoff): string {
  return join(workspace, WORKBENCH_HANDOFF_DIR, handoffDirectoryName(handoff.pipelineId), `${String(handoff.step)}.md`)
}

/**
 * Read the notes the earlier steps of one pipeline left.
 *
 * Oldest first, because that is the order the steps ran in and the order they should be
 * read in. Absent files are not an error: a step two of three is normally the first run of
 * anything, and it simply has no notes to read.
 * @param workspace - the directory the step is about to run in.
 * @param handoff - which pipeline and which step is starting.
 * @returns the notes as one document, or undefined when there are none.
 */
export async function readHandoffNotes(workspace: string, handoff: WorkbenchPipelineHandoff): Promise<string | undefined> {
  const sections: string[] = []
  let carried = 0
  const from = Math.max(0, handoff.step - WORKBENCH_HANDOFF_MAX_STEPS)
  for (let step = from; step < handoff.step; step += 1) {
    if (carried >= WORKBENCH_HANDOFF_TOTAL_MAX_BYTES) break
    const text = await readNote(handoffPathFor(workspace, { pipelineId: handoff.pipelineId, step }))
    if (text === undefined) continue
    const room = Math.min(WORKBENCH_HANDOFF_NOTE_MAX_BYTES, WORKBENCH_HANDOFF_TOTAL_MAX_BYTES - carried)
    const clipped = room >= Buffer.byteLength(text, 'utf8') ? text : truncated(text, room)
    sections.push(`## Step ${String(step + 1)}\n\n${clipped}`)
    carried += Buffer.byteLength(clipped, 'utf8')
  }
  return sections.length === 0 ? undefined : sections.join('\n\n')
}

/**
 * Write the note one step leaves behind.
 * @param workspace - the directory the step ran in.
 * @param handoff - which pipeline and which step.
 * @param text - the note itself; blank means nothing worth leaving, so nothing is written.
 * @returns the path written, or undefined when there was nothing to write.
 */
export async function writeHandoffNote(
  workspace: string,
  handoff: WorkbenchPipelineHandoff,
  text: string,
): Promise<string | undefined> {
  if (text.trim() === '') return undefined
  const path = handoffPathFor(workspace, handoff)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, truncated(text, WORKBENCH_HANDOFF_NOTE_MAX_BYTES), 'utf8')
  return path
}

/**
 * Read one note, treating every failure as absence.
 * @param path - the note's path.
 * @returns its text, or undefined when it is not there or cannot be read.
 */
async function readNote(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return undefined
  }
}

/**
 * Cut a note down to a byte budget, on a character boundary.
 * @param text - the text to cut.
 * @param maxBytes - the budget.
 * @returns the text, cut and marked when it did not fit.
 */
function truncated(text: string, maxBytes: number): string {
  if (Buffer.byteLength(text, 'utf8') <= maxBytes) return text
  // A UTF-8 lead byte is never a continuation byte, so walking back to one is what keeps
  // a multi-byte character from being split in half.
  const bytes = Buffer.from(text, 'utf8').subarray(0, maxBytes)
  let end = bytes.length
  while (end > 0 && (bytes[end - 1] ?? 0) >= 0x80 && (bytes[end - 1] ?? 0) < 0xc0) end -= 1
  if (end > 0) end -= 1
  return `${bytes.subarray(0, Math.max(0, end)).toString('utf8')}\n\n[this note was cut to fit]`.trim()
}
