/**
 * The starter document the editor writes into an empty template.
 *
 * An empty box teaches nothing: the product depends on two comments — the region a
 * child fills, and the block that declares what a button may address — and neither can
 * be guessed from a blank textarea. The skeleton is therefore a small but complete
 * document that demonstrates both, and it must pass the analyser with no violations:
 * a starter that opens on a validation error is worse than an empty box.
 * @module dsh-workbench/client/skill-card/skeleton
 */
import type { WorkbenchLocaleKey } from '../locales.ts';
/**
 * Build the skeleton.
 *
 * The prose is translated because it is an instruction the user reads and a child
 * agent follows; the markup around it is not, because it is the example.
 * @param t - translator.
 * @returns the document, ready to be stored and analysed.
 */
export declare function templateSkeleton(t: (key: WorkbenchLocaleKey) => string): string;
