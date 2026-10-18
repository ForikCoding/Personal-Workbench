/**
 * The result's own editor: the filled region HTML, written by hand.
 *
 * A run's output is not always right, and the fix is sometimes two characters rather than
 * another model call. This editor edits the one fragment a result carries — not the
 * template document, which is a different thing stored under a different key — and saves
 * it as the card's result.
 *
 * It opens in place of the rendered document, inside the result surface, for the same
 * reason the configuration editor does: the shared primitives expose no dialog, and a
 * second overlay mechanism would be a second thing to get wrong. It answers the same
 * keystrokes as the template editor because a writer in an HTML box expects them; it
 * carries none of that editor's document-only affordances (region bands, declaration
 * builder, skeleton), because a fragment has no region markers and declares nothing.
 * @module dsh-workbench/client/skill-card/SkillCardResultEditor
 */
import { type ReactNode } from 'react';
import type { WorkbenchLocaleKey } from '../locales.ts';
/** Props of the result editor. */
export interface SkillCardResultEditorProps {
    /** The region HTML the result carries now; the draft's starting point. */
    readonly html: string;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
    /**
     * Store the edited fragment.
     *
     * The promise settles when the Host has answered, so the editor can keep its one button
     * out of reach until then; leaving the editor is the page's decision, not this one's —
     * a refused save must leave the draft exactly where it is.
     * @param html - the draft, verbatim.
     * @returns resolution once the write has settled.
     */
    readonly onSave: (html: string) => Promise<void>;
    /** Leave without writing anything. */
    readonly onCancel: () => void;
}
/**
 * Render the result editor.
 * @param props - the starting HTML, `t`, and the two decisions.
 * @returns the editor element.
 */
export declare function SkillCardResultEditor(props: SkillCardResultEditorProps): ReactNode;
