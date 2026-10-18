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
  WORKBENCH_ACTIONS_MARKER,
  WORKBENCH_ACTION_KEY_PATTERN,
  WORKBENCH_CARD_NAME_MAX_LENGTH,
  WORKBENCH_REGION_BEGIN,
  WORKBENCH_REGION_END,
  WORKBENCH_SKILL_NAME_MAX_LENGTH,
  regionMarkerPattern,
} from '../../skill-card-contract.ts'
import type { WorkbenchActionDeclaration, WorkbenchActionTarget } from '../../skill-card-contract.ts'
import { forbiddenAttributeReason, forbiddenElementReason, hasExternalCss } from './policy.ts'
import type { WorkbenchContentViolationCode } from './policy.ts'

/** Why one template cannot be used. */
export type WorkbenchTemplateViolationCode =
  | WorkbenchContentViolationCode
  | 'region-missing'
  | 'region-unclosed'
  | 'region-repeated'
  | 'placeholder-syntax'
  | 'action-declaration-duplicate'
  | 'action-key-invalid'
  | 'action-key-repeated'
  | 'action-target-invalid'
  | 'actions-inside-region'

/** One reason a template was refused. */
export interface WorkbenchTemplateViolation {
  /** What is wrong. */
  readonly code: WorkbenchTemplateViolationCode
  /** Where it is, in terms the user can find in their own document. */
  readonly location: string
  /** The offending text, when there is a specific one. */
  readonly token?: string
  /**
   * Index in the template text this violation points at, when one is known.
   *
   * Exact wherever the text is scanned directly — a region marker, a leftover
   * placeholder, or a line of the action block — because those scans hold the
   * match's own position.
   *
   * A deliberate **approximation** for the five content-policy codes: those are
   * found by walking a parsed DOM, which carries no source spans, so the reported
   * index is the first occurrence of the offending element's `<tag` in the text.
   * With two elements of the same kind it therefore points at the first one, not
   * necessarily at the offender; it is still on the right line for the common
   * case, which is what the editor uses it for. The field is absent when even that
   * anchor cannot be found: a reader must not invent a position it does not have.
   */
  readonly offset?: number | undefined
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
  /** Targets this template declares, in declaration order. */
  readonly actions: readonly WorkbenchActionDeclaration[]
  /** Everything that must be fixed before this template can run. */
  readonly violations: readonly WorkbenchTemplateViolation[]
}

/** One scan of the markers. Each refusal carries the marker it blames. */
type RegionScan =
  | { readonly kind: 'ok'; readonly region: WorkbenchTemplateRegion }
  | { readonly kind: 'missing' }
  | { readonly kind: 'unclosed'; readonly token: string; readonly offset: number }
  | { readonly kind: 'repeated'; readonly offset?: number | undefined }

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
  // intent cannot be recovered, so it is refused rather than guessed at. The extra
  // marker is what the reader has to delete, so the report points at the second
  // marker of the kind that was written twice.
  if (opens.length > 1 || closes.length > 1) {
    const extra = opens[1] ?? closes[1]
    return { kind: 'repeated', ...(extra === undefined ? {} : { offset: extra.index }) }
  }
  const open = opens[0]
  const close = closes[0]
  if (open === undefined || close === undefined) {
    // Exactly one of the pair is present; it is the marker the reader has to fix.
    const present = open ?? close
    return present === undefined
      ? { kind: 'missing' }
      : { kind: 'unclosed', token: present[0], offset: present.index }
  }
  const start = open.index + open[0].length
  const end = close.index
  // A closing marker before its opening one is not a region either.
  if (end < start) return { kind: 'unclosed', token: close[0], offset: close.index }
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
 * @returns the region it declares, the targets it declares, and every reason it cannot run.
 */
export function analyzeTemplate(html: string): WorkbenchTemplateAnalysis {
  const scan = scanRegion(html)
  const region = scan.kind === 'ok' ? scan.region : undefined
  const violations: WorkbenchTemplateViolation[] = []
  if (scan.kind === 'missing') violations.push({ code: 'region-missing', location: 'document' })
  if (scan.kind === 'unclosed') {
    violations.push({ code: 'region-unclosed', location: 'document', token: scan.token, offset: scan.offset })
  }
  if (scan.kind === 'repeated') {
    violations.push({
      code: 'region-repeated',
      location: 'document',
      ...(scan.offset === undefined ? {} : { offset: scan.offset }),
    })
  }

  const actions = analyzeActions(html, region, violations)

  // The placeholder language was removed. A template still written in it would render
  // its braces literally, so the residue is named instead of quietly ignored.
  const leftover = /\{\{[^{}]*\}\}/u.exec(html)
  if (leftover !== null) {
    violations.push({ code: 'placeholder-syntax', location: 'document', token: leftover[0], offset: leftover.index })
  }

  violations.push(...contentViolations(html))
  return { region, actions, violations }
}

/** One content-policy refusal, as a fragment editor reports it. */
export interface WorkbenchFragmentViolation {
  /** Which rule the fragment breaks. */
  readonly code: WorkbenchContentViolationCode
  /** Where it is, as a path rather than a character offset. */
  readonly location: string
  /** The offending tag or attribute name. */
  readonly token?: string
  /**
   * Approximate character offset, when the text holds an anchor for it.
   *
   * The five codes come from a parsed DOM, which carries no source spans, so this is the
   * first occurrence of the offending tag's `<tag`. It is good enough to put the caret on
   * the right line and must not be read as an exact position.
   */
  readonly offset?: number
}

/**
 * Read the content-policy refusals one fragment carries, and nothing else.
 *
 * A separate entry point rather than a filter over {@link analyzeTemplate}: a stored
 * result's region fragment is not a document, so it has no region markers and no
 * declaration block to analyse, and reporting those as violations would refuse an edit
 * for syntax that does not apply to it. The five content-policy rules do apply — the
 * renderer strips those constructs silently, so a fragment that carried one would store
 * a value whose offending part never reaches the screen.
 * @param html - the region fragment.
 * @returns the refusals, outermost first.
 */
export function analyzeFragment(html: string): readonly WorkbenchFragmentViolation[] {
  const found: WorkbenchFragmentViolation[] = []
  // Lowercased once: every report looks a tag up in it, and a fragment at the size limit
  // is walked many times.
  walk(parseTemplate(html), 'root', found, html.toLowerCase())
  return found
}

/** One action declaration block found in a template. */
interface ActionsBlock {
  readonly body: string
  readonly start: number
  readonly end: number
  /** Index of the body's first character, so a line can be blamed in place. */
  readonly bodyStart: number
}

/** One declaration line: `<key>: card "name"` or `<key>: skill "name"`. */
const ACTION_LINE = /^(\S+)\s*:\s*(card|skill)\s+"([^"]*)"$/u

/**
 * Read every declaration block in one template.
 * @param text - the template text.
 * @returns the blocks, outermost first.
 */
function scanActions(text: string): readonly ActionsBlock[] {
  const pattern = new RegExp(`<!--\\s*${WORKBENCH_ACTIONS_MARKER}\\b([\\s\\S]*?)-->`, 'g')
  return [...text.matchAll(pattern)].map((match) => {
    const body = match[1] ?? ''
    const end = match.index + match[0].length
    // The captured body is always the tail of the match minus its `-->`, so its
    // start is derived rather than searched for: a search would find the wrong
    // occurrence whenever the body repeats text from the marker itself.
    return { body, start: match.index, end, bodyStart: end - '-->'.length - body.length }
  })
}

/**
 * Locate the action-declaration block in one template.
 *
 * The editor draws this block as a second band in the gutter, so the range is
 * exposed separately from the analysis: a template may be refused for its
 * declarations and still be worth drawing.
 * @param text - the template text.
 * @returns the first block's character range, or undefined when there is none.
 */
export function findActionsBlock(text: string): { readonly start: number; readonly end: number } | undefined {
  const block = scanActions(text)[0]
  return block === undefined ? undefined : { start: block.start, end: block.end }
}

/**
 * Parse and validate the targets one template declares.
 *
 * A declaration sits outside the filled region on purpose: the region is rewritten on
 * every run, so a declaration written inside it survives exactly until the first run.
 * @param text - the template text.
 * @param region - the region it declares, when it has one.
 * @param violations - the accumulator.
 * @returns the usable declarations, in declaration order.
 */
function analyzeActions(
  text: string,
  region: WorkbenchTemplateRegion | undefined,
  violations: WorkbenchTemplateViolation[],
): readonly WorkbenchActionDeclaration[] {
  const blocks = scanActions(text)
  if (blocks.length === 0) return []
  if (blocks.length > 1) {
    // The second block is the one to delete, so that is where the reader is sent.
    violations.push({ code: 'action-declaration-duplicate', location: 'document', offset: blocks[1]?.start })
    return []
  }
  const block = blocks[0]
  if (block === undefined) return []
  if (region !== undefined && block.start >= region.start && block.end <= region.end) {
    violations.push({ code: 'actions-inside-region', location: 'document', offset: block.start })
    return []
  }
  const declarations: WorkbenchActionDeclaration[] = []
  const seen = new Set<string>()
  // Each reported line is blamed at its own absolute offset, at the first
  // non-blank character rather than at the start of the line: that is where the
  // offending token the same violation carries actually begins.
  let cursor = block.bodyStart
  for (const line of block.body.split('\n')) {
    const lineStart = cursor
    cursor += line.length + 1
    const trimmed = line.trim()
    // Blank lines and `#` comments keep the block readable without adding entries.
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const offset = lineStart + (line.length - line.trimStart().length)
    const match = ACTION_LINE.exec(trimmed)
    if (match === null) {
      violations.push({ code: 'action-target-invalid', location: 'document', token: trimmed, offset })
      continue
    }
    const key = match[1] ?? ''
    const kind = match[2] ?? ''
    const name = match[3] ?? ''
    if (!WORKBENCH_ACTION_KEY_PATTERN.test(key)) {
      violations.push({ code: 'action-key-invalid', location: 'document', token: key, offset })
      continue
    }
    if (seen.has(key)) {
      violations.push({ code: 'action-key-repeated', location: 'document', token: key, offset })
      continue
    }
    const limit = kind === 'card' ? WORKBENCH_CARD_NAME_MAX_LENGTH : WORKBENCH_SKILL_NAME_MAX_LENGTH
    if (name === '' || Array.from(name).length > limit) {
      violations.push({ code: 'action-target-invalid', location: 'document', token: trimmed, offset })
      continue
    }
    seen.add(key)
    const target: WorkbenchActionTarget = kind === 'card' ? { kind: 'card', name } : { kind: 'skill', name }
    declarations.push({ key, target })
  }
  return declarations
}

/**
 * Read every content-policy violation one document carries.
 * @param html - the template text.
 * @returns the violations, outermost first.
 */
function contentViolations(html: string): readonly WorkbenchTemplateViolation[] {
  // The document-level analysis reports the same five rules the fragment editor does; the
  // narrower return type is assignable to the wider violation shape.
  return analyzeFragment(html)
}

/**
 * Approximate where an element sits in the source text.
 *
 * A parsed DOM carries no source spans, so this is the first `<tag` in the text.
 * That is a real position — good enough to put the caret on the right line — but
 * it is the first element of that kind, which need not be the one being reported.
 * @param lowerHtml - the template text, lowercased.
 * @param tag - the element's lowercased tag name.
 * @returns the index of the first `<tag`, or undefined when the text has none.
 */
function approximateTagOffset(lowerHtml: string, tag: string): number | undefined {
  const index = lowerHtml.indexOf(`<${tag}`)
  return index < 0 ? undefined : index
}

/**
 * Report forbidden elements and attributes throughout one node.
 * @param node - the node to inspect.
 * @param path - the path to its parent, for the report.
 * @param found - the accumulator.
 * @param lowerHtml - the template text, lowercased, for approximate positions.
 */
function walk(
  node: Node,
  path: string,
  found: WorkbenchFragmentViolation[],
  lowerHtml: string,
): void {
  for (const child of [...node.childNodes]) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const element = child as Element
    const tag = element.tagName.toLowerCase()
    const here = `${path} > ${tag}`
    const offset = approximateTagOffset(lowerHtml, tag)
    const at = offset === undefined ? {} : { offset }
    const reason = forbiddenElementReason(element)
    if (reason !== undefined) {
      found.push({ code: reason, location: here, token: tag, ...at })
      continue
    }
    for (const attribute of [...element.attributes]) {
      const why = forbiddenAttributeReason(attribute.name, attribute.value)
      if (why !== undefined) found.push({ code: why, location: here, token: attribute.name, ...at })
    }
    // A stylesheet is only as offline as the references it makes.
    if (tag === 'style' && hasExternalCss(element.textContent ?? '')) {
      found.push({ code: 'external-css', location: here, token: 'style', ...at })
    }
    walk(element, here, found, lowerHtml)
  }
}
