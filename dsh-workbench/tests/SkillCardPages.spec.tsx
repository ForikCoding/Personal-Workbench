// @vitest-environment jsdom
/** The two full-panel views: what they load on their own, and what they offer. */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { fakeModelSeat } from './support/fake-model-seat.ts'
import { fakeWorkspacePicker, PICKED_PATH } from './support/fake-workspace-picker.ts'
import { PRESENT_DIRECTORY, WORKSPACE_PATH } from './support/fake-skill-card-host.ts'
import type { WorkbenchModelDirectoryView, WorkbenchModelSeat } from '../src/client/skill-card/model.ts'
import { modelKey } from '../src/client/skill-card/model.ts'
import type { WorkbenchCardModel, WorkbenchSkillCardPatch } from '../src/skill-card-contract.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

const { SkillCardConfigPage, SkillCardResultPage } = await import('../src/client/skill-card/SkillCardPages.tsx')
type PageProps = import('../src/client/skill-card/SkillCardPages.tsx').SkillCardPageProps

afterEach(cleanup)

/**
 * Translate by echoing the key.
 * @param key - dictionary key.
 * @returns the key.
 */
const t = (key: string): string => key

/**
 * Build page props.
 * @param overrides - fields to replace.
 * @returns complete props.
 */
function props(overrides: Partial<PageProps> = {}): PageProps {
  return {
    api: {
      read: async () => ({
        status: 'ok',
        snapshot: { revision: '1:0', cards: [{ cardId: 'skill-card', templateSkills: [] }], results: [] },
      }),
      write: async () => ({
        status: 'ok',
        snapshot: { revision: '1:1', cards: [{ cardId: 'skill-card', templateSkills: [] }], results: [] },
      }),
      catalog: async () => ({ status: 'ok', entries: [] }),
      poll: async () => ({ status: 'unavailable', reason: 'unused here' }),
      start: async () => ({ status: 'failed', code: 'unavailable', message: 'unused here' }),
      cancel: async () => {},
      saveResult: async () => ({ status: 'unavailable', reason: 'unused here' }),
      // These cases are about the page's own structure. The default card states no
      // directory, and a card that names one is answered with a present directory.
      statDirectory: async () => ({ status: 'ok', stat: PRESENT_DIRECTORY }),
    },
    cardId: 'skill-card',
    runSessionId: () => undefined,
    models: fakeModelSeat(),
    workspacePicker: fakeWorkspacePicker().picker,
    fallbackTitle: 'Skill card',
    onBack: () => {},
    openCard: () => {},
    t,
    ...overrides,
  } as PageProps
}

describe('skill card configuration page', () => {
  it('loads the catalog by being the view that lists skills', async () => {
    // The read used to hang off an action the grid stopped calling, so the picker
    // stayed disabled and said nothing about why.
    const catalog = vi.fn(async () => ({
      status: 'ok' as const,
      entries: [{ name: 'git-repo', description: 'a', userInvocable: true }],
    }))
    const { container } = render(<SkillCardConfigPage {...props({ api: { ...props().api, catalog } })} />)
    await waitFor(() => { expect(catalog).toHaveBeenCalledTimes(1) })
    await waitFor(() => { expect(container.querySelector('select')).toHaveProperty('disabled', false) })
    expect(container.textContent).toContain('git-repo')
  })

  it('says the catalog is loading before it has arrived', () => {
    // A pending catalog is a disabled picker, and a disabled picker with no line of
    // text is the thing the user cannot diagnose.
    const { container } = render(<SkillCardConfigPage {...props()} />)
    expect(container.textContent).toContain('skillCardCatalogLoading')
  })

  it('offers the card name, the skill, and the template', async () => {
    const { container } = render(<SkillCardConfigPage {...props()} />)
    expect(container.querySelector('input')).not.toBeNull()
    expect(container.querySelector('select')).not.toBeNull()
    expect(container.querySelector('textarea')).not.toBeNull()
  })

  it('keeps only the way back in the head, letting the fields carry the facts', async () => {
    // The card's name and skill used to be stated in the head *and* again in the fields,
    // and the head's copy was the one that could not be edited.
    const { container } = render(<SkillCardConfigPage {...props({
      api: {
        ...props().api,
        read: async () => ({
          status: 'ok',
          snapshot: {
            revision: '1:0',
            cards: [{ cardId: 'skill-card', name: '我的任务', skill: 'git-repo', templateSkills: [] }],
            results: [],
          },
        }),
      },
    })} />)
    const head = container.querySelector('header') as HTMLElement
    expect(head.querySelector('h2')).toBeNull()
    expect(head.textContent).toBe('skillCardBack')
    await waitFor(() => {
      expect((container.querySelector('input') as HTMLInputElement).value).toBe('我的任务')
    })
  })

  it('keeps removal in the footer, away from the pair a user presses unread', async () => {
    const { container } = render(<SkillCardConfigPage {...props()} />)
    await waitFor(() => { expect(container.querySelector('footer')).not.toBeNull() })
    const footer = container.querySelector('footer') as HTMLElement
    expect(footer.textContent).toContain('skillCardSave')
    expect(footer.textContent).toContain('skillCardClose')
    expect(footer.textContent).toContain('skillCardDelete')
    // The head is the way back and nothing else.
    expect((container.querySelector('header') as HTMLElement).textContent)
      .not.toContain('skillCardDelete')
  })

  it('stores the model the picker chose, as a pair and against the revision it read', async () => {
    // The field is only a control until the write lands: this is the boundary that makes the
    // choice real, and it carries the pair rather than a joined string.
    const writes: WorkbenchSkillCardPatch[] = []
    const { container } = render(<SkillCardConfigPage {...props({
      api: {
        ...props().api,
        write: async (patch) => {
          writes.push(patch)
          return { status: 'ok', snapshot: { revision: '1:1', cards: [{ cardId: 'skill-card', templateSkills: [] }], results: [] } }
        },
      },
    })} />)
    await waitFor(() => { expect(container.querySelector('[data-model-select]')).not.toBeNull() })
    fireEvent.change(container.querySelector('[data-model-select]') as HTMLSelectElement, {
      target: { value: modelKey({ provider: 'deepseek', model: 'deepseek-reasoner' }) },
    })
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]).toMatchObject({
      baseRevision: '1:0',
      cardId: 'skill-card',
      model: { provider: 'deepseek', model: 'deepseek-reasoner' },
    })
  })

  it('stores the directory the picker chose, as the full path', async () => {
    // The picker is the only way a card can name a directory, so this is the boundary that
    // turns a choice into a stored path. What travels is the whole absolute path.
    const writes: WorkbenchSkillCardPatch[] = []
    const picker = fakeWorkspacePicker()
    const { container } = render(<SkillCardConfigPage {...props({
      workspacePicker: picker.picker,
      api: {
        ...props().api,
        write: async (patch) => {
          writes.push(patch)
          return { status: 'ok', snapshot: { revision: '1:1', cards: [{ cardId: 'skill-card', templateSkills: [] }], results: [] } }
        },
      },
    })} />)
    fireEvent.click(container.querySelector('[data-workspace-pick]') as HTMLElement)
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]).toMatchObject({
      baseRevision: '1:0',
      cardId: 'skill-card',
      workspace: { path: PICKED_PATH },
    })
  })

  it('changes nothing when the chooser is cancelled', async () => {
    // Closing the chooser is an answer, not a failure: the stored directory stays exactly as
    // it was, and no write is issued for a decision the user did not make.
    const writes: WorkbenchSkillCardPatch[] = []
    const picker = fakeWorkspacePicker({ answer: { status: 'cancelled' } })
    const { container } = render(<SkillCardConfigPage {...props({
      workspacePicker: picker.picker,
      api: {
        ...props().api,
        write: async (patch) => {
          writes.push(patch)
          return { status: 'ok', snapshot: { revision: '1:1', cards: [{ cardId: 'skill-card', templateSkills: [] }], results: [] } }
        },
      },
    })} />)
    fireEvent.click(container.querySelector('[data-workspace-pick]') as HTMLElement)
    await waitFor(() => { expect(picker.picks()).toBe(1) })
    expect(writes).toEqual([])
    // The field still reads "not selected", because nothing was selected.
    expect(container.querySelector('[data-workspace-leaf]')?.textContent).toBe('skillCardWorkspaceNotSet')
  })

  it('degrades a refused picker to a stated unavailable control', async () => {
    // A route that is not there must not throw into the page: the button stops working and
    // the field says there is no picker, which is the honest answer for this composition.
    const picker = fakeWorkspacePicker({
      answer: { status: 'unavailable', reason: 'DSH Desktop could not open the system folder picker' },
    })
    const { container } = render(<SkillCardConfigPage {...props({ workspacePicker: picker.picker })} />)
    const button = container.querySelector('[data-workspace-pick]') as HTMLButtonElement
    expect(button.disabled).toBe(false)
    fireEvent.click(button)
    await waitFor(() => {
      expect(container.querySelector('[data-workspace-picker-unavailable]')).not.toBeNull()
    })
    expect((container.querySelector('[data-workspace-pick]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('checks a declared card target against the title the grid shows', async () => {    // A nameless card is titled by its registered label on the face, and that is the
    // name a click resolves against — so the editor has to compare with the same rule
    // rather than reporting a target that exists as missing.
    const template = [
      '<!-- dsh-actions',
      '  next: card "skillCardTitle"',
      '-->',
      '<!-- template-begin -->',
      '<!-- template-end -->',
    ].join('\n')
    const { container } = render(<SkillCardConfigPage {...props({
      api: {
        ...props().api,
        read: async () => ({
          status: 'ok',
          snapshot: {
            revision: '1:0',
            cards: [{ cardId: 'skill-card', skill: 'git-repo', template, templateSkills: ['git-repo'] }],
            results: [],
          },
        }),
      },
    })} />)
    await waitFor(() => {
      expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe(template)
    })
    expect(container.querySelector('[data-action-target-warnings]')).toBeNull()
  })
})

describe('skill card result page', () => {
  /**
   * Build an api for a card that is ready to run, so the run control is live.
   * @param start - the run start to answer with.
   * @param poll - optional run-state polls.
   * @param model - route the card stores, when the case is about a pinned model.
   * @returns the api.
   */
  const readyApi = (
    start: PageProps['api']['start'],
    poll?: PageProps['api']['poll'],
    model?: WorkbenchCardModel,
  ): PageProps['api'] => ({
    ...props().api,
    read: async () => ({
      status: 'ok',
      snapshot: {
        revision: '1:0',
        cards: [{
          cardId: 'skill-card',
          skill: 'git-repo',
          template: '<h1>Tasks</h1><!-- template-begin --><!-- template-end -->',
          ...model === undefined ? {} : { model },
          // "Ready to run" includes where: a card with no directory is refused before the
          // click, which is the state the workspace cases in the settings spec cover.
          workspace: { path: WORKSPACE_PATH },
          templateSkills: ['git-repo'],
        }],
        results: [],
      },
    }),
    start,
    ...poll === undefined ? {} : { poll },
  })

  it('shows why a run failed where the result would have been', async () => {
    // The failure used to reach only the card face, so a run that failed while the
    // user watched the result page changed nothing on screen.
    render(
      <SkillCardResultPage
        {...props({
          runSessionId: () => 'session-1',
          api: readyApi(async () => ({ status: 'rejected', code: 'run-failed', message: 'the child crashed' })),
        })}
      />,
    )
    const run = await screen.findByRole('button', { name: 'skillCardRun' })
    await waitFor(() => { expect(run).toHaveProperty('disabled', false) })
    fireEvent.click(run)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('the child crashed')
    expect(alert.textContent).toContain('skillCardProblemRunFailed')
  })

  it('reports a run refused because the activation seam is missing', async () => {
    // The stale click: the snapshot this page holds says the harness can run, and the route
    // answers that it cannot. The refusal belongs on the page as its own state, localized
    // by the same code table as every other failure, rather than escaping as a stack.
    render(
      <SkillCardResultPage
        {...props({
          runSessionId: () => 'session-1',
          api: readyApi(async () => ({
            status: 'rejected',
            code: 'run-unavailable',
            message: 'this harness provides no subagents.startActivation',
          })),
        })}
      />,
    )
    const run = await screen.findByRole('button', { name: 'skillCardRun' })
    await waitFor(() => { expect(run).toHaveProperty('disabled', false) })
    fireEvent.click(run)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('skillCardProblemRunUnavailable')
    expect(alert.textContent).toContain('startActivation')
  })

  it('says a run is in flight instead of showing the not-run notice', async () => {
    const running = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: Date.now(),
      retried: false,
    } as const
    // The page reads the run route once on mount, to adopt a run another card's button
    // may already have started. Nothing is in flight yet here, so that first read has
    // to come back empty and the click has to be what starts the run.
    let polls = 0
    render(
      <SkillCardResultPage
        {...props({
          runSessionId: () => 'session-1',
          api: readyApi(
            async () => ({ status: 'ok', state: running }),
            async () => {
              polls += 1
              return polls === 1 ? { status: 'missing' } : { status: 'ok', state: running }
            },
          ),
        })}
      />,
    )
    const run = await screen.findByRole('button', { name: 'skillCardRun' })
    await waitFor(() => { expect(run).toHaveProperty('disabled', false) })
    fireEvent.click(run)
    // The in-flight notice replaces the document, so a page that just started a run is
    // never inert. The status line that used to name the phase as well was removed as
    // noise, so the notice is now the one place this state is stated.
    await waitFor(() => { expect(screen.getByText('skillCardRunningBody')).toBeTruthy() })
    expect(screen.queryByText('skillCardNotRunTitle')).toBeNull()
  })

  it('keeps the run control live when a route is known but the catalog is not', async () => {
    // Criterion 73's deciding question: "is there a model we can run with", never "did the
    // picker load". The stored route survives a failed directory, so the run does too.
    render(
      <SkillCardResultPage
        {...props({
          runSessionId: () => 'session-1',
          api: readyApi(
            async () => ({ status: 'unavailable', reason: 'no run is started here' }),
            undefined,
            { provider: 'deepseek', model: 'deepseek-chat' },
          ),
          models: fakeModelSeat({ available: false, current: null }),
        })}
      />,
    )
    const run = await screen.findByRole('button', { name: 'skillCardRun' })
    await waitFor(() => { expect(run).toHaveProperty('disabled', false) })
    expect(screen.queryByText('skillCardModelUnavailable')).toBeNull()
  })

  it('disables the run control, and says why, when no model is known', async () => {
    // The third state. Without a route the host would have nothing to name on the result,
    // so the card refuses to start rather than run on a model it cannot report.
    const start = vi.fn(async () => ({ status: 'unavailable' as const, reason: 'unused here' }))
    const { container } = render(
      <SkillCardResultPage
        {...props({
          runSessionId: () => 'session-1',
          api: readyApi(start),
          models: fakeModelSeat({ available: false, current: null }),
        })}
      />,
    )
    const run = await screen.findByRole('button', { name: 'skillCardRun' })
    await waitFor(() => { expect(container.querySelector('[data-run-model-unavailable]')).not.toBeNull() })
    expect(run).toHaveProperty('disabled', true)
    fireEvent.click(run)
    expect(start).not.toHaveBeenCalled()
  })

  it('adopts a model the directory reports after the page has mounted', async () => {
    // The directory loads asynchronously, so the field is watched rather than read once:
    // without the subscription a page that mounted before the catalog arrived would stay
    // permanently unrunnable.
    let state: WorkbenchModelDirectoryView = { available: true, status: 'loading', current: null, groups: [] }
    const listeners = new Set<() => void>()
    const models: WorkbenchModelSeat = {
      read: () => state,
      subscribe: (_sessionId, listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    }
    const { container } = render(
      <SkillCardResultPage
        {...props({
          runSessionId: () => 'session-1',
          api: readyApi(async () => ({ status: 'unavailable', reason: 'no run is started here' })),
          models,
        })}
      />,
    )
    const run = await screen.findByRole('button', { name: 'skillCardRun' })
    await waitFor(() => { expect(run).toHaveProperty('disabled', true) })

    state = {
      available: true,
      status: 'ready',
      current: { provider: 'deepseek', model: 'deepseek-chat' },
      groups: [],
    }
    for (const listener of [...listeners]) listener()
    await waitFor(() => {
      expect(run).toHaveProperty('disabled', false)
      expect(container.querySelector('[data-run-model-unavailable]')).toBeNull()
    })
  })
})
