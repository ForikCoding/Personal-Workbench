# dsh-workbench 2.1.0 · 安装说明（同一张卡并行运行）

```
dsh-workbench-2.1.0.tgz    约 290 KB
```

**宿主（index.js）和客户端（client.js）都改了 → 需要重启 DSH Desktop，再刷新页面。**
另外新增了配置项默认值，重启后生效。

---

## 改了什么

**1. 一张卡可以同时跑多个运行（本次主题）**

之前：`skill-card-runner.ts` 里 `congested(cardId)` = 「这张卡有一个正在跑 **或** 全局到达上限」就拒绝，返回 `run-in-progress`（HTTP 409）。所以同一张卡第二次点击必然失败。

现在：
- 每张卡有一张**运行表**（`Map<cardId, RunRecord[]>`），一张卡可以有多条运行同时进行。
- 每个运行有**自己的 runId**（默认为开始时刻；同一毫秒内第二次运行自动加后缀，不会撞号），结算后的记录用的就是同一个 id —— 运行中的行和存储的记录始终是「同一次运行」。
- 每个运行**仍然有自己的 session**（这是上一版就有的），两次运行不会混进同一个会话。
- 拒绝条件只剩全局并发上限。`maxConcurrentRuns` 默认从 **1 → 4**（范围 1–8）。想保持旧行为，把它设成 1。

**2. 并发上限是唯一的闸门**

- 达到上限仍然返回 `run-in-progress`，卡片上显示「另一个运行正在进行」。
- 交叉卡片按钮（A 卡里点按钮启动 B 卡）不再在客户端预检「B 卡忙不忙」——那张卡本来就允许再开一个运行，真的被上限拒绝时由宿主回答，界面照旧显示原因。

**3. 同一个会话不会被两个运行同时占用**

- 普通运行各开各的 session，互不影响。
- 「重新生成」是**续写**某次运行所在的会话，所以当那个会话里已有运行在跑时会被拒绝（`run-in-progress`，文案说明是哪个会话忙）。这是唯一保留的「同一张卡内互斥」。

**4. 接口变化（向后兼容）**

- 新增 `GET /run?cardId=` 返回 `states` 数组（该卡全部运行，最新在前），`state` 仍是其中最新的一个 —— 老客户端只读 `state` 不受影响。
- `DELETE /run?cardId=&runId=` 可**只停某一次**运行；不带 `runId` 则停该卡所有在跑的运行。
- `WorkbenchRunState` 新增可选 `runId`。

**5. 界面**

- 运行记录页：**每一个在跑的运行都是一行**（多行「运行中」，带呼吸点），行内多一个「停止」按钮，只停这一行那一次运行。
- 记录页右上角按钮**始终是「运行」**（不再变「取消」）：一张卡能同时跑多个，那个按钮没有理由替用户挑一个来取消；停止改由每一行自己的按钮负责。
- 结果页：打开某一次运行的结果页时，「取消」只停那一次运行；最新结果页（未指定某次运行）的「取消」停这张卡当前所有运行。
- 修好一处体验：A 卡正在跑的时候，打开 B 卡的旧结果页，编辑器/重新生成不再被锁（每次运行各写各的记录，互不覆盖）。

**6. 内存表上限**

- 每张卡最多保留 24 条已结束的运行态（在跑的永不淘汰）。历史记录本身仍以存储为准，这张表只为「正在看的运行」和「被取消、没有落库的运行」存在。

## 需要宿主配合的（没做）

- 行内 `⋯` 次要操作、单次运行耗时，仍留到后续版本。

## 门禁

- `typecheck` 0；全量 `vitest run`：**770 通过 / 3 跳过**（新增：同卡两次并行、按 runId 单独停止、上限拒绝、路由 `states` 列表、记录页多行运行中、目标卡忙不再拦截等）。

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.1.0.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.54\.tgz', 'dsh-workbench-2.1.0.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

**重启 DSH Desktop**，再刷新页面。

## 验证清单

- 同一张卡连点两次「运行」：两个都在跑，记录页出现**两行「运行中」**，各自带「停止」。
- 点其中一行的「停止」：只有那一次停下，另一行继续跑。
- 结果页打开某一行「运行中」：能看到那次运行自己的实时轨迹；「取消」只停它。
- 两个都跑完后：两条记录都在历史里，最新完成的那条是卡片的「当前结果」。
- 想恢复「一张卡同时只能跑一个」：插件配置 `maxConcurrentRuns: 1`。
