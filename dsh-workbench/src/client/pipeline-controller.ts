/**
 * The pipeline definitions the workbench page arranges, and the mutations it offers.
 *
 * The controller owns one snapshot and one revision, and every mutation is expressed as
 * "the complete set I would like to store". That is the route's shape, and it keeps the
 * awkward part of concurrent writes in one place: the revision a write was based on.
 *
 * Mutations are queued rather than fired in parallel. Two edits racing would both build
 * their next set from the same snapshot, so the second would silently undo the first —
 * the queue makes each one see the state the one before it committed.
 * @module dsh-workbench/client/pipeline-controller
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WorkbenchPipeline, WorkbenchPipelineSnapshot, WorkbenchPipelineStep } from '../pipeline-contract.ts'
import { WORKBENCH_PIPELINE_MAX_PIPELINES, WORKBENCH_PIPELINE_NAME_MAX_LENGTH } from '../pipeline-contract.ts'
import type { WorkbenchPipelineApi } from './pipeline-api.ts'

/** What the page knows about the stored pipelines. */
export interface WorkbenchPipelinesState {
  /** Loading until the first read answers. */
  readonly phase: 'loading' | 'ready' | 'unavailable'
  /** Stored pipelines, ordered by id. */
  readonly pipelines: readonly WorkbenchPipeline[]
  /** Why the set is unavailable, for the notice the page shows. */
  readonly reason?: string
  /** Why the last write did not land, for the notice the page shows. */
  readonly notice?: string
}

/** The read/write face the pipeline view drives. */
export interface WorkbenchPipelinesFace extends WorkbenchPipelinesState {
  /**
   * Create a pipeline and return its id.
   * @param name - its starting name, which the user may rename later.
   * @returns the new id, or undefined when the set is full or the write failed.
   */
  create(name: string): Promise<string | undefined>
  /**
   * Rename one pipeline.
   * @param id - pipeline to rename.
   * @param name - the new name; trimmed, and ignored when blank.
   */
  rename(id: string, name: string): Promise<void>
  /**
   * Delete one pipeline.
   * @param id - pipeline to delete.
   */
  remove(id: string): Promise<void>
  /**
   * Replace one pipeline's steps.
   * @param id - pipeline to edit.
   * @param steps - the complete new step list.
   * @returns whether the steps were stored; a conflict stores the Host's set instead.
   */
  setSteps(id: string, steps: readonly WorkbenchPipelineStep[]): Promise<boolean>
  /** Read the stored set again. */
  reload(): void
}

/** Where a user-created pipeline id starts. */
const PIPELINE_ID_BASE = 'pipeline'

/**
 * Choose an unused pipeline id.
 * @param taken - ids already in use.
 * @returns the first free `pipeline-N`.
 */
export function nextPipelineId(taken: ReadonlySet<string>): string {
  let index = 1
  while (taken.has(`${PIPELINE_ID_BASE}-${String(index)}`)) index += 1
  return `${PIPELINE_ID_BASE}-${String(index)}`
}

/**
 * Trim a name and clamp it to the contract's length.
 * @param name - the name as typed.
 * @returns the name as it may be stored; empty when nothing is left.
 */
export function clampPipelineName(name: string): string {
  return name.trim().slice(0, WORKBENCH_PIPELINE_NAME_MAX_LENGTH)
}

/**
 * Read and mutate the stored pipelines.
 * @param api - pipeline transport.
 * @returns the current state plus the mutations.
 */
export function usePipelines(api: WorkbenchPipelineApi): WorkbenchPipelinesFace {
  const [state, setState] = useState<WorkbenchPipelinesState>({ phase: 'loading', pipelines: [] })
  // The mutation queue's tail, and the newest snapshot the queue has seen. Both are refs
  // because a mutation must read what the previous one committed, not what the render
  // that created it captured.
  const tail = useRef<Promise<unknown>>(Promise.resolve())
  const newest = useRef<WorkbenchPipelineSnapshot | undefined>(undefined)
  // A read that lands after a write would republish the older set. Every application of
  // state takes a ticket, and a read only applies while it still holds the newest one.
  const tickets = useRef(0)

  const apply = useCallback((snapshot: WorkbenchPipelineSnapshot, notice?: string) => {
    tickets.current += 1
    newest.current = snapshot
    setState({
      phase: 'ready',
      pipelines: snapshot.pipelines,
      ...notice === undefined ? {} : { notice },
    })
  }, [])

  const reload = useCallback(() => {
    tickets.current += 1
    const mine = tickets.current
    void api.read().then((result) => {
      if (result.status !== 'ok') {
        if (tickets.current !== mine) return
        setState({ phase: 'unavailable', pipelines: [], reason: result.reason })
        return
      }
      if (tickets.current !== mine) return
      apply(result.snapshot)
    })
  }, [api, apply])

  useEffect(() => { reload() }, [reload])

  // One mutation at a time, each building the next set from the newest snapshot. The result
  // says whether the change is what the Host now holds: a caller that shows a step only once
  // it is stored has to be able to tell a landed write from a refused one.
  const mutate = useCallback(async (
    change: (current: readonly WorkbenchPipeline[]) => readonly WorkbenchPipeline[] | undefined,
  ): Promise<boolean> => {
    let written = false
    const task = tail.current.then(async () => {
      // Twice at most: a conflict hands back the state the Host really holds, so the change
      // can be rebuilt against it once. A second conflict is someone else editing too, and
      // then the page reports what is stored instead of insisting.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const snapshot = newest.current
        if (snapshot === undefined) return
        const next = change(snapshot.pipelines)
        if (next === undefined) return
        const result = await api.write({ baseRevision: snapshot.revision, pipelines: next })
        if (result.status === 'failed') {
          setState(current => ({ ...current, notice: result.reason }))
          return
        }
        if (result.status === 'conflict' && attempt === 0) {
          // The truth first, then the same change asked again against it.
          apply(result.snapshot)
          continue
        }
        // A conflict is answered with the state the Host actually holds, so the page shows
        // what is stored rather than what this window wished for.
        apply(result.snapshot, result.status === 'conflict' ? 'conflict' : undefined)
        written = result.status === 'ok'
        return
      }
    })
    tail.current = task.catch(() => undefined)
    await task.catch(() => undefined)
    return written
  }, [api, apply])

  const create = useCallback(async (name: string) => {
    const taken = new Set((newest.current?.pipelines ?? []).map(pipeline => pipeline.id))
    if (taken.size >= WORKBENCH_PIPELINE_MAX_PIPELINES) return undefined
    const id = nextPipelineId(taken)
    const trimmed = clampPipelineName(name)
    await mutate(current => [
      ...current,
      {
        id,
        name: trimmed.length === 0 ? id : trimmed,
        steps: [],
        updatedAt: Date.now(),
      },
    ])
    return id
  }, [mutate])

  const rename = useCallback(async (id: string, name: string) => {
    const trimmed = clampPipelineName(name)
    // A blank rename is a slip, not an instruction: the stored name stays.
    if (trimmed.length === 0) return
    await mutate(current => current.map(pipeline => (
      pipeline.id === id ? { ...pipeline, name: trimmed, updatedAt: Date.now() } : pipeline
    )))
  }, [mutate])

  const remove = useCallback(async (id: string) => {
    await mutate(current => current.filter(pipeline => pipeline.id !== id))
  }, [mutate])

  const setSteps = useCallback(async (id: string, steps: readonly WorkbenchPipelineStep[]): Promise<boolean> => (
    await mutate(current => current.map(pipeline => (
      pipeline.id === id ? { ...pipeline, steps, updatedAt: Date.now() } : pipeline
    )))
  ), [mutate])

  return { ...state, create, rename, remove, setSteps, reload }
}
