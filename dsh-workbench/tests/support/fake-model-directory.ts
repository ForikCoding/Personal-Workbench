/**
 * Model directory double that only reports the full catalog after a load.
 *
 * The live defect this reproduces is not "nothing loaded": it is a directory that is `ready`
 * with the providers that existed when *another* surface loaded it, so the catalog on screen is
 * smaller than the one the application offers. A double whose snapshot is fixed cannot show
 * that, and — the reason this file exists — cannot show whether the field ever *asked*: it
 * counts `load()` calls and answers the short catalog until one arrives.
 *
 * The seat is built by the production factory, so a spec drives the real read/subscribe
 * wiring rather than a second implementation of it.
 */
import type {
  WorkbenchModelDirectory,
  WorkbenchModelDirectoryState,
  WorkbenchModelGroup,
  WorkbenchModelSeat,
} from '../../src/client/skill-card/model.ts'
import { createModelSeat } from '../../src/client/skill-card/model.ts'

/**
 * Build one provider group.
 * @param id - provider route id, also used as its display name.
 * @param models - model ids it advertises.
 * @returns the group.
 */
export function modelGroup(id: string, models: readonly string[]): WorkbenchModelGroup {
  return { id, name: id, models: models.map(model => ({ id: model, name: model })) }
}

/**
 * The catalog an early load leaves behind: one provider, two models.
 *
 * Shaped after the deployment the stale reading came from: this directory was `ready` with
 * one provider and two models while the Host held three groups and eight.
 */
export const STALE_DIRECTORY_STATE: WorkbenchModelDirectoryState = {
  current: { provider: 'deepseek-account', model: 'deepseek-flash' },
  status: 'ready',
  groups: [modelGroup('deepseek-account', ['deepseek-flash', 'deepseek-reasoner'])],
}

/** The catalog a load returns once the directory is asked: three groups, eight models. */
export const FULL_DIRECTORY_STATE: WorkbenchModelDirectoryState = {
  current: { provider: 'deepseek-account', model: 'deepseek-flash' },
  status: 'ready',
  groups: [
    modelGroup('deepseek-account', ['deepseek-flash', 'deepseek-reasoner']),
    modelGroup('minimax-cn', ['MiniMax-M2.7', 'MiniMax-M2.7-highspeed', 'MiniMax-M3']),
    modelGroup('lightcode', ['GLM-4.6V', 'MiniMax-M2.5', 'GLM-FLASH-LATEST']),
  ],
}

/** What a case varies about the double. */
export interface CountingModelDirectoryOptions {
  /** The snapshot before any load: what an interrupted or early load left behind. */
  readonly before?: WorkbenchModelDirectoryState
  /** The snapshot after `load()` settles. */
  readonly after?: WorkbenchModelDirectoryState
}

/** The double and the facts a spec asserts about it. */
export interface CountingModelDirectory {
  /** The seat the pages consume, over this directory. */
  readonly seat: WorkbenchModelSeat
  /** How many times anything asked this directory to load. */
  loads(): number
  /** Resolve the directory straight, for a spec that drives its state. */
  readonly directory: WorkbenchModelDirectory
}

/**
 * Build a directory whose snapshot changes only when it is loaded.
 * @param options - the before/after snapshots.
 * @returns the seat, the load count, and the directory.
 */
export function countingModelDirectory(options: CountingModelDirectoryOptions = {}): CountingModelDirectory {
  const before = options.before ?? STALE_DIRECTORY_STATE
  const after = options.after ?? FULL_DIRECTORY_STATE
  const listeners = new Set<() => void>()
  let state = before
  let loads = 0
  const directory: WorkbenchModelDirectory = {
    store: {
      getSnapshot: () => state,
      subscribe: (listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    },
    // The snapshot settles before the listeners hear about it, the way the upstream store
    // writes its result and then notifies: a seat that read after a notification sees the
    // loaded catalog rather than the one it replaced.
    load: async () => {
      loads += 1
      state = after
      for (const listener of [...listeners]) listener()
      return state
    },
  }
  const resolver = { directoryFor: (): WorkbenchModelDirectory => directory }
  return { seat: createModelSeat(() => resolver), loads: () => loads, directory }
}
