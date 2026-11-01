/**
 * The product has no dialog primitive, so the one this plugin needs is here: a panel
 * portalled to `document.body` rather than rendered in place, because a page lives inside
 * whatever scroll container and stacking context the shell gave its slot, and a
 * `position: fixed` element inside a transformed ancestor is positioned against that
 * ancestor instead of the window.
 *
 * What a dialog owes the keyboard is not decoration: Escape closes it, Tab stays inside it,
 * opening it moves focus in, and closing it returns focus to the control that opened it. The
 * backdrop closes on a click, and only on the backdrop itself — a mousedown that started
 * inside the panel and ended on the overlay is a select-drag, not a dismissal.
 *
 * Two panels are built on it: the form that writes a sentence (`PromptDialog`) and the
 * preview that shows a card's template (`TemplatePreviewDialog`). They differ in width and
 * in what sits under the body, so the shell keeps only what the keyboard contract needs.
 * @module dsh-workbench/client/skill-card/Dialog
 */

import { IconCloseOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives'
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import css from './skill-card.module.css'

/** How wide the panel is: a form fits in a column, a document needs the window. */
export type DialogSize = 'form' | 'wide'

/** What the shell is made of: its copy, its one way out, and the body between them. */
export interface DialogProps {
  /** The panel's heading, which is also its accessible name. */
  readonly title: string
  /** One line under the heading, saying what the panel is showing. */
  readonly hint?: string | undefined
  /** The accessible name of the corner close button. */
  readonly closeLabel: string
  /** Which width the panel takes. Defaults to a form's column. */
  readonly size?: DialogSize | undefined
  /** Whether the panel covers work that cannot be submitted at all. */
  readonly busy?: boolean | undefined
  /** The controls along the bottom, when the panel has any. */
  readonly footer?: ReactNode
  /** Dismiss the dialog; also what Escape and the backdrop do. */
  readonly onClose: () => void
  /** The body: a form, or a document. */
  readonly children: ReactNode
}

/**
 * Render the dialog over the page.
 * @param props - the copy, the size, the way out, and the body.
 * @returns the dialog, portalled to the document body.
 */
export function Dialog({
  title,
  hint,
  closeLabel,
  size = 'form',
  busy = false,
  footer,
  onClose,
  children,
}: DialogProps): ReactNode {
  const titleId = useId()
  const hintId = useId()
  const panel = useRef<HTMLDivElement>(null)
  // Escape is listened for on the document rather than the panel: a click on the backdrop
  // moves focus to the body, and the dialog must still close. Capture, so a page-level
  // handler that stops the key does not leave the dialog open over it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => { document.removeEventListener('keydown', onKeyDown, true) }
  }, [onClose])
  // Focus goes to the body and comes back to the control that opened the dialog, which is
  // what makes the whole thing usable without a pointer.
  useLayoutEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const field = panel.current?.querySelector<HTMLElement>('[data-prompt-focus]') ?? panel.current
    field?.focus()
    return () => { opener?.focus() }
  }, [])
  const trapTab = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Tab') return
    const root = panel.current
    if (root === null) return
    const focusable = [...root.querySelectorAll<HTMLElement>('button, textarea, input, [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.hasAttribute('disabled') && element.tabIndex >= 0)
    if (focusable.length === 0) return
    const first = focusable[0] as HTMLElement
    const last = focusable[focusable.length - 1] as HTMLElement
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
      return
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      className={css.dialogOverlay}
      data-prompt-dialog=""
      onKeyDown={trapTab}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <div
        ref={panel}
        className={css.dialogPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hint === undefined ? undefined : hintId}
        tabIndex={-1}
        data-prompt-panel={busy ? 'busy' : ''}
        data-dialog-size={size}
      >
        <div className={css.dialogHead}>
          <h2 className={css.dialogTitle} id={titleId}>{title}</h2>
          <button
            type="button"
            className={css.dialogClose}
            aria-label={closeLabel}
            onClick={onClose}
          >
            <IconCloseOutlineMedium size={16} />
          </button>
        </div>
        {hint === undefined ? null : <p className={css.dialogHint} id={hintId}>{hint}</p>}
        {children}
        {footer === undefined ? null : <div className={css.dialogFoot}>{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
