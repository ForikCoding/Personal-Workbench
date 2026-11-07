# dsh-workbench 2.8.1

## 按原型改回来：模板块只有「预览」和一个编辑框

上一版我加了三样原型里没有的东西：一句源码说明、把区域标记高亮成彩色、以及一颗会跳到别处的「编辑模板与设置」按钮。都是我自作主张。这一版全部撤掉，回到原型的样子：

**源码就是一个编辑框。** 模板在这里读，也在这里改。改完失焦就写进这张卡片；`预览` 看模板骨架，源码和预览是同一块地方的两种看法，一次只显示一个。

字和样式沿用原型那份 `.docSrc`（原样搬过来，一个值没改）：

| | |
|---|---|
| 字体 | 等宽 `var(--f-mono)` |
| 字号 / 行高 | 11px / 17px |
| 底色 | `var(--recess)` |
| 边框 | 0.5px `var(--divider)`，圆角 10px |
| 颜色 | `var(--ink2)` |

作为编辑框只多了三件必须的事：`width:100%`、`min-height:160px`、`resize:vertical`。截图实测：`TEXTAREA`、mono、11px/17px、`rgb(249,250,251)`、圆角 10px。

### 写入

失焦才写（和其它行一致）——逐键写等于每敲一个字重写一遍卡片。模板跟技能绑在一起，所以写入带的是 `{ skill, html }`：技能变了模板要按新契约填，不能张冠李戴。写不进去会出红字，不会沉默。

### 原型同步

原型的模板块也是这个编辑框（`data-tpl-text`），边打边存进这一步，切到预览再切回来内容还在（实测 `kept true`，页面 0 报错）。变更清单第 17 条改写了：只有预览 + 一个编辑框，没有说明、没有弹层、没有第二颗按钮。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-281'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.8.1.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 指向 `dsh-workbench-2.8.1.tgz`，之后**完全退出** DSH Desktop 再开。

## 怎么验

1. 配置 → 模板块：右边是「预览 / 源码」两个小按钮，没有别的。
2. 点「源码」：一个等宽字体的编辑框，里面是这张卡片的模板全文，可以直接改。
3. 改一句，点别处（失焦），再切到「预览」再切回来：改动还在。
4. 换一步看：模板是每张卡片自己的，不该跟着别的步骤变。

## 回归

`corepack yarn workspace dsh-workbench check` 全绿：typecheck 4 份 0 错、vitest **1031 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 502 kB，内联 CSS 138006 字符。

用例「edits the template in the source box and stores what was typed」断言三件事：源码是 `TEXTAREA`、里面是卡片当前的模板、失焦后写入的是 `{ skill, html }` 且内容就是用户敲的那份。另一条断言预览/源码一次只显示一个。

改动：`WorkbenchPipeline.tsx`（编辑框取代只读 `<pre>`，去掉说明/标记高亮/跳转按钮）、`WorkbenchPage.tsx`（`saveStepTemplate`）、`pipeline.css`（`.wb-docSrc` 变成编辑框尺寸）、`pipeline-classes.ts`、`locales.ts`、测试；原型 `docs/prototypes/workbench-pipeline-v2.html`。
