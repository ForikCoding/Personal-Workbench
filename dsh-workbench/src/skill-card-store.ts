/**
 * Skill card store: reads and writes the card selection, per-skill templates,
 * and stored results over the skill card storage domain.
 *
 * It owns the revision that makes a concurrent write visible to the client that
 * lost the race, and it bounds every stored value by byte budget before the
 * value reaches the domain.
 * @module dsh-workbench/skill-card-store
 */

import type {
  WorkbenchActivityEntry,
  WorkbenchCardConfigRecord,
  WorkbenchCardConfigView,
  WorkbenchCardResult,
  WorkbenchResultRecord,
  WorkbenchSkillCardPatch,
  WorkbenchSkillCardSnapshot,
  WorkbenchTemplateRecord,
} from './skill-card-contract.ts'
import { splitActivity } from './skill-card-activity.ts'
import {
  WORKBENCH_CARD_NAME_MAX_LENGTH,
  WORKBENCH_INSTRUCTION_MODES,
  WORKBENCH_MAX_RESULTS_PER_CARD,
  WORKBENCH_SANDBOX_MODES,
  WORKBENCH_WORKSPACE_PATH_MAX_LENGTH,
  isWorkbenchCardModel,
  isWorkbenchCardName,
  isWorkbenchCardWorkspace,
  isWorkbenchInstructionMode,
  isWorkbenchSandboxMode,
  isWorkbenchSkillName,
  parseResultKey,
  parseTemplateKey,
  resultKey,
  templateKey,
} from './skill-card-contract.ts'
import { isWorkbenchCardId } from './layout-contract.ts'

/** Read/write side of one declared domain table, as this store consumes it. */
export interface SkillCardTable<T> {
  /**
   * Read one record from memory.
   * @param key - record key.
   * @returns the stored record, or `undefined` when absent.
   */
  get(key: string): T | undefined
  /**
   * Snapshot the stored pairs.
   * @returns the pair iterator, stable while queued writes land.
   */
  entries(): IterableIterator<[string, T]>
  /**
   * Insert or overwrite one record durably.
   * @param key - record key.
   * @param value - the complete new record.
   * @returns resolution after durability.
   */
  put(key: string, value: T): Promise<void>
  /**
   * Delete one record durably.
   * @param key - record key.
   * @returns whether a record was removed.
   */
  delete(key: string): Promise<boolean>
}

/** Change subscription this store consumes, satisfied by the Cordis context. */
export interface SkillCardChangeSource {
  /**
   * Subscribe to Host events.
   * @param event - event name.
   * @param listener - change callback.
   * @returns the unsubscribe function.
   */
  on(event: 'domain/changed', listener: (change: { readonly domain: string }) => void): () => void
}

/** Result of one configuration write attempt. */
export type WorkbenchSkillCardWriteResult =
  | { readonly status: 'written'; readonly snapshot: WorkbenchSkillCardSnapshot }
  | { readonly status: 'conflict'; readonly snapshot: WorkbenchSkillCardSnapshot }
  | { readonly status: 'invalid'; readonly reason: string }

/** Outcome of one hand edit of a stored result. */
export type WorkbenchResultEditOutcome =
  /** Stored; the record is the one the client can now show. */
  | { readonly status: 'written'; readonly result: WorkbenchCardResult }
  /** The card holds no result, so there is no record whose run facts could stand. */
  | { readonly status: 'missing' }
  /** The edit cannot be stored as given. */
  | { readonly status: 'invalid'; readonly reason: string }
  /**
   * The edit is larger than one stored result may be, in bytes.
   *
   * Refused rather than trimmed: a trimmed result would store one thing and display
   * another, which is exactly the failure this budget exists to prevent.
   */
  | { readonly status: 'too-large'; readonly bytes: number }

/** What the store needs from its Host context. */
export interface WorkbenchSkillCardStoreOptions {
  /** Storage domain name, used to filter change events. */
  readonly domainName: string
  /** Table holding one skill selection per card. */
  readonly card: SkillCardTable<WorkbenchCardConfigRecord>
  /** Table holding one template per card and skill. */
  readonly template: SkillCardTable<WorkbenchTemplateRecord>
  /** Table holding one result per card. */
  readonly result: SkillCardTable<WorkbenchResultRecord>
  /** Host event source. */
  readonly events: SkillCardChangeSource
  /** Bytes one template may occupy. */
  readonly maxTemplateBytes: number
  /** Templates one card may hold. */
  readonly maxTemplatesPerCard: number
  /** Bytes one result may occupy. */
  readonly maxResultBytes: number
  /** Runs one card keeps before the oldest are dropped. */
  readonly maxResultsPerCard: number
  /** Process start stamp folded into the revision; tests pass a fixed value. */
  readonly bootStamp: number
  /**
   * Clock for the moments the store itself stamps.
   *
   * Only a hand edit needs one: it sets `editedAt`, and a spec has to assert that without
   * waiting for a real second to pass. `executedAt` is deliberately not touched by an
   * edit — the record's place in the run history is the run's.
   * @returns milliseconds since the epoch.
   */
  readonly now?: () => number
}

/**
 * Run id a record written before the run-history layout is read under.
 *
 * The legacy layout keyed each card's one result by the card id alone. Reading such a
 * record under this fixed id keeps it addressable — an edit can name it — without the
 * card having to choose one of its real runs; it is the oldest run the card has.
 */
export const LEGACY_RUN_ID = '0'

/** Errors raised while writing skill card storage, carrying the route's error code. */
export class WorkbenchSkillCardStorageError extends Error {
  /**
   * @param operation - the storage operation that failed.
   * @param cause - the underlying failure.
   */
  constructor(readonly operation: 'put' | 'delete', cause: unknown) {
    super(`workbench skill card ${operation} failed: ${cause instanceof Error ? cause.message : String(cause)}`)
    this.name = 'WorkbenchSkillCardStorageError'
  }
}

/** Skill card configuration and result store over three storage domain tables. */
export class WorkbenchSkillCardStore {
  private changeCount = 0
  private readonly disposeChange: () => void

  /**
   * @param options - domain name, tables, event source, byte budgets, and boot stamp.
   */
  constructor(private readonly options: WorkbenchSkillCardStoreOptions) {
    this.disposeChange = options.events.on('domain/changed', (change) => {
      if (change.domain !== options.domainName) return
      this.changeCount += 1
    })
  }

  /** Current revision: boot stamp plus the number of durable changes seen. */
  get revision(): string {
    return `${String(this.options.bootStamp)}:${String(this.changeCount)}`
  }

  /**
   * Read the complete configuration and result state.
   *
   * A card appears when it has a selection, a template, or both, so a card
   * holding templates for skills but no current selection still shows them.
   * @returns cards and results ascending by card id, with the current revision.
   */
  read(): WorkbenchSkillCardSnapshot {
    const templatesByCard = new Map<string, Map<string, string>>()
    for (const [key, record] of this.options.template.entries()) {
      const parsed = parseTemplateKey(key)
      if (parsed === undefined) continue
      const bySkill = templatesByCard.get(parsed.cardId) ?? new Map<string, string>()
      bySkill.set(parsed.skill, record.html)
      templatesByCard.set(parsed.cardId, bySkill)
    }

    const cardIds = new Set<string>()
    for (const [cardId] of this.options.card.entries()) cardIds.add(cardId)
    for (const cardId of templatesByCard.keys()) cardIds.add(cardId)

    const cards: WorkbenchCardConfigView[] = []
    for (const cardId of [...cardIds].sort()) {
      const record = this.options.card.get(cardId)
      const selected = record?.skill
      const name = record?.name
      const model = record?.model
      const workspace = record?.workspace
      const permission = record?.permission
      const instructionMode = record?.instructionMode
      const bySkill = templatesByCard.get(cardId)
      const template = selected === undefined ? undefined : bySkill?.get(selected)
      cards.push({
        cardId,
        ...name === undefined ? {} : { name },
        ...selected === undefined ? {} : { skill: selected },
        ...model === undefined ? {} : { model },
        ...workspace === undefined ? {} : { workspace },
        ...permission === undefined ? {} : { permission },
        ...instructionMode === undefined ? {} : { instructionMode },
        templateSkills: bySkill === undefined ? [] : [...bySkill.keys()].sort(),
        ...template === undefined ? {} : { template },
      })
    }

    const results: WorkbenchCardResult[] = []
    for (const [key, record] of this.options.result.entries()) {
      // A key without a separator is a record written before the card kept a run history:
      // it was keyed by the card id alone. It reads as that card's one run, under the
      // legacy run id, so a card's oldest run survives an upgrade instead of vanishing.
      const parsed = parseResultKey(key)
      const cardId = parsed?.cardId ?? key
      // The stored value is spread first and the run id stamped after it, so the key —
      // the identity the store actually wrote — wins over whatever the record carries.
      // For a legacy key that is the fixed legacy id; for a composite key it is the key's
      // own half, which keeps the entry readable even if the table schema in front of this
      // domain dropped the field. That is not hypothetical: an undeclared `runId` was
      // stripped on load, the client refused the whole snapshot over one entry with no run
      // id, and every card on the board disappeared.
      results.push(parsed === undefined
        ? { cardId, ...record, runId: LEGACY_RUN_ID }
        : { cardId, ...record, runId: parsed.runId })
    }
    // One card's runs read newest-first, so the client's default (the latest) is the first
    // of its block; cards themselves stay in id order.
    results.sort((left, right) =>
      left.cardId < right.cardId ? -1
        : left.cardId > right.cardId ? 1
          : right.executedAt - left.executedAt)

    return { cards, results, revision: this.revision }
  }

  /**
   * Apply one configuration patch.
   *
   * A patch whose `baseRevision` is not current is refused without writing, and
   * answered with the state the client has to reconcile against.
   * @param patch - card, selection, and optional template to store.
   * @returns the write outcome.
   */
  async write(patch: WorkbenchSkillCardPatch): Promise<WorkbenchSkillCardWriteResult> {
    if (patch.baseRevision !== this.revision) {
      return { status: 'conflict', snapshot: this.read() }
    }
    const invalid = this.validate(patch)
    if (invalid !== undefined) return { status: 'invalid', reason: invalid }

    if (patch.remove === true) {
      // Everything addressed to the card goes with it. Leaving the templates and the
      // results behind would keep them reachable by nothing, and the domain would grow
      // with records no card can ever read again.
      await this.run('delete', () => this.options.card.delete(patch.cardId))
      for (const [key] of [...this.options.template.entries()]) {
        if (parseTemplateKey(key)?.cardId !== patch.cardId) continue
        await this.run('delete', () => this.options.template.delete(key))
      }
      for (const key of [...this.options.result.entries()]
        .map(([storedKey]) => storedKey)
        .filter(storedKey => this.resultCardId(storedKey) === patch.cardId)) {
        await this.run('delete', () => this.options.result.delete(key))
      }
      return { status: 'written', snapshot: this.read() }
    }

    // The template lands first: if the selection write then fails, the card keeps
    // its previous working pair instead of naming a skill whose template is missing.
    const template = patch.template
    if (template !== undefined) {
      const key = templateKey(patch.cardId, template.skill)
      await this.run('put', () => this.options.template.put(key, { html: template.html }))
    }

    // The name, the selection, the route, the directory, and the permission mode share one
    // record, so a patch touching any of them has to merge against what is stored. Writing
    // the record wholesale would drop the others, and clearing the selection would take the
    // name — and now the workspace and the mode — down with it.
    const current = this.options.card.get(patch.cardId)
    const patchedName = patch.name
    const name = patchedName === undefined
      ? current?.name
      : patchedName === null ? undefined : patchedName.trim()
    const patchedSkill = patch.skill
    const skill = patchedSkill === undefined
      ? current?.skill
      : patchedSkill === null ? undefined : patchedSkill
    const patchedModel = patch.model
    const model = patchedModel === undefined
      ? current?.model
      : patchedModel === null ? undefined : patchedModel
    const patchedWorkspace = patch.workspace
    const workspace = patchedWorkspace === undefined
      ? current?.workspace
      : patchedWorkspace === null ? undefined : patchedWorkspace
    const patchedPermission = patch.permission
    const permission = patchedPermission === undefined
      ? current?.permission
      : patchedPermission === null ? undefined : patchedPermission
    const patchedInstructionMode = patch.instructionMode
    const instructionMode = patchedInstructionMode === undefined
      ? current?.instructionMode
      : patchedInstructionMode === null ? undefined : patchedInstructionMode
    if (name === undefined
      && skill === undefined
      && model === undefined
      && workspace === undefined
      && permission === undefined
      && instructionMode === undefined) {
      await this.run('delete', () => this.options.card.delete(patch.cardId))
    } else {
      await this.run('put', () => this.options.card.put(patch.cardId, {
        ...name === undefined ? {} : { name },
        ...skill === undefined ? {} : { skill },
        ...model === undefined ? {} : { model },
        ...workspace === undefined ? {} : { workspace },
        ...permission === undefined ? {} : { permission },
        ...instructionMode === undefined ? {} : { instructionMode },
      }))
    }

    return { status: 'written', snapshot: this.read() }
  }

  /**
   * Store one execution result, trimmed to the deployment's byte budget.
   *
   * Each completed run lands under its own key, so a card keeps its history; once the
   * card holds {@link WORKBENCH_MAX_RESULTS_PER_CARD} runs, the oldest are dropped. The
   * trim and the retention together keep the domain small without asking the runner to
   * think about either.
   * @param cardId - card the result belongs to.
   * @param record - the complete result; its `runId` must be unique within the card.
   * @returns resolution after durability.
   */
  async putResult(cardId: string, record: WorkbenchResultRecord): Promise<void> {
    if (!isWorkbenchCardId(cardId)) {
      throw new Error(`workbench skill card put: ${JSON.stringify(cardId)} is not a namespaced slug`)
    }
    if (record.runId.length === 0) {
      throw new Error('workbench skill card put: a result needs a run id')
    }
    const trimmed = trimResult(record, this.options.maxResultBytes)
    await this.run('put', () => this.options.result.put(resultKey(cardId, trimmed.runId), trimmed))
    await this.trimToRetention(cardId)
  }

  /**
   * Replace one card's one run's region HTML with a hand-edited fragment.
   *
   * A save must not fabricate a run, so everything a run owned stays as it is: the skill
   * and the stop reason are kept, the raw output and the diagnostic are kept, and only
   * `structured.html` is replaced. `executedAt` stays as the run completed it — editing
   * the record must not move it in the run history — and `editedAt` says the HTML was
   * changed by hand. Records written before the run-history layout read under
   * {@link LEGACY_RUN_ID} and migrate to the composite key on their first edit.
   *
   * Nothing here trims: a value over the budget is refused. Trimming a hand edit would
   * store a document the user did not write and display a different one.
   * @param cardId - card whose stored result is being edited.
   * @param runId - which of the card's runs to edit.
   * @param html - the region HTML to store, verbatim.
   * @returns the stored record, or why the edit was refused.
   */
  async putEditedResult(cardId: string, runId: string, html: string): Promise<WorkbenchResultEditOutcome> {
    if (!isWorkbenchCardId(cardId)) {
      return { status: 'invalid', reason: `card id ${JSON.stringify(cardId)} is not a namespaced slug` }
    }
    if (runId.length === 0) {
      return { status: 'invalid', reason: 'an edit has to name the run it edits' }
    }
    // An empty region renders as a card that looks broken, so it is refused here as well
    // as in the editor: this is the boundary that actually stores it.
    if (html.trim() === '') {
      return { status: 'invalid', reason: 'an edited result must hold visible content' }
    }
    // The legacy layout keyed a card's one result by the card id alone; the composite
    // layout keys it by id plus run id. The edit reads wherever the record currently
    // lives so a legacy record can be migrated by its first edit.
    const legacyKey = this.options.result.get(cardId)
    const compositeKey = this.options.result.get(resultKey(cardId, runId))
    const previous = compositeKey ?? legacyKey ?? undefined
    // The record's skill and stop reason are the two facts a hand edit has nothing to say
    // about, so there has to be a record that already holds them.
    if (previous === undefined) return { status: 'missing' }

    const editBytes = utf8Bytes(html)
    if (editBytes > this.options.maxResultBytes) {
      return { status: 'too-large', bytes: editBytes }
    }

    const at = this.moment()
    const record: WorkbenchResultRecord = {
      ...previous,
      runId,
      editedAt: at,
      // The rest of the structured value, if any, is the run's record and stays put: the
      // editor shows and replaces the region HTML only.
      structured: { ...structuredRecord(previous.structured), html },
    }
    // The fragment fitted, but the record it lands in may not: the record budget counts
    // the whole thing, and the run's output text still travels with it.
    const recordBytes = byteSize(record)
    if (recordBytes > this.options.maxResultBytes) {
      return { status: 'too-large', bytes: recordBytes }
    }

    await this.run('put', () => this.options.result.put(resultKey(cardId, runId), record))
    // A legacy record moves to the composite key with its edit; the old key is then
    // nothing but a duplicate.
    if (legacyKey !== undefined && compositeKey === undefined) {
      await this.run('delete', () => this.options.result.delete(cardId))
    }
    return { status: 'written', result: { cardId, ...record } }
  }

  /**
   * Read the card a result key stores under.
   * @param key - a stored result key, composite or legacy.
   * @returns the card id, or undefined when the key is not a result key.
   */
  private resultCardId(key: string): string | undefined {
    const parsed = parseResultKey(key)
    if (parsed !== undefined) return parsed.cardId
    return isWorkbenchCardId(key) ? key : undefined
  }

  /**
   * Drop a card's oldest runs until it holds at most the retention budget.
   *
   * Runs are ordered by when they completed; the newest is the one the card shows, so
   * it is never the one dropped. Runs beyond the budget (and legacy keys among them) are
   * removed oldest first.
   * @param cardId - card whose history to trim.
   * @returns resolution once the dropped records are gone.
   */
  private async trimToRetention(cardId: string): Promise<void> {
    const own = [...this.options.result.entries()]
      .map(([key, record]) => ({ key, record }))
      .filter(entry => this.resultCardId(entry.key) === cardId)
      .sort((left, right) => left.record.executedAt - right.record.executedAt)
    for (let droppedFrom = 0; own.length - droppedFrom > this.options.maxResultsPerCard; droppedFrom += 1) {
      const oldest = own[droppedFrom]
      if (oldest === undefined) return
      await this.run('delete', () => this.options.result.delete(oldest.key))
    }
  }

  /** Stop observing domain changes. Idempotent. */
  dispose(): void {
    this.disposeChange()
  }

  /**
   * Reject a patch that cannot be stored.
   * @param patch - candidate patch.
   * @returns a human-readable reason, or undefined when the patch is storable.
   */
  private validate(patch: WorkbenchSkillCardPatch): string | undefined {
    if (!isWorkbenchCardId(patch.cardId)) {
      return `card id ${JSON.stringify(patch.cardId)} is not a namespaced slug`
    }
    const skill = patch.skill
    if (skill !== undefined && skill !== null && !isWorkbenchSkillName(skill)) {
      return `skill ${JSON.stringify(skill)} is not a kebab-case skill name`
    }
    const name = patch.name
    if (name !== undefined && name !== null && !isWorkbenchCardName(name)) {
      return `card name must hold visible text within ${String(WORKBENCH_CARD_NAME_MAX_LENGTH)} characters`
    }
    const model = patch.model
    // The pair is validated as a pair: two non-empty ids, never a joined string that a
    // later reader would have to split on a slash a provider id may itself contain.
    if (model !== undefined && model !== null && !isWorkbenchCardModel(model)) {
      return 'model must name a non-empty provider and model id'
    }
    const workspace = patch.workspace
    // An absolute path or nothing: a relative one would name a different directory
    // depending on who resolved it, and the card would run somewhere the user never chose.
    if (workspace !== undefined && workspace !== null && !isWorkbenchCardWorkspace(workspace)) {
      return `workspace must name one absolute directory path within ${String(WORKBENCH_WORKSPACE_PATH_MAX_LENGTH)} characters`
    }
    const permission = patch.permission
    // Refused rather than stored as given: an unknown mode would reach the sandbox as a
    // mode nothing enforces, and the card would then claim a permission it never had.
    if (permission !== undefined && permission !== null && !isWorkbenchSandboxMode(permission)) {
      return `permission must be null or one of ${WORKBENCH_SANDBOX_MODES.join(', ')}`
    }
    const instructionMode = patch.instructionMode
    // Refused for the same reason as an unknown permission mode: a mode neither the run bar
    // nor the runner knows would leave the card's declared need unenforced while its page
    // showed one.
    if (instructionMode !== undefined && instructionMode !== null && !isWorkbenchInstructionMode(instructionMode)) {
      return `instructionMode must be null or one of ${WORKBENCH_INSTRUCTION_MODES.join(', ')}`
    }
    if (patch.remove === true
      && (patch.name !== undefined
        || patch.skill !== undefined
        || patch.model !== undefined
        || patch.workspace !== undefined
        || patch.permission !== undefined
        || patch.instructionMode !== undefined
        || patch.template !== undefined)) {
      return 'a removal cannot carry a name, a skill, a model, a workspace, a permission, an instruction mode, or a template'
    }
    const template = patch.template
    if (template === undefined) return undefined
    if (!isWorkbenchSkillName(template.skill)) {
      return `template skill ${JSON.stringify(template.skill)} is not a kebab-case skill name`
    }
    const bytes = utf8Bytes(template.html)
    if (bytes > this.options.maxTemplateBytes) {
      return `template is ${String(bytes)} bytes, above the ${String(this.options.maxTemplateBytes)} byte limit`
    }
    const replacing = this.options.template.get(templateKey(patch.cardId, template.skill)) !== undefined
    const held = this.countTemplates(patch.cardId)
    if (!replacing && held >= this.options.maxTemplatesPerCard) {
      return `card already holds ${String(held)} templates, at the ${String(this.options.maxTemplatesPerCard)} limit`
    }
    return undefined
  }

  /**
   * Count the templates one card holds.
   * @param cardId - card identity.
   * @returns the number of stored templates addressed to that card.
   */
  private countTemplates(cardId: string): number {
    let held = 0
    for (const [key] of this.options.template.entries()) {
      if (parseTemplateKey(key)?.cardId === cardId) held += 1
    }
    return held
  }

  /**
   * Run one storage operation, naming the failing operation in the error.
   * @param operation - operation discriminant.
   * @param run - the storage call.
   * @returns resolution after the call settles.
   */
  private async run(operation: 'put' | 'delete', run: () => Promise<unknown>): Promise<void> {
    try {
      await run()
    } catch (error) {
      throw new WorkbenchSkillCardStorageError(operation, error)
    }
  }

  /**
   * Read the clock the store stamps records with.
   * @returns milliseconds since the epoch.
   */
  private moment(): number {
    return this.options.now?.() ?? Date.now()
  }
}

/**
 * Read one structured value as the object an edit merges into.
 *
 * The region HTML lives beside whatever else the run committed, so the fragment has to
 * merge rather than replace. A value that is not a plain object has no fields to keep,
 * and spreading it would invent some: a string would arrive as one key per character.
 * @param value - the structured value as stored.
 * @returns the fields to keep, or an empty object when there are none.
 */
function structuredRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  return { ...value as Record<string, unknown> }
}

/**
 * Size one record as it will be stored.
 * @param record - the record to measure.
 * @returns its UTF-8 byte length, or infinity when it cannot be encoded.
 */
function byteSize(record: WorkbenchResultRecord): number {
  const encoded = JSON.stringify(record)
  return encoded === undefined ? Number.POSITIVE_INFINITY : Buffer.byteLength(encoded, 'utf8')
}

/**
 * Byte length of a string in UTF-8.
 * @param value - the string to measure.
 * @returns its UTF-8 byte length.
 */
function utf8Bytes(value: string): number {
  return Buffer.byteLength(value, 'utf8')
}

/**
 * Fit one result inside a byte budget.
 *
 * The structured value is what the card renders, so it is dropped only when it
 * cannot fit on its own; the activity trace, the text output, and the provider
 * diagnostic are then attached in that order, each truncated to whatever budget
 * remains. This keeps one oversized run from growing the domain without bound while
 * preserving the value the card actually displays.
 *
 * The trace comes before the raw output on purpose: it is what 运行详情 leads with, it is
 * bounded to a few kilobytes by its own limit, and the raw output is material nobody opens
 * unless they are debugging. When even part of the trace cannot be kept, the marker that
 * reports how many entries were dropped is kept instead — a trace that quietly disappeared
 * would read as a run that called no tools at all.
 * @param record - the complete result.
 * @param maxBytes - the deployment's budget for one record.
 * @returns a record no larger than the budget, when an empty record fits at all.
 */
function trimResult(record: WorkbenchResultRecord, maxBytes: number): WorkbenchResultRecord {
  if (byteSize(record) <= maxBytes) return record

  const base: WorkbenchResultRecord = {
    runId: record.runId,
    skill: record.skill,
    executedAt: record.executedAt,
    stopReason: record.stopReason,
    // The route is part of what the result *is*, not payload that may be shed: it is two
    // short ids, and a trimmed record that lost it would leave the user guessing which
    // model produced the result it still shows.
    ...record.model === undefined ? {} : { model: record.model },
    // The session is the same kind of fact: a few characters, and the one thing 重新生成
    // needs. A trimmed record that lost it would show a result nothing can refine.
    ...record.sessionId === undefined ? {} : { sessionId: record.sessionId },
    // And the instruction: two runs of one card differ by it, so a trimmed record that shed
    // it would leave a row nobody can tell apart from the run beside it.
    ...record.instruction === undefined ? {} : { instruction: record.instruction },
  }
  const withStructured: WorkbenchResultRecord = record.structured === undefined
    ? base
    : { ...base, structured: record.structured }
  let current = byteSize(withStructured) <= maxBytes ? withStructured : base

  const activity = fitActivity(record.activity, current, maxBytes)
  if (activity !== undefined) current = { ...current, activity }

  for (const field of ['outputText', 'diagnostic'] as const) {
    const value = record[field]
    if (value === undefined) continue
    if (byteSize({ ...current, [field]: value }) <= maxBytes) {
      current = { ...current, [field]: value }
      continue
    }
    // Truncate on code points so a multi-byte character is never cut in half.
    const points = Array.from(value)
    let low = 0
    let high = points.length
    while (low < high) {
      const mid = Math.ceil((low + high) / 2)
      if (byteSize({ ...current, [field]: points.slice(0, mid).join('') }) <= maxBytes) low = mid
      else high = mid - 1
    }
    if (low > 0) current = { ...current, [field]: points.slice(0, low).join('') }
  }

  return current
}

/**
 * Keep as much of one activity trace as the remaining budget allows.
 *
 * The newest calls are kept first for the same reason the run's own bound keeps them: a
 * trace is read from its end, and the calls nearest the result are the ones that produced
 * it. Whatever is shed is reported by the marker entry, so the stored record still says how
 * many calls happened.
 * @param trace - the trace as the run recorded it.
 * @param base - the record the trace has to fit inside, as far as it is built.
 * @param maxBytes - the deployment's budget for one record.
 * @returns the trace to store, or undefined when none of it fits.
 */
function fitActivity(
  trace: readonly WorkbenchActivityEntry[] | undefined,
  base: WorkbenchResultRecord,
  maxBytes: number,
): readonly WorkbenchActivityEntry[] | undefined {
  if (trace === undefined) return undefined
  const { entries, dropped } = splitActivity(trace)
  if (entries.length === 0) {
    const whole = [...trace]
    return byteSize({ ...base, activity: whole }) <= maxBytes ? whole : undefined
  }
  for (let keep = entries.length; keep >= 1; keep -= 1) {
    const omitted = dropped + (entries.length - keep)
    const candidate: WorkbenchActivityEntry[] = [
      ...omitted === 0 ? [] : [{ kind: 'truncated' as const, dropped: omitted }],
      ...entries.slice(entries.length - keep),
    ]
    if (byteSize({ ...base, activity: candidate }) <= maxBytes) return candidate
  }
  // Not one entry fits, but the count still does: an entry saying "37 entries happened and
  // none of them is stored" is honest, and an absent field would not be.
  const omittedOnly: WorkbenchActivityEntry[] = [{ kind: 'truncated', dropped: dropped + entries.length }]
  return byteSize({ ...base, activity: omittedOnly }) <= maxBytes ? omittedOnly : undefined
}
