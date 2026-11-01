# dsh-workbench 2.4.23 安装与验证

## 这一版改了什么

**配置页没有预览框了：整页只有 HTML 模板，点 `预览` 弹窗看效果。**

上一版（2.4.22）我把「按需渲染」做成了右栏空井里放一个按钮 —— 那还是留着一个预览框占了半页。这一版把那个框整个删掉：

- 配置页从上到下只有两块：`基本信息`（名称 / 技能 / 模型 / 权限 / 运行指令）和 `模板`。模板编辑器现在占满整页宽度（以前被预览挤掉一半）。窄窗口下那两个「模板 / 预览」标签页也一起删了 —— 没有第二栏可切。
- 模板标题行右侧是四个控件：`跳转到模板` `折叠视图`（编辑中为 `编辑视图`）`预览` `添加动作`。`预览` 就是这次新增的那个按钮。
- 点 `预览`：弹出一个宽面板窗口 —— 标题 `预览`，下面一行小字说明它是 `按当前模板渲染` 还是 `骨架预览，区间尚未填充`，中间是模板渲染出的文档（宽度 1040px、高度 84vh，文档更高就在窗口里自己滚动），底部右边一个 `关闭`。
- 窗口里画的是**编辑器里当前的草稿**，不是存盘的旧模板；关掉窗口不会保存任何东西。
- 关掉的方式有四个：右上角 ✕、底部 `关闭`、`Esc`、点窗口外的遮罩。关掉后配置页回到「只有模板」，页面上一个 shadow root 都不留。

顺带把弹窗的外壳抽成了 `Dialog.tsx`（portal / 遮罩 / `Esc` / Tab 循环 / 焦点还给触发它的按钮），`PromptDialog` 变成它上面的一层表单，预览窗口是另一层；键盘契约只有一处实现。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-2423'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.23.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 已指向 `dsh-workbench-2.4.23.tgz`。装完**整个退出 DSH Desktop 再重开**，然后 `Ctrl+F5`。

## 怎么验

1. 打开任意卡片 → 配置：只有 `基本信息` 和 `模板` 两组，编辑器横贯整页，页面上**没有预览框**。
2. 模板标题行：`跳转到模板` `折叠视图` `预览` `添加动作`。
3. 点 `预览`：弹出宽窗口，里面是这张模板渲染的样子；标题下一行说明是「按当前模板渲染」。
4. 在编辑器里改一处文字 → 再点 `预览`：窗口里是新内容（窗口是快照，改的时候它不会跟着动）。
5. 关掉窗口：✕ / `关闭` / `Esc` / 点遮罩，四种都行；关掉后页面照旧，没有任何东西被保存。
6. 「我的任务」这种区间已填满的卡：说明那行是「按当前模板渲染」；区间是空的新卡是「骨架预览，区间尚未填充」。

## 回归

`corepack yarn check` 全绿：typecheck 0 error；`vitest` 51 passed / 1 skipped（**917 passed, 3 skipped**）；build 0；`verify:artifacts` 干净（CSS 内联 65,170 字符，比上一版少了 3.3k —— 删掉的就是两栏布局那套规则）。

`SkillCardSettings.spec.tsx`：新增「窗口里画草稿」「关闭窗口不改模板」两条；「两栏/标签页」那条改成断言页面上没有 `.panes`、没有 tab、入口在模板那一行；「分组标题」改成只剩 `基本信息` 和 `模板`；「骨架/按当前模板」两句的断言改成读弹窗内容。`PromptDialog.spec.tsx` 未改，仍然 13 条全过（外壳抽走后行为不变）。
