/**
 * The workbench pipeline storage domain.
 *
 * Pipelines are durable user arrangements, not run state: one record per pipeline,
 * keyed by its id, holding the name and the ordered steps. A record the current schema
 * cannot read is moved aside and skipped rather than blocking startup, so one bad
 * document never costs the workbench.
 * @module dsh-workbench/pipeline-spec
 */
import { z } from 'zod';
import type { WorkbenchPipelineRecord } from './pipeline-contract.ts';
/** Table name holding one record per pipeline. */
export declare const WORKBENCH_PIPELINE_TABLE = "pipelines";
/** Stored step schema: a card reference plus, optionally, this step's own instruction. */
export declare const workbenchPipelineStepSchema: z.ZodObject<{
    cardId: z.ZodString;
    instruction: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Stored record schema.
 *
 * The name and the step list are the whole record; the identity is the table key. An
 * `updatedAt` that a document happens not to carry validates into a record without one
 * only if the field is optional — it is required here, because a stored pipeline with no
 * timestamp is a record this version cannot place, and backupping it is the honest
 * outcome rather than inventing a date.
 */
export declare const workbenchPipelineSchema: z.ZodObject<{
    name: z.ZodString;
    steps: z.ZodArray<z.ZodObject<{
        cardId: z.ZodString;
        instruction: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    updatedAt: z.ZodNumber;
}, z.core.$strip>;
/**
 * Pipeline domain declaration.
 *
 * `per-record` plus `backup-and-skip` for the same reason the layout domain uses it: the
 * domain layer rejects an unreadable `global` singleton unconditionally, so keeping
 * pipelines in a table is what makes one unreadable pipeline survivable.
 */
export declare const WORKBENCH_PIPELINE_DOMAIN: {
    name: string;
    version: number;
    layout: "per-record";
    invalidRecords: "backup-and-skip";
    tables: {
        pipelines: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, WorkbenchPipelineRecord>;
    };
};
