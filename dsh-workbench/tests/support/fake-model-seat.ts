/**
 * Model-directory double for the DOM specs.
 *
 * The pages consume a {@link WorkbenchModelSeat} rather than the Cordis service, so a spec
 * drives the three availability states of the model field with plain data and never needs
 * a client context. `subscribe` is a no-op by default because the pages re-render from what
 * `read` answers; a case that needs a live directory passes its own seat.
 */
import type { WorkbenchCardModel } from '../../src/skill-card-contract.ts'
import type {
  WorkbenchModelDirectoryView,
  WorkbenchModelGroup,
  WorkbenchModelSeat,
} from '../../src/client/skill-card/model.ts'

/** The catalog the double answers with unless a case replaces it. */
export const MODEL_GROUPS: readonly WorkbenchModelGroup[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' },
    ],
  },
  {
    id: 'vendor/gateway',
    name: 'Gateway',
    models: [{ id: 'large', name: 'Large' }],
  },
]

/** A session whose saved selection is the first model of the default catalog. */
export const MODEL_CURRENT: WorkbenchCardModel = { provider: 'deepseek', model: 'deepseek-chat' }

/** What a case varies about the directory. */
export interface FakeModelSeatOptions {
  /** Whether a directory answered at all. */
  readonly available?: boolean
  /** Lifecycle of the directory's own load. */
  readonly status?: 'idle' | 'loading' | 'ready' | 'selecting' | 'error'
  /** The session's saved selection; `null` means none is known. */
  readonly current?: WorkbenchCardModel | null
  /** Provider groups; defaults to {@link MODEL_GROUPS}. */
  readonly groups?: readonly WorkbenchModelGroup[]
}

/**
 * Build a model seat over one fixed directory view.
 * @param options - the directory the seat answers with.
 * @returns the seat.
 */
export function fakeModelSeat(options: FakeModelSeatOptions = {}): WorkbenchModelSeat {
  const view: WorkbenchModelDirectoryView = {
    available: options.available ?? true,
    status: options.status ?? 'ready',
    current: options.current === undefined ? MODEL_CURRENT : options.current,
    groups: options.groups ?? MODEL_GROUPS,
  }
  return {
    read: () => view,
    subscribe: () => () => {},
  }
}
