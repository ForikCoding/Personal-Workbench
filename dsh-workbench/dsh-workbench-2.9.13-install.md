# dsh-workbench 2.9.13 安装说明

本版修一处**配置面板串步**：新加的步骤打开配置，显示的是上一步的技能和运行指令。

## 为什么

配置面板分两块：「整条流水线 改一次，每一步都跟着」（模型 / 权限 / 工作目录）和「这一步」（技能 / 运行指令 / 模板 / 失败处理）。这是两种作用域，但两块**共用了同一个数据源和同一个写入通道**：

```
<ConfigPanel
  step={selected}                 // 这一步：选中的那一步，对
  shared={stepViews[0]?.card}     // 整条流水线：永远读第 1 步的卡片
  onPatch={applyPatch}            // 写入：patchStepCards(每一步的 cardId, patch)
```

于是「这一步」那两行读的是 `shared`——**第 1 步的卡片**，写的却走 `onPatch`——**写进每一步的卡片**。两边都错：

- **看到的是错的**：第 2 步选的是 `uf30-detailed-design`，技能下拉显示 `uf30-task-analysis`，运行指令显示第 1 步那句「分析效能任务 T202608242753-1」。步骤的名字（详细设计）来自它自己的卡片，所以卡片是对的，只有面板读错了。
- **改一下更糟**：在下拉里选一个技能，会把**所有步骤**的技能一起改掉。也就是说这个 bug 不只是显示，它本来会让第 1 步悄悄变成第 2 步的技能。

另外运行指令那个输入框是非受控的（`defaultValue`），换步骤时不会重新出生，所以它还会留着上一次那个步骤的文字。

## 改了什么

- 「这一步」的两行（技能 / 运行指令）改读**这一张卡片**（`step.card`）；
- 它们的写入走新的 `onStepPatch`：`patchStepCards([这一步的 cardId], patch)`，只写这一步；
- 「整条流水线」的三行（模型 / 权限 / 工作目录）保持原样，仍然写进每一步——那是它写在标题上的承诺；
- 运行指令的输入框按步骤 `key` 重新出生，换步骤就换成那一步的句子。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常）：

```
tar -xf dsh-workbench-2.9.13.tgz -C %TEMP%\wb-stage-2.9.13
robocopy %TEMP%\wb-stage-2.9.13\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.13\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.13.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

1. 点第 2 步，配置里「技能」显示的是它自己的技能（现在应该是 `uf30-detailed-design`），描述也是它自己的；
2. 「运行指令」显示的是第 2 步那句话，不是第 1 步的；
3. 在第 2 步的技能下拉里换一个技能 → 只有第 2 步变，第 1 步不动（回到第 1 步确认）。

## 注意：被这个 bug 写坏过的卡片

如果你之前在这个面板里**改过技能或运行指令**，那次改动可能已经写进了所有步骤的卡片。检查一下每一步的技能是不是它该有的；改回来现在是一步一步的，不会互相牵连。

配套测试：`chooses the skill of the step being edited, and of that step alone` 与 `edits the instruction of the step being edited`（都改成断言「只写这一步」），另外指令框会断言换到第 2 步时先显示第 2 步自己的那句话。
