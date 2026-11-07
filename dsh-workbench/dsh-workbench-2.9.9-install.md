# dsh-workbench 2.9.9 安装说明

本版修一个**改了模板却看不出变化**的问题。

## 现象

模板里那个「整份文档只有一处要按你的情况改」的 `data-dsh-files`，把 `docs/详细设计` 改成 `docs/任务分析` 之后，结果 tab 的目录行还是 `docs/详细设计`，照样报「读不到这个目录」。

## 为什么

模板开头那段说明，是**用引号把这个属性念了一遍**给作者看的：

```
下面那个 data-dsh-files="docs/详细设计" —— 指向这一步真正写出文件的目录。
```

而代码是拿正则在整个文档里找**第一个** `data-dsh-files="…"`。说明文字排在真正的元素前面（第 96 个字符 vs 第 3065 个字符），所以读到的一直是**说明里的旧值**，元素上写的新值根本没被看见。

模板自己的脚本用 `querySelector('[data-dsh-files]')` 取属性——它天然不看注释，所以卡片页和结果 tab 会各说各的：页面按新目录走，面板按旧目录报错。

## 改了什么

`resultPointerPath` 先剥掉 HTML 注释再找属性（`skill-card-contract.ts`）：

- 注释里的指针是「关于这个属性的说明」，不是属性本身；
- 剥掉之后，作者改元素就能立刻生效，不用再动说明文字；
- 老结果把指针写在区域里的那种，照样读得到。

提示词和面板都走这一个函数，所以两边同时跟上。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常，最后那句 copy 不能省）：

```
tar -xf dsh-workbench-2.9.9.tgz -C %TEMP%\wb-stage-2.9.9
robocopy %TEMP%\wb-stage-2.9.9\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.9\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.9.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

模板保持 `data-dsh-files="docs/任务分析"`（说明文字里那句旧的不用改），刷新之后：

- 结果 tab 的目录行应该写着 `docs/任务分析`；
- 跑一次之后，文件应该出现在 `F:\git\ses\docs\任务分析\` 下。

顺带说明：**改了指针，旧结果也会跟着新指针走**——面板是先问模板的。旧结果的文件还在旧目录里，所以在换指针之前跑出来的那些，会显示成「读不到」。
