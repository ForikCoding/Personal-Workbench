# dsh-workbench 2.4.28 安装与验证

## 问题：最新两条运行记录的标题只剩任务编号

截图里第 8、9 次运行的标题是 `T202611024092-1`，往前的都是缺陷标题。不是那两次运行没产出内容，而是**两条规则各有一个洞，正好被这一批数据同时踩中**。

### 这两个 fragment 长什么样

存下来的结果不是整篇文档，而是一段表格行（模板负责套壳）：

```html
<tr>
  <td><span class="task-id">T202611024092-1</span></td>
  <td class="task-name">「开发」【东方】【交易】…</td>
  <td><span class="status-badge">待启动</span></td>
  ...
```

### 洞一：识别"这是编号不是内容"的正则不认后缀

标题取自结果的第一行，但有一条例外规则：**开头的编号要跳过**，否则同一张卡跑七次，列表就是七行同一个任务号。判定编号的正则原来是：

```
/^(?:[A-Za-z]{1,4}[-_]?)?\d{5,}$/
```

`T202610223746` 匹配（一个字母 + 12 位数字）→ 跳过 → 取到任务名，所以以前的记录都对。

`T202611024092-1` **不匹配** —— 数字后面还挂着 `-1`（子任务号）。于是这行被当成正文，编号就成了标题。

### 洞二：表格的单元格原来不算换行

文档转文本时只有 `</p> </div> </tr> …` 这些算换行，`<td>` 不算。所以一行表格读出来是一整串：

```
T202611024092-1「开发」【东方】【交易】…待启动
```

编号和任务名粘在一起，任何"整行是不是编号"的判断都失效 —— 这也是为什么只修正则还不够。

## 改了什么

1. 编号正则接受后缀：`/^(?:[A-Za-z]{1,4}[-_]?)?\d{5,}(?:[-_]\d{1,3})?$/`。四位以内不算编号（`2026-10-27` 是日期，不是编号，仍然当正文显示）。
2. 行首是编号、后面还有内容时，从编号之后读起（`IDENTIFIER_PREFIX`）—— 单元格粘在一起也能取到任务名。
3. 表格单元格算换行（`</td>`、`</th>`）：一行表格的每个格子各自成行，编号、任务名、状态不再连成一串。顺带让"按钮把本卡内容交给另一张卡"时读到的文本也按格子分段。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-2428'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.28.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 已指向 `dsh-workbench-2.4.28.tgz`。装完退出 DSH Desktop 重开，`Ctrl+F5`。

## 怎么验

1. 「我的任务」运行历史：第 9、8 次那两行的标题应变成任务名（`「开发」【东方】【交易】…`），不再是 `T202611024092-1`。
2. 往下翻：以前正常的那些行标题**不变**（还是不动的缺陷标题）—— 这次改动只影响"以前漏掉的后缀编号"和"粘在一起的表格行"。
3. 只剩编号、没有别的文字的结果，标题仍然是那个编号（没有更好的可说时，行需要有话）。

## 回归

typecheck 0；`vitest` **933 passed / 3 skipped**（51 文件通过 / 1 跳过）；build 0；`verify:artifacts` 干净。

新增断言：
- 子任务号带后缀时被跳过，标题取到表格里的任务名；
- `2026-10-27` 这种四位年份日期**不**被当编号吞掉，仍作为正文；
- 本来就只有编号的文档，标题仍是编号（原有行为保留）。

另外用真实存档跑了一遍：库里 14 条结果的标题全部落在任务名上，包括这次出问题的两条。
