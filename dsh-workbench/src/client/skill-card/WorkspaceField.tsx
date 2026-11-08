/**
 * The directory something runs in, and the two ways of naming it.
 *
 * A picker when the build ships one, a field when it does not. Both are in one component
 * because the question is one question: the configuration page, the run dialog and the
 * confirmation panel all ask it, and a card that could pick a directory on one screen and
 * only read it on the other would be the bug this file exists to prevent — a card whose
 * folder is wrong, and no way to say otherwise on the screen where the run is pressed.
 *
 * A typed path is not the unconfirmed path this feature refused earlier: the Host is asked
 * whether it is a directory before anything is stored, the same check a run is gated on, so a
 * typo is answered rather than persisted.
 * @module dsh-workbench/client/skill-card/WorkspaceField
 */

import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { useEffect, useState, type ReactNode } from 'react'
import type { WorkbenchCardView, WorkbenchWorkspaceTypedProblem } from './controller.ts'
import type { WorkbenchLocaleKey } from '../locales.ts'
import { classes } from './class-names.ts'
import css from './skill-card.module.css'

/** The sentence for a typed path that was not taken. */
const TYPED_PROBLEMS = {
  'invalid-path': 'skillCardWorkspaceTypedInvalid',
  'not-directory': 'skillCardWorkspaceTypedMissing',
} as const satisfies Record<string, WorkbenchLocaleKey>

/**
 * The field that takes a typed path, with its own answer to a path it did not take.
 *
 * Shared rather than written twice: the card's own directory and an invocation's directory are
 * asked the same way, refused for the same reasons, and should say so in the same words. What
 * differs is only where a confirmed path goes — the card's record, or this one run.
 * @param props - the resting value, the field's state, the note to show, and the commit.
 * @returns the input, its button, and the sentence explaining a refusal.
 */
export function WorkspacePathField({
  value,
  fieldKind,
  problem,
  t,
  onCommit,
}: {
  /** The path the field rests on; a keystroke is the user's edit, not this component's. */
  readonly value: string
  /** Which state of the question this field is showing, carried for the layout's styling. */
  readonly fieldKind: 'ready' | 'missing' | 'invalid'
  /** Why the last typed path was not taken, if it was not. */
  readonly problem: WorkbenchWorkspaceTypedProblem | undefined
  readonly t: (key: WorkbenchLocaleKey) => string
  readonly onCommit: (path: string) => void
}): ReactNode {
  const [typed, setTyped] = useState(value)
  // The resting value is the field's own: a pick, or a page that finally read the card, must
  // not leave yesterday's typo in the box.
  useEffect(() => { setTyped(value) }, [value])
  return (
    <>
      <div className={css.workspaceRow}>
        <input
          type="text"
          className={classes(
            css.workspaceInput,
            fieldKind === 'invalid' || problem !== undefined ? css.workspaceInputInvalid : undefined,
          )}
          value={typed}
          spellCheck={false}
          autoComplete="off"
          placeholder={t('skillCardWorkspacePathPlaceholder')}
          aria-label={t('skillCardWorkspace')}
          data-workspace-field={fieldKind}
          data-workspace-input=""
          onChange={(event) => { setTyped(event.target.value) }}
          // Enter is the whole gesture: the field and the button beside it are one control,
          // and a run dialog behind it must not take the key as its own.
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            onCommit(typed)
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          data-workspace-apply=""
          onClick={() => { onCommit(typed) }}
        >
          {t('skillCardWorkspaceApply')}
        </Button>
      </div>
      {problem === undefined
        ? null
        : (
          <p className={css.fieldNote} data-workspace-typed-problem={problem}>
            {t(TYPED_PROBLEMS[problem])}
          </p>
        )}
    </>
  )
}

/**
 * Render the card's directory field.
 * @param props - the card view, the translator, and the two ways of naming a directory.
 * @returns the field.
 */
export function WorkspaceField({
  view,
  t,
  onChooseWorkspace,
  onSetWorkspace,
  onClearWorkspace,
}: {
  readonly view: WorkbenchCardView
  readonly t: (key: WorkbenchLocaleKey) => string
  readonly onChooseWorkspace: () => void
  readonly onSetWorkspace: (path: string) => void
  /**
   * Stop naming a directory for this card.
   *
   * Absent when the screen has nothing to write with, and then no control is drawn — a clear
   * button that cannot clear is worse than the missing answer it offers.
   */
  readonly onClearWorkspace?: (() => void) | undefined
}): ReactNode {
  const field = view.workspaceField
  const stored = field.kind === 'missing' ? '' : field.path
  const problem = view.workspaceTypedProblem
  // Clearing is offered only while there is something to clear. On an empty card it would be a
  // control that does nothing, which reads as broken rather than as idle.
  const clear = field.kind !== 'missing' && onClearWorkspace !== undefined
    ? (
      <Button variant="ghost" size="sm" onClick={onClearWorkspace} data-workspace-clear="">
        {t('skillCardWorkspaceClear')}
      </Button>
      )
    : null
  return (
    <>
      <p className={css.fieldLabel}>{t('skillCardWorkspace')}</p>
      {view.canChooseWorkspace
        ? (
          <div className={css.workspaceRow}>
            <div
              className={classes(
                css.workspaceValue,
                field.kind === 'invalid' || problem !== undefined ? css.workspaceValueInvalid : undefined,
              )}
              data-workspace-field={field.kind}
            >
              <span className={css.workspaceLeaf} data-workspace-leaf="">
                {field.kind === 'missing' ? t('skillCardWorkspaceNotSet') : field.leaf}
              </span>
              {/* The full path is never truncated away in favour of the leaf: the leaf is a
                  display convenience, and the directory that runs is the whole path. */}
              {field.kind === 'missing' ? null : (
                <span className={css.workspacePath} data-workspace-path="" title={field.path}>
                  {field.path}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onChooseWorkspace} data-workspace-pick="">
              {t('skillCardChooseDirectory')}
            </Button>
            {clear}
          </div>
        )
        : (
          <>
            <WorkspacePathField
              value={stored}
              fieldKind={field.kind}
              problem={problem}
              t={t}
              onCommit={onSetWorkspace}
            />
            {/* The typed branch needs it as much as the picker's: a build with no chooser is
                exactly where a wrong path is likeliest, and emptying the box and pressing 应用
                is refused as an invalid path rather than read as "no directory". */}
            {clear === null ? null : <div className={css.workspaceRow}>{clear}</div>}
          </>
        )}
      {field.kind === 'invalid' && field.checked ? (
        <p className={css.fieldNote} data-workspace-invalid="">{t('skillCardProblemWorkspaceInvalid')}</p>
      ) : null}
      {/* Why this field asks for a path instead of offering a chooser: the build has none.
          Said once, quietly, and not as a failure of the user's card. */}
      {view.canChooseWorkspace ? null : (
        <p className={css.fieldNote} data-workspace-picker-unavailable="">
          {t('skillCardWorkspacePickerUnavailable')}
        </p>
      )}
    </>
  )
}
