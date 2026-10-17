/**
 * The skill card's editor: choose a skill, write the HTML, and preview it.
 *
 * It opens in place of the card body rather than in a modal: the shared
 * primitives expose no dialog, and inventing one here would put a second overlay
 * mechanism next to the application's own.
 * @module dsh-workbench/client/skill-card/SkillCardSettings
 */
import { type ReactNode } from 'react';
import type { WorkbenchLocaleKey } from '../locales.ts';
import type { WorkbenchCardView } from './controller.ts';
/** Props of the editor. */
export interface SkillCardSettingsProps {
    /** What the card currently shows. */
    readonly view: WorkbenchCardView;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey) => string;
    /** Store a new skill selection. */
    readonly onChoose: (skill: string) => void;
    /** Store the template. */
    readonly onSave: (template: string) => void;
    /** Store the card's name; an empty value clears it back to the registered label. */
    readonly onRename: (name: string) => void;
    /** Close the editor. */
    readonly onClose: () => void;
}
/**
 * Render the card editor.
 *
 * The card remounts this component when the selected skill changes, so the draft
 * always starts from that skill's stored template.
 * @param props - the view, `t`, and the three actions.
 * @returns the editor element.
 */
export declare function SkillCardSettings(props: SkillCardSettingsProps): ReactNode;
