/**
 * Which pipeline, and which of its steps, the workbench shows.
 *
 * The panel is one mount of the page, and the page is one panel among others: looking at a
 * card and coming back, or reopening the application, unmounts it. A pipeline the user
 * opened is therefore a fact that has to outlive the mount, or the panel opens onto the first
 * stored pipeline every time — which reads as the page forgetting what the user was doing.
 * The same is true one level down: the step someone has selected is what they were reading,
 * and coming back to another session to find step one selected is the same forgetting.
 *
 * Storage rather than a field on the pipeline, because this is a preference of the person
 * looking at the screen and not part of the pipeline. `localStorage` rather than the
 * session-scoped draft a card keeps, because the pipeline someone works on tomorrow is the
 * same question as the one today. It is one key per origin, so two windows open on two
 * different pipelines keep the one switched to last — a preference, not a lock.
 * @module dsh-workbench/client/pipeline-memory
 */

import type { WorkbenchPipeline } from '../pipeline-contract.ts'

/** Key the open pipeline id is kept under. */
const OPEN_PIPELINE_KEY = 'dsh-workbench:open-pipeline'

/**
 * Read the pipeline id the workbench last opened.
 * @returns the remembered id, or undefined when nothing was kept or storage is unavailable.
 */
export function readOpenPipeline(): string | undefined {
  try {
    const kept = globalThis.localStorage?.getItem(OPEN_PIPELINE_KEY)
    return kept === null || kept === undefined || kept === '' ? undefined : kept
  } catch {
    // Storage can be denied outright; the panel then opens onto its own default, which is
    // still a working panel.
    return undefined
  }
}

/**
 * Keep or clear the pipeline id the workbench opens.
 * @param id - the pipeline the user is looking at; an empty string clears the memory.
 */
export function rememberOpenPipeline(id: string): void {
  try {
    if (id === '') globalThis.localStorage?.removeItem(OPEN_PIPELINE_KEY)
    else globalThis.localStorage?.setItem(OPEN_PIPELINE_KEY, id)
  } catch {
    // As above: forgetting which pipeline was open costs one click, not the pipeline.
  }
}

/**
 * Key the selected step of each pipeline is kept under.
 *
 * One key holding every pipeline's step rather than a key per pipeline: the panel does not
 * know which ids it will be asked about, and a map is what lets a pipeline keep its step
 * while the others are being looked at. The value is the step's index, because the step list
 * itself is the pipeline's, and an index survives a rename — it is the position that moved.
 */
const OPEN_STEP_KEY = 'dsh-workbench:open-step'

/**
 * Read the steps kept for every pipeline, dropping anything unreadable.
 * @returns step index by pipeline id; empty when nothing was kept or storage is unavailable.
 */
function readStepMap(): Record<string, number> {
  try {
    const kept = globalThis.localStorage?.getItem(OPEN_STEP_KEY)
    if (kept === null || kept === undefined || kept === '') return {}
    const parsed: unknown = JSON.parse(kept)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const steps: Record<string, number> = {}
    for (const [id, value] of Object.entries(parsed)) {
      // A step is a position in a list: a negative or fractional value could only come from
      // something else having written this key, and the safe answer to that is no memory.
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0) steps[id] = value
    }
    return steps
  } catch {
    // Denied storage and a corrupt document land in the same place: no memory, still a panel.
    return {}
  }
}

/**
 * Read the step each pipeline was last showing.
 * @returns the kept step by pipeline id; empty when none was kept.
 */
export function readOpenSteps(): Readonly<Record<string, number>> {
  return readStepMap()
}

/**
 * Keep the step one pipeline is showing.
 * @param pipelineId - the pipeline the step belongs to.
 * @param index - the step the panel shows.
 */
export function rememberOpenStep(pipelineId: string, index: number): void {
  try {
    const steps = readStepMap()
    if (steps[pipelineId] === index) return
    globalThis.localStorage?.setItem(OPEN_STEP_KEY, JSON.stringify({ ...steps, [pipelineId]: index }))
  } catch {
    // As above: forgetting which step was open costs one click, not the step.
  }
}

/**
 * Forget the step kept for one pipeline.
 * @param pipelineId - the pipeline that no longer exists.
 */
export function forgetOpenStep(pipelineId: string): void {
  try {
    const steps = readStepMap()
    if (steps[pipelineId] === undefined) return
    const kept: Record<string, number> = {}
    for (const [id, step] of Object.entries(steps)) if (id !== pipelineId) kept[id] = step
    globalThis.localStorage?.setItem(OPEN_STEP_KEY, JSON.stringify(kept))
  } catch {
    // Same trade as remembering it: at worst a deleted pipeline's step is remembered a while.
  }
}

/**
 * Pick the pipeline the panel shows.
 *
 * The remembered id wins while it still names a stored pipeline. Otherwise the pipeline
 * changed most recently is the one the user was working on — order in storage is creation
 * order, which would open the oldest one forever.
 * @param pipelines - the stored pipelines, in storage order.
 * @param remembered - the id the panel last showed.
 * @returns the pipeline to show, or undefined when nothing is stored.
 */
export function pickOpenPipeline(
  pipelines: readonly WorkbenchPipeline[],
  remembered: string | undefined,
): WorkbenchPipeline | undefined {
  if (remembered !== undefined) {
    const found = pipelines.find(pipeline => pipeline.id === remembered)
    if (found !== undefined) return found
  }
  let newest: WorkbenchPipeline | undefined
  for (const pipeline of pipelines) {
    if (newest === undefined || pipeline.updatedAt > newest.updatedAt) newest = pipeline
  }
  return newest
}
