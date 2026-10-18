/**
 * The result's own editor: the filled region HTML, written by hand.
 *
 * A run's output is not always right, and the fix is sometimes two characters rather than
 * another model call. This editor edits the one fragment a result carries — not the
 * template document, which is a different thing stored under a different key — and saves
 * it as the card's result.
 *
 * It opens in place of the rendered document, inside the result surface, for the same
 * reason the configuration editor does: the shared primitives expose no dialog, and a
 * second overlay mechanism would be a second thing to get wrong. It answers the same
 * keystrokes as the template editor because a writer in an HTML box expects them; it
 * carries none of that editor's document-only affordances (region bands, declaration
 * builder, skeleton), because a fragment has no region markers and declares nothing.
 * @module dsh-workbench/client/skill-card/SkillCardResultEditor
 */

import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { WORKBENCH_RESULT_MAX_BYTES } from '../../skill-card-contract.ts'
import type { WorkbenchLocaleKey } from '../locales.ts'
import { analyzeFragment } from './template.ts'
import type { WorkbenchFragmentViolation } from './template.ts'
import { indentBlock, lineBounds, lineIndexAt, LINE_HEIGHT } from './text-editing.ts'
import { CONTENT_VIOLATION_KEYS } from './violation-copy.ts'
import css from './skill-card.module.css'

/** Group digits the way the size readout shows them: `12,480`, not `12480`. */
const COUNT_FORMAT = new Intl.NumberFormat('en-US')

/** Which refusal the editor states in its one alert line. */
type EditRefusal = 'empty' | 'too-large'

/** Props of the result editor. */
export interface SkillCardResultEditorProps {
  /** The region HTML the result carries now; the draft's starting point. */
  readonly html: string
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  /**
   * Store the edited fragment.
   *
   * The promise settles when the Host has answered, so the editor can keep its one button
   * out of reach until then; leaving the editor is the page's decision, not this one's —
   * a refused save must leave the draft exactly where it is.
   * @param html - the draft, verbatim.
   * @returns resolution once the write has settled.
   */
  readonly onSave: (html: string) => Promise<void>
  /** Leave without writing anything. */
  readonly onCancel: () => void
}

/**
 * Render the result editor.
 * @param props - the starting HTML, `t`, and the two decisions.
 * @returns the editor element.
 */
export function SkillCardResultEditor(props: SkillCardResultEditorProps): ReactNode {
  const { html, t, onSave, onCancel } = props
  const [draft, setDraft] = useState(html)
  // One write at a time: Ctrl/Cmd+S and the button share this gate, so a held key cannot
  // put two writes of two different drafts in flight.
  const [saving, setSaving] = useState(false)

  const gutter = useRef<HTMLPreElement>(null)
  const editor = useRef<HTMLTextAreaElement>(null)
  // Tab indents, so the only way out of the field is to ask for it: Escape arms the next
  // Tab to move focus. Without this the control would trap keyboard users, and without
  // Tab indenting the editor fights anyone writing nested HTML.
  const escaped = useRef(false)

  const violations = useMemo(() => analyzeFragment(draft), [draft])
  // The budget the Host enforces is a UTF-8 byte limit, so the readout is counted in
  // bytes too: counting characters against a byte budget hides the real position, and a
  // Chinese fragment of 30k characters is already over 64 KiB.
  const bytes = new TextEncoder().encode(draft).length
  const overBudget = bytes > WORKBENCH_RESULT_MAX_BYTES
  const empty = draft.trim() === ''
  const dirty = draft !== html

  // The one gate for storing an edit: the button and the shortcut share it, so a refused
  // fragment can never be stored by a second route. Content-policy refusals are in it
  // because the renderer strips those constructs silently — saving them would read as
  // "it saved but did nothing". An unchanged draft is in it too: saving it would stamp
  // `editedAt` on a result nobody edited.
  const saveable = dirty && !empty && !overBudget && violations.length === 0

  /** Which single refusal the alert line states, or undefined when nothing blocks. */
  const refusal: EditRefusal | undefined = empty ? 'empty' : overBudget ? 'too-large' : undefined
  const refusalText = refusal === 'empty'
    ? t('resultEditEmpty')
    : refusal === 'too-large'
      ? t('resultEditTooLarge', {
        bytes: COUNT_FORMAT.format(bytes),
        max: COUNT_FORMAT.format(WORKBENCH_RESULT_MAX_BYTES),
      })
      : ''

  // One element per line rather than one joined string: the numbers have to line up with
  // the lines they label, and the gutter scrolls with the field.
  const gutterLines = useMemo(() => draft.split('\n').map((_, index) => index + 1), [draft])

  /**
   * Indent or outdent the lines the caret covers.
   * @param outdent - whether to remove one level instead of adding one.
   */
  const editIndent = (outdent: boolean): void => {
    const element = editor.current
    if (element === null) return
    const edit = indentBlock(element.value, element.selectionStart, element.selectionEnd, outdent)
    if (edit === undefined) return
    setDraft(edit.text)
    // The selection is restored after React has written the new value: setting it
    // synchronously here would be applied to the old text.
    queueMicrotask(() => { element.setSelectionRange(edit.start, edit.end) })
  }

  /**
   * Select a character range of the draft and bring it into view.
   * @param start - first character to select.
   * @param end - one past the last character to select.
   */
  const revealRange = (start: number, end: number): void => {
    const element = editor.current
    if (element === null) return
    const from = Math.min(Math.max(start, 0), draft.length)
    const to = Math.min(Math.max(end, from), draft.length)
    element.focus()
    element.setSelectionRange(from, to)
    // A text area offers no "scroll to offset": the line index and the shared line
    // height are the only way to centre the target, and centring it is what makes the
    // selection land in view even when it is far off screen.
    const top = lineIndexAt(draft, from) * LINE_HEIGHT - element.clientHeight / 2 + LINE_HEIGHT / 2
    element.scrollTop = Math.max(0, top)
    // The gutter follows the field's scroll events, but a programmatic scroll need not
    // emit one before the next paint, and a gutter one line behind is a wrong number.
    if (gutter.current !== null) gutter.current.scrollTop = element.scrollTop
  }

  /**
   * Select one whole line, for a click on its number.
   * @param line - zero-based line index.
   */
  const selectLine = (line: number): void => {
    const bounds = lineBounds(draft, line)
    revealRange(bounds.start, bounds.end)
  }

  /**
   * Jump to one reported refusal.
   * @param violation - the refusal the user clicked.
   */
  const revealViolation = (violation: WorkbenchFragmentViolation): void => {
    const offset = violation.offset
    if (offset === undefined) return
    // Without a token there is still a place: select one character there rather than
    // guessing a span the violation never claimed.
    revealRange(offset, offset + (violation.token?.length ?? 1))
  }

  /** Store the draft, obeying the same gate as the button. */
  const submit = (): void => {
    if (!saveable || saving) return
    setSaving(true)
    void onSave(draft).finally(() => { setSaving(false) })
  }

  /**
   * Keep Tab and Shift+Tab inside the editor as indentation, and claim Ctrl/Cmd+S.
   * @param event - the key event from the field.
   */
  const handleEditorKey = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Ctrl/Cmd+S is what a writer expects in an editor, and nothing else here claims it.
    // The browser default would "save" the shell page rather than this fragment, so it is
    // suppressed even when there is nothing to save.
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      submit()
      return
    }
    if (event.key === 'Escape') {
      escaped.current = true
      return
    }
    if (event.key !== 'Tab') {
      escaped.current = false
      return
    }
    if (escaped.current) {
      // The user asked to leave; let the browser move focus.
      escaped.current = false
      return
    }
    event.preventDefault()
    editIndent(event.shiftKey)
  }

  return (
    <div className={css.resultEditor} data-result-editor="">
      {/* One line, two facts: how much of the byte budget the fragment uses, and whether
          it differs from what is stored. */}
      <div className={css.editorStatus} data-result-edit-status="">
        <span className={overBudget ? css.editorStatusWarn : undefined}>
          {COUNT_FORMAT.format(bytes)}
          {' / '}
          {COUNT_FORMAT.format(WORKBENCH_RESULT_MAX_BYTES)}
          {' '}
          {t('skillCardTemplateSizeUnit')}
        </span>
        {dirty ? ` · ${t('skillCardTemplateDirty')}` : ''}
      </div>

      <div className={css.editorPane}>
        <pre ref={gutter} className={css.gutter} aria-hidden="true">
          {gutterLines.map(line => (
            <button
              key={line}
              type="button"
              // Not a tab stop: the gutter is a mouse affordance over a field that is
              // already fully usable from the keyboard, and one stop per line would bury
              // every control after it.
              tabIndex={-1}
              className={css.gutterLine}
              // The field keeps focus: a control that takes focus inside an `aria-hidden`
              // gutter is an inconsistency for assistive technology and a caret lost for
              // everyone else.
              onMouseDown={(event) => { event.preventDefault() }}
              onClick={() => { selectLine(line - 1) }}
            >
              {line}
            </button>
          ))}
        </pre>
        <textarea
          ref={editor}
          className={css.editor}
          value={draft}
          spellCheck={false}
          aria-label={t('resultEditLabel')}
          placeholder={t('resultEditPlaceholder')}
          onChange={(event) => { setDraft(event.target.value) }}
          onKeyDown={(event) => { handleEditorKey(event) }}
          // The gutter scrolls with the text, never on its own: a fixed gutter beside a
          // scrolled textarea numbers the wrong lines.
          onScroll={(event) => {
            if (gutter.current !== null) gutter.current.scrollTop = event.currentTarget.scrollTop
          }}
        />
      </div>

      {violations.length === 0 ? null : (
        <ul className={css.violations} data-result-edit-violations="">
          {violations.map((violation, index) => {
            const label = `${t(CONTENT_VIOLATION_KEYS[violation.code])} · ${violation.location}`
            return (
              <li key={`${violation.code}-${String(index)}`}>
                {violation.offset === undefined
                  // No offset means there is no position to jump to, and a button that
                  // goes nowhere is worse than plain text.
                  ? label
                  : (
                    <button
                      type="button"
                      className={css.violationJump}
                      onClick={() => { revealViolation(violation) }}
                    >
                      {label}
                    </button>
                  )}
              </li>
            )
          })}
        </ul>
      )}

      {refusal === undefined ? null : (
        // Above the two controls, because it is why the first of them is unavailable. An
        // empty region and an oversized one are not violations of the HTML: they are
        // reasons this fragment cannot become this card's result.
        <p className={css.writeFailure} role="alert" data-result-edit-refusal={refusal}>
          {refusalText}
        </p>
      )}

      <div className={css.settingsActions}>
        <Button variant="primary" size="sm" disabled={!saveable || saving} onClick={submit}>
          {t('skillCardSave')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('actionCancel')}
        </Button>
      </div>
    </div>
  )
}
