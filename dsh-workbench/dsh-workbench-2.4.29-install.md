# dsh-workbench 2.4.29 安装与验证

## 需求：卡片调用卡片时，能选这一次跑在哪个目录

一个卡片的结果里可以放按钮，按钮触发另一张卡片。以前这个调用**只能跑在目标卡片自己存的目录**里：目标卡片没配目录就拒绝，目录没了也拒绝，面板上没有第三句话可说。

可实际情况是反过来的：按钮长在「我的任务」那张卡片的结果里，用户是看着这个文件夹里的数据点的按钮，材料就在当前卡片的目录里；目标卡片上次配在哪个目录，跟这一次调用没关系。

所以这次改成：**默认用触发方（当前卡片）的目录，面板上可以改，改的只是这一次调用**。

## 改了什么

### 一条 run 请求可以自带目录

`WorkbenchRunRequest.workspace`（Host 侧契约）：可选，绝对路径。route 先校验，不是绝对路径直接 400：

```
workspace must be an absolute path when present
```

### runner 按「这次请求的目录 → 卡片自己的目录」顺序解析

- 有 `request.workspace` 就用它；没有才用卡片存的那个。都没有 → `workspace-missing`；`statDirectory` 说不是目录 → `workspace-invalid`，**报的是这次要用的那个路径**。
- 会话就 root 在这个目录上（fence 和 preset 跟着走），和以前一样，只是根换了。
- **refine 不接受覆盖**：refine 是接着原来那个会话继续改，一个会话只有一个根。

### 记录里写上「这一次在哪跑的」

`WorkbenchResultRecord.workspace`：这条结果是在哪个目录产生的。老记录没有这个字段，读的时候退回到卡片自己的目录 —— 老数据看起来和以前完全一样。

结果页头部那行（`工作目录 · D:\...`）现在优先显示记录里的目录。不然一次在 A 目录跑出来的结果，会因为在 B 目录的卡片下而被标成 B。

### 确认面板多一行「工作目录」

```
目标    卡片: 任务分析
将运行的 skill  uf30-task-analysis
工作目录  [D:\Git\Personal-Workbench          ] [应用]
          只用于这一次调用，目标卡片自己的目录不变
参数     { ... }
         确认   取消
```

- 默认值：**当前卡片**（点按钮的那张）的目录；当前卡片没配目录，才退到目标卡片的目录；两个都没有，还是老样子在点击时就拒绝，面板不弹。
- 改法：和配置页那个目录输入框是同一个组件（同一套校验、同一句拒绝文案），回车或点「应用」生效。
- 校验顺序和配置页一致：先看形状（不是绝对路径 → 就地提示），再问 Host 这个目录在不在、是不是目录（不在 → 就地提示，输入框保留原样好改）。**被拒绝的路径什么都不写**，面板还站在上一个有效目录上，这时点确认就跑在那个有效目录。
- 确认时目录随请求发出去；**不写任何卡片**。别人的按钮不是重新配置目标卡片的授权。
- 如果目录在「面板打开」和「点确认」之间被删了：Host 那道闸还在，拒绝原因里带完整路径。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-2429'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.29.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 已指向 `dsh-workbench-2.4.29.tgz`。装完退出 DSH Desktop 重开，`Ctrl+F5`。

## 怎么验

1. 打开一张有按钮的结果（比如「我的任务」），点触发了别的卡片的那个按钮。
2. 面板第三行应该是「工作目录」，框里是**当前这张卡片**的目录，不是目标卡片的（如果两张卡片配的目录不同，这一步就能看出来）。
3. 把框里的路径改成另一个存在的目录，回车或点「应用」，再点「确认」：目标卡片这次应该跑在那个目录里。
4. 回到目标卡片自己的结果页，头部那行显示的是**这次跑的目录**；目标卡片的配置页里目录**没变**。
5. 故意写个不存在的路径：面板里就地提示「目录不存在」，不启动；再改回有效目录，确认才跑。
6. 直接点「确认」不改目录：跑在当前卡片的目录里，和以前「跑在目标卡片目录」的行为不同，这是这次的需求。

## 回归

typecheck 0；`vitest` **941 passed / 3 skipped**（51 文件通过 / 1 跳过）；build 0；`verify:artifacts` 干净（CSS 内联 68,777 字符）。

新增/改动的断言：

- route：带 `D:\Git\clicker` 的 run 请求被接受，会话就 root 在那里；`clicker` 这种相对路径被 400 拒绝，且不启动子会话。
- runner：`request.workspace` 覆盖卡片存目录（会话 root 和记录都跟着走）；覆盖的目录不存在时拒绝，报的是**覆盖的那个路径**；refine 的记录目录仍是会话的根。
- 面板：默认取触发方目录而不是目标目录；输入另一个存在的目录→确认请求带它、且不写任何卡片；输入不存在的目录→就地提示、输入框保留、确认仍跑在有效目录上；目标卡片无目录且触发方也无目录时仍然点击即拒。
- 结果页：记录带 `workspace` 时头部显示它（不再显示卡片目录）；老记录（无该字段）仍显示卡片目录。
