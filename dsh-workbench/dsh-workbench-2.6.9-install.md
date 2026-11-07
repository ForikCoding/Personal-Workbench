# dsh-workbench 2.6.9

## 配置页对齐原型：三行死文字变成能用的控件，「运行指令」是真的文本框

上一版把模型、权限模式做成了能写的下拉。这一版补齐剩下三行，并且**运行指令是文本框**——按原型，不是模式下拉。

### 1. 工作目录：输入框

路径可以改，改完（失焦 / 回车）一次写进**每一步的卡片**。不逐键写，因为逐键写等于每敲一个字就重写一遍所有卡片；空白清空表示「还没选目录」。客户端先挡一道：不是绝对路径就不写——相对路径换个人解析就是另一个目录，存下来等于让卡片跑在你没选过的地方。

### 2. 技能：下拉

选项来自会话的技能目录（只列可主动调用的），选中就写进每一步的卡片，下面那句说明跟着换。

### 3. 运行指令：多行文本框（这一版的重点）

原型这里是**文本框**，之前插件里显示的是「指令模式」（`不需要额外指令` 之类的静态文字），不是同一件事。现在：

- 卡片契约新增 `instruction` 字段：自由文本，上限 2000 字，纯空白不算指令（存的是 `null`，不是空串）。
- 从下往上全部打通：契约 → 存储（读写与校验）→ 客户端解析 → **运行**。
- **它是真的会被用到的**：运行时如果这次 run 自己没有带指令，就用卡片存的那句（`skill-card-runner.ts`）。所以文本框里写的话会随这一步交给技能，不是存着好看。卡片自己声明「必须有指令」时，也已经存在的那句就算数。

### 4. 失败处理

还是静态的「停止后续步骤 · 串行编排，失败即停」。运行器目前就是失败即停，没有「继续」这条策略；做成一个点了不改行为的下拉，正是之前被否掉的那种假控件，所以这一行留到有执行策略时再改。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-269'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.6.9.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `dsh-workbench` 指向 `dsh-workbench-2.6.9.tgz`，之后**完全退出** DSH Desktop 再开。

## 怎么验

1. 任意一步 → 配置：工作目录是输入框，技能是下拉，运行指令是多行文本框。
2. 把运行指令改成一句自己的话，失焦 → 每一步的卡片都存了这一句（打开别的步骤的配置能看到）。
3. 起一次这一步的运行 → 提示词里带的是这句话（不是通用说法）。
4. 工作目录填个相对路径 → 不会写进去（保持原值）。

## 回归

`corepack yarn workspace dsh-workbench check` 全绿：typecheck 4 份 0 错、vitest **1026 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 499 kB，内联 CSS 136804 字符。

改动：`skill-card-contract.ts`（`instruction` 字段 + 校验 + 长度上限）、`skill-card-store.ts`（读写校验、删除互斥声明）、`skill-card-runner.ts`（选择集带 `instruction`，run 没带就用卡片那句）、`client/skill-card/api.ts`（解析）、`WorkbenchPipeline.tsx`（三个控件，`onPatch` 一个口子）、`WorkbenchPage.tsx`（`patchStepCards` 已支持任意字段）、`locales.ts`、`pipeline-classes.ts`、`pipeline.css`、三个测试文件。
