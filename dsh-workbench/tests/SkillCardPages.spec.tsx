// @vitest-environment jsdom
/** The two full-panel views: what they load on their own, and what they offer. */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'

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
    },
    cardId: 'skill-card',
    runSessionId: () => undefined,
    fallbackTitle: 'Skill card',
    onBack: () => {},
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
})

describe('skill card result page', () => {
  /**
   * Build an api for a card that is ready to run, so the run control is live.
   * @param start - the run start to answer with.
   * @param poll - optional run-state polls.
   * @returns the api.
   */
  const readyApi = (
    start: PageProps['api']['start'],
    poll?: PageProps['api']['poll'],
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
          templateSkills: ['git-repo'],
        }],
        results: [],
      },
    }),
    start,
    ...poll === undefined ? {} : { poll },
  })

  it('states what the run is doing', () => {
    // The page has to be legible at every moment; an inert page after pressing Run is
    // the defect this whole panel exists to prevent.
    const { container } = render(<SkillCardResultPage {...props()} />)
    expect(container.textContent).toContain('runStatusIdle')
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

  it('says a run is in flight instead of showing the not-run notice', async () => {
    const running = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: Date.now(),
      retried: false,
    } as const
    render(
      <SkillCardResultPage
        {...props({
          runSessionId: () => 'session-1',
          api: readyApi(
            async () => ({ status: 'ok', state: running }),
            async () => ({ status: 'ok', state: running }),
          ),
        })}
      />,
    )
    const run = await screen.findByRole('button', { name: 'skillCardRun' })
    await waitFor(() => { expect(run).toHaveProperty('disabled', false) })
    fireEvent.click(run)
    // The status line names its phase, so the assertion does not have to guess which
    // of the two places that word appears in is the one under test.
    await waitFor(() => {
      expect(document.querySelector('[data-run-status="running"]')?.textContent)
        .toContain('runStatusRunning')
    })
    expect(screen.getByText('skillCardRunningBody')).toBeTruthy()
  })
})
