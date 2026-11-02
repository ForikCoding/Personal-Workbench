# dsh-workbench 2.4.26 安装与验证

## 上一版为什么会「目录选择不了」

2.4.25 的弹窗里那行字是 `这个环境没有目录选择器，无法选择工作目录` —— 它说的是实情：这个页面确实没有任何目录选择器可用。

选择器只有两个来源，两个都没有：

1. **Windows 原生选择器**，由 `dsh-plugin-desktop` 的客户端插件在窗口上挂 `__DSH_DESKTOP_PICK_DIRECTORY__`，只在 `platform === 'win32'` 时挂。而正在用的 profile（`profiles/web`）的 bundles 是：

   ```
   @deepseek-ai/dsh-base
   @deepseek-ai/dsh-web-app
   dsh-workbench
   ```

   **没有 `dsh-plugin-desktop`**，所以那个函数从来没被挂上过。
2. **上游 workspace UI 的 `pickDirectory()`**（`uiWorkspace` 服务）。它在这个 web 组合里也没被注入，`ctx.inject(['uiWorkspace'])` 的回调永远不会跑。

于是 `canChooseWorkspace === false`，`选择目录` 灰着，下面那行字就是在解释这件事。同一个原因也解释了为什么配置页的「选择目录」一样点不动 —— 这不是 2.4.25 引入的，只是那一版第一次把选择器摆到必经路径上。

顺带：2.4.25 之前这个字段一直是只读的，从来没人需要点它，所以问题一直没暴露。

## 这一版怎么解决

**没有选择器时，改成填路径 —— 而且不破坏原来那条规矩。**

原来拒绝文本框的理由是「打字的路径是没人确认过的目录」。现在确认这件事交给 Host：`GET directory?path=…` 本来就在（运行前判断目录还在不在，用的就是它），它对任意绝对路径都回答 `exists / isDirectory / writable`。所以流程是：

1. 在输入框里填完整路径，回车（或点 `使用这个目录`）；
2. 先过规则检查（必须是绝对路径），不通过就地说「这不是一个完整的路径，得从盘符开始」，**不发请求、不写入**；
3. 再拿 Host 的回答确认它是个目录；不是就地说「这个目录不存在，或者不是文件夹」，**不写入**，卡片保持原来的目录；
4. 确认通过才存进卡片配置（走的是选择器同一条写入路径）。

也就是说：**只有当 Host 确认那里有目录时，才写**。规矩没变，变的是确认方式 —— 从"只能由选择器确认"变成"由 Host 的实际存在性确认"。

另外，这个字段现在是**同一份组件**（`WorkspaceField.tsx`），运行弹窗和配置页共用。所以在任何一屏都能改目录，两屏不会给出不同的答案。

有选择器时行为完全不变：仍然是一个值 + `选择目录` 按钮。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-2426'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.26.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 已指向 `dsh-workbench-2.4.26.tgz`。装完**整个退出 DSH Desktop 再重开**，`Ctrl+F5`。

## 怎么验

1. 点任意一张卡的 `运行`：弹窗里 `工作目录` 那行现在是**输入框**，里面是卡片当前的目录，右边是 `使用这个目录`，下面一行小字说明这个环境没有选择器。
2. 直接点 `运行`：照旧用当前目录跑（无需改动）。
3. 把路径改成 `D:\Git\deepseek-harness`（或任何存在的目录），回车 → 那句"目录不存在"消失，`运行` 从灰变亮，可以跑。
4. 填一个不存在的路径，回车 → 出现「这个目录不存在，或者不是文件夹」，`运行` 仍然灰着，卡片配置没被改（回到 `配置` 页看，目录还是原来的）。
5. 填一个相对路径（`repo`）→ 立刻提示「这不是一个完整的路径，得从盘符开始」，不发请求。
6. 配置页的 `工作目录` 字段行为一致。

## 回归

`corepack yarn check` 全绿：typecheck 0；`vitest` 51 passed / 1 skipped（**931 passed, 3 skipped**）；build 0；`verify:artifacts` 干净（CSS 内联 68,443 字符）。

新增断言：

- 配置页：填路径 → Host 确认 → 只写一次、且去掉首尾空格；Host 说不是目录 → 一个字都不写、句子出现在字段下；相对路径 → 不请求、直接提示。
- 弹窗：没有选择器时不再给一个按不动的按钮，而是给输入框；回车会用输入值调 `setWorkspace`（不直接发运行）；两种拒绝理由各自有句子，`运行` 保持灰。
- 配置页"选择器失败 → 降级"那条改成断言输入框出现；设置页那条从"不给文本框"改成"给文本框且初值是卡片当前目录"。

## 还没做

- 真正的目录浏览（列出盘符和子目录供点选）。要做的话需要在 Host 加一个只读的列表接口，比填路径大一档，先看这个够不够用。
- 模板里声明的 action 按钮起跑时仍不问目录（2.4.25 就记着的边界）。
