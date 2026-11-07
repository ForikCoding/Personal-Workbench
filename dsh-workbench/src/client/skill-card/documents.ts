/**
 * The binding a card document's own script receives, and the one read it exists for.
 *
 * A template is the user's HTML, and its script is the user's code: that code runs when the
 * card renders. What it cannot do is reach the filesystem, because a page has no such API —
 * so the two questions a document reader asks ("what is in this directory", "what does this
 * file say") are answered through the Host's document route, and the Markdown those files
 * hold is rendered with the application's own renderer.
 *
 * Both halves are deliberately small: three functions a template author can learn from one
 * example, and no general bridge to the page or the Host.
 * @module dsh-workbench/client/skill-card/documents
 */

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import type { MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorkbenchLocaleKey } from '../locales.ts'
import type { WorkbenchScriptBinder, WorkbenchScriptBinding } from './render.ts'
// The bodies the route answers with are validated in one lean module, because the panel
// reads the same listing through the card API and must not drag React along to do it.
import { parseListing, parseText } from './files-wire.ts'

export { parseListing, parseText } from './files-wire.ts'
import type {
  WorkbenchFileErrorCode,
  WorkbenchFilesListing,
  WorkbenchFilesText,
} from '../../skill-card-contract.ts'
import {
  WORKBENCH_SKILL_CARD_FILES_PATH,
} from '../../skill-card-contract.ts'

/** Fetch seam so tests can drive the route without a server. */
export type DocumentFetch = (input: string, init?: RequestInit) => Promise<Response>

/** What the binder needs from its owner. */
export interface WorkbenchDocumentBinderOptions {
  /**
   * Translate one workbench string.
   * @param key - dictionary key.
   * @returns the localized text.
   */
  readonly t: (key: WorkbenchLocaleKey) => string
  /** Transport; defaults to `globalThis.fetch`. */
  readonly fetcher?: DocumentFetch
}

/**
 * One failure a document read reported, as the script sees it.
 *
 * An Error rather than a result object, because the script that asks is ordinary code writing
 * `try`/`catch`: a rejection it can catch is the shape it already knows.
 */
export class WorkbenchDocumentError extends Error {
  /**
   * @param code - the route's failure code.
   * @param message - the sentence to show.
   */
  constructor(
    readonly code: WorkbenchFileErrorCode | 'unreachable',
    message: string,
  ) {
    super(message)
    this.name = 'WorkbenchDocumentError'
  }
}

/**
 * Build the binder the renderer hands each document's script.
 * @param options - translator and transport seam.
 * @returns the binder.
 */
export function createWorkbenchDocumentBinder(options: WorkbenchDocumentBinderOptions): WorkbenchScriptBinder {
  const fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init))
  const t = options.t
  const labels = markdownLabels(t)

  return (input) => {
    const files = {
      list: async (path: string): Promise<WorkbenchFilesListing> =>
        await requestListing(fetcher, input.cardId, path, t),
      read: async (path: string): Promise<WorkbenchFilesText> =>
        await requestText(fetcher, input.cardId, path, t),
    }
    const binding: WorkbenchScriptBinding = {
      cardId: input.cardId,
      ...input.runId === undefined ? {} : { runId: input.runId },
      root: input.root,
      host: input.host,
      files,
      markdown: {
        render: async (element, text) => {
          renderMarkdown(element, text, labels)
        },
      },
    }
    return binding
  }
}

/**
 * Ask the Host for one directory listing.
 * @param fetcher - transport.
 * @param cardId - the card whose workspace is being read.
 * @param path - path within it, empty for the workspace itself.
 * @param t - translator, for a failure sentence.
 * @returns the listing.
 * @throws {WorkbenchDocumentError} when the route refuses or cannot answer.
 */
async function requestListing(
  fetcher: DocumentFetch,
  cardId: string,
  path: string,
  t: (key: WorkbenchLocaleKey) => string,
): Promise<WorkbenchFilesListing> {
  const body = await requestDocument(fetcher, cardId, path, t)
  const listing = parseListing(body)
  if (listing === undefined) {
    throw new WorkbenchDocumentError('unreachable', t('documentProblemUnreadable'))
  }
  return listing
}

/**
 * Ask the Host for one file's text.
 * @param fetcher - transport.
 * @param cardId - the card whose workspace is being read.
 * @param path - the file's path within it.
 * @param t - translator, for a failure sentence.
 * @returns the text and size.
 * @throws {WorkbenchDocumentError} when the route refuses or cannot answer.
 */
async function requestText(
  fetcher: DocumentFetch,
  cardId: string,
  path: string,
  t: (key: WorkbenchLocaleKey) => string,
): Promise<WorkbenchFilesText> {
  const body = await requestDocument(fetcher, cardId, path, t)
  const file = parseText(body)
  if (file === undefined) {
    throw new WorkbenchDocumentError('unreachable', t('documentProblemUnreadable'))
  }
  return file
}

/**
 * Send one document request and return its decoded body.
 * @param fetcher - transport.
 * @param cardId - the card whose workspace is being read.
 * @param path - the path to read.
 * @param t - translator, for a failure sentence.
 * @returns the decoded body.
 * @throws {WorkbenchDocumentError} for a refused or unreadable answer.
 */
async function requestDocument(
  fetcher: DocumentFetch,
  cardId: string,
  path: string,
  t: (key: WorkbenchLocaleKey) => string,
): Promise<unknown> {
  const query = `?cardId=${encodeURIComponent(cardId)}&path=${encodeURIComponent(path)}`
  let response: Response
  try {
    response = await fetcher(`${WORKBENCH_SKILL_CARD_FILES_PATH}${query}`, {
      method: 'GET',
      credentials: 'same-origin',
      redirect: 'error',
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    })
  } catch (error) {
    throw new WorkbenchDocumentError(
      'unreachable',
      `${t('documentProblemUnreachable')}${error instanceof Error ? ` · ${error.message}` : ''}`,
    )
  }
  const body = await readJson(response)
  if (response.ok) return body
  const failure = failureOf(body)
  const code = failure?.code
  const key = code === undefined || !(code in ERROR_KEYS)
    ? 'documentProblemUnreachable'
    : ERROR_KEYS[code as WorkbenchFileErrorCode]
  throw new WorkbenchDocumentError(
    (code ?? 'unreachable') as WorkbenchFileErrorCode | 'unreachable',
    key === undefined
      ? t('documentProblemUnreachable')
      : failure?.message === undefined ? t(key) : `${t(key)} · ${failure.message}`,
  )
}

/**
 * Locale key for every failure the document route reports.
 *
 * A record rather than a lookup with a fallback, so a code added to the wire fails compilation
 * here until it has copy.
 */
const ERROR_KEYS: Record<WorkbenchFileErrorCode, WorkbenchLocaleKey> = {
  'unauthorized': 'documentProblemForbidden',
  'forbidden': 'documentProblemForbidden',
  'invalid-request': 'documentProblemPath',
  'invalid-card': 'documentProblemCard',
  'no-workspace': 'documentProblemNoWorkspace',
  'outside-workspace': 'documentProblemOutside',
  'not-found': 'documentProblemNotFound',
  'not-directory': 'documentProblemNotDirectory',
  'not-file': 'documentProblemNotFile',
  'not-text': 'documentProblemNotText',
  'too-large': 'documentProblemTooLarge',
}

/**
 * Read one response body as JSON.
 * @param response - the response.
 * @returns the decoded value, or undefined when it is not JSON.
 */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

/**
 * Read the error fields of one body.
 * @param body - the decoded body.
 * @returns the code and message, or undefined when the body is not an error.
 */
function failureOf(body: unknown): { readonly code?: string; readonly message?: string } | undefined {
  if (typeof body !== 'object' || body === null) return undefined
  const error = (body as { error?: unknown }).error
  if (typeof error !== 'object' || error === null) return undefined
  const fields = error as { code?: unknown; message?: unknown }
  return {
    ...typeof fields.code === 'string' ? { code: fields.code } : {},
    ...typeof fields.message === 'string' ? { message: fields.message } : {},
  }
}


/** Copy the application's Markdown chrome needs, built once per translator. */
const LABEL_CACHE = new WeakMap<(key: WorkbenchLocaleKey) => string, MarkdownLabels>()

/**
 * The Markdown chrome labels for one translator.
 * @param t - translator.
 * @returns reference-stable labels, which the renderer caches by identity.
 */
function markdownLabels(t: (key: WorkbenchLocaleKey) => string): MarkdownLabels {
  const cached = LABEL_CACHE.get(t)
  if (cached !== undefined) return cached
  const labels: MarkdownLabels = {
    code: { copyLabel: t('documentCopy'), copiedLabel: t('documentCopied') },
    footnotes: t('documentFootnotes'),
  }
  LABEL_CACHE.set(t, labels)
  return labels
}

/** React roots already mounted for one element of a rendered document. */
const MOUNTED = new WeakMap<Element, Root>()

/**
 * Render one Markdown document into an element of a card's own tree.
 *
 * The application's Markdown stylesheet is compiled against elements in the light DOM, so the
 * text is rendered inside a shadow root of its own and that root adopts the page's stylesheets:
 * the document then reads exactly as the assistant's messages do, while the containing card's
 * own CSS stays outside it. A page whose stylesheets cannot be read (an engine without
 * constructable stylesheets) still shows the document, unstyled rather than not at all.
 * @param element - the element to fill; it is emptied of the previous document.
 * @param text - the Markdown source.
 * @param labels - localized chrome.
 */
function renderMarkdown(element: Element, text: string, labels: MarkdownLabels): void {
  // A build whose primitives carry no renderer is answered with the source itself, because a
  // document a user can read as text is worth more than an exception they cannot.
  if ((MarkdownText as unknown) === undefined || (MarkdownText as unknown) === null) {
    element.textContent = text
    return
  }
  const inner = element.shadowRoot ?? element.attachShadow({ mode: 'open' })
  adoptApplicationStyles(inner)
  let mount = inner.querySelector('[data-workbench-markdown]')
  if (!(mount instanceof HTMLElement)) {
    mount = document.createElement('div')
    mount.setAttribute('data-workbench-markdown', '')
    inner.append(mount)
  }
  const root = MOUNTED.get(mount) ?? createRoot(mount)
  MOUNTED.set(mount, root)
  root.render(createElement(MarkdownText, { text, labels }))
}

/** The page's stylesheets, compiled once and shared by every rendered document. */
let applicationSheet: CSSStyleSheet | undefined

/**
 * Adopt the page's stylesheets into one shadow root.
 *
 * Copied once into one constructed sheet rather than per document: the sheet object is shared,
 * so the copy and the parse happen on the first document a card renders. A stylesheet the
 * browser will not let this origin read (a cross-origin link) is skipped rather than failing
 * the render, because the Markdown still has to appear.
 * @param root - the shadow root to style.
 */
function adoptApplicationStyles(root: ShadowRoot): void {
  const current = (root as { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets
  // An engine without constructable stylesheets, or one that already carries them: either way
  // this root is not the one to change.
  if (current === undefined || current.length > 0) return
  const sheet = applicationStyles()
  if (sheet === undefined) return
  root.adoptedStyleSheets = [sheet]
}

/**
 * Build the shared sheet from the page's own CSS.
 * @returns the sheet, or undefined when the page's styles cannot be read here.
 */
function applicationStyles(): CSSStyleSheet | undefined {
  if (applicationSheet !== undefined) return applicationSheet
  if (typeof CSSStyleSheet !== 'function' || !('replaceSync' in CSSStyleSheet.prototype)) return undefined
  const parts: string[] = []
  for (const sheet of [...document.styleSheets]) {
    try {
      for (const rule of [...sheet.cssRules]) parts.push(rule.cssText)
    } catch {
      // A cross-origin sheet cannot be read here; the text that follows is what the document
      // gets instead of the whole application stylesheet.
    }
  }
  // Nothing readable is not an empty sheet: the document would render as unstyled text, which
  // reads as a broken card rather than as a missing stylesheet.
  if (parts.length === 0) return undefined
  const constructed = new CSSStyleSheet()
  constructed.replaceSync(parts.join('\n'))
  applicationSheet = constructed
  return constructed
}
