/**
 * The executions the workbench knows about, and the append the run engine performs.
 *
 * This is the single source of the 运行记录 the panel draws. It used to be page state, which
 * is why a pipeline that had plainly run showed an empty history after a reload: the records
 * were built, numbered and then kept in a component that was about to unmount. They are
 * stored now, so the first paint of a reopened workbench already knows which run produced
 * what.
 * @module dsh-workbench/client/pipeline-runs
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WorkbenchPipelineRun, WorkbenchPipelineRunDraft } from '../pipeline-contract.ts'
import type { WorkbenchPipelineRunsApi } from './pipeline-runs-api.ts'

/** What the page knows about stored executions. */
export interface WorkbenchPipelineRunsState {
  /** Loading until the first read answers. */
  readonly phase: 'loading' | 'ready' | 'unavailable'
  /** Records by pipeline id, newest first. */
  readonly runs: Readonly<Record<string, readonly WorkbenchPipelineRun[]>>
  /** Why the records are unavailable, when they are. */
  readonly reason: string | undefined
  /** Why the last append did not land. */
  readonly notice: string | undefined
}

/** The face the run engine and the panel drive. */
export interface WorkbenchPipelineRunsFace extends WorkbenchPipelineRunsState {
  /**
   * The executions of one pipeline, newest first.
   * @param pipelineId - the pipeline to read.
   * @returns its records; empty when it has never run.
   */
  of(pipelineId: string): readonly WorkbenchPipelineRun[]
  /**
   * Store one finished execution.
   * @param draft - the execution as the run engine saw it.
   * @returns the numbered record, or undefined when it could not be stored.
   */
  record(draft: WorkbenchPipelineRunDraft): Promise<WorkbenchPipelineRun | undefined>
  /** Read the records again. */
  reload(): void
}

/** What a pipeline with no records answers. */
const EMPTY: readonly WorkbenchPipelineRun[] = []

/**
 * Read, group, and append pipeline executions.
 * @param api - execution-record transport.
 * @returns the current state plus the operations.
 */
export function usePipelineRuns(api: WorkbenchPipelineRunsApi): WorkbenchPipelineRunsFace {
  const [state, setState] = useState<WorkbenchPipelineRunsState>({
    phase: 'loading',
    runs: {},
    reason: undefined,
    notice: undefined,
  })
  // The read in flight, so a reload during one is not a second request.
  const reading = useRef(false)

  const read = useCallback(() => {
    if (reading.current) return
    reading.current = true
    void api.read().then((result) => {
      reading.current = false
      if (result.status === 'unavailable') {
        setState(current => ({ ...current, phase: 'unavailable', reason: result.reason }))
        return
      }
      setState(current => ({ ...current, phase: 'ready', runs: group(result.runs), reason: undefined }))
    })
  }, [api])

  useEffect(() => { read() }, [read])

  const record = useCallback(async (draft: WorkbenchPipelineRunDraft): Promise<WorkbenchPipelineRun | undefined> => {
    const result = await api.append(draft)
    if (result.status === 'failed') {
      // Said out loud rather than swallowed: an execution nobody recorded is the defect this
      // state exists to make visible, and a silent failure would look exactly like it.
      setState(current => ({ ...current, notice: result.reason }))
      return undefined
    }
    setState(current => ({
      ...current,
      notice: undefined,
      runs: { ...current.runs, [result.run.pipelineId]: [result.run, ...(current.runs[result.run.pipelineId] ?? EMPTY)] },
    }))
    return result.run
  }, [api])

  const of = useCallback((pipelineId: string) => state.runs[pipelineId] ?? EMPTY, [state.runs])

  return { ...state, of, record, reload: read }
}

/**
 * Group records by the pipeline they ran, newest first.
 * @param runs - the records as the Host ordered them.
 * @returns one list per pipeline.
 */
function group(runs: readonly WorkbenchPipelineRun[]): Readonly<Record<string, readonly WorkbenchPipelineRun[]>> {
  const grouped: Record<string, WorkbenchPipelineRun[]> = {}
  for (const run of runs) {
    const list = grouped[run.pipelineId]
    if (list === undefined) grouped[run.pipelineId] = [run]
    else list.push(run)
  }
  // The Host already answers newest first; sorting again would only matter if it stopped.
  for (const list of Object.values(grouped)) list.sort((left, right) => (right.startedAt - left.startedAt) || (right.no - left.no))
  return grouped
}
