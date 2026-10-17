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

import { forbiddenAttributeReason, forbiddenElementReason, hasExternalCss } from './policy.ts'
import { findRegion, parseTemplate } from './template.ts'

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
