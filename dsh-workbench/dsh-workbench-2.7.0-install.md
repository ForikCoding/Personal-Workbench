# dsh-workbench 2.7.0

## 工作目录不是手填的：一行选择器，点开就是系统的目录对话框

上一版把工作目录做成了输入框——错了，而且踩的是这个产品早就定过的规矩。`workspace-picker.ts` 里写得很清楚：「产品负责人否掉了手填路径，文本框会让卡片指向一个没有任何选择器确认过的目录」。这一版按那条规矩改回来。

### 插件里

- 工作目录是一行**可点的选择器**：左边是已确认的路径（等宽字体，过长省略），右边是「选择目录」。
- 点它 → 走**平台自己的目录选择器**（Windows 上是 Desktop 插件发布的原生对话框，其他平台是工作区 UI 的 `pickDirectory()`），和卡片设置页用的是同一个 `WorkbenchWorkspacePicker`。
- 选中的目录写进**每一步的卡片**；取消则什么都不写，各步保持原样。
- 页面没有选择器时（比如纯 Web profile），这一行是禁用的，右边写「这里没有目录选择器」——不会退化成可以瞎填的输入框。

### 原型图里

同样是一行可点的选择器。原型没有真的系统对话框，所以点开是一个「选择工作目录」的面板（复用原型已有的 `.picker` 样式），列出几条目录，点一条路径就写回流水线——行为路径与真实选择器一致：只回一个确认过的路径，不存在手打。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-270'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.7.0.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 指向 `dsh-workbench-2.7.0.tgz`，之后**完全退出** DSH Desktop 再开。

## 怎么验

1. 任意一步 → 配置 → 工作目录：右边是「选择目录」，点开是系统对话框，不是输入框。
2. 选一个目录 → 每一步的卡片都指向它（换一步看配置，路径相同）。
3. 打开对话框后取消 → 路径不变。

## 回归

`corepack yarn workspace dsh-workbench check` 全绿：typecheck 4 份 0 错、vitest **1027 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 500 kB，内联 CSS 137740 字符。

改动：`WorkbenchPipeline.tsx`（选择器行 + `canPickWorkspace` / `chooseWorkspaceForSteps`）、`WorkbenchPage.tsx`（把页面手上的 `workspacePicker` 交给流水线）、`locales.ts`、`pipeline-classes.ts`、`pipeline.css`（`.wb-rulePath` 三件）、`tests/WorkbenchPage.spec.tsx`（选目录写每一步、无选择器时禁用两条）；原型 `docs/prototypes/workbench-pipeline-v2.html` 同步。
