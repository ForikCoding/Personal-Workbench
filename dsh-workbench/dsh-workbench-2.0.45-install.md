# dsh-workbench 2.0.45 · 安装指南（运行记录可点开）

**修复 2.0.43/2.0.44 的一个交互缺陷：运行记录列表里的每一行都点不开。**

```
dsh-workbench-2.0.45.tgz    约 275 KB
```

本次只改了客户端 bundle（`lib/client.js`），宿主侧代码未变。

---

## 这次修了什么

### 1. 有运行在跑时，整个历史列表被锁死

旧实现里，只要卡片上有一次运行在飞行中，运行记录页面的**所有行**都会变成 `disabled`：

```tsx
<button onClick={onOpen} disabled={busy} …>   // busy = 有运行在跑
```

于是用户看到列表却点不开任何一条，连「运行中」那行也没法点进去看进度，整个列表像一排死文本。

现在：

- **历史行永远可点**。已存的运行是只读记录，点开看它自己的结果；正在跑的那一行点开就是这次运行的**实时视图**。
- 开局不再要求"等它跑完"。

### 2. 点开某条历史时，可能显示成"正在跑的那次"

控制器的结果优先级是 `resultOverride ?? run?.result ?? stored`：
只要卡片上有运行在飞，`run.result` 会盖过用户点选的那条历史记录。

现在加了一条规则：**用户点开的是哪条已存运行，就显示哪条**——
只有"没点名具体运行"（打开卡片最新结果）时才让在飞的运行优先：

```ts
const named = options.runId !== undefined && stored !== undefined
const result = resultOverride ?? (named ? stored : run?.result ?? stored)
```

这同时解释了旧实现为什么要锁行（怕内容被覆盖），现在锁行的前提没有了。

### 3. 回归测试

`tests/SkillCardRunsPage.spec.tsx` 的两条用例改为断言新行为：

- 正在跑的那一行从一开始就是可点控件；
- 有运行在飞时，已存的行走得通，飞行中的行走得通，各自打开各自的 `runId`。

---

## 安装

与 2.0.44 相同（找 profile → 解包覆盖 → 改依赖引用 → 刷新）：

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.0.45.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.44\.tgz', 'dsh-workbench-2.0.45.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

**这次只需在 DSH 窗口里刷新页面（`Ctrl+R`），不用完整重启**：
本次改的只有客户端 bundle，页面刷新就会按新的内容哈希重新拉取。

---

## 升级后应当看到

- 运行记录列表的每一行都能点开；
- 「运行中」那行点开后是这次运行的实时视图（进度/轨迹），运行结束后同一行变成已完成记录；
- 点开任意一条历史，显示的就是那一条的结果，不会被正在跑的那次顶掉。
