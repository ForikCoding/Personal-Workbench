/**
 * Skill card store: reads and writes the card selection, per-skill templates,
 * and stored results over the skill card storage domain.
 *
 * It owns the revision that makes a concurrent write visible to the client that
 * lost the race, and it bounds every stored value by byte budget before the
 * value reaches the domain.
 * @module dsh-workbench/skill-card-store
 */
import type { WorkbenchCardConfigRecord, WorkbenchCardResult, WorkbenchResultRecord, WorkbenchSkillCardPatch, WorkbenchSkillCardSnapshot, WorkbenchTemplateRecord } from './skill-card-contract.ts';
/** Read/write side of one declared domain table, as this store consumes it. */
export interface SkillCardTable<T> {
    /**
     * Read one record from memory.
     * @param key - record key.
     * @returns the stored record, or `undefined` when absent.
     */
    get(key: string): T | undefined;
    /**
     * Snapshot the stored pairs.
     * @returns the pair iterator, stable while queued writes land.
     */
    entries(): IterableIterator<[string, T]>;
    /**
     * Insert or overwrite one record durably.
     * @param key - record key.
     * @param value - the complete new record.
     * @returns resolution after durability.
     */
    put(key: string, value: T): Promise<void>;
    /**
     * Delete one record durably.
     * @param key - record key.
     * @returns whether a record was removed.
     */
    delete(key: string): Promise<boolean>;
}
/** Change subscription this store consumes, satisfied by the Cordis context. */
export interface SkillCardChangeSource {
    /**
     * Subscribe to Host events.
     * @param event - event name.
     * @param listener - change callback.
     * @returns the unsubscribe function.
     */
    on(event: 'domain/changed', listener: (change: {
        readonly domain: string;
    }) => void): () => void;
}
/** Result of one configuration write attempt. */
export type WorkbenchSkillCardWriteResult = {
    readonly status: 'written';
    readonly snapshot: WorkbenchSkillCardSnapshot;
} | {
    readonly status: 'conflict';
    readonly snapshot: WorkbenchSkillCardSnapshot;
} | {
    readonly status: 'invalid';
    readonly reason: string;
};
/** Outcome of one hand edit of a stored result. */
export type WorkbenchResultEditOutcome = 
/** Stored; the record is the one the client can now show. */
{
    readonly status: 'written';
    readonly result: WorkbenchCardResult;
}
/** The card holds no result, so there is no record whose run facts could stand. */
 | {
    readonly status: 'missing';
}
/** The edit cannot be stored as given. */
 | {
    readonly status: 'invalid';
    readonly reason: string;
}
/**
 * The edit is larger than one stored result may be, in bytes.
 *
 * Refused rather than trimmed: a trimmed result would store one thing and display
 * another, which is exactly the failure this budget exists to prevent.
 */
 | {
    readonly status: 'too-large';
    readonly bytes: number;
};
/** What the store needs from its Host context. */
export interface WorkbenchSkillCardStoreOptions {
    /** Storage domain name, used to filter change events. */
    readonly domainName: string;
    /** Table holding one skill selection per card. */
    readonly card: SkillCardTable<WorkbenchCardConfigRecord>;
    /** Table holding one template per card and skill. */
    readonly template: SkillCardTable<WorkbenchTemplateRecord>;
    /** Table holding one result per card. */
    readonly result: SkillCardTable<WorkbenchResultRecord>;
    /** Host event source. */
    readonly events: SkillCardChangeSource;
    /** Bytes one template may occupy. */
    readonly maxTemplateBytes: number;
    /** Templates one card may hold. */
    readonly maxTemplatesPerCard: number;
    /** Bytes one result may occupy. */
    readonly maxResultBytes: number;
    /** Process start stamp folded into the revision; tests pass a fixed value. */
    readonly bootStamp: number;
    /**
     * Clock for the moments the store itself stamps.
     *
     * Only a hand edit needs one: it refreshes `executedAt` and sets `editedAt`, and a spec
     * has to assert those two without waiting for a real second to pass.
     * @returns milliseconds since the epoch.
     */
    readonly now?: () => number;
}
/** Errors raised while writing skill card storage, carrying the route's error code. */
export declare class WorkbenchSkillCardStorageError extends Error {
    readonly operation: 'put' | 'delete';
    /**
     * @param operation - the storage operation that failed.
     * @param cause - the underlying failure.
     */
    constructor(operation: 'put' | 'delete', cause: unknown);
}
/** Skill card configuration and result store over three storage domain tables. */
export declare class WorkbenchSkillCardStore {
    private readonly options;
    private changeCount;
    private readonly disposeChange;
    /**
     * @param options - domain name, tables, event source, byte budgets, and boot stamp.
     */
    constructor(options: WorkbenchSkillCardStoreOptions);
    /** Current revision: boot stamp plus the number of durable changes seen. */
    get revision(): string;
    /**
     * Read the complete configuration and result state.
     *
     * A card appears when it has a selection, a template, or both, so a card
     * holding templates for skills but no current selection still shows them.
     * @returns cards and results ascending by card id, with the current revision.
     */
    read(): WorkbenchSkillCardSnapshot;
    /**
     * Apply one configuration patch.
     *
     * A patch whose `baseRevision` is not current is refused without writing, and
     * answered with the state the client has to reconcile against.
     * @param patch - card, selection, and optional template to store.
     * @returns the write outcome.
     */
    write(patch: WorkbenchSkillCardPatch): Promise<WorkbenchSkillCardWriteResult>;
    /**
     * Store one execution result, trimmed to the deployment's byte budget.
     * @param cardId - card the result belongs to.
     * @param record - the complete result.
     * @returns resolution after durability.
     */
    putResult(cardId: string, record: WorkbenchResultRecord): Promise<void>;
    /**
     * Replace one card's region HTML with a hand-edited fragment.
     *
     * A save must not fabricate a run, so everything a run owned stays as it is: the skill
     * and the stop reason are kept, the raw output and the diagnostic are kept, and only
     * `structured.html` is replaced. `executedAt` is refreshed because the record's time is
     * what the page shows as when the result it displays came about, and `editedAt` says
     * how. A later run overwrites the whole record, which is the existing semantics of
     * running a card.
     *
     * Nothing here trims: a value over the budget is refused. Trimming a hand edit would
     * store a document the user did not write and display a different one.
     * @param cardId - card whose stored result is being edited.
     * @param html - the region HTML to store, verbatim.
     * @returns the stored record, or why the edit was refused.
     */
    putEditedResult(cardId: string, html: string): Promise<WorkbenchResultEditOutcome>;
    /** Stop observing domain changes. Idempotent. */
    dispose(): void;
    /**
     * Reject a patch that cannot be stored.
     * @param patch - candidate patch.
     * @returns a human-readable reason, or undefined when the patch is storable.
     */
    private validate;
    /**
     * Count the templates one card holds.
     * @param cardId - card identity.
     * @returns the number of stored templates addressed to that card.
     */
    private countTemplates;
    /**
     * Run one storage operation, naming the failing operation in the error.
     * @param operation - operation discriminant.
     * @param run - the storage call.
     * @returns resolution after the call settles.
     */
    private run;
    /**
     * Read the clock the store stamps records with.
     * @returns milliseconds since the epoch.
     */
    private moment;
}
