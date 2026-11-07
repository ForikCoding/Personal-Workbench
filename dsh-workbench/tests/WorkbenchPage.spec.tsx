// @vitest-environment jsdom
/** Page composition: the rail, the canvas, the inspector, and the chain the canvas runs. */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { primitivesMock } from './support/primitives-mock.tsx'
import { fakeModelSeat } from './support/fake-model-seat.ts'
import { fakeWorkspacePicker } from './support/fake-workspace-picker.ts'

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

/** The configured cards the panels read their template, model and workspace from. */
const CARD_VIEWS = [
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
  cardViews?: typeof CARD_VIEWS
  overrides?: Partial<PageProps>
} = {}): {
  props: PageProps
  writes: WorkbenchPipelinePatch[]
  cardWrites: WorkbenchSkillCardPatch[]
  reads: number[]
} {
  let snapshot: WorkbenchPipelineSnapshot = {
    apiVersion: 1,
    revision: '1:0',
    pipelines: options.pipelines ?? [pipeline()],
  }
  const writes: WorkbenchPipelinePatch[] = []
  const cardWrites: WorkbenchSkillCardPatch[] = []
  const reads: number[] = []
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
          cardSnapshot = {
            revision: `${cardSnapshot.revision}+1`,
            cards: [
              ...cardSnapshot.cards.filter(card => card.cardId !== patch.cardId),
              {
                cardId: patch.cardId,
                name: patch.name ?? patch.cardId,
                ...patch.skill === undefined || patch.skill === null ? {} : { skill: patch.skill },
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
      },
      runSessionId: () => 'session-user',
      models: fakeModelSeat(),
      workspacePicker: fakeWorkspacePicker().picker,
    },
    closeCard: () => {},
    openCard: () => {},
    renderSlot: (() => null) as unknown as PageProps['renderSlot'],
    t,
    ...options.overrides ?? {},
  } as unknown as PageProps
  return { props: merged, writes, cardWrites, reads }
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

describe('WorkbenchPage', () => {
  it('opens on the first stored pipeline with its steps on the canvas', async () => {
    await renderPage()
    await waitFor(() => { expect(document.querySelectorAll('[data-step-index]').length).toBe(2) })
    // The canvas title is the one place that names the pipeline on screen.
    expect(document.querySelector('[data-canvas-title]')?.textContent).toBe('Release check')
    expect(document.querySelector('[data-insp-kicker]')?.textContent).toBe(en.pipeStepKicker
      .replace('{at}', '1').replace('{count}', '2').replace('{name}', 'Release check'))
    expect(screen.getAllByText('A card').length).toBeGreaterThan(0)
    expect(screen.getAllByText('B card').length).toBeGreaterThan(0)
    expect(document.querySelector('[data-canvas-meta]')?.textContent).toBe(
      en.pipeMetaNeverRan.replace('{count}', '2'),
    )
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

  it('states the skill and the instruction this step runs with', async () => {
    await renderPage()
    await screen.findByText(en.pipeAddStep)
    fireEvent.click(document.querySelector('[data-step-index="0"]') as HTMLElement)
    fireEvent.click(screen.getByText(en.pipeTabConfig))
    // The skill is named with its own one-line description, so the row says what it does
    // and not just which id it is.
    const panel = document.querySelector('[data-panel="config"]') as HTMLElement
    expect(panel.textContent).toContain('git-repo')
    expect(panel.textContent).toContain('Work with a repository')
    // 运行指令 is the instruction mode the card stores; a card that stores none says so.
    expect(screen.getByText(en.pipeCfgInstruction)).toBeTruthy()
    expect(screen.getByText(en.pipeCfgInstructionNone)).toBeTruthy()
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
    expect(starts[0]?.mode).toEqual({ kind: 'step', terminal: false, join: false, handoff: { pipelineId: 'pipeline-1', step: 0 } })
    expect(starts[0]?.sessionId).toBeUndefined()
    expect(starts[1]?.mode).toEqual({ kind: 'step', terminal: true, join: true, handoff: { pipelineId: 'pipeline-1', step: 1 } })
    expect(starts[1]?.sessionId).toBe('session-chain')
    expect(starts[0]?.outputSchema).toBeDefined()
    await waitFor(() => { expect(document.querySelector('[data-run-noise]')?.textContent).toBe(en.pipeAllDone.replace('{count}', '2')) })
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
    // A step run on its own is a chain of one: it opens the session and closes it.
    expect(starts[0]?.mode).toEqual({ kind: 'step', terminal: true, join: false, handoff: { pipelineId: 'pipeline-1', step: 0 } })
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
