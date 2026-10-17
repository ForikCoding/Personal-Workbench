/** The sidebar's Workbench entry icon; the sidebar owns the row, label, and selected state around it. */
import type { ReactNode } from 'react';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/**
 * Render the workbench glyph at the size the sidebar asks for.
 * @param props - the sidebar's icon share: requested edge and whether the panel is selected.
 * @returns the icon element.
 */
export declare function WorkbenchPanelIcon({ size }: PropsRuntime<'sidebar.panellist'>): ReactNode;
