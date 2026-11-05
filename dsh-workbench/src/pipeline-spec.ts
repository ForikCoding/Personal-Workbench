/**
 * The workbench pipeline storage domain.
 *
 * Pipelines are durable user arrangements, not run state: one record per pipeline,
 * keyed by its id, holding the name and the ordered steps. A record the current schema
 * cannot read is moved aside and skipped rather than blocking startup, so one bad
 * document never costs the workbench.
 * @module dsh-workbench/pipeline-spec
 */

import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'
import type { WorkbenchPipelineRecord } from './pipeline-contract.ts'
import {
  WORKBENCH_PIPELINE_MAX_STEPS,
  WORKBENCH_PIPELINE_NAME_MAX_LENGTH,
  WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH,
} from './pipeline-contract.ts'
import { WORKBENCH_CARD_ID_MAX_LENGTH } from './layout-contract.ts'

/** Table name holding one record per pipeline. */
export const WORKBENCH_PIPELINE_TABLE = 'pipelines'

/** Stored step schema: a card reference plus, optionally, this step's own instruction. */
export const workbenchPipelineStepSchema = z.object({
  cardId: z.string().min(1).max(WORKBENCH_CARD_ID_MAX_LENGTH),
  instruction: z.string().max(WORKBENCH_PIPELINE_STEP_INSTRUCTION_MAX_LENGTH).optional(),
})

/**
 * Stored record schema.
 *
 * The name and the step list are the whole record; the identity is the table key. An
 * `updatedAt` that a document happens not to carry validates into a record without one
 * only if the field is optional — it is required here, because a stored pipeline with no
 * timestamp is a record this version cannot place, and backupping it is the honest
 * outcome rather than inventing a date.
 */
export const workbenchPipelineSchema = z.object({
  name: z.string().min(1).max(WORKBENCH_PIPELINE_NAME_MAX_LENGTH),
  steps: z.array(workbenchPipelineStepSchema).max(WORKBENCH_PIPELINE_MAX_STEPS),
  updatedAt: z.number().finite().nonnegative(),
})

/**
 * Pipeline domain declaration.
 *
 * `per-record` plus `backup-and-skip` for the same reason the layout domain uses it: the
 * domain layer rejects an unreadable `global` singleton unconditionally, so keeping
 * pipelines in a table is what makes one unreadable pipeline survivable.
 */
export const WORKBENCH_PIPELINE_DOMAIN = defineDomain({
  name: 'workbench_pipeline',
  version: 1,
  layout: 'per-record',
  invalidRecords: 'backup-and-skip',
  tables: {
    [WORKBENCH_PIPELINE_TABLE]: domainTable<string, WorkbenchPipelineRecord>(
      workbenchPipelineSchema as unknown as Parameters<typeof domainTable<string, WorkbenchPipelineRecord>>[0],
    ),
  },
})
