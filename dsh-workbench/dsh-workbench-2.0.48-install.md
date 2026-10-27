# dsh-workbench 2.0.48 · 安装指南（运行独立会话后 skill 失效修复）

**修复：2.0.46 起每次运行独立 session 后，卡片运行报错「skill 已经不可用 · skill "xxx" is not available to this session」。**

```
dsh-workbench-2.0.48.tgz    约 283 KB
```

本次改了宿主侧（`lib/index.js`）与客户端（`lib/client.js`）→ **需要完整重启 DSH Desktop**（不是 Ctrl+R）。

---

## 根因

2.0.46 让每次运行都执行在**全新会话**里（这是需求本身：每次点运行 = 新 session）。但运行解析 skill 定义时，`skills.get` 是**按读取 agent 的作用域链**选层的：

- 自定义 skill（如 `xiaoneng-task-detail`）注册在**用户会话**那一层；
- 全新会话的 agent 作用域链只含全局层 + 项目层 → 看不到该 skill → 返回 undefined → 报「skill 不可用」。

2.0.46 之前运行直接挂用户会话，skill 一直找得到；独立会话之后作用域跟着换了，才暴露。

## 修法：执行会话与 skill 解析作用域分离

运行**仍然**在它自己的全新会话里执行（保持 2.0.46 的需求），只有 **skill 定义改用对的作用域解析**：

- 客户端重新把当前会话的 id 随运行请求带上——但仅作为 **skill 解析作用域**；
- 宿主对 card/bare 运行：`scope = agents.get(request.sessionId)`，`execute()` 里
  `skills.get(skill, lookupFor(input.scope ?? input.agent, …))`——本体仍在全新会话跑、仍归档；
- refine（重新生成）行为不变：照旧在生成该结果的那个会话里「解除归档 → 跑 → 再归档」。

## 改动点

- `skill-card-runner.ts`：`RunInput` 新增 `scope?`（skill 解析作用域，区别于执行 agent）；card/bare 运行取
  `agents.get(request.sessionId)`，refine 取 undefined（回落到会话 agent，行为不变）；`execute()` 用 scope 解析。
- `skill-card-contract.ts`：`WorkbenchRunRequest.sessionId` 语义写清——refine 是「执行+解析」所在会话；
  card/bare 有值时仅作 skill 解析作用域，运行本身仍是宿主新建的会话。
- 客户端 `run-start.ts` / `controller.ts`：`startCardRun` 重新带上 `session()`（两条路径：卡片按钮、行动面板确认后跳转）。
- 测试：+5 条（runner 3：点名会话作为解析作用域 / 未点名回落运行 agent / 仍在新会话执行并归档；route、run-start、action-panel 相应更新）。

## 门禁

- `typecheck` 0 错误；全量 `vitest run`：**749 通过 / 3 跳过**（新增 5 条用例）。

---

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.0.48.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.47\.tgz', 'dsh-workbench-2.0.48.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

然后**完整重启 DSH Desktop**（本次改了宿主，刷新不够）。

---

## 升级后应当看到

- 点「运行」不再报「skill 已经不可用」，自定义 skill 照常出结果；
- 每次运行仍是独立 session（左侧会话列表不新增条目，运行记录里可见）；
- 历史记录点开、运行中实时视图、重新生成跟随原会话——这三项 2.0.47 / 2.0.46 的行为保持不变。
