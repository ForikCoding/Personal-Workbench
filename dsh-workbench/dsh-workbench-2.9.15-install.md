# dsh-workbench 2.9.15 安装说明

本版修两处，是同一个症状的两个原因：**一步已经坏了，界面却写着「已完成」**。

1. 步骤是否失败，看的是「有没有产出」，而不是运行自己给的判定；
2. 运行记录**从来没有写进磁盘**（key 里的 `#` 被存储层拒绝），所以重开面板只剩第 1 条能猜。

## 为什么（一）

一次运行只要走到能写记录的地步，就会留下记录——包括那种什么都没产出、只在记录里写明原因的。
于是「有记录」只说明**发生过**，不说明**跑成了**。2.9.14 的步骤状态填的是后者：

```
const phase = chainStep?.phase ?? (result === undefined ? 'idle' : 'done')
```

真实的那条记录（`workbench_skill_card/result/skill-card-7_1794063966679.json`）：

```
stopReason : "error"
failure    : "the run ended as error: 429 {… \"code\":\"rate_limit_exceeded\" …}"
failureCode: "run-failed"
structured : （没有）           ← 没有区域，也就没有产物
pipeline   : { id: "pipeline-2", step: 1, scope: "full" }
```

这条记录说的是「失败了」。可重开面板之后链已经不在了，`stepViews` 只读「有没有记录」，
于是同一步同时显示 **✓已完成** 和 **没有产物**，画布标题「已完成」，运行条「全部完成」，
按钮是「重跑」（按下去会把第 1 步的好产物一起换掉），结果 tab 说「完成」——而卡片阅读器
说「已失败」。**唯一读对的地方，是唯一没读这条规则的地方。**

## 改了什么（一）

状态改由**记录自己的判定**决定，顺序是：判定 → 产物 → 原因。

| 记录里的情况 | 读成 |
| --- | --- |
| 没有记录 | 还没跑 |
| `failure` / `failureCode` 在 | **失败** |
| 有区域（`structured` 里有 html） | 完成 |
| `stopReason === 'completed'`（老记录没有 `failure` 字段时唯一的信号） | 完成 |
| 以上都不是 | **失败** |

不是「有没有生成文件」：一次跑完的运行可以交出空区域，那是一个**完成但没产物**的步骤，
这两件事不能混。纯函数 `phaseOfResult` 一处定义，步骤状态、画布标题、运行条、按钮、
结果 tab、活动 tab 全部跟着它走。

**标题不再替坏步骤说完成。** 任何一个步骤现在持有失败，整条就是「失败」，优先于一条
更早的「整条完成」记录——记录是当下的事实，屏幕上这条链不能在一个步骤没跑完时叫完成。

**切换器里的其他流水线**同理：带失败的记录不再算作产物（`doneCount`）。

**失败但没写原因时**，说「这次运行没有跑完，记录里没有写原因」，不再说「没有产物」——
那不是它没交东西，是它没跑完。

## 为什么（二）：运行记录从来没落盘

面板重开之后只能靠记录猜，是因为**运行历史永远是空的**。`workbench_pipeline_run` 这个
存储域连目录都没建出来。Host 日志里只有一行：

```
warn workbench: workbench pipeline run write failed: … unit 'workbench_pipeline_run':
per-record key 'pipeline-2#1' is not path-safe (must match /^[a-zA-Z0-9_-]+$/)
```

`per-record` 布局一条记录一个文件，key 就是文件名的一段。键是 `${pipelineId}#${no}`，
`#` 不在允许的字符集里，**每一次写入都被拒绝**；拒绝被当成一次可忽略的 warn，界面上什么也
没发生。于是 2.9.11 以来「运行记录」一直是空的，2.9.14 的「各步是不是一套」也从未有机会出现。

## 改了什么（二）

分隔符用**下划线**：流水线 id 是小写 slug（字母、数字、短横线），不可能含下划线，所以
`pipeline-2_1` 既落在存储层的字符集里，也不会和 `a` 的第 12 次 / `a-12` 的第 1 次撞在
一个文件上。（`templateKey` 早就是这么做的；这里是同一个教训的第二次。）

测试替身 `FakePipelineRunTable` 改成调用 `pipelineRunKey` 自己组键——以前它照抄了格式，
所以一个真实存储会拒绝的键，全部用例都能通过。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常）：

```
tar -xf dsh-workbench-2.9.15.tgz -C %TEMP%\wb-stage-2.9.15
robocopy %TEMP%\wb-stage-2.9.15\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.15\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.15.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

1. 打开「从需求到交付」（第 2 步是那条 429 的记录）：该步显示 **失败** 和那条原因；
   画布标题「失败」；运行条「1 / 2 步完成 · 第 2 步失败，后续未执行」；按钮「接着跑」；
   结果 tab 是失败说明 + 「重试这一步」。
2. 点「接着跑」：只从第 2 步开始。
3. 跑完之后打开 `harness\storages\workbench_pipeline_run\runs\`：本次运行应该落成
   `pipeline-2_1.json`（以前的写入全部失败，所以编号从 1 起）。这个目录以前根本不存在。
4. 用 ▾ →「从第 2 步起重跑」：整条完成之后，运行条应能说出各步来自两次运行
   （「整条跑完过 · 第 1 步还停在第 N 次…」）——2.9.14 加的那句话，以前因为记录没落盘从未出现过。

配套测试：`phaseOfResult` 六条（`pipeline-view.spec.ts`）、`standOf` 的失败优先两条、
页面级 `reads a reopened page from the record verdict, not from the record existing`、
`says the steps come from different runs once part of the chain was re-run`（保持通过），
以及 `pipeline-run-service.spec.ts` 的 `keeps the key path-safe…` / `cannot give two runs the same key…`。
