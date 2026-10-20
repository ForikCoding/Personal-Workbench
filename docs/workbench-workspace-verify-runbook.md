# 卡片工作目录：真机验证手册

> 这份手册验的是**唯一还没有被任何自动化证明的东西**。
> 当前 `check` 是 609 通过 / 3 跳过，但那三个数字**证明不了**下面的任何一条。

## 为什么要手工验

本功能的三处关键判断，全部是**单元测试覆盖不到**的：

| 判断 | 为什么测试证明不了 |
|---|---|
| 归档的服务名对不对 | 单测的 fake 提供了那个方法；**真实宿主不注入它也不会报错** |
| `cwd` 与沙箱根是否一致 | fake 里两者都是 `/repo`，**区分不出来** |
| 越界写入是否真被拒 | 需要真实宿主、真实会话、真实文件系统；那条 spec 是**刻意 skip** 的 |

前两条我在实现时就各写错过一次（`workspaces` vs `workspaceRegistry`、`cwd` 传了会话目录），**都是编译通过、测试全绿、只有真机才暴露**。

---

## 准备

```powershell
# 确认装的是含修复的版本
Get-Content "$env:APPDATA\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json" |
  ConvertFrom-Json | Select-Object name, version
# 期望：dsh-workbench 2.0.21
```

**重启 beta 应用**（会结束当前会话）。

---

## 验证一 · 归档生效

1. 选一张卡，配置页给它选一个工作目录（例如 `D:\Git\Personal-Workbench`）
2. 运行一次，等它出结果
3. **看侧边栏的会话列表**

| 看到 | 说明 |
|---|---|
| **没有** `workbench-card-*` | ✅ 归档生效 |
| 有 `workbench-card-skill-card-0` 之类 | ❌ 归档没生效 |

**失败时先看日志**，找这一行：

```
workbench card session archive failed: ...
```

- 出现 → 归档调用真的失败，`...` 里会写原因（最可能是 `WorkspaceUnknownSessionError`：会话还没落盘就被归档）
- **没出现却仍有多余会话** → 说明我读的注入名仍然不对

## 验证二 · `cwd` 与沙箱根一致

1. 在同一次运行里，让卡片**用相对路径**写一个文件（例如模板里让模型写 `note.txt`）
2. 到工作目录里看文件在不在

| 结果 | 说明 |
|---|---|
| 文件出现在**卡片工作目录** | ✅ `cwd` 与根一致 |
| 文件出现在**会话的目录** | ❌ `cwd` 没跟随父 agent |
| **报写入被拒** | ❌ 根在别处，或 `cwd` 在别处——两者不一致 |

## 验证三 · 围栏真的生效（核心）

这是整个方案成立与否的唯一判据。

1. 给卡片配一个**专为测试的目录**，例如 `D:\tmp\fence-test`
2. 让它尝试往**该目录之外**写一个文件（例如绝对路径 `D:\Git\Personal-Workbench\escaped.txt`）
3. 检查该文件

| 结果 | 结论 |
|---|---|
| **写入被拒**（`file access denied under workspace-write`） | ✅ **方案成立** |
| 文件被创建出来了 | ❌ **方案不成立**，今天做的全部要重来 |

⚠️ 你当前的会话策略若是 `danger-full-access`，**围栏本来就不生效**——那时这一条验的是策略而不是本功能。要验围栏，需要：
- 会话处于 `workspace-write` 模式，或
- 直接看 `sandboxPolicy.resolve()` 算出的 `workspaceRoot` 是不是卡片目录

---

## 失败时给我什么

| 现象 | 给我 |
|---|---|
| 有一条错误信息 | **原文**（不要截图，粘贴文本） |
| 行为不对但没有报错 | 你做了什么、期望什么、实际什么，三句话 |
| 只想确认注入名 | 我可以用探针脚本重跑一遍真实宿主，比猜快 |

## 已验证过什么（避免重复劳动）

- 机制层面：`agents.create({ meta: { cwd } })` 会写进 `session.header.cwd`，沙箱根随之改变；以它为父的 seam 子会话继承同一个目录，且**仍能捕获 `{html}`**。见 `dsh-plugin-desktop/scratch/agent-cwd-probe.mjs` 用例 `[5]`
- 代码层面：609 条测试，含四条卡片 agent 生命周期用例与一条 teardown 用例
- **产品层面：零。** 这份手册就是为补这一项而写的
