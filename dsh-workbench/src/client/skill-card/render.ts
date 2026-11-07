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
import type { WorkbenchFilesListing, WorkbenchFilesText } from '../../skill-card-contract.ts'
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
 * Longest visible headline one run-history row shows, in code points.
 *
 * A row is one line in a list the user scans, so the headline is a preview, not the
 * document: 120 characters names the run's content without turning the list into the
 * result page.
 */
export const WORKBENCH_RESULT_HEADLINE_MAX_LENGTH = 120

/**
 * A line that is only an identifier — a task number, a defect key, a bare number.
 *
 * The suffix is part of the identifier: this backlog numbers sub-tasks `T202611024092-1`, and
 * the pattern used to accept only the prefix, so the very rows the rule exists to skip came
 * back. Four digits or fewer stay prose: `2026-10-27` is a date, not an identifier.
 */
const IDENTIFIER_LINE = /^(?:[A-Za-z]{1,4}[-_]?)?\d{5,}(?:[-_]\d{1,3})?$/

/**
 * The same identifier where a line *starts* with one and then says something.
 *
 * A table cell order puts the number and the name on one line — `<td>T202611024092-1</td>
 * <td>「开发」…</td>` reads as `T202611024092-1「开发」…` — so the number is a prefix of the
 * prose rather than a line of its own, and a rule about whole lines could not see it. The
 * separator is optional because the cells run together with no space between them.
 */
const IDENTIFIER_PREFIX = /^(?:[A-Za-z]{1,4}[-_]?)?\d{5,}(?:[-_]\d{1,3})?[\s:：]*/u

// Cells too: a table row read as one line runs its cells together — the number, the name and
// the status arrive as `T202611024092-1「开发」…待启动`, which is neither a name nor a status and
// cannot be told from prose by any rule about identifiers.
const BLOCK_BOUNDARY = /<\/(p|h[1-6]|div|li|td|th|tr|blockquote|pre|ul|ol|table|section|article|header|footer)>/gi

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

/**
 * The one line a run-history row shows as that run's content.
 *
 * The first visible line is not always the content: a generated document frequently opens
 * with its subject's identifier, so seven runs of one task each preview "T202610223746"
 * and the list reads as seven copies of one row. A marked summary — an element carrying
 * `data-dsh-summary` — wins, then the first heading, then the first line that is not an
 * identifier alone, and only then an identifier, because a row with something to say
 * always says it before falling back to a number.
 * @param html - the region HTML a stored result carries.
 * @returns the headline, truncated, or undefined when the fragment is all markup.
 */
export function resultHeadline(html: string): string | undefined {
  const candidates: string[] = []
  try {
    const host = document.createElement('div')
    host.innerHTML = html
    const marked = host.querySelector('[data-dsh-summary]')
    const markedText = singleLine(marked?.textContent ?? '')
    if (markedText !== '') {
      candidates.push(markedText)
    } else {
      const heading = host.querySelector('h1, h2, h3, h4')
      const headingText = singleLine(heading?.textContent ?? '')
      if (headingText !== '') candidates.push(headingText)
    }
  } catch {
    // A fragment the browser refuses is not one the card could render either.
    return undefined
  }
  for (const line of documentText(html).split('\n')) {
    const part = singleLine(line)
    // A line that opens with the identifier and then says something is read from the
    // identifier on: the number names the row, the words beside it say what the run found.
    const said = part.replace(IDENTIFIER_PREFIX, '')
    if (said !== '') candidates.push(said)
    else if (part !== '') candidates.push(part)
  }
  const line = candidates.find(part => !IDENTIFIER_LINE.test(part.replace(/[\s:：]/g, '')))
    ?? candidates[0]
  if (line === undefined) return undefined
  const points = Array.from(line)
  return points.length <= WORKBENCH_RESULT_HEADLINE_MAX_LENGTH
    ? line
    : `${points.slice(0, WORKBENCH_RESULT_HEADLINE_MAX_LENGTH).join('')}…`
}

/**
 * Fold one run of text onto a single line.
 * @param text - text that may carry newlines or runs of spaces.
 * @returns the collapsed line.
 */
function singleLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
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
  return template.slice(0, region.start) + withoutScripts(html) + template.slice(region.end)
}

/**
 * Remove the script elements one region fragment carries.
 *
 * The region is model-authored on every run, so a script in it is text a language model
 * wrote — refused here as well as by the analyser, because a stored result can reach the
 * screen without passing the editor that would have refused it. The template's own script is
 * untouched: it is outside the region, so it is not in this string.
 * @param html - the region fragment.
 * @returns the fragment with its scripts removed.
 */
export function withoutScripts(html: string): string {
  const fragment = parseTemplate(html)
  for (const script of [...fragment.querySelectorAll('script')]) script.remove()
  // Serialised through a template rather than a div: a template parses its content in the same
  // permissive context the region was parsed in, so a structure a div would refuse to hold is
  // written back as it came.
  const host = document.createElement('template')
  host.content.append(fragment)
  return host.innerHTML
}

/**
 * What one document's own script is given while it runs.
 *
 * Supplied by the card: the script is the template author's code, so it runs as the page runs
 * — but it has no way of its own to read the directory a run wrote into, which is the whole
 * reason this exists.
 */
export interface WorkbenchScriptBinding {
  /** The card the document belongs to. */
  readonly cardId: string
  /** The run the document shows, when it shows one. */
  readonly runId?: string | undefined
  /**
   * The file the app opened this document for, when it named one.
   *
   * A request, not a decision: a document that lists a directory decides for itself what to
   * show, and this is how the result tab's "open that file" reaches it. A template that
   * ignores it still renders, showing whatever it would have shown anyway.
   */
  readonly openFile?: string | undefined
  /** The root the document was rendered into. */
  readonly root: ShadowRoot
  /** The element that root belongs to. */
  readonly host: Element
  /** The card's documents, read through the Host. */
  readonly files: {
    /**
     * List one directory of the card's workspace.
     * @param path - path relative to the workspace, or absolute; empty names the workspace.
     * @returns the listing.
     */
    list(path: string): Promise<WorkbenchFilesListing>
    /**
     * Read one text file of the card's workspace.
     * @param path - path relative to the workspace, or absolute.
     * @returns the file's text and size.
     */
    read(path: string): Promise<WorkbenchFilesText>
  }
  /** Rendering one Markdown document into an element of the card's own tree. */
  readonly markdown: {
    /**
     * Render Markdown into one element.
     * @param element - the element to fill; it must be inside this document.
     * @param text - the Markdown source.
     */
    render(element: Element, text: string): Promise<void>
  }
}

/**
 * How one document's scripts are supplied with their binding.
 *
 * The card builds one binding per rendered document, so a script's `dsh` names the card it
 * was rendered in and not whichever card rendered last.
 */
export type WorkbenchScriptBinder = (input: {
  readonly cardId: string
  readonly runId?: string | undefined
  /** The file the app asked this document to open on. */
  readonly openFile?: string | undefined
  readonly root: ShadowRoot
  readonly host: Element
}) => WorkbenchScriptBinding

/** What one render needs to run the document's own scripts. */
export interface WorkbenchRenderRuntime {
  /** The card the document belongs to. */
  readonly cardId: string
  /** The run it shows, when it shows one. */
  readonly runId?: string | undefined
  /** The file the app asked this document to open on. */
  readonly openFile?: string | undefined
  /** Builds the binding each script sees. */
  readonly bind: WorkbenchScriptBinder
}

/**
 * Global the binding is published on while one document's scripts run.
 *
 * A global because a script element can only be given code, not a closure. The wrapper below
 * reads it synchronously at the moment the element runs, which is before the next document
 * renders, so no two documents can see each other's binding.
 */
const BINDING_GLOBAL = '__dshWorkbenchDocumentBinding__'

/**
 * Wrap one script's source so it receives its binding as a parameter.
 *
 * A parameter rather than a global lookup inside the script: the callbacks a script registers
 * outlive the render, and one that read the global later would read whatever the next
 * document published there.
 * @param source - the script as the template wrote it.
 * @returns the source to hand the element.
 */
export function bindDocumentScript(source: string): string {
  return [
    `(function (dsh) {`,
    source,
    ``,
    `})(globalThis.${BINDING_GLOBAL});`,
  ].join('\n')
}

/**
 * Render one document into a shadow root.
 *
 * The document is parsed inert, its scripts taken out, its forbidden constructs stripped, and
 * the rest adopted into the root. Only then are the scripts re-created and appended: a script
 * element that is inserted by the parser never runs, so running the template's code means
 * building a second element for it — which is also where the binding is attached.
 * @param root - the shadow root to fill; its previous children are replaced.
 * @param html - the complete document.
 * @param runtime - the card identity and binding factory; absent runs the document with no
 * binding, which is what a preview outside a card does.
 */
export function renderTemplate(root: ShadowRoot, html: string, runtime?: WorkbenchRenderRuntime): void {
  const content = parseTemplate(html)
  const scripts = takeScripts(content)
  stripForbidden(content, 'template')
  root.replaceChildren(content)
  if (scripts.length > 0) runScripts(root, scripts, runtime)
}

/**
 * Take the inline script elements out of one parsed document, in document order.
 *
 * Every script leaves the tree: the ones that carry their code are returned to be re-created
 * (a parsed one never runs), and the ones that name a URL are dropped.
 * @param node - the parsed document's fragment.
 * @returns what the allowed scripts carried.
 */
function takeScripts(node: DocumentFragment): { readonly type: string; readonly source: string }[] {
  const found: { readonly type: string; readonly source: string }[] = []
  for (const script of [...node.querySelectorAll('script')]) {
    // A script whose code lives at a URL is refused here rather than collected: it is taken
    // out of the tree on the way past, so the stripper never sees it to refuse it.
    if (script.hasAttribute('src')) {
      script.remove()
      continue
    }
    found.push({ type: script.getAttribute('type') ?? '', source: script.textContent ?? '' })
    script.remove()
  }
  return found
}

/**
 * Re-create and run one document's scripts.
 *
 * The binding is published only for the synchronous span in which the elements are appended,
 * and the wrapper hands it to the script as an argument, so an asynchronous callback keeps the
 * card's own binding. A script that carried its code elsewhere was stripped with the rest of
 * the forbidden constructs and never reaches here.
 * @param root - the root the document was rendered into.
 * @param scripts - the scripts, in document order.
 * @param runtime - the card identity and binding factory.
 */
function runScripts(
  root: ShadowRoot,
  scripts: readonly { readonly type: string; readonly source: string }[],
  runtime: WorkbenchRenderRuntime | undefined,
): void {
  const binding = runtime?.bind({
    cardId: runtime.cardId,
    ...runtime.runId === undefined ? {} : { runId: runtime.runId },
    ...runtime.openFile === undefined ? {} : { openFile: runtime.openFile },
    root,
    host: root.host,
  })
  const scope = globalThis as unknown as Record<string, unknown>
  if (binding === undefined) {
    for (const script of scripts) appendScript(root, script, false)
    return
  }
  scope[BINDING_GLOBAL] = binding
  try {
    for (const script of scripts) appendScript(root, script, true)
  } finally {
    Reflect.deleteProperty(scope, BINDING_GLOBAL)
  }
}

/**
 * Append one script element, which is what makes its code run.
 * @param root - the root to append into.
 * @param script - the type and source it carried.
 * @param bound - whether it is handed the document's binding.
 */
function appendScript(
  root: ShadowRoot,
  script: { readonly type: string; readonly source: string },
  bound: boolean,
): void {
  const element = document.createElement('script')
  if (script.type !== '') element.setAttribute('type', script.type)
  element.textContent = bound ? bindDocumentScript(script.source) : script.source
  root.append(element)
}

/**
 * Remove anything the document must not carry.
 *
 * Saving refuses these in a template, so removing them here covers the other source: a
 * fragment a model authored, which can carry a construct into the document that no
 * template ever held. The scope is what decides whether the document's own script is such a
 * construct: a template's is the user's code and stays, a region's has already been removed.
 * @param node - the node to clean.
 * @param scope - which half of the document this node came from.
 */
function stripForbidden(node: Node, scope: 'template' | 'region'): void {
  for (const child of [...node.childNodes]) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const element = child as Element
    // A stylesheet is only as offline as its references, so one that reaches outward
    // goes whole: removing just the reference would leave a half-applied sheet.
    if (element.tagName.toLowerCase() === 'style' && hasExternalCss(element.textContent ?? '')) {
      element.remove()
      continue
    }
    if (forbiddenElementReason(element, scope) !== undefined) {
      element.remove()
      continue
    }
    for (const attribute of [...element.attributes]) {
      if (forbiddenAttributeReason(attribute.name, attribute.value) !== undefined) {
        element.removeAttribute(attribute.name)
      }
    }
    stripForbidden(element, scope)
  }
}
