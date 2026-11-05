/**
 * The pipeline workbench: routes on the left, the chain in the middle, one step on the right.
 *
 * Three zones that answer three different questions, and none of them duplicates another:
 * the rail says which pipelines exist, the canvas says what the chain is doing, and the
 * inspector says what one step produced, did, and is configured to do. Everything a step
 * *is* lives in its card — the pipeline only holds an order — so this surface never edits a
 * card's template; the inspector mounts the card's own page for that.
 * @module dsh-workbench/client/WorkbenchPipeline
 */
import { type ReactNode } from 'react';
import type { WorkbenchPipelinesFace } from './pipeline-controller.ts';
import type { PipelineRunFace } from './pipeline/pipeline-run.ts';
import type { WorkbenchCardFact } from './layout-store.ts';
import type { WorkbenchSkillCardApi } from './skill-card/api.ts';
import type { WorkbenchLocaleKey } from './locales.ts';
/** One card's full-panel views the reader can mount. */
type CardView = 'config' | 'runs' | 'result';
/** Props of the pipeline workbench. */
export interface WorkbenchPipelineProps {
    /** Stored pipelines and the mutations the rail offers. */
    readonly pipelines: WorkbenchPipelinesFace;
    /** The run engine the canvas drives. */
    readonly run: PipelineRunFace;
    /** Cards the workbench knows about, as the rail lists them. */
    readonly facts: readonly WorkbenchCardFact[];
    /** Transport, so a step's stored result can be read without threading it through the page. */
    readonly api: WorkbenchSkillCardApi;
    /**
     * Mount one card's own view.
     * @param cardId - the card to show.
     * @param view - which of its views.
     * @param onBack - what its back control returns to.
     * @returns the view.
     */
    readonly renderCard: (cardId: string, view: CardView, onBack: () => void) => ReactNode;
    /** Create a new single card, from the rail's own entry. */
    readonly onCreateCard: () => void;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
}
/**
 * Render the pipeline workbench.
 * @param props - stored pipelines, run engine, cards, transport, card views, and `t`.
 * @returns the three-zone surface.
 */
export declare function WorkbenchPipeline(props: WorkbenchPipelineProps): ReactNode;
export {};
