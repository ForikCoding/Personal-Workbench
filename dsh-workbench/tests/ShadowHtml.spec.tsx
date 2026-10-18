/** @vitest-environment jsdom */
/**
 * Delegated clicks inside a card document.
 *
 * The document is rebuilt on every run, so the listener lives on the shadow host. That
 * makes two platform behaviours load-bearing: a click inside a shadow root must reach a
 * listener outside it, and the real element must be read from the event path because
 * `target` is retargeted to the host.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ShadowHtml } from '../src/client/skill-card/ShadowHtml.tsx'
import type { WorkbenchActionEvent } from '../src/client/skill-card/render.ts'

afterEach(cleanup)

/**
 * Render one document and hand back its host element and shadow root.
 * @param html - the document to render.
 * @param onAction - the action handler, when the case wants one.
 * @returns the host element and the shadow root.
 */
function mount(html: string, onAction?: (event: WorkbenchActionEvent) => void): {
  host: HTMLElement
  root: ShadowRoot
} {
  const { container } = render(<ShadowHtml html={html} onAction={onAction} />)
  const host = container.querySelector('div')
  if (host === null || host.shadowRoot === null) throw new Error('the host did not attach a shadow root')
  return { host, root: host.shadowRoot }
}

const DOCUMENT = [
  '<button id="action" data-dsh-action="finish" data-dsh-row=\'{"task_status":1}\'>',
  '<span id="inner">▶ 完成</span>',
  '</button>',
  '<p id="plain">plain</p>',
].join('')

describe('workbench card shadow host', () => {
  it('reports an action clicked inside the shadow root', () => {
    const seen: WorkbenchActionEvent[] = []
    const { root } = mount(DOCUMENT, event => { seen.push(event) })
    root.querySelector<HTMLElement>('#action')?.click()
    expect(seen).toEqual([{ kind: 'action', key: 'finish', payload: { task_status: 1 } }])
  })

  it('resolves a click that lands on the button’s content', () => {
    // Clicks usually land on the text or an inner element, never on the button itself.
    const seen: WorkbenchActionEvent[] = []
    const { root } = mount(DOCUMENT, event => { seen.push(event) })
    root.querySelector<HTMLElement>('#inner')?.click()
    expect(seen).toHaveLength(1)
    expect(seen[0]?.kind === 'action' ? seen[0].key : undefined).toBe('finish')
  })

  it('ignores a click on anything else', () => {
    const onAction = vi.fn()
    const { root } = mount(DOCUMENT, onAction)
    root.querySelector<HTMLElement>('#plain')?.click()
    expect(onAction).not.toHaveBeenCalled()
  })

  it('is inert when no handler is supplied', () => {
    // A document without a handler must not interact at all.
    const { root } = mount(DOCUMENT)
    expect(() => { root.querySelector<HTMLElement>('#action')?.click() }).not.toThrow()
  })

  it('still works after the document is replaced', () => {
    // This is why the listener is on the host: binding per button would be lost the
    // first time a run rebuilt the region.
    const seen: WorkbenchActionEvent[] = []
    const handler = (event: WorkbenchActionEvent): void => { seen.push(event) }
    const first = render(<ShadowHtml html={DOCUMENT} onAction={handler} />)
    const host = first.container.querySelector('div')
    if (host === null || host.shadowRoot === null) throw new Error('no shadow root')
    first.rerender(
      <ShadowHtml
        html={'<button id="second" data-dsh-action="start" data-dsh-row=\'{"a":1}\'>go</button>'}
        onAction={handler}
      />,
    )
    host.shadowRoot.querySelector<HTMLElement>('#second')?.click()
    expect(seen).toEqual([{ kind: 'action', key: 'start', payload: { a: 1 } }])
  })

  it('reports a payload that cannot be read instead of guessing', () => {
    // The reader refuses a broken payload; the host passes that refusal along rather
    // than dropping the click silently.
    const seen: WorkbenchActionEvent[] = []
    const { root } = mount('<button id="bad" data-dsh-action="finish" data-dsh-row=\'not json\'>go</button>',
      event => { seen.push(event) })
    root.querySelector<HTMLElement>('#bad')?.click()
    expect(seen).toEqual([{ kind: 'invalid', reason: 'malformed-payload' }])
  })
})
