/**
 * The pipeline workbench: a rail of pipelines and single cards, a canvas of steps, and
 * an inspector showing the focused step.
 *
 * The three zones are the panel's whole surface — there is no separate grid behind them.
 * A pipeline is an ordered list of cards, so a step is a card plus its position; the
 * cards themselves are configured, run and read through the same pages the panel already
 * had, which the inspector mounts rather than reimplements.
 * @module dsh-workbench/client/WorkbenchPipeline
 */
import { type ReactNode } from 'react';
import type { WorkbenchPipelinesFace } from './pipeline-controller.ts';
import type { PipelineRunFace } from './pipeline/pipeline-run.ts';
import type { WorkbenchCardFact } from './layout-store.ts';
import type { WorkbenchLocaleKey } from './locales.ts';
/** One card's full-panel views the inspector can mount. */
type CardView = 'config' | 'runs' | 'result';
/** Props of the pipeline workbench. */
export interface WorkbenchPipelineProps {
    /** Stored pipelines and the mutations the rail offers. */
    readonly pipelines: WorkbenchPipelinesFace;
    /** The run engine the canvas drives. */
    readonly run: PipelineRunFace;
    /** Cards the workbench knows about, as the rail lists them. */
    readonly facts: readonly WorkbenchCardFact[];
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
 * @param props - stored pipelines, run engine, cards, the inspector's card views, and `t`.
 * @returns the three-zone surface.
 */
export declare function WorkbenchPipeline(props: WorkbenchPipelineProps): ReactNode;
export {};
