/**
 * The shell every workbench card renders inside.
 *
 * The shell owns the frame, the reorder handle, and the removal action, so
 * every card looks and behaves alike. The card supplies its presentation facts
 * as props and its body as a local slot component.
 *
 * Two of those facts are opt-in: the status dot is drawn from `state` and the
 * refresh control from `onRefresh`, so a card that passes neither renders
 * neither — the shipped card renders its run state on its own result page
 * instead of on the card face.
 *
 * {@link WorkbenchCardShell} is the registered factory: it resolves the
 * framework seats and delegates to {@link WorkbenchCardShellView}, which takes
 * plain data so a component spec can drive it without render machinery.
 * @module dsh-workbench/client/WorkbenchCardShell
 */
import type { ReactNode } from 'react';
import type { FactoryComponentPropsOf } from '@deepseek-ai/dsh-client-ui-slots';
import type { WorkbenchCardState } from './contract.ts';
import type { WorkbenchLocaleKey } from './locales.ts';
/** Composed props of one `workbench.card` occurrence. */
export type WorkbenchCardShellProps = FactoryComponentPropsOf<'workbench.card'>;
/** Plain inputs of the shell's presentation. */
export interface WorkbenchCardShellViewProps {
    /** Card identity, used for the title's id and the shell's data attributes. */
    readonly id: string;
    /** Card title, already localized by the providing plugin. */
    readonly title: string;
    /** Optional secondary line. */
    readonly subtitle?: string | undefined;
    /** Grid footprint; `standard` when omitted. */
    readonly span?: 'standard' | 'wide' | 'tall' | 'large' | undefined;
    /** Status semantics; omitted draws no status dot. */
    readonly state?: WorkbenchCardState | undefined;
    /** Status text; omitted falls back to the localized state name. */
    readonly status?: string | undefined;
    /** Readable reason the body cannot render. */
    readonly failure?: string | undefined;
    /** Grid position among the visible cards, one-based. */
    readonly position: number;
    /** Whether the reorder handle is offered. */
    readonly reorderable: boolean;
    /** Whether a drag session is running. */
    readonly dragging: boolean;
    /** Card body. */
    readonly body?: ReactNode;
    /** Card actions rendered beside the host's controls. */
    readonly actions?: ReactNode;
    /** Refresh action; omitted hides the control. */
    readonly onRefresh?: (() => void) | undefined;
    /**
     * Activate the card itself, opening whatever the card presents in full.
     *
     * The shell cannot wrap the card in a `<button>`: the card hosts its own controls
     * in the head action area, and a button inside a button is invalid markup that
     * browsers reparent. The card is therefore a labelled region with an activation
     * key handler, and the head action area stops its clicks from reaching it.
     * Omitted leaves the card inert.
     */
    readonly onActivate?: (() => void) | undefined;
    /** Remove the card and everything stored for it; omitted renders no remove control. */
    readonly onRemove?: (() => void) | undefined;
    /** Move by one position. */
    readonly onMoveBy: (delta: -1 | 1) => void;
    /** Cancel the current drag session. */
    readonly onCancelDrag: () => void;
    /**
     * Translate one workbench string.
     * @param key - dictionary key.
     * @returns the localized text.
     */
    readonly t: (key: WorkbenchLocaleKey) => string;
}
/**
 * Render one card inside the shared shell.
 * @param props - card presentation facts and host callbacks.
 * @returns the card element.
 */
export declare function WorkbenchCardShellView({ id, title, subtitle, span, state, status, failure, position, reorderable, dragging, body, actions, onRefresh, onActivate, onRemove, onMoveBy, onCancelDrag, t, }: WorkbenchCardShellViewProps): ReactNode;
/**
 * Render one card through the framework's seats.
 * @param props - card presentation facts, occurrence props, and the shell's seats.
 * @returns the card element.
 */
export declare function WorkbenchCardShell({ id, title, subtitle, span, state, status, onRefresh, onActivate, onRemove, failure, reorderable, position, useFactorySlot, t, }: WorkbenchCardShellProps): ReactNode;
