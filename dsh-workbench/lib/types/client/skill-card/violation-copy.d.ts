/**
 * Copy for the five content-policy refusals.
 *
 * One home because two editors report them: the template editor on a whole document, and
 * the result editor on a filled region. The rule set is the renderer's own policy, so the
 * wording of a refusal must not depend on which field the construct was typed into.
 * @module dsh-workbench/client/skill-card/violation-copy
 */
import type { WorkbenchLocaleKey } from '../locales.ts';
import type { WorkbenchContentViolationCode } from './policy.ts';
/**
 * Locale key for every content-policy code.
 *
 * A record rather than a lookup with a fallback, so a new code fails compilation here
 * until both dictionaries carry its copy.
 */
export declare const CONTENT_VIOLATION_KEYS: Record<WorkbenchContentViolationCode, WorkbenchLocaleKey>;
