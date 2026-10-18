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
      saveResult: async () => ({ status: 'unavailable', reason: 'unused here' }),
    },
    cardId: 'skill-card',
    runSessionId: () => undefined,
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

  it('checks a declared card target against the title the grid shows', async () => {
    // A nameless card is titled by its registered label on the face, and that is the
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
})
