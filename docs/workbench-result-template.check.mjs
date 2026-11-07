/**
 * 「证实」脚本：证明模板的数据通路走通，渲染之外的部分都是真的。
 *
 * 不能证的部分：影子根里的 CSS 与 markdown 排版（那需要浏览器）。
 * 能证的部分：区域标记可定位、目录指针在区域之外、内容策略不违例、
 *            脚本里没有看不见影子根的选择器、真目录能被列出并读回、
 *            默认打开第一个、点第三个真的换了正文、空目录与读不到目录的两种情况。
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
check('未绑定时不抛（typeof dsh）', /typeof\s+dsh\s*===?\s*['"]undefined['"]/.test(scriptBody))

/* ─────────────────── 4. 目录指针：配在哪、指向哪 ─────────────────── */

process.stdout.write('\n5. 目录指针\n')
// 区域每次被模型的输出整段替换，所以指针必须写在区域之外，否则每次运行都丢
const pointerInRegion = /data-dsh-files/.test(region)
const pointerOutside = /data-dsh-files\s*=\s*"([^"]*)"/.exec(outside)
check('指针在区域之外（区域里会被替换掉）', !pointerInRegion)
check('指针在模板里配好了', pointerOutside !== null, pointerOutside ? pointerOutside[1] : '没找到')
const DIR_ATTR = pointerOutside === null ? '' : pointerOutside[1]
check('它指向要证实的那个真实目录', DIR_ATTR === DIR, `${DIR_ATTR} vs ${DIR}`)

// 脚本按 id / class 找这几个节点，模板里得真有，否则脚本会静默什么都不做
const NEEDED = [
  ['id="dir"', /id="dir"/],
  ['id="count"', /id="count"/],
  ['id="files"', /id="files"/],
  ['id="body"', /id="body"/],
  ['id="run-out"', /id="run-out"/],
  ['class="head"', /class="head"/],
]
const missing = NEEDED.filter(([, pattern]) => !pattern.test(bare)).map(([label]) => label)
check('脚本要找的节点模板里都有', missing.length === 0, missing.length ? missing.join(', ') : '6 个都在')

/* ───────────────────────────── 5. 真的读盘 ───────────────────────────── */

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

/* ───────────────────────────── 6. 极简假 DOM ───────────────────────────── */

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
    this.hidden = false
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

/**
 * 按模板的形状搭一个假根：指针、区域、目录行、文件条、正文。
 * 形状变了这里要跟着变——上面第 5 节检查过那几个节点在模板里确实存在。
 */
function buildRoot() {
  const pointer = new FakeNode('div')
  pointer.setAttribute('data-dsh-files', DIR_ATTR)
  pointer.hidden = true

  const runOut = new FakeNode('div')
  runOut.setAttribute('id', 'run-out')
  const lead = new FakeNode('p')
  lead.className = 'lead'
  lead.textContent = '这次没有产出文件'
  runOut.append(lead)

  const head = new FakeNode('div')
  head.className = 'head'
  const dirName = new FakeNode('span')
  dirName.setAttribute('id', 'dir')
  const countEl = new FakeNode('span')
  countEl.setAttribute('id', 'count')
  head.append(dirName, countEl)

  const filesEl = new FakeNode('div')
  filesEl.setAttribute('id', 'files')
  const bodyEl = new FakeNode('div')
  bodyEl.setAttribute('id', 'body')

  const root = new FakeNode('div')
  root.append(pointer, runOut, head, filesEl, bodyEl)
  return { root, pointer, runOut, head, filesEl, bodyEl, dirName, countEl }
}

/* ───────────────────────────── 7. 跑模板的脚本 ───────────────────────────── */

// 与 bindDocumentScript 同形的包装
const wrapped = `(function (dsh) {\n${scriptBody}\n})`
const run = new Function('dsh', 'document', `${wrapped}(dsh)`)

/** 等异步链路落定。 */
const settle = () => new Promise(done => setTimeout(done, 60))

process.stdout.write('\n6. 真实目录 ' + DIR + '\n')
check('目录存在', statSync(directory).isDirectory(), directory)

{
  const view = buildRoot()
  const renders = []
  const dsh = {
    root: view.root,
    files: {
      list: async requested => listCardDirectory(requested),
      read: async requested => readCardFile(requested),
    },
    markdown: { render: async (element, text) => { renders.push({ element, text }) } },
  }
  run(dsh, fakeDocument)
  await settle()

  const chips = view.filesEl.querySelectorAll('.file')
  const expected = listCardDirectory(DIR).entries.filter(entry => /\.md$/i.test(entry.name))

  check('清单一共列出 ' + expected.length + ' 个文件', chips.length === expected.length, `实际 ${chips.length}`)
  check(
    '文件名与磁盘一致且同序',
    chips.every((chip, i) => chip.querySelector('.name').textContent === expected[i].name),
    chips.map(chip => chip.querySelector('.name').textContent).join(' | '),
  )
  check('目录行写的是配的那个目录', view.dirName.textContent === DIR, view.dirName.textContent)
  check('计数文案', view.countEl.textContent === `${expected.length} 个文件`, view.countEl.textContent)

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

  process.stdout.write('\n7. 默认打开、点击切换、区域收起\n')
  check('没有点击时默认打开了一个文件', renders.length === 1, `渲染 ${renders.length} 次`)
  check('默认打开的是第一个', chips[0].getAttribute('aria-pressed') === 'true')
  check(
    '默认渲染的是第一个文件的正文',
    renders.length === 1 && renders[0].text === readCardFile(expected[0].path).text,
    renders.length ? `前 24 字：${renders[0].text.slice(0, 24)}` : '未渲染',
  )
  check('有文件时区域收起来了（不重复显示说明）', view.runOut.hidden === true)

  chips[2].click()
  await settle()

  check('点第三个后渲染了第二次', renders.length === 2, `渲染 ${renders.length} 次`)
  check(
    '第二次渲染的是第三个文件的正文',
    renders.length === 2 && renders[1].text === readCardFile(expected[2].path).text,
    renders.length === 2 ? `前 24 字：${renders[1].text.slice(0, 24)}` : '未渲染',
  )
  check('选中态跟着走', chips[2].getAttribute('aria-pressed') === 'true'
    && chips[0].getAttribute('aria-pressed') === 'false', '第三个选中、第一个取消')
}

/* ───────────────────── 8. 目录在，但里面没有 markdown ───────────────────── */

process.stdout.write('\n8. 空目录\n')
{
  const view = buildRoot()
  const renders = []
  run({
    root: view.root,
    files: {
      list: async requested => ({ path: requested, entries: [], truncated: false }),
      read: async requested => readCardFile(requested),
    },
    markdown: { render: async (element, text) => { renders.push({ element, text }) } },
  }, fakeDocument)
  await settle()

  check('没有渲染任何文件', renders.length === 0)
  check('目录行摘掉', view.head.parent === null)
  check('文件条摘掉', view.filesEl.parent === null)
  check('正文容器摘掉（不留空盒子）', view.bodyEl.parent === null)
  check('区域露出来（它才是这次的结果）', view.runOut.hidden === false && view.runOut.parent !== null)
}

/* ───────────────────────── 9. 目录读不到 ───────────────────────── */

process.stdout.write('\n9. 读不到目录\n')
{
  const view = buildRoot()
  const runOutBefore = view.runOut.hidden
  const failing = {
    root: view.root,
    files: {
      list: async () => { const e = new Error('the path is not there'); e.code = 'not-found'; throw e },
      read: async requested => readCardFile(requested),
    },
    markdown: { render: async () => {} },
  }
  run(failing, fakeDocument)
  await settle()

  const state = view.bodyEl.querySelector('[data-state]')
  check('报错落在正文区而不是抛掉', state !== null, state ? state.textContent : '没有 [data-state] 节点')
  check('说清是哪个目录、为什么', state !== null
    && state.textContent.includes(DIR) && state.textContent.includes('目录或文件不存在'),
  state ? state.textContent : '')
  check('区域没被藏起来', view.runOut.hidden === runOutBefore)
  check('目录行与文件条摘掉（没有清单可给）', view.head.parent === null && view.filesEl.parent === null)
}

/* ─────────────────── 10. 没有指针：不装作有目录 ─────────────────── */

process.stdout.write('\n10. 指针被删掉\n')
{
  const view = buildRoot()
  view.pointer.remove()
  const touched = []
  run({
    root: view.root,
    files: {
      list: async requested => { touched.push(`list ${requested}`); return { path: '', entries: [], truncated: false } },
      read: async requested => { touched.push(`read ${requested}`); return { path: requested, text: '', bytes: 0 } },
    },
    markdown: { render: async () => { touched.push('render') } },
  }, fakeDocument)
  await settle()

  check('没有去列目录、也没有读文件', touched.length === 0, touched.join(', ') || '一次都没调')
  check('容器都摘掉，区域自己显示自己', view.head.parent === null
    && view.filesEl.parent === null && view.bodyEl.parent === null)
}

process.stdout.write(failures === 0 ? '\n全部通过。\n' : `\n${failures} 项失败。\n`)
process.exit(failures === 0 ? 0 : 1)
