/**
 * Reading a run into the shapes the pipeline views draw.
 *
 * The panel shows the same facts in four places — the canvas node, the run bar, the result
 * panel and the reader — and they must agree, so the reading happens once here and the
 * views only choose a presentation. Nothing in this module touches React or the transport:
 * what a run produced is decided by its stored result, and that is a string to be read.
 * @module dsh-workbench/client/pipeline/pipeline-view
 */

import type { ChainPhase, ChainStepOutcome, PipelineStepPhase } from './pipeline-run.ts'

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
  const pointer = POINTER.exec(html)
  const path = pointer?.[1]?.trim()
  if (path !== undefined && path !== '') return { kind: 'directory', path }
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
 * Say what one run covered.
 * @param entry - the run.
 * @param nameOf - naming of a step, so a `single` run can be named rather than numbered.
 * @returns a phrase for the run list.
 */
export function scopeOf(entry: PipelineRunEntry, nameOf: (index: number) => string): string {
  const only = entry.only
  if (entry.scope === 'single' && only !== undefined) return `仅 ${nameOf(only)}`
  if (entry.scope === 'refine' && only !== undefined) return `${nameOf(only)} · 重新生成`
  return `${String(entry.steps.length)} 步`
}

/**
 * Count the steps one phase in a run's step list.
 * @param steps - the run's steps.
 * @param wanted - the phase to count.
 * @returns how many steps are in that phase.
 */
export function countPhase(steps: readonly ChainStepOutcome[], wanted: PipelineStepPhase): number {
  return steps.filter(step => step.phase === wanted).length
}
