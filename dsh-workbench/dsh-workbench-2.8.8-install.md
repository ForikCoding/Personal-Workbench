# dsh-workbench 2.8.8

## 这一版修的是「技能下拉里看不到我自己的 skill」

用户在 `C:\Users\hspcadmin\.agents\skills\` 下放了 10 个 skill，技能下拉里一个都没有。

### 根因（不是工作台读错目录，是整条发现链在打包后的桌面里被整体跳过了）

宿主日志 `%APPDATA%\dsh-desktop\logs\harness.log` 每次读技能目录都在重复这一行：

```
warn skill-registry: skill provider "filesystem" skipped:
FsError: cannot list "D:\Program Files\DSH Desktop\resources\app.asar\node_modules\@deepseek-ai\dsh-agent-preset\skills":
Cannot mix BigInt and other types, use explicit conversions
```

`skill-filesystem` 是按「预设」挂载的，配置里带了 `customSkillDirs`，指向 `app.asar` 里那个目录。
桌面把应用打进了 asar 归档，文件服务列不出归档内的路径，**一个根列不出来，整个 provider 就被丢弃**——
连它下面本该照常读的 `~/.agents/skills`、`~/.dsh/skills`、项目里的 `.agents/skills` 一起没了。

所以下拉里只有各插件自带的 skill（manim、browser、office、sandbox），用户自己的一个都不出现。
用 `skill` 工具直接点 `uf30-task-analysis` 也报 “unknown”，可见与工作台无关，是整台应用都没有本地 skill 发现。

### 这一版的做法

工作台自己往 `ctx.skills` 注册一个 provider（名字 `workbench-local`），按同样的四个本地根读：

- `<工作目录>/.dsh/skills`
- `<工作目录>/.agents/skills`
- `~/.dsh/skills`
- `~/.agents/skills`

它不含任何 asar 路径，所以不会被上面那个错误连坐；`SKILL.md` 的 `name` / `description` /
`when-to-use` / `user-invocable` / `disable-model-invocation` 都按原样解析，`get` 读正文，
相对资源以 skill 目录为基准。注册点在宿主作用域，因此**不管这次读是走会话 agent 还是无 agent 的
全局层，都能看到**。

副作用是好的那一面：既然注册在宿主层，应用的 `/` 技能菜单和 `skill` 工具也一并恢复，
`/uf30-task-analysis` 这类命令重新可用。

### 已知边界

- 一旦桌面把 `@deepseek-ai/dsh-agent-preset` 从 asar 里解出来（或上游改成「一个根读不了只跳过这个根」），
  预设里那份 provider 会回来；同名 skill 由层序决定，预设层更近，仍然优先，两边不会打架。
- `skill-filesystem` 里的 watcher 行为（新加 skill 立刻出现在菜单）这一版没有，重开应用即读到最新目录。
- 只认「目录 + 根下的 `SKILL.md`」这一种形态，与上游 `skill-filesystem` 的目录约定一致。

## 安装

```
profile: %APPDATA%\dsh-desktop\harness\profiles\web
pin:     file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.8.8.tgz
```

已把 `dsh-workbench` 解包覆盖到 profile 的 `node_modules\dsh-workbench`，并把 profile 的 `package.json`
指向 2.8.8。**完全退出应用再打开**一次（刷新页面不算），然后到「工作台 → 配置 → 模板下面的技能」
看下拉：`uf30-task-analysis`、`frontend-design`、`skill-creator` 等应当出现在列表里。
