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
import type { WorkbenchPipelineRecord, WorkbenchPipelineRun } from './pipeline-contract.ts';
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
/** Table name holding one record per pipeline execution. */
export declare const WORKBENCH_PIPELINE_RUN_TABLE = "runs";
/** Stored step schema: what one step of an execution left behind. */
export declare const workbenchPipelineRunStepSchema: z.ZodObject<{
    cardId: z.ZodString;
    phase: z.ZodEnum<{
        done: "done";
        failed: "failed";
        stopped: "stopped";
    }>;
    tookMs: z.ZodOptional<z.ZodNumber>;
    failure: z.ZodOptional<z.ZodString>;
    html: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Stored execution schema: the whole record, identity included.
 *
 * The table key repeats `pipelineId` and `no` rather than replacing them. A record that can
 * be read without decoding its key is what lets one unreadable document be moved aside
 * without also losing which run it was.
 */
export declare const workbenchPipelineRunSchema: z.ZodObject<{
    pipelineId: z.ZodString;
    no: z.ZodNumber;
    startedAt: z.ZodNumber;
    tookMs: z.ZodNumber;
    phase: z.ZodEnum<{
        settled: "settled";
        failed: "failed";
        stopped: "stopped";
    }>;
    scope: z.ZodEnum<{
        full: "full";
        single: "single";
        refine: "refine";
    }>;
    only: z.ZodOptional<z.ZodNumber>;
    instruction: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        cardId: z.ZodString;
        phase: z.ZodEnum<{
            done: "done";
            failed: "failed";
            stopped: "stopped";
        }>;
        tookMs: z.ZodOptional<z.ZodNumber>;
        failure: z.ZodOptional<z.ZodString>;
        html: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Execution domain declaration.
 *
 * Its own domain rather than another table in the pipeline one: an execution is appended by
 * the run engine while the definition table is rewritten whole by the panel on every config
 * edit, and one unreadable execution must cost that execution only.
 */
export declare const WORKBENCH_PIPELINE_RUN_DOMAIN: {
    name: string;
    version: number;
    layout: "per-record";
    invalidRecords: "backup-and-skip";
    tables: {
        runs: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, WorkbenchPipelineRun>;
    };
};
