/**
 * The "create card" entry at the end of the card grid.
 *
 * It is a grid tile like any card, because creating one belongs where the cards
 * are. Choosing a type is the whole interaction: a card appears next to this tile
 * and the user configures it there, which keeps this entry a single decision rather
 * than a form.
 *
 * A type that is not implemented yet is still listed and is offered as disabled.
 * Hiding it would leave the user guessing whether the product has it at all.
 * @module dsh-workbench/client/WorkbenchCreateCard
 */
import { type ReactNode } from 'react';
/** One card type the workbench can offer. */
export interface WorkbenchCardType {
    /** Stable type identity. */
    readonly id: string;
    /** Localized type name. */
    readonly label: string;
    /** Whether choosing it creates anything today. */
    readonly enabled: boolean;
}
/** Everything the entry needs from the page. */
export interface WorkbenchCreateCardProps {
    /** Types offered, in display order. */
    readonly types: readonly WorkbenchCardType[];
    /**
     * Create one card of the chosen type.
     * @param type - chosen type identity.
     */
    readonly onCreate: (type: string) => void;
    /** Label of the entry. */
    readonly label: string;
    /** Suffix marking a type that creates nothing yet. */
    readonly unavailableLabel: string;
}
/**
 * Render the creation entry.
 * @param props - the types, the create callback, and localized labels.
 * @returns the tile.
 */
export declare function WorkbenchCreateCard({ types, onCreate, label, unavailableLabel, }: WorkbenchCreateCardProps): ReactNode;
