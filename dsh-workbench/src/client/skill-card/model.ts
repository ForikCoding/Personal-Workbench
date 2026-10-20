/**
 * The card's model field: what it offers, what it falls back to, and when a card cannot
 * run at all.
 *
 * The model catalog belongs to `ui-model-selection`, which is a service this plugin may
 * not have. Everything here therefore reads a *narrowed* directory — the four facts this
 * feature uses — and never calls `select()`: a card chooses the model its own runs use,
 * never the session's model.
 *
 * The deciding question throughout is "is there a model we can run with", never "did the
 * picker load". A directory that failed to answer while the session's saved selection is
 * still known leaves the card runnable, and a catalog that loaded but saved nothing known
 * does not make one up.
 * @module dsh-workbench/client/skill-card/model
 */

import type { WorkbenchCardModel } from '../../skill-card-contract.ts'
import { isWorkbenchCardModel } from '../../skill-card-contract.ts'

/** One model as a picker shows it. */
export interface WorkbenchModelOption {
  /** Model id the provider advertises. */
  readonly id: string
  /** Display name; the field labels options with this, never with the id. */
  readonly name: string
}

/** One provider and the models it offers. */
export interface WorkbenchModelGroup {
  /** Provider route id. */
  readonly id: string
  /** Display name of the provider, used as the option group's label. */
  readonly name: string
  /** Models this provider advertises. */
  readonly models: readonly WorkbenchModelOption[]
}

/** Lifecycle of the directory read, as the picker needs to know it. */
export type WorkbenchModelDirectoryStatus = 'idle' | 'loading' | 'ready' | 'selecting' | 'error'

/**
 * What the model directory knows about one session, narrowed to what the field reads.
 *
 * `available: false` means the service is missing or refused this session (an addressed
 * subagent has no model selection of its own), which is a different fact from a
 * directory that answered with nothing.
 */
export interface WorkbenchModelDirectoryView {
  /** Whether a directory answered at all. */
  readonly available: boolean
  /** Lifecycle of that directory's own load. */
  readonly status: WorkbenchModelDirectoryStatus
  /** The session's saved selection, retained even when its model left the catalog. */
  readonly current: WorkbenchCardModel | null
  /** Provider groups from the directory's last good load. */
  readonly groups: readonly WorkbenchModelGroup[]
}

/** The view of a directory this client cannot reach at all. */
export const NO_MODEL_DIRECTORY: WorkbenchModelDirectoryView = {
  available: false,
  status: 'idle',
  current: null,
  groups: [],
}

/**
 * What the configuration page renders for the model, and whether a run can start.
 *
 * Three states rather than a picker plus flags, because the run control's answer and the
 * field's answer have to be the same answer: a field that says "unavailable" beside an
 * enabled Run button is the bug this type exists to make impossible.
 */
export type WorkbenchModelField =
  /** A usable catalog: a grouped picker, with one concrete route selected. */
  | {
    readonly kind: 'ready'
    readonly groups: readonly WorkbenchModelGroup[]
    readonly selected: WorkbenchCardModel
  }
  /** A route is known but no catalog can offer it: the name is shown, not selectable. */
  | {
    readonly kind: 'fixed'
    readonly model: WorkbenchCardModel
    readonly name?: string
  }
  /** No route is known, so nothing can run: there is no model to name on a result. */
  | { readonly kind: 'unavailable' }

/**
 * Resolve the field from the card's stored route and the directory's answer.
 *
 * `stored` wins over the session's selection everywhere: a card that names a model runs
 * on that model, and the session's own choice is only the default a card without one
 * displays.
 * @param stored - the route this card stores, when it has one.
 * @param directory - what the model directory answered.
 * @returns the field state.
 */
export function resolveModelField(
  stored: WorkbenchCardModel | undefined,
  directory: WorkbenchModelDirectoryView,
): WorkbenchModelField {
  // "Loaded" is a usable catalog, not merely a finished request: a directory in `error`
  // may still hold its last good groups, and a `ready` one with no groups offers nothing
  // to choose between.
  const loaded = directory.available
    && (directory.status === 'ready' || directory.status === 'selecting')
    && firstModel(directory.groups) !== undefined
  if (loaded) {
    const selected = stored ?? directory.current ?? firstModel(directory.groups)
    if (selected !== undefined) {
      return { kind: 'ready', groups: withSelected(directory.groups, selected), selected }
    }
  }
  const known = stored ?? directory.current
  if (known === null || known === undefined) return { kind: 'unavailable' }
  const name = nameOf(directory.groups, known)
  return { kind: 'fixed', model: known, ...name === undefined ? {} : { name } }
}

/**
 * Encode one route as a select option's value.
 *
 * A JSON pair rather than a `"provider/model"` string for the same reason the route is
 * stored as a pair: an option value must be decodable without guessing where the provider
 * ends.
 * @param model - the route.
 * @returns the option value.
 */
export function modelKey(model: WorkbenchCardModel): string {
  return JSON.stringify([model.provider, model.model])
}

/**
 * Decode one select option's value.
 * @param value - the option value.
 * @returns the route, or undefined when the value was not produced by {@link modelKey}.
 */
export function parseModelKey(value: string): WorkbenchCardModel | undefined {
  let decoded: unknown
  try {
    decoded = JSON.parse(value)
  } catch {
    // The only source of these values is `modelKey`, so a value that is not JSON is not
    // one of ours and is dropped rather than read as a route.
    return undefined
  }
  if (!Array.isArray(decoded) || decoded.length !== 2) return undefined
  const [provider, model] = decoded
  const candidate = { provider, model }
  return isWorkbenchCardModel(candidate) ? candidate : undefined
}

/**
 * The read/subscribe pair the pages consume.
 *
 * A seat rather than the directory itself, so a page never touches the service and a spec
 * never needs a Cordis context.
 */
export interface WorkbenchModelSeat {
  /**
   * Read what the directory currently knows about one session.
   * @param sessionId - the session a run would hang off.
   * @returns the narrowed view; unavailable when there is no directory to ask.
   */
  read(sessionId: string | undefined): WorkbenchModelDirectoryView
  /**
   * Observe that directory until disposed.
   * @param sessionId - the session a run would hang off.
   * @param listener - called whenever the directory's state changes.
   * @returns the unsubscribe function; a no-op when there is no directory to watch.
   */
  subscribe(sessionId: string | undefined, listener: () => void): () => void
}

/** One model-selection directory, narrowed to the snapshot this feature reads. */
export interface WorkbenchModelDirectory {
  readonly store: {
    /**
     * Read the current state.
     * @returns the directory state.
     */
    getSnapshot(): WorkbenchModelDirectoryState
    /**
     * Observe state changes.
     * @param listener - change callback.
     * @returns the unsubscribe function.
     */
    subscribe(listener: () => void): () => void
  }
  /**
   * Fetch the catalog for this directory.
   *
   * A directory starts `idle` with no groups; this is the only thing that fills them. It is
   * idempotent, so calling it whenever a page reads is safe.
   * @returns resolution once the load settles.
   */
  load(): Promise<unknown>
}

/** The directory state fields this feature reads; the upstream type has more. */
export interface WorkbenchModelDirectoryState {
  readonly current: { readonly provider: string; readonly model: string } | null
  readonly status: WorkbenchModelDirectoryStatus
  readonly groups: readonly {
    readonly id: string
    readonly name: string
    readonly models: readonly { readonly id: string; readonly name: string }[]
  }[]
}

/** The one resolver method this feature calls. */
export interface WorkbenchModelDirectoryResolver {
  /**
   * Resolve one session's directory.
   * @param sessionId - the session to resolve.
   * @returns its directory.
   * @throws for a session that has no model selection of its own.
   */
  directoryFor(sessionId: string): WorkbenchModelDirectory
}

/**
 * Build the seat over a resolver that may arrive after the pages exist.
 *
 * The resolver is read through a getter rather than captured, because the service is
 * injected scoped: a composition without it leaves the getter answering undefined for the
 * whole session, which reads as "no model known" rather than as a missing plugin.
 * @param resolver - getter for the resolver, or undefined while none is registered.
 * @returns the seat.
 */
export function createModelSeat(resolver: () => WorkbenchModelDirectoryResolver | undefined): WorkbenchModelSeat {
  return {
    read(sessionId) {
      const directory = directoryFor(resolver(), sessionId)
      if (directory === undefined) return NO_MODEL_DIRECTORY
      // A directory starts `idle` with no groups and only fills them when something calls
      // `load()`; the app's own model picker kicks that on mount
      // (ui-model-selection/src/client/index.ts:182). This seat used to read the snapshot
      // without ever loading it, so the card offered only whatever providers another
      // surface had happened to populate — most configured models were invisible while the
      // app's own picker listed them. Loading is idempotent per directory.
      const state = directory.store.getSnapshot()
      if (state.status === 'idle') {
        void directory.load().catch(() => { /* surfaced on the store */ })
      }
      return {
        available: true,
        status: state.status,
        current: state.current === null ? null : { provider: state.current.provider, model: state.current.model },
        groups: state.groups.map(group => ({
          id: group.id,
          name: group.name,
          models: group.models.map(model => ({ id: model.id, name: model.name })),
        })),
      }
    },
    subscribe(sessionId, listener) {
      const directory = directoryFor(resolver(), sessionId)
      return directory === undefined ? () => {} : directory.store.subscribe(listener)
    },
  }
}

/**
 * Resolve one session's directory.
 * @param resolver - the resolver, when one is registered.
 * @param sessionId - the session, when a run would have one.
 * @returns the directory, or undefined when there is none to read.
 */
function directoryFor(
  resolver: WorkbenchModelDirectoryResolver | undefined,
  sessionId: string | undefined,
): WorkbenchModelDirectory | undefined {
  if (resolver === undefined || sessionId === undefined) return undefined
  try {
    return resolver.directoryFor(sessionId)
  } catch {
    // `directoryFor` throws for an addressed-subagent session, where model selection does
    // not exist. That is an unavailable answer, not a failure to report: a card with no
    // model of its own simply cannot name the route a run would use.
    return undefined
  }
}

/**
 * Read the first model any group offers.
 * @param groups - the directory's groups.
 * @returns that model's route, or undefined when no group offers one.
 */
function firstModel(groups: readonly WorkbenchModelGroup[]): WorkbenchCardModel | undefined {
  for (const group of groups) {
    const model = group.models[0]
    if (model !== undefined) return { provider: group.id, model: model.id }
  }
  return undefined
}

/**
 * Read the display name one group lists for a route.
 * @param groups - the directory's groups.
 * @param model - the route.
 * @returns the name, or undefined when no group lists it.
 */
function nameOf(groups: readonly WorkbenchModelGroup[], model: WorkbenchCardModel): string | undefined {
  return groups
    .find(group => group.id === model.provider)
    ?.models.find(entry => entry.id === model.model)?.name
}

/**
 * Ensure a picker's options include the route it has selected.
 *
 * A select whose value matches no option renders blank, which would contradict "a card
 * always shows a concrete model". The route is added to its provider's group — or to a
 * group of its own when even the provider is gone — under its own id, because no display
 * name is known for a model the catalog does not list.
 * @param groups - the directory's groups.
 * @param selected - the route the field shows.
 * @returns groups that include it.
 */
function withSelected(
  groups: readonly WorkbenchModelGroup[],
  selected: WorkbenchCardModel,
): readonly WorkbenchModelGroup[] {
  const offered = groups.some(group => group.id === selected.provider
    && group.models.some(model => model.id === selected.model))
  if (offered) return groups
  const option = { id: selected.model, name: selected.model }
  const index = groups.findIndex(group => group.id === selected.provider)
  if (index < 0) return [...groups, { id: selected.provider, name: selected.provider, models: [option] }]
  return groups.map((group, at) => (at === index ? { ...group, models: [...group.models, option] } : group))
}
