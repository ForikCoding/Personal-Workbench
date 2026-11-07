/**
 * Which pipeline the workbench opens.
 *
 * The panel is one mount of the page, and the page is one panel among others: looking at a
 * card and coming back, or reopening the application, unmounts it. A pipeline the user
 * opened is therefore a fact that has to outlive the mount, or the panel opens onto the first
 * stored pipeline every time — which reads as the page forgetting what the user was doing.
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
