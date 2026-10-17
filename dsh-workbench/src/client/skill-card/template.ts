/**
 * What one card template says, and whether it can run at all.
 *
 * A template is one document with one marked region. The region is what a child agent
 * fills; everything around it is kept exactly as written, and the comments inside it
 * carry the instruction. The analyser therefore answers two questions only: is there
 * exactly one usable region, and does the document carry anything it must not.
 * @module dsh-workbench/client/skill-card/template
 */

import {
  WORKBENCH_REGION_BEGIN,
  WORKBENCH_REGION_END,
  regionMarkerPattern,
} from '../../skill-card-contract.ts'
import { forbiddenAttributeReason, forbiddenElementReason, hasExternalCss } from './policy.ts'
import type { WorkbenchContentViolationCode } from './policy.ts'

/** Why one template cannot be used. */
export type WorkbenchTemplateViolationCode =
  | WorkbenchContentViolationCode
  | 'region-missing'
  | 'region-unclosed'
  | 'region-repeated'
  | 'placeholder-syntax'

/** One reason a template was refused. */
export interface WorkbenchTemplateViolation {
  /** What is wrong. */
  readonly code: WorkbenchTemplateViolationCode
  /** Where it is, in terms the user can find in their own document. */
  readonly location: string
  /** The offending text, when there is a specific one. */
  readonly token?: string
}

/** Where one region's content sits in the template text. */
export interface WorkbenchTemplateRegion {
  /** Index of the first character after the opening marker. */
  readonly start: number
  /** Index of the first character of the closing marker. */
  readonly end: number
}

/** What one template turned out to be. */
export interface WorkbenchTemplateAnalysis {
  /** The one region a child fills; undefined when the template has none. */
  readonly region: WorkbenchTemplateRegion | undefined
  /** Everything that must be fixed before this template can run. */
  readonly violations: readonly WorkbenchTemplateViolation[]
}

/** One scan of the markers. */
type RegionScan =
  | { readonly kind: 'ok'; readonly region: WorkbenchTemplateRegion }
  | { readonly kind: 'missing' }
  | { readonly kind: 'unclosed'; readonly token: string }
  | { readonly kind: 'repeated' }

/**
 * Parse template source into an inert fragment.
 *
 * A `template` element's content is inert: scripts do not run and referenced
 * resources do not load, which is what makes it safe to inspect arbitrary text.
 * Comments survive parsing, which matters because they are the instruction.
 * @param html - template source.
 * @returns the parsed content.
 */
export function parseTemplate(html: string): DocumentFragment {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content
}

/**
 * Scan one template for its region markers.
 * @param text - the template text.
 * @returns what the markers say.
 */
function scanRegion(text: string): RegionScan {
  const opens = [...text.matchAll(regionMarkerPattern(WORKBENCH_REGION_BEGIN))]
  const closes = [...text.matchAll(regionMarkerPattern(WORKBENCH_REGION_END))]
  if (opens.length === 0 && closes.length === 0) return { kind: 'missing' }
  // One region is the whole language. Two of either marker is a document whose
  // intent cannot be recovered, so it is refused rather than guessed at.
  if (opens.length > 1 || closes.length > 1) return { kind: 'repeated' }
  const open = opens[0]
  const close = closes[0]
  if (open === undefined) return { kind: 'unclosed', token: (close as RegExpMatchArray)[0] }
  if (close === undefined) return { kind: 'unclosed', token: open[0] }
  const start = open.index + open[0].length
  const end = close.index
  // A closing marker before its opening one is not a region either.
  if (end < start) return { kind: 'unclosed', token: close[0] }
  return { kind: 'ok', region: { start, end } }
}

/**
 * Locate the region a child fills.
 * @param text - the template text.
 * @returns its bounds, or undefined when there is not exactly one usable region.
 */
export function findRegion(text: string): WorkbenchTemplateRegion | undefined {
  const scan = scanRegion(text)
  return scan.kind === 'ok' ? scan.region : undefined
}

/**
 * Analyse one template.
 * @param html - the user's HTML.
 * @returns the region it declares and every reason it cannot run.
 */
export function analyzeTemplate(html: string): WorkbenchTemplateAnalysis {
  const scan = scanRegion(html)
  const violations: WorkbenchTemplateViolation[] = []
  if (scan.kind === 'missing') violations.push({ code: 'region-missing', location: 'document' })
  if (scan.kind === 'unclosed') {
    violations.push({ code: 'region-unclosed', location: 'document', token: scan.token })
  }
  if (scan.kind === 'repeated') violations.push({ code: 'region-repeated', location: 'document' })

  // The placeholder language was removed. A template still written in it would render
  // its braces literally, so the residue is named instead of quietly ignored.
  const leftover = /\{\{[^{}]*\}\}/u.exec(html)
  if (leftover !== null) {
    violations.push({ code: 'placeholder-syntax', location: 'document', token: leftover[0] })
  }

  violations.push(...contentViolations(html))
  return { region: scan.kind === 'ok' ? scan.region : undefined, violations }
}

/**
 * Read every content-policy violation one document carries.
 * @param html - the template text.
 * @returns the violations, outermost first.
 */
function contentViolations(html: string): readonly WorkbenchTemplateViolation[] {
  const found: WorkbenchTemplateViolation[] = []
  walk(parseTemplate(html), 'root', found)
  return found
}

/**
 * Report forbidden elements and attributes throughout one node.
 * @param node - the node to inspect.
 * @param path - the path to its parent, for the report.
 * @param found - the accumulator.
 */
function walk(node: Node, path: string, found: WorkbenchTemplateViolation[]): void {
  for (const child of [...node.childNodes]) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const element = child as Element
    const here = `${path} > ${element.tagName.toLowerCase()}`
    const reason = forbiddenElementReason(element)
    if (reason !== undefined) {
      found.push({ code: reason, location: here, token: element.tagName.toLowerCase() })
      continue
    }
    for (const attribute of [...element.attributes]) {
      const why = forbiddenAttributeReason(attribute.name, attribute.value)
      if (why !== undefined) found.push({ code: why, location: here, token: attribute.name })
    }
    // A stylesheet is only as offline as the references it makes.
    if (element.tagName.toLowerCase() === 'style' && hasExternalCss(element.textContent ?? '')) {
      found.push({ code: 'external-css', location: here, token: 'style' })
    }
    walk(element, here, found)
  }
}
