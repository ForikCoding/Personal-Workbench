/**
 * Workbench Host plugin config.
 * @module dsh-workbench/config
 */
import z from '@deepseek-ai/schemastery';
/** Deployment-varying workbench settings. */
export interface Config {
    /** Whether the Host half opens its storage domains and registers its routes. */
    enabled: boolean;
    /** Maximum stored card layout records; also caps one request's entry count. */
    maxRecords: number;
    /**
     * Subagent backend the skill card runs on.
     *
     * A provider that is missing or lacks structured output is a deployment
     * mistake, so the entry refuses to start rather than failing at the first run.
     */
    subagentProvider: string;
    /** Bytes one skill card template may occupy. */
    maxTemplateBytes: number;
    /** Templates one card may hold, one per skill. */
    maxTemplatesPerCard: number;
    /** Bytes one stored execution result may occupy. */
    maxResultBytes: number;
    /** Milliseconds one skill card run may take before it is cancelled. */
    runTimeoutMs: number;
    /** Runs allowed to be in flight across all cards. */
    maxConcurrentRuns: number;
    /** Age after which a stored result is shown as expired; it is never re-run automatically. */
    resultStaleAfterMs: number;
}
/**
 * Validated config.
 *
 * The byte and count ceilings equal the wire contract's limits rather than
 * exceeding them, so a deployment can only tighten what both halves already
 * enforce.
 */
export declare const Config: z<Config>;
