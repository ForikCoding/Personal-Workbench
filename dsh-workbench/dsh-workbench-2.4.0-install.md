# dsh-workbench 2.4.0 版 安装说明（运行指令）

```
dsh-workbench-2.4.0.tgz
```

**宿主（index.js）和客户端（client.js）都改了 → 需要重启 DSH Desktop，再刷新页面。**

---

## 这一版做了什么

有的 skill 需要一句话才知道「这次做什么」，有的不需要。这一版把它拆成两件事：

- **要不要**：卡片的设置（新字段「运行指令」），三选一。
- **说了什么**：属于**那一次运行**，不存成卡片的固定 prompt。

**1. 卡片多了一个设置：`instructionMode`**

| 取值 | 运行条 | 输入框留空就点「运行」 |
| --- | --- | --- |
| `none`（默认） | 不出现输入框，页头的「运行」按钮与以前完全一样 | 照常运行 |
| `optional` | 运行条里出现一个输入框，与「运行」并排 | 照常运行 |
| `required` | 同上 | **就地拒绝**：输入框下面出现一句「这个技能需要一句指令才能运行」，焦点跳到输入框，什么也不发送 |

字段缺失按 `none` 读——所有早于这一版的卡片，界面一个字都不会变。

**2. 只有一个输入框，没有弹窗，「运行」也不会因为空而变灰**

- 卡片页（结果页与运行历史页）在 `optional` / `required` 下，把「运行」从页头挪到运行条里，和输入框并排；**只有这一个**运行按钮，页头不再有第二个。
- `none` 的卡片仍然是页头那颗按钮，没有输入框。
- 输入框为空时按钮**依然可点**：点下去由输入框自己说明缺什么，而不是给一个说不出原因的灰按钮。

**3. 键盘**

- 只有一行时 `Enter` 提交；`Shift+Enter` 换行；`Ctrl`/`Cmd`+`Enter` 始终提交。
- 所以多行指令不会被第一行就误触发；中文输入法选词时的回车不会提交（`isComposing` 已挡掉）。

**4. 最近用过**

同一张卡片最近 3 条互不相同的指令，作为 chip 出现在输入框下面，点一下填回输入框（**不**直接运行）。这些 chip 由运行历史派生，不另存一份。

**5. 指令去了哪**

- 进 prompt：`<run_instruction>…</run_instruction>`，位置在 `row_data` 之后、`output_document` 之前；任务句同时从「apply to the current workspace」换成「apply to what the run instruction names」。
- 进记录：写在结果记录上（`instruction`），所以历史行能说出这一行答案是哪个问题的；运行中的那一行也有（来自运行态），因此从「运行中」变成「已完成」时文字不会跳。

**6. 服务端也校验**

- 路由：空白指令是 400（`instruction must be a non-empty string when present`），超过 2000 字符也是 400；`instructionMode` 只接受三个取值或 `null`。
- runner：`required` 的卡片自己那颗「运行」在没有指令时直接拒绝（`instruction-missing`），不会建会话、不会花一次模型调用。旧客户端、直接调接口走的是同一条路。
- **点行触发的运行不受此限**：那次点击已经指定了对象（`row_data` 就是它的指令），否则这类卡片的模板按钮会全部失效。
- 指令是**按次**的：一次运行的问法不会被存成卡片字段，所以没有「已保存指令」可编辑，也没有第二个地方要同步。

**7. 草稿**

没发出去的指令在一次会话内跨页面保留（按卡片分开，`sessionStorage`），刷新页面就清空。

## 配套的 skill 建议

- `uf30-task-analysis` 这类「必须知道分析哪个任务」的 skill：卡片设 `required`，然后每次运行只写一句「分析 T202601010001」即可。
- 只做固定动作的 skill（例如「列出仓库状态」）：保持 `none`，界面和以前完全一致。

## 门禁

- `typecheck` 0（4 个 tsconfig）
- 全量 `vitest run`：**841 通过 / 3 跳过**（新增：设置项的三态与读回、路由的形状校验与清空、`required` 的拒绝与放行、指令进 prompt 的位置与替换后的任务句、空指令按「没说过」处理、历史行文字、运行条的 `none`/`optional`/`required` 三种行为、Enter/Ctrl+Enter、chip 去重与回填）
- `build` 0、`verify:artifacts` 干净（宿主 inject 与客户端 externals 未变，没有新的运行时依赖）

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.4.0.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force
```

再把 profile 的 `package.json` 里 `dsh-workbench` 指向新的 tgz：

```
"dsh-workbench": "file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.4.0.tgz"
```

**重启 DSH Desktop**，再刷新页面。

## 验证清单

- 打开卡片配置：第六个字段是「运行指令」，默认「不需要」，下面一行小字说明它管什么。
- 选「不需要」→ 回卡片：页面和以前一样，页头一颗「运行」，没有输入框。
- 选「可选」→ 运行条出现输入框，占位符「补充一句指令，留空直接运行」；什么都不写点「运行」能跑起来。
- 写成「需要」→ 什么都不写点「运行」：不发送，输入框下方出现「这个技能需要一句指令才能运行」，光标在输入框里；写一句再点，跑起来，输入框清空。
- 跑两次不同的指令，回到运行历史：两个历史行各自显示自己那次的指令。
- 再打开运行条：输入框下面出现最近用过的 chip，点一下只填进输入框、不运行。
- 输入两行文字后直接按 `Enter`：只换行，不运行；`Ctrl+Enter` 才运行。
- 用模板按钮（点行触发的运行）在「需要」的卡片上：仍然能跑（那条路径不是卡片自己的运行按钮）。
