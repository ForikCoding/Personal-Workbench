# dsh-workbench 2.9.4 安装说明

本版把「结果」tab 里那个「3 个文件」变成了真的文件清单：一行一个文件、带大小，点哪个就打开哪个。

## 安装

1. **完全退出 DSH Desktop**（不是关窗口，是退出程序）。
2. 把安装包解到插件目录：

```
tar -xf dsh-workbench-2.9.4.tgz -C %TEMP%\wb-stage-2.9.4
robocopy %TEMP%\wb-stage-2.9.4\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.4\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

robocopy 返回 1 是正常的（表示有文件被复制）。最后那句 copy 不能省：package.json 只改版本号，大小不变、时间戳更旧，/MIR 会跳过它。

3. 让 profile 的 pin 指向新包：把 package.json 依赖里那行改成

```
"dsh-workbench": "file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.9.4.tgz"
```

4. 重新打开 DSH Desktop，进工作台。

## 本版改了什么

- **结果 tab 列文件。** 卡片模板里写了 `data-dsh-files`（结果是一个目录）的步骤，「结果」tab 现在就按目录里的文件列：一行一个文件、文件名后面跟大小，子目录不占行。列不出来的时候，那一行退回原来的目录行，并在下面说清为什么读不到——不再让「没列出来」看起来像「目录是空的」。
- **点哪一行，读哪个文件。** 点文件那一行，阅读器照旧打开这张卡片的结果视图，同时把文件路径交给模板的脚本（`dsh.openFile`）。模板照 `docs/workbench-result-template.html` 里那段改过的 `open()` 就会直接打开那个文件；模板不理这个字段也不会坏，只是仍然打开它自己默认的第一个。

给已经在用那份结果模板的人：把模板里 `open(docs[0]);   // 没有点击时默认打开第一个` 那一行换成

```js
var wanted = dsh.openFile;
var first = docs[0];
if (wanted) {
  for (var i = 0; i < docs.length; i++) {
    if (docs[i].path === wanted || docs[i].name === wanted) { first = docs[i]; break; }
  }
}
open(first);
```
