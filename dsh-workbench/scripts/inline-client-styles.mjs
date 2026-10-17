/**
 * Install the client bundle's stylesheet from the bundle itself.
 *
 * Vite extracts every stylesheet of a library build into one sibling `.css` and
 * leaves the JavaScript factory unaware of it. The Loader evaluates the factory
 * and never fetches that file, so the stylesheet gets built, shipped, and then
 * ignored: every card renders unstyled with no error raised anywhere.
 *
 * Upstream's client bundle builder injects a tagged style at factory execution
 * for exactly this reason. This does the same for the Vite artifact — the text
 * is embedded in the factory and installed on first evaluation.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const bundle = new URL('../lib/client.js', import.meta.url)
const stylesheet = new URL('../lib/dsh-workbench.css', import.meta.url)

/** The factory's last opening statement; the install goes directly after it. */
const ANCHOR = 'var exports = module.exports;'

/** Tag the install as this plugin's, the way upstream's builder does. */
const TAG_ID = 'dsh-workbench'

/**
 * Build the statements that install one stylesheet.
 * @param css - the extracted stylesheet text.
 * @returns the factory-local install code.
 */
function installCode(css) {
  const selector = JSON.stringify(`style[data-plugin-css="${TAG_ID}"]`)
  return [
    '// The Loader never fetches a sibling stylesheet, so this one ships inside',
    '// the factory and installs on first evaluation.',
    '{',
    `  const css = ${JSON.stringify(css)};`,
    `  if (typeof document !== 'undefined' && document.querySelector(${selector}) === null) {`,
    '    const tag = document.createElement(\'style\');',
    `    tag.dataset.pluginCss = ${JSON.stringify(TAG_ID)};`,
    '    tag.textContent = css;',
    '    document.head.appendChild(tag);',
    '  }',
    '}',
  ].join('\n')
}

if (!existsSync(stylesheet)) {
  console.log('inline-client-styles: no stylesheet was extracted; nothing to install')
  process.exit(0)
}

const source = readFileSync(bundle, 'utf8')
if (source.includes('data-plugin-css')) {
  console.log('inline-client-styles: the factory already installs a stylesheet')
} else {
  const css = readFileSync(stylesheet, 'utf8')
  const at = source.indexOf(ANCHOR)
  if (at === -1) {
    throw new Error('inline-client-styles: the client factory layout changed; install the stylesheet by hand')
  }
  const end = at + ANCHOR.length
  writeFileSync(bundle, `${source.slice(0, end)}\n${installCode(css)}${source.slice(end)}`)
  console.log(`inline-client-styles: installed ${String(css.length)} characters of CSS into the factory`)
}

// The bundle carries the text now, so a sibling file would be a second copy that
// nothing reads — and a trap for whoever assumes it is loadable.
rmSync(stylesheet, { force: true })
