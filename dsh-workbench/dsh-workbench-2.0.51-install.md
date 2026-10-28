# dsh-workbench 2.0.51 · 安装说明（无行数据按钮自动携带卡片内容）

**功能**：结果里的按钮只有 `data-dsh-action`、没有 `data-dsh-row` 时，不再点击无效，而是**自动把当前卡片渲染出的文档内容作为 payload 传给目标卡片**（如「任务分析」的「下一步：详细设计」按钮）。

```
dsh-workbench-2.0.51.tgz    约 283 KB
```

**只改了客户端（client.js）**，没有动宿主（index.js）→ **刷新页面（Ctrl+R）即可生效，不需要重启 DSH Desktop**。

---

## 改了什么

- `readActionEvent`：按钮没有 `data-dsh-row` 时返回 `missing-payload`（并保留 action key），不再报 `malformed-payload`；有属性但 JSON 坏了 / 超 8KB 仍照旧拒绝。
- `controller click / resolveClick`：`missing-payload` 时自动构造 payload = `{ template: <当前卡片文档> }`：
  - 卡片有结果 → `template` 与最新结果 region 拼接后的**完整文档**（用户正在看的那份）；
  - 没有结果 → 模板原文。
- 确认面板照常弹出，展示将要传出的文档；确认后目标卡片按正常的 `startCardRun(api, targetCard, session(), payload)` 运行，payload 进入它的 `<row_data>`。
- skill 目标（bare run）同样受益：`payload` 会随 bare start 一起走。
- 新增 locale `actionProblemMissingPayload`（类型完整性；运行时不会显示为该问题）。

## 行为对比

| 按钮 | 2.0.50 及以前 | 2.0.51 |
|---|---|---|
| `data-dsh-action` + `data-dsh-row` | 正常触发，行数据作 payload | 不变 |
| 只有 `data-dsh-action`（无 row） | 点击无效（malformed-payload） | **自动带当前卡片文档**，正常弹面板 |
| `data-dsh-row` 是坏 JSON / 超限 | 拒绝 | 不变（仍拒绝） |

## 门禁

- `typecheck` 0；全量 `vitest run`：**753 通过 / 3 跳过**。

## 使用示例（你的「任务分析 → 详细设计」）

模板里 `data-dsh-action="task-design"` 的按钮不需要再手动写 `data-dsh-row`：
点击「下一步：详细设计」→ 面板会显示将把当前任务分析文档传给「详细设计」卡片 → 确认后，详细设计运行时的 `<row_data>` 里就有这份文档，它的子代理可以据此继续写详细设计。

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.0.51.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.50\.tgz', 'dsh-workbench-2.0.51.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

完成后**刷新 DSH 页面（Ctrl+R）**即可，无需重启。

## 验证清单

- 「任务分析」卡片跑出结果 → 点「下一步：详细设计」→ 确认面板弹出、显示将传出的文档内容 → 确认后「详细设计」卡片开始运行，且能拿到上一张卡片的内容。
- 原有带 `data-dsh-row` 的按钮行为不变。
