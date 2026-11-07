/**
 * Workbench Client half: the sidebar entry, the panel it opens, and the card
 * host. Card plugins contribute into `workbench.cards` and render the
 * `workbench.card` assembly; this plugin owns the page, the ordering, and the
 * layout round trip.
 * @module dsh-workbench/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type ObservableSnapshot } from '@deepseek-ai/dsh-client-store';
import { type InjectFace } from '@deepseek-ai/dsh-client-ui-slots';
import { createWorkbenchLayoutApi } from './layout-api.ts';
import { createWorkbenchPipelineApi } from './pipeline-api.ts';
import { createWorkbenchPipelineRunsApi } from './pipeline-runs-api.ts';
import type { WorkbenchCardFact } from './layout-store.ts';
import type { WorkbenchCardSelection } from './contract.ts';
import type { WorkbenchSkillCardApi } from './skill-card/api.ts';
import type { WorkbenchModelSeat } from './skill-card/model.ts';
import type { WorkbenchWorkspacePicker } from './skill-card/workspace-picker.ts';
import type { WorkbenchScriptBinder } from './skill-card/render.ts';
export { WORKBENCH_PANEL_ID } from './workbench-panel.ts';
export type { WorkbenchCardInput, WorkbenchCardOccurrenceProps, WorkbenchCardSlots, WorkbenchCardSpan, WorkbenchCardState, WorkbenchCardsOwnerProps, } from './contract.ts';
export type { WorkbenchLocaleKey } from './locales.ts';
export type { WorkbenchCardFact, WorkbenchOrder } from './layout-store.ts';
export type { WorkbenchLayoutApi, WorkbenchReadResult, WorkbenchWriteResult } from './layout-api.ts';
export type { WorkbenchPipelineApi } from './pipeline-api.ts';
export type { WorkbenchLayoutActions, WorkbenchLayoutController, WorkbenchLayoutView } from './layout-controller.ts';
/** Locale namespace owned by this plugin. */
export declare const NS = "workbench";
/** Services the sidebar row, the panel, the layout read, and the skill card depend on. */
export declare const inject: string[];
/** Injected share of the panel registration. */
export interface WorkbenchPanelFace {
    /** Card facts and the full-panel selection, bound to `useCards` and `useSelection`. */
    readonly hooks: {
        readonly cards: ObservableSnapshot<readonly WorkbenchCardFact[]>;
        readonly selection: ObservableSnapshot<WorkbenchCardSelection | undefined>;
    };
    /** Layout transport. */
    readonly api: ReturnType<typeof createWorkbenchLayoutApi>;
    /** Pipeline-definition transport: what the rail lists and stores. */
    readonly pipelines: ReturnType<typeof createWorkbenchPipelineApi>;
    /** Pipeline-execution records: what each run left behind, kept across reloads. */
    readonly pipelineRuns: ReturnType<typeof createWorkbenchPipelineRunsApi>;
    /** Skill card transport, for the full-panel views the grid opens into. */
    readonly skillCards: {
        /** Configuration and run transport. */
        readonly api: WorkbenchSkillCardApi;
        /**
         * Resolve the session the card reads the installed skills through.
         *
         * Not the session a run executes in: a run is given one of its own. This one supplies
         * the agent scope a catalog read needs, and the fallback model catalog.
         * @returns the session id, or undefined when none is available.
         */
        readonly runSessionId: () => string | undefined;
        /**
         * Resolve the session the application's own model picker is attached to.
         *
         * The card's model field reads this one, so the card offers the catalog the user is
         * choosing from. The page's own session is resolved separately, and is not always the
         * session on screen.
         * @returns the session id, or undefined while none is held.
         */
        readonly pickerSessionId: () => string | undefined;
        /** Model catalog the card's field and its run control read. */
        readonly models: WorkbenchModelSeat;
        /** Directory picker the configuration page offers for the card's workspace. */
        readonly workspacePicker: WorkbenchWorkspacePicker;
        /**
         * Binding the rendered document's own script receives.
         *
         * A card's template is the user's own HTML, and its script may read the directory the
         * card's runs write into. The binding is what that script is handed: the card's
         * identity, and the two reads a document reader needs.
         */
        readonly documents: WorkbenchScriptBinder;
    };
    /** Return to the grid from whichever full-panel view is open. */
    readonly closeCard: () => void;
    /**
     * Open one of a card's full-panel views.
     *
     * Injected rather than read from a context, because a card action can target a
     * different card: the run starts there and the page that shows it is that card's.
     */
    readonly openCard: (cardId: string, view: WorkbenchCardSelection['view']) => void;
}
/** Injected share as the page component receives it. */
export type WorkbenchPanelSeat = InjectFace<WorkbenchPanelFace>;
/**
 * Register the workbench panel, its sidebar entry, and the card assembly.
 * @param ctx - the browser plugin context.
 */
export declare function apply(ctx: ClientContext): void;
