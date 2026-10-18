/**
 * What one card template says, and whether it can run at all.
 *
 * A template is one document with one marked region. The region is what a child agent
 * fills; everything around it is kept exactly as written, and the comments inside it
 * carry the instruction. The analyser therefore answers two questions only: is there
 * exactly one usable region, and does the document carry anything it must not.
 * @module dsh-workbench/client/skill-card/template
 */
import type { WorkbenchActionDeclaration } from '../../skill-card-contract.ts';
import type { WorkbenchContentViolationCode } from './policy.ts';
/** Why one template cannot be used. */
export type WorkbenchTemplateViolationCode = WorkbenchContentViolationCode | 'region-missing' | 'region-unclosed' | 'region-repeated' | 'placeholder-syntax' | 'action-declaration-duplicate' | 'action-key-invalid' | 'action-key-repeated' | 'action-target-invalid' | 'actions-inside-region';
/** One reason a template was refused. */
export interface WorkbenchTemplateViolation {
    /** What is wrong. */
    readonly code: WorkbenchTemplateViolationCode;
    /** Where it is, in terms the user can find in their own document. */
    readonly location: string;
    /** The offending text, when there is a specific one. */
    readonly token?: string;
    /**
     * Index in the template text this violation points at, when one is known.
     *
     * Exact wherever the text is scanned directly — a region marker, a leftover
     * placeholder, or a line of the action block — because those scans hold the
     * match's own position.
     *
     * A deliberate **approximation** for the five content-policy codes: those are
     * found by walking a parsed DOM, which carries no source spans, so the reported
     * index is the first occurrence of the offending element's `<tag` in the text.
     * With two elements of the same kind it therefore points at the first one, not
     * necessarily at the offender; it is still on the right line for the common
     * case, which is what the editor uses it for. The field is absent when even that
     * anchor cannot be found: a reader must not invent a position it does not have.
     */
    readonly offset?: number | undefined;
}
/** Where one region's content sits in the template text. */
export interface WorkbenchTemplateRegion {
    /** Index of the first character after the opening marker. */
    readonly start: number;
    /** Index of the first character of the closing marker. */
    readonly end: number;
}
/** What one template turned out to be. */
export interface WorkbenchTemplateAnalysis {
    /** The one region a child fills; undefined when the template has none. */
    readonly region: WorkbenchTemplateRegion | undefined;
    /** Targets this template declares, in declaration order. */
    readonly actions: readonly WorkbenchActionDeclaration[];
    /** Everything that must be fixed before this template can run. */
    readonly violations: readonly WorkbenchTemplateViolation[];
}
/**
 * Parse template source into an inert fragment.
 *
 * A `template` element's content is inert: scripts do not run and referenced
 * resources do not load, which is what makes it safe to inspect arbitrary text.
 * Comments survive parsing, which matters because they are the instruction.
 * @param html - template source.
 * @returns the parsed content.
 */
export declare function parseTemplate(html: string): DocumentFragment;
/**
 * Locate the region a child fills.
 * @param text - the template text.
 * @returns its bounds, or undefined when there is not exactly one usable region.
 */
export declare function findRegion(text: string): WorkbenchTemplateRegion | undefined;
/**
 * Analyse one template.
 * @param html - the user's HTML.
 * @returns the region it declares, the targets it declares, and every reason it cannot run.
 */
export declare function analyzeTemplate(html: string): WorkbenchTemplateAnalysis;
/** One content-policy refusal, as a fragment editor reports it. */
export interface WorkbenchFragmentViolation {
    /** Which rule the fragment breaks. */
    readonly code: WorkbenchContentViolationCode;
    /** Where it is, as a path rather than a character offset. */
    readonly location: string;
    /** The offending tag or attribute name. */
    readonly token?: string;
    /**
     * Approximate character offset, when the text holds an anchor for it.
     *
     * The five codes come from a parsed DOM, which carries no source spans, so this is the
     * first occurrence of the offending tag's `<tag`. It is good enough to put the caret on
     * the right line and must not be read as an exact position.
     */
    readonly offset?: number;
}
/**
 * Read the content-policy refusals one fragment carries, and nothing else.
 *
 * A separate entry point rather than a filter over {@link analyzeTemplate}: a stored
 * result's region fragment is not a document, so it has no region markers and no
 * declaration block to analyse, and reporting those as violations would refuse an edit
 * for syntax that does not apply to it. The five content-policy rules do apply — the
 * renderer strips those constructs silently, so a fragment that carried one would store
 * a value whose offending part never reaches the screen.
 * @param html - the region fragment.
 * @returns the refusals, outermost first.
 */
export declare function analyzeFragment(html: string): readonly WorkbenchFragmentViolation[];
/**
 * Locate the action-declaration block in one template.
 *
 * The editor draws this block as a second band in the gutter, so the range is
 * exposed separately from the analysis: a template may be refused for its
 * declarations and still be worth drawing.
 * @param text - the template text.
 * @returns the first block's character range, or undefined when there is none.
 */
export declare function findActionsBlock(text: string): {
    readonly start: number;
    readonly end: number;
} | undefined;
