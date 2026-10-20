# 卡片工作目录：把"一道门"做成"一间房"

> 状态：**未实现**。本文是施工方案，不是交付说明。需求第 92 条与
> `dsh-workbench/tests/skill-card-workspace-sandbox.spec.ts`（skip 态）钉住这个缺口。

## 今天的样子

卡片记录工作目录、据此放行或拒绝一次运行，**但运行仍在父会话的目录里执行**。

准确的说法只有一句：**它只在自己有目录时才跑。**

| 事实 | 状态 |
|---|---|
| 卡片记下目录 | ✅ |
| 没有目录/目录不存在时拒绝运行 | ✅ |
| 子代理的有效工作目录是卡片目录 | ❌ 仍是会话的 |
| 沙箱根是卡片目录 | ❌ 仍是会话的 |

## 为什么不能靠传 `cwd` 解决

`startActivation({ request: { cwd } })` 只产生一次 `working-directory/change` 投影：

- `childSessionMeta` 让子会话的 `session.header.cwd` **永远是父的**；
- `sandboxPolicy.resolve()` 的 `workspaceRoot` 取自 `session.header.cwd`。

测量脚本：`dsh-plugin-desktop/scratch/agent-cwd-probe.mjs`，用例 `[1b]`。

## 已经误导过一次的计划

"把执行底座从 `startActivation` 换成 `agents.create`，自己接管提示词投递、`{html}`
捕获、重试、取消、`agent/error` 归因" —— **四次尝试全部零改动**。

原因不是执行不力，是**任务被定义错了**：那等于在这个插件里重写一套上游子代理运行时。

## 现在的方案：给卡片造一个薄父 agent

`childSessionMeta` 复制**父**的 header cwd。所以只要父本身根在卡片目录，子就跟着落位。

```
cardAgent = agents.create({ sessionId, meta: { cwd: 工作区 } })   ← 每卡一个
seam 子 agent: request.parent = cardAgent
    → 子会话 header.cwd = 工作区
    → 沙箱根 = 工作区                                     ✅ 真限定
```

**seam 仍然负责**提示词投递、`{html}` 捕获、重试、取消、错误归因——**一行都不用重写**。

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
`agent id "undefined" does not match session id`。

## 施工清单

### 第一步 · 扩宿主接口（纯扩，无行为变化，单独提交）

三处必须同时改，少一处编译不过：

| 文件 | 改动 |
|---|---|
| `src/skill-card-host.ts` | `agents` 增加 `create(options): Promise<WorkbenchAgentHandle>`；新增 `WorkbenchAgentHandle = { agent: WorkbenchAgent; dispose(): Promise<void> }` |
| `src/index.ts` | 接线到宿主真实的 `ctx.agents.create`（注意 `WorkbenchHostContext` 是宽 cast，需核对结构兼容） |
| `tests/support/fake-skill-card-host.ts` | 加 `create` 桩，返回可 `dispose` 的假 handle |

**验收：`check` 仍 604 passed / 3 skipped。**

### 第二步 · 换父（这一步让沙箱根落位）

`src/skill-card-runner.ts`：

- 加一个按 `cardId` 的缓存：`{ workspacePath, handle }`
- 取用前比对 `workspacePath`：变了就 `dispose` 旧的、重建
- `attempt` 里 `parent: input.agent` → `parent: cardAgent`
- `dispose()` / 卡片删除时清掉对应 handle

**验收：`check` 的 604 条一条不改；然后把 `skill-card-workspace-sandbox.spec.ts`
前两条断言的 `.skip` 去掉，用测试证明，而不是用推理证明。**

### 第三步 · 生命周期与归档

- 跑完把 cardAgent 的会话**归档**，侧边栏保持干净（产品负责人选了归档，而不是把它
  误标成 `origin: 'subagent'`）
- 卡片删除、工作区变更时 `dispose`
- 去掉 spec 第三条断言的 `.skip`

## 不要做的事

- **不要**为了"让构建变绿"删掉那条 skip 的 spec，或把它的断言改成当前行为
- **不要**在 `attempt` 里同时跑两套父（会话 agent 与 cardAgent）
- **不要**把 `cwd` 一起传进去——父已经决定了根，再传 `cwd` 只会让"哪个生效"变得含混

## 一个仍未做的验证

**全程没有一次真实点击。** 604 条测试、三个提交、一份探针脚本，都是自动验证。
接上沙箱限定之前，最好先手工确认已交付的部分：配置页选目录、叶子名与全路径、
删掉目录后运行被拒。否则出问题时没有"已知正常"的参照点。
