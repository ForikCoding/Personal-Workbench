/**
 * Reading a run into the shapes the pipeline views draw.
 *
 * The panel shows the same facts in four places — the canvas node, the run bar, the result
 * panel and the reader — and they must agree, so the reading happens once here and the
 * views only choose a presentation. Nothing in this module touches React or the transport:
 * what a run produced is decided by its stored result, and that is a string to be read.
 * @module dsh-workbench/client/pipeline/pipeline-view
 */
import type { ChainPhase, ChainStepOutcome, PipelineStepPhase } from './pipeline-run.ts';
/** Text and shape one step's state is drawn with. */
export interface StepStateView {
    /** Localisation key suffix, shared by every view that names the state. */
    readonly key: 'idle' | 'queued' | 'running' | 'done' | 'failed' | 'stopped';
    /** Which mark the state carries, so colour is never the only signal. */
    readonly mark: 'slot' | 'dash' | 'clock' | 'check' | 'warn' | 'x';
}
/**
 * How one step's state reads.
 * @param phase - the step's phase.
 * @returns its text key and mark.
 */
export declare function stateView(phase: PipelineStepPhase): StepStateView;
/** What one step produced, as the result panel can act on it. */
export type StepProduct = {
    readonly kind: 'directory';
    readonly path: string;
} | {
    readonly kind: 'inline';
    readonly text: string;
} | {
    readonly kind: 'none';
};
/**
 * Format a duration for a column that must not jump as the number grows.
 * @param ms - elapsed milliseconds; absent means nothing has elapsed yet.
 * @returns `12.4s`, `1m 08s`, or a dash.
 */
export declare function formatDuration(ms: number | undefined): string;
/**
 * Format a moment the way a run list groups by day.
 *
 * Today and yesterday are named, because "今天 14:07" is what someone means by "recent";
 * anything older carries its date, and a different year carries the year.
 * @param at - epoch milliseconds.
 * @param now - the clock to compare against.
 * @returns a short, grouped label.
 */
export declare function formatWhen(at: number, now: number): string;
/**
 * The day bucket a run belongs to, for grouping a list.
 * @param at - epoch milliseconds.
 * @param now - the clock to compare against.
 * @returns `今天`, `昨天`, or a date.
 */
export declare function dayOf(at: number, now: number): string;
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
export declare function productOf(html: string | undefined): StepProduct;
/**
 * Read the text a region carries, without the markup.
 *
 * The row under the step name is a summary, not a rendering, so tags come out and runs of
 * whitespace collapse. It is deliberately not a parser: the document is rendered in the
 * reader, and a preview that half-parsed HTML would be a second renderer to keep honest.
 * @param html - the region HTML.
 * @returns its text, on one line, cut to something a row can hold.
 */
export declare function textOf(html: string): string;
/** One step of one run, as the history and the reader need it. */
export interface PipelineRunStep {
    /** The card this step ran. */
    readonly cardId: string;
    /** How it ended. */
    readonly phase: PipelineStepPhase;
    /** How long it took. */
    readonly tookMs?: number;
    /** Why it failed, when it did. */
    readonly failure?: string;
    /** The region it stored, captured when the run settled. */
    readonly html?: string;
}
/** What one execution of a pipeline did, kept for the session. */
export interface PipelineRunEntry {
    /** Ordinal within its pipeline, counted from one. */
    readonly no: number;
    /** When it started, in epoch milliseconds. */
    readonly startedAt: number;
    /** How long the whole thing took. */
    readonly tookMs: number;
    /** How it ended. */
    readonly phase: ChainPhase;
    /** Whether it ran the whole chain, one step, or one step again on request. */
    readonly scope: 'full' | 'single' | 'refine';
    /** The step a `single` or `refine` run was about, zero-based. */
    readonly only?: number;
    /** What the review asked for, when the run was one. */
    readonly instruction?: string;
    /** One entry per step the run touched, in step order. */
    readonly steps: readonly PipelineRunStep[];
}
/**
 * Say what one run covered.
 * @param entry - the run.
 * @param nameOf - naming of a step, so a `single` run can be named rather than numbered.
 * @returns a phrase for the run list.
 */
export declare function scopeOf(entry: PipelineRunEntry, nameOf: (index: number) => string): string;
/**
 * Count the steps one phase in a run's step list.
 * @param steps - the run's steps.
 * @param wanted - the phase to count.
 * @returns how many steps are in that phase.
 */
export declare function countPhase(steps: readonly ChainStepOutcome[], wanted: PipelineStepPhase): number;
