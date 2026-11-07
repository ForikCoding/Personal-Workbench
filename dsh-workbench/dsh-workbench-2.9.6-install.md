# dsh-workbench 2.9.6 安装说明

本版修一件事：**流水线里跑的步骤拿不到运行指令**。

## 为什么

一句话在三个地方中的第二个地方被丢掉：

1. 页面把「运行指令」写进卡片 —— 2.9.5 已经修好了存储。
2. 流水线启动这一步时，把它放在请求的 `instruction` 里发出去。
3. Host 的 runner 有这一段：

```
const asked = mode.kind === 'card' ? request.instruction?.trim() : undefined
```

`mode.kind === 'card'` 只认「从卡片自己那页点运行」这一种；流水线的步骤是 `kind: 'step'`，于是这句话被当成没有 —— 子 agent 收到的是默认那句「把这个技能应用到当前工作区」，它自己挑了个题目，技能于是报「没有输入任务编号」。所以看起来像技能的毛病，实际是这一步的指令没送进去。

顺带一个同源的口子：卡片声明「运行指令必须填」时，卡片自己跑会被拒，流水线的步骤却不会被拒。

## 改了什么

- `src/skill-card-runner.ts`：`card` 和 `step` 都读这句话；步骤自己那句（流水线记录里的 `steps[].instruction`）优先，没有就用卡片存的那句；「必须填」的拒绝也覆盖步骤。
- `src/skill-card-contract.ts`：请求里 `instruction` 的说明改成「卡片运行和流水线步骤都带」。
- 新增 3 条用例（步骤拿到卡片那句话、步骤自己那句优先、必须填时步骤也拒）；把修复撤掉再跑，正好这 3 条全红。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常，最后那句 copy 不能省）：

```
tar -xf dsh-workbench-2.9.6.tgz -C %TEMP%\wb-stage-2.9.6
robocopy %TEMP%\wb-stage-2.9.6\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.6\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.6.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

进流水线 → 这一步的配置里填「分析效能任务T202608242753-1」→ 点「单步运行」。运行记录里那一步的指令应该就是这句话；如果还报「没有输入任务编号」，说明这一版没生效（看应用版本号）。
