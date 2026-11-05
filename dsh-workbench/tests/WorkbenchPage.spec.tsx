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
const { en } = await import('../src/client/locales.ts')
type LocaleKey = import('../src/client/locales.ts').WorkbenchLocaleKey

afterEach(cleanup)

/** Translate an English dictionary value with its template parameters. */
const t = (key: LocaleKey, params?: Record<string, unknown>): string =>
  Object.entries(params ?? {}).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    en[key],
  )

/** The two cards every case can arrange. */
const CARDS = [{ id: 'a-card', order: 100, label: 'A card' }, { id: 'b-card', order: 200, label: 'B card' }]

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
  overrides?: Partial<PageProps>
} = {}): { props: PageProps; writes: WorkbenchPipelinePatch[]; reads: number[] } {
  let snapshot: WorkbenchPipelineSnapshot = {
    apiVersion: 1,
    revision: '1:0',
    pipelines: options.pipelines ?? [pipeline()],
  }
  const writes: WorkbenchPipelinePatch[] = []
  const reads: number[] = []
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
        read: async () => ({ status: 'unavailable' as const, reason: 'not used by these cases' }),
        write: async () => ({ status: 'failed' as const, reason: 'not used by these cases' }),
        catalog: async () => ({ status: 'ok' as const, entries: [] }),
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
  return { props: merged, writes, reads }
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
    // The name is on the rail row and as the canvas title; the canvas is the one that says
    // which pipeline the steps below belong to.
    expect(screen.getAllByText('Release check').length).toBe(2)
    expect(document.querySelector('h2')?.textContent).toBe('Release check')
    expect(screen.getAllByText(en.pipeStepCount.replace('{count}', '2')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('A card').length).toBeGreaterThan(0)
    expect(screen.getAllByText('B card').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('[data-step-index]').length).toBe(2)
  })

  it('lists the stored cards under the single-task heading', async () => {
    await renderPage()
    expect(screen.getByText(en.pipeTasks)).toBeDefined()
    // Both cards are steps of the pipeline and are also listed as single tasks.
    expect(screen.getAllByText('A card').length).toBeGreaterThan(1)
  })

  it('opens onto the creation offer when nothing is stored', async () => {
    await renderPage({ pipelines: [] })
    expect((await screen.findAllByText(en.pipeEmptyTitle)).length).toBeGreaterThan(0)
    expect(screen.getByText(en.pipeEmptyBody)).toBeDefined()
  })

  it('creates a pipeline with no steps and selects it', async () => {
    const { writes } = await renderPage()
    fireEvent.click(screen.getByText(`＋ ${en.pipeNew}`))
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines.map(entry => entry.id)).toEqual(['pipeline-1', 'pipeline-2'])
    const created = writes[0]?.pipelines.find(entry => entry.id === 'pipeline-2')
    expect(created?.steps).toEqual([])
    // The new pipeline is the one on screen: its empty-step hint is up.
    expect(await screen.findByText(en.pipeNoSteps)).toBeDefined()
  })

  it('adds a step by picking a card', async () => {
    const { writes } = await renderPage({ pipelines: [pipeline({ steps: [{ cardId: 'a-card' }] })] })
    fireEvent.click(await screen.findByText(`＋ ${en.pipeNewStep}`))
    fireEvent.click(document.querySelector('[data-pick-card="b-card"]') as HTMLElement)
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines[0]?.steps).toEqual([{ cardId: 'a-card' }, { cardId: 'b-card' }])
  })

  it('refuses a step that is already in the pipeline', async () => {
    const { writes } = await renderPage()
    fireEvent.click(await screen.findByText(`＋ ${en.pipeNewStep}`))
    // The picker lists both cards; picking one that is already a step changes nothing.
    const rows = screen.getAllByRole('button').filter(node => node.textContent === 'A card')
    fireEvent.click(rows[rows.length - 1] as HTMLElement)
    await waitFor(() => { expect(screen.getByText(en.pipeDuplicateStep)).toBeDefined() })
    expect(writes).toHaveLength(0)
  })

  it('moves a step later and keeps the focus on it', async () => {
    const { writes } = await renderPage()
    await screen.findAllByText('A card')
    fireEvent.click(document.querySelector('[data-step-index="0"] button') as HTMLElement)
    fireEvent.click(screen.getByLabelText(en.pipeStepDown))
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines[0]?.steps).toEqual([{ cardId: 'b-card' }, { cardId: 'a-card' }])
  })

  it('removes a step from the pipeline', async () => {
    const { writes } = await renderPage()
    await screen.findAllByText('A card')
    fireEvent.click(document.querySelector('[data-step-index="0"] button') as HTMLElement)
    fireEvent.click(document.querySelector('[data-step-index="0"] [aria-label="Remove from pipeline"]') as HTMLElement)
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines[0]?.steps).toEqual([{ cardId: 'b-card' }])
  })

  it('renames a pipeline from its row menu', async () => {
    const { writes } = await renderPage()
    fireEvent.click(await screen.findByLabelText(en.pipeRename))
    fireEvent.click(screen.getAllByRole('menuitem')[0] as HTMLElement)
    const field = screen.getByLabelText(en.pipeRename) as HTMLInputElement
    fireEvent.change(field, { target: { value: 'Nightly' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines[0]?.name).toBe('Nightly')
  })

  it('keeps a blank rename out of storage', async () => {
    const { writes } = await renderPage()
    fireEvent.click(await screen.findByLabelText(en.pipeRename))
    fireEvent.click(screen.getAllByRole('menuitem')[0] as HTMLElement)
    const field = screen.getByLabelText(en.pipeRename) as HTMLInputElement
    fireEvent.change(field, { target: { value: '   ' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    // Nothing to write: the stored name stays, and no request is made for the blank one.
    await waitFor(() => { expect(screen.queryByRole('textbox')).toBeNull() })
    expect(writes).toHaveLength(0)
  })

  it('deletes a pipeline only once the deletion is confirmed', async () => {
    const { writes } = await renderPage()
    fireEvent.click(await screen.findByLabelText(en.pipeRename))
    fireEvent.click(screen.getAllByRole('menuitem')[1] as HTMLElement)
    // The first click arms the row; nothing is written yet.
    expect(writes).toHaveLength(0)
    fireEvent.click(screen.getByText(en.pipeDeleteConfirm))
    await waitFor(() => { expect(writes).toHaveLength(1) })
    expect(writes[0]?.pipelines).toEqual([])
  })

  it('offers no run control for a pipeline with no steps', async () => {
    await renderPage({ pipelines: [pipeline({ steps: [] })] })
    const run = await screen.findByText(en.pipeRunAll)
    expect((run as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows the inspector hint until something is focused', async () => {
    await renderPage()
    expect(await screen.findByText(en.pipeNoFocusTitle)).toBeDefined()
    fireEvent.click(document.querySelector('[data-step-index="0"] button') as HTMLElement)
    await waitFor(() => { expect(screen.queryByText(en.pipeNoFocusTitle)).toBeNull() })
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
    const { } = await renderPage({
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
    // Both steps ask for the card contract, which is what a step produces.
    expect(starts[0]?.outputSchema).toBeDefined()
    expect(await screen.findByText(en.pipeSettled.replace('{count}', '2'))).toBeDefined()
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
    await screen.findAllByText(en.pipeRunAll)
    fireEvent.click(document.querySelector('[data-run-step="0"]') as HTMLElement)
    await waitFor(() => { expect(starts).toHaveLength(1) })
    // A step run on its own is a chain of one: it opens its session and closes it.
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
          state: {
            cardId: 'a-card',
            phase: 'settled',
            retried: false,
            failure: 'the child gave up',
          } as WorkbenchRunState,
        }),
      },
    })
    fireEvent.click(await screen.findByText(en.pipeRunAll))
    await waitFor(() => {
      expect(screen.getByText(en.pipeFailedAt.replace('{index}', '1').replace('{reason}', 'the child gave up'))).toBeDefined()
    })
    // The second step never started: a failed step produced nothing to continue from.
    expect(starts).toHaveLength(1)
  })

  it('renders a card opened from outside as its own full-panel view', async () => {
    const { props: built } = props({
      overrides: {
        useSelection: ((selector: (snapshot: { cardId: string; view: 'config' }) => unknown) => selector({
          cardId: 'a-card',
          view: 'config',
        })) as unknown as PageProps['useSelection'],
      },
    })
    render(<WorkbenchPage {...built} />)
    // The workbench surface stands behind the opened card, not beside it.
    await waitFor(() => { expect(screen.queryByText(en.pipeRail)).toBeNull() })
  })
})
