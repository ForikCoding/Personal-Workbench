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
import { z } from 'zod';
import type { WorkbenchCardConfigRecord, WorkbenchResultRecord, WorkbenchTemplateRecord } from './skill-card-contract.ts';
/** Table holding one skill selection per card. */
export declare const WORKBENCH_CARD_TABLE = "card";
/** Table holding one template per card and skill. */
export declare const WORKBENCH_TEMPLATE_TABLE = "template";
/** Table holding one execution result per card. */
export declare const WORKBENCH_RESULT_TABLE = "result";
/**
 * Stored schema for one card's selection and name; absence means "not configured yet".
 *
 * Every field the store writes has to appear here. Zod drops a key this schema does not
 * declare, so an undeclared field survives the write and vanishes on the next load —
 * which reads to the user as "it saved, then reverted after a restart".
 */
export declare const workbenchCardConfigSchema: z.ZodObject<{
    skill: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/** Stored schema for one template. */
export declare const workbenchTemplateSchema: z.ZodObject<{
    html: z.ZodString;
}, z.core.$strip>;
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
 */
export declare const workbenchResultSchema: z.ZodObject<{
    skill: z.ZodString;
    executedAt: z.ZodNumber;
    stopReason: z.ZodString;
    structured: z.ZodOptional<z.ZodUnknown>;
    outputText: z.ZodOptional<z.ZodString>;
    diagnostic: z.ZodOptional<z.ZodString>;
    editedAt: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Skill card domain declaration.
 *
 * `per-record` plus `backup-and-skip` is deliberate: the domain layer rejects an
 * unreadable `global` singleton unconditionally, so keeping every value in a
 * table is what makes a single bad record survivable.
 */
export declare const WORKBENCH_SKILL_CARD_DOMAIN: {
    name: string;
    version: number;
    layout: "per-record";
    invalidRecords: "backup-and-skip";
    tables: {
        card: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, WorkbenchCardConfigRecord>;
        template: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, WorkbenchTemplateRecord>;
        result: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, WorkbenchResultRecord>;
    };
};
