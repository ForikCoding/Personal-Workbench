/**
 * Shadow-root host for one rendered card document.
 *
 * The host element sits in the ordinary tree, so the card keeps its place in the
 * grid, while the document renders inside a shadow root where its styles cannot
 * reach the rest of the application.
 *
 * Clicks arrive here rather than on the buttons themselves: the document is rebuilt on
 * every run, so a listener bound to a button would be gone the second time. The host
 * element outlives the content, which makes it the only stable place to listen.
 * @module dsh-workbench/client/skill-card/ShadowHtml
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { WORKBENCH_ACTION_ATTRIBUTE } from '../../skill-card-contract.ts'
import { readActionEvent, renderTemplate } from './render.ts'
import type { WorkbenchActionEvent } from './render.ts'

/** Props of the shadow-root host. */
export interface ShadowHtmlProps {
  /** The complete document to render. */
  readonly html: string
  /** Class applied to the host element. */
  readonly className?: string | undefined
  /**
   * Called when a button in the document carries an action.
   *
   * Omitted means the document is inert: every click inside it does nothing.
   * @param event - the action the click resolved to, or why it could not be read.
   */
  readonly onAction?: ((event: WorkbenchActionEvent) => void) | undefined
}

/**
 * Render one document inside a shadow root and observe its actions.
 * @param props - the document, the host class, and the action handler.
 * @returns the host element.
 */
export function ShadowHtml({ html, className, onAction }: ShadowHtmlProps): ReactNode {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (element === null) return
    const root = element.shadowRoot ?? element.attachShadow({ mode: 'open' })
    renderTemplate(root, html)
  }, [html])

  useEffect(() => {
    const element = host.current
    if (element === null || onAction === undefined) return
    const onClick = (event: MouseEvent): void => {
      // A click inside a shadow root is composed, so it reaches this listener; but the
      // event's target is retargeted to the host, so the real element is only available
      // through the path.
      const first = event.composedPath()[0]
      if (!(first instanceof Element)) return
      // Clicks land on a text node's element or on a child of the button, and `closest`
      // stops at the shadow boundary, so the card's own chrome is never picked up.
      const button = first.closest(`[${WORKBENCH_ACTION_ATTRIBUTE}]`)
      if (button === null) return
      onAction(readActionEvent(button))
    }
    element.addEventListener('click', onClick)
    return () => { element.removeEventListener('click', onClick) }
  }, [onAction])

  return <div ref={host} className={className} />
}
