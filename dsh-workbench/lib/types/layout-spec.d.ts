/**
 * The workbench layout storage domain.
 *
 * The layout is durable UI state, not user configuration: one record per card,
 * keyed by card identity, holding the user's position. A record the current
 * schema cannot read is moved aside and skipped rather than blocking startup,
 * so a bad document never costs the workbench.
 * @module dsh-workbench/layout-spec
 */
import { z } from 'zod';
import type { WorkbenchCardLayoutRecord } from './layout-contract.ts';
/** Table name holding one record per card. */
export declare const WORKBENCH_LAYOUT_TABLE = "layout";
/**
 * Stored record schema.
 *
 * `position` is the whole record: hiding is not a capability of this product,
 * so a stored document that still carries a `hidden` field simply validates
 * into a record without it, and the card reads as visible.
 */
export declare const workbenchCardLayoutSchema: z.ZodObject<{
    position: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Layout domain declaration.
 *
 * `per-record` plus `backup-and-skip` is deliberate: the domain layer rejects
 * an unreadable `global` singleton unconditionally, so keeping the layout in a
 * table is what makes a single bad record survivable. The table's value type is
 * the contract's record, which the schema validates field by field.
 */
export declare const WORKBENCH_LAYOUT_DOMAIN: {
    name: string;
    version: number;
    layout: "per-record";
    invalidRecords: "backup-and-skip";
    tables: {
        layout: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, WorkbenchCardLayoutRecord>;
    };
};
