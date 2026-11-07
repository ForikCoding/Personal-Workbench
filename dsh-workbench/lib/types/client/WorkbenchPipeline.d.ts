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
import './pipeline.css';
import type { WorkbenchPipelinesFace } from './pipeline-controller.ts';
import type { PipelineRunFace } from './pipeline/pipeline-run.ts';
import type { WorkbenchCardFact } from './layout-store.ts';
import type { WorkbenchSkillCatalogEntry } from '../skill-card-contract.ts';
import type { WorkbenchCatalogStatus } from './skill-card/controller.ts';
import type { WorkbenchSkillCardApi } from './skill-card/api.ts';
import type { WorkbenchLocaleKey } from './locales.ts';
import { type WorkbenchModelGroup } from './skill-card/model.ts';
import type { WorkbenchCardModel, WorkbenchCardWorkspace, WorkbenchSandboxMode } from '../skill-card-contract.ts';
import type { WorkbenchWorkspacePicker } from './skill-card/workspace-picker.ts';
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
     * Installed skills the add-step picker offers.
     *
     * A step is a skill bound to a card, so the picker lists the skills this session can
     * actually invoke rather than the cards already made: picking one is what makes a step.
     */
    readonly catalog: readonly WorkbenchSkillCatalogEntry[];
    /** Whether that catalogue has been read yet. */
    readonly catalogStatus: WorkbenchCatalogStatus;
    /** Why the catalogue could not be read, when it could not; `session-not-live` is its own case. */
    readonly catalogFailure: string | undefined;
    /** Ask for the catalogue again, which a picker that is about to open its list does. */
    readonly onCatalogNeeded: () => void;
    /**
     * Create the card one skill runs as.
     * @param skill - the skill to bind the new card to.
     * @returns the new card's id, or undefined when the card could not be created.
     */
    readonly createCardForSkill: (skill: string) => Promise<string | undefined>;
    /**
     * Rename the card one step runs as, which is the name the step shows.
     * @param cardId - the step's card.
     * @param name - the new name; the caller ignores an empty or unchanged one.
     */
    readonly renameStepCard: (cardId: string, name: string) => void;
    /**
     * Write one field into every step's card, one card at a time.
     *
     * The cards are written in order and each write carries the revision the previous one
     * produced, so "change once, every step follows" cannot tear halfway through on a
     * conflict.
     * @param cardIds - the cards to write, in step order.
     * @param patch - the fields to set; `null` clears a field.
     */
    readonly patchStepCards: (cardIds: readonly string[], patch: StepCardPatch) => Promise<boolean>;
    /** Provider groups the model row offers; empty means the directory answered nothing. */
    readonly modelGroups: readonly WorkbenchModelGroup[];
    /**
     * The platform's directory chooser; absent means this page has no picker at all.
     *
     * A path is never typed here: a text field would let a step name a directory no chooser
     * ever confirmed, which is the decision this product already made once.
     */
    readonly workspacePicker: WorkbenchWorkspacePicker | undefined;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @param params - optional template parameters.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string;
}
/** Fields the pipeline may set on every step's card at once. */
export interface StepCardPatch {
    /** Model the cards run on; `null` clears it back to following the session. */
    readonly model?: WorkbenchCardModel | null;
    /** Permission mode the cards' runs use. */
    readonly permission?: WorkbenchSandboxMode;
    /** Directory the cards run in; `null` clears it. */
    readonly workspace?: WorkbenchCardWorkspace | null;
    /** Skill the cards run; `null` clears it. */
    readonly skill?: string | null;
    /** Instruction the cards' runs are given; `null` clears it. */
    readonly instruction?: string | null;
}
/**
 * Render the pipeline workbench.
 * @param props - stored pipelines, run engine, cards, transport, card views, and `t`.
 * @returns the two-column surface with its overlays.
 */
export declare function WorkbenchPipeline(props: WorkbenchPipelineProps): ReactNode;
export {};
