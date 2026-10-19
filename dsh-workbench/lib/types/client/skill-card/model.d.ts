/**
 * The card's model field: what it offers, what it falls back to, and when a card cannot
 * run at all.
 *
 * The model catalog belongs to `ui-model-selection`, which is a service this plugin may
 * not have. Everything here therefore reads a *narrowed* directory — the four facts this
 * feature uses — and never calls `select()`: a card chooses the model its own runs use,
 * never the session's model.
 *
 * The deciding question throughout is "is there a model we can run with", never "did the
 * picker load". A directory that failed to answer while the session's saved selection is
 * still known leaves the card runnable, and a catalog that loaded but saved nothing known
 * does not make one up.
 * @module dsh-workbench/client/skill-card/model
 */
import type { WorkbenchCardModel } from '../../skill-card-contract.ts';
/** One model as a picker shows it. */
export interface WorkbenchModelOption {
    /** Model id the provider advertises. */
    readonly id: string;
    /** Display name; the field labels options with this, never with the id. */
    readonly name: string;
}
/** One provider and the models it offers. */
export interface WorkbenchModelGroup {
    /** Provider route id. */
    readonly id: string;
    /** Display name of the provider, used as the option group's label. */
    readonly name: string;
    /** Models this provider advertises. */
    readonly models: readonly WorkbenchModelOption[];
}
/** Lifecycle of the directory read, as the picker needs to know it. */
export type WorkbenchModelDirectoryStatus = 'idle' | 'loading' | 'ready' | 'selecting' | 'error';
/**
 * What the model directory knows about one session, narrowed to what the field reads.
 *
 * `available: false` means the service is missing or refused this session (an addressed
 * subagent has no model selection of its own), which is a different fact from a
 * directory that answered with nothing.
 */
export interface WorkbenchModelDirectoryView {
    /** Whether a directory answered at all. */
    readonly available: boolean;
    /** Lifecycle of that directory's own load. */
    readonly status: WorkbenchModelDirectoryStatus;
    /** The session's saved selection, retained even when its model left the catalog. */
    readonly current: WorkbenchCardModel | null;
    /** Provider groups from the directory's last good load. */
    readonly groups: readonly WorkbenchModelGroup[];
}
/** The view of a directory this client cannot reach at all. */
export declare const NO_MODEL_DIRECTORY: WorkbenchModelDirectoryView;
/**
 * What the configuration page renders for the model, and whether a run can start.
 *
 * Three states rather than a picker plus flags, because the run control's answer and the
 * field's answer have to be the same answer: a field that says "unavailable" beside an
 * enabled Run button is the bug this type exists to make impossible.
 */
export type WorkbenchModelField = 
/** A usable catalog: a grouped picker, with one concrete route selected. */
{
    readonly kind: 'ready';
    readonly groups: readonly WorkbenchModelGroup[];
    readonly selected: WorkbenchCardModel;
}
/** A route is known but no catalog can offer it: the name is shown, not selectable. */
 | {
    readonly kind: 'fixed';
    readonly model: WorkbenchCardModel;
    readonly name?: string;
}
/** No route is known, so nothing can run: there is no model to name on a result. */
 | {
    readonly kind: 'unavailable';
};
/**
 * Resolve the field from the card's stored route and the directory's answer.
 *
 * `stored` wins over the session's selection everywhere: a card that names a model runs
 * on that model, and the session's own choice is only the default a card without one
 * displays.
 * @param stored - the route this card stores, when it has one.
 * @param directory - what the model directory answered.
 * @returns the field state.
 */
export declare function resolveModelField(stored: WorkbenchCardModel | undefined, directory: WorkbenchModelDirectoryView): WorkbenchModelField;
/**
 * Encode one route as a select option's value.
 *
 * A JSON pair rather than a `"provider/model"` string for the same reason the route is
 * stored as a pair: an option value must be decodable without guessing where the provider
 * ends.
 * @param model - the route.
 * @returns the option value.
 */
export declare function modelKey(model: WorkbenchCardModel): string;
/**
 * Decode one select option's value.
 * @param value - the option value.
 * @returns the route, or undefined when the value was not produced by {@link modelKey}.
 */
export declare function parseModelKey(value: string): WorkbenchCardModel | undefined;
/**
 * The read/subscribe pair the pages consume.
 *
 * A seat rather than the directory itself, so a page never touches the service and a spec
 * never needs a Cordis context.
 */
export interface WorkbenchModelSeat {
    /**
     * Read what the directory currently knows about one session.
     * @param sessionId - the session a run would hang off.
     * @returns the narrowed view; unavailable when there is no directory to ask.
     */
    read(sessionId: string | undefined): WorkbenchModelDirectoryView;
    /**
     * Observe that directory until disposed.
     * @param sessionId - the session a run would hang off.
     * @param listener - called whenever the directory's state changes.
     * @returns the unsubscribe function; a no-op when there is no directory to watch.
     */
    subscribe(sessionId: string | undefined, listener: () => void): () => void;
}
/** One model-selection directory, narrowed to the snapshot this feature reads. */
export interface WorkbenchModelDirectory {
    readonly store: {
        /**
         * Read the current state.
         * @returns the directory state.
         */
        getSnapshot(): WorkbenchModelDirectoryState;
        /**
         * Observe state changes.
         * @param listener - change callback.
         * @returns the unsubscribe function.
         */
        subscribe(listener: () => void): () => void;
    };
}
/** The directory state fields this feature reads; the upstream type has more. */
export interface WorkbenchModelDirectoryState {
    readonly current: {
        readonly provider: string;
        readonly model: string;
    } | null;
    readonly status: WorkbenchModelDirectoryStatus;
    readonly groups: readonly {
        readonly id: string;
        readonly name: string;
        readonly models: readonly {
            readonly id: string;
            readonly name: string;
        }[];
    }[];
}
/** The one resolver method this feature calls. */
export interface WorkbenchModelDirectoryResolver {
    /**
     * Resolve one session's directory.
     * @param sessionId - the session to resolve.
     * @returns its directory.
     * @throws for a session that has no model selection of its own.
     */
    directoryFor(sessionId: string): WorkbenchModelDirectory;
}
/**
 * Build the seat over a resolver that may arrive after the pages exist.
 *
 * The resolver is read through a getter rather than captured, because the service is
 * injected scoped: a composition without it leaves the getter answering undefined for the
 * whole session, which reads as "no model known" rather than as a missing plugin.
 * @param resolver - getter for the resolver, or undefined while none is registered.
 * @returns the seat.
 */
export declare function createModelSeat(resolver: () => WorkbenchModelDirectoryResolver | undefined): WorkbenchModelSeat;
