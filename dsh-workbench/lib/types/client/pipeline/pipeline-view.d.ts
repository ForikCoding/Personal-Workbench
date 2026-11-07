/**
 * Reading a run into the shapes the pipeline views draw.
 *
 * The panel shows the same facts in four places — the canvas node, the run bar, the result
 * panel and the reader — and they must agree, so the reading happens once here and the
 * views only choose a presentation. Nothing in this module touches React or the transport:
 * what a run produced is decided by its stored result, and that is a string to be read.
 * @module dsh-workbench/client/pipeline/pipeline-view
 */
import type { ChainPhase, PipelineStepPhase } from './pipeline-run.ts';
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
 * How a whole pipeline stands, in the words the canvas title carries.
 *
 * This vocabulary is deliberately not the step one. A step is 待运行 while the pipeline it
 * belongs to may be 未整体运行, and giving both the same word is what made a single
 * completed step read as a finished pipeline.
 */
export type PipelineStand = 
/** Nothing has produced anything yet. */
'idle'
/** Steps ran, and every run that produced what is on screen covered one step only. */
 | 'solo'
/** Steps hold results, but nothing left here says how they were produced. */
 | 'kept' | 'running' | 'done' | 'failed' | 'stopped';
/** What {@link standOf} reads. */
export interface PipelineStandInput {
    /** How many steps the pipeline has. */
    readonly stepCount: number;
    /** How many of them hold a result. */
    readonly doneCount: number;
    /** The run this panel started, when it started one. */
    readonly chain?: {
        readonly phase: ChainPhase;
        /** Whether that run covered every step, rather than a slice of them. */
        readonly whole: boolean;
    };
    /** The runs this panel has seen, newest first. */
    readonly runs: readonly PipelineRunEntry[];
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
export declare function standOf(input: PipelineStandInput): PipelineStand;
/**
 * Where a whole run would start: the first step that does not hold a result.
 *
 * The run bar says this out loud, and it must agree with the engine, so both read it here.
 * A pipeline whose steps all hold a result starts over from the first, which is why the
 * fallback is 0 rather than "nowhere".
 * @param phases - one phase per step, in step order.
 * @returns the zero-based index to start at.
 */
export declare function resumeFrom(phases: readonly PipelineStepPhase[]): number;
