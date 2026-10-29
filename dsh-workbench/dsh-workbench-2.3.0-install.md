# dsh-workbench 2.3.0 版 安装说明（卡片里的 Markdown 阅读器）

```
dsh-workbench-2.3.0.tgz    约 312 KB
```

**宿主（index.js）和客户端（client.js）都改了 → 需要重启 DSH Desktop，再刷新页面。**

---

## 这一版做了什么

**1. 模板里的 `<script>` 现在会执行（本版主题）**

之前模板是「纯 HTML」：`script` 标签会被内容策略拒绝或剥掉，卡片只能显示 run 填进来的那段 HTML。所以卡片永远看不见磁盘上的文件——因为浏览器页面没有文件系统 API，`fetch('file:///…')` 也会被拒绝。

现在：

- 模板自己的内联 `<script>` 会执行（`type="module"` 也行），执行时机是卡片渲染完文档之后。
- 脚本拿到一个参数 `dsh`，这就是它通向宿主的两条路：
  - `dsh.files.list(path)` → `{ path, entries: [{ name, path, type, size? }], truncated }`
  - `dsh.files.read(path)` → `{ path, text, bytes }`
  - `dsh.markdown.render(element, text)` → 把 Markdown 渲染进文档里的某个元素（和对话里一样的渲染器）
  - 还有 `dsh.cardId`、`dsh.runId`、`dsh.root`、`dsh.host`
- 路径相对**这张卡自己的工作目录**解析（也可以给绝对路径）；越出这个目录一律拒绝。

**2. 新增一条只读路由**

`GET /api/workbench/skill-card/files?cardId=…&path=…`

- 同一形状既列目录也读文件，由 path 指向什么决定。
- 只读：没有任何写操作。
- 越界即拒绝：路径先 `realpath`（跟随符号链接/junction）再判断是否在卡片目录内。
- 目录最多列 500 条（多余的 `truncated: true`）；文件上限 1 MiB；二进制与非 UTF-8 文件拒绝（`not-text`）。
- 失败都是带码的：`no-workspace`、`outside-workspace`、`not-found`、`not-directory`、`not-file`、`not-text`、`too-large`，客户端把每个码翻成一句中文/英文文案，由脚本自己 `try/catch` 显示。

**3. 区间（run 填的那段）依然不许有脚本**

模板是用户自己的代码，所以它的脚本跑；区间是**模型每次运行写出来的文本**，里面的 `script` 仍被结果编辑器拒绝，并且在拼接前被剥掉。所以模型写不出行为，只有你能。

**4. 加载器要求没变**

`client.js` 只多 require 了 `@deepseek-ai/dsh-client-ui-primitives`（Markdown 渲染器来自这里）和 `react-dom/client`，两个都在现有的共享模块表里，**没有引入新的运行时依赖**（插件依赖仍然只有 `zod`）。

## 配套的卡片模板（Markdown 阅读器）

模板内容见这次对话里确认过的那份（`reader` 布局：左侧目录树、右侧 Markdown 正文、`刷新` / `上一级`）。要点：

- skill 只需在区间里放一行，告诉脚本读哪个目录：

```html
<div data-dsh-files="任务分析" hidden></div>
```

- 模板脚本读这个属性；没有就用默认值 `任务分析`（相对卡片工作目录）。给绝对路径也可以，只要仍在卡片目录内。
- 目录里的 `.md/.markdown/.mdx` 用 Markdown 渲染，其它文本文件用 `<pre>` 显示原文，二进制文件会给出「这个文件不是文本」。
- 刷新按钮重新列目录，并保持当前打开的文件。

模板保存时不会再有「不允许 script 标签」的报错；那条文案现在只出现在**区间编辑器**里，措辞也改成了「区间内容里不允许 script 标签」。

## 门禁

- `typecheck` 0
- 全量 `vitest run`：**814 通过 / 3 跳过**（新增：文档服务的越界/软链接/二进制/超限/条目上限、文档路由的状态码、脚本包装与执行、绑定的请求形状与错误翻译、Markdown 渲染进嵌套 shadow root、模板接受内联脚本、外部 `src` 脚本仍被拒等）

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.3.0.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force
```

再把 profile 的 `package.json` 里 `dsh-workbench` 指向新的 tgz：

```
"dsh-workbench": "file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.3.0.tgz"
```

**重启 DSH Desktop**，再刷新页面。

## 验证清单

- 打开卡片配置，粘贴阅读器模板 → 保存不再报 `script` 违规。
- 卡片工作目录下建一个 `任务分析\a.md`（随便写点 Markdown），skill 的区间里放 `<div data-dsh-files="任务分析" hidden></div>`，跑一次。
- 卡片左侧应出现目录：目录在前、Markdown 文件在前，点击文件右侧渲染出 Markdown 正文（标题、列表、代码块、表格和对话里一致）。
- 点「刷新」：新写的文件出现，当前打开的文件还在。
- 点「上一级」：回到上层目录（最高到卡片工作目录为止，再往上会被拒绝）。
- 把一个 `.png` 或 2 MB 的文件放进目录再点开：显示「这个文件不是文本」/「这个文件太大」。
- 在区间里手写一段 `<script>alert(1)</script>`：编辑器拒绝；即使存进去了，渲染时也会被剥掉。
