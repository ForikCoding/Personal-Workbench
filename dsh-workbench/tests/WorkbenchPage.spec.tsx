// @vitest-environment jsdom
/** Page composition: the rail, the canvas, the inspector, and the chain the canvas runs. */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readOpenPipeline, rememberOpenPipeline } from '../src/client/pipeline-memory.ts'
import { primitivesMock } from './support/primitives-mock.tsx'
import { fakeModelSeat } from './support/fake-model-seat.ts'
import { fakeWorkspacePicker, noWorkspacePicker, PICKED_PATH } from './support/fake-workspace-picker.ts'
import type { WorkbenchWorkspacePicker } from '../src/client/skill-card/workspace-picker.ts'
import type { WorkbenchCardConfigView, WorkbenchFilesRead } from '../src/client/skill-card/api.ts'
import type { WorkbenchFileEntry } from '../src/skill-card-contract.ts'
import type { WorkbenchScriptBinder } from '../src/client/skill-card/render.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

const { WorkbenchPage } = await import('../src/client/WorkbenchPage.tsx')
type PageProps = import('../src/client/WorkbenchPage.tsx').WorkbenchPageProps
type WorkbenchPipeline = import('../src/pipeline-contract.ts').WorkbenchPipeline
type WorkbenchPipelineSnapshot = import('../src/pipeline-contract.ts').WorkbenchPipelineSnapshot
type WorkbenchPipelinePatch = import('../src/pipeline-contract.ts').WorkbenchPipelinePatch
type WorkbenchRunRequest = import('../src/skill-card-contract.ts').WorkbenchRunRequest
type WorkbenchRunState = import('../src/skill-card-contract.ts').WorkbenchRunState
type WorkbenchCardResult = import('../src/skill-card-contract.ts').WorkbenchCardResult
type WorkbenchSkillCardPatch = import('../src/skill-card-contract.ts').WorkbenchSkillCardPatch
type WorkbenchCardSnapshot = import('../src/client/skill-card/api.ts').WorkbenchCardSnapshot
type WorkbenchCatalogRead = import('../src/client/skill-card/api.ts').WorkbenchCatalogRead
const { en } = await import('../src/client/locales.ts')
type LocaleKey = import('../src/client/locales.ts').WorkbenchLocaleKey

afterEach(cleanup)

/** Translate an English dictionary value with its template parameters. */
const t = (key: LocaleKey, params?: Record<string, unknown>): string =>
  Object.entries(params ?? {}).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    en[key],
  )

/**
 * The configured cards the panels read their template, model and workspace from.
 *
 * A tuple rather than an array: a case that swaps one card's template spreads `CARD_VIEWS[0]`,
 * and an element type that may be undefined would make that spread a different shape.
 */
const CARD_VIEWS: readonly [WorkbenchCardConfigView, WorkbenchCardConfigView] = [
  {
    cardId: 'a-card',
    name: 'A card',
    skill: 'git-repo',
    model: { provider: 'p', model: 'm' },
    workspace: { path: '/work' },
    permission: 'workspace-write' as const,
    templateSkills: [],
    template: '<html><body><!--dsh:region--><p>old</p><!--/dsh:region--></body></html>',
  },
  {
    cardId: 'b-card',
    name: 'B card',
    skill: 'review',
    templateSkills: [],
  },
]

/** One stored result, so the result panel has something to list. */
function result(cardId: string, html = '<p>done</p>'): WorkbenchCardResult {
  return {
    cardId,
    runId: `run-${cardId}`,
    skill: 'git-repo',
    executedAt: 1,
    stopReason: 'stop',
    structured: { html },
  }
}

/** The two cards every case can arrange. */
const CARDS = [{ id: 'a-card', order: 100, label: 'A card' }, { id: 'b-card', order: 200, label: 'B card' }]

/** What the session says it can invoke: the two the cards already hold, plus one free. */
const SKILLS = [
  { name: 'design-doc', description: 'Write a design document', userInvocable: true },
  { name: 'git-repo', description: 'Work with a repository', userInvocable: true },
  { name: 'review', description: 'Review a change', userInvocable: true },
]

/**
 * One stored pipeline over those cards.
 * @param overrides - fields the case varies.
 * @returns the pipeline.
 */
function pipeline(overrides: Partial<WorkbenchPipeline> = {}): WorkbenchPipeline {
  return {
    id: 'pipeline-1',
    name: 'Release check',
    steps: [{ cardId: 'a-card' }, { cardId: 'b-card' }],
    updatedAt: 1,
    ...overrides,
  }
}

/** What the page needs from a run of the skill card transport. */
interface RunSeams {
  readonly start: (request: WorkbenchRunRequest) => Promise<unknown>
  readonly poll: (cardId: string) => Promise<unknown>
}

/**
 * Build page props.
 * @param options - stored pipelines, the run seams, and any prop override.
 * @returns complete props plus the write log the cases assert on.
 */
function props(options: {
  pipelines?: readonly WorkbenchPipeline[]
  run?: RunSeams
  results?: readonly WorkbenchCardResult[]
  catalog?: () => Promise<WorkbenchCatalogRead>
  /** The stored cards the transport holds; the default pair is enough for most cases. */
  cardViews?: readonly WorkbenchCardConfigView[]
  /** Whether card writes land; false models a store that refuses the change. */
  cardWriteLands?: boolean
  /**
   * Whether the card store moved past this page before the first write lands.
   *
   * That is what a finished run does: it stores its result in the same domain, so the
   * revision the page read at load is no longer current by the time the user edits.
   */
  cardMovedSinceLoad?: boolean
  /** The same, for the pipeline store: another window stored the pipelines this page holds. */
  pipelineMovedSinceLoad?: boolean
  /** The directory chooser this page offers; the default answers one path. */
  picker?: WorkbenchWorkspacePicker
  /**
   * What listing a step's result directory answers.
   *
   * The default is an empty directory: most cases are about what the panel draws, not about
   * the rows a listing produces, and an unexpected read would otherwise fail them.
   */
  listFiles?: (cardId: string, path: string) => Promise<WorkbenchFilesRead>
  /**
   * The binder a rendered card document's script receives.
   *
   * jsdom runs no script it is handed, so what a template's code would see is observed here:
   * the binder is the one place the document's inputs pass through on their way to it.
   */
  documents?: WorkbenchScriptBinder
  overrides?: Partial<PageProps>
} = {}): {
  props: PageProps
  writes: WorkbenchPipelinePatch[]
  cardWrites: WorkbenchSkillCardPatch[]
  reads: number[]
  openedCards: string[]
} {
  let snapshot: WorkbenchPipelineSnapshot = {
    apiVersion: 1,
    revision: '1:0',
    pipelines: options.pipelines ?? [pipeline()],
  }
  const writes: WorkbenchPipelinePatch[] = []
  const cardWrites: WorkbenchSkillCardPatch[] = []
  const reads: number[] = []
  /** Cards whose own page was opened; the template block's button is the one that does. */
  const openedCards: string[] = []
  // The card store the config views read and the picker writes: creating a step's card
  // goes through the same transport as the card pages, so the fake has to hold state.
  let cardSnapshot: WorkbenchCardSnapshot = {
    revision: '1:0',
    cards: [...options.cardViews ?? CARD_VIEWS],
    results: options.results ?? [],
  }
  const merged = {
    usePanelInfo: ((selector: (info: { activePanelId: string | null }) => unknown) => selector({ activePanelId: 'workbench' })) as PageProps['usePanelInfo'],
    useCards: ((selector: (snapshot: typeof CARDS) => unknown) => selector(CARDS)) as PageProps['useCards'],
    useSelection: ((selector: (snapshot: undefined) => unknown) => selector(undefined)) as PageProps['useSelection'],
    pipelines: {
      async read() {
        reads.push(1)
        return { status: 'ok' as const, snapshot }
      },
      async write(patch: WorkbenchPipelinePatch) {
        writes.push(patch)
        if (options.pipelineMovedSinceLoad === true && writes.length === 1) {
          // Stored elsewhere since this page's read: the base it names is no longer current.
          snapshot = { ...snapshot, revision: `${snapshot.revision}+other` }
          return { status: 'conflict' as const, snapshot }
        }
        if (patch.baseRevision !== snapshot.revision) {
          return { status: 'conflict' as const, snapshot }
        }
        snapshot = {
          apiVersion: 1,
          revision: `${snapshot.revision}+1`,
          pipelines: patch.pipelines,
        }
        return { status: 'ok' as const, snapshot }
      },
    },
    skillCards: {
      api: {
        read: async () => ({ status: 'ok' as const, snapshot: cardSnapshot }),
        write: async (patch: WorkbenchSkillCardPatch) => {
          cardWrites.push(patch)
          if (options.cardWriteLands === false) {
            return { status: 'conflict' as const, snapshot: cardSnapshot }
          }
          // The store moved after this page read it, so the first write names a revision the
          // Host no longer holds — and the Host answers with the one it does.
          if (options.cardMovedSinceLoad === true && cardWrites.length === 1) {
            cardSnapshot = { ...cardSnapshot, revision: `${cardSnapshot.revision}+run` }
            return { status: 'conflict' as const, snapshot: cardSnapshot }
          }
          cardSnapshot = {
            revision: `${cardSnapshot.revision}+1`,
            cards: [
              ...cardSnapshot.cards.filter(card => card.cardId !== patch.cardId),
              {
                cardId: patch.cardId,
                name: patch.name ?? patch.cardId,
                ...patch.skill === undefined || patch.skill === null ? {} : { skill: patch.skill },
                // Stored the way the host stores it, so a panel that re-reads sees the change.
                ...patch.workspace === undefined || patch.workspace === null ? {} : { workspace: patch.workspace },
                ...patch.instruction === undefined || patch.instruction === null ? {} : { instruction: patch.instruction },
                templateSkills: [],
              },
            ],
            results: cardSnapshot.results,
          }
          return { status: 'ok' as const, snapshot: cardSnapshot }
        },
        catalog: options.catalog ?? (async () => ({ status: 'ok' as const, entries: SKILLS })),
        poll: options.run === undefined
          ? async () => ({ status: 'unavailable' as const, reason: 'not used by these cases' })
          : options.run.poll,
        start: options.run === undefined
          ? async () => ({ status: 'unavailable' as const, reason: 'not used by these cases' })
          : options.run.start,
        cancel: async () => {},
        saveResult: async () => ({ status: 'unavailable' as const, reason: 'not used by these cases' }),
        statDirectory: async () => ({ status: 'unavailable' as const, reason: 'not used by these cases' }),
        listFiles: options.listFiles ?? (async (_cardId: string, path: string) => ({
          status: 'ok' as const,
          listing: { path, entries: [], truncated: false },
        })),
      },
      ...options.documents === undefined ? {} : { documents: options.documents },
      runSessionId: () => 'session-user',
      models: fakeModelSeat(),
      workspacePicker: options.picker ?? fakeWorkspacePicker().picker,
    },
    closeCard: () => {},
    openCard: (cardId: string) => { openedCards.push(cardId) },
    renderSlot: (() => null) as unknown as PageProps['renderSlot'],
    t,
    ...options.overrides ?? {},
  } as unknown as PageProps
  return { props: merged, writes, cardWrites, reads, openedCards }
}

/**
 * Render the page and wait for its first pipeline read to land.
 * @param options - stored pipelines, run seams, and prop overrides.
 * @returns the write log and the render result.
 */
async function renderPage(options: Parameters<typeof props>[0] = {}) {
  const built = props(options)
  const view = render(<WorkbenchPage {...built.props} />)
  await waitFor(() => { expect(built.reads.length).toBeGreaterThan(0) })
  return { ...built, view }
}

// Which pipeline the page opens is remembered between mounts, so one case's switch would
// otherwise decide the next case's first pipeline.
beforeEach(() => { globalThis.localStorage.clear() })

describe('WorkbenchPage', () => {
  it('opens on a stored pipeline with its steps on the canvas', async () => {
    await renderPage()
    await waitFor(() => { expect(document.querySelectorAll('[data-step-index]').length).toBe(2) })
    // The canvas title is the one place that names the pipeline on screen.
    expect(document.querySelector('[data-canvas-title]')?.textContent).toBe('Release check')
    expect(document.querySelector('[data-insp-kicker]')?.textContent).toBe(en.pipeStepKicker
      .replace('{at}', '1').replace('{count}', '2').replace('{name}', 'Release check'))
    expect(screen.getAllByText('A card').length).toBeGreaterThan(0)
    expect(screen.getAllByText('B card').length).toBeGreaterThan(0)
    expect(document.querySelector('[data-canvas-meta]')?.textContent).toBe(
      en.pipeMetaSteps.replace('{count}', '2'),
    )
  })

  it('reopens the pipeline it showed last, not the one storage lists first', async () => {
    // The remembered pipeline is the older one and second in storage, so neither "first
    // stored" nor "most recently changed" would land on it: only the memory does.
    rememberOpenPipeline('pipeline-older')
    await renderPage({
      pipelines: [
        pipeline({ id: 'pipeline-newer', name: 'Release check', updatedAt: 9 }),
        pipeline({ id: 'pipeline-older', name: 'Nightly', updatedAt: 1 }),
      ],
    })
    await waitFor(() => {
      expect(document.querySelector('[data-canvas-title]')?.textContent).toBe('Nightly')
    })
  })

  it('remembers the pipeline the user switches to, across a remount', async () => {
    const two = {
      pipelines: [
        pipeline({ id: 'pipeline-1', name: 'Nightly', updatedAt: 1 }),
        pipeline({ id: 'pipeline-2', name: 'Release check', updatedAt: 9 }),
      ],
    }
    const { view } = await renderPage(two)
    // Nothing remembered yet, so the most recently changed one is what the panel opens onto.
    await waitFor(() => {
      expect(document.querySelector('[data-canvas-title]')?.textContent).toBe('Release check')
    })
    fireEvent.click(document.querySelector('[data-canvas-title]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-pipeline-row="pipeline-1"]') as HTMLElement)
    await waitFor(() => {
      expect(document.querySelector('[data-canvas-title]')?.textContent).toBe('Nightly')
    })
    expect(readOpenPipeline()).toBe('pipeline-1')

    // Opening a card and coming back unmounts the panel; the switch has to survive that.
    view.unmount()
    await renderPage(two)
    await waitFor(() => {
      expect(document.querySelector('[data-canvas-title]')?.textContent).toBe('Nightly')
    })
  })

  it('opens the most recently changed pipeline when the remembered one is gone', async () => {
    // What a deleted pipeline leaves behind: an id that no longer names anything stored.
    rememberOpenPipeline('pipeline-deleted')
    await renderPage({
      pipelines: [
        pipeline({ id: 'pipeline-1', name: 'Nightly', updatedAt: 1 }),
        pipeline({ id: 'pipeline-2', name: 'Release check', updatedAt: 9 }),
      ],
    })
    await waitFor(() => {
      expect(document.querySelector('[data-canvas-title]')?.textContent).toBe('Release check')
    })
  })

  it('lists the stored cards under the single-task heading', async () => {
    await renderPage()
    // The title menu is the only list: pipelines, then the single tasks, then the
    // pipeline's own actions.
    fireEvent.click(document.querySelector('[data-canvas-title]') as HTMLElement)
    expect(await screen.findByText(en.pipeRailTasks)).toBeDefined()
    // Both cards are steps of the pipeline and are also listed as single tasks.
    expect(document.querySelectorAll('[data-card-row]').length).toBeGreaterThanOrEqual(2)
  })

  it('opens onto the creation offer when nothing is stored', async () => {
    await renderPage({ pipelines: [] })
    // The canvas is not named after a pipeline, because there is none to name: the column
    // carries its own label and the whole column is the creation offer.
    expect(await screen.findByText(en.pipeNoPipeline)).toBeDefined()
    expect(screen.getByText(en.pipeEmptyPipelineBody)).toBeDefined()
    expect(document.querySelector('[data-canvas-title]')).toBeNull()
    expect(document.querySelector('[data-empty-pipeline] [data-new-pipeline]')).not.toBeNull()
  })

  it('creates a pipeline with no steps and opens it', async () => {
    const { writes } = await renderPage()
    fireEvent.click(document.querySelector('[data-canvas-title]') as HTMLElement)
    // The menu's entry, not the panel head's button: both create a pipeline, and the menu
    // is what a user opens first.
    await waitFor(() => { expect(document.querySelector('[data-title-menu]')).not.toBeNull() })
    fireEvent.click(document.querySelector('[data-title-menu] [data-new-pipeline]') as HTMLElement)
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines.map(entry => entry.id)).toEqual(['pipeline-1', 'pipeline-2'])
    expect(writes[0]?.pipelines.find(entry => entry.id === 'pipeline-2')?.steps).toEqual([])
    // The new pipeline is the one on screen: its empty-step offer is up.
    // The empty canvas and the empty inspector both offer the same first move.\n    expect((await screen.findAllByText(en.pipeAddFirstStep)).length).toBeGreaterThan(0)
    expect(document.querySelector('[data-canvas-title]')?.textContent).toBe(en.pipeNewPipelineName)
  })

  it('offers the skills this session can invoke, not the cards already made', async () => {
    await renderPage()
    fireEvent.click(await screen.findByText(en.pipeAddStep))
    expect(document.querySelector('[data-pick-skill="design-doc"]')).not.toBeNull()
    // A card is what a picked skill becomes, so the picker never asks for one.
    expect(document.querySelector('[data-pick-card]')).toBeNull()
  })

  it('adds a step by picking a skill, which becomes the step\'s card', async () => {
    const { writes, cardWrites } = await renderPage({ pipelines: [pipeline({ steps: [{ cardId: 'a-card' }] })] })
    fireEvent.click(await screen.findByText(en.pipeAddStep))
    fireEvent.click(document.querySelector('[data-pick-skill="design-doc"]') as HTMLElement)
    await waitFor(() => { expect(cardWrites).toHaveLength(1) })
    // One card per picked skill, named after it, holding it.
    expect(cardWrites[0]).toMatchObject({ name: 'design-doc', skill: 'design-doc' })
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines[0]?.steps).toEqual([
      { cardId: 'a-card' },
      { cardId: cardWrites[0]?.cardId },
    ])
  })

  it('adds the step anyway when a run moved the store past this page', async () => {
    // The revision a run leaves behind is the reason "add a step" used to do nothing: the
    // write named a revision the Host had already moved past, was refused as a conflict, and
    // the refusal was dropped on the floor. The conflict carries the current revision, so the
    // write can simply be asked again.
    const { writes, cardWrites } = await renderPage({
      pipelines: [pipeline({ steps: [{ cardId: 'a-card' }] })],
      cardMovedSinceLoad: true,
    })
    fireEvent.click(await screen.findByText(en.pipeAddStep))
    fireEvent.click(document.querySelector('[data-pick-skill="design-doc"]') as HTMLElement)
    await waitFor(() => { expect(writes).toHaveLength(1) })
    // One refusal, then the same card made for real: no orphan card is left behind.
    expect(cardWrites).toHaveLength(2)
    expect(cardWrites[0]?.cardId).toBe(cardWrites[1]?.cardId)
    expect(writes[0]?.pipelines[0]?.steps).toEqual([
      { cardId: 'a-card' },
      { cardId: cardWrites[1]?.cardId },
    ])
    expect(document.querySelector('[data-picker-problem]')).toBeNull()
    expect(document.querySelector('[data-picker-title]')).toBeNull()
  })

  it('adds the step even when the pipeline set was stored by someone else meanwhile', async () => {
    // The same staleness one store over. A conflict answers with what is stored, so the step
    // list can be written again against it instead of the step quietly not appearing.
    const { writes } = await renderPage({
      pipelines: [pipeline({ steps: [{ cardId: 'a-card' }] })],
      pipelineMovedSinceLoad: true,
    })
    fireEvent.click(await screen.findByText(en.pipeAddStep))
    fireEvent.click(document.querySelector('[data-pick-skill="design-doc"]') as HTMLElement)
    await waitFor(() => { expect(writes).toHaveLength(2) })
    expect(writes[1]?.pipelines[0]?.steps).toHaveLength(2)
    expect(document.querySelector('[data-picker-title]')).toBeNull()
  })

  it('keeps the picker up and says why when the step could not be added', async () => {
    // A control that does nothing at all reads as broken. The picker stays, and the reason
    // for the missing step is written where the click was made.
    const { writes } = await renderPage({
      pipelines: [pipeline({ steps: [{ cardId: 'a-card' }] })],
      cardWriteLands: false,
    })
    fireEvent.click(await screen.findByText(en.pipeAddStep))
    fireEvent.click(document.querySelector('[data-pick-skill="design-doc"]') as HTMLElement)
    await waitFor(() => { expect(document.querySelector('[data-picker-problem]')).not.toBeNull() })
    expect(document.querySelector('[data-picker-problem]')?.textContent).toBe(
      en.pipeAddProblem.replace('{reason}', 'the stored cards kept changing'),
    )
    // Nothing was stored, so the canvas still shows the pipeline it showed before.
    expect(writes).toHaveLength(0)
    expect(document.querySelector('[data-picker-title]')).not.toBeNull()
  })

  it('refuses a skill that is already in the pipeline', async () => {
    const { writes } = await renderPage()
    fireEvent.click(await screen.findByText(en.pipeAddStep))
    const row = document.querySelector('[data-pick-skill="git-repo"]') as HTMLButtonElement
    // The picker still lists it — the skill exists — but it cannot be added twice.
    expect(row.disabled).toBe(true)
    expect(row.textContent).toContain(en.pipePickerUsed)
    fireEvent.click(row)
    expect(writes).toHaveLength(0)
  })

  it('says why the picker has nothing to offer when the catalogue cannot be read', async () => {
    await renderPage({
      catalog: async () => ({ status: 'failed' as const, code: 'session-not-live', message: 'no agent' }),
    })
    fireEvent.click(await screen.findByText(en.pipeAddStep))
    expect(document.querySelector('[data-picker-title]')).not.toBeNull()
    // Opening the picker re-reads the catalogue, so the failure arrives a tick later.
    expect(await screen.findByText(en.skillCardNoSession)).toBeDefined()
  })

  it('moves a step later and keeps the focus on it', async () => {
    const { writes } = await renderPage()
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-step-menu-btn]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-move-down]') as HTMLElement)
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines[0]?.steps).toEqual([{ cardId: 'b-card' }, { cardId: 'a-card' }])
    // The moved step is the one the inspector still shows.
    expect(document.querySelector('[data-step-index="1"]')?.getAttribute('aria-selected')).toBe('true')
  })

  it('changes the permission mode for every step at once', async () => {
    const { cardWrites } = await renderPage()
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    // "Change once, every step follows" is only true if every step's card is written.
    const row = document.querySelector('[data-cfg-permission]') as HTMLSelectElement
    expect(row).not.toBeNull()
    expect(row.value).toBe('workspace-write')
    fireEvent.change(row, { target: { value: 'read-only' } })
    await waitFor(() => { expect(cardWrites).toHaveLength(2) })
    expect(cardWrites.map(patch => [patch.cardId, patch.permission])).toEqual([
      ['a-card', 'read-only'],
      ['b-card', 'read-only'],
    ])
    // The row says what the mode means, and the label is the product's own name for it.
    expect(screen.getByText(en.pipeCfgPermissionNote)).toBeTruthy()
  })

  it('points every step at one model, and can put them back on the session', async () => {
    // A step whose card sets no model of its own is the one that follows the session.
    const { cardWrites } = await renderPage({ pipelines: [pipeline({ steps: [{ cardId: 'b-card' }] })] })
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    const row = document.querySelector('[data-cfg-model]') as HTMLSelectElement
    expect(row).not.toBeNull()
    // Nothing chosen yet: the first option is the one that means "follow the session".
    expect(row.value).toBe('')
    expect(screen.getByText(en.pipeCfgModelInheritNote)).toBeTruthy()
    // The option value is the stored pair, not a "provider/model" string: a provider id
    // may itself contain a slash, so the value has to be decodable without guessing.
    fireEvent.change(row, { target: { value: JSON.stringify(['deepseek', 'deepseek-reasoner']) } })
    await waitFor(() => { expect(cardWrites).toHaveLength(1) })
    expect(cardWrites[0]?.model).toEqual({ provider: 'deepseek', model: 'deepseek-reasoner' })
    fireEvent.change(row, { target: { value: '' } })
    await waitFor(() => { expect(cardWrites).toHaveLength(2) })
    // Clearing is a real answer, not a missing one: it writes null, not nothing.
    expect(cardWrites[1]?.model).toBeNull()
  })

  it('chooses the skill of every step from the catalog', async () => {
    const { cardWrites } = await renderPage()
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    const row = document.querySelector('[data-cfg-skill]') as HTMLSelectElement
    expect(row).not.toBeNull()
    // The row offers what the catalog holds, and says what the chosen skill does.
    expect([...row.options].map(option => option.value)).toContain('design-doc')
    expect((document.querySelector('[data-panel="config"]') as HTMLElement).textContent)
      .toContain('Work with a repository')
    fireEvent.change(row, { target: { value: 'design-doc' } })
    await waitFor(() => { expect(cardWrites).toHaveLength(2) })
    expect(cardWrites.map(patch => patch.skill)).toEqual(['design-doc', 'design-doc'])
  })

  it('edits the instruction as text and writes it to every step', async () => {
    const { cardWrites } = await renderPage()
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    const box = document.querySelector('[data-cfg-instruction]') as HTMLTextAreaElement
    expect(box).not.toBeNull()
    // A text box, not a mode picker: the instruction is the user's own sentence.
    expect(box.tagName).toBe('TEXTAREA')
    fireEvent.blur(box, { target: { value: '  只补测试，不改生产代码。  ' } })
    await waitFor(() => { expect(cardWrites).toHaveLength(2) })
    // Trimmed on the way in: whitespace is not part of what the card says.
    expect(cardWrites.map(patch => patch.instruction)).toEqual([
      '只补测试，不改生产代码。',
      '只补测试，不改生产代码。',
    ])

  })

  it('asks the platform for a directory rather than reading a typed path', async () => {
    const { cardWrites } = await renderPage()
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    const row = document.querySelector('[data-cfg-workspace]') as HTMLButtonElement
    // A button that opens the chooser, not a text field: a typed path is a directory no
    // chooser ever confirmed, and this product already decided against that once.
    expect(row.tagName).toBe('BUTTON')
    expect(row.disabled).toBe(false)
    fireEvent.click(row)
    await waitFor(() => { expect(cardWrites).toHaveLength(2) })
    // Whatever the chooser answered is what every step's card stores.
    expect(cardWrites.map(patch => patch.workspace)).toEqual([{ path: PICKED_PATH }, { path: PICKED_PATH }])
  })

  it('shows the picked directory the panel stored', async () => {
    // The panel renders the stored card, so it has to re-read after a write. Without that,
    // a write that landed looks exactly like a write that never happened.
    await renderPage()
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    const row = document.querySelector('[data-cfg-workspace]') as HTMLButtonElement
    fireEvent.click(row)
    await waitFor(() => { expect(row.textContent).toContain(PICKED_PATH) })
  })

  it('says why a config change did not land instead of failing silently', async () => {
    await renderPage({ cardWriteLands: false })
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    fireEvent.click(document.querySelector('[data-cfg-workspace]') as HTMLButtonElement)
    const problem = await waitFor(() => {
      const found = document.querySelector('[data-cfg-problem]')
      expect(found).not.toBeNull()
      return found as HTMLElement
    })
    expect(problem.textContent).toBe(en.pipeCfgWriteFailed)
  })
  it('edits the template in the source box and stores what was typed', async () => {
    const { cardWrites } = await renderPage()
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    fireEvent.click(document.querySelector('[data-cfg-view="source"]') as HTMLButtonElement)
    const box = await waitFor(() => {
      const found = document.querySelector('[data-cfg-template]')
      expect(found).not.toBeNull()
      return found as HTMLTextAreaElement
    })
    // 源码 is one edit box, exactly like the prototype: the template is read here and
    // written here. A read-only view would make this block a poster of a template.
    expect(box.tagName).toBe('TEXTAREA')
    expect(box.value).toContain('<html>')
    // Editable means editable, not "has a box": no attribute here may disable it, and the
    // caret has to be able to sit in it. A read-only slab that looks like a field is the
    // exact thing this block was rebuilt to stop being.
    expect(box.disabled).toBe(false)
    expect(box.readOnly).toBe(false)
    box.focus()
    expect(document.activeElement).toBe(box)
    fireEvent.change(box, { target: { value: '<p>typed</p>' } })
    expect(box.value).toBe('<p>typed</p>')
    // Type, then leave the field: the box is controlled, so the value arrives as a change.
    fireEvent.change(box, { target: { value: '<html><body>typed by the user</body></html>' } })
    fireEvent.blur(box)
    await waitFor(() => { expect(cardWrites).toHaveLength(1) })
    expect(cardWrites[0]?.template).toEqual({ skill: 'git-repo', html: '<html><body>typed by the user</body></html>' })
  })

  it('lets a card that has no template get one from the source box', async () => {
    // A card with no template is the state where this block used to be a sentence and a
    // disabled-looking slab: nowhere to write, so "cannot be used" was exactly right.
    const [first, ...rest] = CARD_VIEWS
    const { template: stored, ...withoutTemplate } = first!
    expect(stored).toBeDefined()
    // The store really can hand back a card with no template at all; the fixture type is the
    // narrow one, so the absence is spelled out here rather than pretended away.
    const { cardWrites } = await renderPage({
      cardViews: [withoutTemplate, ...rest] as unknown as typeof CARD_VIEWS,
    })
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    fireEvent.click(document.querySelector('[data-cfg-view="source"]') as HTMLButtonElement)
    const box = await waitFor(() => {
      const found = document.querySelector('[data-cfg-template]')
      expect(found).not.toBeNull()
      return found as HTMLTextAreaElement
    })
    expect(box.value).toBe('')
    expect(box.placeholder).toBe(en.pipeCfgNoTemplate)
    fireEvent.change(box, { target: { value: '<html><body>first draft</body></html>' } })
    fireEvent.blur(box)
    await waitFor(() => { expect(cardWrites).toHaveLength(1) })
    expect(cardWrites[0]?.template).toEqual({ skill: 'git-repo', html: '<html><body>first draft</body></html>' })
  })

  it('switches the template block between preview and source', async () => {
    // A template carrying the real markers, so the preview has a region to put a placeholder in.
    const [first, ...rest] = CARD_VIEWS
    await renderPage({
      cardViews: [{ ...first!, template: '<html><body><!-- template-begin --><p>old</p><!-- template-end --></body></html>' }, ...rest],
    })
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    fireEvent.click(document.querySelector('[data-cfg-view="source"]') as HTMLButtonElement)
    await waitFor(() => { expect(document.querySelector('[data-cfg-template]')).not.toBeNull() })
    fireEvent.click(document.querySelector('[data-cfg-view="preview"]') as HTMLButtonElement)
    // Two views of the same block, one at a time: the box is only in the source view.
    await waitFor(() => { expect(document.querySelector('[data-cfg-template]')).toBeNull() })
    expect(document.querySelector('[data-panel="config"]')?.textContent).toContain(en.pipeCfgPreviewNote)
    // The preview is the template rendered in its own styles, not a picture of a template:
    // the frame holds the document, and where the model writes there is a placeholder.
    const frame = document.querySelector('[data-cfg-preview]') as HTMLElement
    expect(frame).not.toBeNull()
    // ShadowHtml puts the document in a shadow root on its own host, inside the frame.
    const rendered = frame.querySelector('.wb-tplPreviewFrame')?.shadowRoot?.innerHTML ?? ''
    // The line above the frame and the region note are part of the block, not decoration:
    // they say what the picture is, and where the model's output will land.
    expect(document.querySelector('[data-cfg-preview-note]')?.textContent).toBe(en.pipeCfgPreviewNote)
    expect(rendered).toContain(en.pipeCfgRegion)
    // The template's own region text is gone: what the model writes there does not exist yet.
    expect(rendered).not.toContain('<p>old</p>')
  })
  it('puts the region note under a table header, where the rows will go', async () => {
    // The region of a table template sits inside tbody. A note shaped like a div is not a table
    // row, so the parser lifts it above the table — the note then sits over the header it
    // belongs under. This template is the shape the real cards have.
    const [first, ...rest] = CARD_VIEWS
    // Seven columns, the way the real cards lay one out. The span must be exactly that: an
    // oversized colspan adds columns, the header cells then collapse and their text overlaps.
    const table = '<html><body><table><colgroup><col><col><col><col><col><col><col></colgroup><thead><tr>'
      + '<th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th>'
      + '</tr></thead><tbody><!-- template-begin --><!-- template-end --></tbody></table></body></html>'
    await renderPage({
      cardViews: [{ ...first!, template: table }, ...rest] as typeof CARD_VIEWS,
    })
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    const frame = await waitFor(() => {
      const found = document.querySelector('[data-cfg-preview]') as HTMLElement | null
      expect(found).not.toBeNull()
      return found!
    })
    const host = frame.querySelector('.wb-tplPreviewFrame') as HTMLElement
    const shadow = host.shadowRoot as ShadowRoot
    const rendered = shadow.innerHTML
    expect(rendered).toContain(en.pipeCfgRegion)
    // Under the header, not above it, and still inside the body of the table.
    expect(rendered.indexOf('<th>A</th>')).toBeLessThan(rendered.indexOf(en.pipeCfgRegion))
    const cell = shadow.querySelector('tbody td')
    expect(cell).not.toBeNull()
    expect(cell?.getAttribute('colspan')).toBe('7')
  })

  it('states a disabled chooser when the page has no picker', async () => {
    await renderPage({ picker: noWorkspacePicker().picker })
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    const row = document.querySelector('[data-cfg-workspace]') as HTMLButtonElement
    // No chooser means no control: stated as unavailable rather than as a field that writes
    // a path nothing confirmed.
    expect(row.disabled).toBe(true)
    expect(row.textContent).toContain(en.pipeCfgWorkspaceNoPicker)
  })
  it('removes a step from the pipeline only on the second click', async () => {
    const { writes } = await renderPage()
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-step-menu-btn]') as HTMLElement)
    // Removing a step takes its product out of the results, so the row asks first and
    // names the step it is about to remove.
    fireEvent.click(document.querySelector('[data-remove-step]') as HTMLElement)
    expect(writes).toHaveLength(0)
    const row = document.querySelector('[data-remove-step]') as HTMLElement
    expect(row.textContent).toBe(en.pipeRemoveStepArmed)
    expect(document.querySelector('[data-armed]')).not.toBeNull()
    expect(document.querySelector('[data-step-menu]')?.textContent).toContain('A card')
    fireEvent.click(row)
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines[0]?.steps).toEqual([{ cardId: 'b-card' }])
  })

  it('renames a step in place, which renames the card it runs as', async () => {
    // A step's card is a stored instance with its own name; a registered card's label
    // comes from its registration, so the instance is what makes the new name visible.
    const { writes, cardWrites } = await renderPage({
      cardViews: [...CARD_VIEWS, { cardId: 'skill-card-1', name: 'Old name', skill: 'review', templateSkills: [] }],
      pipelines: [pipeline({ steps: [{ cardId: 'skill-card-1' }, { cardId: 'b-card' }] })],
    })
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-step-menu-btn]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-rename-step]') as HTMLElement)
    // The step's own title becomes the field, not the pipeline's: the inspector still
    // names the pipeline, and the card is what carries the new name.
    const field = screen.getByLabelText(en.pipeStepNameLabel) as HTMLInputElement
    expect(field.value).toBe('Old name')
    fireEvent.change(field, { target: { value: '  Design doc  ' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    await waitFor(() => { expect(cardWrites).toHaveLength(1) })
    expect(cardWrites[0]).toMatchObject({ cardId: 'skill-card-1', name: 'Design doc' })
    // Renaming a step is not a pipeline write: the steps are untouched.
    expect(writes).toHaveLength(0)
    await waitFor(() => { expect(screen.getAllByText('Design doc').length).toBeGreaterThan(0) })
    expect(document.querySelector('[data-node="0"] .wb-nodeTitle')?.textContent).toBe('Design doc')
  })

  it('leaves the name alone when the field is cancelled or unchanged', async () => {
    const { cardWrites } = await renderPage()
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-step-menu-btn]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-rename-step]') as HTMLElement)
    const field = screen.getByLabelText(en.pipeStepNameLabel) as HTMLInputElement
    fireEvent.keyDown(field, { key: 'Escape' })
    expect(document.querySelector('[data-node="0"] .wb-nodeTitle')?.textContent).toBe('A card')
    fireEvent.click(document.querySelector('[data-step-menu-btn]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-rename-step]') as HTMLElement)
    const again = screen.getByLabelText(en.pipeStepNameLabel) as HTMLInputElement
    fireEvent.keyDown(again, { key: 'Enter' })
    // Escape abandoned it and Enter on the unchanged name is not a rename either.
    await Promise.resolve()
    expect(cardWrites).toHaveLength(0)
  })

  it('says a step that has not started is 待运行, not 未运行', async () => {
    await renderPage({ pipelines: [pipeline({ steps: [{ cardId: 'a-card' }] })] })
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    // The step's chip and the canvas ran-state both say it has never started.
    expect(document.querySelector('[data-insp-meta]')?.textContent).toContain(en.pipeStepState_idle)
    expect(document.querySelector('[data-node="0"]')?.textContent).toContain(en.pipeStepState_idle)
    expect(en.pipeStepState_idle).toBe('Ready to run')
    expect(document.querySelector('[data-node="0"]')?.textContent).toContain(en.pipeNeverRan)
  })

  it('renames a pipeline from its row menu', async () => {
    const { writes } = await renderPage()
    fireEvent.click(document.querySelector('[data-canvas-title]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeRename))
    const field = screen.getByLabelText(en.pipeRenameLabel) as HTMLInputElement
    fireEvent.change(field, { target: { value: 'Nightly' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines[0]?.name).toBe('Nightly')
  })

  it('keeps the title menu alive through the pointerdown that starts a click on its rows', async () => {
    // A browser sends pointerdown before click; a bare fireEvent.click skips it. The
    // document-level "close on the next pointerdown" listener used to unmount the row in
    // between, so rename and delete worked in jsdom and did nothing in the app.
    await renderPage()
    fireEvent.click(document.querySelector('[data-canvas-title]') as HTMLElement)
    const rename = screen.getByText(en.pipeRename)
    fireEvent.pointerDown(rename)
    expect(document.querySelector('[data-title-menu]')).not.toBeNull()
    fireEvent.click(rename)
    expect(screen.getByLabelText(en.pipeRenameLabel)).not.toBeNull()
  })

  it('keeps a blank rename out of storage', async () => {
    const { writes } = await renderPage()
    fireEvent.click(document.querySelector('[data-canvas-title]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeRename))
    const field = screen.getByLabelText(en.pipeRenameLabel) as HTMLInputElement
    fireEvent.change(field, { target: { value: '   ' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    // Nothing to write: the stored name stays, and no request is made for the blank one.
    await waitFor(() => { expect(screen.queryByLabelText(en.pipeRenameLabel)).toBeNull() })
    expect(writes).toHaveLength(0)
  })

  it('deletes a pipeline only once the deletion is confirmed', async () => {
    const { writes } = await renderPage()
    fireEvent.click(document.querySelector('[data-canvas-title]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeDelete))
    // The first click arms the row; nothing is written yet.
    expect(writes).toHaveLength(0)
    fireEvent.click(screen.getByText(en.pipeDeleteConfirm))
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines).toEqual([])
  })

  it('offers no run control for a pipeline with no steps', async () => {
    await renderPage({ pipelines: [pipeline({ steps: [] })] })
    const run = document.querySelector('[data-run-all]') as HTMLButtonElement
    expect(run.disabled).toBe(true)
  })

  it('shows the empty-step panel until something is focused', async () => {
    await renderPage({ pipelines: [pipeline({ steps: [] })] })
    expect(document.querySelector('[data-panel="empty"]')).not.toBeNull()
    fireEvent.click(document.querySelector('[data-add-step="0"]') as HTMLElement)
    await waitFor(() => { expect(document.querySelector('[data-picker-title]')).not.toBeNull() })
  })

  it('shows one step product in the result panel and opens it in the reader', async () => {
    await renderPage({ results: [result('a-card', '<p>fresh</p>')] })
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-insp-tab="result"]') as HTMLElement)
    const open = await waitFor(() => {
      const found = document.querySelector('[data-open-result]')
      if (found === null) throw new Error('no product row yet')
      return found as HTMLElement
    })
    fireEvent.click(open)
    // The reader takes the whole panel: the document is read in exactly one place.
    await waitFor(() => { expect(document.querySelector('[data-reader]')).not.toBeNull() })
  })

  it('draws one row per file the result directory holds, with each file’s size', async () => {
    // The template says where this card's results live; the listing says what is in there.
    // Together they are the three rows the prototype draws instead of one row for the folder.
    const files: WorkbenchFileEntry[] = [
      { name: '需求.md', path: 'docs/设计/需求.md', type: 'file', size: 57812 },
      { name: '概要.md', path: 'docs/设计/概要.md', type: 'file', size: 36635 },
      { name: '子目录', path: 'docs/设计/子目录', type: 'directory' },
    ]
    await renderPage({
      results: [result('a-card', '<p>fresh</p>')],
      cardViews: [
        { ...CARD_VIEWS[0], template: '<div data-dsh-files="docs/设计"></div><!-- template-begin --><p>x</p><!-- template-end -->' },
        CARD_VIEWS[1],
      ],
      listFiles: async (_cardId, path) => ({
        status: 'ok',
        listing: { path, entries: files, truncated: false },
      }),
    })
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-insp-tab="result"]') as HTMLElement)
    await waitFor(() => {
      expect(document.querySelectorAll('[data-result-file]')).toHaveLength(2)
    })
    const rows = [...document.querySelectorAll('[data-result-file]')]
    expect(rows.map(row => row.querySelector('.wb-resItemName')?.textContent))
      .toEqual(['需求.md', '概要.md'])
    // Size beside the name, in the unit a person reads it in.
    expect(rows[0]?.querySelector('[data-result-size]')?.textContent).toBe('56.5 KB')
    expect(rows[1]?.querySelector('[data-result-size]')?.textContent).toBe('35.8 KB')
    // A directory in the listing is not a file this step handed over: no row, no size.
    expect(rows.some(row => row.textContent?.includes('子目录'))).toBe(false)
  })

  it('opens the reader on the file whose row was clicked, and tells the document which', async () => {
    // `dsh.openFile` is the whole mechanism: the row names a file, and the document the reader
    // mounts is handed that name. A template that ignores it still renders its own default.
    // A document is only handed a binding while it has a script to run, so this template
    // carries one: the script is the code that would read `dsh.openFile`.
    const asked: (string | undefined)[] = []
    const documents: WorkbenchScriptBinder = (input) => {
      asked.push(input.openFile)
      return {
        cardId: input.cardId,
        ...input.openFile === undefined ? {} : { openFile: input.openFile },
        root: input.root,
        host: input.host,
        files: {
          list: async () => ({ path: '', entries: [], truncated: false }),
          read: async () => ({ path: '', text: '', bytes: 0 }),
        },
        markdown: { render: async () => {} },
      }
    }
    await renderPage({
      results: [result('a-card', '<p>fresh</p>')],
      documents,
      cardViews: [
        {
          ...CARD_VIEWS[0],
          template: [
            '<div data-dsh-files="docs/设计"></div>',
            '<!-- template-begin --><p>x</p><!-- template-end -->',
            '<script>void 0</script>',
          ].join(''),
        },
        CARD_VIEWS[1],
      ],
      listFiles: async (_cardId, path) => ({
        status: 'ok',
        listing: {
          path,
          entries: [
            { name: '需求.md', path: 'docs/设计/需求.md', type: 'file', size: 10 },
            { name: '概要.md', path: 'docs/设计/概要.md', type: 'file', size: 20 },
          ],
          truncated: false,
        },
      }),
    })
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-insp-tab="result"]') as HTMLElement)
    const second = await waitFor(() => {
      const row = document.querySelector('[data-result-file="docs/设计/概要.md"]')
      if (row === null) throw new Error('the second file row is not there yet')
      return row as HTMLElement
    })
    fireEvent.click(second)
    await waitFor(() => { expect(document.querySelector('[data-reader]')).not.toBeNull() })
    // The document the reader mounted was told which file to open on — not the first one.
    await waitFor(() => { expect(asked).toContain('docs/设计/概要.md') })
    // The click named the second file, not the first the listing happens to hold.
    expect(asked.at(-1)).toBe('docs/设计/概要.md')
  })

  it('says why the directory could not be listed, and still opens the reader on the folder', async () => {
    // A listing that failed must not read as an empty directory, and must not take away the
    // one row that gets the user into the reader.
    const asked: (string | undefined)[] = []
    const documents: WorkbenchScriptBinder = (input) => {
      asked.push(input.openFile)
      return {
        cardId: input.cardId,
        root: input.root,
        host: input.host,
        files: {
          list: async () => ({ path: '', entries: [], truncated: false }),
          read: async () => ({ path: '', text: '', bytes: 0 }),
        },
        markdown: { render: async () => {} },
      }
    }
    await renderPage({
      results: [result('a-card', '<p>fresh</p>')],
      documents,
      cardViews: [
        {
          ...CARD_VIEWS[0],
          template: [
            '<div data-dsh-files="docs/设计"></div>',
            '<!-- template-begin --><p>x</p><!-- template-end -->',
            '<script>void 0</script>',
          ].join(''),
        },
        CARD_VIEWS[1],
      ],
      listFiles: async () => ({ status: 'unavailable', reason: 'the workspace is gone' }),
    })
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-insp-tab="result"]') as HTMLElement)
    const problem = await waitFor(() => {
      const found = document.querySelector('[data-files-problem]')
      if (found === null) throw new Error('no problem line yet')
      return found
    })
    expect(problem.textContent).toBe(en.pipeResultFilesProblem.replace('{reason}', 'the workspace is gone'))
    expect(document.querySelectorAll('[data-result-file]')).toHaveLength(0)
    const folder = document.querySelector('[data-open-result]')
    expect(folder).not.toBeNull()
    fireEvent.click(folder as HTMLElement)
    await waitFor(() => { expect(document.querySelector('[data-reader]')).not.toBeNull() })
    // Opening the folder names no file: the document shows whatever it shows by default.
    await waitFor(() => { expect(asked).toHaveLength(1) })
    expect(asked[0]).toBeUndefined()
  })


  it('draws a non-file result the way the prototype does: one row, its summary, nothing else', async () => {
    await renderPage({ results: [result('a-card', '<p>fresh</p>')] })
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-insp-tab="result"]') as HTMLElement)
    const open = await waitFor(() => {
      const found = document.querySelector('[data-open-result]')
      if (found === null) throw new Error('no product row yet')
      return found as HTMLElement
    })
    // 无目录的步骤没有清单可列，就是原型里的那一个按钮：图标 + 查看结果 + 摘要 + 箭头。
    expect(open.tagName).toBe('BUTTON')
    expect(open.className).toContain('wb-resOpen')
    expect(open.textContent).toContain(en.pipeResultOpenInline)
    // 摘要就是这一步自己的那一句，和左栏副标题同一个来源。
    expect(open.querySelector('[data-result-summary]')?.textContent).toBe('fresh')
    // 这个区块不解释怎么读，也不再放一枚重新生成：那颗按钮在阅读器和步骤菜单里。
    expect(document.querySelector('[data-result-review]')).toBeNull()
    expect(document.querySelector('[data-panel="result"] .wb-hint')).toBeNull()
  })

  it('runs the steps in order, carrying the session from one to the next', async () => {
    const starts: WorkbenchRunRequest[] = []
    const settled: WorkbenchRunState = {
      cardId: 'a-card',
      phase: 'settled',
      retried: false,
      result: {
        runId: 'run-1',
        skill: 'git-repo',
        executedAt: 1,
        stopReason: 'stop',
        structured: { html: '<b>ok</b>' },
        sessionId: 'session-chain',
      },
    }
    await renderPage({
      run: {
        start: async (request) => {
          starts.push(request)
          return { status: 'ok', state: { cardId: request.cardId, phase: 'running', retried: false } as WorkbenchRunState }
        },
        poll: async () => ({ status: 'ok', state: settled }),
      },
    })
    fireEvent.click(await screen.findByText(en.pipeRunAll))
    await waitFor(() => { expect(starts).toHaveLength(2) })
    // The first step opens the chain; the second joins the session the first settled in.
    expect(starts[0]?.mode).toEqual({ kind: 'step', terminal: false, join: false, handoff: { pipelineId: 'pipeline-1', step: 0, scope: 'full' } })
    expect(starts[0]?.sessionId).toBeUndefined()
    expect(starts[1]?.mode).toEqual({ kind: 'step', terminal: true, join: true, handoff: { pipelineId: 'pipeline-1', step: 1, scope: 'full' } })
    expect(starts[1]?.sessionId).toBe('session-chain')
    expect(starts[0]?.outputSchema).toBeDefined()
    // Finished runs say how long they took; the number is timing, so only its frame is fixed.
    await waitFor(() => {
      expect(document.querySelector('[data-run-noise]')?.textContent)
        .toContain(en.pipeAllDoneAt.replace('{count}', '2').replace('{took}', ''))
    })
  })

  it('does not call the pipeline done because one step ran alone', async () => {
    const starts: WorkbenchRunRequest[] = []
    await renderPage({
      run: {
        start: async (request) => {
          starts.push(request)
          return { status: 'ok', state: { cardId: request.cardId, phase: 'running', retried: false } as WorkbenchRunState }
        },
        poll: async () => ({
          status: 'ok',
          state: {
            cardId: 'a-card',
            phase: 'settled',
            retried: false,
            result: { runId: 'run-1', skill: 's', executedAt: 1, stopReason: 'stop', structured: { html: '<b>ok</b>' }, sessionId: 'session-one' },
          } as WorkbenchRunState,
        }),
      },
    })
    await screen.findByText(en.pipeRunAll)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-run-one]') as HTMLElement)
    // The step did finish; the pipeline only ran one step of itself, and says so.
    await waitFor(() => {
      expect(document.querySelector('[data-canvas-state]')?.textContent).toBe(en.pipeStand_solo)
    })
    expect(document.querySelector('[data-step-index="0"]')?.getAttribute('data-s')).toBe('done')
    // The bar names the step that ran and where Run would start, which is not step 1.
    expect(document.querySelector('[data-run-noise]')?.textContent).toBe([
      en.pipeBarSoloHead,
      en.pipeBarSoloWhich.replace('{steps}', '1'),
      en.pipeBarSoloNextResume.replace('{at}', '2'),
    ].join('·'))
    // Filled means the whole chain ran, so this step's segment is the hollow one.
    expect(document.querySelector('[data-seg="0"]')?.getAttribute('data-s')).toBe('solo')
    expect(document.querySelector('[data-seg="1"]')?.getAttribute('data-s')).toBe('idle')
    // And the foot says which run produced the product, and that it covered this step only.
    expect(screen.getByTitle(en.pipeRunOfSingleTitle.replace('{no}', '1'))).toBeDefined()
    // Run does what the bar just said: it starts at step 2, and it continues the session
    // step 1 settled in rather than opening a cold one.
    fireEvent.click(document.querySelector('[data-run-all]') as HTMLElement)
    await waitFor(() => { expect(starts).toHaveLength(2) })
    expect(starts[1]?.cardId).toBe('b-card')
    expect(starts[1]?.sessionId).toBe('session-one')
    expect(starts[1]?.mode).toEqual({ kind: 'step', terminal: true, join: true, handoff: { pipelineId: 'pipeline-1', step: 1, scope: 'full' } })
    // And the pipeline is done once the run that covered the rest of it settled.
    await waitFor(() => {
      expect(document.querySelector('[data-canvas-state]')?.textContent).toBe(en.pipeStand_done)
    })
    // The run list names what each run covered, so a one-step run is not a line that looks
    // like any other, and it says how that run ended in words a reader knows.
    fireEvent.click(document.querySelector('[data-canvas-meta]') as HTMLElement)
    const rows = document.querySelectorAll('[data-hist-run]')
    expect(rows.length).toBe(2)
    expect(rows[1]?.textContent).toContain(en.pipeScopeOnly.replace('{name}', 'A card'))
    expect(rows[1]?.textContent).toContain(en.pipeRunState_ok)
  })

  it('still says a step ran on its own after the page forgot the run', async () => {
    // The product records what produced it, and that record outlives the panel's own run
    // history: a step run alone keeps reading as one after a reload, while the run number
    // it can no longer name is simply not claimed.
    await renderPage({
      results: [{
        ...result('a-card'),
        pipeline: { id: 'pipeline-1', step: 0, scope: 'single' },
      }],
      pipelines: [{ id: 'pipeline-1', name: 'P', steps: [{ cardId: 'a-card' }], updatedAt: 1 }],
    })
    await waitFor(() => {
      expect(document.querySelector('[data-canvas-state]')?.textContent).toBe(en.pipeStand_solo)
    })
    expect(document.querySelector('[data-run-noise]')?.textContent).toBe([
      en.pipeBarSoloHead,
      en.pipeBarSoloWhich.replace('{steps}', '1'),
      en.pipeBarSoloNextAll,
    ].join('·'))
    expect(document.querySelector('[data-seg="0"]')?.getAttribute('data-s')).toBe('solo')
    expect(document.querySelector('[data-step-index="0"]')?.textContent).toContain(en.pipeRunOfSingleNo)
  })

  it('says what it knows when steps hold results but nothing ran here', async () => {
    await renderPage({ results: [result('a-card')] })
    // A reopened panel has no runs to name: claiming "done" would be a guess, and claiming
    // "never run" would contradict the result the user can see on the step.
    await waitFor(() => {
      expect(document.querySelector('[data-canvas-state]')?.textContent).toBe(en.pipeStand_kept)
    })
    expect(document.querySelector('[data-run-noise]')?.textContent).toBe([
      en.pipeBarKeptWhich.replace('{steps}', '1'),
      en.pipeBarSoloNextResume.replace('{at}', '2'),
    ].join('·'))
    expect(document.querySelector('[data-seg="0"]')?.getAttribute('data-s')).toBe('solo')
  })

  it('runs one step alone, with its own session', async () => {
    const starts: WorkbenchRunRequest[] = []
    await renderPage({
      run: {
        start: async (request) => {
          starts.push(request)
          return { status: 'ok', state: { cardId: request.cardId, phase: 'running', retried: false } as WorkbenchRunState }
        },
        poll: async () => ({
          status: 'ok',
          state: {
            cardId: 'b-card',
            phase: 'settled',
            retried: false,
            result: { runId: 'run-2', skill: 's', executedAt: 1, stopReason: 'stop', sessionId: 'session-own' },
          } as WorkbenchRunState,
        }),
      },
    })
    await screen.findByText(en.pipeRunAll)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-run-one]') as HTMLElement)
    await waitFor(() => { expect(starts).toHaveLength(1) })
    // A step run on its own is a chain of one: it opens the session and closes it, and it
    // says it covers that step alone — the request is the only place that fact is recorded.
    expect(starts[0]?.mode).toEqual({ kind: 'step', terminal: true, join: false, handoff: { pipelineId: 'pipeline-1', step: 0, scope: 'single' } })
    expect(starts[0]?.cardId).toBe('a-card')
  })

  it('stops the chain at the first step that fails', async () => {
    const starts: WorkbenchRunRequest[] = []
    await renderPage({
      run: {
        start: async (request) => {
          starts.push(request)
          return { status: 'ok', state: { cardId: request.cardId, phase: 'running', retried: false } as WorkbenchRunState }
        },
        poll: async () => ({
          status: 'ok',
          state: { cardId: 'a-card', phase: 'settled', retried: false, failure: 'the child gave up' } as WorkbenchRunState,
        }),
      },
    })
    fireEvent.click(await screen.findByText(en.pipeRunAll))
    await waitFor(() => {
      expect(document.querySelector('[data-run-noise]')?.textContent).toBe(
        en.pipeFailedAt.replace('{done}', '0').replace('{count}', '2').replace('{at}', '1'),
      )
    })
    // The second step never started: a failed step produced nothing to continue from.
    expect(starts).toHaveLength(1)
  })
})
