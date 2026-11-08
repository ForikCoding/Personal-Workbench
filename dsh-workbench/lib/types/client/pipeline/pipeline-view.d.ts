/**
 * Reading a run into the shapes the pipeline views draw.
 *
 * The panel shows the same facts in four places — the canvas node, the run bar, the result
 * panel and the reader — and they must agree, so the reading happens once here and the
 * views only choose a presentation. Nothing in this module touches React or the transport:
 * what a run produced is decided by its stored result, and that is a string to be read.
 * @module dsh-workbench/client/pipeline/pipeline-view
 */
import type { WorkbenchResultRecord } from '../../skill-card-contract.ts';
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
 * The directory a step's result covers.
 *
 * Asked of the card's template first: the template is where the pointer belongs, and it is
 * the only place a run cannot overwrite. The stored region is the second answer, so results
 * from before the pointer moved out of the region keep their file list.
 * @param template - the card's template as stored; absent when it has none.
 * @param product - what the run's own region produced.
 * @returns the directory to list, or undefined when this result is not a directory's files.
 */
export declare function resultDirectory(template: string | undefined, product: StepProduct): string | undefined;
/**
 * A byte count as the row beside a file name shows it.
 *
 * One decimal above a kilobyte and none below it: a listing is read for its shape, and
 * `56.5 KB` beside a name says as much as `57812` does without being counted out.
 * @param bytes - the size to label; absent or not positive gives an empty label.
 * @returns the label, empty when there is no size to show.
 */
export declare function formatBytes(bytes: number | undefined): string;
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
 * How a stored result reads as a step's state.
 *
 * A record exists for every run that got far enough to have one — including the runs that
 * produced nothing and said why — so its existence means "something happened", not "it
 * worked". The verdict is the record's own: `failure`/`failureCode` are written for every
 * unusable outcome, the region is the product's proof, and `stopReason` is what is left to
 * read on a record written before those fields existed.
 *
 * The order is verdict, then product, then reason. A region is not required for success (a
 * completed run may hand over an empty region, and that is a finished step with no product),
 * and a region on its own is not enough to call a failed run good if a record ever carried
 * both — {@link WorkbenchResultRecord.failure} says the run produced no usable result, so it
 * wins.
 * @param result - the step's newest stored result, when the card has one.
 * @returns the phase the record states.
 */
export declare function phaseOfResult(result: WorkbenchResultRecord | undefined): 'idle' | 'done' | 'failed';
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
    /**
     * First step a whole run covered, zero-based; absent means it started at the first step.
     *
     * A chain can be re-run from any step whose predecessors already finished, and the record
     * has to say where it began: without this, "ran the whole thing again" and "re-ran the
     * last two steps" are the same row, and the steps they left alone are indistinguishable
     * from the ones they replaced.
     */
    readonly from?: number;
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
    /**
     * How each step's product came to be, in step order, as its own record says.
     *
     * The panel forgets its runs when it is reopened, but the products keep their
     * provenance: this is what tells a step run on its own from a step a chain filled, after
     * the memory of the run itself is gone.
     */
    readonly scopes?: readonly ('full' | 'single' | 'refine' | undefined)[];
    /** Index of the step holding a failure, when one does. */
    readonly failedAt?: number;
}
/**
 * Read how a whole pipeline stands.
 *
 * The run in flight is authoritative while it is whole: it is what just happened. A run of
 * one step is not a verdict on the pipeline, so once the chain is a slice the answer falls
 * back to the records — and when there are none, the steps holding a result are all that is
 * left to read, which is why that case gets a word of its own instead of a claim about how
 * those results came to be.
 *
 * A step that holds a failure is the one thing that outranks the records: 完成 has to mean
 * every step finished, so the pipeline cannot claim it while one of them did not.
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
/** Which part of a chain the run button would run, and what it calls itself. */
export interface RunScope {
    /** Zero-based step it would start at. */
    readonly at: number;
    /**
     * The word the button carries.
     *
     * Three words for three ranges rather than a fourth switch: `run` starts a chain nothing
     * has run, `resume` continues one that stopped halfway, `again` redoes a chain that is
     * complete. Each says what pressing it will do, which is the whole promise of the button.
     */
    readonly word: 'run' | 'resume' | 'again';
    /** Whether every step already holds a result. */
    readonly allDone: boolean;
}
/**
 * Read what a run of the whole pipeline would cover right now.
 *
 * One source for the button's word, the button's default start and the menu's first row:
 * three places that must never disagree. An empty chain is a chain nothing has run.
 * @param phases - one phase per step, in step order.
 * @returns the scope, with the word that names it.
 */
export declare function runScopeOf(phases: readonly PipelineStepPhase[]): RunScope;
/**
 * Whether a run may start at one step.
 *
 * A chain that starts in the middle skips every step before it, so those steps have to be
 * finished already: otherwise the chain would end "complete" with its first half missing,
 * and no state in this vocabulary says that. The menu rows and the engine read this same
 * rule, so an offer that cannot be honoured is never shown.
 * @param phases - one phase per step, in step order.
 * @param at - zero-based step the run would start at.
 * @returns whether that start is allowed.
 */
export declare function canStartAt(phases: readonly PipelineStepPhase[], at: number): boolean;
/**
 * One row of the range menu: a start point, and what picking it costs.
 *
 * The numbers are kept apart from the words on purpose. What a row says is "these steps,
 * and this many products replaced" — the sentence is the view's, but which steps and how
 * many is a fact about the chain, and it is computed once here.
 */
export interface RunScopeRow {
    /** Which of the three ranges it is. */
    readonly kind: 'resume' | 'all' | 'from';
    /** Zero-based step the run would start at. */
    readonly at: number;
    /** First step it covers, counted from one. */
    readonly first: number;
    /** Last step it covers, counted from one. */
    readonly last: number;
    /** How many steps already hold a product this run would replace. */
    readonly replacing: number;
}
/** What {@link runScopeRows} reads. */
export interface RunScopeRowsInput {
    /** One phase per step, in step order. */
    readonly phases: readonly PipelineStepPhase[];
    /** Zero-based index of the step the panel has selected. */
    readonly selected: number;
}
/**
 * Read the range menu: every way this chain can be run, in a fixed order.
 *
 * A row that would do exactly what the row above it does is left out rather than printed
 * twice: "re-run from the beginning" is not offered before anything has run, and "re-run
 * from step 2" is not offered when the chain would start at or before step 2 anyway.
 * @param input - the phases and the selected step.
 * @returns the rows, the default one first.
 */
export declare function runScopeRows(input: RunScopeRowsInput): readonly RunScopeRow[];
