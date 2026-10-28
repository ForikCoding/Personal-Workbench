# dsh-workbench 2.0.52 · 安装说明（修复 `{{model}}` 无值运行报错）

**报错**：运行「详细设计」等**没配置模型**的卡片时，以 error 结束：

```
prompt variable "{{model}}" has no value for this assembly (section "deployment:persona-prefix")
```

**根因**：DSH 的系统提示词模板是 `You are a coding agent powered by the {{model}} model.`，`{{model}}` 从**当前 agent 自己的 options.model** 读取。2.0.46 起每次运行 = 宿主新建一个独立 run session（`agents.create({sessionId, meta})`），这个 session **创建时没带 model**；卡片配置了 model 的（card-1/2）运行没问题，卡片没配 model（card-3「详细设计」）→ run session 没有 model → 它派生的子代理也没有 → 装配时 `{{model}}` 无值 → 报错。

```
dsh-workbench-2.0.52.tgz    约 285 KB
```

**改了宿主（index.js）+ 客户端（client.js）→ 需要完全重启 DSH Desktop，不是刷新页面。**

---

## 改了什么

- **run session / 恢复的会话创建时带上模型路由**：卡片配置了 model 用它；卡片没配 model 时继承**命名会话（用户当前会话）的 model**——这正是 2.0.46 之前"没配 model 的卡片跑在用户会话模型上"的原有行为。
- 子代理的继承不变：`resolveChildAgentOptions` 从 run session 继承 provider/model，所以 run session 有 model 后，子代理自动有 → `{{model}}` 正常渲染。
- resize（重新生成）旧记录：恢复旧 run session 时会重新安装路由（旧 session 持久化时没有 model）。

## 验证

- `typecheck` 0；全量 `vitest run` **755 通过 / 3 跳过**（新增 2 个测试：无卡片 model 时继承命名会话路由建会话；卡片 model 优先于会话路由）。

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.0.52.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.51\.tgz', 'dsh-workbench-2.0.52.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

**完全退出 DSH Desktop 后重新打开**。

## 验证清单

- 打开「任务分析」卡片 → 运行出结果 → 点「下一步：详细设计」→ 确认面板 → 详细设计能正常开始运行（不再报 `{{model}}` 错误）。
- 带 model 的卡片（card-1/2）行为不变。
