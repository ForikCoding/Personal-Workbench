# dsh-workbench 2.9.16 安装说明

本版修一处**工作台不记得你选中的是哪一步**：切到别的会话再切回来，右边永远是第 1 步。

## 为什么

面板的选中步骤只活在组件的 state 里：

```
const [focus, setFocus] = useState<Focus | undefined>(undefined)
const selectedIndex = focus?.kind === 'step' ? focus.index : 0    ← 没有焦点就是第 0 步
```

工作台每次换会话都会重挂（面板是页面的一块，会话一换就销毁）。state 跟着没，`focus` 回到
`undefined`，于是永远落回第 1 步。**「哪条流水线是打开的」早就记住了**（
`dsh-workbench:open-pipeline`），只是下一层没人记——同一件事，只做了上半截。

## 改了什么

**记住「这条流水线的第几步」**，和记住流水线用的是同一处存储（`localStorage`，键
`dsh-workbench:open-step`，值是 `{ 流水线 id: 步骤序号 }` 的一张表）：

- 一张表而不是一个值：面板内部切换流水线不重挂，A 的第 3 步和 B 的第 1 步各自留着；
- 存的是**位置**而不是卡片 id：改名字不会让它失效，位置动了才是；
- 关窗口、重开应用、切会话都还在（和流水线记忆同一个理由：那是看屏幕的人的偏好，不是流水线
  的一部分）。

**什么时候写**：只有一处——`selectedIndex` 变了就写。点击节点、跑完落在某一步、加一步、删一步，
全都从这一个出口过，不会漏。

**越界就夹住**：步骤被删掉之后，记住的序号可能超出这条流水线的步数，读的时候夹到最后一格，
而不是显示一片空白。

**删掉流水线时连它的步骤一起忘掉**：流水线 id 会被复用（`createPipeline` 取第一个空号），
否则新流水线可能一打开就停在一条已经不存在的流水线的第 2 步。

顺带修好的一件小事：把焦点放到卡片上（点卡片 facts 打开结果）时，选中步骤以前也会跳回第 1 步；
现在留在原地。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常）：

```
tar -xf dsh-workbench-2.9.16.tgz -C %TEMP%\wb-stage-2.9.16
robocopy %TEMP%\wb-stage-2.9.16\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.16\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.16.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

1. 「从需求到交付」里点第 2 步（详细设计）→ 切到别的会话 → 切回来：右边还是第 2 步，
   画布上第 2 步仍是选中态。
2. 完全退出再打开应用：还是第 2 步。
3. 切到另一条流水线（单步流水线）：它按自己的记忆打开（第一次是第 1 步）；再切回来，
   还是第 2 步。
4. 把第 2 步删掉：选中态落到前一步，不会空白。

配套测试：`pipeline-memory.spec.ts` 的 `the step each pipeline was showing`（三条：按流水线各留
一份、删除只影响那一条、坏文档当作没有记忆），页面级
`comes back to the step it was left on when the panel is mounted again`
（点击第 2 步 → 卸载 → 重挂，断言节点 `aria-selected` 与检查器标题）。
