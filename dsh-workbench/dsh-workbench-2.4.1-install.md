# dsh-workbench 2.4.1 版 安装说明（修 2.4.0 的运行条不出现）

```
dsh-workbench-2.4.1.tgz
```

**客户端（client.js）改了 → 需要重启 DSH Desktop，再刷新页面。**（宿主 index.js 未变，但一起重启最省事。）

---

## 2.4.0 的问题

现象：卡片设成「必须」以后，页面上**只有页头那颗「运行」，没有输入框**；点它报

> 这张卡需要一句指令才能运行 · this card requires an instruction before it can run

原因：客户端的快照解析（`src/client/skill-card/api.ts`）按白名单重建每张卡片的字段，白名单里漏了 `instructionMode`。于是客户端认为所有卡片都是「不需要」，画出页头按钮、不画运行条；而宿主读的是存储里的真实值，照规则拒绝。两边看的是同一份数据，却各自算出了相反的结论。

修法是把这个字段读进来（值不认识就整条拒绝，和权限字段的处理一致）。顺带确认结果记录里的 `instruction` 也会穿过同一条解析路径，历史行的文字不会丢。

## 门禁

- `typecheck` 0
- 全量 `vitest run`：**845 通过 / 3 跳过**（新增三条：卡片带 `instructionMode` 读得回、值不认识整条拒绝、结果记录带 `instruction` 读得回）
- `build` 0、`verify:artifacts` 干净

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.4.1.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force
```

profile 的 `package.json` 指向新包：

```
"dsh-workbench": "file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.4.1.tgz"
```

**重启 DSH Desktop**，再刷新页面。

## 验证

- 「任务分析」卡片 → 运行历史页：页头不再有「运行」，输入框就在标题下面，占位符是「这个技能需要一句指令才能运行」。
- 什么都不写点「运行」：不发送，输入框下方出现同一句话，光标在框里。
- 写「分析 T202601010001」再点：开始运行，输入框清空；历史行显示这条指令。
- 配置页的「运行指令」下拉现在与卡片实际行为一致（`不需要`/`可选`/`必须`）。
