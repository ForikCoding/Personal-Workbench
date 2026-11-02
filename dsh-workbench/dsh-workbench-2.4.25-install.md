# dsh-workbench 2.4.25 安装与验证

## 这一版改了什么

**运行前一律弹窗，弹窗里可以改这次运行的工作目录；结果页也写出工作目录。**

三个改动连在一起：

1. **不管要不要指令，点「运行」都弹窗。** 原来只有 `instructionMode` 不是 `none` 的卡才弹窗 —— 那种卡不弹是因为"没有句子要问"。现在弹窗要问的是**在哪个目录跑**，这张卡（以及每张卡）都有答案，所以那句话不再成立。不需要指令的卡，弹窗里只有目录一行 + `取消` / `运行`，光标直接落在 `运行` 上，一个回车就跑。

2. **弹窗里的目录默认是配置里的那个，可以直接改。** 行内是叶子名 + 完整路径，右边是 `选择目录`（走的是配置页同一个选择器、同一条写入路径 —— 选完会存进这张卡的配置）。所以"不修改则直接运行"，改了就更新卡片配置：运行结果、文件读取、下一次运行说的都是同一个目录。目录缺失或失效时，`运行` 是灰的，下面写着原因，`选择目录` 就是出口。

3. **运行结果页在操作行下面写出工作目录**：`工作目录 · F:\git\Personal-Workbench`。结果本身说的是"做出了什么"，运行记录说的是"什么时候、跑了多久"，都不说"在哪个目录"，而卡片被改过目录、或者从别的机器搬过来时，这一点恰恰最不清楚。目录已经不在时，这一行用告警色。

连带的语义变化：**工作目录不再让「运行」按钮变灰**（2.4.24 刚做的是"灰了要说出原因"，这一版把那条原因变成了可当场解决的事）。skill / 模板 / 模型 / harness 运行通道这四条仍然会关掉按钮；目录只关掉弹窗里的 `运行`，因为 Host 那边照旧会拒绝一次没有目录的运行。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-2425'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.25.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 已指向 `dsh-workbench-2.4.25.tgz`。装完**整个退出 DSH Desktop 再重开**，`Ctrl+F5`。

## 怎么验

1. 网格上点任意一张卡的 `运行` —— 不论这张卡要不要指令，都应弹窗。
2. 弹窗第一行是 `工作目录`，值是卡片配置里的目录（叶子名 + 完整路径）。
3. 不动它，点 `运行`（或按回车）：正常起跑。
4. 点 `选择目录`，选另一个目录：弹窗里的路径立刻变，卡片配置同步变了（`配置` 页的「工作目录」一致），再点 `运行` 就在新目录里跑。
5. 打开 `任务分析` 那次运行的结果页：操作行（`修改` / `运行` / `编辑` / `已完成 · n 步`）下面应有一行 `工作目录 · <路径>`。
6. 反面：一张目录已失效的卡（另一台电脑上那张），`运行` 仍然可点，弹窗里目录标红、写着「工作目录不存在或不是文件夹」，`运行` 灰着，`选择目录` 可点。

## 回归

`corepack yarn check` 全绿：typecheck 0；`vitest` 51 passed / 1 skipped（**925 passed, 3 skipped**）；build 0；`verify:artifacts` 干净（CSS 内联 67,531 字符）。

新增/改写的断言：

- `CardRun.spec.tsx`：不需要指令的卡也弹窗、弹窗里没有输入框、目录就显示配置值、`运行` 才真正起跑；目录缺失时按钮仍可点、弹窗里 `运行` 灰，点 `选择目录` 调用 `chooseWorkspace`；失效目录标红并报出路径；没有选择器的环境说明白而不再给一个按不动的按钮。
- `SkillCardResultPage.spec.tsx`：目录缺失/失效两条从"按钮 disabled"改成"按钮可点、句子仍在、弹窗里的 `运行` 灰"。
- `SkillCardRefine.spec.tsx`、`SkillCardPages.spec.tsx`、`SkillCardResultEdit.spec.tsx`、`skill-card-action-panel.spec.tsx`：凡是"点了运行就发请求"的用例，改为先点弹窗里的 `运行`（`[data-prompt-submit]`）。

已知边界（还没做，需要的话下一版）：模板里声明的 action 按钮（自带确认面板的那条路径）起跑时不会问目录，用的是卡片配置里的目录 —— 目录坏了会被 Host 拒绝并在结果页给出原因，然后可以从 `运行` 改。
