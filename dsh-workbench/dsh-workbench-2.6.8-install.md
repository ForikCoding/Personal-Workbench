# dsh-workbench 2.6.8

## 配置页：整条流水线改成真的能改

原型里「整条流水线」那三行是**控件**（模型、权限模式是可选的），插件里它们是死文字——而且 `改一次，每一步都跟着` 这句承诺根本没有对应的写操作。这一版按原型补齐，并且真的写下去。

### 1. 模型：真下拉，写进每一张卡

- 选项来自宿主真实的模型目录（`models` 座位，按 provider 分组，显示模型名、值存 `[provider, model]` 这一对），不是在插件里硬编码两个名字。
- 第一项是 **跟随会话**：一步的卡片没有单独指定时就是它，行下方的提示写明 `这一步没有单独指定，跟着流水线走`。
- 选一个 → **这一步的每一张卡都写**（原型那句 `改一次，每一步都跟着`）。清回「跟随会话」写的是 `null`，不是「什么都不写」——把卡片恢复到跟随会话本身就是一个决定。

**为什么是逐张写而不是一次写**：卡片写入是带 `baseRevision` 的乐观写，五张卡用同一个 revision 发出，第二张就是冲突、停在半路。所以按步骤顺序串行写，每一次用上一次返回的新 revision。

### 2. 权限模式：真下拉，同样是整条

三个模式用产品自己的名字（`只读` / `工作区内修改` / `完全权限`，与卡片设置页同一份文案表），顺序从窄到宽，下方提示 `写入限制在工作目录内`。

### 3. 补上原型有、插件没有的两行

- **技能**：技能下面补一句这个技能的说明（来自会话的技能目录），行里不再只有一个 id。
- **运行指令**：这一步的卡片存的指令模式（`不需要额外指令` / 具体模式名）——插件里没有自由文本的运行指令字段，卡片存的是模式，所以这里说模式，不编一段没人存过的文字。

### 4. 模板

模板那块本来就有（预览 / 源码 / 去编辑），这一版没动。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-268'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.6.8.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

`Copy-Item` 那行不能省：`npm pack` 的时间戳全是 1984 年，同尺寸文件会被 robocopy 判成没变而跳过。profile 指向新 tgz 后**整个退出** DSH Desktop 再重开。

## 怎么验

1. 选任意一步 → 配置 → 「整条流水线」：模型是一个下拉（分组显示模型名，第一项是「跟随会话」），权限模式是一个下拉（只读 / 工作区内修改 / 完全权限）。
2. 改权限模式为「只读」→ 这条流水线**每一步**的卡片都变成只读（打开任意一步的卡片设置页确认）。
3. 模型选一个 → 每一步的卡片都指向它；选回「跟随会话」→ 卡片恢复跟随。
4. 「这一步」里技能下面有一句说明，「运行指令」一行显示这一步卡片存的指令模式。

## 回归

`corepack yarn workspace dsh-workbench check` 全绿：typecheck 4 份 0 错、`vitest` **1024 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 496 kB。

改动的文件：`WorkbenchPipeline.tsx`（`ConfigPanel` 两个下游标 + 技能说明 + 运行指令行、`StepCardPatch`、`PERMISSION_ORDER`）、`WorkbenchPage.tsx`（`patchStepCards` 串行写、模型目录订阅）、`locales.ts`（`跟随会话`/提示/`运行指令` 两组文案）、`tests/WorkbenchPage.spec.tsx`（权限整条写、模型写与清除、技能说明与运行指令三条）。
