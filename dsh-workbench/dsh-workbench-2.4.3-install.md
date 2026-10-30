# dsh-workbench 2.4.3 版 安装说明（卡片运行终于有文件工具了）

```
dsh-workbench-2.4.3.tgz
```

**宿主（index.js）改了 → 必须重启 DSH Desktop，再刷新页面。**

---

## 这一次的问题：运行「成功」但报告没落盘

现象：运行结束、结果页出现，但卡片显示「无法读取目录」；返回内容只有一个
`<div data-dsh-files="任务分析" hidden></div>`，工作区里根本没有 `任务分析/` 目录。

根因**不在 skill，在插件**：卡片运行的子进程**没有原生工具**。

把那次运行（会话 `6db9552e…`）的工具清单解出来看，136 个工具里全是 MCP（`mcp__windows__*`、
`mcp__xiaoneng__*`）、`ppt*`/`pptd_*`、记忆工具——**没有 `read` / `write` / `edit` / `glob` / `grep` / `pwsh`**。
那些原生工具是**由 Agent preset 组合进来的**，而工作台创建卡片会话时没挂 preset：

```
agents.create({ sessionId, meta: { cwd } })      // ← 没有 agentPreset，也没有 setup
```

子 agent 加入的是**父 agent 的 preset**（`applyChildComposition` → `composeFrom(parent)`），
父会话没有 preset，子进程就只剩全局挂载的工具。于是这个 skill 只有两条路：
`mcp__windows__*`（本次全被 `USER_CONTROL` 拒绝）或什么都不做。模型于是把整篇报告塞进原始输出，
再用一个 `data-dsh-files` 嵌入指向那个**从未创建**的目录 —— 卡片去读，自然读不到。

## 修了什么

1. **卡片会话按预设组合**：`publishRunSession` / `attachRunSession` 现在解析 preset 并在创建窗口里
   `mount`，同时写进会话元数据（`meta.agentPreset`）。解析顺序：**启动运行的那个会话所用的 preset**
   → 部署默认 preset。子进程继承父会话的 preset，因此拿到 `read`/`write`/`pwsh` 等全部原生工具。
2. **没有 preset 注册表的部署照旧运行**（服务是可选读取的）：只是没有这些工具，和修之前一样，
   不会因为缺能力而拒绝启动。
3. **细化运行的会话**也重新绑一次 preset——重新 attach 的 agent 是重新组合的，否则同一个会话
   第二次运行会丢掉第一次的工具。
4. **提示词加一条**：返回的是区域**内容本身**，不是指向内容的指针（文件夹、文件名、
   `<div data-dsh-files>` 嵌入都不算）。
5. skill `uf30-task-analysis` 1.2.0 同步加了「返回给卡片的内容（不是文件链接）」一节：落盘和返回正文
   是两件事，都要做。

## 门禁

- `typecheck` 0
- 全量 `vitest run`：**853 通过 / 3 跳过**（新增 5 条：继承命名会话的 preset、无会话时用默认 preset、
  无注册表时不挂 preset、preset 解析失败仍可运行且告警、细化运行重新绑定 preset；另加 1 条提示词断言）
- `build` 0、`verify:artifacts` 干净

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.4.3.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force
```

**重启 DSH Desktop**，再刷新页面。

## 验证

跑同一句指令（`获取效能任务T202610223746并分析`）。这次应该看到：

- 运行结束后工作区出现 `任务分析/T202610223746_…_任务分析.md`；
- 结果页显示的是**报告正文**（四段式），不是一行文件嵌入；
- 运行历史那一行点进去还能看到结果，指令留在行下。

如果结果页仍然只显示一行文件嵌入，说明这次运行的子进程没拿到 preset —— 去
`$env:APPDATA\dsh-desktop\logs\harness.log` 搜 `agent preset`，或者告诉我，我再查。
