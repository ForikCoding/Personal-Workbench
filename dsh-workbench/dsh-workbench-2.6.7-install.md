# dsh-workbench 2.6.7

## 按原型图补齐任务操作：待运行 / 重命名 / 移除先问一次

原型（`docs/prototypes/workbench-pipeline-v2.html`）先改，这一版把它做进插件。

### 1. 任务状态「待运行」

`未运行` 说不清是「跑过又停了」还是「一次都没跑过」。这一版把后者单列为 **待运行**：

- 状态词：`待运行`（`pipeStepState_idle` / `pipeNotRun`），脚注 `还没启动过`（`pipeNeverRan`）。
- **记号不再和排队中撞**：`待运行` 是一枚空槽位（直角方框），`排队中` 仍是虚线圆。原来 `STATE_VIEW` 里两者都指向 `dash`，节点上还另外写死了一套「非 done/running/failed 一律 dash」，所以两处都一样。现在节点、状态标、步骤条只认 `STATE_VIEW` 一张表。
- 形状之外还有第二层：节点是虚线框 + 空心序号，状态标描边不填底，圆点空心。这三样排队中都是相反的（实线框、浅灰填底、实心点）。

### 2. 重命名这一步

`⋯` → **重命名这一步**，这一步的标题就地变输入框（不是流水线标题那一个）：

- 名字存在这一步的**卡片**上——一步就是一个卡片 id，卡片名就是步骤名，所以改名同时改的是任务名，卡片栅格里也是新名字。没有第二份名字要同步。
- 回车保存、Esc 放弃、点别处也算保存；名字为空或没改就不写。节点脚注在编辑期间换成「回车保存 · Esc 放弃」。
- 输入框自己吃掉键盘事件：它所在的节点本身是个 button，空格会被当成「激活」，回车会被当成「移动选中」。

### 3. 从流水线中移除：点两次

一行就删太容易误触（删掉一步会连带它的产物从结果里消失），所以跟删除流水线一个规矩：

- 第一次点 → 行变成 **再点一次确认移除**，脚注写出 `将移除「<这一步的名字>」…`。
- 4 秒不动自动收回；点开别的步骤、关掉菜单、切换流水线都会收回。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-267'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.6.7.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

`Copy-Item` 那行不能省：`npm pack` 的时间戳全是 1984 年，同尺寸文件会被 robocopy 判成没变而跳过，版本号会停在上一个。

profile 指向新 tgz 后**整个退出** DSH Desktop 再重开。

## 怎么验

1. 一条还没启动的流水线：每一步的状态是 **待运行**，记号是方框，节点是虚线框；跑起来之后变成排队中的虚线圆。
2. `⋯` → **重命名这一步**：节点标题变输入框，改名回车，标题、卡片栅格里的任务名一起变。
3. `⋯` → **从流水线中移除**：第一次点只把这一行变成「再点一次确认移除」并报出要删的那一步，再点一次才真的删；等 4 秒会自己收回。

## 回归

`corepack yarn workspace dsh-workbench check` 全绿：typecheck 4 份 0 错、`vitest` **1021 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 492 kB，内联 CSS 136169 字符。

改动的文件：`pipeline/pipeline-view.ts`（待运行的记号）、`WorkbenchPipeline.tsx`（`slot` 记号、就地改名、两次确认移除、`RenameField` 支持节点内复用）、`WorkbenchPage.tsx`（`renameCard` 写卡片名）、`pipeline.css` + `pipeline-classes.ts`（`wb-nodeNameInput`、待运行的节点/标签/圆点）、`locales.ts`（`待运行`、`重命名这一步`、`再点一次确认移除`、`将移除「{name}」…`、`回车保存 · Esc 放弃`、`任务名称`）、`tests/WorkbenchPage.spec.tsx`（移除改成两次点击、新增改名与待运行两条）。
