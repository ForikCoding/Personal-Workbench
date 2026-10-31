/**
 * @vitest-environment jsdom
 *
 * Holding the reader's place across a view that changes the page's height.
 *
 * The behaviour under test is small and arithmetic: what a hold remembers, and where it puts
 * the box back. It is stated here rather than through the page because jsdom has no layout —
 * every rectangle is zero and nothing clamps — so the numbers have to be supplied to be
 * checked at all. The page-level spec checks that the page takes and releases a hold; this
 * one checks that the arithmetic is right when the document either kept its height or did
 * not.
 */

import { afterEach, describe, expect, it } from 'vitest'
import {
  anchoredOffset,
  holdScroll,
  maxScroll,
  releaseScroll,
  scrollBoxOf,
  type ScrollBox,
} from '../src/client/skill-card/scroll-hold.ts'

afterEach(() => {
  document.body.innerHTML = ''
})

/**
 * A box with stated dimensions, standing in for an element jsdom will not lay out.
 * @param scrollTop - its offset.
 * @param scrollHeight - its content height.
 * @param clientHeight - its visible height.
 * @returns the box.
 */
function box(scrollTop: number, scrollHeight: number, clientHeight: number): ScrollBox {
  return { scrollTop, scrollHeight, clientHeight }
}

/**
 * An element that reports one position from the top of the window.
 * @param top - the distance to report.
 * @returns the element.
 */
function anchored(top: number): Element {
  const element = document.createElement('div')
  element.getBoundingClientRect = () => ({ top, bottom: top, height: 0, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) })
  return element
}

describe('measuring the box that scrolls', () => {
  it('stops at a negative maximum when the content fits, rather than scrolling upward', () => {
    expect(maxScroll(box(0, 400, 800))).toBe(0)
    expect(maxScroll(box(0, 800, 800))).toBe(0)
    expect(maxScroll(box(0, 9000, 800))).toBe(8200)
  })

  it('finds the nearest ancestor with something to scroll', () => {
    // The page renders inside whatever container the shell gives it, and that container —
    // not the window — is what moves. The nearest scroller is the one that holds the reader.
    const outer = document.createElement('div')
    outer.style.overflowY = 'auto'
    Object.defineProperty(outer, 'scrollHeight', { configurable: true, value: 9000 })
    Object.defineProperty(outer, 'clientHeight', { configurable: true, value: 600 })
    const inner = document.createElement('div')
    const page = document.createElement('section')
    outer.append(inner)
    inner.append(page)
    document.body.append(outer)
    expect(scrollBoxOf(page)).toBe(outer)
  })

  it('skips an ancestor that scrolls but has nothing to scroll', () => {
    // An `overflow: auto` panel whose content fits cannot hold a position: taking the hold
    // there would restore nothing, so the search continues past it.
    const outer = document.createElement('div')
    outer.style.overflowY = 'auto'
    Object.defineProperty(outer, 'scrollHeight', { configurable: true, value: 4000 })
    Object.defineProperty(outer, 'clientHeight', { configurable: true, value: 700 })
    const fitting = document.createElement('div')
    fitting.style.overflowY = 'auto'
    const page = document.createElement('section')
    fitting.append(page)
    outer.append(fitting)
    document.body.append(outer)
    expect(scrollBoxOf(page)).toBe(outer)
  })

  it('falls back to the document when nothing above the page scrolls', () => {
    const page = document.createElement('section')
    document.body.append(page)
    expect(scrollBoxOf(page)).toBe(document.scrollingElement ?? document.documentElement)
  })
})

describe('where a hold puts the box back', () => {
  it('records the offset it saw and the anchor’s place on screen', () => {
    const outer = document.createElement('div')
    outer.style.overflowY = 'auto'
    Object.defineProperty(outer, 'scrollHeight', { configurable: true, value: 9000 })
    Object.defineProperty(outer, 'clientHeight', { configurable: true, value: 600 })
    Object.defineProperty(outer, 'scrollTop', { configurable: true, value: 2400, writable: true })
    const page = document.createElement('section')
    outer.append(page)
    document.body.append(outer)
    const hold = holdScroll(page, anchored(60))
    expect(hold?.box).toBe(outer)
    expect(hold?.offset).toBe(2400)
    expect(hold?.anchorTop).toBe(60)
  })

  it('keeps the anchor at the same place on screen when the page kept its height', () => {
    // The reader was at the foot of a 9000px document with the act block 60px below the top
    // of the window. Opening the editor collapsed the page and the browser dropped the offset
    // to zero; coming back, the block is 60px from the top again only at the stored offset.
    expect(anchoredOffset(0, 2460, 60, 8400)).toBe(2400)
    const scroller = box(0, 9000, 600)
    releaseScroll({ box: scroller, offset: 2400, anchorTop: 60 }, anchored(2460))
    expect(scroller.scrollTop).toBe(2400)
  })

  it('scrolls further when the document grew while the reader was away', () => {
    // An edit that made the document 400px taller moved the block 400px further down. The
    // reader's own offset would now leave the block off the bottom of the window.
    expect(anchoredOffset(0, 2860, 60, 8800)).toBe(2800)
  })

  it('scrolls less when the document shrank, still putting the block where it was', () => {
    expect(anchoredOffset(0, 2060, 60, 8000)).toBe(2000)
  })

  it('never writes an offset outside the box', () => {
    const top = box(0, 1000, 400)
    releaseScroll({ box: top, offset: 5000, anchorTop: 60 }, anchored(-9000))
    expect(top.scrollTop).toBe(0)
    const bottom = box(0, 1000, 400)
    releaseScroll({ box: bottom, offset: 100, anchorTop: 60 }, anchored(9000))
    expect(bottom.scrollTop).toBe(600)
  })

  it('puts the box in the same place whether it is released once or twice', () => {
    // The page releases on the commit and again a frame later, because the document may still
    // be growing. The second pass must correct the same distance, not add to the first.
    const scroller = box(0, 9000, 600)
    const hold = { box: scroller, offset: 2400, anchorTop: 60 }
    releaseScroll(hold, anchored(2460), 0)
    expect(scroller.scrollTop).toBe(2400)
    releaseScroll(hold, anchored(2460), 0)
    expect(scroller.scrollTop).toBe(2400)
  })

  it('falls back to the offset alone when there is nothing to anchor to', () => {
    const scroller = box(0, 9000, 600)
    releaseScroll({ box: scroller, offset: 2400 }, null)
    expect(scroller.scrollTop).toBe(2400)
  })

  it('does nothing at all without a hold', () => {
    const scroller = box(120, 9000, 600)
    releaseScroll(undefined, anchored(10))
    expect(scroller.scrollTop).toBe(120)
  })
})
