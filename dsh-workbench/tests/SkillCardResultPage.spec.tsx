/**
 * @vitest-environment jsdom
 *
 * The result page as a page: the framed result and the run detail beneath it.
 *
 * The translator is the Chinese dictionary rather than a key echo, because what is under
 * test here is the sentence the user reads — a detail block whose rows exist only when
 * they carry something, and a frame that reads as a container without naming itself.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { fakeModelSeat } from './support/fake-model-seat.ts'
import { fakeWorkspacePicker } from './support/fake-workspace-picker.ts'
import { PRESENT_DIRECTORY, WORKSPACE_PATH } from './support/fake-skill-card-host.ts'
import { zh, en } from '../src/client/locales.ts'
import type { WorkbenchLocaleKey } from '../src/client/locales.ts'
import type { WorkbenchCardResult, WorkbenchDirectoryStat, WorkbenchRunCapabilities } from '../src/skill-card-contract.ts'
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
 * Built from local fields rather than an epoch so the formatted time in the run detail
 * is the same in whatever time zone the suite runs in.
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
    // that already exists, and the status line's start cases went with that line.
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
 * Wait for the stored configuration to be rendered.
 * @param container - the render container.
 * @returns the run detail element.
 */
async function detail(container: HTMLElement): Promise<HTMLDetailsElement> {
  await waitFor(() => { expect(container.querySelector('details')).not.toBeNull() })
  return container.querySelector('details') as HTMLDetailsElement
}

describe('the result page', () => {
  it('renders the region HTML with real newlines rather than JSON escapes', async () => {
    // Criterion 49. The value used to be printed as one JSON string, so every newline
    // arrived as a literal `\n` and the block could not be read as HTML at all.
    const html = '<tr>\n  <td>甲</td>\n  <td>乙</td>\n</tr>'
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result({ structured: { html } }) }) })} />,
    )
    await detail(container)
    const block = container.querySelector('pre[data-run-html]')
    expect(block).not.toBeNull()
    expect(block?.textContent).toBe(html)
    expect(block?.textContent).toContain('\n')
    expect(block?.textContent).not.toContain('\\n')
    // Every other field stayed JSON, and `html` is not in that JSON any more.
    expect(container.querySelector('pre:not([data-run-html])')).toBeNull()
  })

  it('keeps the remaining structured fields as JSON', async () => {
    const { container } = render(
      <SkillCardResultPage
        {...props({
          api: pageApi({
            result: result({ structured: { html: '<b>要点</b>\n<i>附注</i>', branch: 'main', count: 2 } }),
          }),
        })}
      />,
    )
    await detail(container)
    expect(container.querySelector('pre[data-run-html]')?.textContent).toBe('<b>要点</b>\n<i>附注</i>')
    const json = container.querySelector('pre:not([data-run-html])')?.textContent ?? ''
    expect(json).toBe(JSON.stringify({ branch: 'main', count: 2 }, null, 2))
    expect(json).not.toContain('"html"')
    expect(container.textContent).toContain(zh.runStructuredRest)
  })

  it('renders no row at all for a field that is absent', async () => {
    // Criterion 50. The block used to state a label plus "this run left no output
    // behind" even when there was nothing to show, which is a row that says nothing.
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result() }) })} />,
    )
    const block = await detail(container)
    // No diagnostic row, and no raw-output row either: this run left no output text.
    expect(container.textContent).not.toContain(zh.runDiagnostic)
    expect(container.textContent).not.toContain(zh.runRawOutput)
    // The only label inside the block is the structured one.
    expect([...block.querySelectorAll('p')].map(element => element.textContent)).toEqual([zh.runStructured])
    expect(block.querySelectorAll('pre')).toHaveLength(1)
  })

  it('names the detail block after everything in it, and leaves 原始输出 to its own row', async () => {
    // The summary used to read 原始输出 while the block also held the stop reason, the
    // start time and the structured value: one key, two meanings.
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result({ outputText: 'done' }) }) })} />,
    )
    const block = await detail(container)
    expect(block.querySelector('summary')?.textContent).toBe(zh.runDetailSummary)
    expect(zh.runDetailSummary).not.toBe(zh.runRawOutput)
    const labels = [...block.querySelectorAll('p')].map(element => element.textContent)
    expect(labels).toEqual([zh.runStructured, zh.runRawOutput])
  })

  it('names each stop reason, and prints one it does not know raw', async () => {
    // The upstream stop-reason union is merge-extensible: a value this build has no copy
    // for has to survive as it arrived rather than become an invented label.
    for (const [reason, word] of [
      ['completed', zh.runStopCompleted],
      ['error', zh.runStopError],
      ['aborted', zh.runStopAborted],
      ['max-steps', 'max-steps'],
    ] as const) {
      const { container, unmount } = render(
        <SkillCardResultPage {...props({ api: pageApi({ result: result({ stopReason: reason }) }) })} />,
      )
      const block = await detail(container)
      expect(block.querySelector('[data-run-stop-reason]')?.textContent).toBe(word)
      expect(block.querySelector('[data-run-stop-reason]')?.getAttribute('data-run-stop-reason')).toBe(reason)
      unmount()
    }
  })

  it('carries the stop reason into English as well', async () => {
    const english = (key: WorkbenchLocaleKey): string => en[key]
    const { container } = render(
      <SkillCardResultPage
        {...props({
          api: pageApi({ result: result({ stopReason: 'completed' }) }),
          t: english,
        })}
      />,
    )
    const block = await detail(container)
    expect(block.querySelector('summary')?.textContent).toBe(en.runDetailSummary)
    expect(block.querySelector('[data-run-stop-reason]')?.textContent).toBe(en.runStopCompleted)
  })

  it('keeps the activity trace inside 运行详情 after the run', async () => {
    // The stop reason answers why it ended; this answers what it did. Both are the record of
    // a run that is over, so the trace belongs in the same disclosure — collapsed, like the
    // raw output, and complete once opened.
    const { container } = render(
      <SkillCardResultPage
        {...props({
          api: pageApi({
            result: result({
              activity: [
                { kind: 'tool', tool: 'pwsh', argument: 'Probe one shell call' },
                { kind: 'tool', tool: 'read', argument: 'D:\\Git\\Personal-Workbench\\README.md' },
              ],
            }),
          }),
        })}
      />,
    )
    const block = await detail(container)
    // Inside the disclosure, not beside it.
    const list = block.querySelector('[data-run-activity]')
    expect(list).not.toBeNull()
    expect([...block.querySelectorAll('li')].map(row => row.getAttribute('data-activity-tool')))
      .toEqual(['pwsh', 'read'])
    expect(block.textContent).toContain(zh.runActivity)
    // And it is closed on arrival, like every other block in this record.
    expect(block.open).toBe(false)
  })

  it('draws no activity section for a run that recorded none', async () => {
    // Absence is a fact about the run, not an empty list to render: an empty 活动记录 would
    // say the child did nothing rather than that nothing was recorded.
    const { container } = render(<SkillCardResultPage {...props({ api: pageApi({ result: result() }) })} />)
    const block = await detail(container)
    expect(block.querySelector('[data-run-activity]')).toBeNull()
    expect(block.textContent).not.toContain(zh.runActivity)
  })

  it('names the model the run used, and says nothing when it inherited one', async () => {
    // Criterion 74. The row is the answer to "which model produced this": absent for a run
    // that inherited the session's route, because the Host was never told what that was and
    // printing a guess would be worse than printing nothing.
    const pinned = render(
      <SkillCardResultPage
        {...props({
          api: pageApi({ result: result({ model: { provider: 'vendor/gateway', model: 'large' } }) }),
        })}
      />,
    )
    const block = await detail(pinned.container)
    const row = block.querySelector('[data-run-model]')
    expect(row?.textContent).toBe('vendor/gateway / large')
    expect([...block.querySelectorAll('dt')].map(element => element.textContent)).toContain(zh.runModel)

    const inherited = render(<SkillCardResultPage {...props({ api: pageApi({ result: result() }) })} />)
    const plain = await detail(inherited.container)
    expect(plain.querySelector('[data-run-model]')).toBeNull()
    expect([...plain.querySelectorAll('dt')].map(element => element.textContent)).not.toContain(zh.runModel)
  })

  it('removes the template region’s indentation from the code block', async () => {
    // The model returns the region with the indentation the region had in the template,
    // so the block used to start several hundred pixels in on every line.
    const html = [
      '      <tr>',
      '        <td>甲</td>',
      '',
      '        <td>乙</td>',
      '      </tr>',
    ].join('\n')
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result({ structured: { html } }) }) })} />,
    )
    await detail(container)
    expect(container.querySelector('pre[data-run-html]')?.textContent).toBe([
      '<tr>',
      '  <td>甲</td>',
      '',
      '  <td>乙</td>',
      '</tr>',
    ].join('\n'))
  })

  it('leaves the stored HTML indented, because the splice needs it whole', async () => {
    // The dedent is a display projection: the stored value is spliced back into the
    // template verbatim, so the document the user sees must keep every space of it.
    const html = '      <tr>\n        <td>甲</td>\n      </tr>'
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result({ structured: { html } }) }) })} />,
    )
    await detail(container)
    expect(container.querySelector('pre[data-run-html]')?.textContent).toBe('<tr>\n  <td>甲</td>\n</tr>')
    // The rendered document is built from the stored value, not from the block's copy:
    // its text still starts eight spaces in, exactly as the result stored it. The shadow
    // root is filled from a passive effect, so this waits for the document itself rather
    // than for the block above it — under load the two are not always in the same tick.
    await waitFor(() => {
      const shown = [...container.querySelectorAll('div')]
        .map(element => element.shadowRoot?.textContent ?? '')
        .join('')
      expect(shown).toContain('\n        甲')
    })
  })

  it('states the raw output when there is one', async () => {
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result({ outputText: 'done' }) }) })} />,
    )
    const block = await detail(container)
    expect([...block.querySelectorAll('p')].map(element => element.textContent))
      .toEqual([zh.runStructured, zh.runRawOutput])
    expect(block.querySelectorAll('pre')[1]?.textContent).toBe('done')
  })

  it('is collapsed by default, because it is debug information', async () => {
    // Criterion 51. The result above is the content; this block is the record behind it.
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result() }) })} />,
    )
    const block = await detail(container)
    // No `open` in the markup, not just a closed property: the attribute is what a later
    // edit would add, and it is what this pins.
    expect(block.hasAttribute('open')).toBe(false)
    expect(block.open).toBe(false)
    fireEvent.click(block.querySelector('summary') as HTMLElement)
    expect(block.open).toBe(true)
  })

  it('frames the rendered result', async () => {
    // Criterion for the frame: the document is the user's template, so without a border
    // its content reads as the page's own. The frame is all that is left of this: the
    // surface's heading row was removed as noise, so the boundary rests on the border,
    // the radius and the padding around the document.
    const { container } = render(
      <SkillCardResultPage {...props({ api: pageApi({ result: result() }) })} />,
    )
    await detail(container)
    const surface = container.querySelector('[data-result-surface]') as HTMLElement | null
    expect(surface).not.toBeNull()
    // Nothing names the surface any more: no heading row, and no `aria-labelledby` left
    // pointing at an id that no longer exists.
    expect(surface?.querySelector('header')).toBeNull()
    expect(surface?.hasAttribute('aria-labelledby')).toBe(false)
    // The document is inside the frame, and its text is the run's own. The shadow root is
    // filled from a passive effect, so this waits for the document itself rather than for
    // the block above it — under load the two are not always in the same tick.
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
    // its result. Running is the one thing it cannot do, and the sentence beside the
    // disabled control says why.
    const { container } = render(
      <SkillCardResultPage
        {...props({
          api: pageApi({ result: result(), capabilities: { startActivation: false, start: false } }),
        })}
      />,
    )
    await detail(container)
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
    await detail(container)
    await waitFor(() => {
      expect(container.querySelector('[data-run-unavailable]')).toBeNull()
    })
    const run = [...container.querySelectorAll('button')]
      .find(button => button.textContent === zh.skillCardRun) as HTMLButtonElement | undefined
    expect(run?.disabled).toBe(false)
  })

  it('disables the run control when no workspace is chosen, and says so', async () => {
    // The card is otherwise completely ready: a skill, a template, a model, a live session.
    // The one missing fact is where the run would happen, and there is no default for it.
    const { container } = render(<SkillCardResultPage {...props({ api: pageApi({ result: result() }) })} />)
    await detail(container)
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
    await detail(container)
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
    await detail(container)
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
    await detail(container)
    const note = container.firstElementChild?.lastElementChild
    expect(note?.getAttribute('data-run-permission')).toBe('workspace-write')
    expect(note?.textContent).toBe(t('skillCardRunsWithPermission', { mode: zh.skillCardPermissionWorkspaceWrite }))
    // Not repeated inside the frame, where the document lives.
    expect(container.querySelector('[data-result-surface]')?.textContent)
      .not.toContain(zh.skillCardPermissionWorkspaceWrite)
  })
})
