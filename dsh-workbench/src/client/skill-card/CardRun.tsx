/**
 * Starting a card's run, from the card itself.
 *
 * A run used to start from a bar on the card's own page: an input and a button above the
 * history, where the history is what the page is for. Starting a run is an action *on* a
 * card — the grid is where the cards are — so the control lives on the card's face, and the
 * sentence a run may need is written in a dialog. Nothing on the card's page starts a run any
 * more; the page reads the history, and a run in flight is stopped from its own row there.
 *
 * The dialog is the same one the result page opens for 从头跑: `RunPrompt`, here rather than in
 * the pages module so the face (which renders inside a grid cell) does not have to import a
 * page to start something.
 * @module dsh-workbench/client/skill-card/CardRun
 */

import {
  Button,
  IconCloseOutlineMedium,
  IconPlayOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { WorkbenchCardActions, WorkbenchCardView } from './controller.ts'
import type { WorkbenchLocaleKey } from '../locales.ts'
import { PromptDialog } from './PromptDialog.tsx'
import css from './skill-card.module.css'

/** Rows the revision field grows to before it scrolls instead. */
export const COMPOSER_MAX_ROWS = 4

/** Rows the run dialog's field shows before it scrolls. */
const RUN_FIELD_MAX_ROWS = 3

/** Prefix of the session-scoped draft key, one per card. */
const DRAFT_PREFIX = 'dsh-workbench:instruction:'

/**
 * Read one card's unsent instruction back.
 *
 * A draft rather than a stored value: it belongs to the dialog the user left, and a card's
 * next run should not inherit a sentence left behind hours ago. Session storage rather than
 * memory because the face that opens the dialog and the page that shows the result are
 * separate mounts — a half-written ask would otherwise be dropped by looking at something.
 * @param cardId - the card whose draft is read.
 * @returns the draft, or an empty string when none was kept or storage is unavailable.
 */
export function readDraft(cardId: string): string {
  try {
    return globalThis.sessionStorage?.getItem(`${DRAFT_PREFIX}${cardId}`) ?? ''
  } catch {
    // Storage can be denied outright; a dialog without a draft is still a working dialog.
    return ''
  }
}

/**
 * Keep or clear one card's unsent instruction.
 * @param cardId - the card whose draft is written.
 * @param text - the draft; an empty string clears it.
 */
export function writeDraft(cardId: string, text: string): void {
  try {
    if (text === '') globalThis.sessionStorage?.removeItem(`${DRAFT_PREFIX}${cardId}`)
    else globalThis.sessionStorage?.setItem(`${DRAFT_PREFIX}${cardId}`, text)
  } catch {
    // As above: losing the draft costs a retype, not the run.
  }
}

/**
 * The field a sentence is written into: one line grown to what it holds.
 *
 * Shared by every dialog a sentence is written in, because the two are the same field around
 * two different forms. What a dialog changes is only when Enter sends: in a dialog the dialog
 * *is* the form, so a bare Enter sends and Shift+Enter is the newline.
 * @param props - the text, its placeholder, and how Enter behaves.
 * @returns the field.
 */
export function InstructionField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  rows,
  disabled = false,
  className,
  submitOn,
  onSubmit,
  focus = false,
}: {
  readonly value: string
  readonly onChange: (next: string) => void
  readonly placeholder: string
  readonly ariaLabel: string
  /** The fallback height, for a field that cannot measure itself. */
  readonly rows: number
  readonly disabled?: boolean | undefined
  /** The box the field is drawn in; each dialog brings its own. */
  readonly className?: string | undefined
  readonly submitOn: 'enter' | 'modifier'
  readonly onSubmit: () => void
  /** Whether the caret starts here, which is what a dialog exists to be typed in is for. */
  readonly focus?: boolean | undefined
}): ReactNode {
  const field = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const element = field.current
    if (element === null) return
    // Measure from scratch: `scrollHeight` is the content height only while the box is
    // not already taller than its content.
    element.style.height = 'auto'
    // A field that cannot measure — jsdom, or a hidden mount — reports 0, and collapsing
    // to no height would hide the very thing the user is typing into.
    if (element.scrollHeight > 0) element.style.height = `${String(element.scrollHeight)}px`
  }, [value])
  useLayoutEffect(() => {
    if (focus) field.current?.focus()
  }, [focus])
  return (
    <textarea
      ref={field}
      className={className}
      rows={rows}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      data-prompt-focus={focus ? '' : undefined}
      onChange={(event) => { onChange(event.target.value) }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter') return
        // Enter also confirms an IME candidate list. Sending there would send half of the
        // sentence the user is still writing.
        if (event.nativeEvent.isComposing) return
        // Ctrl/Cmd+Enter is "send regardless", which is the only way to send a multi-line
        // ask from a field that keeps Enter for its own newline.
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault()
          onSubmit()
          return
        }
        // Shift+Enter is the newline the field grows a row for.
        if (event.shiftKey) return
        if (submitOn === 'modifier' && value.includes('\n')) return
        event.preventDefault()
        onSubmit()
      }}
    />
  )
}

/**
 * The instructions this card was recently given, offered back as chips.
 *
 * A shortcut for the common case — the same ask again, with a small edit — so a click refills
 * the field rather than starting anything.
 * @param props - the recent asks and what a click does with one.
 * @returns the chips, or nothing when this card has no history.
 */
export function InstructionChips({
  recent,
  t,
  onPick,
}: {
  readonly recent: readonly string[]
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly onPick: (instruction: string) => void
}): ReactNode {
  if (recent.length === 0) return null
  return (
    <div className={css.runChips} data-run-instruction-recent="">
      <span className={css.runChipsLabel}>{t('runInstructionRecent')}</span>
      {recent.map(instruction => (
        <button
          key={instruction}
          type="button"
          className={css.runChip}
          onClick={() => { onPick(instruction) }}
          data-run-instruction-chip=""
        >
          {instruction}
        </button>
      ))}
    </div>
  )
}

/**
 * The dialog a run's instruction is written in, for a card that takes one.
 *
 * A card whose skill takes no instruction never opens this: the run starts from its face, and
 * a dialog over a form with nothing in it would be a question with no answer.
 * @param props - the card, the mode, the recent asks, and the two ways out.
 * @returns the dialog.
 */
export function RunPrompt({
  cardId,
  title,
  mode,
  recent,
  t,
  disabled,
  onRun,
  onCancel,
}: {
  readonly cardId: string
  /** The panel's heading: what this particular run is, in the words of the control that opened it. */
  readonly title: string
  /** The card's instruction mode; `none` never reaches this dialog. */
  readonly mode: 'optional' | 'required'
  readonly recent: readonly string[]
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  readonly disabled: boolean
  readonly onRun: (instruction: string) => void
  readonly onCancel: () => void
}): ReactNode {
  const [text, setText] = useState(() => readDraft(cardId))
  // Whether the user pressed Run with nothing written. Cleared as soon as they type, so the
  // sentence disappears the moment it stops being true.
  const [refused, setRefused] = useState(false)
  const empty = text.trim() === ''
  const submit = (): void => {
    if (disabled) return
    if (empty && mode === 'required') {
      // Required, and nothing was written. The run is not sent: the refusal happens here,
      // in view, with the field focused — the one thing a disabled control could not do.
      setRefused(true)
      return
    }
    setText('')
    writeDraft(cardId, '')
    onRun(empty ? '' : text)
  }
  return (
    <PromptDialog
      title={title}
      hint={t('promptFreshHint')}
      submitLabel={t('skillCardRun')}
      cancelLabel={t('skillCardCancel')}
      closeLabel={t('promptClose')}
      problem={refused ? t('runInstructionRequired') : undefined}
      busy={disabled}
      onCancel={onCancel}
      onSubmit={submit}
    >
      <InstructionField
        className={css.dialogField}
        value={text}
        onChange={(next) => {
          setText(next)
          writeDraft(cardId, next)
          if (refused && next.trim() !== '') setRefused(false)
        }}
        rows={Math.min(RUN_FIELD_MAX_ROWS, Math.max(2, text.split('\n').length))}
        placeholder={t(mode === 'required' ? 'runInstructionPlaceholderRequired' : 'runInstructionPlaceholderOptional')}
        ariaLabel={t('runInstructionField')}
        submitOn="enter"
        onSubmit={submit}
        focus
      />
      <InstructionChips
        recent={recent}
        t={t}
        onPick={(instruction) => {
          setText(instruction)
          writeDraft(cardId, instruction)
          setRefused(false)
        }}
      />
    </PromptDialog>
  )
}

/**
 * The run control on a card's face.
 *
 * One control, three readings. A card that takes no instruction runs on the press; a card that
 * takes one opens the dialog to ask for it; and while this card's own run is in flight the
 * control is that run's stop, because the grid is where the user pressed the thing that
 * started it and the card's page has no run control at all. A card that cannot run is closed
 * rather than pressable-and-silent, and its face already says why.
 * @param props - the card's view, its actions, and the translator.
 * @returns the control, and the dialog when it is open.
 */
export function CardRunButton({
  cardId,
  view,
  actions,
  t,
}: {
  readonly cardId: string
  readonly view: WorkbenchCardView
  readonly actions: WorkbenchCardActions
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
}): ReactNode {
  const [asking, setAsking] = useState(false)
  // This card's own run, not any run of it: the face is one card, and a run started from
  // another card's button is that card's business.
  const running = view.run?.phase === 'running'
  // A dialog cannot be sent while the card is not runnable, and neither can a bare press.
  const disabled = !view.runnable
  if (running) {
    return (
      <Button
        variant="ghost"
        size="sm"
        data-card-run="stop"
        onClick={() => { actions.cancel() }}
      >
        <IconCloseOutlineMedium size={14} />
        <span>{t('skillCardCancel')}</span>
      </Button>
    )
  }
  const press = (): void => {
    if (disabled) return
    // No instruction to ask for: the run starts, and a dialog would only stand between the
    // press and the thing it asked for.
    if (view.instructionMode === 'none') actions.run()
    else setAsking(true)
  }
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        data-card-run="start"
        disabled={disabled}
        onClick={press}
      >
        <IconPlayOutlineRegular size={14} />
        <span>{t('skillCardRun')}</span>
      </Button>
      {asking && view.instructionMode !== 'none'
        ? (
          <RunPrompt
            cardId={cardId}
            title={t('runPromptTitle')}
            mode={view.instructionMode}
            recent={view.recentInstructions}
            t={t}
            disabled={disabled}
            onRun={(instruction) => {
              setAsking(false)
              actions.run(instruction)
            }}
            onCancel={() => { setAsking(false) }}
          />
        )
        : null}
    </>
  )
}
