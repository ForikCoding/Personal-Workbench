/**
 * The action-declaration builder: pick a key, a kind, and a target, and the editor
 * writes the line.
 *
 * The declaration block is the one place in a template where exact syntax is
 * memorised rather than seen: a key that does not match what the model emits, or a
 * `card` typed as `cards`, renders a card that looks right and refuses every click.
 * The panel removes the memorising, and refuses the two mistakes that are otherwise
 * only discovered in the analyser's list — a malformed key and a key declared twice.
 * @module dsh-workbench/client/skill-card/ActionDeclarationPanel
 */
import { type ReactNode } from 'react';
import type { WorkbenchActionTarget } from '../../skill-card-contract.ts';
import type { WorkbenchLocaleKey } from '../locales.ts';
import type { WorkbenchCatalogStatus } from './controller.ts';
/** Props of the declaration builder. */
export interface ActionDeclarationPanelProps {
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
    /** Titles of every stored card: the names a card target may address. */
    readonly cardTitles: readonly string[];
    /** Skills a human may invoke: the names a skill target may address. */
    readonly skillNames: readonly string[];
    /** Whether that skill list could be read at all. */
    readonly catalogStatus: WorkbenchCatalogStatus;
    /** Keys the template already declares; the panel refuses to declare one again. */
    readonly takenKeys: readonly string[];
    /**
     * Write the declaration.
     *
     * The owner closes the panel: what to do with a written line is the editor's
     * decision, not the form's.
     * @param key - the action key.
     * @param target - what that key resolves to.
     */
    readonly onInsert: (key: string, target: WorkbenchActionTarget) => void;
    /** Close the panel without writing anything. */
    readonly onClose: () => void;
}
/**
 * Render the declaration builder.
 * @param props - the choices available, the keys taken, and the two decisions.
 * @returns the panel.
 */
export declare function ActionDeclarationPanel(props: ActionDeclarationPanelProps): ReactNode;
