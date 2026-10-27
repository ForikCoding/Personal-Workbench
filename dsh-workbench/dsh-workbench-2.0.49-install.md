# dsh-workbench 2.0.49 · 安装指南（重新生成也按用户会话解析 skill）

**修复：2.0.48 修好了「运行」，但「重新生成」（refine）仍报错 skill "xxx" is not available to this session。**

```
dsh-workbench-2.0.49.tgz    约 283 KB
```

本次改了宿主侧（`lib/index.js`）与客户端 → **需要完整重启 DSH Desktop**。

---

## 根因

2.0.48 把**卡片运行**的 skill 解析作用域改成了用户当前会话（`sessionId` 字段），但「重新生成」仍按旧假设：
**skill 从被续跑的那个会话解析**。2.0.46 之后那个会话是宿主为那次运行新建的**全新会话**（已归档），
它从来就没注册过自定义 skill —— 所以重新生成照样报「skill 不可用」。

## 修法：请求里加独立的 `scopeSessionId`，三类运行统一

`sessionId` 与「skill 从哪解析」彻底分开：

- `WorkbenchRunRequest.sessionId`：只表达**在哪执行**。refine = 结果记录里的会话（续跑）；card/bare = 缺省，宿主新建。
- 新增 `WorkbenchRunRequest.scopeSessionId`：**skill 定义从哪个会话解析**，三类运行一致 —— 客户端传当前用户会话，
  宿主 `skills.get(skill, {scope: agents.get(scopeSessionId)})`；没传就回落到运行自己的 agent（全局+项目层）。

于是：
- 卡片运行：执行在新会话，skill 从用户会话解析（2.0.48 的行为，字段更名 `sessionId`→`scopeSessionId`）；
- 重新生成：**执行仍在被续跑的会话**（保留「继续那次对话」的语义），但 **skill 从用户当前会话解析**（本次修复）。

## 改动点

- `skill-card-contract.ts`：新增 `scopeSessionId`，`sessionId` 语义收窄为「执行会话」。
- `skill-card-runner.ts`：`scope` 统一取 `agents.get(request.scopeSessionId)`（去掉了 refine 的旧特判），
  `execute` 里 `lookupFor(input.scope ?? input.agent, …)`。
- `skill-card-route.ts`：`scopeSessionId` 与 `sessionId` 同规则校验（可选、非空）。
- 客户端 `run-start.ts` / `controller.ts`：card/bare 运行发 `scopeSessionId: session()`；
  refine 同时发 `sessionId: result.sessionId`（执行）与 `scopeSessionId: session()`（解析）。
- 测试：refine 新增「执行在被续跑的会话、skill 从点名的用户会话解析」回归；route/run-start/action-panel/组件层请求形状全部更新；+1 条新用例。

## 门禁

- `typecheck` 0 错误；全量 `vitest run`：**750 通过 / 3 跳过**。

---

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.0.49.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.48\.tgz', 'dsh-workbench-2.0.49.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

然后**完整重启 DSH Desktop**。

---

## 升级后应当看到

- 「运行」和「重新生成」都不再报「skill 不可用」，自定义 skill 照常出结果；
- 重新生成仍发生在原结果所在的会话里（继续那次对话），只是 skill 从你当前会话解析；
- 每次运行仍独立会话、归档、运行记录可见——2.0.46 / 2.0.47 / 2.0.48 的行为全部保持。
