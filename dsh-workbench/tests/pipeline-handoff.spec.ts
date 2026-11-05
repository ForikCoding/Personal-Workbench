/** The notes a chain's steps leave for each other, and finding them again. */

import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  WORKBENCH_HANDOFF_DIR,
  handoffDirectoryName,
  handoffPathFor,
  readHandoffNotes,
  writeHandoffNote,
} from '../src/pipeline-handoff.ts'

let workspace = ''

beforeEach(async () => {
  workspace = await mkdtemp(join(tmpdir(), 'wb-handoff-'))
})

afterEach(async () => {
  await rm(workspace, { recursive: true, force: true })
})

describe('handoffDirectoryName', () => {
  it('keeps an ordinary pipeline id', () => {
    expect(handoffDirectoryName('pipeline-1')).toBe('pipeline-1')
  })

  it('replaces anything that would leave the pipeline folder', () => {
    expect(handoffDirectoryName('../../etc')).toBe('.._.._etc')
    expect(handoffDirectoryName('a/b')).toBe('a_b')
    expect(handoffDirectoryName('a b')).toBe('a_b')
  })

  it('never answers with a path step', () => {
    expect(handoffDirectoryName('..')).toBe('_')
    expect(handoffDirectoryName('.')).toBe('_')
    expect(handoffDirectoryName('')).toBe('_')
  })
})

describe('handoffPathFor', () => {
  it('puts one note per pipeline and step under the workspace', () => {
    const path = handoffPathFor(workspace, { pipelineId: 'pipeline-3', step: 2 })
    expect(path).toBe(join(workspace, WORKBENCH_HANDOFF_DIR, 'pipeline-3', '2.md'))
  })
})

describe('writeHandoffNote', () => {
  it('writes the note where the next step reads it', async () => {
    const path = await writeHandoffNote(workspace, { pipelineId: 'pipeline-1', step: 0 }, 'I found three commits.')
    expect(path).toBe(handoffPathFor(workspace, { pipelineId: 'pipeline-1', step: 0 }))
    expect(await readFile(path as string, 'utf8')).toBe('I found three commits.')
  })

  it('writes nothing for a step that left nothing worth reading', async () => {
    expect(await writeHandoffNote(workspace, { pipelineId: 'pipeline-1', step: 0 }, '   \n ')).toBeUndefined()
    expect(await readHandoffNotes(workspace, { pipelineId: 'pipeline-1', step: 1 })).toBeUndefined()
  })

  it('replaces the note a previous run left', async () => {
    await writeHandoffNote(workspace, { pipelineId: 'pipeline-1', step: 0 }, 'the old account')
    await writeHandoffNote(workspace, { pipelineId: 'pipeline-1', step: 0 }, 'the new account')
    const notes = await readHandoffNotes(workspace, { pipelineId: 'pipeline-1', step: 1 })
    expect(notes).toContain('the new account')
    expect(notes).not.toContain('the old account')
  })
})

describe('readHandoffNotes', () => {
  it('reads nothing for the first step', async () => {
    expect(await readHandoffNotes(workspace, { pipelineId: 'pipeline-1', step: 0 })).toBeUndefined()
  })

  it('reads the earlier notes in the order the steps ran', async () => {
    await writeHandoffNote(workspace, { pipelineId: 'pipeline-1', step: 0 }, 'first')
    await writeHandoffNote(workspace, { pipelineId: 'pipeline-1', step: 1 }, 'second')
    const notes = await readHandoffNotes(workspace, { pipelineId: 'pipeline-1', step: 2 })
    expect(notes).toBe('## Step 1\n\nfirst\n\n## Step 2\n\nsecond')
  })

  it('skips a step that left no note and keeps the ones that did', async () => {
    await writeHandoffNote(workspace, { pipelineId: 'pipeline-1', step: 0 }, 'first')
    await writeHandoffNote(workspace, { pipelineId: 'pipeline-1', step: 2 }, 'third')
    const notes = await readHandoffNotes(workspace, { pipelineId: 'pipeline-1', step: 3 })
    expect(notes).toBe('## Step 1\n\nfirst\n\n## Step 3\n\nthird')
  })

  it('ignores notes belonging to another pipeline', async () => {
    await writeHandoffNote(workspace, { pipelineId: 'pipeline-1', step: 0 }, 'mine')
    await writeHandoffNote(workspace, { pipelineId: 'pipeline-2', step: 0 }, 'theirs')
    const notes = await readHandoffNotes(workspace, { pipelineId: 'pipeline-1', step: 1 })
    expect(notes).toContain('mine')
    expect(notes).not.toContain('theirs')
  })

  it('ignores a note written for a step after this one', async () => {
    await writeHandoffNote(workspace, { pipelineId: 'pipeline-1', step: 3 }, 'later')
    expect(await readHandoffNotes(workspace, { pipelineId: 'pipeline-1', step: 1 })).toBeUndefined()
  })

  it('treats an unreadable note as absent rather than failing', async () => {
    // A directory where the note should be: reading it raises, and the run still starts.
    await mkdir(handoffPathFor(workspace, { pipelineId: 'pipeline-1', step: 0 }), { recursive: true })
    expect(await readHandoffNotes(workspace, { pipelineId: 'pipeline-1', step: 1 })).toBeUndefined()
  })

  it('cuts a note that is too long rather than passing all of it on', async () => {
    const path = handoffPathFor(workspace, { pipelineId: 'pipeline-1', step: 0 })
    await mkdir(join(workspace, WORKBENCH_HANDOFF_DIR, 'pipeline-1'), { recursive: true })
    await writeFile(path, 'x'.repeat(12 * 1_024), 'utf8')
    const notes = await readHandoffNotes(workspace, { pipelineId: 'pipeline-1', step: 1 })
    expect(notes).toBeDefined()
    expect((notes as string).length).toBeLessThan(12 * 1_024)
    expect(notes).toContain('[this note was cut to fit]')
  })

  it('does not split a multi-byte character when it cuts', async () => {
    const path = handoffPathFor(workspace, { pipelineId: 'pipeline-1', step: 0 })
    await mkdir(join(workspace, WORKBENCH_HANDOFF_DIR, 'pipeline-1'), { recursive: true })
    // Three bytes each, so a byte budget lands mid-character.
    await writeFile(path, '汉'.repeat(4_000), 'utf8')
    const notes = await readHandoffNotes(workspace, { pipelineId: 'pipeline-1', step: 1 })
    expect(notes).toBeDefined()
    expect((notes as string)).not.toContain('\uFFFD')
  })
})
