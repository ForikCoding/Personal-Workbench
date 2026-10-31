/**
 * One template read as structure rather than as source.
 *
 * The field beside this view is the only editor: this is the same text with each block's
 * inside hidden behind the line that opens it, so a three-hundred-line template can be read
 * as the dozen boxes it actually is. Every row is also a way back — a click hands the line
 * back to the field, selected — because folding is only half of what a long document needs;
 * the other half is arriving at the line you were looking for.
 * @module dsh-workbench/client/skill-card/TemplateFold
 */

import { useMemo, useState, type ReactNode } from 'react'
import type { WorkbenchLocaleKey } from '../locales.ts'
import { foldRows, type OutlineNode } from './template-outline.ts'
import css from './skill-card.module.css'

/** Props of the fold view. */
export interface TemplateFoldProps {
  /** The template source. */
  readonly text: string
  /** Its outline, as {@link import('./template-outline.ts').outline} reads it. */
  readonly nodes: readonly OutlineNode[]
  /** Translator. */
  readonly t: (key: WorkbenchLocaleKey, params?: Record<string, unknown>) => string
  /**
   * Called when a row is clicked.
   * @param line - zero-based line to show in the field.
   */
  readonly onReveal: (line: number) => void
}

/**
 * Render one template as foldable rows.
 * @param props - the text, its outline, the translator, and the way back.
 * @returns the fold view.
 */
export function TemplateFold({ text, nodes, t, onReveal }: TemplateFoldProps): ReactNode {
  // The fold is held here rather than by the page: it is a way of reading one document, and
  // leaving the view is the end of that reading.
  const [folded, setFolded] = useState<ReadonlySet<number>>(() => new Set<number>())
  const rows = useMemo(() => foldRows(text, nodes, folded), [text, nodes, folded])

  /**
   * Open or close one block.
   * @param id - the block's position in the outline.
   */
  const toggle = (id: number): void => {
    setFolded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** A control inside an `aria-hidden`-shaped list keeps focus where it was. */
  const keepFocus = (event: React.MouseEvent): void => { event.preventDefault() }

  return (
    <div className={css.foldView} data-template-fold="">
      {rows.map((row) => {
        const node = row.node
        return (
          <div key={row.line} className={css.foldRow} data-fold-line={row.number}>
            <button
              type="button"
              // Not a tab stop: one stop per line would bury every control after the editor,
              // and the field it hands over to is fully usable from the keyboard.
              tabIndex={-1}
              className={css.foldNumber}
              onMouseDown={keepFocus}
              onClick={() => { onReveal(row.line) }}
            >
              {row.number}
            </button>
            {node === undefined
              ? <span className={css.foldCaretBlank} aria-hidden="true" />
              : (
                <button
                  type="button"
                  tabIndex={-1}
                  className={css.foldCaret}
                  aria-expanded={row.closed === 0}
                  aria-label={t(row.closed === 0 ? 'skillCardFoldCollapse' : 'skillCardFoldExpand', { name: node.label })}
                  onMouseDown={keepFocus}
                  onClick={() => { toggle(node.id) }}
                >
                  {row.closed === 0 ? '▾' : '▸'}
                </button>
              )}
            <button
              type="button"
              tabIndex={-1}
              className={css.foldText}
              onMouseDown={keepFocus}
              onClick={() => { onReveal(row.line) }}
            >
              {/* A blank line is still a line, and a row that renders nothing collapses out
                  of the column and takes its number with it. */}
              {row.text === '' ? '\u00a0' : row.text}
            </button>
            {row.closed === 0
              ? null
              : <span className={css.foldCount}>{t('skillCardFoldLines', { count: String(row.closed) })}</span>}
          </div>
        )
      })}
    </div>
  )
}
