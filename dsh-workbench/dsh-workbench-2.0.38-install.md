# dsh-workbench 2.0.38 · 安装指南

把工作台面板装进一个已有的 DSH Desktop。**整个过程不需要联网**（除非你的环境本来就能访问 npm）。

包只有一个文件：

```
dsh-workbench-2.0.38.tgz    约 260 KB
```

---

## 0. 前提

| 项 | 要求 |
|---|---|
| DSH Desktop | 宿主提供两条运行入口之一即可：`startActivation`（**`0.2.1-alpha.2` / beta 通道**）或一次性 `start`（**`0.2.0-rc.2` / 稳定通道**） |
| Cordis | `4.0.4` 或 `4.0.5-alpha.1` |
| Node | `^22.19.0` 或 `>=24.0.0`（插件本身不装 Node，但 DSH 要求） |

**版本不匹配是这类插件最常见的事故**：装得上，启动时解析失败，而界面上只会"什么都不出现"。

---

## 1. 先找到「你实际在用的那个」profile

DSH 的 profile 位置由两个环境变量决定，**不同版本/渠道的 home 可能不止一个**：

```powershell
echo $env:DSH_HOME       # 例如 C:\Users\<你>\AppData\Roaming\dsh-desktop\harness
echo $env:DSH_PROFILE    # 例如 web
```

profile 目录就是：

```
%DSH_HOME%\profiles\%DSH_PROFILE%
```

> **装错 profile 的症状是"装完什么都没出现"，而且不报错。** 因为插件装进了另一个 home，对应的应用根本没启动。

下文用 `%PROFILE%` 指代这个目录。

---

## 2. 声明依赖与组合（推荐方式）

编辑 `%PROFILE%\package.json`，加**两处**：

```json
{
  "name": "dsh-profile-web",
  "private": true,
  "dependencies": {
    "dsh-workbench": "file:<把 tarball 放在哪>/dsh-workbench-2.0.38.tgz"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-workbench"
      ]
    }
  }
}
```

| 位置 | 作用 |
|---|---|
| `dependencies` | **声明要装什么**。必须是 `file:` 开头的路径 |
| `dsh.profile.bundles` | **声明要组合什么**。加进去就会应用它自带的 `cordis.patch.yml` |

包里已经带了 `dsh.bundle.patch`，所以**不需要手写** `cordis.patch.yml` 里的 `id: workbench` 那一行。

### 路径写法

- 用**正斜杠**：`file:D:/pkgs/dsh-workbench-2.0.38.tgz`
- 或相对路径：`file:./vendor/dsh-workbench-2.0.38.tgz`
- 也接受**解压后的目录**：`file:D:/pkgs/dsh-workbench`

### 然后重启应用

profile 只在应用启动时组合。重启后侧边栏应出现「工作台」。

---

## 3. 如果安装器需要手动跑一次

```powershell
cd %PROFILE%
corepack pnpm install
```

> **不要用 `yarn add`。** DSH 的 profile 由 **pnpm** 维护。而且 **Yarn 4 不接受裸路径**：`yarn add D:\...\x.tgz` 会把这个路径当成包名去 npm 查，返回 404。若非要用 yarn，必须写 `file:`。

---

## 4. 离线安装（registry 不通时）

插件本身**不需要联网**——手工解压即可：

```powershell
$p = "%PROFILE%"
Remove-Item "$p\node_modules\dsh-workbench" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$p\node_modules\dsh-workbench" | Out-Null
tar -xzf .\dsh-workbench-2.0.38.tgz -C "$p\node_modules\dsh-workbench" --strip-components=1
```

然后重启。

**为什么这样能行**：插件声明的 `@deepseek-ai/*` 全是 `peerDependencies`（由 **DSH 应用自己**提供），所以 profile 里不需要装整棵依赖树。

---

## 5. 验证

```powershell
# ① 文件到位
Test-Path "%PROFILE%\node_modules\dsh-workbench\lib\index.js"      # True
Test-Path "%PROFILE%\node_modules\dsh-workbench\lib\client.js"     # True

# ② 版本
(Get-Content "%PROFILE%\node_modules\dsh-workbench\package.json" -Raw | ConvertFrom-Json).version
#   2.0.38
```

```
# ③ 重启应用 → 侧边栏出现「工作台」
```

---

## 6. 卸载

```powershell
# ① 从 package.json 里删掉 dependencies 与 bundles 里的 dsh-workbench
# ② 删目录
Remove-Item "%PROFILE%\node_modules\dsh-workbench" -Recurse -Force
# ③ 重启
```

卡片与结果是插件自己的存储域（`workbench_skill_card` / `workbench_layout`，在 `%DSH_HOME%\storages` 下）。**卸载插件不会删它们**，重装后卡片还在。

---

## 7. 本版说明（2.0.38）

运行流水的样式对齐 DSH 对话的运行记录：

- 工具调用与模型思考改为「图标 + 标题 + 单行摘要」的折叠行（`DisclosureRow`），点击展开完整内容（工具行展开显示完整参数，思考行展开显示全文）；
- 结果页的流水上方新增回合头（已完成 / 已停止 / 已失败），可折叠整条流水，与对话的 Turn process 一致；
- 模型回复正文保持直接展示，不折叠；
- 字号与颜色改用对话所用的 `--dsh-content-font-*` / `--dsw-alias-*` 语义 token，跟随系统字号偏好。

上一版（2.0.37）修复了重启后结果丢失的问题（存储的活动流水 schema 补齐 `reasoning` / `text` 两种条目，重启时不再被当作非法记录备份移走），本版在其上继续。

---

## 8. 故障对照表

| 现象 | 原因 | 处理 |
|---|---|---|
| `YN0027 … can't be resolved` / 404 指向 registry | 用了裸路径 | 加 `file:` 前缀，或改用 pnpm |
| 装完重启，侧边栏什么都没有 | 装进了**另一个** home | 用第 1 步对比 `%DSH_HOME%` |
| 同上，但目录里确实有 | 被 `dsh.profile.bundles` 漏了 | 确认 `dsh-workbench` 在 bundles 里 |
| 安装命令"执行了但什么都没变" | `package.json.lock` 里有**死进程 PID** | 删掉这个锁文件再装 |
| `pnpm install` 报 `TypeError: terminated` | 拉不到 registry | 走第 4 步离线安装 |
| 启动日志里报解析/版本错误 | peer 版本不匹配 | 核对第 0 节的版本 |

---

## 9. 别人拿到的是什么

装完后他得到的是**工作台这个面板本身**，卡片是**他自己的**，不会带上你机器上的内容。**MCP 服务（例如小能效能平台）、会话模型选择、技能目录**都属于各自 profile / 存储域，不随插件走。
