/**
 * In-memory skill card tables used by the Host-side specs.
 *
 * They mirror the storage-domain tables the store consumes and record every
 * durable operation into one shared log, so a spec can assert exactly what a
 * patch wrote and to which table.
 */
import type {
  WorkbenchCardConfigRecord,
  WorkbenchResultRecord,
  WorkbenchTemplateRecord,
} from '../../src/skill-card-contract.ts'
import type { SkillCardTable } from '../../src/skill-card-store.ts'

/** Which of the three tables an operation landed on. */
export type SkillCardTableName = 'card' | 'template' | 'result'

/** One recorded durable operation. */
export type SkillCardTableOperation =
  | { readonly table: SkillCardTableName; readonly kind: 'put'; readonly key: string; readonly value: unknown }
  | { readonly table: SkillCardTableName; readonly kind: 'delete'; readonly key: string }

/** Table double with a readable operation log. */
export class FakeSkillCardTable<T> implements SkillCardTable<T> {
  private readonly records = new Map<string, T>()

  /**
   * @param table - which table this double stands in for.
   * @param log - shared operation log.
   * @param seed - records the table starts with.
   */
  constructor(
    private readonly table: SkillCardTableName,
    private readonly log: SkillCardTableOperation[],
    seed: Readonly<Record<string, T>> = {},
  ) {
    for (const [key, value] of Object.entries(seed)) this.records.set(key, value)
  }

  /** @param key - record key. @returns the stored record. */
  get(key: string): T | undefined {
    return this.records.get(key)
  }

  /** @returns a snapshot of the stored pairs. */
  entries(): IterableIterator<[string, T]> {
    return new Map(this.records).entries()
  }

  /**
   * @param key - record key.
   * @param value - complete record.
   */
  async put(key: string, value: T): Promise<void> {
    this.log.push({ table: this.table, kind: 'put', key, value })
    this.records.set(key, value)
  }

  /**
   * @param key - record key.
   * @returns whether a record was removed.
   */
  async delete(key: string): Promise<boolean> {
    this.log.push({ table: this.table, kind: 'delete', key })
    return this.records.delete(key)
  }

  /**
   * Replace the durable write with a failure, to drive storage-failure paths.
   * @param failure - the error every later `put` throws.
   */
  failPuts(failure: Error): void {
    this.put = () => { throw failure }
  }
}

/** The three tables over one shared operation log. */
export interface FakeSkillCardTables {
  readonly card: FakeSkillCardTable<WorkbenchCardConfigRecord>
  readonly template: FakeSkillCardTable<WorkbenchTemplateRecord>
  readonly result: FakeSkillCardTable<WorkbenchResultRecord>
  readonly operations: SkillCardTableOperation[]
}

/** Records each table may start with. */
export interface FakeSkillCardSeed {
  readonly card?: Readonly<Record<string, WorkbenchCardConfigRecord>>
  readonly template?: Readonly<Record<string, WorkbenchTemplateRecord>>
  readonly result?: Readonly<Record<string, WorkbenchResultRecord>>
}

/**
 * Build the three tables over one shared operation log.
 * @param seed - records each table starts with.
 * @returns the tables and their log.
 */
export function fakeSkillCardTables(seed: FakeSkillCardSeed = {}): FakeSkillCardTables {
  const operations: SkillCardTableOperation[] = []
  return {
    card: new FakeSkillCardTable('card', operations, seed.card ?? {}),
    template: new FakeSkillCardTable('template', operations, seed.template ?? {}),
    result: new FakeSkillCardTable('result', operations, seed.result ?? {}),
    operations,
  }
}
