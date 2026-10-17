/**
 * Workbench client contract: the sidebar row and main panel identity, the card
 * slot the panel declares, the `workbench.card` assembly a card renders, and
 * the locale namespace. A card package imports this module for its
 * declarations only.
 * @module dsh-workbench/client/contract
 */
import type { PropsRenderFactories, SlotComponent } from '@deepseek-ai/dsh-client-ui-slots';
import type { WorkbenchLocaleKey } from './locales.ts';
export { WORKBENCH_PANEL_ID } from './workbench-panel.ts';
/** Grid footprint a card asks for. */
export type WorkbenchCardSpan = 'standard' | 'wide' | 'tall' | 'large';
/** Status semantics a card reports, mapped onto the shared state dot. */
export type WorkbenchCardState = 'idle' | 'ongoing' | 'done' | 'warning' | 'error';
/**
 * Which full-panel view the workbench is showing, and for which card.
 *
 * A card has two: the result it produces, and the configuration that produces it.
 * The card face is only an index entry, so this being unset is the grid.
 */
export interface WorkbenchCardSelection {
    /** Card being shown in the full display column. */
    readonly cardId: string;
    /** Which of the card's two views. */
    readonly view: 'result' | 'config';
}
/**
 * What one card tells the host shell about itself.
 *
 * A card owns its data and its body; the shell owns the frame, the drag handle,
 * and the removal control, and draws the status dot and the refresh control only
 * when the card supplies `state` / `onRefresh`. `id` is the card's identity
 * everywhere: the slot entry id, the layout record key, and the reorder key.
 */
export interface WorkbenchCardInput {
    /** Card identity: a namespaced slug such as `git-repo`. */
    readonly id: string;
    /** Card title, localized by the providing plugin. */
    readonly title: string;
    /** Optional secondary line, for example a repository path. */
    readonly subtitle?: string;
    /** Grid footprint; `standard` when omitted. */
    readonly span?: WorkbenchCardSpan;
    /** Status semantics; omitted draws no status dot. The shipped card leaves this to its result page. */
    readonly state?: WorkbenchCardState;
    /** Status text shown next to the dot. */
    readonly status?: string;
    /** User-gesture refresh for this card; omitted hides the action. */
    readonly onRefresh?: () => void;
    /**
     * Activate the card itself, opening whatever the card presents in full.
     *
     * Omitted leaves the card inert. The shell cannot wrap the card in a `<button>`
     * because the card hosts its own controls in the head action area, and a button
     * inside a button is invalid markup that browsers reparent.
     */
    readonly onActivate?: () => void;
    /**
     * Remove the card and everything stored for it.
     *
     * Omitted renders no removal control, because a card that the shell cannot delete
     * — one contributed by another plugin — must not offer it. When present the X
     * always means deletion; hiding is not offered by any card type.
     */
    readonly onRemove?: () => void;
    /** Readable reason the body cannot render; overrides the body with a retry surface. */
    readonly failure?: string;
}
/** Local components one `workbench.card` occurrence selects. */
export interface WorkbenchCardSlots {
    /** Card body; omitted renders the empty body. */
    readonly body?: SlotComponent<PropsRenderFactories>;
    /** Card actions beside the host's own controls. */
    readonly actions?: SlotComponent<PropsRenderFactories>;
}
/** Props the panel passes when it renders one card occurrence. */
export interface WorkbenchCardOccurrenceProps {
    /** Whether the host shell may still offer the reorder handle. */
    readonly reorderable: boolean;
    /** Grid position among the visible cards, one-based, for accessible naming. */
    readonly position: number;
    /** Total visible card count, for accessible naming. */
    readonly total: number;
}
/** Owner input the panel supplies when rendering the card list. */
export interface WorkbenchCardsOwnerProps {
    /**
     * The card instance this render is for.
     *
     * One registered entry can back several card instances, so an entry must not
     * assume it is the only one and must not hardcode an id: it reads its identity
     * here. `visibleIds` is the whole list, and each member is rendered once.
     */
    readonly cardId: string;
    /** Card ids in display order. */
    readonly visibleIds: readonly string[];
    /** Card currently being dragged, or null. */
    readonly draggingId: string | null;
    /**
     * Tell the panel the set of stored cards changed.
     *
     * A card removes itself from its own face, and the panel owns the list it renders
     * from, so the removal has to be reported rather than inferred.
     */
    readonly onCardsChanged: () => void;
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Workbench page, card shell, and menu copy. */
        workbench: WorkbenchLocaleKey;
    }
    interface SlotFactoryMap {
        /**
         * One workbench card shell. The props are the card's presentation facts;
         * the body and actions come from the occurrence's local components, so the
         * shell can be rendered by any card package without importing one.
         */
        'workbench.card': {
            scope: 'root';
            props: WorkbenchCardInput & WorkbenchCardOccurrenceProps;
            slots: {
                body: {
                    scope: 'root';
                };
                actions: {
                    scope: 'root';
                };
            };
            locale: 'workbench';
        };
    }
    interface SlotMap {
        /**
         * Cards in the workbench grid, declared by the workbench panel. Each entry
         * receives the page's render inputs and renders one `workbench.card`
         * occurrence. `id` is the card identity used for ordering.
         */
        'workbench.cards': {
            kind: 'list';
            scope: 'root';
            owner: WorkbenchCardsOwnerProps;
        };
    }
}
