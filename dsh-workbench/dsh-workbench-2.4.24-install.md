# dsh-workbench 2.4.24 安装与验证

## 这一版改了什么

**卡片面上直接写出「为什么运行按钮是灰的」。**

起因：另一台电脑上，`任务分析` 这张卡的配置（技能、模型、工作目录）看起来和这台一样，`运行` 却是灰的。我去翻代码，`运行` 的可用性是**四个条件同时成立**才开：

```
runnable = 有运行通道（harness 提供 startActivation 或 start）
        && 卡上存了技能 && 卡上存了模板
        && 模型字段不是 unavailable
        && 工作目录字段是 ready
```

任何一条不成立，按钮就是灰的 —— 而**这句话原来一个字都不在卡片面上**：四条理由只写在卡片的「运行记录」页和结果页里。于是「灰了」只能靠猜。

这一版：

- 卡片面子（摘要下面）多一行说明：`工作目录不存在或不是文件夹 · D:\Git\deepseek-harness`、`这张卡还没有选择工作目录，先选一个目录再运行`、`没有可用的模型，这张卡暂时不能运行`、或那句运行通道缺失。能跑的时候这一行不出现。
- 只写第一条理由。顺序是刻意定的：**先工作目录、再模型、最后运行通道**。因为目录是这张卡自己的事实、而且句子能点出具体路径；而一张卡从别的机器搬过来、目录没了，如果面上写「没有可用的模型」，会把人引到错的设置项上去。
- 卡片上出现这一行时，摘要从两行收成一行：一格里原来只装「摘要 + 次数」，现在要多装一句理由，不压缩就会顶出格子。
- 四个理由的判定抽成一个函数（`runProblemsOf`），卡片面和两个运行页共用一份 —— 原来那四段判断在「运行记录」页和结果页各写了一遍，正是会读歪的写法。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-2424'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.24.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 已指向 `dsh-workbench-2.4.24.tgz`。**另一台电脑**上装同样的包（那边 profile 路径按那边的用户名改），装完整个退出 DSH Desktop 再重开，`Ctrl+F5`。

## 怎么验

1. 装完看`任务分析`那张卡：摘要下面多了一行带底色的说明 —— 就是它运行不了的原因。
2. 按那行去改对应的一处：目录没了 → `配置` → 工作目录重新选；没选目录 → 同上；模型 → `配置` → 模型。
3. 改完回网格：那一行消失，`运行` 变为可点。
4. 能跑的卡（`我的任务`）：面上不该出现这一行。

## 回归

`corepack yarn check` 全绿：typecheck 0；`vitest` 51 passed / 1 skipped（**922 passed, 3 skipped**）；build 0；`verify:artifacts` 干净（CSS 内联 66,145 字符）。

`SkillCard.spec.tsx` 新增 5 条：能跑时没有任何理由；目录失效时先报目录（带路径）再报模型；目录检查还没答复的那一帧什么都不报；`workspace-missing` 与运行通道的顺序；四个理由渲染成四条带 `data-run-*` 的句子。运行记录页/结果页原有的 4 条断言未改，仍然全过（那两段判断换成共用组件后属性和顺序不变）。
