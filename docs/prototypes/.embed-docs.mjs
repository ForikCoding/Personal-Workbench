// 一次性注入：把 docs/详细设计 里的真实 markdown 嵌进浏览器试看版。
// file:// 下 fetch 读不了本地文件，所以只能烘焙进 HTML。
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const demoPath = 'docs/prototypes/workbench-result-render-demo.html'
const docDir = 'docs/详细设计'

const names = [
  'workbench-workflow-card-detailed-design.md',
  'workbench-workflow-card-requirements.md',
  'workbench-workspace-fence-plan.md',
]

let html = readFileSync(demoPath, 'utf8')

for (const name of names) {
  const text = readFileSync(join(docDir, name), 'utf8')
  if (/<\/script/i.test(text)) throw new Error(`${name} 含 </script，不能内嵌`)

  const empty = `<script type="text/plain" data-file="${name}"></script>`
  if (!html.includes(empty)) throw new Error(`找不到 ${name} 的占位块`)

  // 用函数替换，避免正文里的 $& / $1 被当成替换模式
  html = html.replace(empty, () => `<script type="text/plain" data-file="${name}">\n${text}\n</script>`)
  process.stdout.write(`${name}  ${text.length} 字符\n`)
}

writeFileSync(demoPath, html, 'utf8')
process.stdout.write(`写入 ${demoPath}  ${html.length} 字符\n`)
