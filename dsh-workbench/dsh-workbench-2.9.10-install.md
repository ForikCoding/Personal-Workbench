# dsh-workbench 2.9.10 安装说明

本版修一件事：**跑着的时候，活动 tab 一片空白**。

## 为什么

运行中的步骤，活动 tab 只有一句「正在运行 · 跑完这里会列出它调用了什么、说了什么。」跑完了才有内容——正如这句话承诺的。

但 Host 那边其实一直在发。`WorkbenchRunState.activity` 就挂在**客户端本来就在做的轮询**上（契约里写得很清楚：*Carried on the poll the client already makes, so the running card's stream costs no transport of its own*），每次读都在带子 agent 已经做过的工具调用和模型输出。

问题是客户端读到了、然后扔了：`settleRun` 只把**终局**（settled / cancelled / failed）交给链子，中间那几十次读里的 `activity` 一个字段都没留。于是面板手上永远没有运行中的痕迹，只能等结果落盘之后从存储里读。

## 改了什么

1. **轮询不再只报结局**。`settleRun` 多了一个 `onProgress`：运行中的每一次读都把状态交出去；链子把它记在**这一步**上（`ChainStepOutcome.activity`），相位不动。
2. **面板按相位选来源**：
   - 运行中 → 用链子手上的实时痕迹（重跑一步时，不会错显上一次的旧列表）；
   - 跑完 → 用存储里的结果（那份是完整的，含最后一次读）；
   - 两者之间那一瞬 → 用链子最后看到的那份，不会闪一下「还没有活动记录」。
3. **活动 tab 的数字跟着动**：跑着也显示条数，跟列表一致。
4. **那句文案改了**：不再是「跑完这里会列出…」，而是「它还没调用工具。做了什么，会一条条出现在这里。」——只在真的还没动静时出现。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常，最后那句 copy 不能省）：

```
tar -xf dsh-workbench-2.9.10.tgz -C %TEMP%\wb-stage-2.9.10
robocopy %TEMP%\wb-stage-2.9.10\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.10\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.10.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

点「运行」，**跑起来之后**就停在活动 tab 看着：

- 一两秒内应该出现第一条（先是「模型输出」，然后是它调用过的工具，一行一行往下加）；
- 活动 tab 上的数字要跟着涨；
- 跑完之后列表不会清空，也不会变。

轮询是 1.2 秒一次，所以是「一跳一跳地长」，不是逐字打字。
