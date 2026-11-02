/**
 * The directory a card runs in, and the two ways of naming it.
 *
 * A picker when the build ships one, a field when it does not. Both are in one component
 * because the question is one question: the configuration page and the run dialog ask it, and
 * a card that could pick a directory on one screen and only read it on the other would be the
 * bug this file exists to prevent — a card whose folder is wrong, and no way to say otherwise
 * on the screen where the run is pressed.
 *
 * A typed path is not the unconfirmed path this feature refused earlier: the Host is asked
 * whether it is a directory before anything is stored, the same check a run is gated on, so a
 * typo is answered rather than persisted.
 * @module dsh-workbench/client/skill-card/WorkspaceField
 */

import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { useEffect, useState, type ReactNode } from 'react'
import type { WorkbenchCardView } from './controller.ts'
import type { WorkbenchLocaleKey } from '../locales.ts'
import { classes } from './class-names.ts'
import css from './skill-card.module.css'

/** The sentence for a typed path the card did not take. */
const TYPED_PROBLEMS = {
  'invalid-path': 'skillCardWorkspaceTypedInvalid',
  'not-directory': 'skillCardWorkspaceTypedMissing',
} as const satisfies Record<string, WorkbenchLocaleKey>

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
}: {
  readonly view: WorkbenchCardView
  readonly t: (key: WorkbenchLocaleKey) => string
  readonly onChooseWorkspace: () => void
  readonly onSetWorkspace: (path: string) => void
}): ReactNode {
  const field = view.workspaceField
  const stored = field.kind === 'missing' ? '' : field.path
  const [typed, setTyped] = useState(stored)
  // The stored path is the field's resting value: a pick, or a run page that finally read the
  // card, must not leave yesterday's typo in the box.
  useEffect(() => { setTyped(stored) }, [stored])
  const problem = view.workspaceTypedProblem
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
          </div>
        )
        : (
          <div className={css.workspaceRow}>
            <input
              type="text"
              className={classes(
                css.workspaceInput,
                field.kind === 'invalid' || problem !== undefined ? css.workspaceInputInvalid : undefined,
              )}
              value={typed}
              spellCheck={false}
              autoComplete="off"
              placeholder={t('skillCardWorkspacePathPlaceholder')}
              aria-label={t('skillCardWorkspace')}
              data-workspace-field={field.kind}
              data-workspace-input=""
              onChange={(event) => { setTyped(event.target.value) }}
              // Enter is the whole gesture: the field and the button beside it are one
              // control, and a run dialog behind it must not take the key as its own.
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                onSetWorkspace(typed)
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              data-workspace-apply=""
              onClick={() => { onSetWorkspace(typed) }}
            >
              {t('skillCardWorkspaceApply')}
            </Button>
          </div>
        )}
      {problem === undefined
        ? null
        : (
          <p className={css.fieldNote} data-workspace-typed-problem={problem}>
            {t(TYPED_PROBLEMS[problem])}
          </p>
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
