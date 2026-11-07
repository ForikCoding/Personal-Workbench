# dsh-workbench 2.7.1

## 修的是这个：配置页写进去了，但页面从不重读

你在「工作目录」里选了目录，行里还是「还没有设置」——不是选择器坏了，也不是没写进去。**写是写进去了，配置页却从不重读自己显示的东西。**

流水线面板把卡片存在自己的一份状态里，只在挂载时读一次（`reload()`）。配置页那一行渲染的是这份状态，不是存储本身。所以一次成功的写入，看起来和一次根本没发生的写入一模一样——模型、权限模式、技能、运行指令、工作目录，**五个控件全都有这个毛病**，你只是先在目录上发现了它。

### 改了三件事

1. **写完就重读。** `patchStepCards` 现在把「写没写成」交回来（`Promise<boolean>`），面板在拿到结果后立刻 `reload()`。渲染的永远是存储里的值。
2. **写失败不再沉默。** 写入被拒（版本冲突、校验不过）时，配置块顶上出现一行红字「这一次没有写进去，再试一次」。之前它是无声地什么都不做——那正是「点了没用」的观感来源。
3. **选择器打不开也说出来。** 平台没有目录选择器、或它拒绝打开时，同样有话说（「目录选择器没有打开，这条路走不通」）。取消不算失败，什么都不写、也不报错。

### 测试

新增两条，正好卡住这个 bug 的两面：

- `shows the picked directory the panel stored` —— 选完目录，行里必须是新路径（写入 → 重读 → 渲染，缺一环就红）；
- `says why a config change did not land instead of failing silently` —— 存储在拒绝写入时，页面上必须出现那句理由。

第二条在没有第 2 项修复时必红，第一条在没有第 1 项修复时必红。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-271'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.7.1.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 指向 `dsh-workbench-2.7.1.tgz`，之后**完全退出** DSH Desktop 再开。

## 怎么验

1. 任意一步 → 配置 → 工作目录 → 选一个目录：行里立刻变成那个路径（不再是「还没有设置」）。
2. 切到别的步骤看配置：同一条流水线里每一步都指向它。
3. 顺手验其它四行：模型换个、权限换个、技能换个、运行指令写一句——每一行当场变，切走再回来还在。
4. 如果哪一行改完出现红字，那是真实原因，不是玄学。

## 回归

`corepack yarn workspace dsh-workbench check` 全绿：typecheck 4 份 0 错、vitest **1029 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 501 kB，内联 CSS 137959 字符。

改动：`WorkbenchPage.tsx`（`patchStepCards` 交回结果）、`WorkbenchPipeline.tsx`（`applyPatch` 写完重读 + `configProblem` 一行红字）、`locales.ts`、`pipeline-classes.ts`、`pipeline.css`（`.wb-cfgProblem`）、`tests/WorkbenchPage.spec.tsx`（两条新用例 + 假传输补存 workspace/instruction）。
