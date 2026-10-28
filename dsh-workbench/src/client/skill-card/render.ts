/**
 * Turn one stored result into the document a card shows.
 *
 * A template is a whole document whose skeleton stays exactly as the user wrote it; the
 * marked region is the only part a child agent authors. So the region's HTML is spliced
 * into the raw template text and the assembled document is cleaned once, here.
 *
 * The cleaning is load-bearing rather than a backstop now: the fragment came from a
 * model, which read the template, the skill, and whatever the skill's tools returned.
 * @module dsh-workbench/client/skill-card/render
 */

import {
  WORKBENCH_ACTION_ATTRIBUTE,
  WORKBENCH_ACTION_KEY_PATTERN,
  WORKBENCH_ACTION_PAYLOAD_MAX_BYTES,
  WORKBENCH_PAYLOAD_ATTRIBUTE,
} from '../../skill-card-contract.ts'
import { forbiddenAttributeReason, forbiddenElementReason, hasExternalCss } from './policy.ts'
import { findRegion, parseTemplate } from './template.ts'

/**
 * What one click on a child-authored button turned into.
 *
 * `invalid` is a first-class outcome, not an exception: a payload that cannot be read
 * whole must stop the click, never fall back to whatever could be read. A missing
 * payload is its own reason, and it keeps the key: the controller answers one by
 * carrying the card's own document to the target instead of refusing the whole ask.
 */
export type WorkbenchActionEvent =
  | {
    readonly kind: 'action'
    readonly key: string
    /** That row's raw fields, exactly as the child reported them. */
    readonly payload: Record<string, unknown>
  }
  | {
    readonly kind: 'invalid'
    readonly reason: 'missing-payload'
    /** The action the button still means; needed to carry the document on. */
    readonly key: string
  }
  | {
    readonly kind: 'invalid'
    readonly reason: 'missing-action' | 'malformed-payload' | 'oversized-payload'
  }

/**
 * Read one clicked button's action and payload.
 *
 * The order is the contract: size, then JSON, then shape, then key. A payload that
 * breaks any step refuses the whole click, because a partially-read payload would make
 * the confirmed parameters and the executed parameters two different things.
 * @param element - the element that carries the action attributes.
 * @returns the action, or why it cannot be used.
 */
export function readActionEvent(element: Element): WorkbenchActionEvent {
  const raw = element.getAttribute(WORKBENCH_PAYLOAD_ATTRIBUTE)
  // No payload is not an error: a button that carries no row still names an action, and
  // the controller answers it by sending the card's own document as the row data. A
  // button whose payload is present but unreadable is refused, because running on the
  // readable part would act on different data than the panel showed.
  if (raw === null) {
    const key = (element.getAttribute(WORKBENCH_ACTION_ATTRIBUTE) ?? '').trim()
    return { kind: 'invalid', reason: 'missing-payload', key }
  }
  if (new TextEncoder().encode(raw).length > WORKBENCH_ACTION_PAYLOAD_MAX_BYTES) {
    return { kind: 'invalid', reason: 'oversized-payload' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // An attribute broken by an unescaped quote lands here, which is the point.
    return { kind: 'invalid', reason: 'malformed-payload' }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { kind: 'invalid', reason: 'malformed-payload' }
  }
  const key = (element.getAttribute(WORKBENCH_ACTION_ATTRIBUTE) ?? '').trim()
  if (!WORKBENCH_ACTION_KEY_PATTERN.test(key)) return { kind: 'invalid', reason: 'missing-action' }
  return { kind: 'action', key, payload: parsed as Record<string, unknown> }
}


/**
 * Read the HTML one stored result carries.
 * @param value - the result's structured value.
 * @returns the HTML, or undefined when the value carries none — including a result
 * stored by a build that filled named values instead of a region.
 */
export function resultHtml(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const html = (value as { html?: unknown }).html
  return typeof html === 'string' && html.trim() !== '' ? html : undefined
}

/**
 * Longest visible summary one run-history row shows, in code points.
 *
 * A row is one line in a list the user scans, so the summary is a preview, not the
 * document: 120 characters names the run's content without turning the list into the
 * result page.
 */
export const WORKBENCH_RESULT_SUMMARY_MAX_LENGTH = 120

/**
 * Read the first line of visible text out of one region fragment.
 *
 * Block-level elements each start their own line (a heading and its paragraph are two
 * lines, not one run-on), and an explicit newline does too; the very first line of the
 * fragment is the summary. Scripts never run: the fragment is not attached, and the
 * cleaning pass that a rendered document gets is not applied to a list preview. A
 * fragment with no visible text has no summary.
 * @param html - the region HTML a stored result carries.
 * @returns the first line, truncated, or undefined when the fragment is all markup.
 */
const BLOCK_BOUNDARY = /<\/(p|h[1-6]|div|li|tr|blockquote|pre|ul|ol|table|section|article|header|footer)>/gi

/**
 * The visible text of one document, block boundaries as line breaks.
 *
 * The payload a button carries to another card when it has no row of its own: the target
 * reads the source card's content, not its markup — a child that received the HTML
 * would have to pick prose out of tags. The whole document is what the user is looking
 * at, so nothing is truncated; consecutive blank lines fold to one, and each line's
 * leading whitespace is dropped.
 * @param html - a complete document, or a region fragment; either cleans the same way.
 * @returns the visible text, or an empty string when the browser refuses the markup.
 */
export function documentText(html: string): string {
  try {
    const host = document.createElement('div')
    host.innerHTML = html.replace(BLOCK_BOUNDARY, '$&\n')
    // A style or script element's own text is markup, not prose: a `<style>` rule would
    // read as a paragraph of content to whatever receives the text.
    for (const stray of [...host.querySelectorAll('style, script')]) stray.remove()
    const cleaned: string[] = []
    let previousBlank = false
    for (const line of (host.textContent ?? '').split('\n')) {
      const part = line.replace(/\s+/g, ' ').trim()
      const blank = part === ''
      if (blank && previousBlank) continue
      cleaned.push(part)
      previousBlank = blank
    }
    return cleaned.join('\n').trim()
  } catch {
    // A document the browser refuses is not one a card could render either.
    return ''
  }
}

export function resultSummary(html: string): string | undefined {
  let text = ''
  try {
    const host = document.createElement('div')
    // A closing block tag is a line break even though the browser's textContent flattens
    // it: "first line" is the first paragraph, not the whole first run of paragraphs.
    host.innerHTML = html.replace(BLOCK_BOUNDARY, '$&\n')
    text = host.textContent ?? ''
  } catch {
    // A fragment the browser refuses is not one the card could render either.
    return undefined
  }
  const line = text.split('\n').map(part => part.trim()).find(part => part !== '')
  if (line === undefined) return undefined
  const points = Array.from(line)
  return points.length <= WORKBENCH_RESULT_SUMMARY_MAX_LENGTH
    ? line
    : `${points.slice(0, WORKBENCH_RESULT_SUMMARY_MAX_LENGTH).join('')}…`
}

/**
 * Splice one result's HTML into its template's region.
 * @param template - the template as stored.
 * @param html - the region content the result carries.
 * @returns the document to render; the template unchanged when it has no region.
 */
export function filledTemplate(template: string, html: string): string {
  const region = findRegion(template)
  if (region === undefined) return template
  return template.slice(0, region.start) + html + template.slice(region.end)
}

/**
 * Render one document into a shadow root.
 * @param root - the shadow root to fill; its previous children are replaced.
 * @param html - the complete document.
 */
export function renderTemplate(root: ShadowRoot, html: string): void {
  const content = parseTemplate(html)
  stripForbidden(content)
  root.replaceChildren(content)
}

/**
 * Remove anything the document must not carry.
 *
 * Saving refuses these in a template, so removing them here covers the other source: a
 * fragment a model authored, which can carry a construct into the document that no
 * template ever held.
 * @param node - the node to clean.
 */
function stripForbidden(node: Node): void {
  for (const child of [...node.childNodes]) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const element = child as Element
    // A stylesheet is only as offline as its references, so one that reaches outward
    // goes whole: removing just the reference would leave a half-applied sheet.
    if (element.tagName.toLowerCase() === 'style' && hasExternalCss(element.textContent ?? '')) {
      element.remove()
      continue
    }
    if (forbiddenElementReason(element) !== undefined) {
      element.remove()
      continue
    }
    for (const attribute of [...element.attributes]) {
      if (forbiddenAttributeReason(attribute.name, attribute.value) !== undefined) {
        element.removeAttribute(attribute.name)
      }
    }
    stripForbidden(element)
  }
}
