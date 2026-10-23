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
 * whole must stop the click, never fall back to whatever could be read.
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
  // No payload is not an empty payload: the row's fields are what the run receives.
  if (raw === null) return { kind: 'invalid', reason: 'malformed-payload' }
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
