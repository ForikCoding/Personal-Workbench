# dsh-workbench 2.4.27 安装与验证

## 这一版改了两处

### 1. 运行中的那一行不再说「本次没有产出内容」

运行历史里，正在跑的那一行标题行原来落到「本次没有产出内容」—— 那是给**已经结束、什么都没留下**的运行的句子。同时右边状态写着「运行中」，一行里两个事实互相打脸：它既说运行结束了，又说在跑。

现在按两种事实分开说：

- 还在跑、暂时没有内容 → `正在运行，结果出来后显示在这里`
- 已结束、确实没有内容 → 仍然是 `本次没有产出内容`

判定用的是同一行右边那个状态用的词（`stopReason === 'running'`），所以标题和状态不会再各说各话。

### 2. 「工作目录」从结果页最下面挪到标题下面

上一版把它放在操作行（`修改 / 运行 / 编辑 / 已完成 · n 步`）下面。位置上的问题是：**它在一份长度不定的文档之后**，报告越长，这行越靠下 —— 而它说的是"这份结果是在哪个目录里做出来的"，属于**这条结果的身份证**，不是脚注。

现在它在页头的事实行里，和技能名并排：

```
我的任务
xiaoneng-task-detail · 工作目录 D:\Git\deepseek-harness
```

页头是 sticky 的，所以往下滚报告时它也一直在。路径太长会在原行里省略（悬停能看全），目录失效时仍然是告警色。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-2427'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.27.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\node_modules\dsh-workbench'
# 实际路径：
# C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 已指向 `dsh-workbench-2.4.27.tgz`。装完**整个退出 DSH Desktop 再重开**，`Ctrl+F5`。

## 怎么验

1. 打开「我的任务」的运行历史：正在跑的那一行标题应是 `正在运行，结果出来后显示在这里`，右边仍是 `运行中`；它结束之后，同一行会变成真正的摘要（或 `本次没有产出内容`，如果它确实什么都没产出）。
2. 打开任意一次运行的结果页：标题 `我的任务` 下面那行是 `xiaoneng-task-detail · 工作目录 D:\Git\deepseek-harness`。
3. 往下滚动长报告：页头吸顶，工作目录跟着一起留在顶部。
4. 操作行下面不再有那行目录。

## 回归

`corepack yarn check` 全绿：typecheck 0；`vitest` 51 passed / 1 skipped（**931 passed, 3 skipped**）；build 0；`verify:artifacts` 干净（CSS 内联 68,515 字符）。

断言更新：运行历史"在飞的那一行"用例现在同时断言 `[data-run-history-nothing]` **不存在**、`[data-run-history-pending]` 是 `正在运行，结果出来后显示在这里` —— 也就是不允许它再说成"没有产出"。
