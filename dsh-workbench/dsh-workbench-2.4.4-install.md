# dsh-workbench 2.4.4 版 安装说明（超时不再伪装成「尚未运行」/「已停止」）

```
dsh-workbench-2.4.4.tgz
```

**宿主（index.js）改了 → 必须重启 DSH Desktop，再刷新页面。**

---

## 这一次的两个问题

### 1. 重新生成跑了一半停住

那次细化的运行（21:26:39 → 21:31:41）**撞上了 5 分钟的时限**，被宿主中止。
前 5 次工具调用全是 `get_goal`（参数为空，模型自己也在推理里说"不知为什么被路由到 get_goal"），
恢复之后又开始 `glob E:\` → `glob E:\UF3.0` → `glob E:\UF3.0\dfzq` 逐级找客户环境的代码库
（`E:\UF3.0\dfzq\ses` 是客户机器路径，本机没有），每次 30 秒超时。时限到，运行停止。

顺手确认：**2.4.3 的 preset 修复是生效的**——这次运行拿到了 `pwsh`、`glob`、`read`，
前一次那种"一个文件工具都没有"的情况不再出现。

### 2. 运行详情里出现「尚未运行」——矛盾

记录里有这次运行（17 KB、33 条过程），页面上却写着「尚未运行 · 点「运行」让这个 skill 执行一次」。
根因：结果面板只判断"有没有可渲染的区域内容"，**没有内容就一律当成"没跑过"**，
而这次运行的确没有产出内容（被中止了）。于是出现"运行记录里明明有一次运行，详情里说没运行过"。

同一个原因还造成两处误报：过程标题写「已停止」（seam 对中止报 `aborted`，可没人点停止），
历史行也写「已停止」。

## 修了什么

1. **失败/超时是记录的一部分**：`WorkbenchResultRecord` 新增 `failure` / `failureCode`，
   成功的运行不写、失败的运行必写。刷新或重启后页面仍然知道这次运行为什么没内容
   —— 以前这个原因只存在内存里，重启就没了。
2. **`run-timeout` 独立错误码**：超时不是"出错"，也不是"被取消"。页面因此能说
   「这次运行超时了」而不是「已停止」或「失败」。
3. **结果面板不再说谎**：有运行痕迹但没内容时，显示
   「这次运行超时了 / 这次运行没有产出内容」+ 具体原因，不再显示「尚未运行」。
4. **过程标题与历史行优先看运行结论**：`failure` 存在时显示「已失败」，
   而不是按 seam 的 `aborted` 显示「已停止」。
5. **运行记录页**也always显示 `problem` 行（细化失败时以前会被压掉，回到结果页什么都没有）。
6. **卡片运行不再给 goal 工具**：`create_goal` / `get_goal` / `update_goal` 用 `toolFilter`
   从这次运行的工具里摘掉。理由是形状不是偏好：goal 是对"后续轮次"的承诺，而卡片运行是
   一次性委派、结束即归档的会话，没人会继续它。小模型拿到它们就空转（这次连打 5 次）。
7. **时限从 5 分钟提到 10 分钟**，并且**把时限写进提示词**（`<run_budget>`）：
   「这次运行 N 分钟后会被自动停止；读任务点名的路径，不要扫描整个盘符，找不到就说找不到」。
8. skill `uf30-task-analysis` 1.2.1：代码验证一节新增「代码可能不在这台机器上」——
   只查一次 `<工作区>/WebCodes/…`，不在就一句话写明"本机无该代码库，代码验证未做"，
   立刻进下一步；坑速查新增 **P13**（扫盘烧光时限）。

## 门禁

- `typecheck` 0
- 全量 `vitest run`：**857 通过 / 3 跳过**（新增：结果面板两条失败标题、运行记录行「已失败」、
  `<run_budget>` 提示词、超时结论落盘、goal 工具过滤器；`run-timeout` 落到 STATUS_BY_CODE /
  LOCALIZED_CODES / PROBLEM_KEYS 三张穷举表里，所以漏一处编译就不过）
- `build` 0、`verify:artifacts` 干净

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.4.4.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force
```

**重启 DSH Desktop**，再刷新页面。

## 验证

1. 打开那张「任务分析」卡 → 运行记录 → 点 21:31 那条「已停止」的行：
   现在应该显示「已失败」，结果区写「这次运行超时了 · the skill run timed out after 5 minutes」。
   （旧记录没有 `failure` 字段，仍按老样子显示；新运行才会有。）
2. 重新生成再跑一次：这次有 10 分钟预算，提示词里也写了预算。
3. 若还是撞时限，说明这个 skill 在 GLM-FLASH-LATEST 上确实慢 ——
   这张卡可以换更强的模型（模型是卡片配置里的 `lightcode/GLM-FLASH-LATEST`）。
