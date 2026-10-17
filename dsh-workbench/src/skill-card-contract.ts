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

import { isWorkbenchCardId } from './layout-contract.ts'

/** Private same-origin route serving the skill card's configuration and results. */
export const WORKBENCH_SKILL_CARD_PATH = '/api/workbench/skill-card'

/** Session-scoped skill catalog route. */
export const WORKBENCH_SKILL_CARD_CATALOG_PATH = `${WORKBENCH_SKILL_CARD_PATH}/catalog`

/** Run control route: `POST` starts, `GET` polls, `DELETE` cancels. */
export const WORKBENCH_SKILL_CARD_RUN_PATH = `${WORKBENCH_SKILL_CARD_PATH}/run`

/** Contract version echoed in every response; a mismatched client refuses to parse. */
export const WORKBENCH_SKILL_CARD_API_VERSION = 1

/** Maximum bytes of one template. */
export const WORKBENCH_TEMPLATE_MAX_BYTES = 32 * 1024

/** Maximum number of skills one card may keep a template for. */
export const WORKBENCH_TEMPLATE_MAX_PER_CARD = 16

/** Maximum bytes of one stored result, counted over the structured value and the text output. */
export const WORKBENCH_RESULT_MAX_BYTES = 64 * 1024

/** Maximum request-body bytes accepted by the configuration route. */
export const WORKBENCH_SKILL_CARD_MAX_BODY_BYTES = 128 * 1024

/**
 * Name of the comment that opens the region a child fills.
 *
 * A template is a whole document: styles and headings say how the result looks but
 * nothing about what to report. The markers delimit the part that does, and the
 * comments inside that part are the instruction.
 */
export const WORKBENCH_REGION_BEGIN = 'template-begin'

/** Name of the comment that closes the region a child fills. */
export const WORKBENCH_REGION_END = 'template-end'

/**
 * Build the pattern matching one region marker comment.
 *
 * A fresh pattern per call: a shared global regex carries `lastIndex` between callers.
 * @param name - marker name, without the comment delimiters.
 * @returns the pattern.
 */
export function regionMarkerPattern(name: string): RegExp {
  return new RegExp(`<!--\\s*${name}\\s*-->`, 'g')
}

/**
 * The output contract every run asks its child for.
 *
 * One property: the child returns the filled region as HTML rather than a set of named
 * values, because the template's own comments say what to produce. There is no field
 * list left to validate against, so nothing about the result can fail on shape.
 */
export const WORKBENCH_OUTPUT_SCHEMA = {
  type: 'object',
  properties: { html: { type: 'string' } },
  required: ['html'],
  additionalProperties: true,
}

/**
 * Skill name grammar, matching the skill registry's own rule exactly: kebab
 * case, with no leading, trailing, or repeated hyphen.
 */
export const WORKBENCH_SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Longest skill name the workbench accepts.
 *
 * The skill registry imposes no length limit of its own; this one bounds a
 * client-supplied name at the wire boundary and keeps the composite storage key
 * short. Real names come from directory names, which sit far below it.
 */
export const WORKBENCH_SKILL_NAME_MAX_LENGTH = 64

/**
 * Longest card name the workbench stores.
 *
 * A card name is the user's own label and appears on the card face, so it is free
 * text rather than a grammar. The limit only bounds what one card record carries
 * and what the card face has to lay out.
 */
export const WORKBENCH_CARD_NAME_MAX_LENGTH = 60

/**
 * Whether a value is a usable card name.
 *
 * Whitespace is not part of the name, and a name that is only whitespace is no
 * name at all: the card falls back to its registered label instead.
 * @param value - candidate name.
 * @returns whether the value holds visible text within the length limit.
 */
export function isWorkbenchCardName(value: string): boolean {
  return value.trim().length > 0 && value.length <= WORKBENCH_CARD_NAME_MAX_LENGTH
}

/**
 * Whether a value addresses a registered skill.
 * @param value - candidate skill name.
 * @returns whether the value is a kebab-case name within the length limit.
 */
export function isWorkbenchSkillName(value: string): boolean {
  return value.length > 0
    && value.length <= WORKBENCH_SKILL_NAME_MAX_LENGTH
    && WORKBENCH_SKILL_NAME_PATTERN.test(value)
}

/**
 * Separator between the card and the skill in a composite template key.
 *
 * It has to be path-safe: the `per-record` storage layout encodes a record key as
 * a file-name segment and refuses anything outside `[a-zA-Z0-9_-]`. Neither card
 * ids nor skill names admit an underscore, so the first one always splits the two
 * halves.
 */
const TEMPLATE_KEY_SEPARATOR = '_'

/**
 * Compose the storage key holding one card's template for one skill.
 * @param cardId - workbench card identity.
 * @param skill - skill name.
 * @returns the composite record key.
 */
export function templateKey(cardId: string, skill: string): string {
  return `${cardId}${TEMPLATE_KEY_SEPARATOR}${skill}`
}

/**
 * Split a composite template key.
 * @param key - a key produced by {@link templateKey}.
 * @returns the two halves, or undefined when the key is not composite.
 */
export function parseTemplateKey(key: string): { readonly cardId: string; readonly skill: string } | undefined {
  const separator = key.indexOf(TEMPLATE_KEY_SEPARATOR)
  if (separator <= 0) return undefined
  const cardId = key.slice(0, separator)
  const skill = key.slice(separator + 1)
  if (!isWorkbenchCardId(cardId) || !isWorkbenchSkillName(skill)) return undefined
  return { cardId, skill }
}

/**
 * One card's persisted configuration.
 *
 * An absent record means "no skill chosen yet": the card renders its empty
 * state rather than guessing a default.
 */
export interface WorkbenchCardConfigRecord {
  /** User-assigned card name; absent falls back to the card's registered label. */
  readonly name?: string
  /** Skill the user selected; absent means unconfigured. */
  readonly skill?: string
}

/** One card's template for one skill. */
export interface WorkbenchTemplateRecord {
  /** The user's HTML. */
  readonly html: string
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
  readonly skill: string
  /** Completion time in milliseconds since the epoch. */
  readonly executedAt: number
  /** Why the run ended, as reported by the subagent seam. */
  readonly stopReason: string
  /** The validated structured value; absent means no valid capture was committed. */
  readonly structured?: unknown
  /** The child's final assistant output, kept for "view raw output". */
  readonly outputText?: string
  /** Provider-authored failure detail, if any. */
  readonly diagnostic?: string
}

/** One card's configuration as read, with the selected skill's template body. */
export interface WorkbenchCardConfigView {
  /** Card identity. */
  readonly cardId: string
  /** User-assigned card name; absent means the card's registered label stands. */
  readonly name?: string
  /** Selected skill; absent means unconfigured. */
  readonly skill?: string
  /** Skills this card already holds a template for. */
  readonly templateSkills: readonly string[]
  /**
   * Template for the selected skill, when one exists.
   *
   * Carried here so one read gives the page everything it needs to render; the
   * other templates' bodies stay unread until the user selects them.
   */
  readonly template?: string
}

/** One card's stored result, addressed by card. */
export interface WorkbenchCardResult extends WorkbenchResultRecord {
  /** Card identity the result belongs to. */
  readonly cardId: string
}

/** Complete configuration and result state, as read and as echoed after a write. */
export interface WorkbenchSkillCardSnapshot {
  /** Every card's configuration, ascending by card id. */
  readonly cards: readonly WorkbenchCardConfigView[]
  /** Every stored result, ascending by card id. */
  readonly results: readonly WorkbenchCardResult[]
  /** Monotonic revision used to detect a concurrent write. */
  readonly revision: string
}

/**
 * Client-to-Host configuration write.
 *
 * `skill: null` clears the selection. A `template` is stored under the skill it
 * names, which is what lets one card remember a template per skill.
 */
export interface WorkbenchSkillCardPatch {
  /** Revision the client based this change on. */
  readonly baseRevision: string
  /** Card being configured. */
  readonly cardId: string
  /**
   * Remove this card and everything stored for it.
   *
   * Exclusive with the other fields: a removal is not a partial edit, and accepting
   * both would leave the meaning of the patch ambiguous.
   */
  readonly remove?: true
  /** Card name; `null` clears it back to the registered label, omitted leaves it unchanged. */
  readonly name?: string | null
  /** Selected skill; `null` clears it, omitted leaves it unchanged. */
  readonly skill?: string | null
  /** Template to store alongside the selection. */
  readonly template?: { readonly skill: string; readonly html: string }
}

/** One skill visible to the session's human-facing catalog. */
export interface WorkbenchSkillCatalogEntry {
  /** Kebab-case identifier. */
  readonly name: string
  /** Short routing description. */
  readonly description: string
  /** Optional extra routing guidance. */
  readonly whenToUse?: string
  /** Whether a human may invoke it; the picker lists only these. */
  readonly userInvocable: boolean
}

/** Client-to-Host run start. */
export interface WorkbenchRunRequest {
  /** Card being run. */
  readonly cardId: string
  /** Session whose live agent supplies the skill scope and the child's model. */
  readonly sessionId: string
  /**
   * Output contract derived from the template on the client. Required because a
   * template is the precondition for running; the Host validates it with the
   * upstream object-rooted guard before handing it to a subagent.
   */
  readonly outputSchema: unknown
}

/** Lifecycle phase of one card's run. */
export type WorkbenchRunPhase = 'idle' | 'running' | 'settled' | 'cancelled'

/** One card's run state as polled by the client. */
export interface WorkbenchRunState {
  /** Card the run belongs to. */
  readonly cardId: string
  /** Current phase. */
  readonly phase: WorkbenchRunPhase
  /** Start time in milliseconds since the epoch. */
  readonly startedAt?: number
  /** Whether the one allowed retry has already happened. */
  readonly retried: boolean
  /** Settled result, once one exists. */
  readonly result?: WorkbenchResultRecord
  /** Readable terminal failure reason. */
  readonly failure?: string
  /** Machine-readable terminal failure reason, so the client can act on it. */
  readonly failureCode?: WorkbenchSkillCardErrorCode
}

/** Run-state response body. */
export interface WorkbenchRunResponse {
  /** Contract version this Host speaks. */
  readonly apiVersion: number
  /** The card's run state. */
  readonly state: WorkbenchRunState
}

/** Skill catalog response body. */
export interface WorkbenchCatalogResponse {
  /** Contract version this Host speaks. */
  readonly apiVersion: number
  /** Every skill the session's agent can invoke. */
  readonly skills: readonly WorkbenchSkillCatalogEntry[]
}

/** Successful read or write body. */
export interface WorkbenchSkillCardResponse extends WorkbenchSkillCardSnapshot {
  /** Contract version this Host speaks. */
  readonly apiVersion: number
}

/** Error body returned by every skill card route. */
export interface WorkbenchSkillCardErrorBody {
  readonly error: {
    readonly code: WorkbenchSkillCardErrorCode
    readonly message: string
  }
}

/**
 * Closed set of skill card failures.
 *
 * Several of these are the actionable degradation reasons of the requirements'
 * failure matrix. Collapsing them into one generic failure would leave the user
 * with an error they cannot act on, so each keeps its own code.
 */
export type WorkbenchSkillCardErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid-request'
  | 'too-large'
  | 'conflict'
  | 'not-found'
  | 'storage-failure'
  | 'run-failed'
  | 'not-configured'
  | 'session-not-live'
  | 'skill-not-found'
  | 'template-missing'
  | 'catalog-failed'
  | 'provider-unavailable'
  | 'schema-rejected'
  | 'run-in-progress'
