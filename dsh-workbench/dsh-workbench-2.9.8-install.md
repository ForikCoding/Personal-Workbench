# dsh-workbench 2.9.8 安装说明

本版加一件事：**结果是一个目录的卡，真的被要求把文件写出来**。

## 为什么

一张「结果是一个目录」的卡（模板里写了 `data-dsh-files="docs/详细设计"`）跑完之后，结果 tab 一片红：

```
这次的结果 · docs/详细设计
详细设计
读不到这个目录：the path is not there
```

查下来，这次运行**一个文件都没写**：目录从没被创建，磁盘上 18:00 之后零改动，而运行记的是「完成」。子 agent 自己在推理里写着：

> Since I can't write files (sandbox is workspace-write at F:\git\ses, and pwsh fails)…

两件事凑在一起：

1. **提示词没要求写文件。** 运行的输出契约只有 `{ html }`，提示词里关于文件的那句是条件句——「If the skill also wrote a file, the region still carries the text」。写文件是加分项，交区域是义务，模型当然只交区域。
2. **它以为要先用 shell 建目录。** shell 被拒了（这个环境里要批准的命令会被自动拒），它就放弃了——其实 `write` 工具自己会建目录，根本不需要 shell。

红字本身没错，错的是「要求写文件」这句话从来没真正发出去。

## 改了什么

`skill-card-prompt.ts` 多了一段 `deliverableBlock`，只在**模板声明了目录**时出现：

- 把卡片里那个相对简写**解析成绝对路径**再给模型（`docs/详细设计` → `F:\git\ses\docs\详细设计`），跟面板后面读结果的目录是同一个；
- 明说这是硬要求：目录没有就建，每个文档一个 markdown，写进去；
- 明说**用文件工具（`write`、`edit`）**，不要用 shell，「shell 被拒不是不写文件的理由」；
- 区域仍然必交，而且两边都不是对方的替代品：区域说交了什麼，文件是那个东西本身；
- 留一个例外，但必须说出来：这次真的没有文件，就在区域里**用一句话说明为什么**——空目录配一段沉默，就算失败。

没有目录指针的模板（表格、纯文字报告都在区域里的那些）一个字都不加，不会被逼着造文件。

顺带把解析指针的那条正则从客户端挪到 `skill-card-contract.ts`（`resultPointerPath`），提示词和面板现在读的是同一个判断：**这张卡的结果是不是文件**。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常，最后那句 copy 不能省）：

```
tar -xf dsh-workbench-2.9.8.tgz -C %TEMP%\wb-stage-2.9.8
robocopy %TEMP%\wb-stage-2.9.8\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.8\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.8.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

跑那张目录型的卡，看两处：

- **工作区**：`F:\git\ses\docs\详细设计\` 下应该多出 markdown 文件；
- **结果 tab**：目录行下面列得出文件，一条一条点得开。

如果这次确实没有可交付的文件，区域里应该有一句话说明为什么——不再是空目录加一行英文报错。
