# dsh-workbench 2.8.3

## 模板 → 源码：编辑框现在既**能打字**，也**看起来能打字**

### 1. 灰色的问题：那是我给的样式

`.wb-docSrc` 原来照抄了原型里"只读源码栏"的配色：`--recess`（3% 墨色压暗的底）+ `--ink2`（次要墨色字）。只读的时候那是对的，变成输入框以后，这一套读起来就是"禁用"。

现在：白底（`--card-bg`）、正文墨色（`--ink`）、`cursor: text`、聚焦时边框转强调色并带一圈浅环（`:focus` → `--accent` + `--accent-wash`）。字没动，仍是原型那套：等宽字体、11px / 17px 行高、圆角 10px、0.5px 边框。

### 2. 更可能的真原因：受控

原来那个框是**非受控**的（`defaultValue`）。这张面板会跟着运行状态重渲染，非受控输入框碰上重渲染就是"敲了没反应 / 光标跳走"的经典现场——jsdom 里测不出来，因为测试不会重渲染它。

现在值由本地 `draft` 拿着：`onChange` 收字，`value={draft}`，卡片里存的模板一变（`useEffect` 跟着 `template`）再同步回来，失焦才写回卡片。重渲染不会再把正在打的字冲掉。

### 3. 用例现在证明的是"能编辑"

`edits the template in the source box and stores what was typed` 断言：`TEXTAREA`、`disabled === false`、`readOnly === false`、**能聚焦**（`document.activeElement` 就是它）、敲进去的字真的留在 `value` 里、失焦后写入的是 `{ skill, html }`，内容就是用户敲的那份。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-283'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.8.3.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 指向 `dsh-workbench-2.8.3.tgz`，之后**完全退出** DSH Desktop（含托盘图标）再开。

## 怎么确认你打开的是这一版

点进「源码」以后：这个框是**白底、黑字**，鼠标进去是工字光标，点进去边框变蓝、外面一圈浅蓝。看不到这一圈，就是旧版本还在跑——那就说明重启没把新包读进来，别再按"能不能编辑"判断了，直接告诉我。

## 回归

`check` 全绿：typecheck 4 份 0 错、vitest **1031 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 503 kB，内联 CSS 138477 字符。

改动：`WorkbenchPipeline.tsx`（受控 `draft`）、`pipeline.css`（编辑框配色 + 聚焦环）、测试；原型 `docs/prototypes/workbench-pipeline-v2.html`（同一套 `.docSrc` 配色与聚焦环）。
