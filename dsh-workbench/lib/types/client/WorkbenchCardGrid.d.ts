/**
 * The workbench card grid: lays the visible cards out, owns the reorder
 * session, and routes each entry through the `workbench.card` shell.
 *
 * The grid reads no card data: each entry renders itself, and the panel's
 * owner props tell it where the entry sits.
 * @module dsh-workbench/client/WorkbenchCardGrid
 */
import type { ReactNode } from 'react';
import type { WorkbenchCardsOwnerProps } from './contract.ts';
import type { WorkbenchLayoutActions, WorkbenchLayoutView } from './layout-controller.ts';
/** Reorder session one card shell reads to wire its handle. */
export interface WorkbenchCardReorder {
    /** Whether this card may be reordered right now. */
    readonly reorderable: boolean;
    /** Begin a drag from this card's handle. */
    readonly begin: (id: string) => void;
    /** Drop or cancel; `commit` false restores the pre-drag order. */
    readonly end: (commit: boolean) => void;
    /** Move a card by one position, from the keyboard. */
    readonly moveBy: (id: string, delta: -1 | 1) => void;
    /** Whether a drag session is running. */
    readonly dragging: boolean;
}
/** Context the grid provides to the shells it renders. */
export declare const WorkbenchReorderContext: import("react").Context<WorkbenchCardReorder | null>;
/** What the grid needs from its page. */
export interface WorkbenchCardGridProps {
    /** Current layout view. */
    readonly view: WorkbenchLayoutView;
    /** Layout operations. */
    readonly actions: WorkbenchLayoutActions;
    /**
     * Render one card entry.
     * @param id - visible card id to render.
     * @param owner - owner props the card list declaration expects.
     * @returns the entry, or null when the slot holds no such card.
     */
    readonly renderEntry: (id: string, owner: WorkbenchCardsOwnerProps) => ReactNode;
    /**
     * Announcement text for the live region.
     * @param id - card that moved.
     * @param index - one-based destination position.
     * @returns the announcement.
     */
    readonly announce: (id: string, index: number) => string;
    /** Result of the last action, announced as-is when present. */
    readonly notice?: string | undefined;
    /**
     * One extra cell after the last card.
     *
     * The grid owns the cell, not its content: creating a card belongs where the cards
     * are, and the grid is the only thing that knows where that is.
     */
    readonly trailing?: ReactNode;
    /** Report that the set of stored cards changed. */
    readonly onCardsChanged: () => void;
}
/**
 * Render the grid and own the drag session.
 * @param props - view, actions, the entry renderer, announcement text, and notice.
 * @returns the grid element with its live region.
 */
export declare function WorkbenchCardGrid({ view, actions, renderEntry, announce, notice, trailing, onCardsChanged, }: WorkbenchCardGridProps): ReactNode;
/**
 * Read the grid's reorder session from inside a card shell.
 * @returns the reorder session, or null when the shell renders outside the grid.
 */
export declare function useWorkbenchReorder(): WorkbenchCardReorder | null;
