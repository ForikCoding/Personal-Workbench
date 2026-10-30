# dsh-workbench 2.4.2 版 安装说明（超时的运行不再消失）

```
dsh-workbench-2.4.2.tgz
```

**宿主（index.js）改了 → 必须重启 DSH Desktop，再刷新页面。** 客户端未变（`client.js` 内容与 2.4.1 一致）。

---

## 2.4.1 的问题

现象：写了指令点「运行」，页面显示正在跑；五分钟后回到「尚未运行」，历史里一条也没有，也没有任何失败提示。

原因：卡片运行有 5 分钟的时限（`runTimeoutMs`，默认 300 000 ms）。到点后运行被中止，中止被当成「用户取消」处理，而**取消的运行按设计不写存储**——它的判决只留在内存的运行时表里。于是：运行被清掉 → 页面回到「尚未运行」 → 历史看不到 → 五分钟的活白跑（对用户来说就是「什么都没发生」）。

## 修了什么

时限不再等于取消。**到点中止的运行按失败处理**：状态 `settled`、`failureCode: run-failed`、失败句「the skill run timed out after 5 minutes」（按配置的时限换算成分钟/秒），并**写进存储**——页面上有失败提示，历史里有一行，行上带着这次运行的指令。

**用户自己点取消仍然不写存储**（这是原设计，保持不变：用户自己的决定不该弄脏历史）。两条路径的区别由 `run.timedOut` 判定，先记旗标再中止，所以两者不会混。

## 门禁

- `typecheck` 0
- 全量 `vitest run`：**847 通过 / 3 跳过**（新增/改写 4 条：卡片运行超时按失败存储、秒级时限的措辞、分钟级时限的措辞、取消仍然不存储）
- `build` 0、`verify:artifacts` 干净

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.4.2.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force
```

profile 的 `package.json` 指向：

```
"dsh-workbench": "file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.4.2.tgz"
```

**重启 DSH Desktop**，再刷新页面。

## 验证

超时的判断不必真等五分钟：把卡片目录设成一个必然失败的路径也能验证失败会落历史，或者临时把 `runTimeoutMs` 调到 20000 跑一次（在 profile 的 `cordis.patch.yml` 的 workbench 条目上加 `config: { runTimeoutMs: 20000 }`，验证完删掉）。

正常路径：写指令 → 跑完 → 历史多一行，行下有结果文档。

## 附：这次运行本身为什么没产出

2026-10-30 两次运行（20:23 取消、20:29 超时）都不是 workbench 的问题：子进程把大部分工具调用都发给了 `mcp__windows__*`（桌面 MCP），而桌面被用户占用时这些调用一律返回 `USER_CONTROL`，于是整轮都在失败调用上空转。已在 `uf30-task-analysis` skill 1.2.0 里改正：只用原生 `pwsh`/`read`/`glob`/`grep`/`write`/`edit`，并新增「工具选择」一节与坑 P12。
