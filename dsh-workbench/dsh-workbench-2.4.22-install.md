# dsh-workbench 2.4.22 安装与验证

## 这一版改了什么

**卡片配置页的预览改成「点了才渲染」，默认不渲染。**

- 打开配置页，右栏（或窄窗口下「预览」标签页）是一个空的虚线井：`还没有渲染预览` + `预览` 按钮 + 一句 `点「预览」按当前模板渲染一次。不会保存，也不会运行卡片。`
- 点 `预览` 才挂载 shadow root 按当前编辑器里的模板画一次；之后标题行右侧出现 `按当前模板渲染`（区间为空时是 `骨架预览，区间尚未填充`）和 `收起预览`。点 `收起预览` 回到空井，shadow root 整个卸载。
- 预览开着的时候仍然跟着编辑器实时更新（和以前一样），所以改一行模板不需要再点一次。
- 窄窗口下点「预览」标签页等同于请求预览：切到那一页就把预览打开，不用再按一次按钮。
- 关掉预览时**什么都不渲染**：没有 shadow root，模板自带的脚本也不会跑——这既是省事，也是这次改动的目的（原来一张只有 Memory/Markdown 阅读器的模板，在打开配置页的瞬间就开始 `正在读取目录…`）。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-2422'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.22.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 已指向 `dsh-workbench-2.4.22.tgz`。装完**整个退出 DSH Desktop 再重开**，然后 `Ctrl+F5`。

## 怎么验

1. 打开任意卡片 → 配置：右栏是空的虚线井，只有 `还没有渲染预览` / `预览` / 那句说明；左边编辑器、状态栏（区间、动作、字节）照旧。
2. 点 `预览`：出现文档；标题行右侧是 `按当前模板渲染` + `收起预览`。
3. 在编辑器里改一个字：预览跟着变（不需要再点）。
4. 点 `收起预览`：文档消失，回到空井；再点 `预览` 又是最新的模板。
5. 把窗口拖窄：只剩「模板 / 预览」两个标签；点「预览」标签直接出文档（不用二次点击）。
6. 「每日任务 · 看板」那张卡进来时不再自动渲染，也就不会立刻看到 `填写任务编号` 之类的假数据。

## 回归

`corepack yarn check` 全绿：typecheck 0 error；`vitest` 51 passed / 1 skipped（**916 passed, 3 skipped**）；build 0；`verify:artifacts` 干净（CSS 内联 68,507 字符）。

`SkillCardSettings.spec.tsx` 补了两条：默认页面上没有任何 shadow host 且有 `[data-preview-idle]`；点 `[data-template-preview]` 后才有 shadow host，点 `[data-preview-stop]` 后又归零。「分组标题」和「区间填满时不再叫骨架」两条改成先点预览再断言那句标签。
