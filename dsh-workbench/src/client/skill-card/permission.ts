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

import type { WorkbenchInstructionMode, WorkbenchSandboxMode } from '../../skill-card-contract.ts'
import type { WorkbenchLocaleKey } from '../locales.ts'

/**
 * Locale key for each mode's label.
 *
 * A record rather than a lookup with a fallback: a mode added to the contract fails
 * compilation here until both dictionaries have copy for it.
 */
const PERMISSION_LABEL_KEYS: Record<WorkbenchSandboxMode, WorkbenchLocaleKey> = {
  'read-only': 'skillCardPermissionReadOnly',
  'workspace-write': 'skillCardPermissionWorkspaceWrite',
  'danger-full-access': 'skillCardPermissionFullAccess',
}

/**
 * Read the locale key naming one permission mode.
 * @param mode - the mode to name.
 * @returns the dictionary key holding its label.
 */
export function permissionLabelKey(mode: WorkbenchSandboxMode): WorkbenchLocaleKey {
  return PERMISSION_LABEL_KEYS[mode]
}

/**
 * Locale key for the one line saying what each mode actually allows.
 *
 * The three modes do not promise the same thing, so one sentence covering all of them is
 * always wrong for two of them: "writes stay inside the workspace" is false for read-only
 * (nothing is written) and false for full access (writes go wherever). The note follows the
 * value, the way the label does.
 */
const PERMISSION_NOTE_KEYS: Record<WorkbenchSandboxMode, WorkbenchLocaleKey> = {
  'read-only': 'pipeCfgPermissionNoteReadOnly',
  'workspace-write': 'pipeCfgPermissionNoteWorkspaceWrite',
  'danger-full-access': 'pipeCfgPermissionNoteFullAccess',
}

/**
 * Read the locale key explaining one permission mode to the user.
 * @param mode - the mode in force.
 * @returns the dictionary key holding the one-line explanation.
 */
export function permissionNoteKey(mode: WorkbenchSandboxMode): WorkbenchLocaleKey {
  return PERMISSION_NOTE_KEYS[mode]
}

/**
 * Locale key for each instruction mode's label.
 *
 * Exhaustive for the same reason as the permissions above: a mode added to the contract
 * fails compilation here until both dictionaries name it.
 */
const INSTRUCTION_LABEL_KEYS: Record<WorkbenchInstructionMode, WorkbenchLocaleKey> = {
  none: 'skillCardInstructionNone',
  optional: 'skillCardInstructionOptional',
  required: 'skillCardInstructionRequired',
}

/**
 * Read the locale key naming one instruction mode.
 * @param mode - the mode to name.
 * @returns the dictionary key holding its label.
 */
export function instructionLabelKey(mode: WorkbenchInstructionMode): WorkbenchLocaleKey {
  return INSTRUCTION_LABEL_KEYS[mode]
}
