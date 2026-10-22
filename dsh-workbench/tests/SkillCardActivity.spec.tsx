/** @vitest-environment jsdom */
/**
 * The run activity stream on the card, and the same trace inside 运行详情.
 *
 * Two promises are pinned here. A running card shows what the child is doing — and, before
 * it has done anything, keeps the sentence it showed before this feature existed rather than
 * an empty list. And 用时 advances on the browser's own clock: the reading must not depend on
 * a poll landing, because a Host that stops answering would then freeze the clock.
 */

import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { primitivesMock } from './support/primitives-mock.tsx'
import { SkillCardBody } from '../src/client/skill-card/SkillCard.tsx'
import { ActivityTrace, elapsedText } from '../src/client/skill-card/ActivityTrace.tsx'
import type { WorkbenchCardView } from '../src/client/skill-card/controller.ts'
import type { WorkbenchActivityEntry, WorkbenchRunState } from '../src/skill-card-contract.ts'
import { zh } from '../src/client/locales.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

/**
 * Translator that renders the real Chinese copy and interpolates its parameters.
 *
 * The running notice is one of the few states whose words are the point — it must still say
 * the sentence the card said before this feature existed — so this case reads the dictionary
 * rather than echoing keys.
 * @param key - dictionary key.
 * @param params - template parameters.
 * @returns the localized text with its parameters substituted.
 */
const t = (key: string, params?: Record<string, unknown>): string =>
  Object.entries(params ?? {}).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    (zh as Record<string, string>)[key] ?? key,
  )

/** A template whose region is the only part a run fills. */
const TEMPLATE = '<h1>Tasks</h1><!-- template-begin --><!-- template-end -->'

/**
 * Build a card view.
 * @param overrides - fields the case varies.
 * @returns the view.
 */
function view(overrides: Partial<WorkbenchCardView> = {}): WorkbenchCardView {
  return {
    status: 'ready',
    runnable: true,
    modelField: { kind: 'fixed', model: { provider: 'deepseek', model: 'deepseek-chat' } },
    workspaceField: { kind: 'missing' },
    permission: 'workspace-write',
    canChooseWorkspace: false,
    catalog: [],
    catalogStatus: 'idle',
    catalogFailure: undefined,
    cardTitles: [],
    refinements: [],
    previous: undefined,
    ...overrides,
  }
}

/**
 * Build a running run state.
 * @param overrides - fields the case varies.
 * @returns the state.
 */
function running(overrides: Partial<WorkbenchRunState> = {}): WorkbenchRunState {
  return { cardId: 'skill-card', phase: 'running', retried: false, startedAt: Date.now(), ...overrides }
}

/**
 * Render a card body in the middle of a run.
 * @param activity - the trace the Host reported.
 * @returns the container.
 */
function renderRunning(activity?: readonly WorkbenchActivityEntry[]): HTMLElement {
  const { container } = render(
    <SkillCardBody
      view={view({ template: TEMPLATE, run: running(activity === undefined ? {} : { activity }) })}
      t={t}
    />,
  )
  return container
}

describe('a running card', () => {
  it('shows the tool call the child made and the first argument it was given', () => {
    const container = renderRunning([
      { kind: 'tool', tool: 'pwsh', argument: 'Probe one shell call' },
      { kind: 'tool', tool: 'read', argument: 'D:\\Git\\Personal-Workbench\\README.md' },
    ])
    const rows = [...container.querySelectorAll('[data-run-activity] li')]
    expect(rows.map(row => row.textContent)).toEqual([
      'pwshProbe one shell call',
      'readD:\\Git\\Personal-Workbench\\README.md',
    ])
    // The tool name is a field of its own, so the row reads as "tool, then what it was given".
    expect(rows.map(row => row.getAttribute('data-activity-tool'))).toEqual(['pwsh', 'read'])
  })

  it('keeps the previous static notice when the run has recorded nothing yet', () => {
    // An empty list under a running title reads as a broken stream. The card keeps the two
    // sentences it showed before the trace existed, and shows no list at all.
    const container = renderRunning([])
    expect(container.textContent).toContain(zh.skillCardRunningBody)
    expect(container.textContent).toContain(zh.runStatusRunning)
    expect(container.querySelector('[data-run-activity]')).toBeNull()
  })

  it('says how many entries a bounded trace dropped', () => {
    const container = renderRunning([
      { kind: 'truncated', dropped: 6 },
      { kind: 'tool', tool: 'read', argument: 'README.md' },
    ])
    const marker = container.querySelector('[data-activity-dropped]')
    expect(marker?.getAttribute('data-activity-dropped')).toBe('6')
    expect(marker?.textContent).toBe(zh.runActivityTruncated.replace('{dropped}', '6'))
    // It is a row in the same list, not a caption somewhere else.
    expect(container.querySelectorAll('[data-run-activity] li')).toHaveLength(2)
  })

  it('ticks 用时 on its own clock, without waiting for a poll', () => {
    // No poll happens in this case: the only thing that moves is the local timer. A reading
    // taken from the poll's state would stay at 00:00 here, which is what this pins.
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    const container = renderRunning([])
    expect(container.textContent).toContain(`${zh.runElapsed} 00:00`)
    act(() => { vi.advanceTimersByTime(65_000) })
    expect(container.textContent).toContain(`${zh.runElapsed} 01:05`)
  })

  it('reads a run that never reported a start time without a clock at all', () => {
    // Absence, not a zero: a run the Host could not stamp with a start time gets no clock
    // rather than one that counts up from the epoch.
    const { container } = render(
      <SkillCardBody
        view={view({
          template: TEMPLATE,
          run: { cardId: 'skill-card', phase: 'running', retried: false },
        })}
        t={t}
      />,
    )
    expect(container.textContent).toContain(zh.runStatusRunning)
    expect(container.textContent).not.toContain(zh.runElapsed)
  })
})

describe('activity trace rendering', () => {
  it('formats a duration as a clock reading, dropping an hour that is zero', () => {
    expect(elapsedText(0)).toBe('00:00')
    expect(elapsedText(7_000)).toBe('00:07')
    expect(elapsedText(65_000)).toBe('01:05')
    expect(elapsedText(3_600_000)).toBe('1:00:00')
    expect(elapsedText(-1)).toBe('00:00')
  })

  it('renders an empty trace as an empty list, leaving the fallback to its caller', () => {
    // The list itself has no empty state: the two callers differ about what "nothing yet"
    // means, and only the running card has a sentence to keep.
    const { container } = render(<ActivityTrace trace={[]} t={t} />)
    expect(container.querySelectorAll('li')).toHaveLength(0)
  })
})
