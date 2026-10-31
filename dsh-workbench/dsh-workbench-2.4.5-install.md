# dsh-workbench 2.4.5 版 安装说明（卡片网格的视觉改版）

```
dsh-workbench-2.4.5.tgz
```

**客户端（client.js）改了 → 必须重启 DSH Desktop，再刷新页面。**

---

## 改了什么

原来的网格是三个等大的空盒子：标题、skill 名、右上角一个「配置」，中间大片空白；
「创建卡片」那块因为宽度塌陷变成了一条 96px 宽的瘦高条。这一版把卡面做成**索引条目**，
让一眼就能回答三个问题：这是哪张卡、它跑得怎么样、上次说了什么。

### 1. 卡面有了自己的标记

每张卡左上角一个 28×28 的圆角色块，里面是卡片名字的第一个字（`任` / `我` / `详`）。
色相由**卡片 id** 决定（不是名字），所以改名不变色——颜色是"在读到标题之前就认出它"的东西。
颜色用 `color-mix()` 从一个色相调出来，浅色和深色主题共用一套，不额外加 token。

### 2. 名字和事实分成两行

- 第一行：标记 + 标题 + 卡片自己的控件（`配置`）
- 第二行（元信息）：skill `chip` + 状态点 + 状态文字（`09:08` / `尚未运行` / `2026-10-30 21:31`）

以前状态文字挤在标题行里，长标题会把控件推走；现在标题独占整行，事实在网格里横向对齐。
状态点用的是宿主的 `StateDot`：**运行中** `进行中`、**最近一次成功** 绿点+时间、
**最近一次失败/超时** 红点、**从未运行** 灰点+`尚未运行`。

### 3. 卡面正文不再空白

正文显示**最近一次运行真正产出的第一行**（复用结果页历史行同一个 `resultHeadline`：
先看 `data-dsh-summary`，再看首个标题，再取第一行非纯编号的文字），最多两行、超出省略。
没有运行时显示「点「运行」让这个 skill 执行一次。」；有运行时底部一行「共 N 次运行」，
用 `margin-top:auto` 钉在卡片底边，所以整个网格的这行文字在一条线上。

`resultHeadline` 的解析用 `useMemo` 按结果对象缓存：卡面会跟着运行状态轮询重渲染，
不能每次轮询都重建一次 DOM。

### 4. 「配置」从裸文字变成一颗安静的药丸

浅灰底（`color-mix(标签色 5%)`）+ 6px 圆角 + 12px 字号，hover 提亮。
不用 `--dsw-alias-bg-layer-2` 上色：浅色主题里那个 token 和卡片一样是纯白，填上去等于没边。

### 5. 修掉「创建卡片」的宽度塌陷

`.cell` 原来只有 `display:grid`，隐式轨道按内容尺寸算，于是那块"＋创建卡片"被压成
96px 宽的瘦高条，和旁边的卡完全不对齐。现在轨道写死：

```css
.cell { grid-template-columns: minmax(0, 1fr); }
```

顺带把它的 `＋` 做成和卡面标记同尺寸的 28×28 方块，`min-height` 与卡片一致（168px），
hover 时描边变实线、整块上浮 1px——它读起来是"卡片从这里来"，而不是"一个没加载出来的框"。

### 6. 卡片不再撑高

`min-height` 从 180px 降到 168px。卡面现在有内容了，不需要用高度换存在感。

## 门禁

- `typecheck` 0
- 全量 `vitest run`：**864 通过 / 3 跳过**（新增 7 条：卡面标记取首字符与色相稳定、
  标记对读屏隐藏、标题与事实分两行、卡面状态判定四条）
- `build` 0、`verify:artifacts` 干净

## 安装

```powershell
$profile = "$env:DSH_HOME\profiles\$env:DSH_PROFILE"
$target  = Join-Path $profile 'node_modules\dsh-workbench'
$tmp = Join-Path $env:TEMP ('wb-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
tar -xzf .\dsh-workbench-2.4.5.tgz -C $tmp
Copy-Item (Join-Path $tmp 'package\*') $target -Recurse -Force
Remove-Item $tmp -Recurse -Force
```

**重启 DSH Desktop**，再 `Ctrl+F5`。

## 验证

1. 工作台首页：三张卡各有一个彩色首字方块；标题下是 skill chip + 状态点；
   卡片中间的空白变成最近一次运行的第一行文字；有运行记录的卡底部有「共 N 次运行」。
2. 「任务分析」那张应该显示绿点和上次完成时间；「我的任务」那张显示灰点 +
   「尚未运行」+ 邀请语（它还没跑过）。
3. 「创建卡片」变成和卡片同宽同高的一块，`＋` 在一个浅灰小方块里，hover 有反应。
4. 点卡片仍进运行记录；点「配置」仍进配置页；hover 卡片上浮。

> 这些值都是真实样式表（`card.module.css` / `workbench.module.css` /
`skill-card.module.css`）渲染出来的；主题 token 取的是 `design-platform.css` 里
浅色主题的实际值，所以间距、字号、颜色与装上去看到的一致。
