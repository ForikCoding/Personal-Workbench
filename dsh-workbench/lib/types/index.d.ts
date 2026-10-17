/**
 * Workbench Host half: opens the layout and skill card storage domains, serves
 * their private routes, and releases everything with the plugin's own effects.
 *
 * Both services stay inside this plugin: each one's only caller is its route,
 * and no other Host plugin consumes them.
 * @module dsh-workbench
 */
import type { Context } from '@deepseek-ai/cordis';
import { Config } from './config.ts';
import type { Config as WorkbenchConfig } from './config.ts';
export { Config };
/** Stable Cordis plugin name. */
export declare const name = "workbench";
/**
 * Required Host services.
 *
 * `storage` is named because the storage-domain form mounts over the hub, so
 * opening a domain before the hub exists would fail as a missing service rather
 * than as a startup error. The skill card names the three services its runner
 * reads: the context proxy refuses an undeclared member even when the read goes
 * through a narrowed type, and `subagents` also gates a composition without a
 * subagent plane at load instead of leaving a card that can never run.
 *
 * The working-directory service is deliberately NOT named: the stable channel's
 * pinned harness predates it, so requiring it would leave the whole plugin
 * pending there. The runner reads it optionally and falls back to the session
 * header.
 */
export declare const inject: string[];
/**
 * Open the layout domain and register the layout route.
 * @param ctx - Host context.
 * @param config - validated workbench configuration.
 */
export declare function apply(ctx: Context, config: WorkbenchConfig): void;
