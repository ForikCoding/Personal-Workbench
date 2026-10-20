# 卡片工作目录：沙箱限定的验收条目（93–96）

> **本文件是增补**。`docs/workbench-card-requirements.md` 的验收标准目前到 92 条，
> 本文补上沙箱限定落地后新增的四条，编号接着 92。写入独立文件是为了不在主文档
> 中途插入而打乱其锚点与附录结构；下一次合并时这四条应并入 §14.9 与附录 A.9，
> 并将主文档的总数从 92 更新为 96。

## 先读：两条边界

**① 围栏本身没有进程内测试。**
`dsh-workbench/tests/skill-card-workspace-sandbox.spec.ts` 是**刻意 skip** 的 3 条
进程外测试——它需要真实宿主、真实会话与真实文件写入。**它是规格，不是通过的测试。**

**② 没有任何一次真机验证。**
本功能的每条结论都来自单元测试或探针脚本
（`dsh-plugin-desktop/scratch/agent-cwd-probe.mjs`），**从未在应用里点过一次**。

下文每条都注明它究竟被什么证明。

---

## 93. 运行挂在自己根在工作目录的 agent 下

卡片刻了工作目录时，运行以该目录为根的 agent 作为父启动，而不是会话的 agent。

**为什么这样就能限定**：沙箱从 `session.header.cwd` 取 `workspaceRoot`，而 seam 把
子会话的 header 复制自父。父根在卡片目录，子就落位。

```
覆盖：tests/skill-card-runner.spec.ts「the card agent that fences a run」
      → createdAgents[0].session.header.cwd === 工作目录
      → 该次激活的 request.parent 不是会话 agent
实测：agent-cwd-probe.mjs 用例 [5]
      cardSeamChildHeaderIsCardDir / cardSeamChildRootIsCardDir 均为 true
```

**未被证明的部分**：进程外的真实写入是否真的被拒。见边界 ①。

## 94. 每卡一个 agent：首次创建、后续复用

第二次运行不新建 agent。**复用是必须的，不是优化**——目录在创建时固定，只有留住
那个 agent 才能继续维持围栏。

```
覆盖：同文件「reuses it」→ 两次运行后 createdAgents 长度仍为 1
```

## 95. 工作目录变更时销毁并重建

已存的路径与当前路径不同时，旧 agent 被 `dispose`，新 agent 以新目录创建。

**不能就地改**：root 在创建时固定，留着旧 agent 等于把运行围在用户没有选择的目录里。

```
覆盖：同文件「rebuilds it when the workspace changes」
      → disposedAgents 长度 1、createdAgents 长度 2、新的 root 是 /elsewhere
```

## 96. 跑完归档卡片会话，且命名与真实服务一致

每次结算后归档该 agent 的会话，避免侧边栏为每张跑过的卡留下 `workbench-card-*`。
归档是 bookkeeping 不是删除：agent 仍可复用、会话仍可读。归档失败只 `warn`，
**绝不把已捕获的结果变成失败**。

宿主接口上的名字必须是 `workspaces.archiveSession`——宿主对象是 `ctx` 的宽 cast，
**名字不一致会编译通过、测试全绿，却在运行时取到 `undefined`**。

```
覆盖：同文件「archives each card session so the sidebar does not fill up」
      → archivedSessions === [刚创建的 agent 的 id]
      → 未配工作目录时不建 agent，且运行被拒（workspace-missing）
```

---

## 仍未做

| 项 | 状态 |
|---|---|
| 真实写入越界被拒（进程外） | ❌ 只有探针证据，无真机验证 |
| 换目录后旧会话是否真的从侧边栏消失 | ❌ 同上 |
| `startActivation` 在稳定版缺失时的降级 | ✅ 已有（`run-unavailable`） |
