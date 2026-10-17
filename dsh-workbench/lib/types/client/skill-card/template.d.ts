/**
 * What one card template says, and whether it can run at all.
 *
 * A template is one document with one marked region. The region is what a child agent
 * fills; everything around it is kept exactly as written, and the comments inside it
 * carry the instruction. The analyser therefore answers two questions only: is there
 * exactly one usable region, and does the document carry anything it must not.
 * @module dsh-workbench/client/skill-card/template
 */
import type { WorkbenchContentViolationCode } from './policy.ts';
/** Why one template cannot be used. */
export type WorkbenchTemplateViolationCode = WorkbenchContentViolationCode | 'region-missing' | 'region-unclosed' | 'region-repeated' | 'placeholder-syntax';
/** One reason a template was refused. */
export interface WorkbenchTemplateViolation {
    /** What is wrong. */
    readonly code: WorkbenchTemplateViolationCode;
    /** Where it is, in terms the user can find in their own document. */
    readonly location: string;
    /** The offending text, when there is a specific one. */
    readonly token?: string;
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
 * @returns the region it declares and every reason it cannot run.
 */
export declare function analyzeTemplate(html: string): WorkbenchTemplateAnalysis;
