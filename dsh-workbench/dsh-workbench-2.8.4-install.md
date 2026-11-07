# dsh-workbench 2.8.4

## 没有模板的卡片：编辑框照样在，而且就是它给你开个头

你截图那张卡片**还没有模板**，我上一版把这种情况写成了「一句话 + 两个点不动的页签」——没有模板就把编辑框整个藏起来，于是这张卡片**没有任何地方可以动手**。这就是"不能用"。

现在：

- **源码**：永远是那个白底编辑框。没有模板时它是空的，占位提示就是那句话「这张卡片还没有模板。先给它写一个 HTML 模板。」
- 打字、失焦 → 写进这张卡片（`{ skill, html }`），模板从此就有了，再切回预览就是渲染出来的样子。
- **预览**：没有模板时显示那句话（`data-cfg-empty`），因为还没有东西可渲染。

也就是说，这张卡片从"没模板、没入口"变成"打开就是空的编辑框，写完就有"。页签也不用先点——预览说没有模板，源码就能写。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-284'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.8.4.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 指向 `dsh-workbench-2.8.4.tgz`，之后**完全退出** DSH Desktop（含托盘图标）再开。

## 怎么验

在你截图那张卡片上：

1. 点「源码」：白底空框，灰字占位「这张卡片还没有模板。先给它写一个 HTML 模板。」
2. 点进去、敲几行 HTML、点别处。
3. 再点「预览」：就是刚写的模板渲染出来的样子。

如果点「源码」还是只有那句话、没有框——那是旧包还在跑，告诉我一声。

## 回归

`check` 全绿：typecheck 4 份 0 错、vitest **1032 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 503 kB。

新用例 `lets a card that has no template get one from the source box`：卡片没有模板时 → 源码视图里编辑框存在、值为空、占位就是那句话 → 敲入内容、失焦 → 写出去的是 `{ skill, html }`，html 就是敲的那份。这条用例正是上一版漏掉的状态。

改动：`WorkbenchPipeline.tsx`（空状态从"一句话"变成"空编辑框 + 占位提示"，预览才显示那句提示）、`tests/WorkbenchPage.spec.tsx`。
