# dsh-workbench 2.5.0 安装与验证

## 这一版改了什么

**工作台从一张卡片网格，变成一个流水线工作面。**

网格能表达"我有哪些卡"，不能表达"这几步按顺序跑"。这一版按 `docs/prototypes/workbench-pipeline-v2.html` 重做成三区：

```
┌──────────┬───────────────┬──────────────────────────┐
│ 流水线    │ 发布检查  2 步 │ 活动 · 配置 · 结果        │
│ ＋ 新建   │ ① 看仓库 完成 │                          │
│ 单任务    │ ② 写摘要 等待 │  聚焦那一步的卡片视角      │
│ ＋ 新建卡 │ ＋ 添加步骤    │                          │
└──────────┴───────────────┴──────────────────────────┘
```

关键决定：**一个步骤就是一张既有卡片加一个位置**（`{ cardId, instruction? }`）。技能、模板、目录、权限、模型都已经在卡片上，所以加一步不用再配一遍；反过来，画布上任何一步都能在检视器里打开那张卡真正的配置与结果。

- **流水线定义存 Host**：新增 `/api/workbench/pipeline`，`GET` 取快照、`PATCH` 提交整套（带 `baseRevision`）。两个窗口同时改会拿到 409 与最新快照，提示"已在其他地方更新"，不会互相覆盖。
- **执行在客户端串行驱动**，一步一次既有的卡片运行，没有在 Host 里加编排器。新增第四种运行模式 `{ kind:'step', terminal, join }`，与卡片运行只差会话语义；模板、`{ html }` 输出契约、结果存储、取消全部复用。
- **步骤之间传的是会话，不是文档**：第一步开一个会话，结算后把 `result.sessionId` 交给第二步继续。模型自然看到前几步的对话和工具结果，提示词一个字没改。
- 只归档最后一步的会话；中间步骤归档了，下一步就会挂到一个关掉的会话上。
- 某一步没结算就停链，并把原因写在画布上（第几步、为什么），后续步骤保持"等待"——它们根本没跑。
- 单跑某一步 = 长度为 1 的链，自带独立会话，不污染整链上下文。
- **交接单落盘兜底**：每一步结算时把自己要留给后人的那段话写进工作目录 `.workbench/handoff/<流水线>/<步号>.md`（由输出的 `handoff` 字段决定，每次覆盖，单条 8 KiB、合计 24 KiB）。链的第一步、以及单独重跑的某一步会读它，按步序拼成 `<previous_steps>` 放进提示词；能接上会话的步骤不读——对话本身就是前文。读不到当作没有、写不进只 warn：落盘只是兜底，坏了不该让已经跑完的一步失败。
- 检视器三个页签**直接挂载**既有的运行记录 / 配置 / 结果页，没有重写：结果页的模板预览、源码、放大、重新生成，与单任务完全一致。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-250'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.5.0.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 换成 `dsh-workbench-2.5.0.tgz`。装完整个退出 DSH Desktop 再重开，`Ctrl+F5`。

## 怎么验

1. 打开工作台：左边是「流水线」（一开始是空的 + 「＋ 新建」）和「单任务」（你已经有的卡片）。
2. 「＋ 新建」→ 出现一条空流水线（`0 步`），点「＋ 添加步骤」，从列表里挑一张卡；再挑第二张。
3. 画布上两步竖排、连线、编号；点任一行，右边检视器切到那一步的卡片视角（活动 / 配置 / 结果）。
4. 点「运行流水线」：第一步变「进行中」→「已完成」并显示耗时，第二步接着跑；跑完画布上方写「N 步已结束」。
5. 想只重跑第二步：鼠标移到那一行 → 「只运行这一步」。
6. 想重排：同一行的 `↑` `↓`；移出：`✕`。
7. 改名：行尾 `⋯` → 重命名，回车；删除：`⋯` → 删除 → 再点一次「确认删除」（4 秒内）。
8. 回到会话列表：整链跑完只会留下**一个**会话。

## 回归

`corepack yarn workspace dsh-workbench check` 全绿：typecheck 4 份 tsconfig 全 0；`vitest` **1015 passed / 3 skipped**（57 个 spec 文件）；build 0；`verify:artifacts` 干净。

本次新增测试：`pipeline-contract.spec.ts`(11)、`pipeline-service.spec.ts`(12)、`pipeline-route.spec.ts`(11)、`pipeline-run.spec.ts`(9)、`pipeline-handoff.spec.ts`(15)、`skill-card-prompt-handoff.spec.ts`(4)、`skill-card-route.spec.ts` 追加 4 条步骤模式（此前 `kind:'step'` 会被 400 拒掉，正是这组用例暴露的）、`skill-card-runner.spec.ts` 追加 6 条 `pipeline steps`；`WorkbenchPage.spec.tsx` 从网格用例重写为 17 条三区用例（含"两步按序跑、第二步带上第一步的 sessionId"与"第一步失败则第二步不启动"）。

## 没做的（写进设计文档 §7）

- 中断的链会留下一个未归档的会话（缺一个客户端可调的 `settleSession` 路由）。
- 跨步骤的工作目录一致性没有校验：一条链以第一步的卡片为准。
- 画布上没有步骤级 `instruction` 的编辑入口（契约与存储已经通了）。
- 面板关闭会中断链：驱动在客户端。
- 交接单的写入在 runner 里，测试覆盖到模块 / 路由 / 提示词三层，runner 里那两行只过了类型检查与代码审阅。
