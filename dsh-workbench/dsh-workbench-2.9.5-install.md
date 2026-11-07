# dsh-workbench 2.9.5 安装说明

本版只修一个 bug：配置里的**运行指令**打进去了、切换一下就没了。

## 为什么丢

三处里有两处不认识这个字段：页面把这句话发出去了，Host 的请求解析没有读它（静默丢掉，还算你成功），存储的读取规则里也没有声明它（就算存进去，下一次加载也会被剥掉）。所以「写成功」和「读回来是空的」同时成立——看起来就是没保存住。

现在两处都补上：请求解析收下这句话（`null` 表示清空，空白和超长会被当成坏请求拒掉，而不是悄悄存成空），读取规则声明它，于是写入的值能原样回来。

顺带的影响：卡片自己那页的「运行指令」也是同一个字段，一起好了。

## 安装

1. **完全退出 DSH Desktop**（不是关窗口，是退出程序）。
2. 解包并覆盖：

```
tar -xf dsh-workbench-2.9.5.tgz -C %TEMP%\wb-stage-2.9.5
robocopy %TEMP%\wb-stage-2.9.5\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.5\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

robocopy 返回 1 是正常的；最后那句 copy 不能省（只改版本号的文件 `/MIR` 会跳过）。

3. profile 的 pin 指向新包：

```
"dsh-workbench": "file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.9.5.tgz"
```

4. 重新打开 DSH Desktop。

## 怎么验

进工作台 → 某一步 → 配置 → 运行指令里输入一句话 → 点「结果」再点回「配置」→ 那句话还在；退出重开也还在。

注意：这一栏的写入是**失焦时**提交的（切 tab、点别处都算失焦），打字过程中不写盘。光标还在框里时直接关掉整个应用，最后几个字不会保存。
