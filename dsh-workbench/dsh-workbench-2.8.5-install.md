# dsh-workbench 2.8.5

## 预览下面的小字和区域说明，现在是这个块的固定部分

按原型补齐两处：

### 1. 「模板预览 · 不含本次产物」

框上面那行小字（11px、次要墨色），位置在预览框正上方，和原型一致。它说明这张图是什么——模板的渲染，不是这次运行的产物。

### 2. 「区域内容 · 运行时由模型生成，模板把它替换进这块位置」

- 模板里有区域标记（`<!-- template-begin -->` / `<!-- template-end -->`）→ 占位块就出现在模板里那块位置上：虚线框 + 「区域内容」小标签 + 一行说明。
- 模板是区域标记出现之前写的、里面没有标记 → 占位说明放在预览框**下面**（同样的虚线框 + 小标签），而不是干脆不显示。
- 这两处的文字都走 locale（`pipeCfgRegion` / `pipeCfgRegionBody`），不是写死的中文——原型里写的就是这两个词。

之前这两个字符串虽然翻译表里都有，但上一版把整块换成了 shadow 渲染，占位文字是写死的、而且没有区域标记的模板就什么都不显示。现在两条路都有，且文字来自同一份文案。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-285'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.8.5.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 指向 `dsh-workbench-2.8.5.tgz`，之后**完全退出** DSH Desktop（含托盘图标）再开。

## 怎么验

配置 → 模板（停在「预览」）：

1. 框上方应有那行小字「模板预览 · 不含本次产物」。
2. 框里是模板的渲染，其中一块虚线框写着「区域内容」+「运行时由模型生成，模板把它替换进这块位置」。
3. 换一张模板里没有区域标记的卡片看：这句说明会出现在框下面。

## 回归

`check` 全绿：typecheck 4 份 0 错、vitest **1032 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 505 kB，内联 CSS 138959 字符。

预览那条用例现在明确断言：`[data-cfg-preview-note]` 的文字就是 `pipeCfgPreviewNote`，渲染出来的帧里有 `pipeCfgRegion` 那段占位说明。

改动：`WorkbenchPipeline.tsx`（`regionPlaceholder` / `escapeHtml` / `tplRegion` 兜底）、`pipeline-classes.ts`、`pipeline.css`（`.wb-tplRegion*`）、测试。
