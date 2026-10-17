/**
 * Wire contract shared by the workbench's Host and Client halves: the private
 * layout route, its payload schemas, and the limits both sides enforce. The
 * module carries no runtime dependency so the browser bundle can inline it.
 * @module dsh-workbench/layout-contract
 */

/** Private same-origin route serving the workbench card layout. */
export const WORKBENCH_LAYOUT_PATH = '/api/workbench/layout'

/** Contract version echoed in every response; a mismatched client refuses to parse. */
export const WORKBENCH_LAYOUT_API_VERSION = 1

/** Card identity: namespaced lowercase slug, also the storage record key. */
export const WORKBENCH_CARD_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/

/** Maximum card identity length. */
export const WORKBENCH_CARD_ID_MAX_LENGTH = 64

/** Maximum cards one layout request may carry. */
export const WORKBENCH_LAYOUT_MAX_ENTRIES = 256

/** Maximum request body bytes accepted by the layout route. */
export const WORKBENCH_LAYOUT_MAX_BODY_BYTES = 64 * 1024

/** Smallest gap between two adjacent positions before the client renumbers the visible sequence. */
export const WORKBENCH_POSITION_EPSILON = 1e-6

/** First position value; the client multiplies by {@link WORKBENCH_POSITION_STEP} when it renumbers. */
export const WORKBENCH_POSITION_BASE = 1024

/** Multiplier the client applies to the previous position during a renumber. */
export const WORKBENCH_POSITION_STEP = 2

/**
 * One card's stored layout.
 *
 * The record holds ordering and nothing else: hiding is not a capability of
 * this product, so there is no field for it. An absent record means "never
 * arranged": the card keeps its plugin-declared default order.
 */
export interface WorkbenchCardLayoutRecord {
  /** User-arranged order key, ascending; absent keeps the plugin default order. */
  readonly position?: number
}

/**
 * One card's layout as sent over the wire.
 *
 * `position` is optional and carried explicitly, so a reset travels as `{ id }`
 * alone — the Host deletes that record instead of storing a value equal to the
 * default.
 */
export interface WorkbenchLayoutEntry {
  /** Card identity. */
  readonly id: string
  /** User-arranged order key; omitted means "return to the default order". */
  readonly position?: number
}

/** Complete layout state, as read and as echoed after a write. */
export interface WorkbenchLayoutSnapshot {
  /** Every stored card layout record, ascending by id. */
  readonly entries: readonly WorkbenchLayoutEntry[]
  /** Monotonic revision used to detect a concurrent write. */
  readonly revision: string
}

/** Client-to-Host write request. */
export interface WorkbenchLayoutPatch {
  /** Revision the client based this change on. */
  readonly baseRevision: string
  /** Changed cards; unchanged cards are absent. */
  readonly entries: readonly WorkbenchLayoutEntry[]
}

/** Successful read or write body. */
export interface WorkbenchLayoutResponse extends WorkbenchLayoutSnapshot {
  /** Contract version this Host speaks. */
  readonly apiVersion: number
}

/** Error body returned by the layout route. */
export interface WorkbenchLayoutErrorBody {
  readonly error: {
    readonly code: WorkbenchLayoutErrorCode
    readonly message: string
  }
}

/** Closed set of layout route failures. */
export type WorkbenchLayoutErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid-request'
  | 'conflict'
  | 'storage-failure'

/**
 * Whether a value is a usable card identity.
 * @param value - candidate identity.
 * @returns whether the value is a namespaced slug within the length limit.
 */
export function isWorkbenchCardId(value: string): boolean {
  return value.length > 0
    && value.length <= WORKBENCH_CARD_ID_MAX_LENGTH
    && WORKBENCH_CARD_ID_PATTERN.test(value)
}

/**
 * Trim one wire entry to the fields that are actually present.
 *
 * Normalizing at the edges is what lets a reset delete a record: an entry with
 * no `position` produces a record with no fields, not one equal to the default.
 * @param entry - entry as received or as produced by the store.
 * @returns a record carrying only the present fields.
 */
export function toLayoutRecord(entry: WorkbenchLayoutEntry): WorkbenchCardLayoutRecord {
  return {
    ...entry.position === undefined ? {} : { position: entry.position },
  }
}
