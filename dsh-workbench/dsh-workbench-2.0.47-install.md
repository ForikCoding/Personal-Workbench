# dsh-workbench 2.0.47 · 安装指南（运行记录与在飞运行互不遮挡）

**修复：卡片有运行在飞时，打开一条已完成的运行记录，结果页显示的却是「正在运行」，看不到那条记录。**

```
dsh-workbench-2.0.47.tgz    约 282 KB
```

本次只改了客户端 bundle（`lib/client.js`），宿主侧未变 → **只需在 DSH 窗口按 Ctrl+R 刷新**，不用重启应用。

---

## 根因

结果页正文（`SkillCardBody`）的判定是「只要有任何一次运行在飞，就显示运行中提示」：

```tsx
if (view.run?.phase === 'running' && view.refining !== true) {
  return <RunningNotice run={view.run} t={t} />
}
```

所以：卡片自己在跑时，你从历史记录点开一条**已完成的**记录，页面主体仍是那条**在飞运行**的提示——点开谁都不重要，全被盖住。连那条记录自带的工具轨迹也被「运行中」状态藏掉了。

## 修法：按「页面主体」判定

让 view 带上「本视图点名的是哪条运行」（`runId`，历史行打开时才有），正文和结果页都改为：

- **运行在飞是主体**（未点名任何记录；或点的就是运行中那行——它还没有已存记录，就是在看它自己）→ 显示实时流/运行中提示；
- **主体是某条已存记录**（点了历史里的一条，卡片上另有一次在跑）→ 显示这条记录的正文 + 它自己的「已完成」轨迹，页面不再标记 busy。

页头那个「运行/取消」按钮不受影响：卡片确实在跑就显示「取消」，不管你看的是哪条记录。

## 改动点

- `controller.ts`：`WorkbenchCardView` 增加 `runId`（历史行点名的那条），构造时带入。
- `SkillCard.tsx` `cardContent`：`subjectIsTheRun` 判定——运行在飞是主体时才渲染 `RunningNotice`。
- `SkillCardPages.tsx` 结果页：拆分 `cardRunning`（本卡任意在飞，驱动页头按钮/编辑器禁用）与主体 `running`（驱动实时流标记与 RunTrace 显隐）；RunTrace 改为跟随主体。
- 测试：`SkillCard.spec.tsx` +2（点名记录在运行中仍显示记录；点的就是运行中那行仍显示实时流）；
  `SkillCardResultPage.spec.tsx` +1（打开已完成记录 + 一次在飞运行 → 显示记录正文、轨迹、非 busy）。

## 门禁

- `typecheck` 0 错误；全量 `vitest run`：**744 通过 / 3 跳过**（新增 3 条用例）。

---

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.0.47.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.46\.tgz', 'dsh-workbench-2.0.47.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

然后**在 DSH 窗口按 Ctrl+R 刷新页面**即可（本次未改宿主）。

---

## 升级后应当看到

- 有一条运行在跑时，从历史点开任何一条已完成的记录：显示**那条记录**的正文和轨迹，「运行中」提示不再出现；
- 点运行中那一行：仍然打开它的实时视图（这是 2.0.45 的行为，保持不变）；
- 页头按钮：卡片在跑就显示「取消」，否则「运行」。
