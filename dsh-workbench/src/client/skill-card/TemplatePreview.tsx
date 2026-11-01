/**
 * The card's template, drawn: what 预览 opens.
 *
 * The configuration page used to keep a live copy of this beside the editor, which meant a
 * shadow root per keystroke and — for a template that reads the workspace — a directory read
 * starting before the user had touched anything. The document is worth seeing, but it is
 * worth seeing on request, in a window of its own where it can be as tall as it likes
 * without stealing the editor's width.
 *
 * What is drawn is the draft, not the stored template: a user previewing a change wants the
 * change. Nothing here saves it.
 * @module dsh-workbench/client/skill-card/TemplatePreview
 */

import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ReactNode } from 'react'
import { Dialog } from './Dialog.tsx'
import type { WorkbenchLocaleKey } from '../locales.ts'
import { ShadowHtml } from './ShadowHtml.tsx'
import css from './skill-card.module.css'

/** What the preview window needs. */
export interface TemplatePreviewDialogProps {
  /** The template as it stands in the editor. */
  readonly html: string
  /** What the document below is: the rendered template, or the skeleton. */
  readonly caption: string
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey) => string
  /** Close the window; also what Escape, the corner control, and the backdrop do. */
  readonly onClose: () => void
}

/**
 * Render the preview over the configuration page.
 * @param props - the document, its caption, the translator, and the way out.
 * @returns the preview dialog, portalled to the document body.
 */
export function TemplatePreviewDialog({ html, caption, t, onClose }: TemplatePreviewDialogProps): ReactNode {
  return (
    <Dialog
      title={t('skillCardPreview')}
      hint={caption}
      closeLabel={t('promptClose')}
      size="wide"
      onClose={onClose}
      footer={<Button variant="ghost" size="md" onClick={onClose}>{t('skillCardClose')}</Button>}
    >
      {/* The document's own frame, inside the panel: the shadow root is the user's page, so
          only this well around it is styled here — and it is the thing that scrolls. */}
      <div className={css.previewFrame} data-template-preview-body="">
        <ShadowHtml html={html} className={css.preview} />
      </div>
    </Dialog>
  )
}
