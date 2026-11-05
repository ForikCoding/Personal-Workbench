/**
 * The workbench panel page: its head, and the pipeline workbench below it.
 *
 * The panel is one surface with two states. Normally it is the pipeline workbench — the
 * rail, the canvas and the inspector. When something outside the panel opens a card's own
 * view (a card action whose target is another card), that view takes the whole surface and
 * the workbench stands behind it, which is what the injected `selection` says.
 * @module dsh-workbench/client/WorkbenchPage
 */
import { type ReactNode } from 'react';
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store';
import type { InjectFace, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { WorkbenchPipelineApi } from './pipeline-api.ts';
import type { WorkbenchCardFact } from './layout-store.ts';
import type { WorkbenchCardSelection } from './contract.ts';
import type { WorkbenchSkillCardApi } from './skill-card/api.ts';
import type { WorkbenchModelSeat } from './skill-card/model.ts';
import type { WorkbenchWorkspacePicker } from './skill-card/workspace-picker.ts';
import type { WorkbenchScriptBinder } from './skill-card/render.ts';
import type { WorkbenchLocaleKey } from './locales.ts';
/** Cards plus the transports the page drives, as the registration injects them. */
export interface WorkbenchPageInjected {
    /** Card facts and the full-panel selection. */
    readonly hooks: {
        readonly cards: ObservableSnapshot<readonly WorkbenchCardFact[]>;
        readonly selection: ObservableSnapshot<WorkbenchCardSelection | undefined>;
    };
    /** Pipeline-definition transport. */
    readonly pipelines: WorkbenchPipelineApi;
    /** Skill card transport, for the card views the inspector mounts. */
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
    /** Leave a card's full-panel view and return to the workbench. */
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
 * @param props - owner props, injected cards and transports, and `t`.
 * @returns the page element.
 */
export declare function WorkbenchPage(props: WorkbenchPageProps): ReactNode;
