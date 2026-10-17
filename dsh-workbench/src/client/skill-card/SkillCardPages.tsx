/**
 * The two full-panel views one skill card opens into.
 *
 * A card is an index entry: its face carries the name, the skill, and the way into
 * configuration. The result and the configuration each take the whole display
 * column, because both are wider than a grid cell: the result is arbitrary HTML the
 * user authored, and the configuration is a name field, a skill picker, a template
 * editor, a field list, and a preview.
 *
 * Each page builds its own card controller rather than receiving one. That is what
 * makes the hook call legal: a page is mounted only while it is the current view,
 * so the controller runs only for the card on screen.
 * @module dsh-workbench/client/skill-card/SkillCardPages
 */

import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorkbenchLocaleKey } from '../locales.ts'
import type { WorkbenchSkillCardApi } from './api.ts'
import { useSkillCard } from './controller.ts'
import type { WorkbenchCardView } from './controller.ts'
import { SkillCardBody, problemKey } from './SkillCard.tsx'
import { SkillCardSettings } from './SkillCardSettings.tsx'
import css from './skill-card.module.css'

/**
 * Count the seconds a run has been in flight.
 * @param startedAt - the run's start, or undefined when nothing is running.
 * @returns whole elapsed seconds, ticking once a second, or undefined.
 */
function useElapsedSeconds(startedAt: number | undefined): number | undefined {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (startedAt === undefined) return
    const timer = setInterval(() => { setNow(Date.now()) }, 1000)
    return () => { clearInterval(timer) }
  }, [startedAt])
  return startedAt === undefined ? undefined : Math.max(0, Math.floor((now - startedAt) / 1000))
}

/**
 * State one line of text for whatever the run is doing.
 *
 * A run has to be legible at every moment: an inert page after pressing Run is what
 * this whole panel exists to prevent.
 * @param view - the card view.
 * @param elapsed - elapsed seconds while a run is in flight.
 * @param t - translator.
 * @returns the status text.
 */
function runStatusText(
  view: WorkbenchCardView,
  elapsed: number | undefined,
  t: (key: WorkbenchLocaleKey) => string,
): string {
  if (view.run?.phase === 'running') {
    return elapsed === undefined ? t('runStatusRunning') : `${t('runStatusRunning')} 路 ${String(elapsed)}s`
  }
  if (view.problem !== undefined) return t('runStatusFailed')
  if (view.run?.phase === 'cancelled') return t('runStatusCancelled')
  if (view.result !== undefined) return t('runStatusDone')
  return t('runStatusIdle')
}

/**
 * Render everything a finished run left behind.
 *
 * The structured value is what the template renders; the raw output, the stop reason,
 * and the provider's diagnostic are what answer "why is there no data".
 * @param props - the card view and the translator.
 * @returns the output block.
 */
function RunOutput({
  view,
  t,
}: {
  readonly view: WorkbenchCardView
  readonly t: (key: WorkbenchLocaleKey) => string
}): ReactNode {
  const result = view.result
  if (result === undefined) return null
  const structured = result.structured === undefined
    ? undefined
    : JSON.stringify(result.structured, null, 2)
  return (
    <details className={css.runOutput}>
      <summary className={css.runOutputSummary}>{t('runRawOutput')}</summary>
      <dl className={css.runFacts}>
        <dt>{t('runStopReason')}</dt>
        <dd>{result.stopReason}</dd>
        <dt>{t('runStartedAt')}</dt>
        <dd>{new Date(result.executedAt).toLocaleString()}</dd>
        {result.diagnostic === undefined ? null : (
          <>
            <dt>{t('runDiagnostic')}</dt>
            <dd>{result.diagnostic}</dd>
          </>
        )}
      </dl>
      {structured === undefined ? null : (
        <>
          <p className={css.runOutputLabel}>{t('runStructured')}</p>
          <pre className={css.runPre}>{structured}</pre>
        </>
      )}
      <p className={css.runOutputLabel}>{t('runRawOutput')}</p>
      {result.outputText === undefined || result.outputText.trim() === ''
        ? <p className={css.noticeBody}>{t('runNoOutput')}</p>
        : <pre className={css.runPre}>{result.outputText}</pre>}
    </details>
  )
}

/** What both pages need to show and change one card. */
export interface SkillCardPageProps {
  /** Transport. */
  readonly api: WorkbenchSkillCardApi
  /** Card being shown. */
  readonly cardId: string
  /**
   * Resolve the session a run hangs off.
   * @returns the session id, or undefined when none is available.
   */
  readonly runSessionId: () => string | undefined
  /** Shown in place of the name while the card has none. */
  readonly fallbackTitle: string
  /** Leave the page and return to the grid. */
  readonly onBack: () => void
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey) => string
}

/**
 * Render the card's result in the whole display column, with its run control.
 * @param props - transport, card identity, session resolver, title fallback, back, and `t`.
 * @returns the result page.
 */
export function SkillCardResultPage(props: SkillCardPageProps): ReactNode {
  const { api, cardId, runSessionId, fallbackTitle, onBack, t } = props
  const { view, actions } = useSkillCard({ api, cardId, sessionId: runSessionId() })
  const running = view.run?.phase === 'running'
  const elapsed = useElapsedSeconds(running ? view.run?.startedAt : undefined)
  return (
    <section className={css.pageView}>
      <header className={css.pageViewHead}>
        <Button variant="ghost" size="sm" onClick={onBack}>{t('skillCardBack')}</Button>
        <h2 className={css.pageViewTitle}>{view.name ?? fallbackTitle}</h2>
        {view.skill !== undefined && <span className={css.pageViewSubtitle}>{view.skill}</span>}
        {/* The run control lives here: this is the page that shows what a run produces. */}
        <Button
          variant="primary"
          size="sm"
          disabled={!running && !view.runnable}
          onClick={running ? actions.cancel : actions.run}
        >
          {running ? t('skillCardCancel') : t('skillCardRun')}
        </Button>
      </header>
      <p className={css.runStatus} data-run-status={view.run?.phase ?? 'idle'}>
        {runStatusText(view, elapsed, t)}
      </p>
      {view.problem === undefined ? null : (
        <p className={css.runProblem} role="alert">
          {t(problemKey(view.problem.code))}
          {view.problem.detail === '' ? '' : ` 路 ${view.problem.detail}`}
        </p>
      )}
      <SkillCardBody view={view} t={t} />
      <RunOutput view={view} t={t} />
    </section>
  )
}

/**
 * Render the card's configuration in the whole display column.
 * @param props - transport, card identity, session resolver, title fallback, back, and `t`.
 * @returns the configuration page.
 */
export function SkillCardConfigPage(props: SkillCardPageProps): ReactNode {
  const { api, cardId, runSessionId, fallbackTitle, onBack, t } = props
  const { view, actions } = useSkillCard({ api, cardId, sessionId: runSessionId(), withCatalog: true })
  return (
    <section className={css.pageView}>
      <header className={css.pageViewHead}>
        <Button variant="ghost" size="sm" onClick={onBack}>{t('skillCardBack')}</Button>
        <h2 className={css.pageViewTitle}>{view.name ?? fallbackTitle}</h2>
        {view.skill !== undefined && <span className={css.pageViewSubtitle}>{view.skill}</span>}
        {/* Removing a card belongs where the card is managed. Leaving is deferred
            until the Host has committed, so the grid cannot read the card again. */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { void actions.remove().then(onBack) }}
        >
          {t('skillCardDelete')}
        </Button>
      </header>
      <SkillCardSettings
        // Keyed on the skill so the draft re-seeds from that skill's template.
        key={view.skill ?? ''}
        view={view}
        t={t}
        onChoose={actions.chooseSkill}
        onSave={actions.saveTemplate}
        onRename={actions.rename}
        onClose={onBack}
      />
    </section>
  )
}
