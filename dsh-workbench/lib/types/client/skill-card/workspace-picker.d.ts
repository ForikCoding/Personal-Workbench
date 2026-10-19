/**
 * Asking the user for a directory, on whichever platform this page is running.
 *
 * Two sources, and the desktop one comes first. On Windows the Desktop plugin publishes a
 * picker on the window ({@link WorkbenchDesktopPickerWindow}) and installs a same-origin
 * route behind it; everywhere else the workspace UI's own `pickDirectory()` is the picker,
 * which is the same call the app's own browse panel makes there. There is deliberately no
 * third path: the product owner rejected free-text paths, and a text field would let a card
 * name a directory no chooser ever confirmed.
 *
 * Nothing here throws. A route that is absent, refused, or answered with junk is reported
 * as "no picker", so the page states a disabled control instead of an error boundary.
 * @module dsh-workbench/client/skill-card/workspace-picker
 */
/**
 * Window seam the Desktop plugin publishes on Windows only.
 *
 * Structurally `dsh-plugin-desktop/src/client/directory-picker.ts`, which sets this member
 * from `installDesktopDirectoryPickerBridge()` and removes it again on dispose. Its
 * presence is the platform signal: nothing else in this plugin has to know which OS it is
 * running on, and a build without the desktop plugin simply has no member.
 */
export interface WorkbenchDesktopPickerWindow {
    __DSH_DESKTOP_PICK_DIRECTORY__?: () => Promise<string | null>;
}
/**
 * What one pick attempt produced.
 *
 * Cancellation is its own case and not a failure: the user closing the chooser is an
 * answer, and the stored path must stay exactly as it was.
 */
export type WorkbenchWorkspacePick = {
    readonly status: 'picked';
    readonly path: string;
} | {
    readonly status: 'cancelled';
} | {
    readonly status: 'unavailable';
    readonly reason: string;
};
/** The picker sources, read fresh on every call because they arrive as plugins load. */
export interface WorkbenchWorkspacePickerSources {
    /** Desktop's Windows-only native picker, when that plugin published it. */
    readonly native?: () => Promise<string | null>;
    /** The workspace UI's own picker, which every other platform answers with. */
    readonly workspace?: () => Promise<string | null>;
}
/** The picker as the configuration page consumes it. */
export interface WorkbenchWorkspacePicker {
    /** Whether a picker exists at all right now. */
    available(): boolean;
    /**
     * Ask the user for one directory.
     * @returns the chosen path, that the user cancelled, or why there was no picker.
     */
    pick(): Promise<WorkbenchWorkspacePick>;
}
/**
 * Read the Desktop plugin's picker off the window, when it published one.
 * @param target - the object to read; the global scope by default.
 * @returns the picker, or undefined when this page has none.
 */
export declare function readDesktopPicker(target?: unknown): (() => Promise<string | null>) | undefined;
/**
 * Build the picker over sources that may arrive after the page exists.
 *
 * The sources are read through a getter rather than captured, because the workspace UI is
 * injected scoped: a composition without it answers "no picker" for the whole session,
 * which reads as a disabled control rather than as a missing plugin.
 * @param sources - getter for the sources, read on every call.
 * @returns the picker.
 */
export declare function createWorkspacePicker(sources: () => WorkbenchWorkspacePickerSources): WorkbenchWorkspacePicker;
