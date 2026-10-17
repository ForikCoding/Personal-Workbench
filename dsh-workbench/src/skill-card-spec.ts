/**
 * The skill card storage domain.
 *
 * Three tables with three different lifetimes: `card` holds the user's skill
 * selection, `template` holds the user's HTML keyed by card and skill, and
 * `result` holds disposable execution output. Keeping them in one new domain
 * rather than extending the published layout domain lets a deployment drop the
 * cache without touching user assets.
 *
 * As in the layout domain, a record the current schema cannot read is moved
 * aside and skipped rather than blocking startup.
 * @module dsh-workbench/skill-card-spec
 */

import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'
import type {
  WorkbenchCardConfigRecord,
  WorkbenchResultRecord,
  WorkbenchTemplateRecord,
} from './skill-card-contract.ts'

/** Table holding one skill selection per card. */
export const WORKBENCH_CARD_TABLE = 'card'

/** Table holding one template per card and skill. */
export const WORKBENCH_TEMPLATE_TABLE = 'template'

/** Table holding one execution result per card. */
export const WORKBENCH_RESULT_TABLE = 'result'

/** Stored schema for one card's selection; absence means "not configured yet". */
export const workbenchCardConfigSchema = z.object({
  skill: z.string().optional(),
})

/** Stored schema for one template. */
export const workbenchTemplateSchema = z.object({
  html: z.string(),
})

/**
 * Stored schema for one result.
 *
 * `stopReason` stays a plain string because the upstream stop reasons are
 * merge-extensible; closing the union here would reject a value a future
 * provider legitimately reports.
 */
export const workbenchResultSchema = z.object({
  skill: z.string(),
  executedAt: z.number().finite().nonnegative(),
  stopReason: z.string(),
  structured: z.unknown().optional(),
  outputText: z.string().optional(),
  diagnostic: z.string().optional(),
})

/**
 * Present a zod schema as the domain table's schema type.
 *
 * The assertion is needed once because `exactOptionalPropertyTypes` distinguishes
 * an absent field from a field holding `undefined`, while zod's `.optional()`
 * produces the latter. The stored record type is what the table declares; the
 * schema validates presence at the durable boundary.
 * @param schema - the zod schema for one table's records.
 * @returns the same schema under the domain table's parameter type.
 */
function tableSchema<T>(schema: z.ZodType): Parameters<typeof domainTable<string, T>>[0] {
  return schema as unknown as Parameters<typeof domainTable<string, T>>[0]
}

/**
 * Skill card domain declaration.
 *
 * `per-record` plus `backup-and-skip` is deliberate: the domain layer rejects an
 * unreadable `global` singleton unconditionally, so keeping every value in a
 * table is what makes a single bad record survivable.
 */
export const WORKBENCH_SKILL_CARD_DOMAIN = defineDomain({
  name: 'workbench_skill_card',
  version: 1,
  layout: 'per-record',
  invalidRecords: 'backup-and-skip',
  tables: {
    [WORKBENCH_CARD_TABLE]: domainTable<string, WorkbenchCardConfigRecord>(tableSchema(workbenchCardConfigSchema)),
    [WORKBENCH_TEMPLATE_TABLE]: domainTable<string, WorkbenchTemplateRecord>(tableSchema(workbenchTemplateSchema)),
    [WORKBENCH_RESULT_TABLE]: domainTable<string, WorkbenchResultRecord>(tableSchema(workbenchResultSchema)),
  },
})
