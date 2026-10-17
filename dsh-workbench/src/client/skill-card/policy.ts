/**
 * What a card template may and may not contain.
 *
 * One home for the rules the analyser reports and the renderer strips. They have
 * to agree: a rule the analyser missed would be silently removed at render time,
 * which reads to the user as "my template works" until the output is missing.
 * @module dsh-workbench/client/skill-card/policy
 */

/**
 * Why one construct is refused on content grounds.
 *
 * The editor localizes these; nothing here is user-facing copy.
 */
export type WorkbenchContentViolationCode =
  | 'script'
  | 'event-attribute'
  | 'unsafe-url'
  | 'external-element'
  | 'external-css'

/**
 * Elements that would fetch or embed something from outside the card.
 *
 * A card is offline and must not become a tracking pixel, so these are refused
 * outright rather than only when they carry a remote URL.
 */
const EXTERNAL_ELEMENTS = new Set([
  'img', 'iframe', 'object', 'embed', 'link', 'video', 'audio', 'source', 'track', 'image', 'use',
])

/** Attributes whose value is a URL and therefore has to pass the scheme check. */
const URL_ATTRIBUTES = new Set([
  'href', 'src', 'srcset', 'action', 'formaction', 'poster', 'data', 'cite', 'background', 'xlink:href',
])

/** URL schemes a template may not use. */
const UNSAFE_URL = /^\s*(?:javascript|vbscript|data:text\/html)/i

/**
 * A CSS reference that would load something from outside the card.
 *
 * A fragment reference (`url(#id)`) stays allowed: it points inside the same
 * document, which is how an inline SVG filter or gradient is addressed.
 */
const EXTERNAL_CSS = /@import|url\(\s*(?!['"]?#)/i

/**
 * Why one element is refused.
 * @param element - the element to judge.
 * @returns the reason, or undefined when the element is allowed.
 */
export function forbiddenElementReason(element: Element): WorkbenchContentViolationCode | undefined {
  const tag = element.tagName.toLowerCase()
  if (tag === 'script') return 'script'
  if (tag === 'input') {
    return (element.getAttribute('type') ?? '').toLowerCase() === 'image' ? 'external-element' : undefined
  }
  return EXTERNAL_ELEMENTS.has(tag) ? 'external-element' : undefined
}

/**
 * Why one attribute is refused.
 * @param name - attribute name.
 * @param value - attribute value.
 * @returns the reason, or undefined when the attribute is allowed.
 */
export function forbiddenAttributeReason(name: string, value: string): WorkbenchContentViolationCode | undefined {
  const lower = name.toLowerCase()
  if (lower.startsWith('on')) return 'event-attribute'
  if (URL_ATTRIBUTES.has(lower) && UNSAFE_URL.test(value)) return 'unsafe-url'
  if (lower === 'style' && EXTERNAL_CSS.test(value)) return 'external-css'
  return undefined
}

/**
 * Whether one CSS source loads something from outside the card.
 * @param text - the CSS source.
 * @returns whether it carries an external reference.
 */
export function hasExternalCss(text: string): boolean {
  return EXTERNAL_CSS.test(text)
}
