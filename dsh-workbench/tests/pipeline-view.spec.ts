/**
 * How a step reads, how a whole pipeline stands, and where a run would start.
 *
 * These readings are what the canvas, the title and the run bar are made of, so they are
 * tested apart from React: the failures this guards against are one step finishing and the
 * pipeline claiming it finished too, and a stored record being read as a success just
 * because it exists.
 */

import { describe, expect, it } from 'vitest'
import type { ChainPhase, PipelineStepPhase } from '../src/client/pipeline/pipeline-run.ts'
import type { PipelineRunEntry, PipelineRunStep } from '../src/client/pipeline/pipeline-view.ts'
import type { WorkbenchResultRecord } from '../src/skill-card-contract.ts'
import {
  canStartAt,
  formatBytes,
  phaseOfResult,
  resultDirectory,
  resumeFrom,
  runScopeOf,
  runScopeRows,
  standOf,
} from '../src/client/pipeline/pipeline-view.ts'

/** One recorded step. */
const ran = (phase: PipelineStepPhase): PipelineRunStep => ({ cardId: 'card', phase })

/**
 * One recorded run.
 * @param scope - what the run covered.
 * @param phase - how it ended.
 * @param steps - what it did, in step order.
 * @param only - the step a single run was about.
 * @returns the record.
 */
function entry(
  scope: PipelineRunEntry['scope'],
  phase: ChainPhase,
  steps: readonly PipelineRunStep[],
  only?: number,
): PipelineRunEntry {
  return {
    no: 1,
    startedAt: 1,
    tookMs: 1_000,
    phase,
    scope,
    steps,
    ...only === undefined ? {} : { only },
  }
}

/**
 * One stored result.
 * @param overrides - the fields the case varies.
 * @returns the record.
 */
function record(overrides: Partial<WorkbenchResultRecord> = {}): WorkbenchResultRecord {
  return { runId: 'run-1', skill: 'git-repo', executedAt: 1, stopReason: 'completed', ...overrides }
}

describe('phaseOfResult', () => {
  it('has nothing to say about a card that never ran', () => {
    expect(phaseOfResult(undefined)).toBe('idle')
  })

  it('reads the failure the record states', () => {
    // 真实的那条：429 把运行结束在半路，记录里写着原因、没有区域。它以前被读成「完成」，
    // 因为记录存在本身被当成了产物。
    expect(phaseOfResult(record({
      stopReason: 'error',
      failure: 'the run ended as error: 429 rate limited',
      failureCode: 'run-failed',
    }))).toBe('failed')
  })

  it('lets the verdict win over a region, should a record ever carry both', () => {
    // 记录自己的定义是「为什么没交出可用的结果」，两者同时在就是矛盾，判定这边更安全。
    expect(phaseOfResult(record({ failure: 'stopped', structured: { html: '<p>x</p>' } }))).toBe('failed')
  })

  it('reads a committed region as the proof of a finished run', () => {
    expect(phaseOfResult(record({ structured: { html: '<p>x</p>' } }))).toBe('done')
  })

  it('reads a finished run with an empty region as done, not as a failure', () => {
    // 跑完了、区域是空的，也是一个跑完的步骤：没有产物和没跑完是两件事。
    expect(phaseOfResult(record({ stopReason: 'completed' }))).toBe('done')
  })

  it('reads a record from before the failure field by its stop reason', () => {
    // 2.9.x 之前写的记录没有 failure 字段，超时/被打断只留下结束原因：那是唯一的信号。
    expect(phaseOfResult(record({ stopReason: 'aborted' }))).toBe('failed')
  })
})

describe('standOf', () => {
  it('is idle while nothing has produced anything', () => {
    expect(standOf({ stepCount: 2, doneCount: 0, runs: [] })).toBe('idle')
  })

  it('treats a pipeline with no steps as having nothing to stand on', () => {
    expect(standOf({ stepCount: 0, doneCount: 0, runs: [] })).toBe('idle')
  })

  it('will not call the pipeline done because one step ran alone', () => {
    // The case that started this: one step's own run settled, and the chain covered one
    // step of two, so the pipeline has not run as a whole.
    expect(standOf({
      stepCount: 2,
      doneCount: 1,
      chain: { phase: 'settled', whole: false },
      runs: [entry('single', 'settled', [ran('done')], 0)],
    })).toBe('solo')
  })

  it('is done when the chain covered every step', () => {
    expect(standOf({
      stepCount: 2,
      doneCount: 2,
      chain: { phase: 'settled', whole: true },
      runs: [entry('full', 'settled', [ran('done'), ran('done')])],
    })).toBe('done')
  })

  it('is running as soon as a run is in flight, whole or not', () => {
    expect(standOf({ stepCount: 2, doneCount: 1, chain: { phase: 'running', whole: false }, runs: [] })).toBe('running')
    expect(standOf({ stepCount: 2, doneCount: 1, chain: { phase: 'running', whole: true }, runs: [] })).toBe('running')
  })

  it('keeps a failure of one step from failing the whole pipeline', () => {
    expect(standOf({
      stepCount: 2,
      doneCount: 1,
      chain: { phase: 'failed', whole: false },
      runs: [entry('single', 'failed', [ran('failed')], 0)],
    })).toBe('solo')
  })

  it('takes the outcome of the last whole run when no chain is in this panel', () => {
    const settled = [entry('full', 'settled', [ran('done'), ran('done')])]
    expect(standOf({ stepCount: 2, doneCount: 2, runs: settled })).toBe('done')
    expect(standOf({ stepCount: 2, doneCount: 1, runs: [entry('full', 'failed', [ran('done'), ran('failed')])] })).toBe('failed')
    expect(standOf({ stepCount: 2, doneCount: 1, runs: [entry('full', 'stopped', [ran('done')])] })).toBe('stopped')
  })

  it('says steps hold results, not how they were produced, when no run is left to read', () => {
    // A reopened panel keeps the results and loses the records; claiming "done" would be a
    // guess and claiming "never run" would contradict what the step shows.
    expect(standOf({ stepCount: 3, doneCount: 1, runs: [] })).toBe('kept')
  })

  it('reads a reopened panel the way its products were made', () => {
    // The product kept its provenance even though the panel lost the run, and the pipeline
    // is the only step of it: a run of that step alone is not a run of the pipeline, which
    // is the reading a count of touched steps would get wrong.
    expect(standOf({ stepCount: 1, doneCount: 1, runs: [], scopes: ['single'] })).toBe('solo')
    expect(standOf({ stepCount: 2, doneCount: 1, runs: [], scopes: ['single', undefined] })).toBe('solo')
  })

  it('is done when every product says a whole run made it', () => {
    expect(standOf({ stepCount: 2, doneCount: 2, runs: [], scopes: ['full', 'full'] })).toBe('done')
  })

  it('is failed when the step that failed says it failed inside a whole run', () => {
    expect(standOf({ stepCount: 2, doneCount: 1, failedAt: 1, runs: [], scopes: ['full', 'full'] })).toBe('failed')
  })

  it('is failed even when an older whole run settled, because the step is broken now', () => {
    // 昨天整条成功过一次，今天第二步重跑失败：那条 settled 的记录不能被当成现在的答案，
    // 否则标题会替一个已经坏掉的步骤说「已完成」。
    expect(standOf({
      stepCount: 2,
      doneCount: 1,
      failedAt: 1,
      runs: [entry('full', 'settled', [ran('done'), ran('done')])],
      scopes: ['full', 'full'],
    })).toBe('failed')
  })

  it('does not call a pipeline whose only run failed idle', () => {
    // 失败不是「什么都没发生」：它启动了、没跑完，所以那句话（都还没启动）是假的。
    expect(standOf({ stepCount: 2, doneCount: 0, failedAt: 0, runs: [], scopes: ['full', undefined] })).toBe('failed')
  })

  it('will not call a reopened panel done on a mixture it cannot account for', () => {
    // A step refined after a whole run says "refine": the chain is not known to have
    // finished as one thing, so the panel says what it can see and no more.
    expect(standOf({ stepCount: 2, doneCount: 2, runs: [], scopes: ['full', 'refine'] })).toBe('solo')
  })

  it('counts a review regeneration as something that was not a whole run', () => {
    expect(standOf({
      stepCount: 3,
      doneCount: 1,
      runs: [entry('refine', 'settled', [ran('done')], 1)],
    })).toBe('solo')
  })
})

describe('resumeFrom', () => {
  it('starts at the first step without a result', () => {
    expect(resumeFrom(['done', 'idle', 'idle'])).toBe(1)
    expect(resumeFrom(['idle', 'done', 'idle'])).toBe(0)
  })

  it('starts over when every step holds a result', () => {
    // Running again is the only way to ask for the whole thing twice, so it begins at the
    // first step rather than running nothing.
    expect(resumeFrom(['done', 'done'])).toBe(0)
    expect(resumeFrom([])).toBe(0)
  })

  it('reads only a finished step as finished', () => {
    // Anything else — failed, stopped, queued — has to be run again for the chain to go on.
    expect(resumeFrom(['done', 'failed'])).toBe(1)
    expect(resumeFrom(['stopped', 'done'])).toBe(0)
    expect(resumeFrom(['done', 'queued'])).toBe(1)
  })
})

describe('runScopeOf', () => {
  it('says Run when nothing has produced anything', () => {
    expect(runScopeOf(['idle', 'idle'])).toEqual({ at: 0, word: 'run', allDone: false })
    // An empty chain is a chain nothing has run, not a finished one.
    expect(runScopeOf([])).toEqual({ at: 0, word: 'run', allDone: false })
  })

  it('says Continue from the first step without a result', () => {
    expect(runScopeOf(['done', 'idle', 'idle'])).toEqual({ at: 1, word: 'resume', allDone: false })
  })

  it('says Run from step one when the gap is the first step', () => {
    // The word follows the start, not the fact that something ran: starting at the first
    // step again is Run, even though a step after it holds a result.
    expect(runScopeOf(['idle', 'done'])).toEqual({ at: 0, word: 'run', allDone: false })
  })

  it('says Run again when every step holds a result', () => {
    // The defect this replaces: the button said Run and started at step one, so a finished
    // chain silently re-ran itself with no way to ask for it on purpose.
    expect(runScopeOf(['done', 'done'])).toEqual({ at: 0, word: 'again', allDone: true })
  })
})

describe('canStartAt', () => {
  it('allows a start where every earlier step finished', () => {
    expect(canStartAt(['done', 'done', 'idle'], 2)).toBe(true)
    expect(canStartAt(['done', 'idle'], 1)).toBe(true)
    expect(canStartAt(['idle'], 0)).toBe(true)
  })

  it('refuses a start that would skip an unfinished step', () => {
    // Running from step two with step one unfinished would leave the chain "complete" with
    // its first half missing, and no state says that.
    expect(canStartAt(['idle', 'done'], 1)).toBe(false)
    expect(canStartAt(['done', 'failed', 'done'], 2)).toBe(false)
    // The start step itself may be a step that stopped: it is the one being redone.
    expect(canStartAt(['done', 'stopped'], 1)).toBe(true)
    expect(canStartAt(['stopped', 'done'], 1)).toBe(false)
  })

  it('refuses a start outside the chain', () => {
    expect(canStartAt(['done'], 1)).toBe(false)
    expect(canStartAt([], 0)).toBe(false)
    expect(canStartAt(['done'], -1)).toBe(false)
    expect(canStartAt(['done'], 0.5)).toBe(false)
  })
})

describe('runScopeRows', () => {
  it('offers only the default row before anything has run', () => {
    // Re-running the whole chain and running it are the same act here, so it is named once.
    expect(runScopeRows({ phases: ['idle', 'idle', 'idle'], selected: 0 }))
      .toEqual([{ kind: 'resume', at: 0, first: 1, last: 3, replacing: 0 }])
  })

  it('offers the whole chain again when the start could be earlier', () => {
    expect(runScopeRows({ phases: ['done', 'idle', 'idle'], selected: 2 })).toEqual([
      { kind: 'resume', at: 1, first: 2, last: 3, replacing: 0 },
      { kind: 'all', at: 0, first: 1, last: 3, replacing: 1 },
    ])
  })

  it('offers the selected step when it sits before the resume point', () => {
    // Two finished steps, the third stopped: redoing from step two is a third choice, and
    // one the button cannot express, because the button continues from step three.
    const rows = runScopeRows({ phases: ['done', 'done', 'stopped', 'idle'], selected: 1 })
    expect(rows.map(row => row.kind)).toEqual(['resume', 'all', 'from'])
    expect(rows[2]).toEqual({ kind: 'from', at: 1, first: 2, last: 4, replacing: 1 })
  })

  it('leaves the selected row out where it would be the resume row again', () => {
    // Selected at or after the resume point: the same start under a second name.
    expect(runScopeRows({ phases: ['done', 'idle', 'idle'], selected: 1 }).map(row => row.kind))
      .toEqual(['resume', 'all'])
    expect(runScopeRows({ phases: ['done', 'idle', 'idle'], selected: 2 }).map(row => row.kind))
      .toEqual(['resume', 'all'])
  })

  it('holds one row when the whole chain has run', () => {
    expect(runScopeRows({ phases: ['done', 'done'], selected: 0 }))
      .toEqual([{ kind: 'all', at: 0, first: 1, last: 2, replacing: 2 }])
  })

  it('counts only the steps a row would actually replace', () => {
    // The cost is products replaced, not steps run: a step with no result costs nothing.
    const [, all] = runScopeRows({ phases: ['done', 'idle', 'done'], selected: 2 })
    expect(all).toEqual({ kind: 'all', at: 0, first: 1, last: 3, replacing: 2 })
  })

  it('offers nothing for a pipeline with no steps', () => {
    expect(runScopeRows({ phases: [], selected: 0 })).toEqual([])
  })
})

describe('resultDirectory', () => {
  const template = '<div data-dsh-files="docs/设计" hidden></div><!-- template-begin --><p>x</p><!-- template-end -->'

  it('reads the directory from the template, which a run cannot overwrite', () => {
    // A run's region replaces the marked block and nothing else, so the pointer that decides
    // what the result tab lists lives in the template's skeleton.
    expect(resultDirectory(template, { kind: 'inline', text: 'done' })).toBe('docs/设计')
  })

  it('prefers the template over a pointer the run left in its own region', () => {
    // Stored side by side, the template is the current statement and the region is history.
    expect(resultDirectory(template, { kind: 'directory', path: 'docs/旧' })).toBe('docs/设计')
  })

  it('falls back to the region, so results written before the pointer moved still list', () => {
    expect(resultDirectory(undefined, { kind: 'directory', path: 'docs/旧' })).toBe('docs/旧')
    expect(resultDirectory('', { kind: 'directory', path: 'docs/旧' })).toBe('docs/旧')
  })

  it('answers nothing when neither names a directory', () => {
    expect(resultDirectory(undefined, { kind: 'inline', text: 'done' })).toBeUndefined()
    expect(resultDirectory('<p>no pointer</p>', { kind: 'none' })).toBeUndefined()
    expect(resultDirectory(template, { kind: 'none' })).toBe('docs/设计')
  })

  it('prefers the directory the run resolved', () => {
    // A template that names `{任务编号}` says the same thing for every run of its card, so the
    // template cannot answer "which folder was this about" — the record can.
    const tokenised = '<div data-dsh-files="{任务编号}/docs/分析" hidden></div>'
    expect(resultDirectory(tokenised, { kind: 'none' }, 'T202608242753-1/docs/分析'))
      .toBe('T202608242753-1/docs/分析')
  })

  it('ignores a recorded directory that says nothing', () => {
    expect(resultDirectory(template, { kind: 'none' }, '')).toBe('docs/设计')
  })
})

describe('formatBytes', () => {
  it('labels the sizes a listing shows', () => {
    expect(formatBytes(57812)).toBe('56.5 KB')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB')
  })

  it('shows nothing where there is no size to show', () => {
    // A directory carries no size, and a Host that does not report one must not draw `0 B`.
    expect(formatBytes(undefined)).toBe('')
    expect(formatBytes(0)).toBe('')
  })
})