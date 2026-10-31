# dsh-workbench 2.4.20 安装与验证

## 这一版改了什么

**运行从「卡片页的那条输入栏」搬到卡片本身上。** 打开的卡片页不再有任何启动运行的控件，只读它的运行记录；要跑，就在工作台首页的那张卡上点。

- 卡片页顶部那条「这次要做什么？+ 运行」删掉了（连同它下面的「最近用过」胶囊），页面顶部标题栏里原来那个「运行」也删了。整页从上往下只剩：返回 / 卡名 + 技能 + 次数 + 最近时间 / 状态说明 / 运行记录。
- 每张卡片的标题右侧现在有两个按钮：`▶ 运行` 和 `设置`。点 `运行`：
  - 技能卡**不需要指令** → 直接跑，不弹窗；
  - **需要指令** → 弹「运行这张卡」弹窗（说明 + 大输入框 + 「最近用过」胶囊 + 取消 / 运行），必填时空着点「运行」会在框下红字提示，不静默发送。
- 在首页就能看到这张卡此刻的状态：点下去之后卡片的圆点变「进行中」，跑完变「成功/失败」，正文换成这次结果的第一句——不用点进卡片。
- 这张卡自己有一次运行在飞时，那个按钮原地变成 `✕ 取消`（就是停它），跑完再变回 `运行`。卡片页里运行中的那一行仍然可以单独停那一次运行。
- 卡片页空状态改成：「这张卡还没有运行过，回到卡片列表，在卡片上点「运行」跑第一次。」（原来指向左上角那个已经不存在的按钮）

弹窗与结果页的「从头跑」是同一个组件（`PromptDialog` + `RunPrompt`），只是标题不同：卡片上叫「运行这张卡」，结果页上叫「从头跑」。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-2420'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.20.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 已指向 `dsh-workbench-2.4.20.tgz`。装完**整个退出 DSH Desktop 再重开**，然后 `Ctrl+F5`。

## 怎么验

1. 回工作台首页：每张卡片标题右边是 `▶ 运行` 和 `设置` 两个灰色按钮。
2. 点一张不需要指令的卡的 `运行`：直接开跑，卡片圆点变「进行中」，按钮变 `✕ 取消`；再点它就是停。
3. 点一张需要指令的卡的 `运行`：弹「运行这张卡」，输入框有光标，空着点「运行」→ 框下红字「这个技能需要一句指令才能运行」；写一句再按 Enter 就发出去。
4. 弹窗里点「最近用过」的胶囊：只把句子填进框，不发送。
5. `Esc` 关弹窗、焦点回到刚才那个按钮；`Tab` 在弹窗里循环。
6. 点卡片进详情：顶部没有输入栏、没有运行按钮；记录列表照旧，运行中的行有自己的「停止」。
7. 没跑过的卡进详情：空状态文案指向首页卡片上的「运行」。

## 回归

`corepack yarn check` 全绿：typecheck 0 error；`vitest` 51 passed / 1 skipped（**915 passed, 3 skipped**）；build 0；`verify:artifacts` 干净（CSS 内联 67,466 字符）。

新增 `tests/CardRun.spec.tsx`（8 例：无指令直接跑、有指令弹窗、必填拒绝、胶囊回填、运行中变取消、不可跑时关闭、标题、Esc）。`SkillCardRunsPage.spec.tsx` 里整块「run bar」删掉，换成「这一页不启动任何运行」；三条原本靠页面按钮起跑的用例改成靠 mount 时的在飞运行接管。`SkillCard.spec.tsx` 未动。
