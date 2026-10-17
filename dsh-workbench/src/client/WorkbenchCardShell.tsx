/**
 * The shell every workbench card renders inside.
 *
 * The shell owns the frame, the reorder handle, and the removal action, so
 * every card looks and behaves alike. The card supplies its presentation facts
 * as props and its body as a local slot component.
 *
 * Two of those facts are opt-in: the status dot is drawn from `state` and the
 * refresh control from `onRefresh`, so a card that passes neither renders
 * neither — the shipped card renders its run state on its own result page
 * instead of on the card face.
 *
 * {@link WorkbenchCardShell} is the registered factory: it resolves the
 * framework seats and delegates to {@link WorkbenchCardShellView}, which takes
 * plain data so a component spec can drive it without render machinery.
 * @module dsh-workbench/client/WorkbenchCardShell
 */

import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { Button, IconChevronsUpDownOutlineRegular, IconCloseOutlineMedium, IconRefreshOutlineMedium, StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import type { StateDotState } from '@deepseek-ai/dsh-client-ui-primitives'
import type { FactoryComponentPropsOf, PropsRenderFactories, SlotComponent } from '@deepseek-ai/dsh-client-ui-slots'
import type { WorkbenchCardState } from './contract.ts'
import type { WorkbenchLocaleKey } from './locales.ts'
import { useWorkbenchReorder } from './WorkbenchCardGrid.tsx'
import css from './card.module.css'

/** Composed props of one `workbench.card` occurrence. */
export type WorkbenchCardShellProps = FactoryComponentPropsOf<'workbench.card'>

/** The shared state dot's semantics, keyed by the card's own state union. */
const STATE_DOT: Record<WorkbenchCardState, StateDotState> = {
  idle: 'idle',
  ongoing: 'ongoing',
  done: 'done',
  warning: 'warning',
  error: 'error',
}

/** Locale key holding each state's label. */
const STATE_KEY: Record<WorkbenchCardState, WorkbenchLocaleKey> = {
  idle: 'statusIdle',
  ongoing: 'statusOngoing',
  done: 'statusDone',
  warning: 'statusWarning',
  error: 'statusError',
}

/** Grid footprint class per span; `standard` keeps the auto-fill cell. */
const SPAN_CLASS: Record<string, string | undefined> = {
  standard: undefined,
  wide: css.spanWide,
  tall: css.spanTall,
  large: css.spanLarge,
}

/** Body rendered when a card selects no body component. */
const EmptyBody: SlotComponent<PropsRenderFactories> = () => null

/** Actions rendered when a card selects no actions component. */
const EmptyActions: SlotComponent<PropsRenderFactories> = () => null

/** Plain inputs of the shell's presentation. */
export interface WorkbenchCardShellViewProps {
  /** Card identity, used for the title's id and the shell's data attributes. */
  readonly id: string
  /** Card title, already localized by the providing plugin. */
  readonly title: string
  /** Optional secondary line. */
  readonly subtitle?: string | undefined
  /** Grid footprint; `standard` when omitted. */
  readonly span?: 'standard' | 'wide' | 'tall' | 'large' | undefined
  /** Status semantics; omitted draws no status dot. */
  readonly state?: WorkbenchCardState | undefined
  /** Status text; omitted falls back to the localized state name. */
  readonly status?: string | undefined
  /** Readable reason the body cannot render. */
  readonly failure?: string | undefined
  /** Grid position among the visible cards, one-based. */
  readonly position: number
  /** Whether the reorder handle is offered. */
  readonly reorderable: boolean
  /** Whether a drag session is running. */
  readonly dragging: boolean
  /** Card body. */
  readonly body?: ReactNode
  /** Card actions rendered beside the host's controls. */
  readonly actions?: ReactNode
  /** Refresh action; omitted hides the control. */
  readonly onRefresh?: (() => void) | undefined
  /**
   * Activate the card itself, opening whatever the card presents in full.
   *
   * The shell cannot wrap the card in a `<button>`: the card hosts its own controls
   * in the head action area, and a button inside a button is invalid markup that
   * browsers reparent. The card is therefore a labelled region with an activation
   * key handler, and the head action area stops its clicks from reaching it.
   * Omitted leaves the card inert.
   */
  readonly onActivate?: (() => void) | undefined
  /** Remove the card and everything stored for it; omitted renders no remove control. */
  readonly onRemove?: (() => void) | undefined
  /** Move by one position. */
  readonly onMoveBy: (delta: -1 | 1) => void
  /** Cancel the current drag session. */
  readonly onCancelDrag: () => void
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey) => string
}

/**
 * Render one card inside the shared shell.
 * @param props - card presentation facts and host callbacks.
 * @returns the card element.
 */
export function WorkbenchCardShellView({
  id,
  title,
  subtitle,
  span = 'standard',
  state,
  status,
  failure,
  position,
  reorderable,
  dragging,
  body,
  actions,
  onRefresh,
  onActivate,
  onRemove,
  onMoveBy,
  onCancelDrag,
  t,
}: WorkbenchCardShellViewProps): ReactNode {
  const titleId = `workbench-card-${id}`
  const statusText = status ?? (state === undefined ? undefined : t(STATE_KEY[state]))
  return (
    <article
      className={clsx(css.card, SPAN_CLASS[span], onActivate !== undefined && css.activatable)}
      aria-labelledby={titleId}
      data-card-id={id}
      data-card-position={String(position)}
      data-dragging={dragging ? '' : undefined}
      role={onActivate === undefined ? undefined : 'button'}
      tabIndex={onActivate === undefined ? undefined : 0}
      onClick={onActivate}
      onKeyDown={onActivate === undefined ? undefined : (event) => {
        // Inner controls keep their own activation: their key events bubble here.
        if (event.target !== event.currentTarget) return
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onActivate()
      }}
    >
      <header className={css.head}>
        <div className={css.headRow}>
          <h3 className={css.title} id={titleId}>{title}</h3>
          {statusText !== undefined && (
            <span className={css.status}>
              {state !== undefined && <StateDot state={STATE_DOT[state]} />}
              {statusText}
            </span>
          )}
          {/* The card's own controls are not the card: a click here must not also
              activate the region underneath. */}
          <div className={css.headActions} onClick={(event) => { event.stopPropagation() }}>
            {actions}
            {onRefresh !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                className={css.iconButton}
                aria-label={t('refreshAll')}
                onClick={onRefresh}
              >
                <IconRefreshOutlineMedium size={14} />
              </Button>
            )}
            {reorderable && (
              <Button
                variant="ghost"
                size="sm"
                className={clsx(css.iconButton, css.handle)}
                data-workbench-drag-handle={id}
                aria-label={t('dragHandle')}
                aria-pressed={dragging}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowUp') { event.preventDefault(); onMoveBy(-1) }
                  if (event.key === 'ArrowDown') { event.preventDefault(); onMoveBy(1) }
                  if (event.key === 'Escape') { event.preventDefault(); onCancelDrag() }
                }}
              >
                <IconChevronsUpDownOutlineRegular size={14} />
              </Button>
            )}
            {onRemove !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                className={css.iconButton}
                data-workbench-remove={id}
                aria-label={t('removeCard')}
                onClick={onRemove}
              >
                <IconCloseOutlineMedium size={14} />
              </Button>
            )}
          </div>
        </div>
        {subtitle !== undefined && <span className={css.subtitle}>{subtitle}</span>}
      </header>
      <div className={css.body}>
        {failure === undefined
          ? body
          : (
            <div className={css.failure}>
              <span>{t('cardFailed')}</span>
              <span>{failure}</span>
            </div>
          )}
      </div>
    </article>
  )
}

/**
 * Render one card through the framework's seats.
 * @param props - card presentation facts, occurrence props, and the shell's seats.
 * @returns the card element.
 */
export function WorkbenchCardShell({
  id,
  title,
  subtitle,
  span,
  state,
  status,
  onRefresh,
  onActivate,
  onRemove,
  failure,
  reorderable,
  position,
  useFactorySlot,
  t,
}: WorkbenchCardShellProps): ReactNode {
  const Body = useFactorySlot('body', EmptyBody)
  const Actions = useFactorySlot('actions', EmptyActions)
  const reorder = useWorkbenchReorder()
  return (
    <WorkbenchCardShellView
      id={id}
      title={title}
      subtitle={subtitle}
      span={span}
      state={state}
      status={status}
      failure={failure}
      position={position}
      reorderable={reorderable && reorder !== null}
      dragging={reorder?.dragging ?? false}
      body={<Body />}
      actions={<Actions />}
      onRefresh={onRefresh}
      onActivate={onActivate}
      onRemove={onRemove}
      onMoveBy={(delta) => { reorder?.moveBy(id, delta) }}
      onCancelDrag={() => { reorder?.end(false) }}
      t={key => t(key)}
    />
  )
}
