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
  /** Why the load failed; carried only while the directory reports one. */
  readonly error?: string
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
 * What the diagnostic line reports about the directory read behind the field.
 *
 * The status travels beside the groups because a directory whose load never ran, and one
 * whose load failed, both render as a shorter but plausible picker — exactly the reading
 * the count alone cannot tell apart. The seat drops `load()`'s rejection (the store is the
 * report), so this is also the failure's only route to the screen.
 */
export interface WorkbenchModelFieldCatalog {
  /** The directory's load status, or `none` when no directory answered at all. */
  readonly status: WorkbenchModelDirectoryStatus | 'none'
  /** Why the load failed; carried only while {@link status} is `error`. */
  readonly error?: string
}

/**
 * What the configuration page renders for the model, and whether a run can start.
 *
 * Three states rather than a picker plus flags, because the run control's answer and the
 * field's answer have to be the same answer: a field that says "unavailable" beside an
 * enabled Run button is the bug this type exists to make impossible.
 *
 * Every state also carries `catalog`, the directory read it was resolved from: the field's
 * state says what the card can do, and the status says whether the picker's contents are
 * the catalog or the residue of a load that did not finish.
 */
export type WorkbenchModelField =
  /** A usable catalog: a grouped picker, with one concrete route selected. */
  | {
    readonly kind: 'ready'
    readonly groups: readonly WorkbenchModelGroup[]
    readonly selected: WorkbenchCardModel
    readonly catalog: WorkbenchModelFieldCatalog
  }
  /** A route is known but no catalog can offer it: the name is shown, not selectable. */
  | {
    readonly kind: 'fixed'
    readonly model: WorkbenchCardModel
    readonly name?: string
    readonly catalog: WorkbenchModelFieldCatalog
  }
  /** No route is known, so nothing can run: there is no model to name on a result. */
  | { readonly kind: 'unavailable'; readonly catalog: WorkbenchModelFieldCatalog }

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
  // Resolved once and attached to every state: a field that dropped the status would make
  // a failed load look like a small catalog again.
  const catalog = catalogOf(directory)
  // "Loaded" is a usable catalog, not merely a finished request: a directory in `error`
  // may still hold its last good groups, and a `ready` one with no groups offers nothing
  // to choose between.
  const loaded = directory.available
    && (directory.status === 'ready' || directory.status === 'selecting')
    && firstModel(directory.groups) !== undefined
  if (loaded) {
    const selected = stored ?? directory.current ?? firstModel(directory.groups)
    if (selected !== undefined) {
      return { kind: 'ready', groups: withSelected(directory.groups, selected), selected, catalog }
    }
  }
  const known = stored ?? directory.current
  if (known === null || known === undefined) return { kind: 'unavailable', catalog }
  const name = nameOf(directory.groups, known)
  return { kind: 'fixed', model: known, catalog, ...name === undefined ? {} : { name } }
}

/**
 * Read the directory facts the diagnostic line reports.
 *
 * `none` rather than the directory's own `idle` when nothing answered at all: an
 * unreachable directory is a different fact from a reachable one that has not loaded, and
 * the two are the difference between "this session has no model selection" and the defect
 * this line was added for.
 * @param directory - the directory the field was resolved from.
 * @returns the field's catalog facts.
 */
function catalogOf(directory: WorkbenchModelDirectoryView): WorkbenchModelFieldCatalog {
  if (!directory.available) return { status: 'none' }
  const error = directory.status === 'error' ? directory.error : undefined
  return { status: directory.status, ...error === undefined ? {} : { error } }
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
 * The read/subscribe/refresh trio the pages consume.
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
   * Observe that directory until disposed, asking it for the catalog as a page mounts.
   *
   * Subscribing is the mount path, so this is where a surface joins the directory: the app's
   * own picker asks for a load at the same moment, and a card that only read the snapshot
   * inherited whatever another surface had already loaded.
   * @param sessionId - the session a run would hang off.
   * @param listener - called whenever the directory's state changes.
   * @returns the unsubscribe function; a no-op when there is no directory to watch.
   */
  subscribe(sessionId: string | undefined, listener: () => void): () => void
  /**
   * Ask the directory for its catalog again, for the user-driven refresh control.
   *
   * The directory exposes `load()` and nothing that forces a refetch, so this is the whole of
   * what a surface can request: a catalog the upstream already holds is answered from that
   * value, and the diagnostic line then stays exactly as it was. The truth of what happened is
   * printed by the field, not returned here.
   * @param sessionId - the session whose catalog the control belongs to.
   * @returns whether a directory answered the request at all.
   */
  refresh(sessionId: string | undefined): boolean
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
   * A directory starts `idle` with no groups; this is the only thing that fills them. Calling
   * it again is safe: the upstream shares an in-flight load and answers a settled one from
   * the catalog it already holds rather than issuing a second request.
   * @returns resolution once the load settles.
   */
  load(): Promise<unknown>
}

/** The directory state fields this feature reads; the upstream type has more. */
export interface WorkbenchModelDirectoryState {
  readonly current: { readonly provider: string; readonly model: string } | null
  readonly status: WorkbenchModelDirectoryStatus
  /** Why the load or the selection failed; null when neither has. */
  readonly error: string | null
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
      // The fallback for a caller that reads without subscribing (a page that only renders the
      // field, a spec): a directory starts `idle` with no groups and only fills them when
      // something calls `load()`. Only `idle` asks here — a notification from a load is
      // delivered after the snapshot settles, so loading on any status would spin, and the
      // mount path in `subscribe` already asks. A `ready` snapshot is deliberately not
      // treated as fresh: it records that a load finished, not which providers it saw.
      const state = directory.store.getSnapshot()
      if (state.status === 'idle') askForCatalog(directory)
      return {
        available: true,
        status: state.status,
        ...state.error === null ? {} : { error: state.error },
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
      if (directory === undefined) return () => {}
      // Subscribed before the catalog is asked for, so the notification a load produces reaches
      // this listener even when the directory answers from a catalog it already holds.
      const stop = directory.store.subscribe(listener)
      // Ask when the page mounts, which is what the app's own picker does when its menu opens
      // (ui-model-selection/src/client/index.ts, the seat's `load`). `ready` records that a load
      // finished — often one taken before every provider registered — so it is no evidence that
      // these groups are the catalog this session has now; a surface that asked only from
      // `idle` kept whatever the other one caught. Repeating is safe: `load()` is the upstream's
      // own entry point, it answers from the catalog it holds once one is loaded, and the
      // settled snapshot is `ready`, so the read the notification triggers asks nothing more.
      askForCatalog(directory)
      return stop
    },
    refresh(sessionId) {
      const directory = directoryFor(resolver(), sessionId)
      if (directory === undefined) return false
      askForCatalog(directory)
      return true
    },
  }
}

/**
 * Ask one directory for its catalog.
 *
 * The rejection is dropped on purpose: the shared load writes its failure to the store, and the
 * field's diagnostic line carries it from there.
 * @param directory - the directory to ask.
 */
function askForCatalog(directory: WorkbenchModelDirectory): void {
  void directory.load().catch(() => { /* surfaced on the store */ })
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
