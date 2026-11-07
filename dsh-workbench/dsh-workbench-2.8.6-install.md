# dsh-workbench 2.8.6

## 表头跑到了区域说明下面——这是我插错了形状

你的模板里，区域标记在 `<tbody>` 里面：

```html
<table>
  <thead><tr><th>任务编号</th>…</tr></thead>
  <tbody>
    <!-- template-begin --> … <!-- template-end -->
  </tbody>
</table>
```

我往里插的占位块是一个 `<div>`。`<div>` 不是表格行——浏览器解析到 `tbody` 里的 `<div>` 时，会把它**提到表格外面**（HTML 解析器的 foster parenting），于是它出现在表头上面。看着像"区域在表头上面"，其实是那个 div 被搬走了。

## 现在按所在位置决定形状

`regionPlaceholder` 会先看区域落在哪：

| 区域所在 | 占位块的样子 |
|---|---|
| `<td>` / `<th>` 里 | `<td colspan="99">` + 说明 |
| `<tr>` / `<tbody>` / `<thead>` / `<table>` 里 | `<tr><td colspan="99">` + 说明 |
| 其它（普通块级容器） | `<div>` + 说明 |

于是表格模板的预览是：标题 → 表头 → 表体里的一行说明（虚线框 + 「区域内容」+ 说明），行在表头**下面**，和真实渲染出来的位置一致。`colspan="99"` 是为了让这行说明铺满整行，不挤在第一列。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-286'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.8.6.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 指向 `dsh-workbench-2.8.6.tgz`，之后**完全退出** DSH Desktop（含托盘图标）再开。

## 怎么验

配置 → 模板 → 预览（那张「每日任务 · 看板」的卡片）：

标题下面先是表头（任务编号 / 任务名称 / …），表头下面才是虚线框那行「区域内容 · 运行时由模型生成…」，而且它铺满整行。

## 回归

`check` 全绿：typecheck 4 份 0 错、vitest **1033 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 506 kB。

新用例 `puts the region note under a table header, where the rows will go` 用的是和你模板同一种结构（`thead` + `tbody` 里放区域标记），断言三件事：说明在渲染结果里出现、它在 `Head` 之后（不是之前）、并且它真的在 `tbody` 的一个 `td` 里。旧实现三条全不过——那条 div 会被搬出表格，`tbody` 里就没有 `td` 了。
