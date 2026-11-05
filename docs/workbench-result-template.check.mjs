/**
 * 「证实」脚本：证明模板的数据通路走通，渲染之外的部分都是真的。
 *
 * 不能证的部分：影子根里的 CSS 与 markdown 排版（那需要浏览器）。
 * 能证的部分：区域标记可定位、内容策略不违例、脚本里没有看不见影子根的选择器、
 *            真目录能被列出并读回、默认打开第一个、点第三个真的换了正文。
 *
 * 跑法：node docs/workbench-result-template.check.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const WORKSPACE = 'F:\\git\\Personal-Workbench'
const DIR = 'docs/详细设计'
const TEMPLATE = resolve(WORKSPACE, 'docs/workbench-result-template.html')

let failures = 0

function ok(label, extra) {
  process.stdout.write(`  ok   ${label}${extra === undefined ? '' : ` — ${extra}`}\n`)
}

function bad(label, detail) {
  failures += 1
  process.stdout.write(`  FAIL ${label} — ${detail}\n`)
}

function check(label, condition, detail) {
  if (condition) ok(label, detail)
  else bad(label, detail)
}

/* ───────────────────────────── 1. 模板结构 ───────────────────────────── */

const html = readFileSync(TEMPLATE, 'utf8')

// 与 skill-card-contract.ts 的 regionMarkerPattern 同形
const marker = name => new RegExp(`<!--\\s*${name}\\s*-->`, 'g')
const opens = [...html.matchAll(marker('template-begin'))]
const closes = [...html.matchAll(marker('template-end'))]

process.stdout.write('\n1. 区域标记\n')
check('恰好一个开始标记', opens.length === 1, `${opens.length} 个`)
check('恰好一个结束标记', closes.length === 1, `${closes.length} 个`)

const regionStart = opens[0].index + opens[0][0].length
const regionEnd = closes[0].index
check('结束标记在开始标记之后', regionEnd > regionStart, `${regionStart} → ${regionEnd}`)

const region = html.slice(regionStart, regionEnd)
const outside = html.slice(0, regionStart) + html.slice(regionEnd)
check('脚本在区域之外（否则会被剥掉）', /<script>/.test(outside) && !/<script>/.test(region))
check('区域里有内容', region.trim().length > 0, `${region.trim().length} 字符`)

process.stdout.write('\n2. 旧的占位符语法\n')
check('没有 {{…}} 残留（analyzeTemplate 会拒）', !/\{\{[^{}]*\}\}/u.test(html))

/* ───────────────────────────── 2. 内容策略 ───────────────────────────── */

// 逐字抄自 dsh-workbench/src/client/skill-card/policy.ts
const EXTERNAL_ELEMENTS = new Set([
  'img', 'iframe', 'object', 'embed', 'link', 'video', 'audio', 'source', 'track', 'image', 'use',
])
const EXTERNAL_CSS = /@import|url\(\s*(?!['"]?#)/i

process.stdout.write('\n3. 内容策略（policy.ts 的两条）\n')
const tags = [...html.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)/g)].map(m => m[1].toLowerCase())
const forbidden = [...new Set(tags)].filter(tag => EXTERNAL_ELEMENTS.has(tag))
check('没有会被整棵剥掉的元素', forbidden.length === 0, forbidden.length ? forbidden.join(', ') : '无')

const styleBlocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1])
check('样式块里没有外部引用', styleBlocks.every(text => !EXTERNAL_CSS.test(text)), `${styleBlocks.length} 个样式块`)
check('没有 <script src>（会被丢弃且不执行）', !/<script[^>]+\bsrc\s*=/i.test(html))

/* ───────────────────────────── 3. 影子根意识 ───────────────────────────── */

process.stdout.write('\n4. 影子根\n')
check('脚本用 dsh.root 找节点', /dsh\.root/.test(outside))

// 注释里也会出现标签名，所以先剥注释再找脚本，免得抓到文档说明
const bare = html.replace(/<!--[\s\S]*?-->/g, '')
const scriptMatch = /<script>([\s\S]*?)<\/script>/.exec(bare)
check('只有一个内联脚本', [...bare.matchAll(/<script>[\s\S]*?<\/script>/g)].length === 1)
const scriptBody = scriptMatch[1]
check(
  '没有裸 document.querySelector（在影子根里会静默找不到）',
  !/document\.querySelector/.test(scriptBody),
)

/* ───────────────────────────── 4. 真的读盘 ───────────────────────────── */

/** 与 compareEntries 同形：目录在前，其余按名字 numeric 排序。 */
function compareEntries(left, right) {
  const leftDir = left.type === 'directory' ? 0 : 1
  const rightDir = right.type === 'directory' ? 0 : 1
  if (leftDir !== rightDir) return leftDir - rightDir
  return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
}

const directory = resolve(WORKSPACE, DIR)

/** 与 listCardDirectory 同形：条目 path 用请求的形态，相对请求就用正斜杠。 */
function listCardDirectory(requested) {
  const absolute = resolve(WORKSPACE, requested)
  const entries = []
  for (const dirent of readdirSync(absolute, { withFileTypes: true })) {
    const type = dirent.isDirectory() ? 'directory' : dirent.isFile() ? 'file' : 'other'
    const size = type === 'file' ? statSync(join(absolute, dirent.name)).size : undefined
    entries.push({
      name: dirent.name,
      path: `${requested.replace(/[\\/]+$/, '')}/${dirent.name}`,
      type,
      ...(size === undefined ? {} : { size }),
    })
  }
  entries.sort(compareEntries)
  return { path: requested, entries, truncated: false }
}

/** 与 readCardFile 同形。 */
function readCardFile(requested) {
  const absolute = resolve(WORKSPACE, requested)
  const text = readFileSync(absolute, 'utf8')
  return { path: requested, text, bytes: Buffer.byteLength(text) }
}

/* ───────────────────────────── 5. 极简假 DOM ───────────────────────────── */

class FakeNode {
  constructor(tag) {
    this.tagName = tag.toUpperCase()
    this.className = ''
    this.textContent = ''
    this.dataset = {}
    this.children = []
    this.attributes = {}
    this.listeners = []
    this.id = ''
    this.parent = null
  }

  remove() {
    if (this.parent === null) return
    const at = this.parent.children.indexOf(this)
    if (at >= 0) this.parent.children.splice(at, 1)
    this.parent = null
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value)
    if (name === 'id') this.id = String(value)
  }

  getAttribute(name) {
    return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null
  }

  append(...nodes) {
    for (const node of nodes) {
      node.parent = this
      this.children.push(node)
    }
  }

  replaceChildren(...nodes) {
    for (const child of this.children) child.parent = null
    this.children = []
    this.append(...nodes)
  }

  addEventListener(type, handler) {
    this.listeners.push({ type, handler })
  }

  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1)
    if (selector.startsWith('.')) return this.className.split(/\s+/).includes(selector.slice(1))
    if (selector.startsWith('[')) {
      const name = selector.slice(1, -1)
      return Object.hasOwn(this.attributes, name)
    }
    return this.tagName === selector.toUpperCase()
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null
  }

  querySelectorAll(selector) {
    const found = []
    const walk = node => {
      for (const child of node.children) {
        if (child.matches(selector)) found.push(child)
        walk(child)
      }
    }
    walk(this)
    return found
  }

  /** 只触发 click，且同步派发——脚本的处理器是同步注册的。 */
  click() {
    for (const { type, handler } of this.listeners) {
      if (type === 'click') handler({ target: this })
    }
  }
}

const fakeDocument = { createElement: tag => new FakeNode(tag) }

// 区域里配的目录以模板文件为准，不从测试里硬塞
const configured = /<div class="result" data-dir="([^"]*)"><\/div>/.exec(bare)
process.stdout.write('\n5. 模板里配的目录\n')
check('区域示例里配了 data-dir', configured !== null, configured ? configured[1] : '没找到')
const DIR_ATTR = configured === null ? '' : configured[1]
check('它指向要证实的那个真实目录', DIR_ATTR === DIR, `${DIR_ATTR} vs ${DIR}`)

const dirEl = new FakeNode('div')
dirEl.className = 'result'
dirEl.setAttribute('data-dir', DIR_ATTR)

const filesEl = new FakeNode('div')
filesEl.setAttribute('id', 'files')
const docEl = new FakeNode('div')
docEl.setAttribute('id', 'doc')
const countEl = new FakeNode('span')
countEl.setAttribute('id', 'count')

const fakeRoot = new FakeNode('div')
fakeRoot.append(dirEl, filesEl, docEl, countEl)

const renders = []

const dsh = {
  root: fakeRoot,
  files: {
    list: async requested => listCardDirectory(requested),
    read: async requested => readCardFile(requested),
  },
  markdown: {
    render: async (element, text) => {
      renders.push({ element, text })
    },
  },
}

/* ───────────────────────────── 6. 跑模板的脚本 ───────────────────────────── */

// 与 bindDocumentScript 同形的包装
const wrapped = `(function (dsh) {\n${scriptBody}\n})`
const run = new Function('dsh', 'document', `${wrapped}(dsh)`)
run(dsh, fakeDocument)

/** 等异步链路落定。 */
const settle = () => new Promise(done => setTimeout(done, 60))

process.stdout.write('\n6. 真实目录 ' + DIR + '\n')
check('目录存在', statSync(directory).isDirectory(), directory)

await settle()

const chips = filesEl.querySelectorAll('.file')
const expected = listCardDirectory(DIR).entries.filter(entry => /\.md$/i.test(entry.name))

check('清单一共列出 ' + expected.length + ' 个文件', chips.length === expected.length, `实际 ${chips.length}`)
check(
  '文件名与磁盘一致且同序',
  chips.every((chip, i) => chip.querySelector('.name').textContent === expected[i].name),
  chips.map(chip => chip.querySelector('.name').textContent).join(' | '),
)
check('计数文案', countEl.textContent === `${expected.length} 个文件`, countEl.textContent)

const sizes = chips.map(chip => chip.querySelector('.size')?.textContent ?? '')
ok('字节数标签', sizes.join(' | '))
check(
  '字节数与磁盘一致',
  chips.every((chip, i) => chip.querySelector('.size').textContent ===
    (expected[i].size < 1024
      ? `${expected[i].size} B`
      : `${(expected[i].size / 1024).toFixed(1)} KB`)),
  '按 KB 换算',
)

process.stdout.write('\n7. 默认打开与点击切换\n')
check('没有点击时默认打开了一个文件', renders.length === 1, `渲染 ${renders.length} 次`)
check('默认打开的是第一个', chips[0].getAttribute('aria-current') === 'true')
check(
  '默认渲染的是第一个文件的正文',
  renders.length === 1 && renders[0].text === readCardFile(expected[0].path).text,
  renders.length ? `前 24 字：${renders[0].text.slice(0, 24)}` : '未渲染',
)

chips[2].click()
await settle()

check('点第三个后渲染了第三次', renders.length === 2, `渲染 ${renders.length} 次`)
check(
  '第三次渲染的是第三个文件的正文',
  renders.length === 2 && renders[1].text === readCardFile(expected[2].path).text,
  renders.length === 2 ? `前 24 字：${renders[1].text.slice(0, 24)}` : '未渲染',
)
check('选中态跟着走', chips[2].getAttribute('aria-current') === 'true'
  && chips[0].getAttribute('aria-current') === 'false', '第三个选中、第一个取消')

process.stdout.write('\n8. 目录在，但读不到\n')
// 目录型但指向一个不存在的目录：区域里有 data-dir，列目录时被 Host 拒
const missing = { ...dsh, files: { ...dsh.files, list: async () => { const e = new Error('the path is not there'); e.code = 'not-found'; throw e } } }
const dirEl2 = new FakeNode('div')
dirEl2.className = 'result'
dirEl2.setAttribute('data-dir', 'docs/不存在的目录')
const filesEl2 = new FakeNode('div'); filesEl2.setAttribute('id', 'files')
const docEl2 = new FakeNode('div'); docEl2.setAttribute('id', 'doc')
const countEl2 = new FakeNode('span'); countEl2.setAttribute('id', 'count')
const root2 = new FakeNode('div'); root2.append(dirEl2, filesEl2, docEl2, countEl2)
missing.root = root2
run(missing, fakeDocument)
await settle()
const stateNode = docEl2.querySelector('.state')
check('报错落在结果区而不是抛掉', stateNode !== null && stateNode.textContent.includes('目录或文件不存在'),
  stateNode ? stateNode.textContent : '没有 .state 节点')

/* ─────────────────── 9. 非目录型：区域里就是结果本身 ─────────────────── */

process.stdout.write('\n9. 非目录型（区域里是正文/表格，不是 data-dir）\n')

const plainFiles = new FakeNode('div')
plainFiles.setAttribute('id', 'files')
const plainDoc = new FakeNode('div')
plainDoc.setAttribute('id', 'doc')
const plainCount = new FakeNode('span')
plainCount.setAttribute('id', 'count')
const plainRoot = new FakeNode('div')
// 故意不放 [data-dir] 节点：这就是「结果不是目录」的样子
plainRoot.append(plainFiles, plainDoc, plainCount)

const plainRenders = []
const plainTouched = []
run({
  root: plainRoot,
  files: {
    list: async requested => { plainTouched.push(`list ${requested}`); return { path: '', entries: [], truncated: false } },
    read: async requested => { plainTouched.push(`read ${requested}`); return { path: requested, text: '', bytes: 0 } },
  },
  markdown: { render: async () => { plainRenders.push(1) } },
}, fakeDocument)

await settle()

check('没有去列目录、也没有读文件', plainTouched.length === 0, plainTouched.join(', ') || '一次都没调')
check('没有渲染任何文件', plainRenders.length === 0)
check('#files 被摘掉（不给结果区留空容器）', plainFiles.parent === null)
check('#doc 被摘掉', plainDoc.parent === null)
check('没有把「读不到目录」写进结果区', plainRoot.querySelector('.state') === null, '区域自己显示自己')

process.stdout.write(failures === 0 ? '\n全部通过。\n' : `\n${failures} 项失败。\n`)
process.exit(failures === 0 ? 0 : 1)
