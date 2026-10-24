/**
 * Component specs drive pure props, so the shared primitive widgets are
 * replaced by minimal elements: the workbench owns the composition under test
 * (which control exists, what it is labelled, what it reports), not the
 * primitives' own rendering. The real widgets stay covered by their own
 * package.
 */
import type { KeyboardEvent, ReactNode } from 'react'
import type { StateDotState } from '@deepseek-ai/dsh-client-ui-primitives'

/** Icon stub keeping the `size` prop observable in the DOM. */
export function icon(name: string) {
  return ({ size }: { size?: number }): ReactNode => <span data-icon={name} data-size={String(size)} />
}

/** Button stub forwarding the props the shell sets. */
export function Button({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>): ReactNode {
  return <button type="button" {...rest}>{children}</button>
}

/**
 * Build the primitives module mock.
 * @returns the mocked module surface the workbench imports.
 */
export function primitivesMock(): Record<string, unknown> {
  return {
    Button,
    StateDot: ({ state }: { state: StateDotState }): ReactNode => <span data-state-dot={state} />,
    IconChevronsUpDownOutlineRegular: icon('chevrons'),
    IconCloseOutlineMedium: icon('close'),
    IconGaugeOutlineRegular: icon('gauge'),
    IconRefreshOutlineMedium: icon('refresh'),
    IconThinkOutlineRegular: icon('think'),
    IconChevronDownOutlineRegular: icon('chevron-down'),
    IconAgentPresetOutlineRegular: icon('agent-preset'),
    IconApiOutlineRegular: icon('api'),
    IconBrowseOutlineRegular: icon('browse'),
    IconCodeOutlineRegular: icon('code'),
    IconEditOutlineRegular: icon('edit'),
    IconGlobeOutlineRegular: icon('globe'),
    IconPlanOutlineRegular: icon('plan'),
    IconQuestionOutlineRegular: icon('question'),
    IconSearchOutlineRegular: icon('search'),
    IconSparkleRegular: icon('sparkle'),
    TextShimmer: ({ children, className }: { children?: ReactNode; className?: string }): ReactNode => (
      <span className={className} data-shimmer="">{children}</span>
    ),
    /**
     * Stub of the 24px disclosure chrome: the header row toggles on click and
     * exposes the open state, so specs pin the workbench's composition (that a
     * click opens the body) without the primitives' own rendering.
     */
    DisclosureRow: ({ icon: rowIcon, title, open, expandable, onToggle, collapsedContent, children, rowClassName, titleClassName }: {
      icon?: ReactNode
      title?: ReactNode
      open?: boolean
      expandable?: boolean
      onToggle?: () => void
      collapsedContent?: ReactNode
      children?: ReactNode
      rowClassName?: string
      titleClassName?: string
    }): ReactNode => (
      <div data-disclosure-open={open || undefined} data-disclosure-expandable={expandable || undefined}>
        <div
          className={rowClassName}
          data-disclosure-row=""
          role={expandable ? 'button' : undefined}
          tabIndex={expandable ? 0 : undefined}
          aria-expanded={expandable ? open : undefined}
          onClick={() => { if (expandable) onToggle?.() }}
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (!expandable) return
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggle?.() }
          }}
        >
          <span className={titleClassName}>{rowIcon}{title}</span>
          {collapsedContent}
        </div>
        {open && children}
      </div>
    ),
    Menu: ({ open, items = [], anchor, onSelect }: {
      open: boolean
      items?: readonly { id: string; label?: ReactNode }[]
      anchor?: ReactNode
      onSelect?: (id: string) => void
    }): ReactNode => (
      <>
        {anchor}
        {open && (
          <div role="menu">
            {items.map(item => (
              <button key={item.id} type="button" role="menuitem" onClick={() => { onSelect?.(item.id) }}>
                {typeof item.label === 'string' ? item.label : item.id}
              </button>
            ))}
          </div>
        )}
      </>
    ),
  }
}
