# dsh-workbench 2.9.11 安装说明

本版修一件事：**流水线跑完了，却没有执行记录**。

## 为什么

运行记录本来就有——只是它活错了地方。

跑完一条链子，面板会照着结果拼出一条记录（第几次运行、什么时候、用了多久、每一步成没成、每一步当时交出来的那份产物），编号、插进列表、然后……**存在组件的 state 里**。刷新页面的那一刻，连这份东西一起没了。所以一条明明跑完的流水线，重新打开会回答「这条流水线还没跑过」。

原型里写得很清楚：

> 运行记录：一条记录 = 一次流水线运行，包含它当时每一步的状态与产物快照。
> 存的是快照，不是「去读现在的磁盘」——回看第 2 次运行，看到的就该是那天的文件。

它一直没被「存」下来。

## 改了什么

**记录搬到了 Host，单独一个存储域**（`workbench_pipeline_run`，和流水线定义分开：定义每次改配置都会被整体重写，记录绝不能被重写带走）。

- `GET /api/workbench/pipeline-run`：全部记录，按时间倒序。
- `POST /api/workbench/pipeline-run`：交一次执行，**编号由 Host 给**——两个窗口同时跑完同一条流水线时，「下一次是第几次」只有存的那边知道。
- 每条记录带每一步的**产物快照**（当时那段区域，最多 96k 字符），所以回看第 2 次运行看到的是那天的产物，不是今天的文件。
- 上限：每条流水线 20 次，总共 200 次，超出按最旧删。
- 面板不再自己攒记录：它**读**存储里的记录。刷新之后、换一个窗口打开，运行记录还在，画布也知道这条流水线跑过（不再退回「未整体运行」）。
- 记录没写进去时会直说：「这次运行没能存成记录：<原因>。运行本身可能已经跑完了，只是这一页记不住它。」——这是原来的 bug 最不该再悄悄发生的地方。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常）：

```
tar -xf dsh-workbench-2.9.11.tgz -C %TEMP%\wb-stage-2.9.11
robocopy %TEMP%\wb-stage-2.9.11\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.11\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.11.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

1. 跑一次（整条或单步）。
2. 点画布标题旁的「最近运行…」→ 运行记录里应该有 `#1`。
3. **刷新页面**，再点开运行记录：`#1` 还在，点进去能看到那一步当时的产物。
4. 再跑一次，是 `#2`。

## 一句话提醒

**这一版之前的运行不会被补记**：那些记录当时只存在于页面的内存里，没有落盘，现在无从恢复。记录从下一次运行开始。

## 存储位置

`%APPDATA%\dsh-desktop\harness\storages\workbench_pipeline_run\runs\`
