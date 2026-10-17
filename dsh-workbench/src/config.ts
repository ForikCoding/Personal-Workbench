/**
 * Workbench Host plugin config.
 * @module dsh-workbench/config
 */

import z from '@deepseek-ai/schemastery'
import {
  WORKBENCH_RESULT_MAX_BYTES,
  WORKBENCH_TEMPLATE_MAX_BYTES,
  WORKBENCH_TEMPLATE_MAX_PER_CARD,
} from './skill-card-contract.ts'

/** Deployment-varying workbench settings. */
export interface Config {
  /** Whether the Host half opens its storage domains and registers its routes. */
  enabled: boolean
  /** Maximum stored card layout records; also caps one request's entry count. */
  maxRecords: number
  /**
   * Subagent backend the skill card runs on.
   *
   * A provider that is missing or lacks structured output is a deployment
   * mistake, so the entry refuses to start rather than failing at the first run.
   */
  subagentProvider: string
  /** Bytes one skill card template may occupy. */
  maxTemplateBytes: number
  /** Templates one card may hold, one per skill. */
  maxTemplatesPerCard: number
  /** Bytes one stored execution result may occupy. */
  maxResultBytes: number
  /** Milliseconds one skill card run may take before it is cancelled. */
  runTimeoutMs: number
  /** Runs allowed to be in flight across all cards. */
  maxConcurrentRuns: number
  /** Age after which a stored result is shown as expired; it is never re-run automatically. */
  resultStaleAfterMs: number
}

/**
 * Validated config.
 *
 * The byte and count ceilings equal the wire contract's limits rather than
 * exceeding them, so a deployment can only tighten what both halves already
 * enforce.
 */
export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  maxRecords: z.number().step(1).min(1).max(4096).default(256),
  subagentProvider: z.string().min(1).default('spawn'),
  maxTemplateBytes: z.number().step(1).min(1024).max(WORKBENCH_TEMPLATE_MAX_BYTES).default(WORKBENCH_TEMPLATE_MAX_BYTES),
  maxTemplatesPerCard: z.number().step(1).min(1).max(64).default(WORKBENCH_TEMPLATE_MAX_PER_CARD),
  maxResultBytes: z.number().step(1).min(1024).max(1024 * 1024).default(WORKBENCH_RESULT_MAX_BYTES),
  runTimeoutMs: z.number().step(1).min(1000).max(3_600_000).default(120_000),
  maxConcurrentRuns: z.number().step(1).min(1).max(8).default(1),
  resultStaleAfterMs: z.number().step(1).min(60_000).default(86_400_000),
})
