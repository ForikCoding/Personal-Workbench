/**
 * 流水线工作台：左边是这条流水线本身，右边是选中的这一步。
 *
 * 结构与 `docs/prototypes/workbench-pipeline-v2.html` 一一对应：面板头 → 两栏（画布 + 检查器）
 * → 运行条，四个弹层（阅读器 / 运行记录 / 审核 / 选择器）都是面板内的覆盖层，不另开窗口。
 * 样式逐条取自原型，只把原型的固定色板换成 DSH 令牌，于是插件跟 DSH 一起换肤。
 *
 * 步骤的“是什么”全在它自己的卡片里（模板、技能、模型、工作目录），流水线只记住顺序，
 * 所以这里从不编辑卡片的模板：要改就进卡片自己的页面。
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
    /** Stored pipelines and the mutations the menu offers. */
    readonly pipelines: WorkbenchPipelinesFace;
    /** The run engine the canvas drives. */
    readonly run: PipelineRunFace;
    /** Cards the workbench knows about, as the menu lists them. */
    readonly facts: readonly WorkbenchCardFact[];
    /** Transport, so a step's stored result is read here rather than threaded through the page. */
    readonly api: WorkbenchSkillCardApi;
    /**
     * Mount one card's own view.
     * @param cardId - the card to show.
     * @param view - which of its views.
     * @param onBack - what its back control returns to.
     * @returns the view.
     */
    readonly renderCard: (cardId: string, view: CardView, onBack: () => void) => ReactNode;
    /** Create a new single card, from the menu's own entry. */
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
 * @returns the two-column surface with its overlays.
 */
export declare function WorkbenchPipeline(props: WorkbenchPipelineProps): ReactNode;
export {};
