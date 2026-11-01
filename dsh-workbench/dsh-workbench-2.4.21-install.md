# dsh-workbench 2.4.21 安装与验证

## 这一版改了什么

**结果页底部那一行，现在是四个东西并排；两个按钮换了名字。**

- `修改`（原来叫「在上一版上改」）、`运行`（原来叫「从头跑」）、`编辑`，后面跟着 `● 已完成 · 19 步 ⌄`。
- `已完成 / 已停止 / 已失败 · N 步` 那个折叠徽标原来单独占一行、挂在结果下面；现在它是这一行的第四个控件，写在 `编辑` 之后。点它，19 步开在**这一行下面**（不挤进行里，行还是四个控件一样高）。默认仍然折叠。
- 失败时徽标是警示色圆点（同上），跑着的那一次没有徽标（卡片上方是实时流），此时这一行是 `修改`（禁用）+ `✕ 取消`。
- 折叠状态按「哪一次运行的记录」记：从运行记录里点开另一次运行，它会回到折叠，不会把上一次展开的状态带过去。
- 结果页的弹窗标题跟着新名字走：「修改」弹窗标题还是「修改」（`修改这份结果` 的说明不变）；`运行` 的弹窗标题就是「运行」，与卡片上的「运行这张卡」区分。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-2421'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.21.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 已指向 `dsh-workbench-2.4.21.tgz`。装完**整个退出 DSH Desktop 再重开**，然后 `Ctrl+F5`。

## 怎么验

1. 打开一张跑过的卡的结果页，看底部一行：`修改` `运行` `编辑` `● 已完成 · 19 步 ⌄`。
2. 点那个徽标：19 步展开在这一行下面，徽标箭头转上来；再点收起。
3. 从卡片页的运行记录点开更早的一次运行：徽标回到折叠状态。
4. 点 `修改` → 弹窗；`Esc` 关掉。
5. 点 `运行`（需要指令的卡）→ 弹窗标题「运行」；不需要指令的卡直接开跑，这一行的 `运行` 变成 `✕ 取消`，且不再显示折叠徽标。
6. 失败的那次运行：徽标是橙色圆点 + `已失败 · N 步`。

## 回归

`corepack yarn check` 全绿：typecheck 0 error；`vitest` 51 passed / 1 skipped（**915 passed, 3 skipped**）；build 0；`verify:artifacts` 干净（CSS 内联 67,794 字符）。

`SkillCardResultPage.spec.tsx` 里「trace 的头部」那条改成断言它就在这一行、并且是行里最后一个控件，展开后步骤在行外（`[data-run-trace-body]` 的祖先不是那个 group）；`data-run-trace` 属性从原来的 `<section>` 移到折叠按钮上，`data-run-trace-body` 给步骤列表。另有一条用例因为行里也出现「运行」而与弹窗里的「运行」重名，改成在弹窗面板内按文字找控件。
