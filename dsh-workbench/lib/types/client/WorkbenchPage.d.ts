/**
 * The workbench panel page: its head, the card grid, and the two empty states.
 *
 * The page owns the layout controller and hands the grid plain data, so the
 * grid stays a rendering surface and the card shells stay independent of it.
 * @module dsh-workbench/client/WorkbenchPage
 */
import { type ReactNode } from 'react';
import { type ObservableSnapshot } from '@deepseek-ai/dsh-client-store';
import type { InjectFace, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { WorkbenchLayoutApi } from './layout-api.ts';
import type { WorkbenchCardFact } from './layout-store.ts';
import type { WorkbenchCardSelection } from './contract.ts';
import type { WorkbenchSkillCardApi } from './skill-card/api.ts';
import type { WorkbenchModelSeat } from './skill-card/model.ts';
import type { WorkbenchWorkspacePicker } from './skill-card/workspace-picker.ts';
import type { WorkbenchScriptBinder } from './skill-card/render.ts';
import type { WorkbenchLocaleKey } from './locales.ts';
/** Cards plus the transport the page drives, as the registration injects them. */
export interface WorkbenchPageInjected {
    /** Card facts and the full-panel selection. */
    readonly hooks: {
        readonly cards: ObservableSnapshot<readonly WorkbenchCardFact[]>;
        readonly selection: ObservableSnapshot<WorkbenchCardSelection | undefined>;
    };
    /** Layout transport. */
    readonly api: WorkbenchLayoutApi;
    /** Skill card transport, for the full-panel views the grid opens into. */
    readonly skillCards: {
        readonly api: WorkbenchSkillCardApi;
        /**
         * Resolve the session the card reads the installed skills through.
         *
         * Not the session a run executes in: a run is given one of its own.
         * @returns the session id, or undefined when none is available.
         */
        readonly runSessionId: () => string | undefined;
        /**
         * Resolve the session the application's own model picker is attached to.
         *
         * Omitted is read as "this page's own session is the only one this host can name",
         * which is what a host without a session list can answer.
         * @returns the session id, or undefined while none is held.
         */
        readonly pickerSessionId?: () => string | undefined;
        /** Model catalog the result and configuration pages read. */
        readonly models: WorkbenchModelSeat;
        /** Directory picker the configuration page offers for the card's workspace. */
        readonly workspacePicker: WorkbenchWorkspacePicker;
        /**
         * Binding the rendered document's own script receives.
         *
         * Omitted is read as "the document runs on its own", which is what a host without the
         * document route can offer: the template's script still runs, and a read it asks for
         * finds no card behind it.
         */
        readonly documents?: WorkbenchScriptBinder | undefined;
    };
    /** Return to the grid from whichever full-panel view is open. */
    readonly closeCard: () => void;
    /**
     * Open one of a card's full-panel views.
     *
     * A card action whose target is a card starts that card's run and then shows it,
     * which is a navigation across cards rather than within one. `runId` names the
     * run a result view opens; omitted resolves to the card's latest run.
     */
    readonly openCard: (cardId: string, view: WorkbenchCardSelection['view'], runId?: string) => void;
}
/** Composed props of the workbench page. */
export type WorkbenchPageProps = PropsRuntime<'main'> & PropsRenderSlots<'workbench.cards'> & InjectFace<WorkbenchPageInjected> & {
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
};
/**
 * Render the workbench page.
 * @param props - owner props, card render share, injected cards and transport, and `t`.
 * @returns the page element.
 */
export declare function WorkbenchPage(props: WorkbenchPageProps): ReactNode;
