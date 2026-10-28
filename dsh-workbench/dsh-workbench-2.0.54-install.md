# dsh-workbench 2.0.54 · 安装说明（运行记录页重做）

```
dsh-workbench-2.0.54.tgz    约 289 KB
```

**只改了客户端（client.js）→ 刷新页面（Ctrl+R）即可，不需要重启。**

---

## 改了什么

**1. 行内层级反过来（P0）**
- 之前：第一行时间（12px 灰）、第二行内容（13px）——眼睛先落在时间上。
- 现在：第一行是**运行产出的内容**（14px/500，单行省略），第二行是 `时刻 · 模型 · 第 N 次 · 已编辑`，右侧是状态与 `›`。

**2. 摘要不再全是任务编号（P0）**
- `resultSummary`（取第一行）→ `resultHeadline`：优先 `data-dsh-summary` 标记元素 → 第一个标题 → **第一条不是纯编号的行** → 最后才退回编号。
- 效果：`T202610223746 / T202610223746 / …` 那种「七行一模一样」会变成各自的标题。

**3. 状态降噪（P1）**
- 「已完成」由每行等重的文字改为 **小圆点 + 短词**，中性灰；只有 `已停止`（琥珀）、`已失败`（红）才带颜色跳出；`运行中` 用品牌色 + 呼吸点动画（`prefers-reduced-motion` 下不动）。

**4. 按天分组（P1）**
- 组标题 `今天 / 昨天 / 2024-01-02`，行内只留 `HH:MM`；列表从「7 张并列小卡片」变成「一天的记录」——行间 1px 分隔线，去掉每行外框。

**5. 页头（P2 的一部分）**
- 标题 18px/600，下面一行 `技能名 · 共 N 次运行 · 最近 HH:MM`；计数与「最近」从列表上方搬进页头，减少一层分割。

**6. 其他**
- 摘要统一单行省略（不再两行 clamp），行高一致。
- 行留白 9px/8px，列表日间距 20px。

## 没做 / 需要宿主改动的

- **耗时**：结果记录里没有 startedAt，算不出来。要显示「12s」需要宿主在 `WorkbenchResultRecord` 里记一个开始时刻（下次可以做）。
- 行内 `⋯` 次要操作（重新生成/删除）留到下版（P2）。

## 门禁

- `typecheck` 0；全量 `vitest run`：**765 通过 / 3 跳过**（新增：日期分组、序号、摘要跳过编号、标记摘要优先、标题优先等 6 个）。

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.0.54.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.53\.tgz', 'dsh-workbench-2.0.54.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

**刷新页面（Ctrl+R）即可。**

## 验证清单

- 运行记录页：每行第一行是内容（不再是编号），第二行是 `14:28 · 模型 · 第 N 次`，右侧 `● 已完成` + `›`。
- 有跨天的运行时，出现 `今天 / 昨天 / 日期` 分组标题。
- 点击任意一行仍打开该次运行的结果。
- 若某行的内容仍是纯编号，说明该次运行的 HTML 里除编号外没有别的文字（数据本身如此）。
