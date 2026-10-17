/**
 * The workbench panel identity, kept in its own module so a card package can
 * import it without pulling in the page implementation.
 * @module dsh-workbench/client/workbench-panel
 */
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client';
/** Sidebar row id, shared with the main-slot key it opens. A product-reserved key. */
export declare const WORKBENCH_PANEL_ID: MainPanelId;
