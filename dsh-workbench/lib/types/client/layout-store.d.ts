/**
 * Workbench layout store and the pure ordering rules it applies.
 *
 * The store owns viewing state only: which order the user arranged and which
 * card is mid-drag. The durable copy lives on the Host, so the store never
 * persists and never talks to the network — the controller in `index.ts` reads
 * it and sends the patches it produces.
 * @module dsh-workbench/client/layout-store
 */
import type { WorkbenchCardLayoutRecord, WorkbenchLayoutEntry, WorkbenchLayoutSnapshot } from '../layout-contract.ts';
/** One card as the slot ledger describes it. */
export interface WorkbenchCardFact {
    /** Card identity. */
    readonly id: string;
    /** Plugin-declared default order. */
    readonly order: number;
    /** Plugin-declared label, resolved in the active locale; empty when the card declared none. */
    readonly label: string;
}
/** Display order resolved from the ledger facts and the user's arrangement. */
export interface WorkbenchOrder {
    /** Card ids in display order. Every card the ledger declares appears here. */
    readonly visible: readonly string[];
}
/** What the page needs to render, plus the effect of the last write. */
export interface WorkbenchWriteStatus {
    /** Idle after a successful write, pending while one is in flight. */
    readonly phase: 'idle' | 'pending' | 'failed';
    /** Readable reason for a failure, or a merge notice. */
    readonly message?: string;
}
/** Complete store state. */
export interface WorkbenchViewState {
    /** Card facts from the slot ledger. */
    cards: readonly WorkbenchCardFact[];
    /** Applied arrangement, keyed by card id. */
    layout: ReadonlyMap<string, WorkbenchCardLayoutRecord>;
    /** Drag session, or null while idle. */
    drag: {
        readonly id: string;
        readonly overIndex: number;
    } | null;
    /** Last write outcome. */
    write: WorkbenchWriteStatus;
    /** First read outcome. */
    load: {
        readonly phase: 'loading' | 'ready' | 'unavailable';
    };
}
/** Result of planning one move. */
export interface WorkbenchMovePlan {
    /** Patch entries implementing the move. */
    readonly entries: readonly WorkbenchLayoutEntry[];
    /** Resulting visible order, used for the optimistic update and the announcement. */
    readonly visible: readonly string[];
}
/**
 * Merge the ledger's default order with the user's arrangement.
 *
 * Arranged cards keep their stored position. A card with no record is placed
 * against the default order rather than appended: it lands immediately after
 * the last already-placed card that the ledger declares before it. That keeps
 * a freshly installed card near the position its author declared instead of at
 * the end.
 * @param cards - card facts from the slot ledger.
 * @param layout - stored arrangement.
 * @returns card ids in display order.
 */
export declare function resolveWorkbenchOrder(cards: readonly WorkbenchCardFact[], layout: ReadonlyMap<string, WorkbenchCardLayoutRecord>): WorkbenchOrder;
/**
 * Order records so the stored positions match one display sequence.
 * @param visible - visible card ids in display order.
 * @returns patch entries with fresh, widely spaced positions.
 */
export declare function renumberEntries(visible: readonly string[]): readonly WorkbenchLayoutEntry[];
/**
 * Plan a move of one visible card to another index.
 *
 * A move between two neighbours uses the midpoint of their positions, which
 * touches exactly one record. When that midpoint would sit closer than
 * {@link WORKBENCH_POSITION_EPSILON} to a neighbour, the whole visible
 * sequence is renumbered in the same patch instead.
 * @param visible - current visible order.
 * @param layout - current arrangement.
 * @param id - card being moved.
 * @param toIndex - target index within the visible order.
 * @returns the patch entries plus the resulting visible order.
 */
export declare function planWorkbenchMove(visible: readonly string[], layout: ReadonlyMap<string, WorkbenchCardLayoutRecord>, id: string, toIndex: number): WorkbenchMovePlan;
/**
 * Project a Host snapshot onto a layout map.
 *
 * A stored document that still carries a removed field (for example a `hidden`
 * left by an older build) is read as a plain record, so the card comes back
 * visible; there is no migration step, the field is simply ignored.
 * @param snapshot - snapshot returned by the layout route.
 * @returns records keyed by card id.
 */
export declare function layoutFromSnapshot(snapshot: WorkbenchLayoutSnapshot): Map<string, WorkbenchCardLayoutRecord>;
/** Store handle consumed by the controller and by component tests. */
export declare const workbenchStore: import("@deepseek-ai/dsh-client-store").EngineStoreHandle<WorkbenchViewState, {
    setCards: (draft: WorkbenchViewState, cards: readonly WorkbenchCardFact[]) => void;
    applySnapshot: (draft: WorkbenchViewState, snapshot: WorkbenchLayoutSnapshot) => void;
    setLayout: (draft: WorkbenchViewState, layout: ReadonlyMap<string, WorkbenchCardLayoutRecord>) => void;
    beginDrag: (draft: WorkbenchViewState, id: string) => void;
    updateDrag: (draft: WorkbenchViewState, overIndex: number) => void;
    endDrag: (draft: WorkbenchViewState) => void;
    setWrite: (draft: WorkbenchViewState, status: WorkbenchWriteStatus) => void;
    setLoad: (draft: WorkbenchViewState, phase: "loading" | "ready" | "unavailable") => void;
}>;
