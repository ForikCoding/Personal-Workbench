# dsh-workbench 2.8.7

## 重影和表头没铺满，是同一个数字的错：`colspan="99"`

上一版占位行写的是 `colspan="99"`。它不会"跨满整行"，它会**给表格加出 99 列**：每列分到一点点宽度，`white-space: nowrap` 的表头文字撑不出格子，就画到隔壁格子上——「任务名称」和「修改版本」叠在一起成了重影；多出来的空列吃掉剩余宽度，表头就到 769px 那里断了。

用你那张卡片的真实模板量过（1100px 视口）：

| 占位行 | 任务名称列宽 | 表头右边界 | 相邻表头重叠 |
|---|---|---|---|
| `colspan="99"` | **3px** | 806 | 有（任务名称 / 修改版本） |
| `colspan="7"` | 166px | 1099 | 无 |

现在 `columnCount()` 先数模板真实有几列：优先数 `<thead>` 里的 `<th>`/`<td>`，没有就数 `<colgroup>` 里的 `<col>`，再没有就数第一行的格子，至少 1、最多 24。占位行用这个数——表格布局因此一点没变，表头照原样铺满，文字各在其位。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-287'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.8.7.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 指向 `dsh-workbench-2.8.7.tgz`，之后**完全退出** DSH Desktop（含托盘图标）再开。

## 怎么验

配置 → 模板 → 预览，那张「每日任务 · 看板」：

- 表头七列（任务编号 / 任务名称 / 修改版本 / 客户 / 模块 / 任务状态 / 操作）各在自己的位置上，不再重影；
- 表头的底色一直铺到预览框右边缘；
- 表头下面一行是虚线框的「区域内容 · 运行时由模型生成…」。

## 回归

`check` 全绿：typecheck 4 份 0 错、vitest **1033 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 507 kB。

表格那条用例改成七列（带 `colgroup`，和真实模板同构），并断言占位格的 `colspan` 就是 `7` —— 写大了这条就红。
