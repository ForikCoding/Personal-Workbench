# dsh-workbench 2.0.44 · 安装指南（缺陷修复版）

**这是一次修复版发布：解决安装 2.0.43 后「工作台上的卡片全部消失、也无法新建卡片」的问题。**
安装方式与 2.0.43 完全相同，只是把包换成 `dsh-workbench-2.0.44.tgz`。

```
dsh-workbench-2.0.44.tgz    约 275 KB
```

---

## 这次修了什么

2.0.43 引入「运行记录」时，每条运行结果多了一个 `runId` 字段，用来在历史列表里定位一次运行。
但存储域的**表结构 schema**（`src/skill-card-spec.ts` 的 `workbenchResultSchema`）没有同步声明这个字段。

存储域在加载记录时会按 schema 校验并丢弃未声明的字段，于是：

1. runner 写入磁盘的记录**有** `runId`；
2. 域把它读进内存时，`runId` 被 schema **丢掉**；
3. 面板客户端（2.0.43 起）要求"每条结果都必须有 `runId`"，遇到一条没有，
   **判定整份快照无效**；
4. 配置读取失败 → 网格拿不到任何卡片 → **卡片全部消失**，新建卡片的写入同样失败。

这正是 `skill-card-spec.ts` 注释里反复警告的那类 bug：
「schema 不声明的字段，写完能活过磁盘、下一次加载就消失」。

修复内容：

- `workbenchResultSchema` 声明 `runId`（可选——升级前的老记录本来就没有它，
  读取时由 store 补上 legacy 运行 id，不会被当成坏记录备份跳过）；
- store 的 `read()` 用**复合键的右半边**给每条结果补 `runId`：
  键就是 store 自己写下去的身份证，即使记录里意外丢了字段，快照也永远合法；
- 补两条回归测试，锁死"schema 必须保住 `runId`"和"记录缺 `runId` 时用键兜底"。

**磁盘上的数据自始至终没被动过，卡片和结果都还在。**

---

## 0. 前提

与 2.0.43 相同：

| 项 | 要求 |
|---|---|
| DSH Desktop | 提供 `startActivation`（`0.2.1-alpha.2` / beta 通道）或一次性 `start`（`0.2.0-rc.2` / 稳定通道）之一 |
| Cordis | `4.0.4` 或 `4.0.5-alpha.1` |
| Node | `^22.19.0` 或 `>=24.0.0` |

---

## 1. 找到实际在用的 profile

```powershell
echo $env:DSH_HOME       # 例如 C:\Users\<你>\AppData\Roaming\dsh-desktop\harness
echo $env:DSH_PROFILE    # 例如 web
```

profile 目录 = `%DSH_HOME%\profiles\%DSH_PROFILE%`。

---

## 2. 覆盖安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'

# 1) 解包并覆盖插件目录
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.0.44.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force

# 2) 让 profile 的依赖指向新包
(Get-Content (Join-Path $profile 'package.json') -Raw) `
  -replace 'dsh-workbench-2\.0\.43\.tgz', 'dsh-workbench-2.0.44.tgz' `
  | Set-Content (Join-Path $profile 'package.json') -Encoding UTF8 -NoNewline
```

## 3. 校验

```powershell
(Get-Content (Join-Path $target 'package.json') -Raw | ConvertFrom-Json).version
# 期望：2.0.44

# 文件头不应有 BOM（UTF-8 无 BOM 时首字节是 { 或 字母）
[System.IO.File]::ReadAllBytes((Join-Path $target 'lib\index.js'))[0]
```

## 4. 重启 DSH Desktop

**插件只在应用启动时加载。** 装完后必须完整退出 DSH Desktop（含托盘）再重新打开，
新的 schema 才会生效，卡片才会回来。

---

## 5. 升级后应当看到

- 工作台网格上原来的卡片（如 `skill-card-1`「我的任务」、`skill-card-2`）重新出现；
- 点卡片进入运行记录列表，旧的两条运行记录都在（老记录显示为 legacy 运行）；
- 新建卡片恢复可用；
- 不需要手动清理任何存储文件；`result` 目录里的 `.bak.*` 是存储域自己的备份旁车文件，可保留。
