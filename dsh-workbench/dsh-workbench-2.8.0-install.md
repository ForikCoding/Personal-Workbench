# dsh-workbench 2.8.0

## 模板块不再是死区：预览/源码会切，源码里标出区域，「编辑模板与设置」通向真正的编辑器

### 1. 预览 / 源码 —— 真的在切

两个都不是装饰：点「源码」显示这张卡片存的 HTML 模板全文，「预览」显示模板骨架里那块区域的位置（原型说过：预览故意不填本次产物，那是「结果」的事）。

### 2. 源码里那两行区域标记会高亮

`<!-- template-begin -->` / `<!-- template-end -->` 用强调色标出来。它们说明「模型每次只重写这一段」，而在九十行模板里它们原本是看不见的。标记取自契约常量（`WORKBENCH_REGION_BEGIN` / `END`），改名字这边不会失联。源码区上方还有一句说明，和原型一致。

### 3. 「编辑模板与设置」通向卡片自己的配置页 —— 也就是模板编辑器

原来这颗按钮打开的是**结果阅读器**，答的是另一个问题。模板是在卡片自己的页面上写的（`SkillCardSettings` 里那份 HTML 编辑器），所以现在它直接把那张卡片的**配置页**打开。没有模板的卡片，这句话加这颗按钮就是唯一的入口，必须通。

### 4. 原型同步

原型里也加了同一颗「编辑模板与设置」，点开是一个编辑层：改模板、保存，预览和源码立刻跟着变（源码的标记同样高亮）。不是画上去的按钮——我在 headless Chrome 里真点了一遍：打开 → 改内容 → 保存 → 源码里读到新模板，标记 2 个，页面 0 报错。改动记在原型变更第 17 条。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-280'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.8.0.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 指向 `dsh-workbench-2.8.0.tgz`，之后**完全退出** DSH Desktop 再开。

## 怎么验

1. 配置 → 模板块：点「源码」，看到卡片模板全文，两行 `template-begin/end` 是强调色。
2. 点「预览」，回到骨架 + 区域占位。
3. 点「编辑模板与设置」：打开这张卡片的配置页（就是能写模板的那一页），不是结果阅读器。
4. 在那一页把模板改一句、保存，回到工作台模板块点「源码」：新模板在里面。

## 回归

`corepack yarn workspace dsh-workbench check` 全绿：typecheck 4 份 0 错、vitest **1031 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 502 kB，内联 CSS 137977 字符。

新增用例两条：`opens the card page from the template block, because that is where a template is written`（点按钮 → 打开的是这张卡片的页面）、`switches the template block between preview and source`（切到源码 → 模板正文 + 两处标记高亮；切回预览 → 源码消失）。

改动：`WorkbenchPipeline.tsx`（`regionMarked`、源码说明、按钮改去向）、`WorkbenchPage.tsx`（`openCardPage` 落在配置页）、`locales.ts`、`pipeline-classes.ts`、`pipeline.css`（`.wb-mk` 字重）、`tests/WorkbenchPage.spec.tsx`；原型 `docs/prototypes/workbench-pipeline-v2.html`（编辑层 + 第 17 条变更）。
