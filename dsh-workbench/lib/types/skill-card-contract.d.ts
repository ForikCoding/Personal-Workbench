/**
 * Wire contract shared by the skill card's Host and Client halves: the private
 * routes, their payload types, the limits both sides enforce, and the closed
 * error-code set.
 *
 * Like the layout contract this module carries no runtime dependency, so the
 * browser bundle can inline it. Card identity reuses the workbench's existing
 * rule from the layout contract rather than restating it.
 * @module dsh-workbench/skill-card-contract
 */
/** Private same-origin route serving the skill card's configuration and results. */
export declare const WORKBENCH_SKILL_CARD_PATH = "/api/workbench/skill-card";
/** Session-scoped skill catalog route. */
export declare const WORKBENCH_SKILL_CARD_CATALOG_PATH = "/api/workbench/skill-card/catalog";
/** Run control route: `POST` starts, `GET` polls, `DELETE` cancels. */
export declare const WORKBENCH_SKILL_CARD_RUN_PATH = "/api/workbench/skill-card/run";
/**
 * Stored-result edit route: `PUT` replaces one card's region HTML by hand.
 *
 * A route of its own rather than a fourth method on the run route: editing a result is
 * not a run. It spends no model call, it has no phase to poll, and bending the run route
 * into it would make every run precondition answer for an operation that does not run
 * anything.
 */
export declare const WORKBENCH_SKILL_CARD_RESULT_PATH = "/api/workbench/skill-card/result";
/**
 * Directory-check route: `GET path=…` answers whether one directory can be a workspace.
 *
 * One narrow read rather than a filesystem bridge: the client needs existence, kind, and
 * writability for exactly one path, which is the card's own workspace. Answers exist
 * because a run is gated on them: a card whose directory was moved has to be stopped
 * before it starts, not after it fails.
 */
export declare const WORKBENCH_SKILL_CARD_DIRECTORY_PATH = "/api/workbench/skill-card/directory";
/** Contract version echoed in every response; a mismatched client refuses to parse. */
export declare const WORKBENCH_SKILL_CARD_API_VERSION = 1;
/** Maximum bytes of one template. */
export declare const WORKBENCH_TEMPLATE_MAX_BYTES: number;
/** Maximum number of skills one card may keep a template for. */
export declare const WORKBENCH_TEMPLATE_MAX_PER_CARD = 16;
/** Maximum bytes of one stored result, counted over the structured value and the text output. */
export declare const WORKBENCH_RESULT_MAX_BYTES: number;
/**
 * Longest revision instruction a refine run accepts, in characters.
 *
 * The instruction is the user's own sentence about what to change, so the limit only
 * bounds what one request carries and what the prompt spends on it; it is not a
 * grammar. A paragraph is far more than a revision ever needs.
 */
export declare const WORKBENCH_REFINE_INSTRUCTION_MAX_LENGTH = 2000;
/**
 * Maximum bytes of the previous result a refine run replays into its prompt.
 *
 * The previous result is the region HTML of a stored result, so this is the same
 * number that bounds a stored result: anything the card can show, it can revise.
 */
export declare const WORKBENCH_REFINE_PREVIOUS_MAX_BYTES: number;
/** Maximum request-body bytes accepted by the configuration route. */
export declare const WORKBENCH_SKILL_CARD_MAX_BODY_BYTES: number;
/**
 * How many entries one run's activity trace keeps, before the oldest are dropped.
 *
 * 64 rows is more than anyone reads in 运行详情; a longer run is summarised by the count it
 * dropped rather than by an unbounded array. The count is not the trace's only bound: the
 * narration budget ({@link WORKBENCH_ACTIVITY_TOTAL_TEXT_MAX_LENGTH}) drops the oldest
 * entries too, whichever limit bites first, so neither many short calls nor a few very long
 * thoughts can make the trace the run's largest payload.
 */
export declare const WORKBENCH_ACTIVITY_MAX_ENTRIES = 64;
/**
 * Longest first argument one activity entry carries, in characters.
 *
 * A data-leak boundary rather than a layout preference: an argument is model-authored and
 * may hold a command, a path, or a value a tool was handed. 60 characters is enough to
 * recognise the call and not enough to reconstruct a payload or a file's contents.
 */
export declare const WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH = 60;
/**
 * Longest narration text one activity entry carries, in characters.
 *
 * Narration is the model's own words — its reasoning and its reply text — and the card lets
 * the user open a row to read all of it, so the entry carries the whole span up to this
 * budget rather than a preview; the client clamps it to two lines until the user expands.
 * 3000 characters covers the thinking of an ordinary step whole; a pathological step is cut
 * with the ellipsis, and {@link WORKBENCH_ACTIVITY_TOTAL_TEXT_MAX_LENGTH} bounds the trace.
 * Redaction runs before this cut, so a credential is replaced whole.
 */
export declare const WORKBENCH_ACTIVITY_TEXT_MAX_LENGTH = 3000;
/**
 * Most narration characters one whole trace keeps, across all its entries.
 *
 * The per-entry budget alone cannot bound the trace: 64 entries at 3000 characters each is
 * hundreds of kilobytes, and the trace rides every poll of a running card. When this budget
 * is exceeded the oldest entries are dropped — and counted by the marker — so a run that
 * thinks a lot keeps its recent thinking readable instead of its oldest thinking enormous.
 */
export declare const WORKBENCH_ACTIVITY_TOTAL_TEXT_MAX_LENGTH = 12000;
/**
 * Narration length, in characters, beyond which the client offers 展开/收起.
 *
 * Two lines of the card's trace hold roughly this much; shorter narration is shown whole
 * with no toggle, because a control that expands nothing is noise.
 */
export declare const WORKBENCH_ACTIVITY_PREVIEW_LENGTH = 120;
/**
 * The child's schema-emission tool, kept out of the activity trace.
 *
 * A run's final structured output is emitted through this tool, and the emitted value is
 * the card's own result — the same content the result page already shows. A row for the
 * call would display that value a second time, cut to an argument, so the call is neither
 * recorded nor rendered. The shared constant keeps the builder and the client filter on
 * the same name.
 */
export declare const WORKBENCH_ACTIVITY_STRUCTURED_OUTPUT_TOOL = "structured_output";
/**
 * One tool call a run's child made, as the activity trace records it.
 *
 * Two fields and nothing else: the tool's name, and the first argument it was given,
 * already redacted and truncated. The raw arguments are never carried — not by this
 * record, not by the wire, and not into the child's persisted trace.
 */
export interface WorkbenchToolActivity {
    /** Discriminates a real entry from the {@link WorkbenchTraceTruncation} marker. */
    readonly kind: 'tool';
    /** Tool name exactly as the tool registry names it, e.g. `pwsh` or `read`. */
    readonly tool: string;
    /** The call's first argument, redacted and cut to {@link WORKBENCH_ACTIVITY_ARGUMENT_MAX_LENGTH}. */
    readonly argument: string;
}
/**
 * One span of the model's own words, as the activity trace records it.
 *
 * `reasoning` is the thinking the model emits before a step; `text` is what it says to the
 * user. Both are redacted and cut to {@link WORKBENCH_ACTIVITY_TEXT_MAX_LENGTH}, and both
 * are shown next to the tool calls so a card reads like a conversation rather than a
 * tool log. The client shows two lines and expands to the stored text on demand, which is
 * why the entry keeps the whole span rather than a preview. The raw message is never
 * carried.
 */
export interface WorkbenchNarrationActivity {
    /** Which kind of narration this is: the thinking, or the reply text. */
    readonly kind: 'reasoning' | 'text';
    /** The narration, redacted and cut to {@link WORKBENCH_ACTIVITY_TEXT_MAX_LENGTH}. */
    readonly text: string;
}
/**
 * How many earlier entries a bounded trace omitted.
 *
 * A first-class entry rather than a second field on the record: truncation has to be
 * visible wherever the trace travels, and a marker inside the array is one thing to render,
 * one thing to store, and one thing to keep in budget. Silence would read as "this run
 * only called three tools" when it called thirty.
 */
export interface WorkbenchTraceTruncation {
    /** Discriminates this marker from a real {@link WorkbenchToolActivity}. */
    readonly kind: 'truncated';
    /** Entries dropped from the front of the trace. Always at least one. */
    readonly dropped: number;
}
/**
 * One element of a run's activity trace.
 *
 * The trace is what the child is doing while it runs: one call entry per tool call, one
 * narration entry for each span of the model's own words — its reasoning and its reply
 * text — in the order they happened, and the marker that says what a bounded trace left
 * out.
 */
export type WorkbenchActivityEntry = WorkbenchToolActivity | WorkbenchNarrationActivity | WorkbenchTraceTruncation;
/**
 * Name of the comment that opens the region a child fills.
 *
 * A template is a whole document: styles and headings say how the result looks but
 * nothing about what to report. The markers delimit the part that does, and the
 * comments inside that part are the instruction.
 */
export declare const WORKBENCH_REGION_BEGIN = "template-begin";
/** Name of the comment that closes the region a child fills. */
export declare const WORKBENCH_REGION_END = "template-end";
/**
 * Build the pattern matching one region marker comment.
 *
 * A fresh pattern per call: a shared global regex carries `lastIndex` between callers.
 * @param name - marker name, without the comment delimiters.
 * @returns the pattern.
 */
export declare function regionMarkerPattern(name: string): RegExp;
/**
 * The output contract every run asks its child for.
 *
 * One property: the child returns the filled region as HTML rather than a set of named
 * values, because the template's own comments say what to produce. There is no field
 * list left to validate against, so nothing about the result can fail on shape.
 */
export declare const WORKBENCH_OUTPUT_SCHEMA: {
    type: string;
    properties: {
        html: {
            type: string;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
/**
 * Attribute carrying the action key on a button a child authored.
 *
 * The key names a declaration the template holds, never a card or skill directly: the
 * child may choose which declared target a row uses, but it cannot invent one.
 */
export declare const WORKBENCH_ACTION_ATTRIBUTE = "data-dsh-action";
/** Attribute carrying that row's raw fields, as JSON, on the same button. */
export declare const WORKBENCH_PAYLOAD_ATTRIBUTE = "data-dsh-row";
/**
 * The only attributes that produce behaviour.
 *
 * Closed on purpose. Reading is driven by this list rather than by a prefix, so an
 * attribute a reader has not been taught — including a typo of one of these — does
 * nothing at all instead of silently becoming a different action.
 */
export declare const WORKBENCH_ACTION_ATTRIBUTES: readonly ["data-dsh-action", "data-dsh-row"];
/** Action key grammar, the same shape as an MCP server name. */
export declare const WORKBENCH_ACTION_KEY_PATTERN: RegExp;
/**
 * Budget for one payload attribute, in UTF-8 bytes.
 *
 * A payload over budget is refused rather than truncated: a shortened payload would
 * make the confirmation panel show one set of parameters while the run used another.
 */
export declare const WORKBENCH_ACTION_PAYLOAD_MAX_BYTES: number;
/**
 * Marker opening the block where a template declares its action targets.
 *
 * The declaration lives in the template, outside the filled region, because the region
 * is rewritten by the child on every run. A target the child could author would be a
 * target the child could invent.
 */
export declare const WORKBENCH_ACTIONS_MARKER = "dsh-actions";
/** What one declared action points at. */
export type WorkbenchActionTarget = {
    readonly kind: 'card';
    readonly name: string;
} | {
    readonly kind: 'skill';
    readonly name: string;
};
/** One target a template declares, addressed by the key its buttons carry. */
export interface WorkbenchActionDeclaration {
    /** Key a button references through `data-dsh-action`. */
    readonly key: string;
    /** What that key resolves to. */
    readonly target: WorkbenchActionTarget;
}
/**
 * Skill name grammar, matching the skill registry's own rule exactly: kebab
 * case, with no leading, trailing, or repeated hyphen.
 */
export declare const WORKBENCH_SKILL_NAME_PATTERN: RegExp;
/**
 * Longest skill name the workbench accepts.
 *
 * The skill registry imposes no length limit of its own; this one bounds a
 * client-supplied name at the wire boundary and keeps the composite storage key
 * short. Real names come from directory names, which sit far below it.
 */
export declare const WORKBENCH_SKILL_NAME_MAX_LENGTH = 64;
/**
 * Longest card name the workbench stores.
 *
 * A card name is the user's own label and appears on the card face, so it is free
 * text rather than a grammar. The limit only bounds what one card record carries
 * and what the card face has to lay out.
 */
export declare const WORKBENCH_CARD_NAME_MAX_LENGTH = 60;
/**
 * Whether a value is a usable card name.
 *
 * Whitespace is not part of the name, and a name that is only whitespace is no
 * name at all: the card falls back to its registered label instead.
 * @param value - candidate name.
 * @returns whether the value holds visible text within the length limit.
 */
export declare function isWorkbenchCardName(value: string): boolean;
/**
 * Whether a value addresses a registered skill.
 * @param value - candidate skill name.
 * @returns whether the value is a kebab-case name within the length limit.
 */
export declare function isWorkbenchSkillName(value: string): boolean;
/**
 * Compose the storage key holding one card's template for one skill.
 * @param cardId - workbench card identity.
 * @param skill - skill name.
 * @returns the composite record key.
 */
export declare function templateKey(cardId: string, skill: string): string;
/**
 * Split a composite template key.
 * @param key - a key produced by {@link templateKey}.
 * @returns the two halves, or undefined when the key is not composite.
 */
export declare function parseTemplateKey(key: string): {
    readonly cardId: string;
    readonly skill: string;
} | undefined;
/**
 * One exact provider/model route a card runs on.
 *
 * Stored as the pair rather than as a `"provider/model"` string: a provider id may
 * itself contain a slash, so splitting the joined form back into two fields would be a
 * bug farm. `reasoningEffort` is deliberately absent — v1 pins the route and nothing
 * else, and an effort the card never chose would be a value it never had.
 */
export interface WorkbenchCardModel {
    /** Provider route owning the model. */
    readonly provider: string;
    /** Model id the provider advertises. */
    readonly model: string;
}
/**
 * Whether a value is a usable card route.
 * @param value - candidate value.
 * @returns whether it holds two non-empty ids.
 */
export declare function isWorkbenchCardModel(value: unknown): value is WorkbenchCardModel;
/**
 * Longest workspace path the workbench stores, in characters.
 *
 * A bound rather than a grammar: the platform decides what a legal path is, and this
 * only keeps one stored record from carrying an unbounded string. Real picked paths sit
 * far below it — Windows' own extended-length ceiling is 32,767.
 */
export declare const WORKBENCH_WORKSPACE_PATH_MAX_LENGTH = 4096;
/**
 * Whether a value can be stored as a card's workspace path.
 *
 * The full absolute path is the whole of the value — never a workspace id — because the
 * product decision is "whatever directory the user picks", which need not be a registered
 * workspace at all. A relative path is refused rather than resolved against something:
 * resolved against the session it would be a different directory per run, and resolved
 * against the Host it would be a directory the user never saw.
 * @param value - candidate path, as a picker reported it.
 * @returns whether it is an absolute path within the length limit.
 */
export declare function isWorkbenchWorkspacePath(value: string): boolean;
/**
 * One card's working directory.
 *
 * A one-field object rather than a bare string so the record can grow — a display name,
 * a validation stamp — without making the stored value ambiguous. The path itself is
 * stored verbatim, exactly as the picker reported it.
 */
export interface WorkbenchCardWorkspace {
    /** Absolute directory path, as the platform wrote it. */
    readonly path: string;
}
/**
 * Whether a value is a usable card workspace.
 * @param value - candidate value.
 * @returns whether it holds one absolute directory path.
 */
export declare function isWorkbenchCardWorkspace(value: unknown): value is WorkbenchCardWorkspace;
/**
 * Every permission mode a card may run under.
 *
 * The upstream sandbox vocabulary, repeated here because this module carries no runtime
 * dependency. A mode added upstream that this list does not know is refused at the schema
 * and at the route rather than stored and later ignored.
 */
export declare const WORKBENCH_SANDBOX_MODES: readonly ["read-only", "workspace-write", "danger-full-access"];
/** One sandbox mode a card may name. */
export type WorkbenchSandboxMode = (typeof WORKBENCH_SANDBOX_MODES)[number];
/**
 * The mode a card runs under when it names none.
 *
 * A concrete default rather than "inherit": an unset card would otherwise run under
 * whatever the session happens to be set to, which is a permission nobody gave this card.
 * The consequence for existing cards is that they become stricter, which is intended.
 */
export declare const WORKBENCH_DEFAULT_SANDBOX_MODE: WorkbenchSandboxMode;
/**
 * Whether a value is a mode a card may store.
 * @param value - candidate value, read from storage or from a request body.
 * @returns whether it is one of {@link WORKBENCH_SANDBOX_MODES}.
 */
export declare function isWorkbenchSandboxMode(value: unknown): value is WorkbenchSandboxMode;
/**
 * Resolve the mode one run actually uses.
 *
 * This is the single place unset becomes a mode. The configuration page displays it, the
 * runner applies it and the card-agent cache keys on it, so all three read the same answer
 * instead of each defaulting differently.
 * @param stored - the mode the card stores, when it stores one.
 * @returns the stored mode, or {@link WORKBENCH_DEFAULT_SANDBOX_MODE}.
 */
export declare function effectiveWorkbenchSandboxMode(stored: WorkbenchSandboxMode | undefined): WorkbenchSandboxMode;
/**
 * What one directory check found.
 *
 * Three facts and no error case: a path that cannot be read is reported as "nothing is
 * there", because a card may not run in a directory nobody could confirm. `writable` is
 * reported but does not decide validity — a card run reads its skill and writes its
 * result into the workbench's own storage, so a read-only directory is usable.
 */
export interface WorkbenchDirectoryStat {
    /** Whether anything occupies the path. */
    readonly exists: boolean;
    /** Whether what occupies it is a directory. */
    readonly isDirectory: boolean;
    /** Whether the process could create an entry in it. */
    readonly writable: boolean;
}
/** Successful directory-check body. */
export interface WorkbenchDirectoryStatResponse extends WorkbenchDirectoryStat {
    /** Contract version this Host speaks. */
    readonly apiVersion: number;
    /** The path the answer is about, echoed so a client can attribute it. */
    readonly path: string;
}
/**
 * One card's persisted configuration.
 *
 * An absent record means "no skill chosen yet": the card renders its empty
 * state rather than guessing a default. A card with no `model` runs on whatever the
 * session runs on, exactly as it did before this field existed. A card with no
 * `workspace` cannot run at all: that is the product decision, and there is deliberately
 * no migration — nothing infers a directory on the user's behalf.
 */
export interface WorkbenchCardConfigRecord {
    /** User-assigned card name; absent falls back to the card's registered label. */
    readonly name?: string;
    /** Skill the user selected; absent means unconfigured. */
    readonly skill?: string;
    /** Model this card runs on; absent means the run inherits the session's model. */
    readonly model?: WorkbenchCardModel;
    /** Directory this card runs in; absent means the card cannot run yet. */
    readonly workspace?: WorkbenchCardWorkspace;
    /**
     * Permission mode this card's runs use; absent means
     * {@link WORKBENCH_DEFAULT_SANDBOX_MODE}.
     *
     * Stored rather than inherited so the mode is part of what the card is: a card that
     * named no mode would otherwise run under whatever the session was switched to, and
     * the configuration page would have nothing to show.
     */
    readonly permission?: WorkbenchSandboxMode;
}
/** One card's template for one skill. */
export interface WorkbenchTemplateRecord {
    /** The user's HTML. */
    readonly html: string;
}
/**
 * One stored execution result.
 *
 * `stopReason` is a plain string rather than a closed union: the upstream stop
 * reasons are merge-extensible, and closing them here would reject a value a
 * future provider legitimately adds.
 */
export interface WorkbenchResultRecord {
    /** Skill that produced the result. */
    readonly skill: string;
    /** Completion time in milliseconds since the epoch. */
    readonly executedAt: number;
    /** Why the run ended, as reported by the subagent seam. */
    readonly stopReason: string;
    /**
     * Route the run ran on, when the card named one.
     *
     * Absent means the child inherited the session's model and the Host was never told
     * which route that resolved to. It is kept in the record so the result page can state
     * which model produced a result instead of leaving the user to guess.
     */
    readonly model?: WorkbenchCardModel;
    /** The validated structured value; absent means no valid capture was committed. */
    readonly structured?: unknown;
    /** The child's final assistant output, kept for "view raw output". */
    readonly outputText?: string;
    /** Provider-authored failure detail, if any. */
    readonly diagnostic?: string;
    /**
     * When the region HTML was replaced by hand, in milliseconds since the epoch.
     *
     * Absent means every byte of this record came from a run. The field exists so the
     * result can say it was edited without pretending a run produced it, and it is
     * deliberately not a refinement-log entry: that log records instructions, and a hand
     * edit is not one.
     */
    readonly editedAt?: number;
    /**
     * What the child did while it ran, oldest first.
     *
     * Absent means the run recorded no tool call — either it needed none, or the harness it
     * ran on reported none — and 运行详情 then says nothing about activity instead of
     * drawing an empty list. Present means the trace is complete save for what its own
     * {@link WorkbenchTraceTruncation} marker admits to dropping.
     */
    readonly activity?: readonly WorkbenchActivityEntry[];
}
/**
 * Client-to-Host replacement of one card's region HTML.
 *
 * Only the HTML travels: everything else about the result — the skill, the stop reason,
 * the raw output, the diagnostic — stays exactly as the record already holds it, because
 * a hand edit is not a run and has nothing to say about any of them.
 */
export interface WorkbenchResultEditRequest {
    /** Card whose stored result is being edited. */
    readonly cardId: string;
    /** The region HTML to store, verbatim. */
    readonly html: string;
}
/** Successful result-edit body. */
export interface WorkbenchResultEditResponse {
    /** Contract version this Host speaks. */
    readonly apiVersion: number;
    /**
     * Revision after the write.
     *
     * Returned with the record so the client can refresh both halves of its snapshot from
     * one response: a result updated against a stale revision would make the next
     * configuration write conflict for no reason.
     */
    readonly revision: string;
    /** The record as stored, so the client needs no second read. */
    readonly result: WorkbenchCardResult;
}
/** One card's configuration as read, with the selected skill's template body. */
export interface WorkbenchCardConfigView {
    /** Card identity. */
    readonly cardId: string;
    /** User-assigned card name; absent means the card's registered label stands. */
    readonly name?: string;
    /** Selected skill; absent means unconfigured. */
    readonly skill?: string;
    /** Model this card runs on; absent means its runs inherit the session's model. */
    readonly model?: WorkbenchCardModel;
    /** Directory this card runs in; absent means the card cannot run until one is chosen. */
    readonly workspace?: WorkbenchCardWorkspace;
    /**
     * Permission mode this card stores; absent means the default applies.
     *
     * The stored value, not the effective one: the page resolves the default itself so an
     * unset card and a card explicitly set to the default display the same mode without the
     * read pretending a value was written.
     */
    readonly permission?: WorkbenchSandboxMode;
    /** Skills this card already holds a template for. */
    readonly templateSkills: readonly string[];
    /**
     * Template for the selected skill, when one exists.
     *
     * Carried here so one read gives the page everything it needs to render; the
     * other templates' bodies stay unread until the user selects them.
     */
    readonly template?: string;
}
/** One card's stored result, addressed by card. */
export interface WorkbenchCardResult extends WorkbenchResultRecord {
    /** Card identity the result belongs to. */
    readonly cardId: string;
}
/**
 * What this deployment can do with a card run, answered once.
 *
 * A card run starts through one of two subagent seams: `startActivation` on
 * `0.2.1-alpha.2`, or the one-shot `start` on `0.2.0-rc.2` — the stable channel this
 * plugin ships into — whose request takes the same members and whose result resolves
 * to the caller (measured on a real host composition). A harness that offers neither
 * can load the workbench and edit cards, but cannot start a run. The answer is a
 * property of the composition rather than of a card or a click, so it is probed where
 * the Host half is assembled and carried on every read instead of being asked per run.
 */
export interface WorkbenchRunCapabilities {
    /** Whether the subagent service exposes `startActivation` (0.2.1-alpha.2). */
    readonly startActivation: boolean;
    /** Whether the subagent service exposes the one-shot `start` (0.2.0-rc.2). */
    readonly start: boolean;
}
/** Complete configuration and result state, as read and as echoed after a write. */
export interface WorkbenchSkillCardSnapshot {
    /** Every card's configuration, ascending by card id. */
    readonly cards: readonly WorkbenchCardConfigView[];
    /** Every stored result, ascending by card id. */
    readonly results: readonly WorkbenchCardResult[];
    /** Monotonic revision used to detect a concurrent write. */
    readonly revision: string;
}
/**
 * Client-to-Host configuration write.
 *
 * `skill: null` clears the selection. A `template` is stored under the skill it
 * names, which is what lets one card remember a template per skill.
 */
export interface WorkbenchSkillCardPatch {
    /** Revision the client based this change on. */
    readonly baseRevision: string;
    /** Card being configured. */
    readonly cardId: string;
    /**
     * Remove this card and everything stored for it.
     *
     * Exclusive with the other fields: a removal is not a partial edit, and accepting
     * both would leave the meaning of the patch ambiguous.
     */
    readonly remove?: true;
    /** Card name; `null` clears it back to the registered label, omitted leaves it unchanged. */
    readonly name?: string | null;
    /** Selected skill; `null` clears it, omitted leaves it unchanged. */
    readonly skill?: string | null;
    /**
     * Model the card runs on; `null` clears it back to inheriting the session's model.
     *
     * The pair travels whole for the reason it is stored whole: a provider id may contain
     * a slash, so there is no string form of it to accept here.
     */
    readonly model?: WorkbenchCardModel | null;
    /**
     * Directory the card runs in; `null` clears it back to "no workspace chosen".
     *
     * Clearing is offered because a card may legitimately move: the user points it at
     * another directory, and the old path is not kept anywhere. It is never cleared for the
     * user, and nothing infers one from the session.
     */
    readonly workspace?: WorkbenchCardWorkspace | null;
    /**
     * Permission mode the card's runs use; `null` clears it back to the default.
     *
     * Clearing is offered because the default is a real answer, not a missing one: a user
     * who set a card to `read-only` and wants the ordinary mode back should not have to
     * spell the default out.
     */
    readonly permission?: WorkbenchSandboxMode | null;
    /** Template to store alongside the selection. */
    readonly template?: {
        readonly skill: string;
        readonly html: string;
    };
}
/** One skill visible to the session's human-facing catalog. */
export interface WorkbenchSkillCatalogEntry {
    /** Kebab-case identifier. */
    readonly name: string;
    /** Short routing description. */
    readonly description: string;
    /** Optional extra routing guidance. */
    readonly whenToUse?: string;
    /** Whether a human may invoke it; the picker lists only these. */
    readonly userInvocable: boolean;
}
/**
 * What one run is asked to do.
 *
 * Three shapes rather than one flag, because the runs differ in more than a parameter:
 * a card run exists to fill its template's region and has a contract to satisfy, a bare
 * run executes a skill and answers only whether it worked, and a refine run revises a
 * result the card already has.
 */
export type WorkbenchRunMode = 
/**
 * Card run: the stored template is carried into the prompt, its region is filled,
 * and the child reports `{ html }`.
 */
{
    readonly kind: 'card';
}
/**
 * Bare run: the named skill, with no document to fill and nothing to report.
 *
 * The target names the skill itself: a bare run is triggered by a button whose
 * target is a skill, which need not be the skill the reporting card is configured
 * with.
 */
 | {
    readonly kind: 'bare';
    readonly skill: string;
}
/**
 * Refine run: revise a result this card already produced.
 *
 * The template still comes from the card's stored selection, so the request does not
 * carry it — the Host answers "which document" the same way it does for a card run.
 * The output contract is unchanged (`{ html }`), so parsing, cleaning and splicing
 * are the card run's, reused rather than reimplemented.
 */
 | {
    readonly kind: 'refine';
    /** What to change, as the user wrote it. */
    readonly instruction: string;
    /** The region HTML the revision starts from, verbatim. */
    readonly previous: string;
};
/** Client-to-Host run start. */
export interface WorkbenchRunRequest {
    /** Card the run is reported under; also how its state is polled. */
    readonly cardId: string;
    /**
     * Session whose live agent supplies the skill scope.
     *
     * The model is not here: it is the card's own stored selection, read by the Host, so a
     * client cannot start a run on a route the card does not name.
     */
    readonly sessionId: string;
    /** What this run is asked to do. */
    readonly mode: WorkbenchRunMode;
    /**
     * The row that triggered this run: the raw fields the clicked button carried.
     *
     * Absent for a run a human started from the card's own control, because no row stands
     * behind it. When present the value travels into the child's prompt unchanged, which
     * is what makes the confirmation panel's full-parameter display a gate rather than a
     * description.
     */
    readonly payload?: Record<string, unknown>;
    /**
     * Output contract, carried by every run that fills a template.
     *
     * Optional because a bare run has nothing to validate: its verdict is the child's
     * own stop reason. The Host skips the contract preconditions when it is absent.
     * A refine run sends the same fixed `{ html }` contract as a card run, because it
     * returns the same thing.
     */
    readonly outputSchema?: unknown;
}
/** Lifecycle phase of one card's run. */
export type WorkbenchRunPhase = 'idle' | 'running' | 'settled' | 'cancelled';
/** One card's run state as polled by the client. */
export interface WorkbenchRunState {
    /** Card the run belongs to. */
    readonly cardId: string;
    /** Current phase. */
    readonly phase: WorkbenchRunPhase;
    /** Start time in milliseconds since the epoch. */
    readonly startedAt?: number;
    /** Whether the one allowed retry has already happened. */
    readonly retried: boolean;
    /** Settled result, once one exists. */
    readonly result?: WorkbenchResultRecord;
    /** Readable terminal failure reason. */
    readonly failure?: string;
    /** Machine-readable terminal failure reason, so the client can act on it. */
    readonly failureCode?: WorkbenchSkillCardErrorCode;
    /**
     * What the child has done so far, oldest first; absent while it has done nothing.
     *
     * Carried on the poll the client already makes, so the running card's stream costs no
     * transport of its own. The same array settles into
     * {@link WorkbenchResultRecord.activity}, which is what keeps it visible in 运行详情
     * after the run.
     */
    readonly activity?: readonly WorkbenchActivityEntry[];
}
/** Run-state response body. */
export interface WorkbenchRunResponse {
    /** Contract version this Host speaks. */
    readonly apiVersion: number;
    /** The card's run state. */
    readonly state: WorkbenchRunState;
}
/** Skill catalog response body. */
export interface WorkbenchCatalogResponse {
    /** Contract version this Host speaks. */
    readonly apiVersion: number;
    /** Every skill the session's agent can invoke. */
    readonly skills: readonly WorkbenchSkillCatalogEntry[];
}
/** Successful read or write body. */
export interface WorkbenchSkillCardResponse extends WorkbenchSkillCardSnapshot {
    /** Contract version this Host speaks. */
    readonly apiVersion: number;
    /**
     * What this deployment can do.
     *
     * Carried on the read rather than asked by the client per run: a control that cannot
     * work has to say so before it is pressed, not after.
     */
    readonly capabilities: WorkbenchRunCapabilities;
}
/** Error body returned by every skill card route. */
export interface WorkbenchSkillCardErrorBody {
    readonly error: {
        readonly code: WorkbenchSkillCardErrorCode;
        readonly message: string;
    };
}
/**
 * Closed set of skill card failures.
 *
 * Several of these are the actionable degradation reasons of the requirements'
 * failure matrix. Collapsing them into one generic failure would leave the user
 * with an error they cannot act on, so each keeps its own code.
 */
export type WorkbenchSkillCardErrorCode = 'unauthorized' | 'forbidden' | 'invalid-request' | 'too-large' | 'conflict' | 'not-found' | 'storage-failure' | 'run-failed' | 'not-configured' | 'session-not-live' | 'skill-not-found' | 'template-missing' | 'catalog-failed' | 'provider-unavailable' | 'model-unavailable' | 'schema-rejected' | 'run-in-progress'
/**
 * Running is unavailable on this harness, not wrong with this card.
 *
 * The composition found neither run seam — no `startActivation` (0.2.1-alpha.2) and
 * no one-shot `start` (0.2.0-rc.2) — so the run control is disabled and the card
 * states why. A run that arrives anyway — a stale click, a direct route call, a
 * template button — is refused with this same code rather than throwing.
 */
 | 'run-unavailable'
/**
 * This card has no workspace directory chosen.
 *
 * Not the same as "not configured": the skill is chosen and the template exists, and the
 * one missing fact is where the run would happen. It has its own code because the remedy
 * is its own control.
 */
 | 'workspace-missing'
/**
 * The stored workspace directory is gone, or is no longer a directory.
 *
 * Refused rather than replaced by the session's directory: a silent fallback would run
 * the card somewhere the user never chose, and the result would not say so.
 */
 | 'workspace-invalid'
/**
 * The card's permission mode could not be applied to the agent that runs it.
 *
 * Refused rather than run under a mode nobody chose: a permission setting that quietly
 * does nothing is worse than an error, because the user would read it as enforced. The
 * refusal names the card and the mode.
 */
 | 'permission-unavailable';
