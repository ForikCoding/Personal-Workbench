/**
 * The action-declaration builder: pick a key, a kind, and a target, and the editor
 * writes the line.
 *
 * The declaration block is the one place in a template where exact syntax is
 * memorised rather than seen: a key that does not match what the model emits, or a
 * `card` typed as `cards`, renders a card that looks right and refuses every click.
 * The panel removes the memorising, and refuses the two mistakes that are otherwise
 * only discovered in the analyser's list — a malformed key and a key declared twice.
 * @module dsh-workbench/client/skill-card/ActionDeclarationPanel
 */

import { useId, useState, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { WORKBENCH_ACTION_KEY_PATTERN } from '../../skill-card-contract.ts'
import type { WorkbenchActionTarget } from '../../skill-card-contract.ts'
import type { WorkbenchLocaleKey } from '../locales.ts'
import type { WorkbenchCatalogStatus } from './controller.ts'
import css from './skill-card.module.css'

/** Props of the declaration builder. */
export interface ActionDeclarationPanelProps {
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @param params - optional template parameters.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  /** Titles of every stored card: the names a card target may address. */
  readonly cardTitles: readonly string[]
  /** Skills a human may invoke: the names a skill target may address. */
  readonly skillNames: readonly string[]
  /** Whether that skill list could be read at all. */
  readonly catalogStatus: WorkbenchCatalogStatus
  /** Keys the template already declares; the panel refuses to declare one again. */
  readonly takenKeys: readonly string[]
  /**
   * Write the declaration.
   *
   * The owner closes the panel: what to do with a written line is the editor's
   * decision, not the form's.
   * @param key - the action key.
   * @param target - what that key resolves to.
   */
  readonly onInsert: (key: string, target: WorkbenchActionTarget) => void
  /** Close the panel without writing anything. */
  readonly onClose: () => void
}

/**
 * Render the declaration builder.
 * @param props - the choices available, the keys taken, and the two decisions.
 * @returns the panel.
 */
export function ActionDeclarationPanel(props: ActionDeclarationPanelProps): ReactNode {
  const { t, cardTitles, skillNames, catalogStatus, takenKeys, onInsert, onClose } = props
  const base = useId()
  const keyId = `${base}-key`
  const kindId = `${base}-kind`
  const targetId = `${base}-target`
  const captionId = `${base}-caption`
  const [key, setKey] = useState('')
  // The two target lists are picked from separately, so each keeps its own choice: a
  // user who flips the kind to look at the other list and flips back finds the card
  // they had already chosen.
  const [kind, setKind] = useState<WorkbenchActionTarget['kind']>('card')
  const [chosen, setChosen] = useState<{ readonly card: string; readonly skill: string }>({
    card: cardTitles[0] ?? '',
    skill: skillNames[0] ?? '',
  })

  const trimmed = key.trim()
  // Validating as the user types, rather than on confirm, is what makes the grammar
  // visible at the moment it is broken.
  const malformed = !WORKBENCH_ACTION_KEY_PATTERN.test(trimmed)
  const taken = !malformed && takenKeys.includes(trimmed)
  const target = chosen[kind]
  const options = kind === 'card' ? cardTitles : skillNames
  const confirmable = !malformed && !taken && target !== ''

  // An empty field is not a mistake yet, so it carries the grammar; a key that is
  // typed and wrong carries the reason it is wrong.
  const caption = trimmed === ''
    ? t('skillCardActionKeyHint')
    : malformed
      ? t('skillCardViolationActionKey')
      : taken
        ? t('skillCardActionKeyTaken')
        : t('skillCardActionKeyHint')

  const confirm = (): void => {
    if (!confirmable) return
    onInsert(trimmed, kind === 'card' ? { kind: 'card', name: target } : { kind: 'skill', name: target })
  }

  return (
    <div
      className={css.actionBuilder}
      role="group"
      aria-label={t('skillCardAddAction')}
      // Escape drops the form, the same way it drops the delete confirmation: a panel
      // opened by mistake must not need a second look to close.
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        onClose()
      }}
    >
      <div className={css.builderRow}>
        <div className={css.builderField}>
          <label className={css.fieldLabel} htmlFor={keyId}>{t('skillCardActionKey')}</label>
          <input
            id={keyId}
            className={css.select}
            type="text"
            value={key}
            spellCheck={false}
            autoFocus
            // The caption below states the grammar, so it also names the field it is
            // about: a reader who lands on the error never learns which field it means.
            aria-describedby={captionId}
            onChange={(event) => { setKey(event.target.value) }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              confirm()
            }}
          />
          <p
            id={captionId}
            className={clsx(css.hint, malformed || taken ? css.hintError : undefined)}
            data-action-key-caption=""
          >
            {caption}
          </p>
        </div>
        <div className={css.builderField}>
          <label className={css.fieldLabel} htmlFor={kindId}>{t('skillCardActionKind')}</label>
          <select
            id={kindId}
            className={css.select}
            value={kind}
            onChange={(event) => { setKind(event.target.value === 'skill' ? 'skill' : 'card') }}
          >
            <option value="card">{t('skillCardActionKindCard')}</option>
            <option value="skill">{t('skillCardActionKindSkill')}</option>
          </select>
        </div>
        <div className={css.builderField}>
          <label className={css.fieldLabel} htmlFor={targetId}>{t('skillCardActionTarget')}</label>
          <select
            id={targetId}
            className={css.select}
            value={target}
            onChange={(event) => {
              const next = event.target.value
              setChosen(previous => kind === 'card'
                ? { ...previous, card: next }
                : { ...previous, skill: next })
            }}
          >
            {options.length === 0 ? <option value="">{t('skillCardSelectPlaceholder')}</option> : null}
            {options.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      </div>
      {/* A disabled 确认 with nothing said about it is the state this panel exists to
          avoid: whoever cannot confirm has to be told what is missing. */}
      {options.length === 0 ? <p className={css.hint}>{t(emptyTargetKey(kind, catalogStatus))}</p> : null}
      <div className={css.settingsActions}>
        <Button variant="primary" size="sm" disabled={!confirmable} onClick={confirm}>
          {t('actionConfirm')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>{t('actionCancel')}</Button>
      </div>
    </div>
  )
}

/**
 * Name the reason a target picker holds nothing.
 * @param kind - which list is empty.
 * @param status - whether the skill list could be read.
 * @returns the locale key for the explanation.
 */
function emptyTargetKey(
  kind: WorkbenchActionTarget['kind'],
  status: WorkbenchCatalogStatus,
): WorkbenchLocaleKey {
  // An empty card list is a real fact about the workbench; an empty skill list is
  // either the catalog's verdict or its absence, and the two need different words.
  if (kind === 'card') return 'skillCardActionNoCards'
  if (status === 'ready') return 'skillCardCatalogEmpty'
  if (status === 'failed') return 'skillCardCatalogFailed'
  return 'skillCardCatalogLoading'
}
