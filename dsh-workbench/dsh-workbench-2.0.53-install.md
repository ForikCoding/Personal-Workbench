# dsh-workbench 2.0.53 · 安装说明（无行数据按钮改传纯文本内容）

**背景**：2.0.51 起，按钮没有 `data-dsh-row` 时自动把「当前卡片文档」传给目标卡片。2.0.52 修复了无模型卡片的运行报错。本版处理反馈：**payload 里不再传整份 HTML（噪音多），改为后台把文档解析成干净的多行纯文本传给目标**。

```
dsh-workbench-2.0.53.tgz    约 286 KB
```

**只改了客户端（client.js），没有动宿主（index.js）→ 刷新页面（Ctrl+R）即可生效，不需要重启。**

---

## 改了什么

- `render.ts` 新增 `documentText(html)`：解析文档，块级元素换行，剔除 `<style>`/`<script>`/注释，折叠连续空行，返回完整可见文本（不截断）。
- `controller.ts`（无行数据按钮的兜底 payload）：
  - 之前：`{ "template": "<完整 HTML 文档>" }`
  - 现在：`{ "content": "业务背景：……\n任务单要求：……\n改动内容：……\n影响分析：……" }`
- 确认面板显示的就是这段干净文本，一眼可读；「详细设计」子代理的 `<row_data>` 里是纯文字，模板写一句「row_data.content 是任务分析输出的内容」即可。

## 门禁

- `typecheck` 0；全量 `vitest run`：**759 通过 / 3 跳过**（新增 `documentText` 的 4 个单测）。

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.0.53.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.52\.tgz', 'dsh-workbench-2.0.53.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

**刷新 DSH 页面（Ctrl+R）** 即可，无需重启。

## 验证清单

- 「任务分析」出结果 → 点「下一步：详细设计」→ 确认面板显示**纯文本**（`content` 字段，无 HTML 标签）→ 确认后「详细设计」正常开始，能拿到任务分析的文字内容。
