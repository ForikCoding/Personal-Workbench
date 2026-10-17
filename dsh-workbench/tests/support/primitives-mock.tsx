/**
 * Component specs drive pure props, so the shared primitive widgets are
 * replaced by minimal elements: the workbench owns the composition under test
 * (which control exists, what it is labelled, what it reports), not the
 * primitives' own rendering. The real widgets stay covered by their own
 * package.
 */
import type { ReactNode } from 'react'
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
