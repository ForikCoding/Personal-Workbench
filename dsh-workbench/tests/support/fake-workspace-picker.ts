/**
 * Directory-picker doubles for the page specs.
 *
 * The pages consume a {@link WorkbenchWorkspacePicker}, not the Desktop bridge or the
 * workspace UI, so a spec drives every outcome — chosen, cancelled, no picker — with plain
 * data and never needs a browser window or a Cordis context.
 */
import type {
  WorkbenchWorkspacePick,
  WorkbenchWorkspacePicker,
} from '../../src/client/skill-card/workspace-picker.ts'

/** The directory a pick answers with unless a case says otherwise. */
export const PICKED_PATH = 'D:\\Git\\Personal-Workbench'

/** What a case varies about the picker. */
export interface FakeWorkspacePickerOptions {
  /** Whether a picker exists at all; `false` models a page with no picker. */
  readonly available?: boolean
  /** What one pick answers; defaults to {@link PICKED_PATH}. */
  readonly answer?: WorkbenchWorkspacePick
}

/** A picker double plus how often it was asked. */
export interface FakeWorkspacePicker {
  readonly picker: WorkbenchWorkspacePicker
  /**
   * How many times a pick was attempted.
   * @returns the count, so a case can assert that nothing was asked or written.
   */
  readonly picks: () => number
}

/**
 * Build a picker over one fixed answer.
 * @param options - whether a picker exists, and what a pick answers.
 * @returns the picker and its attempt count.
 */
export function fakeWorkspacePicker(options: FakeWorkspacePickerOptions = {}): FakeWorkspacePicker {
  let picks = 0
  const answer = options.answer ?? { status: 'picked', path: PICKED_PATH }
  return {
    picks: () => picks,
    picker: {
      available: () => options.available ?? true,
      pick: async () => {
        picks += 1
        return answer
      },
    },
  }
}

/**
 * A picker that is not there at all.
 * @returns the picker, which reports unavailable and answers every pick as unavailable.
 */
export function noWorkspacePicker(): FakeWorkspacePicker {
  return fakeWorkspacePicker({
    available: false,
    answer: { status: 'unavailable', reason: 'this page has no directory picker' },
  })
}
