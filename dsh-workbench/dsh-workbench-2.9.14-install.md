# dsh-workbench 2.9.14 安装说明

本版修一处**跑过的步骤没法再跑**：整条跑完之后，「运行」按下去什么也不会发生——它只会从
「第一个没跑完的步骤」接着跑，而没有这样的步骤。跑过的那几步想再来一遍，界面上没有入口。

## 为什么

问题不在引擎，在**按钮没有说自己跑哪一段**：

```
runAll(active, resumeAt, priorSession)
       resumeAt = 第一个 phase !== 'done' 的步骤
```

整条都完成时 `resumeAt === 0`，于是「运行」其实是从第 1 步重来一遍——但按钮上写着「运行」，
用户读到的却是「没有可跑的了」。同一个动作，在两种状态下是两件事，却只有一个词。

更缺的是第三种：**从第 2 步起重跑**（前一步不动，后面换新的）。这是「改了第 2 步的指令，只想
把后半段过一遍」时唯一想要的，而它根本没有入口。

## 改了什么

**范围由按钮自己说出来。** 同一个按钮，三个词，三种范围：

| 按钮 | 什么时候 | 按下跑哪一段 |
| --- | --- | --- |
| 运行 | 一步都没跑过 | 第 1 步起整条 |
| 接着跑 | 前面跑过、后面没跑 | 从第一个没跑完的步骤起 |
| 重跑 | 整条都跑过 | 第 1 步起整条 |

**右边那道缝后面是范围菜单。** 竖线隔开的右半块（▾）打开三行「范围 · 代价」：

- `从头跑 / 接着跑` — 默认项，带「默认」标，就是按钮按下去会做的事；
- `从头重跑` — 换新 N 份产物（一份都还没跑过时不摆这一行，它和上面那行是同一件事）；
- `从第 K 步起重跑` — 只在这一步选中、且它比默认起点更靠前时出现（否则它就是上面那一行）。

代价写的是**产物**（「换新 2 份产物」「都还没跑过」），不是步数：被换掉的是东西，不是步骤。
菜单底部常驻一句「重跑不丢东西：每一次运行的产物都留在运行记录里」——这是按下重跑之前唯一
需要被回答的问题。

**第三步：步骤自己的菜单。** 选中一步 → `⋯` → 「从这一步起重跑」。跑过的那一步头上的按钮
也从「单独运行」改成「重跑这一步」（同一个位置、同一个动作，两个词）。

**一条规则，三个入口共用**：只有前面的步骤都跑完了，才能从这一步起跑。否则跑完会得到一条
「前半段缺着、却算完成」的流水线，没有任何状态说得清那是什么。菜单里按不下去的行就是这一条，
`startAt` 里再拦一次。

**记录里写明起点。** 运行记录多了一个 `from`：一次从第 2 步起的整条运行，仍然是 `scope: 'full'`，
但 `from: 1`。没有它，「整条跑了一遍」和「重跑了后两步」在记录里长得一模一样，被跳过的第 1 步
看起来像被换掉了。

**完成之后，运行条会说各步是不是一套。** 重跑过后半段，整条依然是「完成」，但运行条不再只说
「2 步全部完成」，而是：

```
整条跑完过 · 第 1 步还停在第 1 次，其余是第 2 次 · 点「重跑」让整条一致
```

**运行时那道缝消失。** 一次运行只有一个出口（停止），所以左半边独占两个圆角；按钮字宽固定
96px，运行 / 接着跑 / 重跑 / 停止 / 正在停止 之间那道缝不会左右挪。

Esc 关掉所有菜单（顺手补的：以前只有弹层能 Esc 关，菜单不行）。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常）：

```
tar -xf dsh-workbench-2.9.14.tgz -C %TEMP%\wb-stage-2.9.14
robocopy %TEMP%\wb-stage-2.9.14\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.14\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.14.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

1. 一条**没跑过**的流水线：按钮是「运行」，右半块 ▾ 里有「运行」一行（带默认标）。按下去整条跑完。
2. 跑完之后：按钮变成「重跑」，再按一次 → 整条从第 1 步重来，产物全部换新。
3. 选第 2 步 → `⋯` → 「从这一步起重跑」→ 只有第 2 步及之后重新跑；运行条出现
   「整条跑完过 · 第 1 步还停在第 N 次…」，第 1 步的产物没动。
4. 中点停止（跑了一半）：按钮变成「接着跑」，指向第一个没跑完的步骤；▾ 里有「从头重跑」。
5. 窗口拖窄：按钮只剩图标，▾ 还在。

配套测试：`says which part of the chain it will run, and offers the parts it will not`、
`re-runs from a step, and the record of that run says where it began`、
`says the steps come from different runs once part of the chain was re-run`、
`refuses to start at a step whose predecessors have not run`；纯函数一侧是
`pipeline-view.spec.ts` 里的 `runScopeOf` / `canStartAt` / `runScopeRows`。
