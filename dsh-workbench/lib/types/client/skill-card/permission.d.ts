/**
 * The card's permission field: the copy that names each mode.
 *
 * A module rather than a table inside the one component that renders the picker, because
 * two surfaces say the same three names: the configuration page renders the choice, and the
 * result page states the mode the card's runs use. Reading them from one record is what
 * keeps the same mode from being called two different things on two pages.
 *
 * The labels are the ones the application's own permission selector uses, so a mode reads
 * the same wherever it appears in the product.
 * @module dsh-workbench/client/skill-card/permission
 */
import type { WorkbenchSandboxMode } from '../../skill-card-contract.ts';
import type { WorkbenchLocaleKey } from '../locales.ts';
/**
 * Read the locale key naming one permission mode.
 * @param mode - the mode to name.
 * @returns the dictionary key holding its label.
 */
export declare function permissionLabelKey(mode: WorkbenchSandboxMode): WorkbenchLocaleKey;
