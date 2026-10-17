/** Smoke-check the built artifacts the Loader and the Host will consume. */
import { existsSync, readFileSync } from 'node:fs'

const host = await import('../lib/index.js')
const sortedExports = Object.keys(host).sort().join(', ')
console.log('host exports:', sortedExports)
console.log('host inject:', host.inject.join(', '))
console.log('host name:', host.name)
console.log('host apply:', typeof host.apply)
console.log('config schema:', typeof host.Config)

const client = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const handshake = client.includes('window.__ModuleLoader__.load({') && client.includes('id: "dsh-workbench"')
console.log('client handshake:', handshake)
const externals = [...client.matchAll(/require\("([^"]+)"\)/gu)].map(match => match[1])
console.log('client externals:', [...new Set(externals)].sort().join(', '))
const forbidden = /require\("(?!react|react-dom|react\/jsx-runtime|@deepseek-ai\/)[^"]+"\)/u.test(client)
console.log('non-baseline require present:', forbidden)

// A card with no stylesheet renders unstyled and reports nothing, so this is a
// failure rather than a line of output: the stylesheet has to be inside the
// factory, and no sibling copy may be left behind.
console.log('client stylesheet inlined:', client.includes('data-plugin-css'))
if (existsSync(new URL('../lib/dsh-workbench.css', import.meta.url))) {
  console.error('client stylesheet was extracted but never inlined; every card would render unstyled')
  process.exitCode = 1
}
