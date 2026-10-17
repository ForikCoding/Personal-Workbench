/**
 * The skill card's editor: choose a skill, write the HTML, and preview it.
 *
 * It opens in place of the card body rather than in a modal: the shared
 * primitives expose no dialog, and inventing one here would put a second overlay
 * mechanism next to the application's own.
 * @module dsh-workbench/client/skill-card/SkillCardSettings
 */

import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorkbenchLocaleKey } from '../locales.ts'
import type { WorkbenchCardView } from './controller.ts'
import { analyzeTemplate } from './template.ts'
import type { WorkbenchTemplateViolationCode } from './template.ts'
import { ShadowHtml } from './ShadowHtml.tsx'
import css from './skill-card.module.css'

/** Props of the editor. */
export interface SkillCardSettingsProps {
  /** What the card currently shows. */
  readonly view: WorkbenchCardView
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey) => string
  /** Store a new skill selection. */
  readonly onChoose: (skill: string) => void
  /** Store the template. */
  readonly onSave: (template: string) => void
  /** Store the card's name; an empty value clears it back to the registered label. */
  readonly onRename: (name: string) => void
  /** Close the editor. */
  readonly onClose: () => void
}

/**
 * Render the card editor.
 *
 * The card remounts this component when the selected skill changes, so the draft
 * always starts from that skill's stored template.
 * @param props - the view, `t`, and the three actions.
 * @returns the editor element.
 */
export function SkillCardSettings(props: SkillCardSettingsProps): ReactNode {
  const { view, t, onChoose, onSave, onRename, onClose } = props
  const [draft, setDraft] = useState(view.template ?? '')
  const [name, setName] = useState(view.name ?? '')

  const analysis = useMemo(() => analyzeTemplate(draft), [draft])

  const options = view.catalog.filter(entry => entry.userInvocable)

  return (
    <div className={css.settings}>
      <label className={css.field}>
        <span className={css.fieldLabel}>{t('skillCardCardName')}</span>
        <input
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
      </label>
      <label className={css.field}>
        <span className={css.fieldLabel}>{t('skillCardSelectSkill')}</span>
        <select
          className={css.select}
          value={view.skill ?? ''}
          disabled={view.catalogStatus !== 'ready'}
          onChange={(event) => { onChoose(event.target.value) }}
        >
          <option value="">{t('skillCardSelectPlaceholder')}</option>
          {options.map(entry => <option key={entry.name} value={entry.name}>{entry.name}</option>)}
        </select>
      </label>
      {catalogNotice(view, options.length, t)}

      <textarea
        className={css.editor}
        value={draft}
        spellCheck={false}
        aria-label={t('skillCardTemplateLabel')}
        placeholder={t('skillCardTemplatePlaceholder')}
        onChange={(event) => { setDraft(event.target.value) }}
      />

      {analysis.violations.length === 0 ? null : (
        <ul className={css.violations}>
          {analysis.violations.map((violation, index) => (
            <li key={`${violation.code}-${String(index)}`}>
              {t(violationKey(violation.code))}
              {' · '}
              {violation.location}
            </li>
          ))}
        </ul>
      )}

      <div className={css.previewPane}>
        <span className={css.fieldLabel}>{t('skillCardPreview')}</span>
        <ShadowHtml html={draft} className={css.preview} />
      </div>

      <div className={css.settingsActions}>
        <Button
          variant="primary"
          size="sm"
          disabled={analysis.violations.length > 0 || draft.length === 0 || view.skill === undefined}
          onClick={() => { onSave(draft) }}
        >
          {t('skillCardSave')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>{t('skillCardClose')}</Button>
      </div>
    </div>
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
 * compilation here until it has copy.
 */
const VIOLATION_KEYS: Record<WorkbenchTemplateViolationCode, WorkbenchLocaleKey> = {
  'script': 'skillCardViolationScript',
  'event-attribute': 'skillCardViolationEvent',
  'unsafe-url': 'skillCardViolationUrl',
  'external-element': 'skillCardViolationExternal',
  'external-css': 'skillCardViolationCss',
  'region-missing': 'skillCardViolationRegionMissing',
  'region-unclosed': 'skillCardViolationRegionUnclosed',
  'region-repeated': 'skillCardViolationRegionRepeated',
  'placeholder-syntax': 'skillCardViolationPlaceholder',
}
