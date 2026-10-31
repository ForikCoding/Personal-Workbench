/**
 * Hold the reader's place across a view that changes the page's height.
 *
 * The result page swaps the whole document for a short editor and back. The document is
 * thousands of pixels of template output and the editor is one bounded pane, so switching
 * collapses the page under the reader: the browser clamps the scroll position to the new,
 * shorter content, and when the document comes back the page is still near its top. The
 * reader was at the foot of the page, where the act block is, and is now a few thousand
 * pixels above it.
 *
 * A pixel offset alone does not repair that, because an edit may change the document's own
 * height: the anchor here is the act block, the thing the reader was looking at, and what is
 * restored is that block's place on screen rather than a number.
 * @module dsh-workbench/scroll-hold
 */

/** One element that scrolls its content, as this module needs to see it. */
export interface ScrollBox {
  /** Current offset from the top, in pixels. Writing it scrolls the box. */
  scrollTop: number
  /** Height of the whole content, in pixels. */
  readonly scrollHeight: number
  /** Height of the visible part, in pixels. */
  readonly clientHeight: number
}

/** Where the reader was, and what they were looking at. */
export interface ScrollHold {
  /** The box that was scrolled. */
  readonly box: ScrollBox
  /** Its offset at the moment the page changed height. */
  readonly offset: number
  /**
   * The anchor's distance from the top of the window, when it could be measured.
   *
   * Absent when there was nothing to anchor to, which leaves {@link ScrollHold.offset} as the
   * only thing to restore.
   */
  readonly anchorTop?: number
}

/** The overflow values that make an element a scroller. */
const SCROLLING = /^(auto|scroll|overlay)$/u

/**
 * The furthest a box can be scrolled.
 * @param box - the box.
 * @returns its maximum offset, never negative.
 */
export function maxScroll(box: ScrollBox): number {
  return Math.max(0, box.scrollHeight - box.clientHeight)
}

/**
 * Find the box whose scroll position moves the given element.
 *
 * The workbench renders inside whatever shell container the product uses, and that container
 * — not the window — is what scrolls. Walking up from an element of the page finds it without
 * the page having to know which shell it is in.
 * @param element - any element of the page.
 * @returns the nearest scrolling ancestor, the document's own scrolling element as a
 * fallback, or the document element when nothing above the element scrolls.
 */
export function scrollBoxOf(element: Element | null): ScrollBox | null {
  const view = element?.ownerDocument.defaultView ?? null
  if (view === null) return null
  let node = element?.parentElement ?? null
  while (node !== null) {
    // Only a box with something to scroll can hold a position: an `overflow: auto` panel
    // whose content fits would take the hold and restore nothing.
    if (SCROLLING.test(view.getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node
    node = node.parentElement
  }
  const root = element?.ownerDocument.scrollingElement
  return root ?? element?.ownerDocument.documentElement ?? null
}

/**
 * Record where the reader is, and what they are looking at.
 * @param element - any element of the page, used to find the scrolling box.
 * @param anchor - the element whose place on screen should be kept, if it is on screen.
 * @returns the hold, or undefined when nothing scrolls.
 */
export function holdScroll(element: Element | null, anchor: Element | null): ScrollHold | undefined {
  const box = scrollBoxOf(element)
  if (box === null) return undefined
  const measured = anchor === null ? undefined : anchor.getBoundingClientRect().top
  return {
    box,
    offset: box.scrollTop,
    ...measured === undefined || Number.isNaN(measured) ? {} : { anchorTop: measured },
  }
}

/**
 * Where the box should be scrolled so the anchor sits where it did.
 *
 * Working from the anchor's own position rather than from the saved offset is what makes this
 * correct when the content above the anchor changed height while the view was away — an edit
 * that made the document taller must scroll further, not the same distance.
 * @param current - the box's offset now, after the browser clamped it.
 * @param anchorNow - the anchor's distance from the top of the window now.
 * @param anchorHeld - the same distance when the hold was taken.
 * @param limit - the box's maximum offset.
 * @returns the offset to write, inside the box's range.
 */
export function anchoredOffset(current: number, anchorNow: number, anchorHeld: number, limit: number): number {
  const wanted = current + (anchorNow - anchorHeld)
  return Math.min(Math.max(0, wanted), Math.max(0, limit))
}

/**
 * Put the reader back where the hold was taken.
 *
 * Written through the box rather than through `window`, and clamped: the browser's own clamp
 * ran while the page was short, so the offset that comes back may be larger than the current
 * content allows.
 *
 * The correction is computed from the offset the page was *found* at, not from whatever the
 * box holds now, so applying it twice is the same as applying it once. That matters because
 * the caller applies it again on the next frame — the document may still be growing — and a
 * second pass that added the anchor's movement to the already-restored offset would scroll
 * twice as far.
 * @param hold - the hold, when there was one.
 * @param anchor - the same element that was anchored, now that it is back on screen.
 * @param clamped - the offset the box was found at, when the caller has already read it.
 * @returns whether the anchor is now where the hold recorded it. False means this was not the
 * box that moves the page — the shell scrolls something this page could not find, or a box that
 * cannot reach that far — and the caller should ask the browser to bring the anchor into view
 * instead. The test is the anchor's own position rather than the box's offset, because a box
 * that never scrolls accepts any offset written to it and then stays at zero.
 */
export function releaseScroll(hold: ScrollHold | undefined, anchor: Element | null, clamped?: number): boolean {
  if (hold === undefined) return false
  const { box } = hold
  const limit = maxScroll(box)
  const from = clamped ?? box.scrollTop
  const measured = anchor === null || hold.anchorTop === undefined
    ? undefined
    : anchor.getBoundingClientRect().top
  const target = measured === undefined || Number.isNaN(measured)
    ? hold.offset
    : anchoredOffset(from, measured, hold.anchorTop as number, limit)
  box.scrollTop = Math.min(Math.max(0, target), limit)
  if (anchor === null) return true
  if (hold.anchorTop === undefined) return false
  const settled = anchor.getBoundingClientRect().top
  return Number.isNaN(settled) || Math.abs(settled - hold.anchorTop) <= 1
}

/**
 * Ask the browser to bring an element into view, whichever container actually scrolls it.
 *
 * The fallback for a page that could not find the box the shell scrolls: this works through
 * whatever ancestor — or portal — the element really lives in, and does nothing when it is
 * already on screen.
 * @param anchor - the element to bring into view.
 */
export function revealAnchor(anchor: Element | null): void {
  if (anchor === null) return
  const scrollIntoView = anchor.scrollIntoView
  if (typeof scrollIntoView !== 'function') return
  // `nearest` and not `start`: the reader was at the foot of the page, looking at this block,
  // so the smallest move that puts it back on screen is the one that leaves the least behind.
  anchor.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}
