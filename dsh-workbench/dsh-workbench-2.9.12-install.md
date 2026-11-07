# dsh-workbench 2.9.12 安装说明

本版修一处显示：**运行中的步骤不该带运行标签**。

## 问题

节点脚注右边那枚小标签（`#4` / `单步 #3` / `单步`）说的是「屏幕上这份产物是哪一次运行做出来的」。但它是按产物算的，不是按这一次运行算的：

```
runScope: producing?.scope ?? keptScope
runNo:    producing?.no
```

`keptScope` 来自**当前还摆在屏幕上的那份旧结果**。于是整条流水线正在跑、这一步正「运行中」时，脚注仍然挂着上一份产物的来历——那一步以前单独跑过，就写成「单步」。字面没说错，但它出现在正在跑的节点上，只能被读成「这次是单步跑的」。这是错的。

原型里脚注是分相位造出来的，运行中那一支**根本没有运行标签**：

```js
} else if (running) {
  foot = `<span class="nodeProg"><i></i></span><span>${summary}</span>`   // 只有进度条 + 摘要
}
```

## 改了什么

运行标签只在**这一步已经交出产物的相位**（`done`）下渲染：

- 运行中 / 排队中 / 失败 / 被停：脚注只有进度条和当时那句话，不再出现 `单步` 或 `#N`；
- 这一次跑完：标签回来，写的是**这一次**（整条链第 N 次，`#N`）；
- 单独运行某一步后：仍是 `单步 #N`，语义不变。

顺带修掉同一处的另一个谎：产物是整条链跑出来的、但那次运行没有记录可查（编号不知道）时，以前会掉进 `单步` 这一档。现在这种情况不画标签——不知道第几次就不编一个。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常）：

```
tar -xf dsh-workbench-2.9.12.tgz -C %TEMP%\wb-stage-2.9.12
robocopy %TEMP%\wb-stage-2.9.12\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.12\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.12.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

1. 点「运行」跑整条链：跑动的那一步脚注只有进度条 +「正在生成…」，**没有**「单步」。
2. 它跑完：脚注出现 `#1`（这一次）。
3. 单独跑某一步（步骤上的「单独运行」）：跑完脚注是 `单步 #N`。

配套测试：`carries the run badge only on a step that has a product`——先让一步带着「单步」产物进入运行中，断言节点上没有运行标签；settle 之后断言标签变成 `#1`。
