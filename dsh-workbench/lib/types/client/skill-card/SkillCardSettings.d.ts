/**
 * The skill card's editor: choose a skill, write the HTML, and preview it.
 *
 * It opens in place of the card body rather than in a modal: the shared
 * primitives expose no dialog, and inventing one here would put a second overlay
 * mechanism next to the application's own.
 *
 * The page it renders is three groups — the card's facts, the template, and the
 * preview — followed by a footer that stays in reach. They are groups rather than
 * nested cards: a card inside a card reads as a second frame, and the editor already
 * sits inside the page's own surface.
 * @module dsh-workbench/client/skill-card/SkillCardSettings
 */
import { type ReactNode } from 'react';
import type { WorkbenchCardModel } from '../../skill-card-contract.ts';
import type { WorkbenchLocaleKey } from '../locales.ts';
import type { WorkbenchCardView } from './controller.ts';
/** Props of the editor. */
export interface SkillCardSettingsProps {
    /** What the card currently shows. */
    readonly view: WorkbenchCardView;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
    /** Store a new skill selection. */
    readonly onChoose: (skill: string) => void;
    /** Store the model this card's runs use. */
    readonly onChooseModel: (model: WorkbenchCardModel) => void;
    /**
     * Open a directory picker and store what it returns.
     *
     * The editor never sees the path: picking is the controller's, so a cancelled chooser
     * leaves the stored directory exactly as it was.
     */
    readonly onChooseWorkspace: () => void;
    /** Store the template. */
    readonly onSave: (template: string, name: string) => void;
    /** Store the card's name; an empty value clears it back to the registered label. */
    readonly onRename: (name: string) => void;
    /** Close the editor. */
    readonly onClose: () => void;
    /**
     * Remove the card and everything stored for it.
     *
     * The editor only decides *whether* to ask; the page owns the write and the
     * navigation that follows it.
     */
    readonly onDelete: () => void;
}
/**
 * Render the card editor.
 *
 * The card remounts this component when the selected skill changes, so the draft
 * always starts from that skill's stored template.
 * @param props - the view, `t`, and the four actions.
 * @returns the editor element.
 */
export declare function SkillCardSettings(props: SkillCardSettingsProps): ReactNode;
