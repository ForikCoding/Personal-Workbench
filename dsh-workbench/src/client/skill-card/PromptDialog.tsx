/**
 * A modal form, over the whole window, for the sentences a result is changed with.
 *
 * The product has no dialog primitive, so the one this page needs is here: a panel portalled
 * to `document.body` rather than rendered in place, because the page lives inside whatever
 * scroll container and stacking context the shell gave its slot, and a `position: fixed`
 * element inside a transformed ancestor is positioned against that ancestor instead of the
 * window.
 *
 * What a dialog owes the keyboard is not decoration: Escape closes it, Tab stays inside it,
 * opening it puts the caret where the writing goes, and closing it returns focus to the
 * control that opened it. The backdrop closes on a click, and only on the backdrop itself —
 * a mousedown that started inside the panel and ended on the overlay is a select-drag, not a
 * dismissal.
 * @module dsh-workbench/client/skill-card/PromptDialog
 */

import { Button, IconCloseOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives'
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import css from './skill-card.module.css'

/** What the dialog is made of: its copy, its two ways out, and the form between them. */
export interface PromptDialogProps {
  /** The panel's heading, which is also its accessible name. */
  readonly title: string
  /** One line under the heading, saying what submitting will do. */
  readonly hint?: string | undefined
  /** The label of the control that submits the form. */
  readonly submitLabel: string
  /** Whether that control is closed, for a form whose field is still empty. */
  readonly submitDisabled?: boolean | undefined
  /** The label of the control that dismisses the dialog. */
  readonly cancelLabel: string
  /** The accessible name of the corner close button. */
  readonly closeLabel: string
  /** A refusal stated inside the dialog, under its form. */
  readonly problem?: string | undefined
  /** Whether the dialog covers a form that cannot be submitted at all. */
  readonly busy?: boolean | undefined
  readonly onCancel: () => void
  readonly onSubmit: () => void
  /** The form: a field, and whatever else belongs beside it. */
  readonly children: ReactNode
}

/**
 * Render the dialog over the page.
 * @param props - the copy, the two ways out, and the form.
 * @returns the dialog, portalled to the document body.
 */
export function PromptDialog({
  title,
  hint,
  submitLabel,
  submitDisabled = false,
  cancelLabel,
  closeLabel,
  problem,
  busy = false,
  onCancel,
  onSubmit,
  children,
}: PromptDialogProps): ReactNode {
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
      onCancel()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => { document.removeEventListener('keydown', onKeyDown, true) }
  }, [onCancel])
  // Focus goes to the field and comes back to the control that opened the dialog, which is
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
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}
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
      >
        <div className={css.dialogHead}>
          <h2 className={css.dialogTitle} id={titleId}>{title}</h2>
          <button
            type="button"
            className={css.dialogClose}
            aria-label={closeLabel}
            onClick={onCancel}
          >
            <IconCloseOutlineMedium size={16} />
          </button>
        </div>
        {hint === undefined ? null : <p className={css.dialogHint} id={hintId}>{hint}</p>}
        {children}
        {problem === undefined
          ? null
          : <p className={css.dialogProblem} role="alert" data-prompt-problem="">{problem}</p>}
        <div className={css.dialogFoot}>
          <Button variant="ghost" size="md" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="primary" size="md" disabled={submitDisabled || busy} onClick={onSubmit}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
