/**
 * One template read as structure rather than as source.
 *
 * The field beside this view is the only editor: this is the same text with each block's
 * inside hidden behind the line that opens it, so a three-hundred-line template can be read
 * as the dozen boxes it actually is. Every row is also a way back — a click hands the line
 * back to the field, selected — because folding is only half of what a long document needs;
 * the other half is arriving at the line you were looking for.
 * @module dsh-workbench/client/skill-card/TemplateFold
 */
import { type ReactNode } from 'react';
import type { WorkbenchLocaleKey } from '../locales.ts';
import { type OutlineNode } from './template-outline.ts';
/** Props of the fold view. */
export interface TemplateFoldProps {
    /** The template source. */
    readonly text: string;
    /** Its outline, as {@link import('./template-outline.ts').outline} reads it. */
    readonly nodes: readonly OutlineNode[];
    /** Translator. */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
    /**
     * Called when a row is clicked.
     * @param line - zero-based line to show in the field.
     */
    readonly onReveal: (line: number) => void;
}
/**
 * Render one template as foldable rows.
 * @param props - the text, its outline, the translator, and the way back.
 * @returns the fold view.
 */
export declare function TemplateFold({ text, nodes, t, onReveal }: TemplateFoldProps): ReactNode;
