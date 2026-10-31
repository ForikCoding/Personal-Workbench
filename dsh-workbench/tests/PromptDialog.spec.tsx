/**
 * @vitest-environment jsdom
 *
 * The dialog the result page writes its two sentences in.
 *
 * The product ships no dialog primitive, so this one carries the whole keyboard contract
 * itself: Escape closes, Tab stays inside, the caret starts in the field, focus comes back to
 * the control that opened it, and the backdrop dismisses on a press that started on it. None
 * of that is visible in a screenshot, which is why it is tested here rather than by eye.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { primitivesMock } from './support/primitives-mock.tsx'
import { PromptDialog } from '../src/client/skill-card/PromptDialog.tsx'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => primitivesMock())

// Vitest runs without globals, so the library's own auto-cleanup never registers.
afterEach(cleanup)

/** The props one dialog is rendered with, all of which the cases vary. */
function dialogProps(overrides: Partial<Parameters<typeof PromptDialog>[0]> = {}) {
  return {
    title: '在上一版上改',
    hint: '只改这一份结果，源文件不动。',
    submitLabel: '重新生成',
    cancelLabel: '取消',
    closeLabel: '关闭',
    onCancel: () => {},
    onSubmit: () => {},
    children: <textarea data-prompt-focus="" aria-label="改什么" />,
    ...overrides,
  }
}

/**
 * The overlay the panel is drawn on.
 * @returns the overlay element.
 */
function overlay(): HTMLElement {
  const element = document.querySelector('[data-prompt-dialog]')
  if (!(element instanceof HTMLElement)) throw new Error('the dialog is not on the page')
  return element
}

/**
 * The panel itself.
 * @returns the panel element.
 */
function panel(): HTMLElement {
  return screen.getByRole('dialog')
}

describe('the prompt dialog', () => {
  it('is a modal named by its heading and described by its hint', () => {
    render(<PromptDialog {...dialogProps()} />)
    const modal = panel()
    expect(modal.getAttribute('aria-modal')).toBe('true')
    // The heading is the accessible name, so a screen reader announces what was opened
    // rather than "dialog".
    expect(modal.getAttribute('aria-labelledby')).toBe(modal.querySelector('h2')?.id)
    expect(modal.getAttribute('aria-describedby')).toBe(modal.querySelector('p')?.id)
    expect(modal.querySelector('h2')?.textContent).toBe('在上一版上改')
    // Portalled out of the render container: it is the document body's child, which is what
    // keeps `position: fixed` anchored to the window inside the shell's scroll container.
    expect(document.body.contains(overlay())).toBe(true)
    expect(overlay().parentElement).toBe(document.body)
  })

  it('puts the caret in the field, and gives it back to the control that opened it', () => {
    // The opener has to be focused before the dialog mounts, which is what a keyboard user
    // pressing Enter has.
    const trigger = document.createElement('button')
    trigger.textContent = '在上一版上改'
    document.body.append(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const { unmount } = render(<PromptDialog {...dialogProps()} />)
    expect(document.activeElement).toBe(screen.getByLabelText('改什么'))

    unmount()
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('closes on Escape, and does not let the key reach the page under it', () => {
    const onCancel = vi.fn()
    const under = vi.fn()
    document.addEventListener('keydown', under)
    try {
      render(<PromptDialog {...dialogProps({ onCancel })} />)
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' })
      expect(onCancel).toHaveBeenCalledTimes(1)
      // The page behind the dialog never sees the key: it is not a shortcut for anything.
      expect(under).not.toHaveBeenCalled()
    } finally {
      document.removeEventListener('keydown', under)
    }
  })

  it('closes on a press that lands on the backdrop, and not on one inside the panel', () => {
    const onCancel = vi.fn()
    render(<PromptDialog {...dialogProps({ onCancel })} />)
    // A selection drag that starts in the field and ends on the overlay is not a dismissal;
    // the press is what decides, and this one started inside.
    fireEvent.mouseDown(panel())
    expect(onCancel).not.toHaveBeenCalled()
    fireEvent.mouseDown(overlay())
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('keeps Tab inside the panel, in both directions', () => {
    render(<PromptDialog {...dialogProps()} />)
    const close = screen.getByRole('button', { name: '关闭' })
    const cancel = screen.getByRole('button', { name: '取消' })
    const submit = screen.getByRole('button', { name: '重新生成' })
    // The panel's own order: close, the field, then the two ways out.
    submit.focus()
    fireEvent.keyDown(submit, { key: 'Tab' })
    expect(document.activeElement).toBe(close)
    close.focus()
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(submit)
    // In the middle the browser's own move is right, so nothing is intercepted.
    cancel.focus()
    fireEvent.keyDown(cancel, { key: 'Tab' })
    expect(document.activeElement).toBe(cancel)
  })

  it('closes both ways out while the form cannot be submitted', () => {
    render(<PromptDialog {...dialogProps({ busy: true, submitDisabled: true })} />)
    expect(panel().getAttribute('data-prompt-panel')).toBe('busy')
    expect(screen.getByRole('button', { name: '重新生成' })).toHaveProperty('disabled', true)
    // Closing still works: the dialog covers a form that is waiting, not a broken window.
    expect(screen.getByRole('button', { name: '取消' })).toHaveProperty('disabled', false)
  })

  it('states a refusal inside the dialog rather than beside the page', () => {
    render(<PromptDialog {...dialogProps({ problem: '写一句要改什么' })} />)
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toBe('写一句要改什么')
    expect(alert.hasAttribute('data-prompt-problem')).toBe(true)
    expect(panel().contains(alert)).toBe(true)
  })

  it('submits and closes from its own controls', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()
    render(<PromptDialog {...dialogProps({ onSubmit, onCancel })} />)
    fireEvent.click(screen.getByRole('button', { name: '重新生成' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(onCancel).toHaveBeenCalledTimes(2)
  })
})
