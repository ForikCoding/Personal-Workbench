# dsh-workbench 2.0.46 · 安装指南（每次运行独立 session · 重新生成跟随原会话）

**功能改造：卡片运行不再共用当前会话。**

- 「运行」每次点击都会新建一个属于自己的 session（根目录=卡片工作目录），
  运行结束后自动**归档**，不占用左侧会话列表，只在卡片的运行记录里可见；
- 「重新生成」在**被重新生成的那次运行自己的 session** 里继续（恢复→执行→再归档），
  不新建会话，也不混入用户当前对话；
- 旧的运行记录（2.0.46 之前存的）没有 sessionId：可以正常查看，但「重新生成」会
  明确拒绝并说明（「没有可用的会话」），而不是猜一个会话去跑。

```
dsh-workbench-2.0.46.tgz    约 282 KB
```

本次同时改了宿主侧（runner/route/host）和客户端，**必须完整重启应用**（不是只刷新页面）。

---

## 这次改了什么（要点）

### 宿主侧 `src/skill-card-runner.ts`
- `WorkbenchRunRequest.sessionId` 变为可选：为空 =「宿主为本次运行新建 session」。
  新建的 session 命名为 `workbench-<卡片>-<时间戳>`（每卡单调递增、防重试冲突），
  根目录设为卡片工作目录，并在创建时应用卡片的权限模式（拒绝而非静默降级）。
- 结算时把 sessionId 写进运行记录（`WorkbenchResultRecord.sessionId`），之后**归档并释放**。
- `重新生成`（refine）解析记录里的 sessionId：会话 agent 还在就用现成的；
  已释放就从持久化恢复（`agents.resume`，`create` 拒绝已持久化的 id）；
  若该会话处于归档状态则先恢复再运行、结算后重新归档；未归档的（用户正开着）保持原样。
- 顺序保证：模板缺失、目录失效、并发运行等会在**发布任何会话之前**拒绝；
  两次并发竞争时先结算已发布的会话，不留孤儿。
- `template-missing` 提前到建会话之前判定。

### 数据面
- `src/skill-card-spec.ts`：`workbenchResultSchema` 声明 `sessionId: z.string().optional()`。
  这是 2.0.44 那条教训的再次应用——**写入但未在 schema 声明的字段会在下次加载时被丢弃**，
  若丢了对旧记录会连「重新生成」为何拒绝都说不清。
- `src/skill-card-store.ts`：`trimResult` 保留 sessionId（几字节，却是重新生成的唯一入口）。
- 客户端 `parseSnapshot` / `parseResultEdit`：sessionId 缺省或非空字符串都接受，畸形值拒绝整个记录。

### 客户端
- 「运行」：不再要求有存活会话，也不再随请求带 sessionId（宿主自建）。
- 「重新生成」：发送 `result?.sessionId`；旧记录没有 sessionId 时本地即拒绝并提示。
- 权限确认面板不再显示「运行所属会话」一行（运行已不属于任何用户会话）。
- `runnable` 不再要求存活会话；`runSessionId` 只保留「读已装 skill 目录」的用途。

### 门禁
- `typecheck` 0 错误；`vitest run` 全量 **741 通过 / 3 跳过**（44 个文件，跳过的是既有的
  workspace-sandbox 3 条）。
- 新增/更新覆盖：运行新建并归档唯一一个会话且写入记录；refine 复用指定会话且不新建；
  恢复失败/无 sessionId 的拒绝；schema 跨读写保留 sessionId；parseSnapshot/parseResultEdit
  的 sessionId 规则；客户端旧记录拒绝。

---

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.0.46.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.45\.tgz', 'dsh-workbench-2.0.46.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

然后**完整重启 DSH Desktop**（本次改了宿主，插件只在启动时加载）。

---

## 升级后应当看到

- 点「运行」→ 左侧会话列表**不新增**条目（新建的 session 被归档），卡片运行记录新增一条；
- 查看某次运行 → 点「重新生成」→ 修改意见在**那次运行的会话**里继续，完成后记录就地更新；
- 运行记录照常可点开、可刷新（2.0.45 的行为不变）。
