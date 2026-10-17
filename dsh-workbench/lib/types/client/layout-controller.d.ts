/**
 * The workbench's layout controller: one place that owns the applied layout,
 * the optimistic updates, and the round trip to the Host.
 *
 * Keeping it out of the components leaves the page free of transport concerns
 * and lets a test drive ordering and failure handling without a DOM.
 * @module dsh-workbench/client/layout-controller
 */
import type { WorkbenchLayoutApi } from './layout-api.ts';
import type { WorkbenchCardFact } from './layout-store.ts';
/** Write state the page reports. */
export interface WorkbenchWriteState {
    /** Idle after a successful write, pending while one is in flight. */
    readonly phase: 'idle' | 'pending' | 'failed';
    /** Failure reason, or `merged` when another client wrote first. */
    readonly message?: string;
}
/** What the page renders from. */
export interface WorkbenchLayoutView {
    /** Card ids in display order. */
    readonly visibleIds: readonly string[];
    /** Card currently being dragged. */
    readonly draggingId: string | null;
    /** First read outcome. */
    readonly load: 'loading' | 'ready' | 'unavailable';
    /** Last write outcome. */
    readonly write: WorkbenchWriteState;
}
/** Ordering and refresh operations the page wires to controls. */
export interface WorkbenchLayoutActions {
    /** Move one card to an index in the visible order. */
    readonly reorder: (id: string, toIndex: number) => void;
    /** Move one card by one position. */
    readonly moveBy: (id: string, delta: -1 | 1) => void;
    /** Clear the arrangement, returning every card to its declared order. */
    readonly reset: () => void;
    /** Re-read the stored layout. */
    readonly refresh: () => void;
    /** Mark a card as being dragged, so the page can style the grid. */
    readonly setDragging: (id: string | null) => void;
}
/** One controller result. */
export interface WorkbenchLayoutController {
    /** Render inputs. */
    readonly view: WorkbenchLayoutView;
    /** Operations. */
    readonly actions: WorkbenchLayoutActions;
}
/**
 * Drive the layout of one workbench page.
 * @param cards - card facts from the slot ledger.
 * @param api - layout transport.
 * @param active - whether the workbench panel is currently selected.
 * @returns the view plus its operations.
 */
export declare function useWorkbenchLayout(cards: readonly WorkbenchCardFact[], api: WorkbenchLayoutApi, active: boolean): WorkbenchLayoutController;
