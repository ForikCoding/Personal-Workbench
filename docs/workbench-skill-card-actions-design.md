# 工作台技能卡 · 按钮触发执行 · 详细设计

**状态：⏳ 设计完成，未实现。** 本文描述的每一处行为都**不存在于源码**。对应的需求见
[工作台卡片需求方案 · §12](workbench-card-requirements.md)（决策 B1–B14、FR-14～FR-23）与验收标准 **17–34**。

已实现的行为仍由[工作台技能卡详细设计](workbench-skill-card-detailed-design.md)负责，本文只在交接处引用它，不重述。

---

## 怎么读这份文档

每个模块四段：**情境 S**（为什么有这块）→ **任务 T**（它要回答什么）→ **行动 A**（怎么做，含代码形状）→ **结果 R**（做完是什么样）。

标 **⚠️ 实现前必须验证** 的地方是**我无法从现有代码断定**的接缝问题，不是设计假设。它们没有结论之前，对应模块不能开工。

---

## 全景：一次点击发生了什么

```
用户点按钮（在影子树内）
  │
  ├─ 点击是组合事件，穿出影子边界；event.target 被重定向为宿主
  │   → M3 从 composedPath() 取真实按钮，向上找 [data-dsh-action]
  │
  ├─ 读 data-dsh-action（键）与 data-dsh-row（整行原始字段 JSON）
  │   → M2 解析载荷：转义、体积、JSON 合法性；任一失败即拒绝
  │
  ├─ 用键查模板里的动作声明
  │   → M1 未声明的键 = 报错，不执行
  │
  ├─ 按目标类型做存在性检查
  │   → M4 卡片：按名称找，缺失列候选，重名报错
  │            skill：按名称找，缺失列已安装清单
  │
  ├─ 占用检查
  │   → 本卡运行中：按钮本就不可点
  │           目标卡运行中：立即报错，不排队
  │
  ├─ 就地确认面板（取代卡片显示区）
  │   → M5 四项内容；参数全文，不截断不折叠；取消 = 无任何副作用
  │
  └─ 按目标类型执行
       ├─ 卡片 → M6 跳转到该卡 + 立即运行 + 结果存入该卡
       └─ skill → M7 当前会话轻量运行：无文档、无契约、只报成败、不落盘
```

---

## 模块索引

| 模块 | 一句话 | 落在哪 |
|---|---|---|
| M1 | 模板里的动作声明与保存期校验 | `skill-card-contract.ts`、`template.ts` |
| M2 | 按钮携带的键与载荷，及其解析规则 | `render.ts`、`skill-card-contract.ts` |
| M3 | 影子树内的点击委托 | `ShadowHtml.tsx` |
| M4 | 目标解析与存在性检查 | 新 `actions.ts`（客户端） |
| M5 | 就地确认面板 | `SkillCardPages.tsx`、`controller.ts` |
| M6 | 卡片目标：跳转 + 运行 + 存储 | `WorkbenchPage.tsx`、`index.ts` |
| M7 | skill 目标：轻量运行 | `skill-card-runner.ts`、`skill-card-prompt.ts` |
| M8 | 动作属性的封闭白名单 | `policy.ts`、`template.ts` |

---

## 开工前必须知道的四个事实

| 事实 | 出处 | 意义 |
|---|---|---|
| `data-*` **不在**清洗黑名单 | `policy.ts` 的 `forbiddenAttributeReason` 只拒 `on*`、危险 URL、带外链的 `style` | 按钮能携带动作声明而不被删掉。**这是本功能的前提** |
| `click` 是组合事件，但 `event.target` 被重定向为影子宿主 | 平台行为 | 必须用 `composedPath()` 取真实按钮；读 `event.target` 只会拿到宿主 `div` |
| 区间**每次运行重新生成** | 现有区间语言 | 绑定**必须**是事件委托；逐按钮 `addEventListener` 在第一次重跑后即失效 |
| 同一元素上的重复属性会被解析器去重 | HTML 解析规则 | "一个按钮两个 `data-dsh-action`"**无法表达**：解析器只保留第一个。验收 18 的检查点是"按钮上没有第二个目标"，而不是"报错" |

---

## M1 动作声明（模板侧）

### 情境 S

目标必须由**用户**决定，不能由模型决定。模型的输入里有远端工具返回的数据，如果目标名也能由模型写，那"远端数据 → 目标 → 执行"就是一条自动提权路径。所以目标写在模板里，模型只**引用**。

声明还必须放在**区间之外**：区间每次运行会被模型整体重写，放里面第一次运行就没了。

### 任务 T

给用户一个可写、可校验、不可被模型改动的目标声明机制，并决定它在保存时怎么被拒。

### 行动 A

**语法**：模板文档里的一个注释块，位于区间之外。

```html
<!-- dsh-actions
  start:  card  "启动任务"
  finish: skill "task-finish"
-->
```

- 每行一条：`键: card "名称"` 或 `键: skill "名称"`
- 缩进与冒号后的空白宽松处理；空行与 `#` 起头的行忽略
- 块的起止由 `<!-- dsh-actions` 与后续 `-->` 界定

**契约常量**（`skill-card-contract.ts`）：

```ts
/** 动作声明块的起始标记。 */
export const WORKBENCH_ACTIONS_MARKER = 'dsh-actions'

/** 动作键文法：与 MCP 服务名同一形状，避免不可见的字符差异。 */
export const WORKBENCH_ACTION_KEY_PATTERN = /^[A-Za-z0-9_-]{1,32}$/

/** 目标类型。 */
export type WorkbenchActionTarget =
  | { readonly kind: 'card'; readonly name: string }
  | { readonly kind: 'skill'; readonly name: string }

/** 一条已解析的动作声明。 */
export interface WorkbenchActionDeclaration {
  readonly key: string
  readonly target: WorkbenchActionTarget
}

/** 载荷属性的体积上限，默认 8 KiB，与模板/请求体/结果上限同一套配置机制。 */
export const WORKBENCH_ACTION_PAYLOAD_MAX_BYTES = 8 * 1024
```

**解析出的结构**挂在模板分析结果上：

```ts
export interface WorkbenchTemplateAnalysis {
  readonly region: WorkbenchTemplateRegion | undefined
  /** 已声明的动作，按声明顺序；键唯一。 */
  readonly actions: readonly WorkbenchActionDeclaration[]
  readonly violations: readonly WorkbenchTemplateViolation[]
}
```

**新增违规码**（并入 `WorkbenchTemplateViolationCode`）：

| 码 | 何时 |
|---|---|
| `action-declaration-missing` | 区间里有 `data-dsh-action`，模板却没有任何声明块 |
| `action-declaration-duplicate` | 声明块出现两次以上 |
| `action-key-invalid` | 键不满足 `WORKBENCH_ACTION_KEY_PATTERN` |
| `action-key-repeated` | 同一个键声明了两次 |
| `action-target-invalid` | 类型不是 `card`/`skill`，或名称为空，或名称超长 |
| `actions-inside-region` | 声明块落在区间内——**它会在第一次运行时被覆盖掉** |

**校验时机**：与现有违规一致，**保存前**在编辑器就地报错，**运行前**再拦一次。

### 结果 R

- 用户写一次声明，所有按钮引用它
- 模型看到的文档里包含这段声明，因此知道有哪些合法键；但它改不了它（改了也只在本次渲染里，下一次运行会从模板重建）
- 声明非法时保存按钮禁用，并指出具体行

---

## M2 按钮与载荷（区间侧）

### 情境 S

按钮是模型产出的。它必须携带两样东西：**用哪个目标**（键）和**哪一行的数据**（载荷）。前者是引用，后者是数据——性质不同，处理也不同。

### 任务 T

定义按钮的属性形状，以及载荷从属性文本到一个可信对象的解析规则。**解析必须严格**：读不完整就拒绝，不允许"尽力而为"。

### 行动 A

**属性形状**：

```html
<button type="button"
        data-dsh-action="finish"
        data-dsh-row='{"task_number":"CP-2025-001","task_name":"登录模块联调","task_status":1}'>▶ 完成</button>
```

- `data-dsh-action`：动作键，**不写目标名**
- `data-dsh-row`：整行**原始字段**的 JSON，外面用单引号

**解析规则（顺序即优先级）**：

1. 取 `data-dsh-row` 原文
2. **体积检查**：UTF-8 字节数 > 上限 → `oversized-payload`，拒绝
3. **JSON 解析**：失败 → `malformed-payload`，拒绝
4. 结果必须是**对象**（不是数组、不是标量）→ 否则 `malformed-payload`
5. 取 `data-dsh-action`：空或缺失 → `missing-action`，拒绝

**转义规则**（写进文档是必须的，因为模型偶尔会写错）：属性用单引号包裹，所以**值里的单引号必须是 `&#39;`**。属性一旦断开，浏览器读到的是残损字符串——JSON 解析会失败，正好被第 3 步拦住。**这是刻意的：残损载荷必须报错，而不是按能读到的部分执行。**

**"尽力解析"是被明令禁止的。** 验收 33、34 就是这两条。

### 结果 R

- 载荷要么完整得到，要么整次点击被拒
- 确认面板展示的参数与实际执行的参数**永远是同一份**
- 模型写坏转义时的后果是"按钮点了没反应并报错"，而不是"执行了别的数据"

---

## M3 点击委托（影子树内）

### 情境 S

渲染发生在影子根里，而区间每次运行都会重建。因此监听必须挂在**宿主元素**上，用组合事件穿出边界；并且必须从 `composedPath()` 取真实目标，因为 `event.target` 在边界外已被重定向为宿主。

### 任务 T

把"影子树里某个按钮被点了"变成"拿到了一个键和一份载荷"，并且不把交互逻辑塞进渲染器。

### 行动 A

`ShadowHtml` 保持只负责渲染，但**新增一个回调出口**：

```ts
/** 一次点击解析出的结果。 */
export type WorkbenchActionEvent =
  | { readonly kind: 'action'; readonly key: string; readonly payload: JsonObject }
  | { readonly kind: 'invalid'; readonly reason: 'missing-action' | 'malformed-payload' | 'oversized-payload' }

export interface ShadowHtmlProps {
  readonly html: string
  readonly className?: string | undefined
  /** 影子树内的按钮被点击时调用；缺省则文档不可交互。 */
  readonly onAction?: (event: WorkbenchActionEvent) => void
}
```

实现形状：

```ts
useEffect(() => {
  const host = hostRef.current
  if (host === null || onAction === undefined) return
  const onClick = (event: MouseEvent): void => {
    // composedPath()[0] 才是影子树里的真实元素；event.target 是宿主。
    const first = event.composedPath()[0]
    if (!(first instanceof Element)) return
    const button = first.closest(`[${WORKBENCH_ACTION_ATTRIBUTE}]`)
    if (button === null) return
    onAction(readActionEvent(button))
  }
  host.addEventListener('click', onClick)
  return () => { host.removeEventListener('click', onClick) }
}, [onAction])
```

- 用 `closest()` 而不是 `matches()`：点击常落在按钮内部的文字节点或 `<span>` 上
- `readActionEvent` 是纯函数，按 M2 的五步返回判别结果
- **不在渲染器里判断目标是否存在、是否该确认**——那是 M4/M5 的事

**注意**：`closest()` 在影子树内查找，不会穿出影子边界，所以不会误抓卡片外壳上的控件。这一点让"区间内按钮"与"卡片外壳按钮"天然隔离。

### 结果 R

- 渲染器仍是纯渲染器，只是多了一个文本化的出口
- 区间重建后绑定依然有效（监听在宿主上，不随内容变化）
- 点击外壳的 X 或配置按钮不会误触发区间动作

---

## M4 目标解析与存在性检查

### 情境 S

键只是一个字符串。要变成可执行的目标，必须查声明、再查实体。两个层次都要查，因为"声明里有但实体不在"是常态（卡片被删了、skill 被卸载了）。

### 任务 T

把一个键变成"一个有名字、有类型、确实存在的目标"，并在任何一步失败时给出**可行动**的错误。

### 行动 A

新模块 `src/client/skill-card/actions.ts`：

```ts
/** 解析结果是判别联合：成功带目标，失败带可展示的问题。 */
export type WorkbenchActionResolution =
  | {
    readonly kind: 'resolved'
    readonly key: string
    readonly target: WorkbenchActionTarget
    /** 目标实体的不透明标识：卡片目标是卡片 id，skill 目标是 skill 名。 */
    readonly reference: string
    readonly payload: JsonObject
  }
  | {
    readonly kind: 'failed'
    readonly key: string
    readonly code: WorkbenchActionErrorCode
    readonly detail: string
    /** 候选，供面板列出；没有候选时为空数组。 */
    readonly candidates: readonly string[]
  }

export type WorkbenchActionErrorCode =
  | 'unknown-action'        // 键不在声明里
  | 'target-card-missing'   // 找不到该名称的卡片
  | 'target-card-ambiguous' // 同名的卡片不止一张
  | 'target-skill-missing'  // 找不到该名称的 skill
  | 'target-busy'           // 目标卡片正在运行
  | 'target-unavailable'    // 其它不可执行状态（如无活跃会话）
```

**检查顺序**（顺序即错误优先级，用户一次只看到第一个）：

1. 键在声明里 → 否则 `unknown-action`
2. `kind: 'card'`：
   - 在**已存储卡片**里按 `view.name` 精确匹配（区分大小写，不做模糊）
   - 0 张 → `target-card-missing`，`candidates` = 现有卡片名列表
   - ≥2 张 → `target-card-ambiguous`，`candidates` = 命中的那些（理论上同名就是它们）
   - 1 张：若该卡正在运行 → `target-busy`
3. `kind: 'skill'`：
   - 在**已安装并可被人类调用**的 skill 里按名称精确匹配
   - 0 个 → `target-skill-missing`，`candidates` = 已安装清单
   - 1 个：若无活跃会话 → `target-unavailable`
4. 通过 → `resolved`

**数据来源**：卡片来自客户端已读到的卡片快照（布局/卡片存储的读结果）；skill 来自现有的目录接口（`api.catalog`）。**两者都必须是"点下去那一刻"的读数**，不能用挂载时的缓存——卡片可能刚被删掉。

### 结果 R

- 失败路径全部**可行动**：缺卡片给卡片名候选，缺 skill 给 skill 候选
- 重名不猜、不取第一个
- 判断发生在点击时，不是渲染时

---

## M5 就地确认面板

### 情境 S

载荷来自模型，而模型读过远端数据。**确认面板是这条路径上唯一的人工闸门。** 它不是一个体验优化，而是一条安全控制——所以"参数全文"是硬要求。

面板还必须是**就地**的：共享组件不提供 dialog，现有编辑器也是就地取代卡片主体的。

### 任务 T

在真正执行之前，让人看到"要发生什么"和"用什么数据"，并能一次性取消且不留痕迹。

### 行动 A

**视图状态**加两个字段：

```ts
export interface WorkbenchCardView {
  // …现有字段…
  /** 待确认的动作；存在时显示区被确认面板取代。 */
  readonly pendingAction?: WorkbenchPendingAction
  /** 上一次动作的失败原因，供提示条展示。 */
  readonly actionProblem?: WorkbenchActionProblem
}

/** 一次待确认的动作，携带面板需要的全部内容。 */
export interface WorkbenchPendingAction {
  readonly key: string
  readonly target: WorkbenchActionTarget
  /** 卡片目标时是那张卡现有的 skill；skill 目标时是它自己。 */
  readonly skill: string
  /** 原样的载荷，供全文展示。 */
  readonly payload: JsonObject
  /** 运行将归属的会话 id。 */
  readonly sessionId: string
}
```

**面板内容固定四项**，顺序固定：

| 项 | 内容 |
|---|---|
| 目标 | `卡片：启动任务` 或 `skill：task-finish` |
| 将运行的 skill | 卡片目标显示**目标卡当前绑定的 skill**（那是真正会跑的），skill 目标显示它自己 |
| 参数 | 载荷的 `JSON.stringify(…, 2)`，放在 `<pre>` 里，**可滚动、不截断、不折叠** |
| 运行所属会话 | 会话 id（或它的标题） |

- 参数用**文本节点**渲染，不是 HTML——它来自模型
- 两个按钮：`确认` / `取消`
- **取消必须无副作用**：不跳转、不运行、不写存储，只清掉 `pendingAction`

**为什么"卡片目标显示目标卡的 skill"很重要**：用户点的是"启动任务"这张卡，而真正会执行的是那张卡绑定的 skill。如果不显示，用户确认的就不是将要发生的事。

### 结果 R

- 每次点击都过面板，没有"不再询问"
- 取消后卡片回到原状，没有任何写入
- 面板里看到的就是将要执行的

---

## M6 卡片目标执行

### 情境 S

目标是另一张卡。它的运行状态归它自己的控制器管，但这次运行由**当前这张卡上的点击**发起——发起时目标卡的页面可能还没挂载。

### 任务 T

在不依赖目标卡组件挂载的前提下启动一次运行，然后跳过去看它。

### 行动 A

**问题**：现有 `run()` 属于某张卡的控制器实例，只有那张卡的页面渲染时才存在。

**做法**：把"发起一次卡片运行"从控制器里**提出来**，成为一个与挂载无关的函数（客户端入口层）：

```ts
/**
 * 为任意一张已存储的卡片发起一次运行。
 *
 * 与控制器里的 run() 的区别：它不依赖那张卡的组件已挂载，
 * 因为发起这次运行的是另一张卡上的点击。
 * @param cardId - 目标卡片。
 * @param sessionId - 运行归属的会话。
 * @returns 启动结果；失败时带可展示原因。
 */
export async function startCardRun(cardId: string, sessionId: string): Promise<WorkbenchRunStart>
```

它内部走**现有**的运行路由（`POST …/run`），`outputSchema` 用现成的 `WORKBENCH_OUTPUT_SCHEMA`——卡片运行仍然是区间填充，这一点不变。

**编排**：

1. 确认后：`startCardRun(targetCardId, sessionId)`
2. 成功后：`openCard(targetCardId, 'result')` —— 面板切到目标卡的结果页
3. 目标卡的结果页挂载后，它自己的控制器接管轮询与状态展示
4. 结果由宿主按 `cardId` 存储（现有行为），不需要新通道

**先启动还是先跳转？** 先启动，后跳转。理由：跳转是纯视图操作，而启动可能失败；先启动能在**当前**卡片上就地报错，用户不必先被带走再看到失败。

**占用检查已在 M4 做过**（`target-busy`），这里不重复检查——但仍然会有竞态：检查通过后、启动前那几毫秒目标卡可能刚好被点了运行。**处理方式是接受竞态**：路由本身会拒绝并发运行（现有 `maxConcurrentRuns` / 单卡单跑），此时把它的拒绝原样报给用户即可，不引入分布式锁。

### 结果 R

- 点击 → 目标卡开始运行 → 面板跳到它 → 结果存在它身上
- 失败（含竞态）在当前卡片上就地报错，用户仍停在原处
- 不需要为"另一张卡"发明新的运行通道

---

## M7 skill 目标：轻量运行

### 情境 S

skill 目标**没有模板**。当前整条运行链路是围绕"携带文档 → 回填区间 → 返回 `{html}`"建的，所以这是一个**运行模式的扩展**，不是参数变体。

它只需要回答一件事：这次运行成不成。没有产物、不落盘。

### 任务 T

在不破坏现有卡片运行的前提下，支持一次"只执行技能、只看成败"的运行，并复用已有的失败诊断通道。

### 行动 A

**运行请求加一个模式判别**（宿主侧类型）：

```ts
/** 一次运行要做什么。 */
export type WorkbenchRunMode =
  /** 卡片运行：携带文档，回填区间，产出 { html }。 */
  | { readonly kind: 'card'; readonly template: string }
  /** 轻量运行：不携带文档，不要求产物，只看成败。 */
  | { readonly kind: 'bare' }
```

- `kind: 'card'` → 现有行为**一字不改**：提示词带 `<output_document>`，契约是 `WORKBENCH_OUTPUT_SCHEMA`
- `kind: 'bare'`：
  - 提示词用**不带文档**的形态（即只含 `<skill_content>` 与任务行）
  - **不传 `outputSchema`**
  - 结果**不写存储**
  - 成败判据：`stopReason === 'completed'` → 成功；`'error'` / `'aborted'` → 失败
  - 失败诊断走**已经接通的 `agent/error` 通道**（宿主订阅总线、按 `agent.id === childId` 归属、写进 `diagnostic`）

**客户端呈现**：本次会话内的临时状态，挂在卡片视图上：

```ts
/** 一次轻量运行的状态，纯临时，不落盘。 */
export type WorkbenchBareRunState =
  | { readonly phase: 'running'; readonly skill: string; readonly startedAt: number }
  | { readonly phase: 'settled'; readonly skill: string; readonly ok: boolean; readonly diagnostic?: string }
```

- 进行中：显示"正在执行 skill X"
- 结束：显示成功或失败；失败带诊断
- **重载即消失**，卡片回到自己已存的结果

### ⚠️ 实现前必须验证（这一模块有两处）

1. **子 agent 接缝是否接受"没有 `outputSchema`"的运行。** 现有 `WorkbenchActivationSpec.request.outputSchema` 在我的类型里是必填的，而 runner 还有一道"provider 不支持 `outputSchema` 就拒绝"的预检。裸运行要么改这两处，要么传一个等价于"无契约"的值。**必须先读接缝与上游类型确认，不能假设。**
2. **没有结构化运行时，`stopReason` 是否保持 `completed`。** 上游的 `captureLocalResult` 会在"完成但没有捕获"时把 `stopReason` 改写成 `error`——那条逻辑是否只在附加了结构化运行时才生效，决定成败判据能不能直接用 `stopReason`。**这一条错了，裸运行会 100% 报失败。**

### 结果 R

- 一个不含文档、不产生结果的运行模式
- 成败与诊断复用现有通道，不新增
- 现有卡片运行路径零改动

---

## M8 动作属性的封闭白名单

### 情境 S

现有清洗是**黑名单**：禁 `on*`、危险 URL、带外链的 `style`，"没被禁的都放行"。加上动作属性之后，如果继续黑名单，模型可以塞任意 `data-dsh-*`，而其中任何一个将来被读到都会变成行为。

### 任务 T

让"哪个属性会产生行为"是一个**封闭清单**，而不是"没被禁的都行"。

### 行动 A

```ts
/**
 * 唯一会产生行为的属性清单。
 *
 * 封闭是刻意的：新增一个生效属性必须改这里，而不是在模板里写出来就生效。
 */
export const WORKBENCH_ACTION_ATTRIBUTES = ['data-dsh-action', 'data-dsh-row'] as const
```

- `readActionEvent` **只读这两个**
- `analyzeTemplate` 额外报一个问题：区间内出现**其它 `data-dsh-*` 属性** → `unknown-action-attribute`（这是**警告级**：它不阻止保存，但告诉用户"这个属性不会有任何作用"，因为拼错一个属性名会静默失效，这是最容易浪费调试时间的一类错误）
- 黑名单**保留**：`on*` 等仍然一律拒绝。白名单是**叠加**，不是替换

### 结果 R

- 会触发生效的属性有且只有两个
- 拼错的 `data-dsh-*` 会被指出来，而不是静默什么都不做
- `on*` 依旧不可能生效

---

## 与需求验收标准的对应

| 验收 | 本文位置 |
|---|---|
| 17 声明保存期校验（重复键/未知类型/空名称） | M1 行动 A、违规码表 |
| 18 每按钮一个目标 + 携带整行原始字段 | M2；注意"重复属性被解析器去重"这一事实 |
| 19 未声明的键 → 报错不执行 | M4 第 1 步 |
| 20 卡片缺失列候选、重名报错 | M4 第 2 步 |
| 21 skill 缺失列已安装清单 | M4 第 3 步 |
| 22 本卡运行中按钮不可点 | M3 + M5（视图由 `run.phase` 派生） |
| 23 目标卡运行中立即报错 | M4 `target-busy`、M6 竞态说明 |
| 24 每次确认、四项、参数全文 | M5 |
| 25 取消无副作用 | M5 行动 A |
| 26 卡片目标：跳转 + 立即运行 + 存储 | M6 |
| 27 skill 目标：当前会话、不携带模板文档 | M7 |
| 28 skill 目标只报成败、不落盘 | M7 结果 R |
| 29 正常结束即成功；`agent/error`/超时即失败并显示诊断 | M7 判据 + ⚠️ 第 2 条 |
| 30 同一行可反复触发 | M3（监听不消费）+ M5（确认后清 `pendingAction`） |
| 31 未声明动作属性无行为 | M8 |
| 32 区间重建后按钮仍生效 | M3（委托在宿主上） |
| 33 载荷无法完整解析 → 拒绝 | M2 第 3/4 步 |
| 34 载荷超限 → 拒绝，不截断 | M2 第 2 步 |

---

## 风险与实现顺序

| 风险 | 说明 | 处置 |
|---|---|---|
| **裸运行的成败判据**（M7 ⚠️2） | 判错会让这个功能 100% 失败 | **先验证再接缝**，验证不通过就不开工 M7 |
| **`outputSchema` 必填**（M7 ⚠️1） | 类型与预检两道都要改 | 同上 |
| **卡片运行无法脱离挂载发起**（M6） | 提取不正确会让跨卡运行只在目标页已打开时才能用 | 先从控制器里提取并单测，再接面板 |
| **载荷是远端数据的通道** | `确认 + 全文展示` 是唯一缓解 | M2 严格解析 + M5 全文展示，两条验收 33/34 守住 |
| **同名卡片** | 改名即失效（已接受） | 错误必须列候选，不许猜 |

**建议实现顺序**（每步可独立验收）：

1. **M8 + M2**：属性白名单与载荷解析（纯函数，最容易测）
2. **M1**：声明解析与保存期校验（纯函数）
3. **M3**：点击委托（可在现有卡片上先接一个空动作验证）
4. **M5**：确认面板（无执行，只有展示与取消）
5. **M4**：目标解析（依赖 1、2）
6. **M7**：裸运行（**先做 ⚠️ 两项验证**）
7. **M6**：跨卡运行（依赖 M6 的提取）

---

## 明确不做

- 实时执行过程与模型思考过程（需求已删除）
- 免确认、批量触发、"不再询问"
- 按卡片 id 引用目标
- 排队与等待（目标忙即报错）
- 跨卡片编排与依赖
- 动作属性做用户自定义扩展（白名单是封闭的）
