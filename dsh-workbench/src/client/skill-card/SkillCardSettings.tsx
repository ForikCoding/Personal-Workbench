/**
 * The skill card's editor: choose a skill, write the HTML, and preview it.
 *
 * It opens in place of the card body rather than in a modal: the shared
 * primitives expose no dialog, and inventing one here would put a second overlay
 * mechanism next to the application's own.
 *
 * The page it renders is three groups — the card's facts, the template, and the
 * preview — followed by a footer that stays in reach. They are groups rather than
 * nested cards: a card inside a card reads as a second frame, and the editor already
 * sits inside the page's own surface.
 * @module dsh-workbench/client/skill-card/SkillCardSettings
 */

import { useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  WORKBENCH_REGION_BEGIN,
  WORKBENCH_REGION_END,
  WORKBENCH_TEMPLATE_MAX_BYTES,
} from '../../skill-card-contract.ts'
import type { WorkbenchActionTarget, WorkbenchCardModel } from '../../skill-card-contract.ts'
import type { WorkbenchLocaleKey } from '../locales.ts'
import { ActionDeclarationPanel } from './ActionDeclarationPanel.tsx'
import type { WorkbenchCardView } from './controller.ts'
import { declarationLine, insertDeclaration } from './declarations.ts'
import { modelKey, parseModelKey } from './model.ts'
import { templateSkeleton } from './skeleton.ts'
import { analyzeTemplate, findActionsBlock, findRegion } from './template.ts'
import type { WorkbenchTemplateViolation, WorkbenchTemplateViolationCode } from './template.ts'
import { indentBlock, lineBounds, lineIndexAt, LINE_HEIGHT } from './text-editing.ts'
import { CONTENT_VIOLATION_KEYS } from './violation-copy.ts'
import { problemKey } from './SkillCard.tsx'
import { ShadowHtml } from './ShadowHtml.tsx'
import css from './skill-card.module.css'

/** The marker pair the insert control writes, each on its own line. */
const REGION_MARKERS = {
  begin: `<!-- ${WORKBENCH_REGION_BEGIN} -->`,
  end: `<!-- ${WORKBENCH_REGION_END} -->`,
} as const

/** Group digits the way the size readout shows them: `12,480`, not `12480`. */
const COUNT_FORMAT = new Intl.NumberFormat('en-US')

/** Props of the editor. */
export interface SkillCardSettingsProps {
  /** What the card currently shows. */
  readonly view: WorkbenchCardView
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  /** Store a new skill selection. */
  readonly onChoose: (skill: string) => void
  /** Store the model this card's runs use. */
  readonly onChooseModel: (model: WorkbenchCardModel) => void
  /** Store the template. */
  readonly onSave: (template: string, name: string) => void
  /** Store the card's name; an empty value clears it back to the registered label. */
  readonly onRename: (name: string) => void
  /** Close the editor. */
  readonly onClose: () => void
  /**
   * Remove the card and everything stored for it.
   *
   * The editor only decides *whether* to ask; the page owns the write and the
   * navigation that follows it.
   */
  readonly onDelete: () => void
}

/** One gutter line: the number it shows, and which band it belongs to. */
interface GutterLineFact {
  readonly number: number
  /** The band this line belongs to, or undefined for an ordinary line. */
  readonly kind: 'region' | 'actions' | undefined
}

/** One declared target that no longer exists. */
interface MissingTarget {
  /** The action key that points at it. */
  readonly key: string
  /** What kind of thing it was meant to be. */
  readonly kind: WorkbenchActionTarget['kind']
  /** The name as the declaration writes it. */
  readonly name: string
}

/**
 * Join the class names of one element.
 *
 * The CSS module is typed as an index signature, so every lookup may be undefined;
 * dropping the absent ones keeps a literal `undefined` out of the DOM.
 * @param names - candidate class names.
 * @returns the class attribute value.
 */
function classes(...names: readonly (string | undefined)[]): string {
  return names.filter((name): name is string => name !== undefined).join(' ')
}

/**
 * Choose the classes of one gutter line.
 * @param kind - the band the line belongs to, when it belongs to one.
 * @returns the CSS module class names for that line.
 */
function gutterLineClass(kind: GutterLineFact['kind']): string {
  if (kind === 'region') return classes(css.gutterLine, css.gutterLineRegion)
  if (kind === 'actions') return classes(css.gutterLine, css.gutterLineActions)
  return classes(css.gutterLine)
}

/**
 * Render the card editor.
 *
 * The card remounts this component when the selected skill changes, so the draft
 * always starts from that skill's stored template.
 * @param props - the view, `t`, and the four actions.
 * @returns the editor element.
 */
export function SkillCardSettings(props: SkillCardSettingsProps): ReactNode {
  const { view, t, onChoose, onChooseModel, onSave, onRename, onClose, onDelete } = props
  const [draft, setDraft] = useState(view.template ?? '')
  const [name, setName] = useState(view.name ?? '')
  // The declaration builder is closed until asked for: an editor whose first frame
  // carries a form about actions buries the document it exists to show.
  const [builderOpen, setBuilderOpen] = useState(false)
  // Removing the card is one press away from a destructive mistake, so it takes two
  // presses: the first one only asks.
  const [deleteArmed, setDeleteArmed] = useState(false)

  const base = useId()
  const basicsId = `${base}-basics`
  const nameId = `${base}-name`
  const skillId = `${base}-skill`
  const modelId = `${base}-model`
  const templateId = `${base}-template`
  const previewId = `${base}-preview`

  const analysis = useMemo(() => analyzeTemplate(draft), [draft])
  const gutter = useRef<HTMLPreElement>(null)
  const editor = useRef<HTMLTextAreaElement>(null)
  // Tab indents, so the only way out of the field is to ask for it: Escape arms the
  // next Tab to move focus. Without this the control would trap keyboard users, and
  // without Tab indenting the editor fights anyone writing nested HTML.
  const escaped = useRef(false)

  // Both fields are edited here, so either one being different from what is stored means
  // the page holds a change the user has not committed.
  const dirty = draft !== (view.template ?? '') || name !== (view.name ?? '')
  // Which pane the narrow layout shows. Wide layouts ignore it and show both.
  const [pane, setPane] = useState<'edit' | 'preview'>('edit')

  // The one gate for storing a template: the save button and the keyboard shortcut
  // share it, so a refused document can never be stored by a second route. A target
  // that does not exist is deliberately *not* part of it: the card it names may be
  // created later.
  const saveable = analysis.violations.length === 0 && draft.length > 0 && view.skill !== undefined

  // The region's own line numbers, 1-based. `region.start` is the first character
  // after the opening marker, so it belongs to the opening marker's line; the same
  // holds for the closing marker's index.
  const regionLines = useMemo(() => {
    const region = analysis.region
    if (region === undefined) return undefined
    return { start: lineIndexAt(draft, region.start) + 1, end: lineIndexAt(draft, region.end) + 1 }
  }, [analysis, draft])

  const gutterLines = useMemo<readonly GutterLineFact[]>(() => {
    const marks = new Map<number, 'region' | 'actions'>()
    // The action band is marked first so the region wins where the two overlap: a
    // declaration written inside the region is already a violation, and the region
    // is the fact the reader has to see first.
    const actions = findActionsBlock(draft)
    if (actions !== undefined) {
      const first = lineIndexAt(draft, actions.start)
      const last = lineIndexAt(draft, actions.end)
      for (let line = first; line <= last; line += 1) marks.set(line, 'actions')
    }
    if (regionLines !== undefined) {
      for (let line = regionLines.start - 1; line <= regionLines.end - 1; line += 1) marks.set(line, 'region')
    }
    // One element per line rather than one joined string: a band can only be drawn on
    // the lines that belong to it.
    return draft.split('\n').map((_, index) => ({ number: index + 1, kind: marks.get(index) }))
  }, [draft, regionLines])

  // The skills a human may invoke, which is also the set a skill target can address:
  // the click path resolves against exactly this list, so a declaration pointing
  // anywhere else would be refused at the moment of the click.
  const options = useMemo(() => view.catalog.filter(entry => entry.userInvocable), [view.catalog])
  const skillNames = useMemo(() => options.map(entry => entry.name), [options])

  // A declared target may legitimately be missing: a card can be created later, a
  // skill installed later. It is reported for that reason and never gates saving.
  // The comparison lives here rather than in the analyser because only the editor
  // holds the catalog and the card list, and the analyser is a pure text function.
  const missingTargets = useMemo<readonly MissingTarget[]>(() => {
    // An unread configuration would report every target as missing, and a catalog that
    // could not be read cannot say any skill is absent.
    if (view.status !== 'ready') return []
    const cards = new Set(view.cardTitles)
    const skills = view.catalogStatus === 'ready' ? new Set(skillNames) : undefined
    const found: MissingTarget[] = []
    for (const declaration of analysis.actions) {
      const target = declaration.target
      if (target.kind === 'card') {
        if (!cards.has(target.name)) found.push({ key: declaration.key, kind: 'card', name: target.name })
        continue
      }
      if (skills !== undefined && !skills.has(target.name)) {
        found.push({ key: declaration.key, kind: 'skill', name: target.name })
      }
    }
    return found
  }, [analysis, skillNames, view.cardTitles, view.catalogStatus, view.status])

  // The budget the Host enforces is a UTF-8 byte limit, so the readout and the warning
  // are counted in bytes too. Counting characters against a byte budget hides the real
  // position: a Chinese template of 12k characters is already over 32 KiB.
  const bytes = new TextEncoder().encode(draft).length
  const overBudget = bytes > WORKBENCH_TEMPLATE_MAX_BYTES * 0.85

  /**
   * Indent or outdent the lines the caret covers.
   *
   * The arithmetic lives in `text-editing.ts` because the result editor answers the same
   * two keystrokes over a fragment; this function only applies it to the live field.
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
   * Select a character range of one text and bring it into view.
   * @param start - first character to select.
   * @param end - one past the last character to select.
   * @param text - the text the offsets belong to; the draft by default, and the text
   * just written when the field has not rendered it yet.
   */
  const revealRange = (start: number, end: number, text: string = draft): void => {
    const element = editor.current
    if (element === null) return
    const from = Math.min(Math.max(start, 0), text.length)
    const to = Math.min(Math.max(end, from), text.length)
    element.focus()
    element.setSelectionRange(from, to)
    // A text area offers no "scroll to offset": the line index and the shared line
    // height are the only way to centre the target, and centring it is what makes the
    // selection land in view even when it is far off screen.
    const top = lineIndexAt(text, from) * LINE_HEIGHT - element.clientHeight / 2 + LINE_HEIGHT / 2
    element.scrollTop = Math.max(0, top)
    // The gutter follows the field's scroll events, but a programmatic scroll need not
    // emit one before the next paint, and a gutter one line behind is a wrong number.
    if (gutter.current !== null) gutter.current.scrollTop = element.scrollTop
  }

  /**
   * Jump to one reported violation.
   *
   * A violation with no offset has no position to jump to, so the list renders it as
   * text instead; this guard keeps that contract.
   * @param violation - the violation the user clicked.
   */
  const revealViolation = (violation: WorkbenchTemplateViolation): void => {
    const offset = violation.offset
    if (offset === undefined) return
    // Without a token there is still a place: select one character there rather than
    // guessing a span the violation never claimed.
    revealRange(offset, offset + (violation.token?.length ?? 1))
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
   * Write the region marker pair around the caret.
   *
   * The template cannot run without a region, so the editor offers to write the only
   * thing missing rather than leaving the user to remember the comment syntax.
   */
  const insertRegionMarkers = (): void => {
    const element = editor.current
    const caret = element === null ? draft.length : element.selectionStart
    const before = draft.slice(0, caret)
    const after = draft.slice(caret)
    // Each marker gets a line of its own: the analyser reads the raw text, and a
    // marker sharing a line with other content opens or closes a region mid-line.
    const lead = before === '' || before.endsWith('\n') ? '' : '\n'
    const trail = after === '' || after.startsWith('\n') ? '' : '\n'
    const markers = `${REGION_MARKERS.begin}\n\n${REGION_MARKERS.end}`
    setDraft(`${before}${lead}${markers}${trail}${after}`)
    // The caret lands on the blank line between the markers: the one place the user
    // can type without first deleting something the control just wrote.
    const position = caret + lead.length + REGION_MARKERS.begin.length + 1
    queueMicrotask(() => {
      if (element === null) return
      element.focus()
      element.setSelectionRange(position, position)
    })
  }

  /**
   * Write the starter document into the empty editor.
   *
   * An empty textarea teaches nothing: the region markers and the declaration block
   * are both syntax a user cannot guess, and the skeleton shows them in place.
   */
  const insertSkeleton = (): void => {
    const skeleton = templateSkeleton(t)
    setDraft(skeleton)
    // The caret goes to the start of the region: the one part of the document the user
    // is meant to replace.
    const caret = findRegion(skeleton)?.start ?? 0
    queueMicrotask(() => { revealRange(caret, caret, skeleton) })
  }

  /**
   * Write one declared action into the template.
   *
   * Only the new line is written; the panel closes only once it has been written, so a
   * refused insertion cannot look like a silent success.
   * @param key - the action key.
   * @param target - what that key resolves to.
   */
  const applyDeclaration = (key: string, target: WorkbenchActionTarget): void => {
    const insertion = insertDeclaration(draft, declarationLine(key, target))
    setDraft(insertion.text)
    setBuilderOpen(false)
    // The caret lands on the declaration that was just written, which is the line the
    // user has to look at to believe it happened.
    queueMicrotask(() => { revealRange(insertion.lineStart, insertion.lineStart, insertion.text) })
  }

  /**
   * Keep Tab and Shift+Tab inside the editor as indentation, and claim Ctrl/Cmd+S.
   * @param event - the key event from the template field.
   */
  const handleEditorKey = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Ctrl/Cmd+S is what a writer expects in an editor, and nothing else here claims
    // it. The browser default would "save" the shell page rather than this template,
    // so it is suppressed even when there is nothing to save; the save itself obeys
    // the same gate as the button.
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      if (saveable) onSave(draft, name)
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
    <div className={css.settings}>
      <section className={css.section} aria-labelledby={basicsId}>
        <h2 className={css.sectionTitle} id={basicsId}>{t('skillCardSectionBasics')}</h2>
        {/* Two fields on one row, each wide enough for a long name and no wider: at the
            page's width a full-width field is a line of empty space beside a label. */}
        <div className={css.fieldRow}>
          <div className={css.field}>
            <label className={css.fieldLabel} htmlFor={nameId}>{t('skillCardCardName')}</label>
            <input
              id={nameId}
              className={css.select}
              type="text"
              value={name}
              placeholder={t('skillCardNamePlaceholder')}
              onChange={(event) => { setName(event.target.value) }}
              // Committed on blur and on Enter rather than per keystroke: a rename is one
              // stored write, and typing would otherwise issue one write per character.
              onBlur={() => { onRename(name) }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                onRename(name)
              }}
            />
          </div>
          <div className={css.field}>
            <label className={css.fieldLabel} htmlFor={skillId}>{t('skillCardSelectSkill')}</label>
            <select
              id={skillId}
              className={css.select}
              value={view.skill ?? ''}
              disabled={view.catalogStatus !== 'ready'}
              onChange={(event) => { onChoose(event.target.value) }}
            >
              <option value="">{t('skillCardSelectPlaceholder')}</option>
              {options.map(entry => <option key={entry.name} value={entry.name}>{entry.name}</option>)}
            </select>
          </div>
          {/* The model sits beside the other two facts the card is made of. It is the one
              field whose non-ready states are not a disabled control: a route that is known
              but no longer offered is shown as text, because a disabled select offering
              other models would read as a choice the user still has. */}
          <div className={css.field}>
            <ModelField view={view} t={t} labelId={modelId} onChooseModel={onChooseModel} />
          </div>
        </div>
        {catalogNotice(view, options.length, t)}
      </section>

      {/* Editing and previewing are the same task seen twice, so on a wide window they
          sit side by side and the tabs disappear. Narrower than that, one would push the
          other below the fold, so the tabs take over — they carry the same two names as
          the headings they replace. */}
      <div className={css.panes} data-pane={pane}>
        <div className={css.paneTabs} role="tablist">
          <button
            type="button"
            role="tab"
            className={css.paneTab}
            aria-selected={pane === 'edit'}
            onClick={() => { setPane('edit') }}
          >
            {t('skillCardTemplateLabel')}
          </button>
          <button
            type="button"
            role="tab"
            className={css.paneTab}
            aria-selected={pane === 'preview'}
            onClick={() => { setPane('preview') }}
          >
            {t('skillCardPreview')}
          </button>
        </div>

      <section className={css.section} aria-labelledby={templateId}>
        <h2 className={css.sectionTitle} id={templateId}>{t('skillCardTemplateLabel')}</h2>
        {/* One line, three facts, in the order a writer needs them: where the region
            is, what the template declares, and how much of the budget it uses. */}
        <div
          className={classes(css.editorStatus, regionLines === undefined ? css.editorStatusMissing : undefined)}
          data-template-status=""
        >
          {regionLines === undefined
            ? <span>{t('skillCardRegionMissing')}</span>
            : (
              <span>
                {t('skillCardRegionRange', { start: String(regionLines.start), end: String(regionLines.end) })}
              </span>
            )}
          {' · '}
          <span>{t('skillCardActionsCount', { count: String(analysis.actions.length) })}</span>
          {' · '}
          <span className={overBudget ? css.editorStatusWarn : undefined}>
            {COUNT_FORMAT.format(bytes)}
            {' / '}
            {COUNT_FORMAT.format(WORKBENCH_TEMPLATE_MAX_BYTES)}
            {' '}
            {t('skillCardTemplateSizeUnit')}
          </span>
          {dirty ? ` · ${t('skillCardTemplateDirty')}` : ''}
          {/* An empty template gets the whole starter, not just the markers: the
              declaration block is the other thing it has to learn. */}
          {draft.trim() === ''
            ? (
              <>
                {' · '}
                <button type="button" className={css.editorStatusAction} onClick={insertSkeleton}>
                  {t('skillCardInsertSkeleton')}
                </button>
              </>
            )
            : regionLines === undefined
              ? (
                <>
                  {' · '}
                  <button type="button" className={css.editorStatusAction} onClick={insertRegionMarkers}>
                    {t('skillCardInsertMarkers')}
                  </button>
                </>
              )
              : null}
          {builderOpen
            ? null
            : (
              <>
                {' · '}
                <button
                  type="button"
                  className={css.editorStatusAction}
                  onClick={() => { setBuilderOpen(true) }}
                >
                  {t('skillCardAddAction')}
                </button>
              </>
            )}
        </div>

        {missingTargets.length === 0 ? null : (
          // Violation-shaped, deliberately not a violation: the card this names may
          // exist later, so saving stays possible and this line is not in the save gate.
          <ul className={css.violations} data-action-target-warnings="">
            {missingTargets.map(target => (
              <li key={`${target.kind}-${target.key}`}>
                {t(
                  target.kind === 'card'
                    ? 'skillCardActionCardTargetMissing'
                    : 'skillCardActionSkillTargetMissing',
                  { key: target.key, name: target.name },
                )}
              </li>
            ))}
          </ul>
        )}

        {builderOpen ? (
          <ActionDeclarationPanel
            t={t}
            cardTitles={view.cardTitles}
            skillNames={skillNames}
            catalogStatus={view.catalogStatus}
            // The analyser already reports a repeated key; offering the taken ones is
            // how the panel keeps the user from reaching that report.
            takenKeys={analysis.actions.map(declaration => declaration.key)}
            onInsert={applyDeclaration}
            onClose={() => { setBuilderOpen(false) }}
          />
        ) : null}

        <div className={css.editorPane}>
          <pre ref={gutter} className={css.gutter} aria-hidden="true">
            {gutterLines.map(line => (
              <button
                key={line.number}
                type="button"
                // Not a tab stop: the gutter is a mouse affordance over a field that is
                // already fully usable from the keyboard, and one stop per line would
                // bury every control after it.
                tabIndex={-1}
                className={gutterLineClass(line.kind)}
                // The field keeps focus: a control that takes focus inside an
                // `aria-hidden` gutter is an inconsistency for assistive technology and a
                // caret lost for everyone else.
                onMouseDown={(event) => { event.preventDefault() }}
                onClick={() => { selectLine(line.number - 1) }}
              >
                {line.number}
              </button>
            ))}
          </pre>
          <textarea
            ref={editor}
            className={css.editor}
            value={draft}
            spellCheck={false}
            aria-label={t('skillCardTemplateLabel')}
            placeholder={t('skillCardTemplatePlaceholder')}
            onChange={(event) => { setDraft(event.target.value) }}
            onKeyDown={(event) => { handleEditorKey(event) }}
            // The gutter scrolls with the text, never on its own: a fixed gutter beside a
            // scrolled textarea numbers the wrong lines.
            onScroll={(event) => {
              if (gutter.current !== null) gutter.current.scrollTop = event.currentTarget.scrollTop
            }}
          />
        </div>

        {analysis.violations.length === 0 ? null : (
          <ul className={css.violations}>
            {analysis.violations.map((violation, index) => {
              const label = `${t(violationKey(violation.code))} · ${violation.location}`
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
      </section>

      <section className={css.section} aria-labelledby={previewId}>
        <h2 className={css.sectionTitle} id={previewId}>{t('skillCardPreview')}</h2>
        {/* Its own surface, inset from the page: what is inside is the user's document
            in a shadow root and is left exactly as they wrote it. */}
        <div className={css.previewSurface}>
          <span className={css.previewLabel}>{t('skillCardPreviewSample')}</span>
          <ShadowHtml html={draft} className={css.preview} />
        </div>
      </section>
      </div>

      {/* Pinned to the bottom of the page's scroll container: saving must not depend on
          scrolling past a preview that can be arbitrarily tall. */}
      <footer
        className={css.configFooter}
        onKeyDown={(event) => {
          if (!deleteArmed || event.key !== 'Escape') return
          setDeleteArmed(false)
        }}
      >
        {/* A write that failed used to leave the page looking exactly like a success.
            The controller already knows; this is the one place that says so. */}
        {view.problem === undefined ? null : (
          <p className={css.writeFailure} role="alert">
            {t(problemKey(view.problem.code))}
            {view.problem.detail === undefined || view.problem.detail === '' ? '' : ` · ${view.problem.detail}`}
          </p>
        )}
        <div className={css.footerActions}>
          <Button
            variant="primary"
            size="sm"
            disabled={!saveable}
            onClick={() => { onSave(draft, name) }}
          >
            {t('skillCardSave')}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>{t('skillCardClose')}</Button>
          {/* The destructive control sits apart from the pair a user presses without
              reading, at the far end of the bar. */}
          <span className={css.footerSpacer} />
          <span className={css.deletePrompt} aria-live="polite">
            {deleteArmed ? t('skillCardDeleteConfirmPrompt') : ''}
          </span>
          {deleteArmed ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={css.deleteCard}
                onClick={() => { onDelete() }}
              >
                {t('skillCardDeleteConfirm')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setDeleteArmed(false) }}>
                {t('actionCancel')}
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={css.deleteCard}
              onClick={() => { setDeleteArmed(true) }}
            >
              {t('skillCardDelete')}
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}

/**
 * Render the model control for one card.
 *
 * Three states, and the picker is only one of them. A known route with no catalog behind
 * it is stated as the name the card will run on, and no route at all is stated as
 * unavailable — never as an empty picker, which would offer the user a choice that does
 * not exist. The run control elsewhere reads the same three states, so this field can
 * never say "unavailable" beside a live Run button.
 * @param props - the card view, the translator, the label id, and the store action.
 * @returns the field.
 */
function ModelField({
  view,
  t,
  labelId,
  onChooseModel,
}: {
  readonly view: WorkbenchCardView
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  /** Id the label points at while the field is a control. */
  readonly labelId: string
  readonly onChooseModel: (model: WorkbenchCardModel) => void
}): ReactNode {
  const field = view.modelField
  // The label only points at a control: pointing it at a paragraph would announce a form
  // field that is not there.
  const label = field.kind === 'ready'
    ? <label className={css.fieldLabel} htmlFor={labelId}>{t('skillCardModel')}</label>
    : <p className={css.fieldLabel}>{t('skillCardModel')}</p>
  if (field.kind === 'ready') {
    return (
      <>
        {label}
        <select
          id={labelId}
          className={css.select}
          value={modelKey(field.selected)}
          data-model-select=""
          onChange={(event) => {
            const chosen = parseModelKey(event.target.value)
            if (chosen === undefined) return
            onChooseModel(chosen)
          }}
        >
          {field.groups.map(group => (
            // Grouped by provider and labelled with the model's own name: the id is what a
            // request carries, and the name is what a user recognises.
            <optgroup key={group.id} label={group.name}>
              {group.models.map(model => (
                <option key={model.id} value={modelKey({ provider: group.id, model: model.id })}>
                  {model.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </>
    )
  }
  if (field.kind === 'fixed') {
    return (
      <>
        {label}
        <p className={css.fieldValue} data-model-fixed="">
          {field.name ?? field.model.model}
        </p>
      </>
    )
  }
  return (
    <>
      {label}
      <p className={css.fieldValue} data-model-unavailable="">{t('skillCardModelUnavailable')}</p>
    </>
  )
}

/**
 * Say what the catalog is doing, when it is not quietly ready with options.
 * @param view - the card view.
 * @param optionCount - how many invocable skills the catalog holds.
 * @param t - translator.
 * @returns the notice, or null when there is nothing to say.
 */
function catalogNotice(
  view: WorkbenchCardView,
  optionCount: number,
  t: (key: WorkbenchLocaleKey) => string,
): ReactNode {
  // The catalog needs a live agent to supply the skill scope. With none, say what
  // is missing rather than leaving a disabled control the user cannot diagnose.
  // A catalogue that has not started loading yet is about to; saying nothing there
  // is what left a disabled picker with no explanation.
  if (view.catalogStatus === 'loading' || view.catalogStatus === 'idle') {
    return <p className={css.noticeBody}>{t('skillCardCatalogLoading')}</p>
  }
  if (view.catalogStatus === 'failed') {
    return (
      <p className={css.noticeBody}>
        {t(view.catalogFailure === 'session-not-live' ? 'skillCardNoSession' : 'skillCardCatalogFailed')}
      </p>
    )
  }
  if (view.catalogStatus === 'ready' && optionCount === 0) {
    return <p className={css.noticeBody}>{t('skillCardCatalogEmpty')}</p>
  }
  return null
}

/**
 * Choose the message for one refusal.
 * @param code - the refusal code.
 * @returns the locale key. Exhaustive over the code union.
 */
function violationKey(code: WorkbenchTemplateViolationCode): WorkbenchLocaleKey {
  return VIOLATION_KEYS[code]
}

/**
 * Locale key for every refusal the analyser can report.
 *
 * A record rather than a lookup with a fallback, so a new refusal code fails
 * compilation here until it has copy. The five content-policy keys come from the shared
 * record because the result editor reports the same five over a fragment.
 */
const VIOLATION_KEYS: Record<WorkbenchTemplateViolationCode, WorkbenchLocaleKey> = {
  ...CONTENT_VIOLATION_KEYS,
  'region-missing': 'skillCardViolationRegionMissing',
  'region-unclosed': 'skillCardViolationRegionUnclosed',
  'region-repeated': 'skillCardViolationRegionRepeated',
  'placeholder-syntax': 'skillCardViolationPlaceholder',
  'action-declaration-duplicate': 'skillCardViolationActionDuplicate',
  'action-key-invalid': 'skillCardViolationActionKey',
  'action-key-repeated': 'skillCardViolationActionKeyRepeated',
  'action-target-invalid': 'skillCardViolationActionTarget',
  'actions-inside-region': 'skillCardViolationActionInsideRegion',
}
