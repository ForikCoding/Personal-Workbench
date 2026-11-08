# dsh-workbench 2.9.26 安装与验证

## 病：预览说"这一步没有指令"，实际却把卡片那句送了进去

2.9.25 的「每一步收到的话」里，最后一块直接读流水线记录：

```ts
const askCardInstruction = active?.steps[askStepAt]?.instruction
```

而跑起来的时候，runner 是这么取的（`skill-card-runner.ts:612-615`）：

```ts
const asked = request.instruction?.trim()
const stored = selection.instruction?.trim()
const instruction = asked === undefined || asked === '' ? stored : asked
```

**步骤没写指令 → 退回卡片自己存的那句。** 这台机器上的真实数据就是这种情况：

```
workbench_pipeline/pipelines/pipeline-2.json
  steps: [ { cardId: "skill-card-6" }, { cardId: "skill-card-7" } ]      ← 步骤里没有 instruction

workbench_skill_card/card/skill-card-6.json
  instruction: "分析效能任务T202608242753-1"                                ← 卡片里有
workbench_skill_card/card/skill-card-7.json
  instruction: "读取效能任务分析文件做详细设计"
```

于是预览显示「（这一步没有指令）」，而孩子其实收到了「分析效能任务T202608242753-1」。预览成了谎话，而且是最容易被信的那一块。

## 改法：预览按 runner 的取法取

```ts
const own = step?.instruction
const stored = cards.find(entry => entry.cardId === step?.cardId)?.instruction
const effective = own === undefined || own.trim() === '' ? stored : own
```

- 步骤写了 → 用步骤的（和以前一样）
- 步骤没写 → 用卡片自己存的那句
- 两边都没有 → 才写「（这一步没有指令）」
- 两边都按 `trim()` 判空，和 runner 一致；显示时仍按同一套规则把 `{任务编号}` 填成值

顺带一个真实的副作用：「这张卡的指令里还写着 T202608242753-1」那句迁移提示现在会出现 —— 因为卡片那句里确实还抄着号，这正是它该说的时候。

## 校验

`yarn workspace dsh-workbench check`：**1279 通过 / 3 跳过（共 1282）**。

新增一条测试 `shows the sentence a step will really read when the step itself names none`：
步骤没写 + 卡片有 → 显示卡片那句；切到第二步（步骤自己写了）→ 显示步骤那句。

## 安装

```powershell
cd C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web
npm install "file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.9.26.tgz" --no-audit --no-fund --legacy-peer-deps
```

装完**重启 DSH Desktop**。2.9.25 的弹框改版（抬头、句子、计数位置、预览排版）都在这一版里，不用再装 2.9.25。
