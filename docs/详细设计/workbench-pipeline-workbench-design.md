# 工作台：流水线编排重构设计

## 1. 为什么要重构

工作台原来只有一堆并排的卡片，每张卡片自己跑一次、自己看结果。真正的工作流是「先出方案，再按方案做，最后检查」，卡片之间要传上下文，人却只能自己记住上一步说了什么、手动把结果贴到下一张卡片的指令里。

这次把「顺序」变成一等公民：一条流水线记住一串卡片，按顺序跑，前一步的结论自动成为后一步的输入，结果仍然落回各自的卡片里。同时保留单独跑一张卡片的能力——不是每条任务都值得编排成链。

## 2. 领域模型：一个步骤就是一张卡片

流水线**不复制**卡片，只引用它的 `cardId`：

```ts
interface WorkbenchPipelineStep { readonly cardId: string }
interface WorkbenchPipeline {
  readonly id: string
  readonly name: string
  readonly steps: readonly WorkbenchPipelineStep[]
  readonly createdAt: number
}
```

这样带来三个直接结果：

1. 卡片是唯一的真相：模板、技能、模型、工作目录、结果都存在卡片里，流水线里改不动它们，也就不存在「流水线和卡片不同步」。
2. 同一条流水线里不能重复引用同一张卡片（否则两步写同一份 `structured`，后一步覆盖前一步）。
3. 步骤的顺序就是数组顺序，上移/下移/插入/移除都是数组操作。

## 3. 三区布局

一个面板，横向两栏加一条底栏，没有内部侧栏（DSH 自己的左侧栏在插件外面）：

| 区域 | 回答的问题 | 内容 |
| --- | --- | --- |
| 画布（左，280px） | 这条流水线是什么、现在在干什么 | 标题下拉菜单（流水线列表 / 新建 / 单任务 / 重命名 / 删除）、状态胶囊、最近运行、步骤节点、插入与添加、分段条 |
| 检查器（右，占满余量） | 选中的这一步产出什么、做过什么、配置成什么 | 第 N 步标题、单独运行、⋯ 菜单、技能与模型、活动 / 配置 / 结果三个页签 |
| 运行条（底部通栏） | 整条链的状态与开关 | 分段条、阶段文案、运行或停止 |

弹层全部是面板内的覆盖层（阅读器、运行记录、审核、任务选择器），不另开窗口，因为插件占的就是主面板这一列。

### 3.1 检视器复用既有页面

检查器不复制卡片页面。它读卡片自己的最新结果（`WorkbenchCardResult`：`structured`、`activity`、`failure`、`executedAt`、`editedAt`）并只呈现其中一段；要看完整正文，点「阅读」把该卡片的**结果页整块挂进面板**（`renderCard(cardId, 'result', onBack)`），读的是卡片自己的渲染路径，没有第二套渲染器。

### 3.2 尺寸与配色

画布 280px 固定、与检查器之间一条 `.5px` 分隔线；检查器自己有面板底色，与画布的白底分开。颜色全部走 DSH 令牌（`--dsw-alias-bg-base`、`-bg-layer-1/2`、`-label-primary/secondary/tertiary`、`-border-l1/l2`、`-brand-primary`、`-state-error-primary`），因此跟随 DSH 的主题切换，插件里没有第二套色板。

## 4. 流水线定义的持久化（Host 侧新增）

流水线是纯数据，存 `.workbench/pipelines.json`，与卡片的存储并列：

- `pipeline-contract.ts`：领域类型 + 校验（`parsePipelineStore`，坏数据整份丢弃并回到空态，不猜）。
- `pipeline-service.ts`：`read` / `create` / `rename` / `remove` / `setSteps`，写入走与卡片相同的原子写（临时文件 + rename），并串行化（同一进程内的写队列），避免两次点击互相覆盖。
- `pipeline-route.ts`：`GET/POST /plugins/workbench/pipelines`，POST 带 `action` 与参数，返回写入后的完整快照。

客户端 `pipeline-controller.ts` 持有快照，乐观更新 + 失败回滚（写完再 setState，以宿主的返回为准）。

## 5. 执行：客户端串行驱动，一步一次既有运行

`pipeline-run.ts` 的 `runSteps`：

1. 对第 i 步调用既有的卡片运行入口（`skill-card` 的 `run` 动作），带上会话 `sessionId`（第一步新建，之后沿用）。
2. 轮询该卡片的运行状态，直到这次运行的 `runId` 不再是进行中；超过 `MISS_LIMIT=3` 次连续查不到就认为该次运行已结束（卡片自己会给出终态）。
3. 成功则把产物摘要交给下一步，继续；失败或用户停止则停在当前步，后面的步骤标记 `stopped`。

链状态（`PipelineChain`）是纯客户端结构：`pipelineId`、`steps[i].phase`（`idle|queued|running|done|failed|stopped`）、`activeIndex`、`failureIndex`、`startedAt`、`endedAt`、`phase`（`running|settled|failed|stopped`）。页面卸载时 `abort`，不留下孤儿轮询。

### 5.1 上下文传递 = 一条链一个会话

一步接一步跑，共用同一个会话，模型看到的是连续对话，而不是每次都从零开始解释背景。单步重跑（`runOne`）另开会话，因为它不该污染整链的上下文。

### 5.2 交接单落盘（会话没了之后的兜底）

`.workbench/handoff/<pipelineId>/<step>.md`：每步开始时写入「上游交接单」（前一步的产物摘要、路径、这条流水线的步骤清单），提示词里指向它。会话是易失的，磁盘上的交接单不是。

## 6. 失败与中断

- 失败即停：失败的步骤保留 `failure` 文案（结果面板与节点脚注都显示同一句），后续步骤不再执行。
- 停止：用户可以中途停止，已完成的步骤保留结果，未跑的标记 `stopped`。
- 刷新页面：链状态丢失（只在内存），但每一步的产物还在卡片里，画布按「有结果 = 已完成」呈现，不会假装什么都没发生。

## 7. 已知缺口（本次未做，需后续补齐）

1. 模板的「预览」在配置页只画出区域占位，不渲染完整文档（完整渲染需要沙箱与脚本桥，阅读器里有，配置页的缩略预览没有）。
2. 运行记录不落盘，刷新即失（原型同样如此）。
3. 重跑会把卡片的 `structured` 覆盖成新产物；历史快照只在会话内可见。

## 8. 涉及文件

宿主侧：`src/pipeline-contract.ts`、`src/pipeline-service.ts`、`src/pipeline-route.ts`、`src/index.ts`（注册路由与服务）、`src/client/pipeline-controller.ts`、`src/client/pipeline-client.ts`。

客户端：`src/client/WorkbenchPipeline.tsx`（两栏 + 弹层）、`src/client/pipeline/pipeline-run.ts`（链执行）、`src/client/pipeline/pipeline-view.ts`（状态与产物的读法）、`src/client/pipeline.css`（原型样式 + DSH 令牌）、`src/client/pipeline-classes.ts`（类名常量）。

测试：`pipeline-contract.spec.ts`(11)、`pipeline-service.spec.ts`(12)、`pipeline-route.spec.ts`(11)、`pipeline-run.spec.ts`(9)、`pipeline-handoff.spec.ts`(15)、`skill-card-prompt-handoff.spec.ts`(4)、`skill-card-route.spec.ts` 追加 4 条步骤模式、`skill-card-runner.spec.ts` 追加 6 条 `pipeline steps`、`WorkbenchPage.spec.tsx` 17 条（画布、检查器、弹层、运行）。

## 9. v2 工作台界面落地（本轮）

原型 `docs/prototypes/workbench-pipeline-v2.html` 是这一轮的规格书，实现方式改成**逐条移植**，不再「照着感觉重画」：

- 结构：`.panel` → `.panelBody` → `.pipelineView` → `.panes`（`.canvas` + `.inspector`）+ `.runbar`，四个弹层（`.zoomWrap` / `.histBody` / `.reviewWrap` / `.pickerWrap`）都是 `.panel` 的子节点。原型里**没有左侧轨道**：流水线列表、单任务列表、新建/重命名/删除全在标题菜单（`#canvasMenu`）里，插件照此执行，轨道已删除。
- 样式：`src/client/pipeline.css` 由原型的 `<style>` 整段搬来（选择器、数值、间距、圆角、阴影都不动），只做三处改写：①原型写在 `body[data-theme]` 上的两套固定色板换成 DSH 令牌（见下）；②原型页面的 demo 外壳（`.protoBar`、`.app`、`body`、`html`）删掉，`*{box-sizing}` 与 `[hidden]` 两条全局规则收到 `.wb-root` 上；③类名统一加 `wb-` 前缀。
- **类名是字面量，不经过 CSS Modules 哈希**：`pipeline-classes.ts` 导出一个 `{ canvasHead: 'wb-canvasHead', … }` 的常量对象，组件照旧写 `css.canvasHead`，但 DOM 里出现的就是 `.wb-canvasHead`，和样式表里的选择器一字不差。这么做是因为插件的样式与宿主同处一张表：哈希名一旦与样式表里的名字失配（换了构建、浏览器缓存了旧样式表、或样式被打包成独立文件而版本没对齐），元素会带着一个没人应答的类名渲染——**静默地少掉 padding、少掉高度**，控制台里一个字都没有，只能靠截图反推。字面量名让这种失配不可能发生，代价是要自己维护前缀命名空间。
- 令牌映射：`--base`/`--pane`/`--card-bg`→`--dsw-alias-bg-base`（原型里这三者同为白，两栏之间只靠一条竖线分界，不要给检查器垫底灰）；`--hover`→`-bg-fill-hover`；`--ink/2/3/4`→`-label-primary/secondary/tertiary/tertiary`；`--accent`→`-brand-primary`；`--danger`→`-state-error-primary`；`--primary-bg`→`-label-primary`；`--primary-ink`→`-bg-base`。**浅色主题下 `-border-l1` 只有约 2% 的黑（`#f5f5f5`），等于没有线**，所以 `--hairline`（10% 墨）`--divider`（8%）`--idle`（17%）`--scroll`（14%）`--recess`/`--rail`（3%）一律用 `color-mix(in srgb, var(--dsw-alias-label-primary) N%, transparent)` 按原型的 `rgba(0,0,0,.1)`、`.08`、`#d4d4d4`、`#dcdcdc`、`#f9fafb` 复刻浓度；深浅主题自动成立，不再依赖宿主的边框令牌取值。`--success`/`--warn` 与阴影保留原值（DSH 没有同义令牌）。
- 页面框架：面板自己画头（`.panelHead`：工作台 + 新建流水线 + 运行，58px，`.5px` 下边线），`.pagePipeline` 只保留一行 `minmax(0,1fr)` 的栅格且不留内边距，保证面板拿到确定高度、`.runbar` 不会被挤出可视区；页面头（`h1` + 副标题）只在卡片页出现，流水线面板不再重复一个标题。
- 断点用容器查询（`@container panel`），因为面板宽度 ≠ 视口宽度：≥1200 画布 312、900–1199 画布 280、700–899 画布 248、<700 切横向步骤条并把面板头压到 52px。

| 区域 | 实现 | 数据来源 |
| --- | --- | --- |
| 画布头 | 标题按钮（展开 `canvasMenu`）+ 状态胶囊 + `canvasMeta`→运行记录 | 会话内的运行历史 |
| `canvasMenu` | 流水线列表、新建流水线、单任务列表（点一行切开该卡片）、新建单任务、重命名、删除（二次确认） | `pipeline-controller`、`layout-store` 的卡片事实 |
| 节点 | 序号、名称、状态图标+文案、耗时、出血的 `.nodeFoot`（产物摘要 / 失败原因 / `#run`） | 链状态 + 卡片最新结果的 `structured.html` |
| 连接件 | 步骤之间 `+` 插入、末尾「添加步骤」 | — |
| 运行条 | `.segBar` 分段条、阶段文案（未运行/第 N 步/失败即停已完成/全部完成）、运行或停止 | `PipelineRunFace` |
| 检查器头 | `第 N 步 / 共 M 步 · 名称`、单独运行、⋯ 菜单（上移/下移/移除 + 「产物一起消失」提示）、技能/模型/状态、`.inspTab` 三个页签（`aria-selected` 驱动样式）与活动条数 | 同上 |
| 活动 | 卡片最新结果的 `activity`：工具调用与模型输出；运行中/失败/空态 | `WorkbenchActivityEntry` |
| 配置 | 整条流水线（模型/权限/工作目录）+ 这一步（技能/失败处理）+ 模板（预览含区域占位 / 源码）+ 「编辑模板与设置」 | `WorkbenchCardConfigView` |
| 结果 | 状态四态（运行中/等待/失败/未运行）+ 「这次的结果」一行 + 手工修改提示 + 重新生成入口 | `WorkbenchCardResult` |
| 阅读器 | `.zoomWrap` 整块面板挂载该卡片的完整结果页（唯一读正文的地方），头上有「重新生成」与关闭 | 既有 `renderCard` |
| 审核 | `.reviewWrap`：一句话要求 + 三个常用提示片，确认后调 `run.refine` 重新跑这一步 | `PipelineRunFace.refine` |
| 运行记录 | `.histBody`：本次会话内的运行列表 + 单次运行的分步明细，点一行进阅读器 | `pipeline-run` 的 `history` |
| 任务选择器 | `.pickerWrap`：新建/插入两种位置、搜索、已在流水线里的行禁用 | 卡片事实 + `setSteps` |

运行历史按会话保存在客户端（原型同样如此：刷新即失），每条流水线保留最近 20 次；快照取自每次结束时的 `structured.html`，因此历史里的产物不受之后重跑影响。

### 9.1 怎么核对「像不像原型」

插件的样式最终要落在宿主的真实 DOM 里，而宿主只肯给一张截图。这一轮把核对方式从「对着截图反推」换成「自己把页面渲染出来」：

1. 一个临时 vitest 用例把真实组件挂到 jsdom 上，用桩 props 喂出目标状态，`document.body.innerHTML` 去掉哈希后写到磁盘（`surface.html`）；
2. 把 `pipeline.css`、`workbench.module.css` 原文 + 一份 DSH 令牌桩（`-bg-base`/`-label-primary` 等按主题实际取值）拼成一页 `index.html`，用宿主列的形状（一个定高的 flex 列）把它包住；
3. `chrome --headless --screenshot` 出图直接看，`chrome --headless --dump-dom` 加一段 `getBoundingClientRect()` 脚本读盒子（`.panel`/`.panelHead`/`.panes`/`.canvas`/`.runbar` 的 x/y/w/h 与 padding）；
4. 同一页在几个断点宽度下各跑一遍，就能看出哪条规则没生效，不用等下一张截图。

结论：`WorkbenchPipeline` 的 DOM 与 `pipeline.css` 在真实 Chrome 里渲染出的盒子与原型一致（面板头 58、画布 312、运行条 46 且始终在可视区内）。所以此后面板「看起来少了几条 padding / 少了运行条」这类现象，先怀疑类名或样式表有没有加载，而不是再改数值。

已知缺口（沿用 §7 并新增两条）：

1. 模板的「预览」只画出区域占位，不渲染完整文档（真渲染需要宿主侧的沙箱与脚本桥，插件的阅读器已提供，配置页的缩略预览没有）。
2. 运行记录不落盘，刷新即失。
3. `tests/WorkbenchPage.spec.tsx` 里「外部打开卡片」一例被移除：假传输的 `poll` 立即返回 settled 时，卡片控制器会忙等，与工作台无关；补该用例需要给控制器换一套可控的 poll 时序。
