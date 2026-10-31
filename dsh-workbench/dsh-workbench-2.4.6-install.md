# dsh-workbench 2.4.6 版 安装说明（运行记录页改版）

```
dsh-workbench-2.4.6.tgz
```

**客户端（client.js）改了 → 必须重启 DSH Desktop，再刷新页面。**

---

## 改了什么

运行记录页是每个卡片的落地页，原来的问题是"一条一条的灰字"：标题缩进、行没边界、
日期和行分不开、失败的行和成功的行长得一样。这次按三层重排。

### 1. 页头分三层，标题回到页面左边缘

```
‹ 返回
任务分析                              [▶ 运行]
uf30-task-analysis · 共 6 次运行 · 最近 09:28
```

`返回` 原来是跟标题同一行的一个裸文字按钮，于是标题被它**顶进去**一个按钮的宽度
（截图里标题在 x≈100，而下面每一行都在 x≈42）。一页两个左边距，列表看着像是从左
边"挂"出去的。现在 `返回` 单独成行（带 chevron 图标），标题、事实行、输入框、每一行
共用同一条左边缘。

三个全屏页（运行记录 / 结果 / 配置）共用同一个 `PageHead` 组件，所以这个对齐一次修好。

### 2. 事实行有分隔符

`skill · 共 N 次运行 · 最近 …` —— 三个值原来同色同大小只靠空格分开，读起来是一句话；
现在中间是 `·`，skill 名做成 chip。

### 3. 日期分组会吸顶

`今天` / `昨天` / `2026-10-27` 是 11px 的 caption，加了 `position: sticky`：一页七行
往下滚的时候，日期还贴在顶上。行里只有时钟读数（22:47），日期一滚走，那行时间就不
属于任何一天了。

### 4. 行有了边界和节奏

- 整行 hover 有底色（`bg-fill-hover`），右侧 `›` 换成真图标，hover 右移 2px
- 行内 meta 也加了 `·`：`09:28 · GLM-FLASH-LATEST · 第 6 次`
- 时钟用 12px + `tabular-nums`（行里唯一需要跨行比对的数字），模型名放宽容纳
  `GLM-FLASH-LATEST`（原来 18ch 会把最常见的 id 截断）
- 右侧结论列 `min-width: 4em` 右对齐：`已完成` / `已停止` / `运行中` 的点排成一列

### 5. 没产出内容的运行不再是一行空白

`本次没有产出内容`（新文案键 `runHistoryNoContent`），浅色弱化、不加粗。原来这种行只
剩一行灰色 meta，看起来像"行没加载出来"，而不像"这次运行没有内容"。

### 6. 失败的行在左边缘有一道标记

```
▍本次没有产出内容           ● 已停止
▍T202610273189 …            ● 运行中
```

2px 圆角竖条：`已停止` 走 warn 色、`失败/出错` 走 error 色、`运行中` 走链接蓝。
七行里只有一行失败时，它的差异原来只写在最右边一个小词上，扫标题根本看不见；这道
竖条就是给眼睛的落点。竖条画在行的内边距里（`left: -10px`），所以**没有任何一行的
文字因此偏移**。

### 7. 输入框和运行按钮垂直居中

`.runBar` 的 `align-items` 从 `flex-end` 改成 `center`：输入框随内容长高时，运行按钮
不再跟着往下滑。

## 门禁

- `typecheck` 0
- 全量 `vitest run`：**866 通过 / 3 跳过**（新增 2 条：页头分层与左边缘、空内容行）
- `build` 0、`verify:artifacts` 干净（client handshake / externals / 内联样式表全部通过）

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.4.6.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force
```

**重启 DSH Desktop**，再 `Ctrl+F5`。

## 验证

1. 进任意卡片的运行记录：`返回` 在标题**上方**，标题、事实行、输入框、每行标题都在
   同一条左边缘上。
2. 事实行有 `·` 分隔，skill 名是 chip。
3. 往下滚动，`今天` / `昨天` 那行日期贴在顶部。
4. hover 任意一行：整行浅底色，右侧 `›` 右移一点。
5. 有失败/停止的运行的那一行，左边缘有竖条（停止=琥珀色）；那一行若没产出，首行是
   「本次没有产出内容」。
6. 输入框和右边的运行按钮垂直居中对齐。
