/**
 * @vitest-environment jsdom
 *
 * The result page as a page: the framed result and the run's trace beneath it.
 *
 * The translator is the Chinese dictionary rather than a key echo, because what is under
 * test here is the sentence the user reads — a trace that exists only when the run recorded
 * something, and a frame that reads as a container without naming itself.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { fakeModelSeat } from './support/fake-model-seat.ts'
import { fakeWorkspacePicker } from './support/fake-workspace-picker.ts'
import { PRESENT_DIRECTORY, WORKSPACE_PATH } from './support/fake-skill-card-host.ts'
import { zh } from '../src/client/locales.ts'
import type { WorkbenchLocaleKey } from '../src/client/locales.ts'
import type {
  WorkbenchCardResult,
  WorkbenchDirectoryStat,
  WorkbenchRunCapabilities,
  WorkbenchRunState,
} from '../src/skill-card-contract.ts'
import type { WorkbenchSkillCardApi } from '../src/client/skill-card/api.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

const { SkillCardResultPage } = await import('../src/client/skill-card/SkillCardPages.tsx')
type PageProps = import('../src/client/skill-card/SkillCardPages.tsx').SkillCardPageProps

// Vitest runs without globals, so the library's own auto-cleanup never registers.
afterEach(cleanup)

/**
 * Translate through the Chinese dictionary, interpolating placeholders.
 * @param key - dictionary key.
 * @param params - placeholder values.
 * @returns the sentence the user reads.
 */
const t = (key: WorkbenchLocaleKey, params?: Record<string, unknown>): string =>
  Object.entries(params ?? {}).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    zh[key],
  )

/** A template whose region is the only part a run fills. */
const TEMPLATE = '<h1>任务</h1><!-- template-begin --><!-- template-end -->'

/**
 * A local wall-clock moment.
 *
 * Built from local fields rather than an epoch so the formatted time is the same in
 * whatever time zone the suite runs in.
 */
const STARTED_AT = new Date(2024, 0, 2, 14, 28, 36).getTime()

/** How long the scripted run took. */
const TOOK_MS = 42_000

/**
 * Build one stored result.
 * @param overrides - fields the case varies.
 * @returns the result record as storage returns it.
 */
function result(overrides: Partial<WorkbenchCardResult> = {}): WorkbenchCardResult {
  return {
    cardId: 'skill-card',
    skill: 'git-repo',
    executedAt: STARTED_AT + TOOK_MS,
    stopReason: 'completed',
    structured: { html: '<b>要点</b>' },
    ...overrides,
  }
}

/**
 * Build a transport for one card that is configured and ready to run.
 * @param options - the stored result, what the Host recorded about running, and the
 * workspace the card was given.
 * @returns the api.
 */
function pageApi(options: {
  result?: WorkbenchCardResult
  capabilities?: WorkbenchRunCapabilities
  /** The card's stored workspace; absent models a card created before the field existed. */
  workspace?: { readonly path: string }
  /** What the directory check answers; defaults to "a directory is there". */
  directory?: WorkbenchDirectoryStat
} = {}): WorkbenchSkillCardApi {
  const workspace = options.workspace === undefined ? undefined : options.workspace
  return {
    read: async () => ({
      status: 'ok',
      snapshot: {
        revision: '1:0',
        cards: [{
          cardId: 'skill-card',
          skill: 'git-repo',
          template: TEMPLATE,
          templateSkills: ['git-repo'],
          ...workspace === undefined ? {} : { workspace },
        }],
        results: options.result === undefined ? [] : [options.result],
        // Absent is the pre-field Host, which this page treats as able to run.
        ...options.capabilities === undefined ? {} : { capabilities: options.capabilities },
      },
    }),
    write: async () => ({ status: 'failed', reason: 'no write is issued here' }),
    catalog: async () => ({ status: 'ok', entries: [] }),
    // The mount-time adoption read: nothing is in flight for another card's button.
    poll: async () => ({ status: 'missing' }),
    // Nothing here starts a run: this page is under test for what it shows of a result
    // that already exists.
    start: async () => ({ status: 'unavailable', reason: 'no run is started here' }),
    cancel: async () => {},
    saveResult: async () => ({ status: 'unavailable', reason: 'no edit is stored here' }),
    statDirectory: async () => ({ status: 'ok', stat: options.directory ?? PRESENT_DIRECTORY }),
  }
}

/**
 * Build page props.
 * @param overrides - fields the case varies.
 * @returns complete props.
 */
function props(overrides: Partial<PageProps> = {}): PageProps {
  return {
    api: pageApi(),
    cardId: 'skill-card',
    runSessionId: () => 'session-1',
    models: fakeModelSeat(),
    workspacePicker: fakeWorkspacePicker().picker,
    fallbackTitle: '技能卡',
    onBack: () => {},
    openCard: () => {},
    t,
    ...overrides,
  }
}

/**
 * Wait for the stored card to be applied.
 *
 * The page shell renders before its read lands, so waiting on the shell alone would assert
 * against the pre-load view. The skill subtitle is the first thing the snapshot supplies.
 * @param container - the render container.
 * @returns resolution once the card's own facts are on screen.
 */
async function loaded(container: HTMLElement): Promise<void> {
  await waitFor(() => { expect(container.textContent).toContain('git-repo') })
}

describe('the result page', () => {
  it('shows the run’s trace beneath the result, with the model’s words and the calls', async () => {
    // The card's output after a run is what the run did: the trace, visible rather than
    // filed away in a disclosure. The technical record that used to sit beside it — stop
    // reason, model, start time, structured value, raw output — is gone.
    const { container } = render(
      <SkillCardResultPage
        {...props({
          api: pageApi({
            result: result({
              activity: [
                { kind: 'reasoning', text: '先查列表。' },
                { kind: 'tool', tool: 'pwsh', argument: 'Probe one shell call' },
                { kind: 'tool', tool: 'read', argument: 'D:\\Git\\Personal-Workbench\\README.md' },
              ],
            }),
          }),
        })}
      />,
    )
    await loaded(container)
    const section = container.querySelector('[data-run-trace]')
    expect(section).not.toBeNull()
    // On the page itself, not behind a collapsed disclosure; the turn header opens it.
    expect(section?.closest('details')).toBeNull()
    expect(section?.textContent).toContain(zh.runActivityCompleted)
    expect(section?.textContent).toContain('先查列表。')
    expect([...container.querySelectorAll('[data-run-trace] [data-activity-kind]')]
      .map(row => row.getAttribute('data-activity-tool')))
      .toEqual([null, 'pwsh', 'read'])
  })

  it('draws no trace section for a run that recorded none', async () => {
    // Absence is a fact about the run, not an empty list to render: an empty
    // activity trace would say the child did nothing rather than that nothing was recorded.
    const { container } = render(<SkillCardResultPage {...props({ api: pageApi({ result: result() }) })} />)
    await loaded(container)
    expect(container.querySelector('[data-run-trace]')).toBeNull()
    expect(container.textContent).not.toContain(zh.runActivityCompleted)
  })

  it('no longer draws the technical record the product owner removed', async () => {
    // The block that used to hold 结束原因 / 模型 / 开始时间 / 结构化结果 / 原始输出 / 诊断
    // is deleted outright: no disclosure, and none of its rows anywhere on the page.
    const { container } = render(
      <SkillCardResultPage
        {...props({
          api: pageApi({
            result: result({ model: { provider: 'vendor/gateway', model: 'large' }, outputText: 'done' }),
          }),
        })}
      />,
    )
    await loaded(container)
    expect(container.querySelector('details')).toBeNull()
    expect(container.querySelector('[data-run-detail]')).toBeNull()
    expect(container.querySelector('[data-run-stop-reason]')).toBeNull()
    expect(container.querySelector('[data-run-model]')).toBeNull()
    expect(container.querySelector('pre')).toBeNull()
    for (const word of ['结束原因', '运行详情', '结构化结果', '原始输出', '诊断', '开始于']) {
      expect(container.textContent).not.toContain(word)
    }
  })

  it('leaves the stored HTML indented, because the splice needs it whole', async () => {
    // The rendered document is built from the stored value, not from any display copy: its
    // text still starts eight spaces in, exactly as the result stored it.
    const html = '      <tr>\n        <td>甲</td>\n      </tr>'
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result({ structured: { html } }) }) })} />,
    )
    await loaded(container)
    await waitFor(() => {
      const shown = [...container.querySelectorAll('div')]
        .map(element => element.shadowRoot?.textContent ?? '')
        .join('')
      expect(shown).toContain('\n        甲')
    })
  })

  it('frames the rendered result', async () => {
    // The document is the user's template, so without a border its content reads as the
    // page's own. The frame is all that is left of this: the surface's heading row was
    // removed as noise, so the boundary rests on the border, the radius and the padding.
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result() }) })} />,
    )
    await loaded(container)
    const surface = container.querySelector('[data-result-surface]') as HTMLElement | null
    expect(surface).not.toBeNull()
    expect(surface?.querySelector('header')).toBeNull()
    expect(surface?.hasAttribute('aria-labelledby')).toBe(false)
    await waitFor(() => {
      const rendered = [...(surface?.querySelectorAll('div') ?? [])]
        .map(element => element.shadowRoot?.textContent ?? '')
        .join('')
      expect(rendered).toContain('要点')
    })
  })

  it('keeps the card readable and disables only the run control without any run seam', async () => {
    // A harness that offers neither startActivation (0.2.1-alpha.2) nor the one-shot
    // start (0.2.0-rc.2) still loads the workbench and shows the card, its template and
    // its result. Running is the one thing it cannot do, and the sentence says why.
    const { container } = render(
      <SkillCardResultPage
        {...props({
          api: pageApi({ result: result(), capabilities: { startActivation: false, start: false } }),
        })}
      />,
    )
    await loaded(container)
    const notice = await waitFor(() => {
      const element = container.querySelector('[data-run-unavailable]')
      expect(element).not.toBeNull()
      return element as HTMLElement
    })
    expect(notice.textContent).toBe(zh.skillCardProblemRunUnavailable)
    // The copy names both members and where each exists, not just that something failed.
    expect(notice.textContent).toContain('startActivation')
    expect(notice.textContent).toContain('start')
    expect(notice.textContent).toContain('0.2.1-alpha.2')
    expect(notice.textContent).toContain('0.2.0-rc.2')

    const run = [...container.querySelectorAll('button')]
      .find(button => button.textContent === zh.skillCardRun) as HTMLButtonElement | undefined
    expect(run?.disabled).toBe(true)

    // Nothing else closed: the stored result is still rendered, and editing it by hand is
    // still offered. Only running is unavailable.
    expect(container.querySelector('[data-result-surface]')).not.toBeNull()
    expect(container.querySelector('[data-result-edit-start]')).not.toBeNull()
  })

  it('keeps the run control available on the older channel one-shot seam', async () => {
    // 0.2.0-rc.2 — the stable channel — has start and no startActivation. Measured on a
    // real host composition: that seam runs a card. The control must not disable there.
    const { container } = render(
      <SkillCardResultPage
        {...props({
          api: pageApi({
            result: result(),
            workspace: { path: WORKSPACE_PATH },
            capabilities: { startActivation: false, start: true },
          }),
        })}
      />,
    )
    await loaded(container)
    await waitFor(() => {
      expect(container.querySelector('[data-run-unavailable]')).toBeNull()
      const run = [...container.querySelectorAll('button')]
        .find(button => button.textContent === zh.skillCardRun) as HTMLButtonElement | undefined
      expect(run?.disabled).toBe(false)
    })
  })

  it('disables the run control when no workspace is chosen, and says so', async () => {
    // The card is otherwise completely ready: a skill, a template, a model, a live session.
    // The one missing fact is where the run would happen, and there is no default for it.
    const { container } = render(<SkillCardResultPage {...props({ api: pageApi({ result: result() }) })} />)
    await loaded(container)
    const notice = await waitFor(() => {
      const element = container.querySelector('[data-run-workspace-missing]')
      expect(element).not.toBeNull()
      return element as HTMLElement
    })
    expect(notice.textContent).toBe(zh.skillCardProblemWorkspaceMissing)
    const run = [...container.querySelectorAll('button')]
      .find(button => button.textContent === zh.skillCardRun) as HTMLButtonElement | undefined
    expect(run?.disabled).toBe(true)
  })

  it('disables the run control when the stored directory is gone, naming the path', async () => {
    // The path is part of the message: "that directory is gone" is only actionable when it
    // says which one, and the user needs to know which folder to restore or replace.
    const { container } = render(
      <SkillCardResultPage
        {...props({
          api: pageApi({
            result: result(),
            workspace: { path: 'D:\\Git\\Gone' },
            directory: { exists: false, isDirectory: false, writable: false },
          }),
        })}
      />,
    )
    await loaded(container)
    const notice = await waitFor(() => {
      const element = container.querySelector('[data-run-workspace-invalid]')
      expect(element).not.toBeNull()
      return element as HTMLElement
    })
    expect(notice.textContent).toContain(zh.skillCardProblemWorkspaceInvalid)
    expect(notice.textContent).toContain('D:\\Git\\Gone')
    const run = [...container.querySelectorAll('button')]
      .find(button => button.textContent === zh.skillCardRun) as HTMLButtonElement | undefined
    expect(run?.disabled).toBe(true)
  })

  it('enables the run control once the directory is confirmed', async () => {
    // The third state, and the only one where a run may start. Without this case "disabled"
    // could be a page that never enables anything.
    const { container } = render(
      <SkillCardResultPage
        {...props({ api: pageApi({ result: result(), workspace: { path: WORKSPACE_PATH } }) })}
      />,
    )
    await loaded(container)
    await waitFor(() => {
      const run = [...container.querySelectorAll('button')]
        .find(button => button.textContent === zh.skillCardRun) as HTMLButtonElement | undefined
      expect(run?.disabled).toBe(false)
    })
    expect(container.querySelector('[data-run-workspace-missing]')).toBeNull()
    expect(container.querySelector('[data-run-workspace-invalid]')).toBeNull()
  })

  it('states the permission mode the card runs under, as the last line of the page', async () => {
    // The mode is a safety fact about the run, so it is a footnote beneath everything rather
    // than part of the document. A card that stores none runs under the default, which is
    // what this case pins: the line states the mode that will be applied, not that none is
    // set.
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result() }) })} />,
    )
    await loaded(container)
    const note = container.firstElementChild?.lastElementChild
    expect(note?.getAttribute('data-run-permission')).toBe('workspace-write')
    expect(note?.textContent).toBe(t('skillCardRunsWithPermission', { mode: zh.skillCardPermissionWorkspaceWrite }))
    // Not repeated inside the frame, where the document lives.
    expect(container.querySelector('[data-result-surface]')?.textContent)
      .not.toContain(zh.skillCardPermissionWorkspaceWrite)
  })

  it('clears the settled record and the dialog while a run holds the card', async () => {
    // A run in flight owns the page. The previous run's record is not its subject: its
    // 「已完成」 header would label a finished run under a live one. The revision dialog is
    // the same: it has nothing to send while a run is going, and nothing of it — field or
    // stop control — stands under the stream. Stopping is the head's run button, reading
    // 「取消」 while a run holds the card.
    const running: WorkbenchRunState = {
      cardId: 'skill-card',
      phase: 'running',
      startedAt: STARTED_AT,
      retried: false,
      activity: [{ kind: 'tool', tool: 'read', argument: 'a.ts' }],
    }
    const api: WorkbenchSkillCardApi = {
      ...pageApi({ result: result({ activity: [{ kind: 'reasoning', text: '旧的思考。' }] }) }),
      // The mount-time adoption read reports the run already in flight for this card.
      poll: async () => ({ status: 'ok', state: running }),
    }
    const { container } = render(<SkillCardResultPage {...props({ api })} />)
    await waitFor(() => {
      expect(container.querySelector('[data-result-busy="true"]')).not.toBeNull()
    })
    // The live stream of this run, and nothing of the settled one.
    expect(container.textContent).toContain(zh.runStatusRunning)
    expect(container.querySelector('[data-run-trace]')).toBeNull()
    expect(container.textContent).not.toContain(zh.runActivityCompleted)
    expect(container.textContent).not.toContain('旧的思考。')
    // The dialog is gone entirely — no field, no lone stop control. The head's run button
    // is the stop: it reads null while the card runs, so the stop stays reachable.
    expect(container.querySelector('[data-refine-composer]')).toBeNull()
    expect(container.querySelector('[data-run-stop-row]')).toBeNull()
    expect(screen.queryByRole('button', { name: zh.refineStop })).toBeNull()
    expect(screen.getByRole('button', { name: zh.skillCardCancel })).toBeTruthy()
  })
})
