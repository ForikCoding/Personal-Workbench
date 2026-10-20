# 卡片工作目录：把"一道门"做成"一间房"

> 状态：**插件侧已落地（第十四版），栅栏本身仍未验证。** 本文原来是施工方案，现在改成"做完了什么、还差什么"的记录；原方案里那份**实测证据**留着，因为它仍然是"为什么传 `cwd` 解决不了问题"的唯一记录。

**两条限制写在最前面，它们比本文任何一句"已落地"都重要：**

1. **栅栏本身没有测试。** `dsh-workbench/tests/skill-card-workspace-sandbox.spec.ts` 仍是**故意 skip 的 3 条**：它需要真实宿主、真实会话与真实文件写入，**它是规格，不是一条通过的测试**。不要为了让构建变绿删掉它，也不要把断言改成今天代码所做的事。
2. **没有任何真实应用跑过它。** 全部证据是单元测试与下面那份探针脚本，**没有一次点击记录**——没有一次真实的"选目录 → 运行 → 看写入落在哪"。

合起来只有一句：**插件把运行挂在一个根在卡片目录的 agent 上；那之后沙箱是否真的拒绝越界写入，没有人验过。**

## 今天的样子

| 事实 | 状态 |
|---|---|
| 卡片记下目录 | ✅ |
| 没有目录 / 目录不存在时拒绝运行 | ✅（启动前一次 `stat()`，`workspace-missing` / `workspace-invalid`） |
| 运行挂在**一个根在卡片目录的 agent** 上（作为 `parent`） | ✅ 已落地：`src/skill-card-runner.ts` 的 `cardAgents` / `cardParent` |
| 每卡一个 agent、建一次后复用、存的路径变了拆旧重建、`dispose()` 释放 | ✅ 已落地，四个用例覆盖 |
| 结算后归档卡片会话，侧边栏保持干净 | ⚠️ 调用走 `workspaceRegistry.archiveSession`，`workspaceRegistry` 也在 `inject` 里（探针 case `[3]` 量过这个成员能被接受）；**但没有一次真实运行证明侧边栏真的少了那一行** |
| 子会话头（以及沙箱根的来源）是卡片目录 | ❓ 机制成立（头从父复制），**没有断言、没有真机** |
| 子代理的"有效工作目录" | ✅ 取自父的会话头（`resolvedCwd = parent.session?.header?.cwd ?? cwd`）；**没有用例能分辨它与会话目录**（fake 里两者同名 `/repo`） |
| 越界写入被拒 | ❓ 只在那 3 条 skip 的规格里被描述 |

## 为什么不能靠传 `cwd` 解决

`startActivation({ request: { cwd } })` 只产生一次 `working-directory/change` 投影：

- `childSessionMeta` 让子会话的 `session.header.cwd` **永远是父的**；
- `sandboxPolicy.resolve()` 的 `workspaceRoot` 取自 `session.header.cwd`。

测量脚本：`dsh-plugin-desktop/scratch/agent-cwd-probe.mjs`，用例 `[1b]`。

## 已经误导过一次的计划

"把执行底座从 `startActivation` 换成 `agents.create`，自己接管提示词投递、`{html}`
捕获、重试、取消、`agent/error` 归因" —— **四次尝试全部零改动**。

原因不是执行不力，是**任务被定义错了**：那等于在这个插件里重写一套上游子代理运行时。

## 采用的方案：给卡片造一个薄父 agent

`childSessionMeta` 复制**父**的 header cwd。所以只要父本身根在卡片目录，子就跟着落位。

```
cardAgent = agents.create({ sessionId, meta: { cwd: 工作区 } })   ← 每卡一个
seam 子 agent: request.parent = cardAgent
    → 子会话 header.cwd = 工作区
    → 沙箱根 = 工作区                                     ✅ 机制成立（未验证）
```

**seam 仍然负责**提示词投递、`{html}` 捕获、重试、取消、错误归因——**一行都没有重写**（它本来也不该被重写）。

### 实测证据（case `[5]`，`--harness next --mode workspace-write`）

```
card agent header.cwd        = 卡片目录
card seam child header.cwd   = 卡片目录
card seam child sandbox root = 卡片目录
cardSeamChildRootIsCardDir   = true
cardSeamChildHeaderIsCardDir = true
同一次运行仍捕获 {html}
```

踩过的坑：`agents.create` **必须显式给 `sessionId`**，否则
`agent id "undefined" does not match session id`。这也是每建一个卡片 agent 就换一个序号的原因。

**这份证据的边界：** 它证明的是"机制被测量过"，不是"产品里这样跑通了"。探针跑在一个自建的宿主组合里，不是应用。

## 已经落地的三步（原施工清单）

### 第一步 · 扩宿主接口 —— 完成

| 文件 | 改动 | 状态 |
|---|---|---|
| `src/skill-card-host.ts` | `agents` 增加 `create(options): Promise<WorkbenchAgentHandle>`；新增 `WorkbenchAgentHandle = { agent: WorkbenchAgent; dispose(): Promise<void> }`；新增 `workspaceRegistry.archiveSession(sessionId)` | ✅ 三项都在 |
| `src/index.ts` | 接线到宿主真实的 `ctx.agents.create`；`workspaceRegistry` 进 `inject` | ✅ 走 `ctx as unknown as WorkbenchSkillCardHost` 的宽 cast，所以没有新接线代码——**名字与 `inject` 因此都没有任何一层检查**（见"还没做"第 1 条） |
| `tests/support/fake-skill-card-host.ts` | 加 `create` 桩，返回可 `dispose` 的假 handle；新增 `archivedSessions` 记录 | ✅ |

### 第二步 · 换父 —— 完成

`src/skill-card-runner.ts`：

- ✅ 按 `cardId` 的缓存 `cardAgents: Map<cardId, { path, handle }>`
- ✅ 取用前比对路径：变了就 `dispose` 旧的、按新目录重建
- ✅ `attempt` 里 `parent` 换成 `cardParent(run.cardId, …)`
- ✅ 有效工作目录跟着父走：`resolvedCwd = parent.session?.header?.cwd ?? cwd`（没有卡片 agent 时退回会话目录）
- ✅ `dispose()` 清掉全部 handle（`Promise.allSettled`）
- ⚠️ **卡片被删除时没有钩子**：`cardAgents` 里的 agent 会活到插件 `dispose()` 为止，而删卡片不会经过 runner。原方案写的"卡片删除时 dispose"**没有做**。

**验收结果：** `corepack yarn workspace dsh-workbench check` 从 604 条变成 **608 个测试 / 40 个 spec 文件 / 3 跳过**，exit 0——多出来的四条在 `tests/skill-card-runner.spec.ts` 的「the card agent that fences a run」里，其余一条没改。

### 第三步 · 生命周期与归档 —— 一半

- ✅ 结算后归档卡片会话（`archiveCardSession()` 调 `workspaceRegistry.archiveSession`，在 `finish` 之后；失败只 `warn`，不会把已捕获的结果变成失败）
- ✅ 工作区变更时 `dispose` 旧的
- ❌ **卡片删除时不 `dispose`**（见上）
- ❌ **没有去掉那三条 `.skip`**：原方案把"用测试证明，而不是用推理证明"写成这一段的出口标准，**这一步没有做**。今天的 `check` 仍然是 `Test Files 40 passed, 1 skipped` / `Tests 608 passed, 3 skipped`。

## 还没做的（按重要性）

1. **在真实应用里验证归档。** 成员名是 `workspaceRegistry.archiveSession`，`workspaceRegistry` 也在 `inject` 里，探针 case `[3]` 量过这个成员能被接受——但**没有任何一次运行证明侧边栏真的少了那一行**。名字与 `inject` 这两件事本身也没有任何一层能检查（宽 cast + fake），见需求第 99 条。
2. **用例分辨不出"有效工作目录"。** `attempt()` 现在取 `parent.session?.header?.cwd ?? cwd`，但 fake 的会话目录与卡片目录同名 `/repo`，唯一那条 `request.cwd` 断言因此看不出差别。给 fake 一个与卡片目录不同的会话目录，这一条才真的可断言。
3. **用测试证明栅栏。** 去掉 `skill-card-workspace-sandbox.spec.ts` 的 `.skip`，让它跑在真实宿主上：沙箱根、目录内写得出去、目录外被拒、结算后归档。
4. **卡片删除时释放它的 agent**（需要在删卡路径上给 runner 一个钩子，或者让 runner 订阅存储的删除事件）。

## 不要做的事

- **不要**为了"让构建变绿"删掉那条 skip 的 spec，或把它的断言改成当前代码所做的事
- **不要**在 `attempt` 里同时跑两套父（会话 agent 与 cardAgent）
- **不要**把 `request.cwd` 重新挂回会话目录：它现在取自父的会话头，那是刻意的——**父决定根，请求跟着父**

## 一个仍未做的验证

**全程没有一次真实点击。** 608 条测试、一份探针脚本，都是自动验证。接上这间房之前，最好先手工确认已交付的部分：配置页选目录、叶子名与全路径、删掉目录后运行被拒、跑一次看侧边栏与工作目录。否则出问题时没有"已知正常"的参照点。
