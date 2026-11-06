# dsh-workbench 2.6.5

## 这一版改了什么

**三个视觉对不上的地方，根因是令牌名写错——不是样式写错。** 你圈的「未运行」标签、空态里的加号方块、「活动 0」那一栏，样式表和原型是一字不差的（`pipeline.css` 就是从原型 `<style>` 搬来的），但它们引用的宿主变量里有两个在 DSH 里根本不存在，于是浏览器按 `unset` 处理，静默地什么都不画。

- **「未运行」标签没有灰底**：`--hover` 挂在 `-bg-fill-hover` 上，宿主没有这个令牌（`design-platform.css` 里只有 `-interactive-bg-hover`）。`background: var(--hover)` 因此失效，标签只剩一个点和三个字飘在画布头上。同一行令牌还负责**空态虚线框里那个加号方块的灰底**和各行的 hover 底色——所以内建的三处「跟原型不一样」，两处是同一个原因。
  改成 `-interactive-bg-hover`：浅色 `rgba(38,49,72,.06)`、深色 `rgba(255,255,255,.08)`，和原型 `--hover` 的两个值**逐字相同**。
- **加号笔画太淡**：原型的 `--ink3` 是 `rgb(92,97,103)`（比 `--ink2` 再深一点），插件挂在 `-label-tertiary` 上，浅色主题里那是 `rgb(129,133,140)`——比 secondary 还浅，所以方块里的「+」发灰。改成 `-label-secondary`（`rgb(97,102,107)`），差 5 个色阶。
- **选中的页签是黑的**：`--accent` 挂在 `-brand-primary` 上，宿主浅色主题里 `-brand-primary` = `rgb(15,17,21)`，近黑。原型是蓝的（`rgb(47,98,214)`）。选中的页签、下划线、运行中的分段条全吃这个值，所以整块面板「该亮的地方不亮」。改成 `-state-business-primary`（浅色 `rgb(65,118,230)`、深色 `rgb(122,170,255)`——**深色与原型精确相同**，浅色原型更暗一档，差 20 个色阶）。

| | 原型 | 现在 | 之前 |
| --- | --- | --- | --- |
| 标签底 | `rgb(242,243,244)` | `rgb(242,243,244)` | 透明 |
| 标签字 | `rgb(97,102,107)` | `rgb(97,102,107)` | 同 |
| 方块底 | `rgb(242,243,244)` | `rgb(242,243,244)` | 透明 |
| 方块笔画 | `rgb(92,97,103)` | `rgb(97,102,107)` | `rgb(129,133,140)` |
| 选中页签 | `rgb(47,98,214)` | `rgb(65,118,230)` | `rgb(15,17,21)` |
| 活动计数 | `rgb(111,116,122)` | `rgb(129,133,140)` | 同 |

计数那一格是老差距：宿主的 `-label-tertiary` 在浅色里只有 129，原型要 111，中间没有别的灰可挂，这轮没动。

顺手把 `src/client/**/*.css` 里所有 `var(--dsw-*)` 对 `design-platform.css` 过了一遍。**还有 9 处同类问题，这轮没有动**，等你说要不要一起换：

- `workbench.module.css` 6 处 `-bg-fill-hover`（`.railAction` / `.linkBtn` / `.menuBtn` 等的 hover 底色，现在都是透明的）
- `skill-card.module.css` 1 处 `-bg-fill-hover`、2 处 `-border-secondary`、1 处 `-border-primary`（宿主只有 `-border-l1..l4`；这些边框现在是画不出来的）

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-265'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.6.5.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 指向 `dsh-workbench-2.6.5.tgz`，装完**整个退出** DSH Desktop 再重开，`Ctrl+F5`。

## 怎么验（对照你圈的三处）

1. 画布头上「流水线」右边那个「未运行」**要有浅灰圆角底**（不是只有点和字）。
2. 空态虚线框里那个加号**要有浅灰圆角方块底**，笔画是深灰（不是淡灰）。
3. 检查器「活动 配置 结果」里选中的那个页签是**蓝色**，下面有蓝色下划线；空态时「活动」后面不该有 0（有记录才有数字）。
4. 顺带看：鼠标划过步骤卡、图标按钮时要有底色（同一个令牌修好的）。

## 回归

`corepack yarn workspace dsh-workbench check` 全绿：typecheck 4 份 0 错、`vitest` **1015 passed / 3 skipped**、build 0、`verify:artifacts` 干净。构建产物 `lib/client.js` 484.37 kB（CSS 内联 133637 字符）。

一个插曲：第一次跑 check 时 `tests/pipeline-handoff.spec.ts` 的「deadline」一例失败——那条用例本身要跑 2 秒级的假时钟，当时我同时在跑别的命令抢 CPU。单独重跑 15/15 通过，再跑一遍整套 check 也全绿，属负载导致的抖动，与本次改动无关。

设计文档 §9 的令牌映射表按实际值重写了一遍，并记下「令牌名写错不会报错」这条坑：`var(--x)` 里 `--x` 未定义时整条声明按 `unset` 处理，浏览器不警告、不回退。
