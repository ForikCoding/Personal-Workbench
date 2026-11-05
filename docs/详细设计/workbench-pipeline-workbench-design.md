# 工作台：流水线编排重构设计

> 目标 UI：`docs/prototypes/workbench-pipeline-v2.html`（下称"原型 v2"）
> 替代的交互基线：`docs/prototypes/workbench-pipeline-2col.html`
> 状态：已实现，`corepack yarn workspace dsh-workbench check` 通过（992 tests）。

## 1. 为什么要重构

重构前，`workbench` 面板是一张**卡片网格**：每张卡片是一个技能实例，卡片自己开始运行、自己展示结果、自己打开配置页。这种形态对"单件产出一份文档"是够用的，但对原型 v2 表达的工作方式不够：

1. **顺序是用户的核心心智模型，网格表达不了顺序。** 一次发布检查是"看仓库 → 出变更清单 → 写摘要"三步，用户要看到这三步的先后、当前在哪一步、哪一步失败。
2. **单跑与串跑是同一件事的两种粒度。** 网格里每张卡片天然只能单跑；流水线里每一步既属于整条链，也要能单独重跑。
3. **结果、配置、活动是同一张卡片的三个视角，不是三个页面。** 网格点进卡片后整屏只剩一个视角，来回切换要退到网格再进一次。

所以面板从一个平面（网格）变成三区：**左轨（流水线 / 单任务）· 画布（步骤序列）· 检视器（活动 / 配置 / 结果）**。

## 2. 领域模型：一个步骤就是一张卡片

| 原型 v2 的说法 | 实现里的东西 | 说明 |
| --- | --- | --- |
| 流水线 | `WorkbenchPipeline` | 有序的步骤列表，有名字 |
| 步骤 | `WorkbenchPipelineStep` | `{ cardId, instruction? }`，**指向一张既有卡片** |
| 单任务 | 卡片本身（`workbench.cards` 的实例） | 技能 + 模板 + 目录 + 权限 + 模型 |
| 运行结果 | `WorkbenchResultRecord` | 已有；一次运行一条 |

这一步是本次重构最重要的取舍：**步骤不是新的实体，而是对卡片的一次引用**。技能、模板、工作目录、权限、模型都已经在卡片上，步骤只是"第几位执行它"。

由此得到两条免费性质：

- 画布上的每一步都能在检视器里打开它那张卡片的真实配置与结果，不需要新的存储。
- 卡片被删掉时，步骤变成"缺卡"状态（`pipeMissingCard`），流水线本身不失效。

## 3. 三区布局

```
┌──────────────────────────────────────────────────────────────┐
│ 工作台                                                       │  ← 面板自己的页头
├────────────┬──────────────────┬──────────────────────────────┤
│ 流水线      │ 发布检查   2 步   │ 活动 │ 配置 │ 结果          │
│  发布检查 2 │ ──────────────── │──────────────────────────────│
│ ＋ 新建     │ ① 看仓库  已完成  │                              │
│            │  │               │   （检视器：聚焦步骤的卡片视角）│
│ 单任务      │ ② 写摘要  等待中  │                              │
│  A 卡片     │                  │                              │
│ ＋ 新建卡片 │ ＋ 添加步骤       │                              │
└────────────┴──────────────────┴──────────────────────────────┘
```

- `grid-template-columns: 196px minmax(216px, 268px) minmax(0, 1fr)`，三区各自滚动。面板宽度 1280→1000 / 900→844，三区在这个区间里都放得下；`max-width: 760px` 时左轨折起，只保留画布 + 检视器（可读性优先于切换）。
- 页面外层在承载三区时换成 `.pagePipeline`：`overflow: hidden`、`align-items: stretch`、`gap: 12px`，因为滚动权已经交给三区自己，页面再滚就会出现两条滚动条。
- 三区共用一张 `1px` 边框 + `12px` 圆角的外框，靠 `border-right` 分隔，而不是三个独立卡片：它们是一块工作面。

### 3.1 检视器复用既有页面

检视器的三个页签**没有重新实现**，直接挂载已有的三个整屏页面：

| 页签 | 挂载 | 理由 |
| --- | --- | --- |
| 活动 | `SkillCardRunsPage` | 运行记录（含逐次历史、重新生成入口）就是"这一步发生了什么" |
| 配置 | `SkillCardConfigPage` | 模板、技能、目录、权限、模型的编辑面不能重写 |
| 结果 | `SkillCardResultPage` | 预览 + 源码 + 放大 + 重新生成已经在这里 |

代价：那三个页面自带整屏页头与返回控件，在检视器里会显得层级偏高。收益：结果页的模板预览（`pipeTemplateNote`「模板预览 · 不含本次产物」）、源码、审核弹窗的行为与单任务完全一致，不会出现"流水线里少一个按钮"。这是有意的交换，记录在此以便后续判断是否值得收窄。

页签顺序 **活动 → 配置 → 结果**：用户盯的是执行过程，先给过程。

### 3.2 尺寸与配色

只用 DSH 的别名变量：`--dsw-alias-bg-base / -bg-layer-1 / -bg-layer-2 / -bg-fill-hover / -border-l1/l2 / -label-primary/secondary/tertiary / -brand-primary / -state-error-primary / --dsw-font-family`。没有引入新的十六进制色；`color-mix(in srgb, ...)` 用来在明暗两套主题下都成立地淡化颜色（状态 chip、拖拽底色、菜单阴影）。字号 12/13/15，行高 18/22，字重不超过 500。

## 4. 流水线定义的持久化（Host 侧新增）

定义要跨窗口、跨启动存在，所以放在 Host 的存储域里，和卡片配置同一个 `ctx.storageDomain` 机制。

| 文件 | 职责 |
| --- | --- |
| `src/pipeline-contract.ts` | 线上契约：路径 `/api/workbench/pipeline`、`apiVersion`、上限（64 条流水线 / 32 步 / 名字 60 字 / 指令 2000 字 / 请求体 64 KiB）、`WorkbenchPipeline*` 类型、共享校验器 `parseWorkbenchPipelines` |
| `src/pipeline-spec.ts` | `defineDomain({ name: 'workbench_pipeline', layout: 'per-record', invalidRecords: 'backup-and-skip' })` + zod schema |
| `src/pipeline-service.ts` | `WorkbenchPipelineService`：`read()` 按 id 排序；`write(patch)` 先校验 revision，再**先删除后写入**（都在 id 序上），保证一次 PATCH 是原子的完整集合替换 |
| `src/pipeline-route.ts` | `GET` 返回 `{ apiVersion, revision, pipelines }`；`PATCH` 带 `baseRevision`，过期回 409 并附最新快照；非法 400；写失败 500；其他方法 405 + `allow: GET, PATCH` |

`revision` 是 `${bootStamp}:${changeCount}`：两个窗口同时改名时，后到的那次拿到 409，客户端把最新快照贴上去并提示"已在其他地方更新"，用户不会静默覆盖对方的改动。这与既有的 layout 写入约定一致（`WORKBENCH_LAYOUT_PATH`）。

**完整集合 PATCH 而不是按条 REST**：删一条流水线、改一步顺序，在 UI 上都是一次"保存这个列表"。完整集合让"删除 + 重排"成为一个请求，也让并发冲突的判定只有一个 `baseRevision` 可看。

## 5. 执行：客户端串行驱动，一步一次既有运行

流水线的执行**没有在 Host 里加编排器**。`usePipelineRun`（`src/client/pipeline/pipeline-run.ts`）在客户端按顺序驱动：

```
for 每一 步 i in [from..to]:
    api.start({ cardId, mode: { kind:'step', terminal: i===to, join: sessionId !== undefined }, sessionId?, instruction?, outputSchema })
    轮询 api.poll(cardId) 直到 phase ∈ {settled, cancelled}   // 按 runId 对上本次
    sessionId = state.result.sessionId                        // 交给下一步
```

- 新增第 4 种运行模式 `{ kind: 'step', terminal, join }`。它与卡片运行**只有会话语义不同**：模板、`{ html }` 输出契约、结果存储、取消、History 全部复用既有路径。
- `join: true` 却没有会话时直接 `invalid-request`：一条丢了会话的链必须报错，而不是悄悄从第一步重新开始。
- `terminal: true`（只有最后一步）在该步结算时归档会话；中间步骤**不得归档**，否则下一步会拿到一个已关闭的会话。

### 5.1 上下文传递 = 一条链一个会话

"执行完需求拆解，再执行详细设计，后者要看到前者"——答案不是传文档，而是**传会话**：

1. 第一步 `join: false`，Host 为它开一个会话（`openRunSession`）。
2. 它结算后，`state.result.sessionId` 告诉客户端这个会话是谁。
3. 第二步 `join: true` + `sessionId`，`attachRunSession` 把它挂到同一会话上继续。
4. 提示词不变（`renderWorkbenchSkillPrompt`），模型自然看到前几步的对话与工具结果。

不需要中间产物落盘、不需要把上一步的 HTML 注入下一步、不需要新的 handoff 字段。代价与边界：

- 一条链共用一个模型与权限（会话级），因此**以第一步的卡片值为准**；各步的工作目录必须一致，否则产物会落到第一步的目录里（见 §7）。
- 关掉面板会中断链：驱动在客户端。

## 6. 失败与中断

- 某一步没结算（`start` 被拒 / 轮询到 `failed` / 有 `failure`）→ 立刻停链，把失败步标红并给出原因（`pipeFailedAt`），后续步骤保持"等待"而不是"失败"——它们根本没跑。
- 用户点"停止" → `AbortController` 让轮询退出，当前步记 `stopped`。
- 单跑某一步（`runOne`）是同一条管道的切片 `[i, i]`：`terminal: true`、`join: false`，因此它自带独立会话，不污染整链的上下文。

## 7. 已知缺口（本次未做，需后续补齐）

1. **中断的链会留下未归档的会话。** 中间步骤失败或被停止时，它开的会话既没归档也没关闭，会出现在会话列表里。修复路径是给客户端一个可调用的 `settleSession` 路由，让停链时把它归档。当前只在文档里记住这一点。
2. **跨步骤的目录/模型一致性没有校验。** 一条链以第一步的卡片为准，若第二步的卡片指向别的目录，产物会静默写到第一步的目录。应在 `runAll` 前比较各步卡片的 `workspace`，不一致就拦住并说明。
3. **流式中间产物没有回传。** 画布只显示"第几步 · 已运行多久 · 结果"（轮询得知），没有逐步的 token/工具流。要做得更细需要 Host 侧的运行事件订阅。
4. **原型 v2 里的步骤级 `instruction` 只在契约与存储里打通，UI 还没有编辑入口**（画布只展示已有的指令）。补一个行内编辑即可，不动别的层。

## 8. 涉及文件

新增（Host）：`pipeline-contract.ts`、`pipeline-spec.ts`、`pipeline-service.ts`、`pipeline-route.ts`
新增（Client）：`pipeline-api.ts`、`pipeline-controller.ts`、`pipeline/pipeline-run.ts`、`WorkbenchPipeline.tsx`
修改：`index.ts`（客户端注册 + Host 第三个 `ctx.effect`）、`WorkbenchPage.tsx`（改为三区外壳，保留"外部打开某个卡片视角"的整屏行为）、`skill-card-contract.ts`（`step` 运行模式）、`skill-card-runner.ts`（`carryoverSessionId`、`SessionArchivePolicy`）、`workbench.module.css`（三区样式）、`locales.ts`（32 个 `pipe*` 键，中英各一份）

测试：`pipeline-contract.spec.ts`(11)、`pipeline-service.spec.ts`(12)、`pipeline-route.spec.ts`(11)、`pipeline-run.spec.ts`(9)、`skill-card-runner.spec.ts` 追加 6 条 `pipeline steps`、`WorkbenchPage.spec.tsx` 重写为 17 条三区用例。
