# dsh-workbench 2.4.19 安装与验证

## 这一版改了什么

结果页底部那一块从「分段选择器 + 一个白色写作台」改成**一行三个轻按钮**，其中两个要写句子的走**弹窗**：

- `在上一版上改`、`从头跑`、`编辑` 并排一行，图标 + 文字，静息是次要灰；悬停/聚焦时变深并出现浅灰药丸；不可用时整行变淡但仍占位，页面不会因为状态变化而换行。
- 点 `在上一版上改` 打开「只改这一份结果」的弹窗（标题 + ×、一行说明、大输入框、取消 / 重新生成）；`Enter` 提交，`Shift+Enter` 换行，空内容时提交按钮关闭。
- 点 `从头跑`：技能卡**需要指令**时打开弹窗（必填时按「运行」先在弹窗里提示「写一句这次要它做什么」，不会静默发送）；**不需要指令**时**不弹窗，直接跑** —— 一个什么都问不出来的表单没有意义。
- 点 `编辑` 仍然是原地换掉文档（不弹窗）：它改的就是屏幕上那段内容，把它挪进弹窗会让文档和它的草稿分开。
- 一次运行占着这张卡时，`从头跑` 原地变成 `取消`，不再另外长出一个停止按钮；`在上一版上改` 关闭，`编辑` 收起。
- 弹窗本身补齐了键盘契约：`Esc` 关闭、`Tab` 圈在弹窗内、打开时焦点落在输入框、关闭后焦点回到打开它的那个按钮、点遮罩关闭（在弹窗内部按下、拖到遮罩上结束不算关闭）。

弹窗是 `createPortal` 挂到 `document.body` 上的：产品没有 dialog 原语，而 `position: fixed` 放进有 transform 的祖先里会按祖先定位，结果就是弹窗跑到页面外。

## 装法

已经不在了的旧步骤不用重做，只需要把 profile 指到新包：

```powershell
# 1) 解包
$stage = Join-Path $env:TEMP 'wb-stage-2419'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.19.tgz -C $stage

# 2) 覆盖到 profile 的 node_modules
$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force

# 3) profile 指向新包
#    C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\package.json
#    "dsh-workbench": "file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.4.19.tgz"
```

装完**必须整个退出 DSH Desktop 再重开**，然后 `Ctrl+F5`。只刷新页面不换掉主进程里已经加载的旧 host 代码。

## 怎么验

1. 打开一张有结果的技能卡，滚到文档底部：一行 `在上一版上改 / 从头跑 / 编辑`，下面接修改记录。
2. 鼠标移到任一个按钮上：浅灰药丸 + 文字转深；键盘 `Tab` 过去时有描边。
3. 点 `在上一版上改`：弹窗盖住整页，标题、说明、大输入框、右侧 `取消 / 重新生成`；输入框一开始是空的，提交键是灰的。
4. 打一行字按 `Enter`：弹窗关掉、结果开始重跑；按 `Esc` 或点遮罩：弹窗关掉、结果原样不动。
5. 点 `从头跑`：需要指令的卡会弹窗（什么都不写就点「运行」→ 弹窗里出现一句要求），不需要指令的卡直接开始跑、不弹窗。
6. 跑起来以后再到底部：`从头跑` 变成 `取消`，点它能停下这次运行。
7. `Tab` 在弹窗里循环、关闭后焦点回到刚才那个按钮。

## 回归

`corepack yarn check` 全绿：typecheck 0 error；`vitest` 50 passed / 1 skipped（911 passed, 3 skipped）；build 0；`verify:artifacts` 干净（CSS 内联 69,793 字符，外部依赖仅 `@deepseek-ai/dsh-client-store / ui-primitives / ui-slots`、`react`、`react-dom/client`、`react/jsx-runtime`）。
