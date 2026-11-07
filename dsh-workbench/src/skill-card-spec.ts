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
import { WORKBENCH_INSTRUCTION_MODES, WORKBENCH_SANDBOX_MODES } from './skill-card-contract.ts'

/** Table holding one skill selection per card. */
export const WORKBENCH_CARD_TABLE = 'card'

/** Table holding one template per card and skill. */
export const WORKBENCH_TEMPLATE_TABLE = 'template'

/** Table holding one execution result per card. */
export const WORKBENCH_RESULT_TABLE = 'result'

/**
 * Stored form of one provider/model route.
 *
 * The pair is stored as two fields rather than one `"provider/model"` string, so no
 * reader ever has to split it back apart: a provider id may itself contain a slash.
 */
export const workbenchCardModelSchema = z.object({
  provider: z.string(),
  model: z.string(),
})

/**
 * Stored form of one card's workspace.
 *
 * One field holding the full absolute path, never a workspace id: the product decision is
 * whichever directory the user picked, which need not be a registered workspace. An id
 * would additionally make the card depend on a registry entry that can be renamed.
 */
export const workbenchCardWorkspaceSchema = z.object({
  path: z.string(),
})

/**
 * Stored schema for one card's selection and name; absence means "not configured yet".
 *
 * Every field the store writes has to appear here. Zod drops a key this schema does not
 * declare, so an undeclared field survives the write and vanishes on the next load —
 * which reads to the user as "it saved, then reverted after a restart".
 *
 * `workspace` is declared in the same change that writes it, for that same reason: a card
 * that lost its directory would silently stop being runnable after a restart.
 *
 * `permission` follows the same rule. Losing it is the worst of the four: the card would
 * come back under the default mode, so a card the user deliberately narrowed would quietly
 * run with wider write access than the page showed.
 *
 * `instructionMode` was the one field that got away, and it is the reason this rule is
 * written down twice: 运行指令 was added to the page and to the store, not to this schema, so
 * every card came back asking for no instruction after a restart — the select read 不需要
 * again on a card the user had set to 必须. The store wrote it and the load threw it away.
 */
export const workbenchCardConfigSchema = z.object({
  skill: z.string().optional(),
  name: z.string().optional(),
  model: workbenchCardModelSchema.optional(),
  workspace: workbenchCardWorkspaceSchema.optional(),
  // The enum rather than a plain string: a stored mode this build does not know must fail
  // loudly at load (backup-and-skip) instead of being handed to the sandbox later.
  permission: z.enum(WORKBENCH_SANDBOX_MODES).optional(),
  // The same treatment for the same reason: a mode this build cannot name is a mode it cannot
  // enforce, and a card whose runs required an instruction must not come back not requiring it.
  instructionMode: z.enum(WORKBENCH_INSTRUCTION_MODES).optional(),
})

/** Stored schema for one template. */
export const workbenchTemplateSchema = z.object({
  html: z.string(),
})

/**
 * Stored form of one activity entry.
 *
 * A discriminated union rather than an optional `dropped` field on one shape: the trace is
 * a list of calls and narration plus, at most once and only at the front, the count a bound
 * removed. Both halves are stored, so a bounded trace says so after a reload instead of
 * looking complete.
 *
 * Every kind {@link WorkbenchActivityEntry} declares is stored. The runner writes a
 * narration entry for each reasoning and text span of the child's own words, and the
 * result page renders them, so a schema that omitted either would read a good record as
 * invalid and the domain would back it up and skip it on the next start — the user sees a
 * run result that vanished after a restart.
 */
export const workbenchActivityEntrySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('tool'),
    tool: z.string().min(1),
    argument: z.string(),
  }),
  z.object({
    kind: z.literal('reasoning'),
    text: z.string(),
  }),
  z.object({
    kind: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    kind: z.literal('truncated'),
    dropped: z.number().int().positive(),
  }),
])

/**
 * Stored schema for one result.
 *
 * `stopReason` stays a plain string because the upstream stop reasons are
 * merge-extensible; closing the union here would reject a value a future
 * provider legitimately reports.
 *
 * `editedAt` is declared here in the same change that writes it. A field the store
 * writes and this schema does not know is dropped on the next load, which reads to the
 * user as "it saved, then reverted after a restart" — the bug that once lost card names.
 *
 * `model` is declared for the same reason: the runner stamps the route it ran on, and a
 * result that silently lost it would put the user back to guessing which model produced
 * what they are reading.
 *
 * `activity` follows the same rule, and it is the fifth field added this way. The runner
 * writes the trace and 运行详情 renders it after the run, so a schema that did not declare
 * it would show the stream while the run is live and then lose every line of it on the
 * next load — a trace that vanishes is worse than no trace, because the card looks like a
 * run that used no tools.
 *
 * `sessionId` is the sixth, and the only one another control reads: 重新生成 sends it back
 * to have the revision run in the session the result came from. Dropping it on load would
 * leave every past result unrefinable, with nothing on screen to say why.
 */
/**
 * Stored schema for where a result came from.
 *
 * The panel reads it after a reload to say how a step's product was made — a run of the
 * whole chain or a run of that step alone — so it is a fact about the product and follows
 * the same rule as the rest of the record: written by the store, declared here, or lost on
 * the next load and reported as "already has a result" forever.
 */
const workbenchResultPipelineSchema = z.object({
  id: z.string(),
  step: z.number().int().nonnegative(),
  // A plain enum of the three known readings: a scope from a newer build is not worth
  // refusing a whole result over, and the reader already treats an unknown one as unknown.
  scope: z.enum(['full', 'single', 'refine']).optional(),
})

export const workbenchResultSchema = z.object({
  // Declared in the same change that started writing it, for the exact reason this
  // comment block keeps repeating: the runner stores the run id and the reader names
  // the run by it, but zod drops a key the schema does not declare, so an undeclared
  // id survived the write and vanished on the next load. The client then refused the
  // whole snapshot — one undeclared field blanked every card on the board.
  //
  // Optional because a record written before the run history was kept has no id: the
  // reader stamps the legacy run id on it instead of the domain backing it up and
  // skipping it. A composite-key record keeps the id this field carries.
  runId: z.string().optional(),
  // Declared in the same change that started writing it. The runner stamps the session a
  // run executed in so 重新生成 can continue it, and a field the store writes and this
  // schema does not declare is dropped on the next load: the result would still render,
  // but 重新生成 would then refuse every run the user made before the restart, because the
  // record no longer says where it happened.
  //
  // Optional because every record written before this field existed has none: the reader
  // keeps those results and refuses only a refinement of one, which is a state it can
  // explain. A required field here would have made the domain back up and skip them.
  sessionId: z.string().optional(),
  skill: z.string(),
  executedAt: z.number().finite().nonnegative(),
  stopReason: z.string(),
  model: workbenchCardModelSchema.optional(),
  structured: z.unknown().optional(),
  // What the run was asked to do. Written by the runner next to the result it produced and
  // declared here in the same change, for the reason above: two runs of one card differ by
  // their instruction, and a record that shed it on load leaves two rows nobody can tell
  // apart. Optional because a result written before the composer kept the ask has none.
  instruction: z.string().optional(),
  outputText: z.string().optional(),
  diagnostic: z.string().optional(),
  // The verdict of a run that produced no document, and the code that names it. Both are
  // written by the runner when a run is refused or fails, and both are what the card draws
  // its notice from: an undeclared field here made a failed run look like a run that had
  // simply produced nothing, with the refusal gone after the next start.
  //
  // The code is a plain string rather than the closed union: a code from a newer build must
  // still load, and the card already falls back to a generic title for one it cannot name.
  failure: z.string().optional(),
  failureCode: z.string().optional(),
  editedAt: z.number().finite().nonnegative().optional(),
  activity: z.array(workbenchActivityEntrySchema).optional(),
  // The seventh field added this way, and the one the pipeline panel reads instead of its
  // own run history once that history is gone.
  pipeline: workbenchResultPipelineSchema.optional(),
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
