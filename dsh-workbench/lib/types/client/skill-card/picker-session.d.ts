/**
 * The session the application's own model picker is attached to.
 *
 * The composer's model seat is a session-scoped slot: it reads the directory of the
 * conversation it is rendered in. The workbench panel occupies the main column, which
 * unmounts that conversation, so while a card page is open the session list no longer
 * names the session the user came from — its `mainView` reference is gone and only
 * recency is left, which is a different chat, or this feature's own card agent.
 *
 * The picker's session is therefore remembered while it is still visible and re-read from
 * the list whenever it is held again. A card that reads this session offers the catalog
 * the user is choosing from, not the catalog of whatever session happened to move last.
 * @module dsh-workbench/client/skill-card/picker-session
 */
import type { WorkbenchSessionRow } from './session.ts';
/** The part of the client session list this reads and watches. */
export interface WorkbenchPickerSessionList {
    /**
     * Read the current list.
     * @returns the ordered ids and the rows addressing them.
     */
    getSnapshot(): {
        readonly ids: readonly string[];
        readonly byId: Readonly<Record<string, WorkbenchSessionRow | undefined>>;
    };
    /**
     * Observe list changes.
     * @param listener - change callback.
     * @returns the unsubscribe function.
     */
    subscribe(listener: () => void): () => void;
}
/** Reads the session the app's model picker is attached to. */
export interface WorkbenchPickerSession {
    /**
     * Read that session.
     * @returns the session id, or undefined while none has ever been held.
     */
    current(): string | undefined;
}
/**
 * Track the session the main view holds.
 *
 * The held answer wins while it exists, so a session the user opened after the panel
 * appeared is still found; the remembered one answers while the panel has the main column
 * to itself. An addressed subagent is never a picker session: those sessions expose no
 * model selection of their own.
 * @param list - the client session list.
 * @returns the tracker.
 */
export declare function createPickerSession(list: WorkbenchPickerSessionList): WorkbenchPickerSession;
