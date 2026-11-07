# dsh-workbench 2.9.3 安装说明

本版修好两处：工作台记住你打开的是哪条流水线；结果卡片模板在配置页预览里不再多出一枚孤零零的图标。

## 安装

1. **完全退出 DSH Desktop**（不是关窗口，是退出程序）。
2. 把安装包解到插件目录：

```
tar -xf dsh-workbench-2.9.3.tgz -C %TEMP%\wb-stage-2.9.3
robocopy %TEMP%\wb-stage-2.9.3\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.3\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

   obocopy 返回 1 是正常的（表示有文件被复制）。最后那句 copy 不能省：package.json 只改版本号，大小不变、时间戳更旧，/MIR 会跳过它。

3. 让 profile 的 pin 指向新包：把 package.json 依赖里那行改成

```
"dsh-workbench": "file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.9.3.tgz"
```

4. 重新打开 DSH Desktop，进工作台。

## 本版改了什么

- **记住打开的流水线。** 打开一条流水线后，切去看卡片再回来、或者重开应用，回到的还是那一条。记忆里的那条被删掉时，打开最近改过的那条，不再固定打开第一条。
- **模板预览不再留空目录行。** 结果卡片模板（docs/workbench-result-template.html）的目录行默认藏起来，脚本确认有文件才放出来。