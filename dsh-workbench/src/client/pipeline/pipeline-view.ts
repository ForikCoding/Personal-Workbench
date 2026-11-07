/**
 * Reading a run into the shapes the pipeline views draw.
 *
 * The panel shows the same facts in four places — the canvas node, the run bar, the result
 * panel and the reader — and they must agree, so the reading happens once here and the
 * views only choose a presentation. Nothing in this module touches React or the transport:
 * what a run produced is decided by its stored result, and that is a string to be read.
 * @module dsh-workbench/client/pipeline/pipeline-view
 */

import type { ChainPhase, PipelineStepPhase } from './pipeline-run.ts'

/** Text and shape one step's state is drawn with. */
export interface StepStateView {
  /** Localisation key suffix, shared by every view that names the state. */
  readonly key: 'idle' | 'queued' | 'running' | 'done' | 'failed' | 'stopped'
  /** Which mark the state carries, so colour is never the only signal. */
  readonly mark: 'slot' | 'dash' | 'clock' | 'check' | 'warn' | 'x'
}

/** The state a step is drawn in. */
const STATE_VIEW: Record<PipelineStepPhase, StepStateView> = {
  // 待运行有自己的记号：虚线圆留给排队中，空槽位留给"位置留好了、还没启动"
  idle: { key: 'idle', mark: 'slot' },
  queued: { key: 'queued', mark: 'dash' },
  running: { key: 'running', mark: 'clock' },
  done: { key: 'done', mark: 'check' },
  failed: { key: 'failed', mark: 'warn' },
  stopped: { key: 'stopped', mark: 'x' },
}

/**
 * How one step's state reads.
 * @param phase - the step's phase.
 * @returns its text key and mark.
 */
export function stateView(phase: PipelineStepPhase): StepStateView {
  return STATE_VIEW[phase]
}

/** What one step produced, as the result panel can act on it. */
export type StepProduct =
  | { readonly kind: 'directory'; readonly path: string }
  | { readonly kind: 'inline'; readonly text: string }
  | { readonly kind: 'none' }

/** Several identical characters, for the duration column. */
const DASH = '—'

/**
 * Format a duration for a column that must not jump as the number grows.
 * @param ms - elapsed milliseconds; absent means nothing has elapsed yet.
 * @returns `12.4s`, `1m 08s`, or a dash.
 */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms) || ms < 0) return DASH
  if (ms < 1_000) return `${(ms / 1_000).toFixed(1)}s`
  const seconds = Math.round(ms / 1_000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes < 60) return `${minutes}m ${String(rest).padStart(2, '0')}s`
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

/**
 * Format a moment the way a run list groups by day.
 *
 * Today and yesterday are named, because "今天 14:07" is what someone means by "recent";
 * anything older carries its date, and a different year carries the year.
 * @param at - epoch milliseconds.
 * @param now - the clock to compare against.
 * @returns a short, grouped label.
 */
export function formatWhen(at: number, now: number): string {
  const when = new Date(at)
  const today = new Date(now)
  const time = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`
  const dayKey = (date: Date): number => date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate()
  if (dayKey(when) === dayKey(today)) return time
  const yesterday = new Date(today.getTime() - 86_400_000)
  if (dayKey(when) === dayKey(yesterday)) return `昨天 ${time}`
  const sameYear = when.getFullYear() === today.getFullYear()
  const month = when.getMonth() + 1
  const day = when.getDate()
  return sameYear ? `${String(month)}/${String(day)} ${time}` : `${String(when.getFullYear())}/${String(month)}/${String(day)}`
}

/**
 * The day bucket a run belongs to, for grouping a list.
 * @param at - epoch milliseconds.
 * @param now - the clock to compare against.
 * @returns `今天`, `昨天`, or a date.
 */
export function dayOf(at: number, now: number): string {
  const label = formatWhen(at, now)
  const cut = label.indexOf(' ')
  return cut < 0 ? label : label.slice(0, cut)
}

/** How far into a result document a directory pointer may sit. */
const POINTER = /data-dsh-files\s*=\s*"([^"]{1,512})"/i

/**
 * Read the directory a document points at.
 *
 * The pointer is the template's own statement that this card's results are files in a
 * directory, and it sits outside the region so a run cannot remove it. A run's stored region
 * may carry one too — that is how results written before the pointer moved are still read.
 * @param document - a template, or a stored region.
 * @returns the directory the document points at, or undefined when it points at none.
 */
export function pointerPath(document: string | undefined): string | undefined {
  if (document === undefined) return undefined
  const path = POINTER.exec(document)?.[1]?.trim()
  return path === undefined || path === '' ? undefined : path
}

/**
 * The directory a step's result covers.
 *
 * Asked of the card's template first: the template is where the pointer belongs, and it is
 * the only place a run cannot overwrite. The stored region is the second answer, so results
 * from before the pointer moved out of the region keep their file list.
 * @param template - the card's template as stored; absent when it has none.
 * @param product - what the run's own region produced.
 * @returns the directory to list, or undefined when this result is not a directory's files.
 */
export function resultDirectory(template: string | undefined, product: StepProduct): string | undefined {
  const fromTemplate = pointerPath(template)
  if (fromTemplate !== undefined) return fromTemplate
  return product.kind === 'directory' ? product.path : undefined
}

/**
 * A byte count as the row beside a file name shows it.
 *
 * One decimal above a kilobyte and none below it: a listing is read for its shape, and
 * `56.5 KB` beside a name says as much as `57812` does without being counted out.
 * @param bytes - the size to label; absent or not positive gives an empty label.
 * @returns the label, empty when there is no size to show.
 */
export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes <= 0) return ''
  if (bytes < 1024) return `${String(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Read what a step produced out of the result it stored.
 *
 * A run returns the region of its card's document, so the region is what "produced" means
 * here: either it points at a directory the document will list and read for itself, or it
 * is the content itself. That distinction is the panel's whole job — a directory gets one
 * row that opens the document, an inline result gets one row that opens the same document.
 * @param html - the region HTML the run stored; absent when it stored none.
 * @returns the product, or `none` when the run left nothing to read.
 */
export function productOf(html: string | undefined): StepProduct {
  if (html === undefined || html.trim() === '') return { kind: 'none' }
  const path = pointerPath(html)
  if (path !== undefined) return { kind: 'directory', path }
  const text = textOf(html)
  return text === '' ? { kind: 'none' } : { kind: 'inline', text }
}

/**
 * Read the text a region carries, without the markup.
 *
 * The row under the step name is a summary, not a rendering, so tags come out and runs of
 * whitespace collapse. It is deliberately not a parser: the document is rendered in the
 * reader, and a preview that half-parsed HTML would be a second renderer to keep honest.
 * @param html - the region HTML.
 * @returns its text, on one line, cut to something a row can hold.
 */
export function textOf(html: string): string {
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > SUMMARY_MAX ? `${text.slice(0, SUMMARY_MAX - 1)}…` : text
}

/** How much of a step's text the canvas foot shows. */
const SUMMARY_MAX = 64

/** One step of one run, as the history and the reader need it. */
export interface PipelineRunStep {
  /** The card this step ran. */
  readonly cardId: string
  /** How it ended. */
  readonly phase: PipelineStepPhase
  /** How long it took. */
  readonly tookMs?: number
  /** Why it failed, when it did. */
  readonly failure?: string
  /** The region it stored, captured when the run settled. */
  readonly html?: string
}

/** What one execution of a pipeline did, kept for the session. */
export interface PipelineRunEntry {
  /** Ordinal within its pipeline, counted from one. */
  readonly no: number
  /** When it started, in epoch milliseconds. */
  readonly startedAt: number
  /** How long the whole thing took. */
  readonly tookMs: number
  /** How it ended. */
  readonly phase: ChainPhase
  /** Whether it ran the whole chain, one step, or one step again on request. */
  readonly scope: 'full' | 'single' | 'refine'
  /** The step a `single` or `refine` run was about, zero-based. */
  readonly only?: number
  /** What the review asked for, when the run was one. */
  readonly instruction?: string
  /** One entry per step the run touched, in step order. */
  readonly steps: readonly PipelineRunStep[]
}

/**
 * How a whole pipeline stands, in the words the canvas title carries.
 *
 * This vocabulary is deliberately not the step one. A step is 待运行 while the pipeline it
 * belongs to may be 未整体运行, and giving both the same word is what made a single
 * completed step read as a finished pipeline.
 */
export type PipelineStand =
  /** Nothing has produced anything yet. */
  | 'idle'
  /** Steps ran, and every run that produced what is on screen covered one step only. */
  | 'solo'
  /** Steps hold results, but nothing left here says how they were produced. */
  | 'kept'
  | 'running'
  | 'done'
  | 'failed'
  | 'stopped'

/** What {@link standOf} reads. */
export interface PipelineStandInput {
  /** How many steps the pipeline has. */
  readonly stepCount: number
  /** How many of them hold a result. */
  readonly doneCount: number
  /** The run this panel started, when it started one. */
  readonly chain?: {
    readonly phase: ChainPhase
    /** Whether that run covered every step, rather than a slice of them. */
    readonly whole: boolean
  }
  /** The runs this panel has seen, newest first. */
  readonly runs: readonly PipelineRunEntry[]
  /**
   * How each step's product came to be, in step order, as its own record says.
   *
   * The panel forgets its runs when it is reopened, but the products keep their
   * provenance: this is what tells a step run on its own from a step a chain filled, after
   * the memory of the run itself is gone.
   */
  readonly scopes?: readonly ('full' | 'single' | 'refine' | undefined)[]
  /** Index of the step holding a failure, when one does. */
  readonly failedAt?: number
}

/**
 * Read how a whole pipeline stands.
 *
 * The run in flight is authoritative while it is whole: it is what just happened. A run of
 * one step is not a verdict on the pipeline, so once the chain is a slice the answer falls
 * back to the records — and when there are none, the steps holding a result are all that is
 * left to read, which is why that case gets a word of its own instead of a claim about how
 * those results came to be.
 * @param input - steps, their results, the run in flight, and the runs seen.
 * @returns how the pipeline stands.
 */
export function standOf(input: PipelineStandInput): PipelineStand {
  const { chain, doneCount, runs, stepCount } = input
  if (chain !== undefined) {
    if (chain.phase === 'running') return 'running'
    if (chain.whole) {
      if (chain.phase === 'failed') return 'failed'
      if (chain.phase === 'stopped') return 'stopped'
      return 'done'
    }
  }
  // A whole run covers the rest of the pipeline, so its own outcome is the pipeline's: it
  // could not have settled with a step unaccounted for, because the chain stops on failure.
  const whole = runs.find(entry => entry.scope === 'full')
  if (whole !== undefined) {
    if (whole.phase === 'failed') return 'failed'
    if (whole.phase === 'stopped') return 'stopped'
    if (whole.phase === 'settled') return 'done'
  }
  // An empty pipeline and one nothing has run in are the same answer: nothing is pending,
  // because nothing has started.
  if (stepCount === 0 || doneCount === 0) return 'idle'
  if (runs.length > 0) return 'solo'
  // No run is remembered, but a product may still say how it was made. A whole run leaves
  // its scope on every step it filled, so every step reading "whole" is a finished
  // pipeline even with no record of the run; a step that failed in one means the chain did.
  const scopes = input.scopes ?? []
  const failedAt = input.failedAt ?? -1
  if (failedAt >= 0 && scopes[failedAt] === 'full') return 'failed'
  if (doneCount === stepCount && scopes.every(scope => scope === 'full')) return 'done'
  if (scopes.some(scope => scope !== undefined)) return 'solo'
  return 'kept'
}

/**
 * Where a whole run would start: the first step that does not hold a result.
 *
 * The run bar says this out loud, and it must agree with the engine, so both read it here.
 * A pipeline whose steps all hold a result starts over from the first, which is why the
 * fallback is 0 rather than "nowhere".
 * @param phases - one phase per step, in step order.
 * @returns the zero-based index to start at.
 */
export function resumeFrom(phases: readonly PipelineStepPhase[]): number {
  const first = phases.findIndex(phase => phase !== 'done')
  return first < 0 ? 0 : first
}
