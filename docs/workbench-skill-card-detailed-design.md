# 工作台技能卡详细设计

[需求方案](workbench-card-requirements.md)回答"要什么"。本文回答"怎么做"——把技能卡拆成 14 个模块，逐个讲清楚。

> **修订说明。** 本文随需求方案第十版同步。上一版（第九版）的五件事（编辑区与聊天输入区同形、运行中的停止控制、运行详情的两处可读性修正（开关改名与去缩进）与结束原因本地化、修改记录的头部行、面板标题回归）落在本文的 **M10**（结果页与微调编辑区、面板标题所在的 `WorkbenchPage.tsx`）、**M8**（取消动作与微调状态）与 **M13 / M14 / 附录 B** 上，验收标准由 56 条增至 60 条（那一批落地时整个包是 453 个测试 / 34 个 spec 文件）。
>
> **本轮（第十版）加的是手工编辑结果**：结果表面里就地打开一个编辑器，改的是**存盘的那段区间片段**（不是模板、不是 DOM），保存后它就是这张卡的结果，记录上多一个 `editedAt`，运行详情里多一行「手工编辑」，而它**不进修改记录**、仍可用「回到上一版」退回一步。它落在本文的 **M10**（结果页与 `SkillCardResultEditor.tsx`、`text-editing.ts`、`violation-copy.ts`）、**M8**（`saveResultEdit` 与 `api.saveResult`）、**M1**（`editedAt`、结果写请求与回执）、**M4**（`workbenchResultSchema`）与 **M6**（`PUT /api/workbench/skill-card/result`）上；验收标准由 60 条增至 **70 条**，本批落地时整个包是 **505 个测试 / 37 个 spec 文件**，`corepack yarn workspace dsh-workbench check` exit 0。需求侧的条目编号、决策表与验收分组见[需求方案 §19 与 §14.6](workbench-card-requirements.md#146-已实现并验收6170)。
>
> **本轮（第十一版）撤掉结果页的两处噪音。** 产品负责人判定两样东西都是噪音：结果面上方那行**状态行**（`✓ 已完成 · 14:28:36 · 用时 42s`，连带 `data-run-status` 钩子、`runStatusLine` 一族函数，以及四个状态词与 `runDuration` 这些失去读者的 locale key），以及结果表面里那行**「结果」`h3`**（连同它的 `resultHead` 头部行、细线与 `useId`/`aria-labelledby` 配对、`skillCardResultHeading` 这个 key）。两处都整行删除，**没有被任何东西替代**；结果表面的边框、圆角与内边距留下，容器的边界从此只靠内边距把渲染文档挡在边框之外。状态与时间这两个事实没有丢——结束原因与开始时间一直在「运行详情」里。需求侧的验收标准 **52** 因此撤回、编号保留（并顺带撤回 FR-38）。这一批落地时整个包是 **501 个测试 / 37 个 spec 文件**。
>
> **本轮（第十二版）加的是每张卡自己选模型。** 配置页「基本信息」多了第三个控件：**模型**——按 provider 分组的 `select`，选项文本是模型名，默认选中当前会话的模型（一张卡永远显示一个具体模型，没有空选项）。路由以 **`{ provider, model }` 这一对**存储（provider id 可能自带斜杠，拼成字符串就拆不回来），v1 不带 `reasoningEffort`。运行路径在**卡片写了模型时**把这一对作为子代理的 `agentOptions` 传下去，并把用到的路由记进结果记录；「运行详情」因此多一行「模型」。**不可用就拒绝，不回退**：provider 不存在、模型不在其目录里、后端不支持 `agentOptions`，三种都在启动前按**既有错误码通道**拒绝，消息点名那条路由。它落在本文的 **M1**（`WorkbenchCardModel`、配置与结果记录的新字段、`model-unavailable`）、**M4**（两张表的 schema 声明与合并语义）、**M5**（启动前的路由校验、`agentOptions`、记录落 `model`）、**M8**（`chooseModel` 与目录座位）、**M10**（字段三态与运行详情那一行）与 **M9/M7**（客户端 `ctx.inject(['modelDirectories'])`、宿主 `inject` 加 `llm`）上；验收标准由 70 条增至 **79 条**，本批落地时整个包是 **541 个测试 / 38 个 spec 文件**，`corepack yarn workspace dsh-workbench check` exit 0。需求侧的条目与分组见[需求方案 §14.7 与附录 A.7](workbench-card-requirements.md#147-已实现并验收7179)。
>
> **本轮（第十三版）加的是每张卡自己的工作目录：一张卡在运行之前必须先有目录，而这个目录由用户用一个选择器挑。** 配置页「基本信息」从三个控件变成四个，排版改成**两行两列**（名称 / 技能，模型 / 工作目录）；字段的主值是**目录名的最后一段**，完整路径是它下面那行次要文字。存的是**一条完整绝对路径**（`workspace?: { path: string }`），**不是工作区 id**——理由与「模型是一对 id，不是一个字符串」同源：产品要的是"用户选哪个目录就是哪个目录"，那个目录不必是已注册的工作区；而一个 id 还要额外依赖一条会被改名的注册表记录。选择器**按平台分派**：Windows 走 Desktop 插件发布在窗口上的 `__DSH_DESKTOP_PICK_DIRECTORY__`，其他平台走应用自己的 `ctx.uiWorkspace.pickDirectory()`；**产品负责人明确否掉了手打路径与工作区下拉**，所以这里没有第三种入口。**一个纯函数 `resolveWorkspaceField()` 拥有三种状态**（`missing` / `invalid` / `ready`），字段与运行控件读的是同一个值；**拒绝，绝不回退**到会话的目录。**没有迁移**：已有卡片读回来就是没有目录，在配上之前不能运行。**一条必须先说清的缺口**：这一版**没有**让目录约束运行写到哪里——运行仍在父会话的目录里执行，收口需要一次 `agents.create({ meta: { cwd } })` 式的运行，**没有实现**（见 M5 的「工作目录：一道门，还不是一间房」）。它落在本文的 **M1**（`WorkbenchCardWorkspace`、`isWorkbenchWorkspacePath`、`WorkbenchDirectoryStat`、目录检查路由与两个新错误码）、**M4**（`workbenchCardWorkspaceSchema` 与合并/清空语义）、**M5**（启动前的目录门，以及那个缺口）、**M6**（`GET /directory` 与 `src/skill-card-directory.ts`）、**M7/M9**（宿主的探针装配、客户端 `ctx.inject(['uiWorkspace'])` 的作用域形式）、**M8**（`workspaceField`、`chooseWorkspace`、`statDirectory`）与 **M10**（`workspace.ts`、`workspace-picker.ts`、`WorkspaceField` 与两行两列的栅格）上；验收标准由 79 条增至 **92 条**，本批落地时整个包是 **604 个测试 / 40 个 spec 文件**，`corepack yarn workspace dsh-workbench check` exit 0。需求侧的条目与分组见[需求方案 §14.8 与附录 A.8](workbench-card-requirements.md#148-已实现并验收8092)。

## 怎么读这份文档

每个模块按 **STAR** 四段展开，读法如下：

| 段 | 含义 | 你想快速判断什么时看这里 |
| --- | --- | --- |
| **情境 S** | 为什么会存在这个模块，没有它会出什么事 | 这个模块是不是必要的 |
| **任务 T** | 它必须做到什么（可验收的职责） | 它到底要负责什么 |
| **行动 A** | 怎么做，关键取舍是什么 | 实现时照着写什么 |
| **结果 R** | 做完之后得到什么，怎么知道它成了 | 怎么验证 |

类型定义、算法、签名都放在**行动 A** 里。如果你想先建立整体印象，读下面的「全景」和「模块索引」就够了。

## 全景：一次运行从头到尾发生了什么

```
用户在工作台上看到技能卡
        │
        │ ① 点「配置」：选一个 skill，写整份 HTML 文档（区间标记 + 注释）
        ▼
   ┌─────────────────────────────────────────┐
   │ 客户端：分析模板——有恰好一对区间吗？      │  ← M2 模板引擎
   │      文档有没有夹带它不该有的东西？        │
   └─────────────────────────────────────────┘
        │ ② 点运行
        ▼
   ┌─────────────────────────────────────────┐
   │ 宿主：找到会话的活 Agent                  │  ← M5 执行服务
   │      → 以该 Agent 为作用域读出 skill 正文 │
   │      → 起一个独立子代理，把整份文档原样    │
   │        放进 prompt，要求它只回填区间       │
   └─────────────────────────────────────────┘
        │ ③ 拿到一个已校验的对象：{ html: "填好的那一段" }
        ▼
   ┌─────────────────────────────────────────┐
   │ 宿主：结果 + 模板落盘；子代理自身报错时，  │  ← M4 存储、M5 事件总线
   │      把 agent/error 写进结果的诊断字段     │
   └─────────────────────────────────────────┘
        │ ④ 客户端把 html 拼回骨架、清洗、放进影子根
        ▼
   卡片上显示出一张表格／列表／任意排版（骨架逐字节不变）
        │ ⑤ 不满意时不必重跑：写一句要求，宿主在「上一版」上再跑一次
        ▼
   结果就地替换；上一版与修改记录只留在本次会话（M8、M10）
```

三条贯穿全文的线索：

1. **模板是前置条件。** 没有模板就没有可交给子代理的规格，也没有可供拼回结果的骨架（需求决策 20）。
2. **两个不可信来源，信任级别并不相同。** 用户写的骨架是自伤面（会被复制粘贴），而子代理回填的 HTML 片段来自**模型**——它读过模板、skill 以及 skill 工具的输出。注入链断在"逐次清洗"与影子根这两处（M3、M12）。微调的 `<previous_result>` 也属于这一侧：那段 HTML 是上一次模型写的，进下一次提示词时同样不可信。
3. **skill 必须按 agent 作用域读。** 裸读在真实组合里返回空数组，这不是优化而是必需（M5）。

> **第二版的三件事已删除，不要在这份文档里找它们：** 占位符 `{{字段}}` 与循环标记 `data-dsh-each` 的文法、`deriveTemplate` 的契约反推、编辑器里的字段清单与占位样值预览。今天的模板语言只有一对区间标记，输出契约只有一个固定常量。

## 模块索引

| 编号 | 模块 | 落在哪些文件 | 一句话职责 |
| --- | --- | --- | --- |
| **M1** | 共享契约 | `src/skill-card-contract.ts` | 两端共同遵守的路径、上限、类型、错误码 |
| **M2** | 模板引擎 | `src/client/skill-card/template.ts`、`policy.ts` | 定位区间、拒绝越界标记与违禁写法（**不再反推契约**） |
| **M3** | 隔离渲染 | `src/client/skill-card/render.ts`、`ShadowHtml.tsx` | 把回填片段拼回骨架、清洗后放进影子根 |
| **M4** | 存储域与配置服务 | `src/skill-card-spec.ts`、`skill-card-store.ts` | 持久化用户配置与执行缓存 |
| **M5** | 执行服务 | `src/skill-card-runner.ts` | Agent → skill → 子代理 → 结构化结果 |
| **M6** | 私域路由 | `src/skill-card-route.ts`、`src/skill-card-directory.ts` | 浏览器访问宿主的 8 个入口（含一条只读的目录检查） |
| **M7** | 插件入口与配置 | `src/index.ts`、`src/config.ts` | 启动时装配全部能力，暴露可调项 |
| **M8** | 客户端传输与状态 | `src/client/skill-card/api.ts`、`controller.ts`、`run-start.ts` | 页面需要的 view 与 actions，含微调的内存状态（记录、上一版、回退） |
| **M9** | 卡片组件与装配 | `src/client/skill-card/SkillCard.tsx`、`src/client/index.ts` | 卡片本体，以及补上缺失的工厂注册 |
| **M10** | 编辑器与配置页（含结果页） | `src/client/skill-card/SkillCardSettings.tsx`、`SkillCardPages.tsx`、`ActionDeclarationPanel.tsx`、`declarations.ts`、`skeleton.ts`、`workspace.ts`（工作目录字段的三态）、`workspace-picker.ts`（目录选择器）、`WorkbenchPage.tsx`（面板标题） | 三段配置页、行号栏、状态行、键盘、违例定位、声明构建器、骨架、并排/切换、页脚与两段式删除、工作目录字段与它的选择器；结果页的结果表面、运行详情与微调编辑区（含运行中的停止控制） |
| **M11** | 依赖与构建 | `package.json`、构建配置 | 声明新依赖，保持构建面不变 |
| **M12** | 失败、可观测与安全（横切） | 贯穿各模块 | 两个不可信来源的处置与权限边界 |
| **M13** | 测试设计 | `tests/` | 每层怎么验、验什么 |
| **M14** | 实施阶段 | — | P6–P9 的切分与出口标准 |

附录：[A 需求方案的一处修订](#附录-a需求方案的一处修订) ｜ [B 验收映射](#附录-b验收映射) ｜ [C 依据](#附录-c依据)

## 开工前必须知道的 5 个事实

这几条改变了设计走向，全部查证自源码，不是推测：

| 事实 | 为什么重要 |
| --- | --- |
| 子代理启动方法的 `parent` 是**必填的活 Agent 对象**，不是 sessionId | 决定了"点一下就跑"必须先拿到 Agent（M5） |
| skill 读取必须传 `scope`，**Agent 对象本身就是 scope key**；不传只读 global 层 | 真实 web-app 组合里 global 层没有 provider，裸读返回空（M5） |
| 请求了输出契约、正常结束、但没拿到合法捕获时，上游把 `stopReason` 改写成 `'error'` | "格式不满足"正好映射到这里，重试判据由此确定（M5） |
| `workbench.card` 工厂**被声明但从未注册** | P1–P4 留下的缺口，本次必须补（M9） |
| 上游**没有任何一处从 agent 回合之外启动子代理**的调用点 | 我们是第一个，风险要写明（M5、M12） |

完整引用见[附录 C](#附录-c依据)。

---

## M1 共享契约

> 文件：`src/skill-card-contract.ts`（与布局契约同构：纯常量与类型，无运行时依赖）

### 情境 S

浏览器和宿主是两个进程，各自编译、各自打包。它们要通过 HTTP 对话，但编译器帮不上忙——客户端可以送出一个宿主不认识的字段，宿主可以返回一个客户端解析不了的结构，而这类错误只会在运行时以奇怪的方式暴露。

工作台已有的布局功能遇到过同一个问题，解法是一份**无运行时依赖的纯契约模块**：两端各自 import 同一份常量与类型，浏览器包能直接把它内联进去。

技能卡要跨的边界更多（8 条路径、6 组数据结构），更需要这份共同语言。

### 任务 T

1. 定义 8 条路由路径与一个契约版本号。
2. 定义各类上限（体积、数量），让两端用同一组数字。
3. 定义线上传输的全部数据结构。
4. 定义**封闭**的错误码集合，其中可操作的原因不能被折叠成"通用错误"。
5. 保持零运行时依赖，能被浏览器包内联。

### 行动 A

**路径与版本**

```ts
export const WORKBENCH_SKILL_CARD_PATH = '/api/workbench/skill-card'
export const WORKBENCH_SKILL_CARD_CATALOG_PATH = `${WORKBENCH_SKILL_CARD_PATH}/catalog`
export const WORKBENCH_SKILL_CARD_RUN_PATH = `${WORKBENCH_SKILL_CARD_PATH}/run`
/** 手工编辑结果：一条独立的写，不是运行路由上的第四个方法。 */
export const WORKBENCH_SKILL_CARD_RESULT_PATH = `${WORKBENCH_SKILL_CARD_PATH}/result`
/** 目录检查：只回答"这个路径现在还是不是一个目录"，不读目录里的任何东西。 */
export const WORKBENCH_SKILL_CARD_DIRECTORY_PATH = `${WORKBENCH_SKILL_CARD_PATH}/directory`
export const WORKBENCH_SKILL_CARD_API_VERSION = 1
```

**上限**——两端引用同一组数字，避免"客户端以为能存、宿主拒收"这类错配：

```ts
export const WORKBENCH_TEMPLATE_MAX_BYTES = 32 * 1024
export const WORKBENCH_TEMPLATE_MAX_PER_CARD = 16
export const WORKBENCH_RESULT_MAX_BYTES = 64 * 1024
export const WORKBENCH_SKILL_CARD_MAX_BODY_BYTES = 128 * 1024
/** 修改要求：字符上限。它是一句话，不是语法；上限只界定一次请求与提示词的花费。 */
export const WORKBENCH_REFINE_INSTRUCTION_MAX_LENGTH = 2_000
/** 上一版 HTML 的字节上限：与一条结果的预算相同——卡片能显示的结果，它都能微调。 */
export const WORKBENCH_REFINE_PREVIOUS_MAX_BYTES = WORKBENCH_RESULT_MAX_BYTES
```

**运行模式**——三种，各自声明的不是一个标志位而是一种输入形状（见下）：

| 模式 | 携带什么 | 模板从哪来 | 输出契约 |
| --- | --- | --- | --- |
| `card` | 无 | 存盘的选择 | `{html}` |
| `bare` | `skill` | 没有模板 | 无（只读子代理的结束原因） |
| `refine` | `instruction`、`previous` | 存盘的选择（**请求不带模板**） | `{html}`（与 `card` 同一个常量） |

```ts
/** 微调：在已有结果上按一句要求改一次。 */
| {
  readonly kind: 'refine'
  /** 要改什么，逐字进入提示词。 */
  readonly instruction: string
  /** 修订的起点：屏幕上那份区间 HTML，逐字。 */
  readonly previous: string
}
```

**文法常量**——模板语言只有一对区间标记，以及那份固定的输出契约：

```ts
export const WORKBENCH_REGION_BEGIN = 'template-begin'
export const WORKBENCH_REGION_END = 'template-end'

/** 一次调用一份新正则：共享的全局正则会带着 lastIndex 串到别的调用方。 */
export function regionMarkerPattern(name: string): RegExp {
  return new RegExp(`<!--\\s*${name}\\s*-->`, 'g')
}

export const WORKBENCH_OUTPUT_SCHEMA = {
  type: 'object',
  properties: { html: { type: 'string' } },
  required: ['html'],
  additionalProperties: true,
}
```

> **已废弃：** `WORKBENCH_LOOP_ATTRIBUTE`（`data-dsh-each`）与 `WORKBENCH_FIELD_PATTERN`（字段名文法）已随占位符语言一起删除。`deriveTemplate` 也不存在了——没有可推导的东西。

**线上数据结构**——分六组：

| 组 | 类型 | 说明 |
| --- | --- | --- |
| 存储 | `WorkbenchCardConfigRecord`、`WorkbenchTemplateRecord`、`WorkbenchResultRecord` | 落盘的东西；卡片记录自第十二版起带 `model?: WorkbenchCardModel`、自第十三版起带 `workspace?: WorkbenchCardWorkspace`，结果记录自第十二版起也带 `model?` |
| 读取 | `WorkbenchSkillCardSnapshot`、`WorkbenchCardConfigView` | 打开工作台时拿到的 |
| 写入 | `WorkbenchSkillCardPatch` | 改配置；`model` 与 `name`/`skill` 一样支持 `null`（表示"改回继承会话模型"），`workspace` 支持 `null`（表示"清掉这张卡的目录"） |
| 结果写 | `WorkbenchResultEditRequest`、`WorkbenchResultEditResponse` | 手工编辑结果：`{ cardId, html }` 进，`{ apiVersion, revision, result }` 出 |
| 目录 | `WorkbenchDirectoryStat`、`WorkbenchDirectoryStatResponse` | 目录检查的答案：三个布尔值 + 回显那条路径；**没有错误形状**，读不到就是"什么都没有" |
| 运行 | `WorkbenchRunRequest`、`WorkbenchRunState`、`WorkbenchRunPhase` | 执行相关 |

**卡片模型：一对 id，不是一个字符串**（第十二版）：

```ts
/** 一张卡运行所用的精确路由。 */
export interface WorkbenchCardModel {
  readonly provider: string
  readonly model: string
}

/** 两个非空 id 才算一条路由。 */
export function isWorkbenchCardModel(value: unknown): value is WorkbenchCardModel
```

三条理由写在类型旁边，这里重复一遍，因为后来的人一定会想"合成一个字符串多省事"：

- **provider id 自身可能含斜杠**（`vendor/gateway`）。存成 `"provider/model"` 就必须在某个随机的位置把它拆回来——那是 bug 农场，不是解析。
- **`reasoningEffort` 不在 v1 里。** 卡片没有选过思考档位，给它一个默认值就是给它一个它没有的值。
- **这一对同时是 `ModelSelection` 的子集**（上游的那个类型还带 `reasoningEffort`），所以从客户端目录里读到的东西不用转换就能对齐，而不需要声明一个"我们比上游少一个字段"的平行类型。

`WorkbenchRunRequest` **不带模型**：路由是卡片自己存的选择，由宿主从存储里读（M5）。客户端不能替一张卡决定它跑在哪条路由上——那会让"卡片写的是什么"和"跑的是什么"成为两件事。

```ts
/** 启动一次运行。 */
export interface WorkbenchRunRequest {
  readonly cardId: string
  /** 只用来取活 Agent；模型来自卡片自己存的选择，不在这里。 */
  readonly sessionId: string
  /** 这次运行被要求做什么：card / bare / refine，见上表。 */
  readonly mode: WorkbenchRunMode
  /** 触发这次运行的那一行原始字段；从卡片自己的控件发起的运行没有它。 */
  readonly payload?: Record<string, unknown>
  /**
   * 输出契约。**每次填模板的运行都送同一个常量** `WORKBENCH_OUTPUT_SCHEMA`（`card` 与
   * `refine`）——子代理只回报填好的那段区间 HTML，没有按模板生成的契约。`bare` 不带它。
   */
  readonly outputSchema?: unknown
}

/**
 * 手工编辑结果。请求只带两个字段：记录里的 skill、结束原因、原始输出与诊断都是
 * "那次运行"的事实，编辑对它们无话可说；回执带上新记录与新 revision，页面因此不需要
 * 再读一遍配置（否则拿旧 revision 的下一次配置写会白白冲突一次）。
 */
export interface WorkbenchResultEditRequest {
  readonly cardId: string
  readonly html: string
}

export interface WorkbenchResultEditResponse {
  readonly apiVersion: number
  readonly revision: string
  readonly result: WorkbenchCardResult
}
```

**卡片的工作目录：一条完整绝对路径，不是一个工作区 id**（第十三版）：

```ts
/** 一张卡运行所在的目录。一个单字段对象，好让它以后能长（显示名、校验时间戳）而不产生歧义。 */
export interface WorkbenchCardWorkspace {
  /** 绝对目录路径，逐字就是选择器交回来的那一条。 */
  readonly path: string
}

/** 一条可以存的路径：绝对路径，且不超过 4,096 个字符。 */
export const WORKBENCH_WORKSPACE_PATH_MAX_LENGTH = 4_096
export function isWorkbenchWorkspacePath(value: string): boolean

/** 目录检查的答案。三个事实，没有错误分支。 */
export interface WorkbenchDirectoryStat {
  readonly exists: boolean
  readonly isDirectory: boolean
  /** 报告，但**不**决定可用性：一次运行的结果进的是工作台自己的存储，不是这张卡的目录。 */
  readonly writable: boolean
}
```

三条理由，写成"后来的人一定会想改"的那种：

- **存路径不存 id。** 产品决定是"用户选哪个目录就是哪个目录"，那个目录**不必**是已注册的工作区；换成 id 就把卡片绑在一条会被改名、会被删掉的注册表记录上，而且用户看到的目录名和卡片上写的东西会分成两处。
- **只接受绝对路径，不做"相对谁"的解析。** 相对路径解析到会话侧，同一个值每次运行都是另一个目录；解析到宿主侧，则是用户从没见过的那个。两种"帮你解析"都是错的，所以 `isWorkbenchWorkspacePath()` 直接拒（`C:\…`、`\\server\share`、`/…` 三种绝对形状 + 长度上限 + 无 NUL）。
- **`writable` 只报告，不进判据。** 一次运行的结果进的是工作台自己的存储（`result` 表），不是这张卡的目录；所以目录只回答"这里能不能跑"，不回答"这里能不能写"。把它当判据会让一个只读的仓库目录莫名其妙地跑不了——而它本来是能跑的。（**注意**：这说的是"结果不写进卡目录"，**不是**"运行被限制在卡目录里"——后者今天根本没实现，见 M5。）

**错误码**——封闭联合，且刻意分得细：

```ts
export type WorkbenchSkillCardErrorCode =
  | 'unauthorized' | 'forbidden' | 'invalid-request' | 'too-large'
  | 'conflict' | 'not-found' | 'storage-failure' | 'run-failed'
  | 'not-configured'        // 还没选 skill
  | 'session-not-live'      // 没有活跃会话
  | 'skill-not-found'       // skill 被删或改名
  | 'template-missing'      // 还没写模板
  | 'catalog-failed'        // 读 skill 目录失败
  | 'provider-unavailable'  // 子代理后端不支持输出契约，或没有这条模型 provider
  | 'model-unavailable'     // provider 在，但它不再提供卡片写的那条模型（第十二版）
  | 'schema-rejected'       // 请求没带可用的对象根契约（形状预检）
  | 'run-in-progress'       // 这张卡已经在跑
  | 'workspace-missing'     // 这张卡还没选工作目录（第十三版）
  | 'workspace-invalid'     // 存的那条路径没了，或已经不是目录（第十三版）
```

`model-unavailable` 是第十二版加的**唯一**一个新码。三种拒绝都要说得清楚，所以它们不合并成一个：后端不支持 `agentOptions` 与 provider 不存在共用 `provider-unavailable`（都是"这条后端/provider 走不通"），而**模型本身不在目录里**有自己的码——它对应的下一步动作不一样（换一个模型，还是换一条后端/provider）。路由把它映射成 **409**，与 `session-not-live` 同类：卡片配置时的事实和现在对不上，不是请求写错了。

第十三版的两个码沿用同一条判据，而且**必须**是两个：`workspace-missing` 的下一步是"去选一个目录"（路由映射 **400**，与 `not-configured` 同类——卡片别的都齐了，只缺一个事实），`workspace-invalid` 的下一步是"去看看那个目录怎么了"（映射 **409**，与 `model-unavailable` 同类——卡片配置时目录在，现在不在了）。合并成一个码会让这两种下一步共用一句话，而它们要用户做的事完全不同。

后九个是**可操作的降级原因**，对应需求 §8 的降级矩阵：每一个都告诉用户下一步该做什么。把它们折叠成一个通用错误，用户就会看到"出错了"却不知道该干什么——这正是需求明令禁止的。

### 结果 R

- 两端编译期就对同一组常量与类型，字段名写错立刻是类型错误。
- 错误码表成为 M12 与验收标准的公共词汇；新增一个码会同时在三张映射表里报错（路由的状态表、客户端的本地化表、卡片的失败文案表），漏一处编译不过。第十三版一次加了两个码，三张表因此各自被逼着表了态：400 还是 409、说什么话、卡片上写哪一句。
- **模型是一条路由，不是一段文本**：它以两个 id 的形态进出契约、存储与记录，中途没有任何一处需要拆分或拼接。**工作目录是一条路径，不是一个 id**：同理，它以一个字符串的形态进出契约、存储与请求，中途没有任何一处需要"换成工作区再换回来"。
- 契约模块本身零依赖，`vite` 构建时被内联进客户端包，不产生新的外部依赖；目录检查那一条路径是同源私域路径下的一次 `GET`，不引入对 `uiWorkspace` 或 Desktop 插件的依赖——那些人只在 M10/M9 的选择器里出现。

---

## M2 模板引擎

> 文件：`src/client/skill-card/template.ts`、`src/client/skill-card/policy.ts`

### 情境 S

用户写的是一整份 HTML 文档，其中一对注释标出子代理要填的那一段。系统要从这份文档里回答两个问题：

1. **有没有恰好一对可用的区间？**（这份模板能不能运行）
2. **这份文档有没有夹带危险东西？**（脚本、事件处理器、外链）

它**不再需要回答"这个 skill 该产出哪些字段"**——那个问题随字段一起消失了。第二版的分析器是个契约推导器，今天它只是一个"能不能用"的判定器，因此小得多。

难点仍然在 **HTML 不是正则能可靠解析的语言**：内容策略要遍历元素与属性，而 `<tr>`、`<tbody>` 的结束标签可以省略、浏览器会自动补全，字符串扫描会误判嵌套。

### 任务 T

1. 找到模板里唯一的那对区间标记，作为"要填哪里"的唯一答案，并**指出位置**。
2. 用封闭的违规码拒绝所有不可用的标记形态（缺失、未闭合、重复、闭合先于开启）。
3. 拒绝仍以占位符语法书写的旧模板（`placeholder-syntax`），而不是静默渲染花括号。
4. 拒绝违禁构造（脚本、事件、危险 URL、外部资源、外部 CSS），并指出位置。
5. 全过程在浏览器里跑——宿主半是 Node，没有 DOM。

### 行动 A

#### 模板语言只有一对标记

```
区间 := "<!--" 空白? "template-begin" 空白? "-->" 任意内容 "<!--" 空白? "template-end" 空白? "-->"
```

扫描用 `regionMarkerPattern(name)` 生成的正则（**每次调用新建一份**——共享的全局正则会把它自己的 `lastIndex` 带到别的调用方），结果只有四种：

| 扫描结果 | 违规码 | 含义 |
| --- | --- | --- |
| 两个标记各出现一次，且开启在前 | —— | 区间可用 |
| 两个标记都不出现 | `region-missing` | 没有说明要填哪里 |
| 只有一个，或闭合先于开启 | `region-unclosed` | 不成对 |
| 任一标记出现两次以上 | `region-repeated` | v1 只支持一对 |

**v1 明确不支持**：多区间、嵌套区间、自定义标记名、标记里写参数。这些不是"以后再补"，而是这一版没有的语法；写出来会被当作缺标记或重复标记拒绝。

#### 注释即需求

整份文档随提示词逐字发出（`<output_document>…</output_document>`），区间里的注释是"填什么"的唯一载体。因此：

- 解析模板**只为检查内容策略**，检查完就丢弃；**绝不把解析结果再序列化回去**——那样会删掉注释，而注释正是子代理要读的说明。
- 文档只以用户写下的字符串形态流转（存储、提示词、拼接），注释与空白保持原样。
- 模板体积上限 `WORKBENCH_TEMPLATE_MAX_BYTES = 32 * 1024` 在**存储时**强制，所以整份文档进提示词的最坏情况是有界的。

#### 为什么分析放在客户端

需求 FR-4 原来写的是"宿主解析模板并反推契约"。反推已删除，但"分析放在客户端"这条结论**仍然成立，而且理由更强**：内容策略必须遍历真实的元素与属性，而**宿主没有 DOM**，手写 HTML 扫描器是个稳定的缺陷来源。浏览器有经过验证的解析器，模板本来也在这里编辑和渲染。

宿主半因此不需要任何 HTML 解析依赖，也不需要校验契约——契约是两端共享的一个常量。

#### 解析用惰性容器

```ts
const template = document.createElement('template')
template.innerHTML = html   // 惰性：不执行脚本、不加载资源、注释原样保留
const content = template.content
```

#### 违禁构造清单

保存前逐条检查，命中即拒绝并给出位置：

| 禁止项 | 判定方式 | 违规码 |
| --- | --- | --- |
| `<script>` 元素 | 标签名匹配 | `script` |
| 事件属性 | 属性名以 `on` 开头 | `event-attribute` |
| 危险 URL scheme | `href`/`src`/`srcset`/`action`/`formaction`/`poster`/`data`/`cite`/`background`/`xlink:href` 的值以 `javascript:` / `vbscript:` / `data:text/html` 开头 | `unsafe-url` |
| 外部资源元素 | `img`、`iframe`、`object`、`embed`、`link`、`video`、`audio`、`source`、`track`、`input[type=image]`、SVG `use`/`image` | `external-element` |
| CSS 外链 | `<style>` 文本或 `style` 属性里的 `@import` 与非片段 `url(...)` | `external-css` |

`url(#id)` 属于片段引用，是允许的：它指向同一份文档，是内联 SVG 滤镜与渐变的写法。

这五个码，加上 `region-missing`、`region-unclosed`、`region-repeated`、`placeholder-syntax`，构成分析器**全部**的违规词表；编辑器为每个码准备一条本地化文案。

**允许什么：HTML 标签与 CSS 零限制。** 这是需求决策 7 的原话。被禁的只有"能执行代码"和"能联网"这两类，它们对"配置显示样式"毫无必要。

**规则只写一份。** 分析器（拒绝）与渲染器（清洗）共用 `policy.ts` 里的同一批判定：分析器漏掉一条，渲染时就会被静默移除，用户会以为模板生效了。

#### 违例的位置：一个可选的源码偏移

每条违例除了码与位置文案，还可以带一个 `offset`（模板文本里的字符下标）。它的精度分两档，**这个差别写进了类型的注释里**：

- **精确**：文本扫描类——区间标记、占位符残留、声明块里的每一行。扫描时手里就有匹配的 `index`，报的就是它。
- **近似**：五个内容策略码。它们来自遍历解析后的 DOM，而 DOM 不带源码区间，所以只能取"该标签名首次出现的位置"（`approximateTagOffset`）。同一个标签出现多次时它指向**第一个**，未必是肇事的那一个——对"把光标放到那一行"够用，但不能当成精确位置来宣称。
- 锚点都找不到时**不给**这个字段：伪造一个位置比不给更糟。

`offset` 由编辑器消费（M10 的违例跳转），分析器自己不解释它。声明块解析出的 `actions` 也挂在同一个分析结果上，那部分归[按钮触发执行 · M1](workbench-skill-card-actions-design.md#m1-动作声明模板侧)设计。

### 结果 R

- `analyzeTemplate(html)` 返回 `{ region, actions, violations }`：区间在哪、声明了哪些目标（声明块本身归按钮触发执行那份设计），以及每一条拒绝原因与位置。
- 缺失/未闭合/重复的标记、占位符语法、违禁构造都在**保存前与运行前**被拦下，用户看到具体位置，不会出现"存进去了但一运行就出问题"。
- 这个模块只在客户端运行，宿主不需要任何 HTML 解析依赖，也不再承担契约校验。

---

## M3 隔离渲染

> 文件：`src/client/skill-card/render.ts`、`src/client/skill-card/ShadowHtml.tsx`

### 情境 S

这一步要把两样东西拼成一份文档，再放进一棵 DOM：**用户写的骨架**，以及**子代理回填的那段区间 HTML**。

两个都是不可信来源，但不可信的方式不同：

- **用户的骨架是自伤面**——他自己写的，但模板这种东西天生会被复制粘贴、将来会被分享导入。网上抄一段表格样式，里面常常带着 `<style>`，而用户根本不知道它的作用域是全局的。后果很具体：`* { display: none }` 会让**整个应用白屏**。
- **回填的片段是模型产出**——它读过模板、skill 以及 skill 工具返回的一切。任何能往 skill 读得到的文件里写东西的人都能影响它。

第二版的片段是"一组命名值、逐个按纯文本插入"，现在的片段是一段 **HTML**。同一个注入链，最后那一环从"文字"变成了"标记"，所以这里的工作量比第二版大：拼接、清洗、挂载三步都不能省。

### 任务 T

1. 让用户可以任意写 HTML 和 CSS（外观完全自由）。
2. 用户样式**不得影响卡片之外**，外部样式也不得干扰卡片内部。
3. 不得执行代码、不得联网。
4. 回填的片段在进 DOM 前**必须过一遍清洗**：M2 的同一批判定，这次是移除而不是拒绝。
5. 骨架必须**逐字节保持用户写下的样子**：子代理改不到样式、标题与外壳。

前三条都不牺牲"外观自由"——少掉的只有"能执行代码"和"能改到卡片以外"。

### 行动 A

#### 先拼接，后解析

```ts
/** 把结果里的 html 放回模板的区间。纯字符串操作，骨架其余部分一个字都不动。 */
export function filledTemplate(template: string, html: string): string {
  const region = findRegion(template)
  if (region === undefined) return template
  return template.slice(0, region.start) + html + template.slice(region.end)
}
```

**这一步为什么是字符串拼接而不是 DOM 操作：** 骨架逐字节不变是这一版的核心承诺（需求 FR-7）。用字符串切一刀，骨架从来没有被解析、也没有被重新序列化过，所以它与用户写下的那份**按构造**一致——不需要漂移检查，因为没有漂移的余地。用户文档里的注释也正是靠这一点活下来的。

区间缺失时（理论上不会发生：保存与运行前都查过）原样返回模板，不抛异常。

#### 用影子根承载

```ts
const host = document.createElement('div')
const root = host.attachShadow({ mode: 'open' })
```

用户样式不外泄，外部样式也不进来。

**主题令牌不需要桥接。** `--dsw-*` 定义在 `:root`（[base.css:6](../deepseek-harness/packages/client/ui-theme/src/styles/base.css#L6)），而 CSS 自定义属性是**继承属性**，本来就会穿过影子边界。宿主元素天然继承到这些令牌，影子根里的用户模板可以直接写 `var(--dsw-alias-label-primary)`。唯一要守的纪律是**不要在 `:host` 上写 `all: initial`**，那会切断继承。

这条很容易被想复杂：一开始我们准备了"把令牌读出来再注入影子根"的方案，查证后发现是多余的。

#### 挂载三步

```
① 解析拼好的整份文档（template 元素，惰性：不执行脚本、不加载资源）
② 清洗：跑 M2 的同一批判定，命中即移除（元素移除、属性删除）
③ shadowRoot.replaceChildren(content)
```

```ts
export function renderTemplate(root: ShadowRoot, html: string): void {
  const content = parseTemplate(html)
  stripForbidden(content)
  root.replaceChildren(content)
}
```

**第 ③ 步不序列化回字符串**，直接搬运 DOM 节点，避免二次解析这个隐患。

#### 清洗是承重的，不是兜底

```ts
// 一份样式表只在"它的引用"范围内是离线的，所以伸向外面就整块删掉：
// 只删那一条引用会留下一份只生效一半的样式表。
if (element.tagName.toLowerCase() === 'style' && hasExternalCss(element.textContent ?? '')) {
  element.remove()
  continue
}
```

第二版的清洗是纵深防御：模板在保存时已被拒绝，脏数据只可能来自被外部改动的存储文件。今天**主来源是模型**——子代理回填的片段从来没有经过"保存"这一步，它可以把 `<script>`、`onerror=` 或 `@import url(...)` 直接带进文档。所以这条路径每次运行都要跑，而且**移除以元素为单位**：整个 `<style>` 删掉，而不是只删那条 `@import`。

清洗的规则与分析器共用 `policy.ts`，两边必须一致：分析器漏掉一条，渲染时就被静默移除，用户会以为模板生效了。

### 结果 R

- 用户模板里写 `* { display: none }`，应用其余部分照常。
- 子代理回填 `<img onerror=…>` 时，`<img>` 整块被移除；回填 `<style>@import url(x.css)</style>` 时整块 `<style>` 被移除。
- 骨架——样式、标题、外壳——在多次运行之间逐字节不变（`render.spec.ts` 用前缀比对断言这一点）。
- 用户模板能直接用应用的主题令牌，观感与整体一致。

---

## M4 存储域与配置服务

> 文件：`src/skill-card-spec.ts`、`src/skill-card-store.ts`

### 情境 S

要持久化两样**性质完全不同**的东西：

- **用户资产**：选了哪个 skill、为它写了什么模板。用户丢了会心疼。
- **执行缓存**：上一次运行的结果。可重建，体积可能很大，用户可能想单独清掉。

而工作台已经有一个发布出去的布局域（`workbench_layout`，随 P1–P4 上线）。往它里面加表意味着动一份正在生产环境写数据的 schema。

### 任务 T

1. 开一个独立域，三张表分别承载卡片配置、模板、结果。
2. 提供与布局服务同构的读写接口与乐观并发（revision）。
3. 体积在入域**之前**裁剪或拒绝。
4. 一条坏记录不能拖垮整个工作台。

### 行动 A

#### 域声明

```ts
export const WORKBENCH_SKILL_CARD_DOMAIN = defineDomain({
  name: 'workbench_skill_card',
  version: 1,
  layout: 'per-record',
  invalidRecords: 'backup-and-skip',
  tables: {
    [WORKBENCH_CARD_TABLE]: domainTable<string, WorkbenchCardConfigRecord>(cardSchema),
    [WORKBENCH_TEMPLATE_TABLE]: domainTable<string, WorkbenchTemplateRecord>(templateSchema),
    [WORKBENCH_RESULT_TABLE]: domainTable<string, WorkbenchResultRecord>(resultSchema),
  },
})
```

`per-record` + `backup-and-skip` 与已有的布局域一致：**一条读不懂的坏记录会被移到一边并跳过，而不是让启动失败**。

#### 三张表与键

| 表 | 键 | 值 |
| --- | --- | --- |
| `card` | cardId | `{ skill?: string; name?: string; model?: WorkbenchCardModel; workspace?: WorkbenchCardWorkspace }` |
| `template` | `${cardId}_${skill}` | `{ html: string }` |
| `result` | cardId | `{ skill, executedAt, stopReason, model?, structured?, outputText?, diagnostic?, editedAt? }` |

**`structured` 现在只装一个 `html`**（填好的那段区间）。旧版本存下的命名值仍是合法记录——存储层不校验契约，卡片那边发现没有 `html` 时按"尚未运行"呈现。`diagnostic` 是失败文本：提供方写的，或由 M5 从 `agent/error` 捕获到的。`editedAt` 是第十版加的：它只在有人**手工编辑**过这段区间时出现，缺席表示每个字节都来自一次运行（写入路径见 M10「结果的手工编辑」）。

**`card.model` 与 `result.model` 是第十二版加的，两者是不同的事实。** 卡片的 `model` 是**用户的选择**：它决定下一次运行跑在哪条路由上，缺席表示"这张卡继承会话的模型"（也就是这一版之前所有卡片的状态）。结果的 `model` 是**那次运行的记录**：它由 M5 在启动时写死，只回答"这份结果出自哪条路由"。两者都存 `{ provider, model }` 这一对，都不带 `reasoningEffort`（见 M1）。

两者的缺席也各不相同，而且都不能被"补一个默认值"糊过去：卡片没有 `model` 时运行**不传** `agentOptions`，因此子代理继承会话的路由——这时宿主并不知道解出来的路由是什么，所以结果里也**没有** `model`，运行详情里就没有那一行。这是这一版唯一一处"模型看不见"，它的成因是宿主没有第二个事实来源，而不是忘了写。

模板用复合键，因为需求决策 15 要求**模板跟 skill 走**：切回原来的 skill，原来的模板还在。

**`card.workspace` 是第十三版加的，它与 `card.model` 是同一类事实：用户的选择，不是某一次运行的记录。** 它和 `name` / `skill` / `model` 一起躺在那条记录里，因此写入必须是**合并**：只改名字不会把目录打掉，只换目录也不会把 skill 打掉。`workspace: null` 的语义与另外三个字段一致——**清掉这张卡的目录**，它退回"不能运行"（`workspace-missing`），而不是退回某个默认目录；四个字段都为空时整条记录被删除。

**没有迁移，是刻意的。** 升级上来的卡片读回来就是没有 `workspace`，在用户自己选一个之前不能运行。产品负责人的决定是"不要替用户推断目录"：任何自动填充（最近用过的目录、会话的目录、第一个工作区）都会让一次运行发生在用户没挑过的地方，而结果上不会写这件事。代价写在需求 §14.8 的已知限制里：老卡片升级后第一次要用，必须先打开配置页选一个目录。

#### 约束：store 写入的每个字段都必须在 schema 里声明

这条是**用一次真缺陷换来的**，写在类型注释里也写在需求 §17.5 里。

P10 给卡片记录加了 `name`：store 会写它，写入也成功返回，但 `workbenchCardConfigSchema` 只声明了 `skill`。zod 默认丢弃未声明的键，于是**加载时名字被丢掉**——重启后卡片退回 id，而 skill 名照旧显示（那个字段恰好声明过）。用户看到的是"存了，重启又回退"，而日志里没有任何一次失败。

规则由此确定：**store 写入的每个字段都必须出现在 `src/skill-card-spec.ts` 的 schema 里**。这条不能靠"记得同步两处"来守，所以有一个专门的包级测试 `skill-card-spec.spec.ts`：它拿 `{ skill, name }` 整条解析并断言**逐字段相等**（不是"解析不报错"——那就正好漏掉被丢弃的字段）。

**本轮第一次按这条规则新增字段**：手工编辑结果写 `editedAt`，`workbenchResultSchema` 与它**同一次改动**里声明，`skill-card-spec.spec.ts` 也加了对应用例（整条往返不丢字段；没有该字段的记录不会被凭空补上；`editedAt: 0` 也保留）。这条约束在过去是"补上漏掉的字段"，这一轮是它要守住的常规路径。

**第十二版按同一条规则一次加了两个字段**：`workbenchCardConfigSchema.model` 与 `workbenchResultSchema.model`，共用同一个 `workbenchCardModelSchema`（`{ provider, model }` 两个字符串）。`skill-card-spec.spec.ts` 因此多了四条：卡片带模型整条往返（provider 取 `vendor/gateway`，专门用一个带斜杠的 id 钉住"存的是两字段"）、没模型不被凭空补上、结果带模型整条往返、继承来的结果没有 `model`。**这就是这条约束存在的意义**：加字段的人不会忘记 schema，因为他加完之后 spec 会告诉他。

**第十三版在同一条规则上再加一个字段**：`workbenchCardConfigSchema.workspace`（`{ path }` 单字段对象），与 store 写入**同一次改动**里声明，`skill-card-spec.spec.ts` 同步多了两条：一条是带 `workspace` 的整条往返（同一份记录里还有带斜杠的 provider 与一条 Windows 路径，两样都不许在中途被重新解释），另一条同时钉住"只写了目录的记录也保留"与"没有目录的记录不会被凭空补上一个"。它守的是同一个症状——目录写进去、重启后消失，卡片于是**毫无提示地变成不能运行**，而日志里没有一次失败。这一条把它与运行门槛直接连在一起：字段被丢 = 卡片静默不可运行，而这一次连一句失败都没有。

**清空不是删除。** 补丁里的 `model: null` 表示"这张卡改回继承会话的模型"，与 `name: null` / `skill: null` 同一套语义；第十三版把 `workspace: null` 加进同一组（"清掉目录，退回不能运行"）。四个字段一起写在一个记录里，所以写入是**合并**而不是覆盖——只改名字不会把模型或目录打掉，只改目录也不会把 skill 打掉。四个字段都为空时整条记录被删除（否则会留下一条没有内容的卡片记录）。这一步由 `skill-card-store.spec.ts` 逐条钉住。

**结果被裁剪时 `model` 不会丢。** `trimResult` 在超预算时先丢文本、再考虑结构化值，`model` 与 `skill`/`executedAt`/`stopReason` 一样属于**基础记录**：两个短 id，且它是"这份结果出自哪条路由"的答案，丢了就等于把用户送回猜的状态。

**分隔符必须是下划线，不能用冒号。** `per-record` 布局把记录键编码成**文件名片段**，只接受 `[a-zA-Z0-9_-]`（[per-record-unit.ts:39](../deepseek-harness/packages/storage/storage-json/src/per-record-unit.ts#L39)）；冒号在 Windows 文件名里非法，会让整个写入被拒。卡片 id 与 skill 名都不允许下划线，所以第一个下划线永远是分隔符，解析无歧义。这条是 P6 真机验证时才暴露的——内存假表不会触发路径编码。

#### 为什么开新域而不是扩已有的

三条生命周期不同：

- 布局（已有）是 UI 状态；
- 卡片配置是用户资产；
- 结果是可以随时丢弃的缓存。

分开之后，将来想"清掉所有缓存腾空间"只动一张表，不会碰到用户资产。代价是多一次域开关——由 M7 里同一个 `ctx.effect` 承担，不是额外的生命周期负担。

#### 服务接口

与 `WorkbenchLayoutService` 同构，使用窄缝以便用假表驱动测试：

```ts
export interface SkillCardTable<T> {
  read(key: string): Promise<T | undefined>
  write(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  entries(): Promise<readonly (readonly [string, T])[]>
}

export class WorkbenchSkillCardStore {
  get revision(): string                       // `${bootStamp}:${changeCount}`
  read(): WorkbenchSkillCardSnapshot
  async write(patch: WorkbenchSkillCardPatch): Promise<WriteResult>
  async putResult(cardId: string, record: WorkbenchResultRecord): Promise<void>
  takeTemplate(cardId: string, skill: string): string | undefined
  dispose(): void
}
```

`WriteResult` 三态：`ok` / `invalid`（带原因）/ `conflict`（带当前快照）。与布局服务同一套语义，客户端处理冲突的代码可以照抄。

#### 体积裁剪

在**入域之前**按字节处理，不让超大值进存储：

- 模板超 `WORKBENCH_TEMPLATE_MAX_BYTES` → 直接拒绝（用户在编辑器里就看到错误）。
- 结果超 `WORKBENCH_RESULT_MAX_BYTES` → **截断文本输出，保留结构化值**。理由是结构化值是渲染要用的，文本输出只是「运行详情」里读原始输出的兜底。

### 结果 R

- 配置与结果互不影响，可以分别清理。
- 已发布的布局域一字未改。
- 损坏的单条记录不会导致工作台起不来。
- 存储 schema 覆盖 store 写入的每个字段，所以"存进去、重启又回退"这类缺陷有专门用例守着（`skill-card-spec.spec.ts`）。第十二版的两个 `model` 字段走的是同一条路。
- 卡片的选择与结果的记录各自带着路由：前者决定下次跑在哪，后者说明这次出自哪，两者不在同一处被追认。
- 卡片的目录与另外三个字段住在同一条记录里，所以合并与清空是同一条既有语义的第二次使用，不是新的存储机制：改名字不会打掉目录，`workspace: null` 只清目录，四个都空才删记录（`skill-card-store.spec.ts`）。**而它没有迁移**：老卡片读回来就是没有目录，这一点由"没有该字段就真的没有"的用例守着。

---

## M5 执行服务

> 文件：`src/skill-card-runner.ts`

### 情境 S

这是整个功能的核心，也是风险最集中的地方。用户点一下"运行"，系统要做到：

**在一个活着的会话上，用它的 Agent 作用域读出 skill，把用户写的整份文档交给一个新起的子代理，只收它填好的那一段。**

看起来直白，但上游有三条硬约束：

1. **子代理的 `parent` 是必填的活 Agent 对象**，不是 sessionId。而且服务会校验"这必须正是 registry 里那一个"，否则拒绝（`UNAUTHORIZED`）。
2. **skill 目录是分层且按作用域读的。** 真实 web-app 组合里宿主平面的 `skill-filesystem` 行是禁用的，**裸 `ctx.skills.list()` 返回空数组**。只有以 Agent 为 `scope` 才能读到用户真正拥有的 skill。所以"跟随当前活跃会话"不是产品偏好，是技术必需。
3. **上游没有任何一处从 agent 回合之外启动子代理。** 所有现存调用点（`tool-subagent`、`workflow-ptc`、`agent-team`）都是回合内发起的。我们是第一个，这条要作为风险记入 M12。

还有一条只在出错时才显形的约束：**子代理这条缝把出错的子代理压成 `stopReason: 'error'` 并丢掉错误对象**，所以"为什么失败"必须从别处取（见下方"子代理自身的失败要单独捕获"）。

### 任务 T

1. 按 sessionId 找到活 Agent；拿不到就返回可操作的降级态。
2. 在该 Agent 作用域下解析工作目录并读出 skill 正文。
3. 起一个**独立子代理**，把模板原文（逐字、注释在内）放进 prompt，用那份**固定契约**约束它只回报填好的区间。
4. 不共享会话上下文、继承会话的模型、继承会话的权限。
5. 可取消、有超时、失败恰好重试一次。
6. **捕获子代理自身的失败**，把它写进结果的诊断字段，而不是只留一个 `error`。
7. **只在卡片自己有目录、且那条路径现在还是目录时启动子代理**；否则拒绝——**不**回退到会话的目录（第十三版，判据见下）。

### 行动 A

#### 关键路径

```ts
async function run(request: WorkbenchRunRequest): Promise<RunOutcome> {
  // 1. 契约形状预检。契约是固定常量，所以这一步只拦"请求压根没带对象根契约"。
  if (!looksLikeContract(request.outputSchema)) return { kind: 'schema-rejected' }

  // 2. 模板是使用卡片的前置条件，由宿主自己从存储回答——不采信客户端说"我有模板"。
  const selection = store.selection(request.cardId)
  if (selection.skill === undefined) return { kind: 'not-configured' }
  if (selection.template === undefined) return { kind: 'template-missing' }

  // 3. 取活 Agent。取不到就是"无活跃会话"，不做 resume —— 见下方说明。
  const agent = host.agents.get(request.sessionId)
  if (agent === undefined) return { kind: 'session-not-live' }

  // 4. 子代理能力检查：provider 必须支持 outputSchema。
  const provider = host.subagents.getProvider(config.subagentProvider)
  if (provider === undefined || !provider.capabilities.outputSchema)
    return { kind: 'provider-unavailable' }

  // 4b. 卡片写了模型就先把这条路由验证掉（第十二版，见下一节）。验证是**异步**的，
  //     所以它与"这张卡已经在跑"之间不能留缝隙：占用检查排在 await 之后、注册之前。
  if (selection.model !== undefined) {
    const refusal = await modelRefusal(provider, selection.model)
    if (refusal !== undefined) return refusal
  }

  // 4c. 这张卡有没有地方可跑（第十三版）。没有目录、或那条路径已经不是目录，都在启动子代理、
  //     也在任何模型调用之前拒绝。拒绝而不是回退到会话的目录：一次跑在别处的运行，结果不会
  //     说自己跑在别处。同样是异步，所以和 4b 一起排在占用检查之前（顺序说明见下一节）。
  if (selection.workspace === undefined) {
    return { kind: 'workspace-missing', detail: `no workspace directory is configured for card "${request.cardId}"` }
  }
  const found = await this.options.statDirectory(selection.workspace.path)
  if (!found.exists || !found.isDirectory) {
    return { kind: 'workspace-invalid', detail: `the workspace directory "${selection.workspace.path}" does not exist or is not a directory` }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => { controller.abort() }, config.runTimeoutMs)

  // 5. Agent 作用域下解析 cwd 与 skill。
  const cwd = await cwdFor(agent, controller.signal)
  const skill = await host.skills.get(selection.skill, { cwd, scope: agent, signal: controller.signal })
  if (skill === undefined) return { kind: 'skill-not-found' }

  // 6. prompt = 技能正文 + 整份文档（逐字，注释在内）+ 任务说明。
  const text = renderWorkbenchSkillPrompt(skill, selection.template)

  // 7. 启动。卡片写了模型就把那条路由作为 agentOptions 传下去；没写就**不传**这个字段，
  //    子代理因此继承会话模型。不传 toolFilter = 不限制工具。
  const activation = await host.subagents.startActivation({
    provider: config.subagentProvider,
    label: `workbench:${request.cardId}`,
    signal: controller.signal,
    delivery: 'caller',
    request: {
      parent: agent,
      prompt: [{ type: 'text', text }],
      cwd,
      outputSchema: request.outputSchema,
      ...selection.model === undefined ? {} : { agentOptions: selection.model },
    },
  })

  // 8. 先认领这个子代理，再等结果：它可能在等待期间就报错，而错误只走事件总线。
  run.childId = activation.childId
  const result = await activation.result
  run.childId = undefined
  await activation.dispose()
  clearTimeout(timer)
  return { kind: 'settled', result }
}
```

**注意第 2 步与第 6 步的关系。** 客户端在发起运行前已经查过一次模板（为了给用户即时反馈），但宿主**再查一次自己的存储**：进程边界不可信，而且"有没有模板"本来就是宿主自己的答案。整份模板文本正是从这里进入 prompt 的——它不经过客户端，也不经过任何重新序列化。

> 上面第 7 步是**装配期已确认 `startActivation` 存在之后**的路径。这个方法从 `0.2.1-alpha.2` 起才有，`0.2.0-rc.2` 只有 `start` / `startContinuable`：在那里装配期的探测会记录"没有"，运行控件随之为灰，`runner.start()` 也会在走到这里之前拒绝（`run-unavailable`）。窄接口里的注写明了这一点。

#### 模型：钉住这次运行的路由（第十二版）

**卡片写了模型，就按那条路由跑；写不通就拒绝，绝不回退到会话的模型。** 回退是最坏的一种"成功"：卡片显示 A，运行跑了 B，结果上写着看不懂的东西，而用户以为自己看到的是 A 的产出。

三种拒绝，全部发生在**创建子代理之前**（`modelRefusal()`，因此也发生在任何模型调用之前）：

| 情形 | 判据 | 错误码 | 消息里有什么 |
| --- | --- | --- | --- |
| 后端不支持选模型 | `provider.capabilities.agentOptions === false` | `provider-unavailable` | 后端名 + 那条路由（`"provider/model"`） |
| 模型 provider 不存在 | `ctx.llm.listModels(provider)` 抛错 | `provider-unavailable` | provider 名 + 那条路由 + 上游的错误文本 |
| 模型不在该 provider 的目录里 | 返回的 `id` 列表里没有它 | `model-unavailable` | 那条路由 |

**为什么用 `ctx.llm.listModels(provider)` 而不是查一个本地表。** 这是宿主唯一能回答"这台部署现在到底能路由什么"的地方：目录由适配器给出，凭据、代理、模型下架都会改变它。契约里那个 `llm` 窄缝只要求一个 `listModels(provider): Promise<readonly { id: string }[]>`，多的一个字段都不读。

**为什么拒绝要排在占用检查之前、而占用检查要排在 `await` 之后。** 校验是异步的，如果先在 `await` 之前查"这张卡是不是在跑"，那么两个同时开始的请求会**都**通过检查，然后都注册成运行——这正是 `run-in-progress` 想防的事。所以顺序是：同步前置条件 → `await` 路由校验 → 同步占用/并发检查 → 同步注册。`await` 之后到注册之间没有第二个异步点，检查与占位因此仍然是一次原子动作。

**`agentOptions` 只在卡片写了模型时才出现在请求里。** 不是传一个空对象，也不是把 `provider`/`model` 分开传：上游的 `resolveChildAgentOptions` 会把请求里的字段整体铺在父路由之上，一个半截的覆盖会让子代理跑到一条不存在的路由上。上游也会在启动时校验这个能力（`SubagentCapabilities.agentOptions`），宿主这一份检查只是为了把拒绝提前到"还没起子代理"的地方，并让它带一句能读的话。

**记录上写的是这次运行的路由，不是卡片当前的路由。** `toResultRecord` / `toBareRecord` 从 `RunInput.model` 取值——那是启动时定下的那一份。用户之后在配置页换一个模型，不会让昨天的结果改口。没有模型时两个函数都不写这个字段，`trimResult` 与手工编辑都把它当基础记录对待（M4）。

**裸运行（skill 目标）用的是同一张卡的选择。** 一次裸运行由某张卡上的按钮触发，`cardId` 就是那张卡，所以它的路由、模板前置条件与卡片运行来自同一条 `selection`——只是 `skill` 取自按钮而不再取自卡片。三处提示词仍然各不相同，路由的取法只有一种。

#### 工作目录：一道门，还不是一间房（第十三版）

**这一节要说两件事，第二件比第一件重要：门是有的，房间没有。**

**门。** 启动子代理之前，宿主用**自己的存储**回答一个问题——这张卡有没有一个可以跑的目录？没有 → `workspace-missing`；有、但那条路径现在不是目录（不存在，或者是个文件）→ `workspace-invalid`，**消息里带完整路径**（"那个目录没了"要说得清是哪一个才可操作）。两条都在启动之前，因此**不花任何模型调用**，也**不会产生一个子代理**：`skill-card-runner.spec.ts` 对四种情况（没目录、目录不存在、路径是文件、裸运行）都断言 `fake.activations` 为空。

三处细节值得写下来：

- **顺序。** 目录检查是一次 `await`（`stat()`），所以它和 4b 的模型校验排在同一个位置：**在所有异步校验之后、在占用检查之前**。理由与 4b 相同——在 `await` 之前查"这张卡在不在跑"，两个同时到达的请求会**都**通过。
- **两条消息说的不是一回事。** `workspace-missing` 点名的是**卡片**（用户要做的是"去给这张卡选个目录"），`workspace-invalid` 点名的是**路径**（用户要做的是"去看那个目录怎么了"）。这也是两个码不合并的原因（M1）。
- **客户端与宿主各判一次。** 客户端三个入口（运行、微调、就地确认面板）共用一个 `workspaceRefusal()`；宿主不信客户端，读自己的 `selection(cardId)` 再判一次。确认面板那一侧还多一道：面板打开**之前**就按**目标卡自己的**目录判（不是当前这张卡的），因为"问了却一定跑不起来"浪费的是用户唯一的那点注意力。

**房间：没有。** 这是这一版必须写在最前面、而且不许含糊的缺口：

| 事实 | 今天 | 要真的成立需要 |
| --- | --- | --- |
| 卡片记下目录 | ✅ `card.workspace.path` | — |
| 据此放行 / 拒绝一次运行 | ✅ 启动前 `stat()` 一次 | — |
| 子代理的**有效工作目录** | ❌ 仍是会话的（`cwdFor(agent)` → `startActivation({ request: { cwd } })`） | 一次以卡片目录为 `cwd` 的启动 |
| **文件沙箱的根** | ❌ 仍是会话的（`sandboxPolicy.resolve().workspaceRoot` 不变） | `agents.create({ meta: { cwd } })` 式的运行，**未实现** |

把它说准，需要三句话：

1. **`startActivation` 的 `cwd` 只改子代理的有效工作目录，不改文件沙箱的根。** 机制在附录 C 里：那个 `cwd` 由 `workingDirectory.set(child, …)` 写进"有效工作目录"，而**会话头是不可变的原始项目**，子会话头继承的又是**父**的 `cwd`；文件沙箱的根恰恰取自 `session?.header.cwd`。实测过两件事，与这条机制一致：子代理的 `session.header.cwd` 仍是父会话的，`sandboxPolicy.resolve().workspaceRoot` 也仍是父会话的。所以就算把卡片的路径塞进那个 `cwd`，写文件仍然落在父会话的沙箱里——那是"看起来换了目录"，不是"换了个能写的地方"。
2. **这一版连那个 `cwd` 都没有换。** 启动请求里的 `cwd` 来自 `cwdFor(agent)`（会话的工作目录服务，或会话头），卡片的 `workspace.path` 只被用来 `statDirectory()` 一次。`dsh-workbench` 全量检索没有任何一处读 `sandboxPolicy`，也没有任何一处调 `agents.create`。
3. **所以：它不是沙箱隔离。** 这张卡的目录目前是**一道门**——"它有地方可跑才跑"；不是**一间房**——"它只能在那间房里动手"。描述这一版时不要写"卡片在自己的目录里跑"，也不要写"写入被限制在所选目录里"；准确的只有一句：**它只在自己有目录时才跑。**

**这个缺口在测试里的形状也值得记一笔。** 门那一半有断言（四条拒绝 + `activations` 为空）；房间那一半没有，也不可能有"断言它不成立"的用例。反过来，`skill-card-runner.spec.ts` 里唯一断言启动请求 `cwd` 的地方读到的是 `/repo`——那是 fake 的**会话**工作目录，而 fake 的卡片目录恰好也叫 `/repo`。两个同名值让这条断言看不出差别，这个巧合正好是这个缺口的样子：要看见它，得先给 fake 一个与会话目录不同的卡片目录。

#### 整份文档怎么进 prompt

`renderWorkbenchSkillPrompt(skill, template)` 拼出模型看到的东西，形状固定：

```
<skill_content name="…">
<skill_resources>…</skill_resources>

<skill_instructions>
…skill 正文…
</skill_instructions>
</skill_content>

<output_document>
…用户写的整份模板，注释与空白逐字保留…
</output_document>

Apply the skill above to the current workspace now.

Then fill in the part of the document below that sits between <!-- template-begin --> and
<!-- template-end -->, and report only that part through the structured-output tool as `html`.

- The comments inside the document state what each part must contain. Read them and follow them.
- Everything outside that region is kept exactly as written, so do not restate or modify it.
- Report HTML, not a description of it.
- Build one entry per item the skill returned. Do not invent entries to fill the document out.
```

三点值得注意：

- **文档逐字携带，从不重新序列化。** 解析它会把注释删掉，而注释正是"填什么"的唯一载体。
- **只有区间回来。** 子代理不书写样式、标题与外壳，所以骨架不可能在两次运行之间漂移（M3 的字符串拼接即由此成立）。
- **提示词的最坏情况有界。** 模板存储时就受 `WORKBENCH_TEMPLATE_MAX_BYTES = 32 * 1024` 限制，所以这个 `<output_document>` 不会无限膨胀。

#### 微调怎么进 prompt

`renderWorkbenchRefinePrompt(skill, template, previous, instruction, payload?)` 与卡片运行共用同一个 skill 块与同一个 `<output_document>`，只把"要产出什么"换成"要改什么"：

```
<skill_content name="…">…</skill_content>
[<row_data>…</row_data>]                ← 带行数据时才有，位置与另外两种提示词一致

<output_document>
…存盘模板，逐字…
</output_document>

<previous_result>
…上一版区间 HTML，逐字…
</previous_result>

<revision_request>
…用户那句话，逐字…
</revision_request>

Revise the previous result above as the revision request asks, and report only the
region content through the structured-output tool as `html`.

- Change only what the revision request names; keep everything else exactly as the previous result wrote it.
- The comments inside the document still state what each part must contain.
- Report HTML, not a description of it.
```

- **顺序就是要求。** 先给"填哪里"的文档，再给"那里现在是什么"，最后给"要改成什么"：模型不需要在一段数据里自己找哪一部分是待改的。
- **上一版逐字携带，不做摘要。** 摘要是第二份、有损的事实来源，而这里恰好在要求"没点名的部分照旧"。
- **文档仍然逐字。** 微调改的是区间内容，骨架一个字都不动，所以它照旧只以用户写下的字符串流转。
- **`<previous_result>` 里的内容来自上一次成功的捕获**，已经过 M3 同一条清洗路径；它进入下一次提示词时不再被"信任"——它是模型自己写的东西，与 `<row_data>` 属于同一类不可信输入（M12）。

`attempt()` 的输入因此从两种形状变成三种（`RunInput` 的 `card` / `refine` / `bare`）。三种里只有 `card` 与 `refine` 会带 `outputSchema`，也只有这两种会走"捕获—重试—落盘"那条路径；`refine` 的成交方式与 `card` **完全相同**，所以 `describeFailure`、`isRetryable`、`toResultRecord` 与 `saveResult` 一行都没有为它改。（最初想给微调单独一条落盘路径，但那样就有两套"什么算成功"的判据——正是第二版踩过的坑。）

宿主上下文按本包既有做法**就地声明窄接口**，不引入无法解析的 `.d.ts`（P1 曾因某个上游包的类型无法解析而失败）：

```ts
/** 子代理启动所需的最小 Agent 面。Agent 同时充当 skill 的 scope key。 */
export interface WorkbenchAgent { readonly sessionId: string }

export interface WorkbenchSkillCardHost {
  readonly agents: {
    get(sessionId: string): WorkbenchAgent | undefined
    list(): readonly WorkbenchAgent[]
  }
  readonly skills: {
    list(options: WorkbenchSkillLookup):
    Promise<readonly WorkbenchSkillSummary[]>
    get(name: string, options: WorkbenchSkillLookup):
    Promise<WorkbenchSkillDefinition | undefined>
  }
  readonly subagents: {
    list(): readonly string[]
    getProvider(name: string): { readonly name: string; readonly capabilities: { readonly outputSchema: boolean } } | undefined
    startActivation(spec: WorkbenchActivationSpec): Promise<WorkbenchActivation>
  }
}
```

工作目录是**另一个可选依赖**，与这份窄接口分开注入——因为稳定通道的上游根本没有这个服务（见第 ⑤ 条）：

```ts
/** 有则优先，没有就回退到 agent.session.header.cwd。 */
readonly workingDirectory?: WorkbenchWorkingDirectory
```

> **`startActivation` 也是 `0.2.1-alpha.2` 才有的方法。** 稳定通道钉的 `0.2.0-rc.2` 的子代理服务只有 `start` / `startContinuable`，没有激活入口。所以窄接口里的 `startActivation` 是**可选**的：装配时（`src/index.ts`）探测一次并把结论随卡片快照下发，客户端据此禁用「运行」并写明缺的是 `startActivation` 与需要的版本；`runner.start()` 里另有一道同名的拒绝，让早已发出的点击、直接的路由调用或模板按钮得到 `run-unavailable`，而不是 `undefined is not a function`。不回退到旧 API，也不改宿主版本。工作目录的降级是"换一种取法"，这一条是"没有就是没有"——能读能改，只有不能跑。

#### 子代理自身的失败要单独捕获

这是与区间语言同期的第二处改动，解决的是另一个具体问题：**失败曾经是黑箱。**

子代理这条缝在子代理出错时只留下 `stopReason: 'error'`，**把 error 对象丢掉**。于是"模型没按契约交出 `html`"和"子代理自己崩了"在调用方看来完全一样，运行详情里也什么都没有。

上游把前者的原因放在宿主的 `agent/error` 事件上：`{ agent, turn, step, error }`。宿主订阅它，按 `agent.id === childId` 匹配到**本次运行自己起的那个子代理**，把消息落到运行记录上，最终写进结果的 `diagnostic`：

```ts
// 插件装配：订阅一次，转交 runner。
ctx.effect(() => (ctx as unknown as WorkbenchAgentErrorBus).on('agent/error', ({ agent, error }) => {
  runner.observeAgentError(agent.id, error)
}), 'workbench: child agent failures')
```

```ts
// runner：只认自己起的那个子代理，只认还在跑的那次运行。
observeAgentError(agentId: string, error: unknown): void {
  for (const run of this.runs.values()) {
    if (run.childId !== agentId || run.phase !== 'running') continue
    run.childError = messageOf(error)
  }
}

// 认领必须发生在 await 结果之前：子代理可能在运行途中就报错。
run.childId = activation.childId
run.childError = undefined
const result = await activation.result
// 子代理自己报错、提供方没写诊断时，它自己的回报就是唯一的诊断来源。
const record = result.stopReason === 'error' && stored.diagnostic === undefined && run.childError !== undefined
  ? { ...stored, diagnostic: run.childError }
  : stored
```

三条纪律：

1. **按 id 匹配，不按时间。** 别的卡片、别的会话起的子代理报错不能被算到这次运行头上；匹配不上的事件直接忽略。
2. **认领早于等待。** 事件可能在 `await` 期间到达，晚一步绑定就永远收不到。
3. **不覆盖提供方已经写好的诊断。** `diagnostic` 是"原始输出"面板要显示的东西，两处来源只能取其一，优先提供方。

失败原因因此有了落点：结果记录的 `diagnostic` → 卡片错误态 → 结果页的运行详情。

#### 五个容易搞错的地方

**① `delivery: 'caller'`——结果不推给父模型。**
上游的投递策略有两种：`'parent'` 会往父 agent 的循环里推一条结算消息，`'caller'` 只把结果返回给调用方。工作台的一次运行**不该在用户的对话里凭空多出一条消息**，所以必须是 `'caller'`。这也直接回答了"结构化结果是否进入会话记录"：**不进入**。已知现象：子代理仍会出现在父会话的子代理目录里，这是上游行为，无法关闭。

**② 取不到活 Agent 时返回降级态，而不是去"恢复"会话。**
上游另有 `ctx.sessionController.resolveAgent(sessionId)` 能解析**或恢复**冷会话。但那会带来加载持久化、启动循环等副作用，而且会让需求里的"无活跃会话"降级态永远不出现。本设计选择 `agents.get` 的纯读语义。"对冷会话直接运行"作为后续可选项，不在本阶段。

**③ `withInitiator` 不是必需的。**
上游的启动路径**根本不读 initiator**，只校验"parent 是不是 registry 里那个活的 Agent"。所以不为了形式而包一层；将来引入多步编排时再按上游惯例补上。

**④ 不传 `agentOptions` 和 `toolFilter`，是在表达"继承"。**
这两个字段的默认行为就是继承父 Agent：

- 不传 `agentOptions` → 子代理继承会话的模型与路由（需求决策 12）；
- 不传 `toolFilter` → 不限制子代理的工具（需求决策 13）。

**这是"通过不设参数来表达继承"，必须在代码注释里写明**，否则后来者很容易误加一条限制或加一个覆盖。

**⑤ 工作目录在旧通道上取不到服务，必须回退到会话头。**
`ctx.workingDirectory.ensure(agent, signal)` 是 0.2.1-alpha.2 的写法；稳定通道的 0.2.0-rc.2 **没有这个服务**，它读的是 `agent.session.header.cwd`。所以工作目录按"服务优先、会话头兜底"解析，并且 `cwd` 一路保持可选——上游的启动请求与 skill 查询本来就允许省略它（省略时子代理继承父级目录，skill 只搜用户级与内置根）。

#### 重试判据

**契约里 `html` 是唯一必需项**，所以"模型没按规定交回区间"落地成非常具体的一个事实：缺少 `html` 的捕获**不会提交**，`structured` 因此缺失，上游把本该是 `completed` 的一次运行改写成 `'error'`。

> 请求了输出契约、正常结束、但**没有拿到合法捕获**时，`stopReason` 会被改写成 `'error'`，且 `structured` 缺失。

因此判据是：

```ts
const usable = result.structured !== undefined && result.stopReason === 'completed'
const retryable = !usable && (result.stopReason === 'completed' || result.stopReason === 'error')
```

- 可重试 → 恰好重试一次，`retried` 置真。
- 仍不可用 → 终态 `run-failed`，保留文本输出与提供方诊断信息（含从 `agent/error` 捕获到的那条）。
- `refusal`、`max-tokens` 是子代理自己的答复，重试只会再花一次调用，**不重试**。
- 被取消（`signal.aborted`）→ 终态 `cancelled`，**不重试**。

> 第二版这里的判据是"结果里有没有按字段返回的值"。字段没有了，判据就收缩成"有没有 `html`"——但路径完全一样：不可用 → 一次重试 → 可见的错误态。

#### 运行表

进程内 `Map<cardId, ActiveRun>`，每卡同时至多一个运行，全局受 `maxConcurrentRuns` 限制（默认 1）。终态结果落盘后从表中移除。

进程重启会丢失进行中的运行——这是可接受的，运行本就是短生命周期动作。

### 结果 R

- 一次运行产出**结构化结果**（`{ html }`），或一个**可操作的失败原因**（M1 里那组降级码之一）。
- 用户会话里不会多出消息；重跑不会因为并发而互相干扰。
- 取消与超时都走同一条 `AbortController` 路径，行为一致。
- 子代理自己报错时，结果里带着它的失败文本，运行详情能显示——失败不再是黑箱。
- 卡片写了模型时，跑的就是那条路由，且**结果上写着它**；写不通时第一步就拒绝，不会出现"卡片显示 A、实际跑 B"。
- 卡片没有目录、或目录已经不在了，就**不启动子代理**，并在消息里说清是哪张卡、哪条路径；不会出现"卡片说有目录、实际跑在会话里"。
- **但目录只放行，不隔离**：这一版的运行仍执行在父会话的目录与父会话的沙箱里（见「工作目录：一道门，还不是一间房」）。这一条写在「结果 R」里，是因为它是这一版真实的交付边界，而不是一个待办。

---

## M6 私域路由

> 文件：`src/skill-card-route.ts`

### 情境 S

浏览器要读配置、写模板、拿目录、起运行、查状态、取消——六件事都要穿过进程边界。工作台已有的布局路由给出了一套验证过的范式：**同源私有路径 + 信任围栏**。技能卡路由直接沿用，不发明新机制。

围栏的含义是：一个没通过信任与浏览器鉴权检查的请求，**永远碰不到业务逻辑**，更碰不到存储。

### 任务 T

1. 提供 8 条路径，全部先过信任围栏。
2. 逐字段校验请求体——这是进程边界，调用方不是同进程的可信对象。
3. 失败返回**可操作**的错误码，消息不回显请求数据。
4. 打开工作台的路径不得触发任何模型调用。

### 行动 A

#### 八条路径

| 方法 | 路径 | 作用 | 主要失败码 |
| --- | --- | --- | --- |
| `GET` | `/api/workbench/skill-card` | 配置 + 全部结果（纯存储读） | `storage-failure` |
| `PATCH` | `/api/workbench/skill-card` | 写 skill 选择与模板 | `invalid-request` `too-large` `conflict` |
| `GET` | `/api/workbench/skill-card/catalog?sessionId=` | 会话作用域的 skill 目录 | `session-not-live` |
| `GET` | `/api/workbench/skill-card/directory?path=` | 一个路径现在还是不是一个目录（纯文件系统读） | `invalid-request` |
| `POST` | `/api/workbench/skill-card/run` | 启动一次运行 | `template-missing` `run-in-progress` `provider-unavailable` `schema-rejected` `skill-not-found` `session-not-live` `workspace-missing` `workspace-invalid` |
| `GET` | `/api/workbench/skill-card/run?cardId=` | 轮询运行状态 | `not-found` |
| `DELETE` | `/api/workbench/skill-card/run?cardId=` | 取消并释放 | `not-found` |
| `PUT` | `/api/workbench/skill-card/result` | 把手工编辑的区间片段存成这张卡的结果 | `not-found` `invalid-request` `too-large` |

> **标题的数目就是行数。** 第十版加 `PUT /result` 时标题还写着「六条」，本轮加目录检查时一并改成实际条数——这张表是这一模块唯一的路径清单，数目不对会让人以为少看了一行。

#### 为什么用轮询而不是 SSE

因为**上游子代理这条缝不提供细粒度进度**：只有 `subagent/start` 与 `subagent/end` 两个事件，没有逐 token 或逐步骤的流。也就是说进度粒度本来就是"开始 / 结束"。

一个粗粒度的状态轮询完全够用，而 SSE 会引入推送、重连与重放一致性三份额外复杂度。轮询间隔由客户端定（约 1 秒，到终态即停）。

#### 契约仍然在宿主侧预检（但已无内容可变）

`POST /run` 里的 `outputSchema` 来自客户端。第二版它是一份**由模板反推出来的**契约，所以宿主必须用上游的 `assertObjectJsonSchema` 独立校验一次——那份契约的内容确实会随模板变。

**今天它永远是同一个常量** `WORKBENCH_OUTPUT_SCHEMA`，客户端只是把它照抄过来。所以宿主的检查退化成一次廉价的形状预检（`looksLikeContract`：是不是一个 `type: 'object'` 的普通对象）：

- 不像 → `schema-rejected`，**不启动任何子代理**，也就不花任何模型调用；
- 像 → 才交给子代理，真正的子集校验仍由 `startActivation` 内部完成。

预检拦的是"请求压根没带契约"这类情况——那种情况下启动子代理会白花一次模型调用才失败。

这仍然体现整份设计的一条纪律：**两侧都不假设对方已经挡住。** 客户端会先分析模板（为了给用户即时反馈），宿主仍然独立回答"这张卡有没有模板"（因为进程边界不可信）。

#### 模式是显式校验的，不是猜出来的

`parseRunMode` 是一个三路分派，而不是"有契约就是卡片运行"这种推断：**一次丢了契约的卡片运行必须作为卡片运行失败，而不是悄悄变成裸运行**。同理，微调也必须由 `kind: 'refine'` 明说。

`refine` 分派到 `parseRefineMode`，两条规则都按传输层自己的码回答：

| 字段 | 规则 | 不合法时 |
| --- | --- | --- |
| `instruction` | 字符串，`trim()` 后非空，长度 ≤ `WORKBENCH_REFINE_INSTRUCTION_MAX_LENGTH` | 400 `invalid-request` |
| `previous` | 字符串，UTF-8 字节 ≤ `WORKBENCH_REFINE_PREVIOUS_MAX_BYTES` | 非字符串 400；超体积 413 `too-large` |

- **`previous` 不再被当成 HTML 校验。** 它是客户端从一条存盘结果里读回来的字符串，提示词逐字带走；形状检查留给读者，尺寸检查留在这里（一条 64 KiB 的请求体上限之外的原文不该被悄悄送进提示词）。
- **超体积用 413 而不是 400**：那是一个尺寸问题，与模板超限是同一类，客户端也会显示成同一类原因。
- **"非空"在服务端也要查。** 客户端禁用「重新生成」只是界面上的门；这条路径会花一次模型调用，所以它自己也有一条门。

#### 目录检查：一次窄读，答案永远是值（第十三版）

配置页要回答"这张卡存的目录还在不在"，而这个事实只有宿主知道。这一版为此只加**一件事**：`GET /directory?path=`，以及它背后的 `src/skill-card-directory.ts`——整个功能里**唯一一次文件系统读**。

```ts
/** 一条窄缝：一个路径进，三个布尔值出。 */
export type WorkbenchDirectoryProbe = (path: string) => Promise<WorkbenchDirectoryStat>

export async function statDirectory(path: string): Promise<WorkbenchDirectoryStat>
```

四条决定，每一条都在防一个具体的坏结果：

- **答案是三个布尔值，不是错误。** 一个不存在的目录若回 404，客户端就得把"目录没了"当成一次失败请求去解析；而页面要渲染的恰恰是"这里写着这个目录没了"。所以路径不存在也是 **200**，`{ exists: false, isDirectory: false, writable: false }`。探测**抛错**（权限、路径过长、平台怪癖）由路由自己接住、`warn()` 记一行、回同一个值——页面永远拿得到可渲染的东西。
- **路径先用契约里的同一条规则校验，再碰文件系统。** 相对路径在这一层就 400，且**一次 `stat()` 都不会发生**（用例断言探测器的入参为空）。store 与路由共用 `isWorkbenchWorkspacePath()`，两处因此不可能对"什么是一条工作目录"有不同意见。
- **只回答一个问题。** `stat()` + 一次 `access(W_OK)`，不列目录内容、不读文件、不递归：这个功能的边界就是"那个目录还在不在、是不是目录、能不能往里建条目"。
- **围栏与方法优先。** 和另外七条一样：没过信任检查的请求碰不到文件系统，非 `GET` 回 405 并带 `Allow`。这一条尤其重要——它是**唯一**一条让宿主主动去读文件系统的路径。

**这个路由不是运行的门。** 它只服务配置页与结果页的显示；真正的门在 M5：宿主在启动前用**同一个探针**再判一次。两处读的是同一个事实，但**决策**只在宿主那一侧发生——客户端把按钮变灰只是界面上的门。

### 结果 R

- 打开工作台只发一次纯存储读请求，**不产生模型调用**（需求验收第 7 条）。
- 每种失败都有专属错误码，客户端能映射成可操作的文案而不是"出错了"。
- 未通过信任检查的请求在围栏处就被挡下，不入业务逻辑。
- **文件系统只被问一个窄问题**（第十三版）：那个路径还在不在、是不是目录。它没有变成通用的文件系统桥，也不列内容、不读文件；一个不存在的目录是一份 200 的答案，不是一次失败请求。

---

## M7 插件入口与配置

> 文件：`src/index.ts`、`src/config.ts`

### 情境 S

M4–M6 造出了域、服务、路由，但它们是零件。插件启动时要按正确顺序把它们装起来，并保证**任何一步失败都不会留下半开的资源**（域开着但路由没注册、服务建了一半）。

同时，部署可能想调整运行方式（换子代理后端、收紧体积上限），这些必须是可校验的配置项，而不是埋在代码里的常量。

### 任务 T

1. 在一个 `ctx.effect` 里完成：开域 → 建服务 → 注册路由，并保证反向释放。
2. 声明所需的宿主服务。
3. 暴露 6 个可校验的配置项，全部有默认值。
4. 配置错误要**在加载期**暴露，而不是等到第一次运行。

### 行动 A

#### 注入声明

```ts
export const inject = [
  'storageDomain', 'webServer', 'connection', 'storage',  // 既有
  'agents', 'skills', 'subagents',                         // 技能卡新增
]
```

**这三个必须靠 `inject` 声明，哪怕代码是通过窄接口的转换去读的。** Cordis 的 Context 是一个代理：`ctx.agents` 会在服务未声明时直接抛 `cannot get property "agents" without inject`。类型转换只存在于编译期，运行时它就是一次 `ctx.agents` 属性访问——这个坑在真机验证时才暴露，单测里注入假对象永远遇不到。

`agents` 是其中最关键的一个：没有它，子代理服务虽然能注入但**不能启动任何东西**（上游在缺 `agents` 时会拒绝）。

**`workingDirectory` 刻意不声明。** 它是在 0.2.1-alpha.2 才引入的服务，**稳定通道钉的 0.2.0-rc.2 里根本不存在**。把它写进 `inject` 会让插件在稳定版上永远 PENDING——整个工作台（含已发布的布局功能）一起消失。因此它通过 `ctx.get('workingDirectory')` 可选读取，缺失时回退到 `agent.session.header.cwd`，也就是 0.2.0-rc.2 自己的取值方式。

#### 装配与释放

沿用已有 `ctx.effect` 的结构：域打开 → 建 store 与 runner → 注册路由 → 返回一个按反向顺序释放的清理函数。任何一步抛错都先把已开的域关掉再向上抛，不留半开状态。

#### 配置项

| 配置项 | 默认 | 作用 |
| --- | --- | --- |
| `subagentProvider` | `'spawn'` | 用哪个子代理后端；启动时做能力检查 |
| `maxTemplateBytes` | `32768` | 单模板上限 |
| `maxTemplatesPerCard` | `16` | 每卡模板数上限 |
| `maxResultBytes` | `65536` | 单结果上限 |
| `runTimeoutMs` | `120000` | 单次运行上限，超时走取消路径 |
| `maxConcurrentRuns` | `1` | 全局并发上限（需求 §11 要求定一个明确值） |
| `resultStaleAfterMs` | `86400000` | 结果超过这个时长即标记"已过期"；只提示，不重跑 |

**这七项都必须是可校验的 `Config` 字段，不能是常量或测试钩子。** 这是仓库的硬规则：部署可变的取值属于配置面。

**`subagentProvider` 的错误必须在加载期暴露。** 如果配的是一个不存在的后端、或一个不支持输出契约的后端（比如某些进程外后端），插件应该在启动时就报错。让它在用户第一次点运行时才失败，是把配置错误变成了产品故障。

### 结果 R

- 插件启动即完成全部装配，异常时不留半开资源。
- 配错 `subagentProvider` 在**加载期**就报错（M14 的 P6 出口标准之一）。
- 所有运行时策略都可从 `cordis.yml` 调整。

---

## M8 客户端传输与状态

> 文件：`src/client/skill-card/api.ts`、`src/client/skill-card/controller.ts`

### 情境 S

组件不应该知道 `fetch` 怎么用、URL 长什么样、冲突怎么处理。它需要的是："给我当前的 view，给我一组 actions"。

同时有三件事必须在客户端定义清楚：

1. **数据获取策略**——打开工作台绝不能花钱（需求决策 10）；
2. **"当前活跃会话"是谁**——工作台在 `main` 的 root 作用域，而 `useSession` 只在 `session` / `session-maybe` 作用域存在，**拿不到**；
3. **当前打开的是哪张卡的哪个视图**——网格、结果页、配置页是**同一个面板的三种状态**（P10），这份状态放在哪一侧，决定了卡片与页面要不要共享一棵 React 树。

### 任务 T

1. 把 8 条路由包装成结构化结果（不抛异常）。
2. 写操作串行化，避免与布局写入争抢同一种竞态。
3. 定义数据获取时机：什么情况下发什么请求。
4. 定义并实现"当前活跃会话"的选定规则。
5. 把视图选中状态放进客户端入口，让卡片与页面互不相识。

### 行动 A

#### 传输层

```ts
export interface WorkbenchSkillCardApi {
  read(signal?: AbortSignal): Promise<ReadResult>
  write(patch: WorkbenchSkillCardPatch): Promise<WriteResult>
  catalog(sessionId: string, signal?: AbortSignal): Promise<CatalogResult>
  start(request: WorkbenchRunRequest): Promise<StartResult>
  poll(cardId: string, signal?: AbortSignal): Promise<PollResult>
  cancel(cardId: string): Promise<void>
  /** 手工编辑结果：一次独立的写，不是运行。 */
  saveResult(cardId: string, html: string): Promise<WorkbenchResultWrite>
  /** 目录检查：这张卡存的那条路径现在还是不是一个目录（第十三版）。 */
  statDirectory(path: string, signal?: AbortSignal): Promise<WorkbenchDirectoryStatRead>
}
```

每一次调用都返回**结构化结果**而不是抛异常——页面要渲染"不可用"状态，而不是落进错误边界。响应在这里做契约校验：这是进程边界，宿主的 JSON 是输入，不是可信值。`saveResult` 的回执同样过一遍 `parseResultEdit`：`apiVersion`、`revision`、`result.cardId` 与 `result.editedAt` 的形状都在校验范围内——**「手工编辑」那一行渲染什么，取决于这里收下什么**，所以一个非有限数字的 `editedAt` 会让整条回执被拒收，而不是被画到页面上。

写操作沿用布局 API 的串行队列与上限（同时等待的写不超过 8 条，溢出即失败）。

#### 控制器

`useSkillCard({ api, cardId, sessionId, withCatalog? })` 返回一对 view / actions。

**它不再管"编辑器的开关"。** 第二版的 `settingsOpen` / `openSettings` / `closeSettings` 已经删除：两个整栏视图（结果页、配置页）由面板自己切换，卡片只负责"我要打开哪个视图"（见下方"选中状态"，以及 P10 一节）。

```ts
export interface WorkbenchCardView {
  /** 存储里的配置读到了没有。 */
  status: 'loading' | 'ready' | 'unavailable'
  /** 用户起的卡片名；没有就用注册标签兜底。 */
  name?: string
  /** 选中的 skill。 */
  skill?: string
  /** 这个 skill 的模板。 */
  template?: string
  /** 最近一次结果：本次运行的，或存储里的。 */
  result?: WorkbenchResultRecord
  /** 本次会话里已经开始的运行状态。 */
  run?: WorkbenchRunState
  /** 合并后的唯一失败面（本地错误 → 运行终态错误 → 配置读失败）。 */
  problem?: WorkbenchCardProblem
  /** 本次会话里已生效的微调，最旧在前。**只在内存里**，从不落盘。 */
  refinements: readonly WorkbenchRefinement[]
  /** 最近一次微调换下来的那份结果，只留一份；`undefined` 表示没有可回退的版本。 */
  previous: WorkbenchPreviousResult | undefined
  /**
   * 最近一次微调失败的原因。
   *
   * 与 `problem` 分开：页面把它报在**编辑区下方**（问题发起的地方），而不是结果上方
   * ——那里是用户仍在读的结果。
   */
  refineProblem?: WorkbenchCardProblem
  /**
   * 这张卡的工作目录字段（第十三版）：`missing` / `invalid` / `ready`。
   *
   * 与 `runnable` 用同一个值：字段说没有，按钮就不可能活着。
   */
  workspaceField: WorkbenchWorkspaceField
  /** 这个页面有没有可用的目录选择器；没有时字段写一句说明、按钮禁用。 */
  canChooseWorkspace: boolean
  /** 能不能运行：有 skill、有模板、有活会话、有模型、**且有一个确认可用的目录**。 */
  runnable: boolean
  /** 会话的 agent 能调用的 skill。 */
  catalog: readonly WorkbenchSkillCatalogEntry[]
  catalogStatus: 'idle' | 'loading' | 'ready' | 'failed'
  catalogFailure: WorkbenchSkillCardErrorCode | 'unavailable' | undefined
}

export interface WorkbenchCardActions {
  run(): void
  cancel(): void
  /** 在屏幕上这份结果的基础上按一句要求改一次。 */
  refine(instruction: string): void
  /** 把上一版放回屏幕；一步，用完即弃，不写盘。手工编辑的回退走的也是这一个。 */
  undoRefine(): void
  /**
   * 把手工编辑后的区间片段存成这张卡的结果。
   * @returns 存下了没有；被拒时原因已经落在 `view.problem` 上。
   */
  saveResultEdit(html: string): Promise<boolean>
  /** 重读存储里的配置与结果。 */
  refresh(): void
  chooseSkill(skill: string): void
  saveTemplate(template: string): void
  /** 存卡片名；空串即清除，回到注册标签。 */
  rename(name: string): void
  /** 问一次目录选择器，把结果存成这张卡的目录（第十三版）。 */
  chooseWorkspace(): void
  /** 删除这张卡与它名下的一切；resolve 表示宿主已经提交。 */
  remove(): Promise<void>
}
```

几处刻意的取舍：

- **`withCatalog` 决定要不要读目录。** 只有配置页列 skill，所以只有它传 `withCatalog: true`；卡片正面与结果页都不传。网格里每张卡都为一份它不显示的列表发一次请求，正是这条设计要避免的。
- **`remove()` 返回 Promise**，因为它总要有后续：卡片正面用它通知面板重读列表（`onCardsChanged`），配置页用它决定何时退回网格。
- **`saveResultEdit` 是唯一返回 `boolean` 的动作**：编辑器只在写成功之后离开，所以"存下了没有"必须回到调用处。被拒时它顺手把 `view.problem` 设上，页面在结果表面上方以 `role="alert"` 说明原因——存盘失败看起来像成功，是这个面板一再修的那类缺陷。
- **`rename` 的空串即清除**：`name` 传 `null` 让卡片回到注册标签，而不是存一段空白标题。
- **`problem` 是合并后的一个字段**，组件只渲染一条，不必自己判断优先级。
- **`refineProblem` 是第二个失败字段，刻意不并进 `problem`。** 一次失败的微调有两个事实要同时成立："结果没变"与"这次要求失败了"。前者要求结果留在原处，后者要求失败出现在**发起处**（编辑区下方）；把它并进 `problem` 会让失败跑到结果上方，而结果下方那句要求看起来像没被处理。
- **`view` 被记忆化**（`useMemo`，依赖是它显示的每一个值）：卡片正文按这份 view 记忆化成一个闭包，再交给外壳的本地槽；闭包身份不稳会让子树每次渲染都重挂载、重建影子根（P8 的装配细节之一）。

**工作目录在控制器里的三处（第十三版）：**

```ts
// ① 宿主对这个路径的回答，与它回答的是哪个路径一起存：卡片换了目录时，上一份答案不能
//    被当成新目录的答案渲染一帧，所以在 effect 里清 state 是错的，打标才是对的。
const workspacePath = card?.workspace?.path
const [workspaceCheck, setWorkspaceCheck] = useState<{ path: string; stat: WorkbenchDirectoryStat } | undefined>(undefined)
useEffect(() => {
  if (workspacePath === undefined) return
  let live = true
  void api.statDirectory(workspacePath).then((outcome) => {
    if (!live) return
    setWorkspaceCheck({ path: workspacePath, stat: outcome.status === 'ok' ? outcome.stat : NO_DIRECTORY_STAT })
  })
  return () => { live = false }
}, [api, workspacePath])
const workspaceStat = workspacePath !== undefined && workspaceCheck?.path === workspacePath
  ? workspaceCheck.stat
  : undefined
// ② 一个纯函数把「存的目录 + 宿主的回答」读成三种状态，字段与运行控件都读它。
const workspaceField = useMemo(() => resolveWorkspaceField(card?.workspace, workspaceStat), [card?.workspace, workspaceStat])
// ③ 运行、微调、确认面板共用同一个拒绝：三条入口不可能对"有没有地方跑"有不同答案。
const refused = workspaceRefusal(workspaceField)
```

- **没有存盘目录时一次请求都不发。** 这和"打开工作台只读存储"是同一条纪律：没有路径要问，就不发一个必然失败的请求。
- **一次没答上的检查读成"那里什么都没有"，而不是第四个状态。** 请求降级时控制器把它读成 `NO_DIRECTORY_STAT`（三个 `false`），于是门是关的。加一个 `'checking'` 状态会让运行控件在一个谁都没确认过的路径上打开——这正是要防的。
- **`chooseWorkspace()` 只在 `picked` 时写。** `cancelled` 直接返回（用户关掉选择器是一个回答，不是一次修改）；`unavailable` 把 `pickerRefused` 置上，按钮从此关掉——**没有文本框可以退回去**。目录写走的是既有的 `write({ workspace: { path } })`：一次配置写、不触发运行、不读目录。

#### 微调状态：三个内存字段与一次记录

微调**没有新的存储**，也没有新的路由。它用到的是既有的 `POST /run`（模式换成 `refine`），落盘走既有的 `saveResult`，所以这份状态全部在客户端，且全部在内存里：

```ts
const [refinements, setRefinements] = useState<readonly WorkbenchRefinement[]>([])
const [previousResult, setPreviousResult] = useState<WorkbenchResultRecord | undefined>(undefined)
// 回退（或一次失败的微调）放回屏幕上的那份记录。它是**显示层的覆盖**，从不写盘。
const [resultOverride, setResultOverride] = useState<WorkbenchResultRecord | undefined>(undefined)
// 在飞微调待记录的内容。用 ref 而不是 state：轮询回调要读它，又不该因此重订阅。
const refinement = useRef<RefinementIntent | undefined>(undefined)
```

显示的结果按 `resultOverride ?? run?.result ?? stored` 取，这一条顺序解释了四件事：

| 情形 | 结果从哪来 | 为什么 |
| --- | --- | --- |
| 普通运行 | 本次运行的记录 | 与没有微调时完全一样 |
| 微调成功 | 本次运行的记录（覆盖被清掉） | 存盘的就是它，屏幕上也是它 |
| 微调失败 | **覆盖 = 失败前那份记录** | 一次失败的修订不能把用户已接受的结果拿走 |
| 回退后 | 覆盖 = 上一版记录 | 回退只改显示（需求 R6） |

三处记录点：

1. **`refine()` 先把"要记什么"放进 ref**：`instruction`、屏幕上那份记录、以及它的区间 HTML。请求带的就是这份 HTML——**屏幕上是哪一版，就修订哪一版**，回退之后再微调也一样。
2. **运行到达终态时结算**（`settleRefinement`）。它在**两个地方**被调用：`start()` 的应答（一个已经结束的运行）与每一次轮询。放在轮询回调里而不是 `useEffect` 里，是因为效果会晚一帧看到这次转变，而那一帧里日志和上一版还没出现。
3. **成功**追加一条记录并把替换下来的记录留作上一版；**失败或被取消**把那份记录放回覆盖、并写 `refineProblem`。被取消也算失败：它同样没有产出。

几条边界，都是刻意的：

- **`start()`（普通重跑）清掉上一版与覆盖**，但**保留记录**。一次重跑不是一次微调，它的"上一版"没有意义；记录记的是"问过什么"，不是"显示什么"。它同时清掉待记录的 ref，免得一次重跑的终态被记到上一次微调的账上。
- **`refresh()` 清掉覆盖**：重读存储之后，屏幕上的答案应当是存盘的那一份。
- **`previous` 由那份记录派生**（`{ html: resultHtml(record.structured), at: record.executedAt }`），所以"回到上一版"恢复的是**整条记录**，运行详情里的时间与结束原因都跟着回来，而不是只换掉一段 HTML。
- **没有可修订的 HTML 就没有编辑器**：结果页只在 `resultHtml(view.result.structured)` 存在时才画编辑区。控制器里另有一道门（拿不到 HTML 就报 `run-failed`），因为 composer 只是界面上的门。
- **运行中的「停止」走的就是 `cancel()`**：编辑区那块主控件在运行期间调用 `actions.cancel`，与页面头部的取消是同一个动作（M10）。因此这里没有第二套中断路径，也没有"从编辑区取消不结算"这种例外——一次被取消的运行仍然按"失败或被取消"结算（第 3 条），结果是留在屏幕上、`refineProblem` 报在编辑区下方。

#### 数据获取时机

| 时机 | 发什么请求 |
| --- | --- |
| 卡片挂载 | 只 `read()` 一次（纯存储读，**不发模型请求**） |
| 配置页挂载（`withCatalog: true`） | 取一次 `catalog(sessionId)` |
| 点"运行" | `start()` 后按 1 秒轮询直到终态 |
| 点"重新生成" | 同一个 `start()`，模式是 `refine`；同样轮询到终态 |
| 改 skill / 模板 / 名字 | `write()`，无模型调用 |
| 卡片读回来带着目录（每次挂载、每次目录变化） | `statDirectory(path)` 一次（纯文件系统读，不发模型请求）；没有目录就**一次也不发** |
| 点「选择目录」 | 打开平台选择器；只有 `picked` 才发一次 `write({ workspace: { path } })` |
| 删除卡片 | `write({ remove: true })`，无模型调用 |

**微调不发新的请求种类。** 客户端这一层看到的仍然只有 `read` / `write` / `catalog` / `start` / `poll` / `cancel` 六个方法（M8 的任务 T 第 1 条没有变），"微调"是 `start()` 的一个模式。

目录**由"会列 skill 的那个视图被渲染"触发**（`useEffect` + `withCatalog`），而不是由某个谁都得记得调用的动作触发：`catalogStatus` 从 `idle` 走到 `loading`，再到 `ready` 或 `failed`。

#### 选中状态在客户端入口，不在卡片里

面板是一个表面的三种状态：网格、某张卡的结果页、某张卡的配置页。这份状态（`{ cardId, view: 'result' | 'config' }`）放在 `src/client/index.ts` 的一个 snapshot store 里，通过注入面交给页面与卡片：

```ts
const selection = createSnapshotStore<WorkbenchCardSelection | undefined>(undefined)
const openCard = (cardId: string, view: 'result' | 'config'): void => { selection.set({ cardId, view }) }
const closeCard = (): void => { selection.set(undefined) }
```

- 页面拿到 `hooks.selection` 与 `closeCard`，只按 `selection` 决定渲染网格还是某个整栏视图；
- 卡片拿到 `openCard`，只负责说"打开我的结果页 / 配置页"；
- 后者不经过前者，所以**卡片与页面不共享 React 树**，页面也不必知道卡片内部长什么样。

#### 当前活跃会话的选定规则

会话列表的形状是确定的：每行有 `id`、`cwd?`、`origin?`、`blank`、`running`、**`updatedAt`**。**实现时收窄了两处：**

1. **不用 `useSessions` 钩子。** 它属于 `ui-session` 通过 `GlobalStandardProps` 声明合并进来的标准座席，而本包不依赖该插件的 client 入口，类型上看不到它。改用 `sessions` 服务的列表快照，由注入面提供一个 `runSessionId()` 回调。**回调在用户点击运行时读，而不是渲染时读**——这是更准的时点：卡片渲染之后才打开的会话也能被找到。
2. **不做工作区过滤。** 设计里那条「`cwd` 与当前工作区一致」没有实现：`WorkspaceSnapshot` 只有 `items` 列表，**没有「当前工作区」这个概念**，会话快照里也没有。

因此实现的规则是：候选 = `origin !== 'subagent'`（子代理子会话不是运行目标）且 `blank !== true`（空白会话还没有可用上下文）的行，取 `updatedAt` 最大的一行；候选为空 → `session-not-live` 降级态。

这一步之所以要自己定义，是因为框架没有「当前会话」这个座席——`useSession` 只对 session 作用域的组件可用。

### 结果 R

- 组件只面对 view 与 actions，不认识 HTTP。
- 打开工作台是纯读缓存路径，零模型调用。
- 没有活跃会话时给出明确的降级态，而不是随机挑一个会话。
- 卡片不需要知道面板有几种视图，面板也不需要知道卡片内部长什么样。
- **"有没有地方跑"只有一个答案**（第十三版）：控制器把一个纯函数的输出同时交给字段与 `runnable`，所以"字段说没有、按钮还能按"在结构上不可能；三个运行入口共用同一个拒绝，所以它们也不可能各说一套。目录检查本身是一次纯读，且没有目录时连这次读都不发。

---

## M9 卡片组件与装配

> 文件：`src/client/skill-card/SkillCard.tsx`、`src/client/index.ts`

### 情境 S

这里有一个**必须在本次一并修掉的缺口**。

工作台的卡片契约里声明了一个 `workbench.card` 工厂——它的作用是让每张卡片共用同一个外壳（边框、标题、子标题、拖拽手柄、右上角那个 X 按钮）。X 只在卡片提供 `onRemove` 时绘制，而且它永远是删除：**隐藏不在产品里**（外壳、卡片与布局域都没有这条路径）。README 里也写着卡片应该调用 `renderFactorySlot('workbench.card', …)`。

但**代码里从来没有注册过这个工厂**。全包检索 `registerFactory` 没有任何结果，实际注册的只有 `main` 面板和侧栏条目。

后果是：任何卡片调用它都会失败；P5 计划的独立卡片包（Git 卡、测试卡）也无法装配。技能卡是第一张真正的卡，必须顺手把这个缺口补上。

### 任务 T

1. **注册 `workbench.card` 工厂**（补齐 P1–P4 的缺口）。
2. 把技能卡注册成 `workbench.cards` 的一个条目。
3. 卡片正面是**索引入口**：交给外壳的只有名字、skill、一个「配置」按钮与"点开结果页"的动作（P10）。
4. 权限等级必须让用户在按下运行之前看到。

### 行动 A

#### 两段注册

```ts
// 补齐契约里声明、但从未注册的装配。缺它任何卡片都无法渲染统一外壳。
ctx.effect(() => ctx.slots.registerFactory({
  name: 'workbench.card',
  scope: 'root',
  locale: NS,
  // 工厂必须声明它渲染的本地槽，否则注册被拒。
  slots: { body: { scope: 'root' }, actions: { scope: 'root' } },
}, WorkbenchCardShell), 'workbench: card assembly')

// 技能卡自身作为 workbench.cards 的一个条目。
ctx.slots.inject('workbench.cards', () => ctx.slots.register({
  name: 'workbench.cards',
  id: SKILL_CARD_ID,
  order: 200,
  label: () => t('skillCardTitle'),
  locale: NS,
  inject: (): SkillCardFace => ({ api: skillCardApi, runSessionId, openCard }),
}, SkillCard))
```

`inject` 声明相应扩为 `['slots', 'locale', 'layout', 'sessions']`。

#### 卡片本体

卡片不自己画边框，而是把表现事实交给工厂装进统一外壳。**正面只是索引**（P10）：

```tsx
export function SkillCard(props: SkillCardProps): ReactNode {
  // 卡片正面是索引条目：用户给这张卡起的名字、它跑哪个 skill，以及进配置的入口。
  // 结果与配置各占整个显示栏，所以两者都不在网格单元里渲染。
  return renderFactorySlot('workbench.card', {
    id: cardId,
    // 只有默认那张卡可以回退到类型标签：一张无名的额外实例否则会与它无法区分。
    title: view.name ?? (cardId === SKILL_CARD_ID ? t('skillCardTitle') : cardId),
    ...view.skill === undefined ? {} : { subtitle: view.skill },
    ...view.problem === undefined ? {} : { failure: t(problemKey(view.problem.code)) },
    onActivate: () => { openCard(cardId, 'result') },
    onRemove: () => { void actions.remove().then(onCardsChanged) },
    reorderable,
    position,
    total,
  }, { slots: { actions: actionsSlot } })   // actionsSlot 里只有一个「配置」按钮
}
```

一次渲染里**没有** `state`、没有 `status`、没有 body：外壳因此不画状态点，也不出现运行按钮。

#### 外壳的 X：只在提供 `onRemove` 时画，且永远表示删除

外壳的右上角只有一个条件控件：`onRemove` 存在才渲染那个 X，`aria-label` 取 `removeCard`，点击即调用 `onRemove`。**没有 `onHide`，也没有"没提供 `onRemove` 就退化成隐藏"的回退**——不提供的卡片就不画这个按钮。技能卡永远提供 `onRemove`，所以它的 X 只可能是物理删除：

```tsx
{onRemove !== undefined && (
  <Button
    variant="ghost"
    size="sm"
    className={css.iconButton}
    data-workbench-remove={id}
    aria-label={t('removeCard')}
    onClick={onRemove}
  >
    <IconCloseOutlineMedium size={14} />
  </Button>
)}
```

这条是**能力移除**而不是偏好：布局记录只剩排序一维（`position`），隐藏那条分区、`setHidden` / `showAll` 与它们的播报文案都已从源码删除，宿主也不再解析 `hidden`。旧记录里仍写着 `hidden: true` 的卡片按可见读回，不做迁移——字段被忽略，卡片就在可见序列里（`WorkbenchCardShell.spec.tsx` 断言外壳在没有 `onRemove` 时**一个 X 都不画**）。

#### 排序手柄：最后一个控件，三级色，随悬浮/聚焦显现

头部动作区里的控件顺序是**卡片自己的动作 → 刷新（若提供）→ X（若提供）→ 手柄**。手柄排在最后、并走三级色，因为它和另外几个不是一类东西：

- 它操作的是**卡片已经拥有的位置**，不是卡片本身；
- 它和另外几个图标按钮一样**只在悬浮或聚焦时出现**（`.card:hover .iconButton`、`.card:focus-within .iconButton`）——一个常显的控件不是被弱化的控件，它只是比别人更响；
- 但"弱化"不能变成"消失"：手柄仍然是键盘移动卡片的**唯一**入口（方向键移动一位、Escape 取消拖拽），`focus-within` 让它在键盘聚焦时同样出现。

```tsx
{reorderable && (
  <Button
    variant="ghost"
    size="sm"
    className={clsx(css.iconButton, css.handle)}
    data-workbench-drag-handle={id}
    aria-label={t('dragHandle')}
    aria-pressed={dragging}
    onKeyDown={(event) => {
      if (event.key === 'ArrowUp') { event.preventDefault(); onMoveBy(-1) }
      if (event.key === 'ArrowDown') { event.preventDefault(); onMoveBy(1) }
      if (event.key === 'Escape') { event.preventDefault(); onCancelDrag() }
    }}
  >
    <IconChevronsUpDownOutlineRegular size={14} />
  </Button>
)}
```

`.handle` 只加三件事：三级色、拖拽光标（`grab` / `grabbing`）与 `touch-action: none`（触摸拖拽不被页面滚动抢走）；显现规则由 `.iconButton` 那条共用规则负责（静止时 `opacity: 0`，`.card:hover` / `.card:focus-within` 时回到 1），所以**手柄不会有一套自己的可见性逻辑**。`WorkbenchCardShell.spec.tsx` 断言的是顺序与类名（四个头部按钮里只有最后一个是手柄），显现本身是 CSS，测试不断言。

#### 状态与结果不画在卡片正面

P10 之后，运行中 / 已出结果 / 失败的呈现都在**结果页**：运行中的正文提示说这次运行在做什么，失败文案走外壳的 `failure` 位，正文与原始输出都由结果页渲染。外壳仍保留状态点这套能力（`state` / `status` 可选），供其它卡片类型使用。

结果超过 `resultStaleAfterMs` 时显示"已过期"与上次执行时间——**仍未实现**：这个阈值是部署配置，客户端当前拿不到它（见 M14 的"仍未覆盖的两项"）。

#### 权限标注

**这个标注不能省**（需求 FR-12 / 决策 13）。它现在随**结果页的正文**渲染——也就是「运行」按钮所在的那一页，用户按下去之前必然看到它。

这不是装饰：用户选了"继承当前会话的完整工具权限"，而 skill 是磁盘上的自然语言，第三方 skill 根目录里已有现成内容。子代理能写仓库、执行命令、发网络请求。**让用户知道自己按下去的是什么**，是这条决策的组成部分。

### 结果 R

- 卡片装上统一外壳，外观与其它卡片一致。
- `workbench.card` 工厂从此可用，P5 的独立卡片包不再受阻。
- 卡片正面只做索引；结果与配置各占一整栏，用户在按下运行的那一页看到权限等级。
- 排序手柄是头部动作的最后一个控件、走三级色、随悬浮/聚焦显现，并且仍是键盘移动卡片的唯一入口。

---

## M10 编辑器与配置页

> 文件：`src/client/skill-card/SkillCardSettings.tsx`（配置页与编辑器）、`SkillCardPages.tsx`（两个整栏页面）、`SkillCardResultEditor.tsx`（结果编辑器）、`text-editing.ts`（两个编辑器共用的行与缩进算术）、`violation-copy.ts`（五个内容策略码的文案归属）、`ActionDeclarationPanel.tsx`（声明构建器）、`declarations.ts`（把一条声明写进文档）、`skeleton.ts`（起手文档）、`workspace.ts`（工作目录字段的三态与叶子名）、`workspace-picker.ts`（目录选择器的两条来源）、`skill-card.module.css`（本模块的全部样式）

### 情境 S

这是用户唯一要动手的地方，也是需求里"易用性"的落点。他要在这里做三件事：给卡片起名、选一个 skill、写整份 HTML 文档，然后看着它决定改哪里。

其中有一个**必须先说清楚的限制**：模板是运行的前置条件，而"填什么"写在**区间注释**里——系统无法替他决定该产出什么形态。他必须自己写清楚（通常因为他就是写这个 skill 的人）。编辑器能提供的帮助是"让他写得下去、并随时告诉他哪里不合法"，而不是"告诉他该写什么"。

**这个模块分三批长成今天的形状**，每一批解决的都是一批之后用户真正卡住的地方：

| 批次 | 落下什么 | 上一批之后仍然卡住的地方 |
| --- | --- | --- |
| 第一批 | 行号栏、状态行、键盘 | 一份几十行的文档找不到刚写的那一行；体积到保存时才炸；Tab 只能离开字段，写嵌套 HTML 没有缩进 |
| 第二批 | 违例跳转、声明构建器、缺失目标告警、骨架插入 | 违例清单是一段让人重读全文的散文；声明块是唯一要背语法的地方；空文本框教不会那两处语法 |
| 第三批 | 并排/切换与整页布局（三段、粘性页脚、两段式删除、页脚内的失败行） | 编辑与预览只能二选一；保存按钮被任意高的预览顶出视野；删除一次点击就生效，写入失败在页面上看不出来 |
| 第四批 | **结果页**：结果表面、能读的运行详情、（微调编辑区在 M8 的状态之上）。那一批还加了一行状态与一个「结果」标题，**第十一版已按产品决定整行移除** | 渲染出来的文档没有归属，也没有一个说"这是这张卡的结果"的框；调试区把 `html` 当 JSON 打印，读不了；改一次结果只能重跑一次、再花一次模型调用 |
| 第五批 | **结果的手工编辑**：结果表面里就地打开 `SkillCardResultEditor`、一条独立的结果写路由、`editedAt` 与「手工编辑」一行 | 模型回填错一个字符也只能再花一次模型调用；而页面上那份渲染文档看着能改、其实没有任何东西会记住它 |
| 第六批 | **工作目录字段**：基本信息从三个控件变四个、两行两列，新字段 + 目录选择器（`workspace.ts`、`workspace-picker.ts`） | 一张卡跑在哪从来没人问过：它总是跑在会话的目录里，而用户没有一处能说"这张卡看的是那个仓库" |

### 任务 T

1. **配置页**：三段（基本信息 / 模板 / 预览）+ 粘性页脚；卡片页头部只有「返回」，而**面板自己的标题（工作台 + 副标题）在它上面**，由页面渲染；字段成对、**每个标签与它的控件配对**。
2. **模板是前置条件**：无模板时不提供运行入口；有违例时保存不可用。
3. **预览**走**与正式渲染完全相同**的路径，并且说的是真话（骨架 + 空区间，没有示例数据）。
4. **行号栏**与文本区同步滚动、两处染色、点行号选行。
5. **状态行**一行给出区间行号、声明条数、**字节**占预算多少，缺区间时变成可操作的警告。
6. **键盘**：Tab 缩进、Shift+Tab 反缩进、Escape 之后 Tab 离开、Ctrl/Cmd+S 保存。
7. **违例可定位**：有位置的点一下就选中并滚过去，没位置的保持纯文本。
8. **声明构建器**代写声明行，且**块按它本来的缩进整块重发**。
9. **缺失目标告警但不阻塞保存**；**骨架**可一键插入且零违例。
10. **页脚**：保存 / 关闭 / 两段式删除；写入失败在页脚**内部**以 `role="alert"` 出现。
11. **结果页**：渲染的文档在一个有边框、圆角与内边距的表层里——边界只靠这三样（它曾经还靠一行「结果」标题与细线，第十一版按产品决定移除，**不要恢复**）；运行详情默认折叠、标题写「运行详情」、`html` 按真实换行且去掉区间缩进、结束原因本地化、缺失字段整行不出现；权限说明降为页脚。状态与时间只在「运行详情」里读。
12. **微调编辑区**：结果下方一句话 + 「重新生成」+ 修改记录 + 「回到上一版」，记录与上一版**只在本次会话**；编辑区与聊天输入区同形并随内容长高；运行中那个位置变成「停止」。
13. **结果的手工编辑**：入口只在有结果且没有运行占住卡片时出现在「运行」左边；编辑器改的是**存盘片段**（不从 DOM 读）、与模板编辑器同一套键盘；保存拒绝内容策略、空内容与超预算三件事；保存后片段成为结果、`editedAt` 落盘并在运行详情里显示、编辑前那一版可用「回到上一版」取回，而这次编辑**不进修改记录**。
14. **工作目录字段**：基本信息四个控件排成**两行两列**；主值是**目录名最后一段**、完整路径是它下面的次要文字；字段三种状态（`missing` / `invalid` / `ready`）与运行控件的禁用一一对应；旁边只有一个按钮，打开**平台自己的选择器**——**没有可打字的框**，也没有工作区下拉。

### 行动 A

#### 页面的形状

**面板标题在每个视图上。** `WorkbenchPage` 在渲染网格、结果页或配置页**之前**无条件画那块头部（`<h1>工作台</h1>` + 副标题），卡片页自己的头部排在它下面（结果页：返回 / 卡片名 / skill / 运行控件等；配置页：只有返回）。

第七版曾经相反：为了让卡片页不叠出三层标题带，面板标题在卡片页上被拿掉，只留卡片页头部。第九版推翻了它，理由有两条：**卡片页是这个面板的一个视图**（少了标题，从网格点进一张卡读起来像跳到了另一个页面），以及**那段顶部留白需要一个来源**——拿掉标题之后卡片页的内容从顶边开始。真正叠三层的是"面板标题 → 卡片页头部再写一遍卡片名与 skill → 字段标签"，问题在**重复且不可编辑的卡片名**，不在面板标题（需求 FR-43、决策 E12）。

`SkillCardConfigPage` 画一个头部（`← 返回`）和 M10 的编辑器；编辑器自己是三段，靠**间距与细线**分隔，**不做嵌套卡片**——卡片套卡片读起来是第二层框，而这一页已经在页面自己的表面上了。

| 段 | 内容 | 为什么是这一层 |
| --- | --- | --- |
| 基本信息 | 卡片名称、skill 选择器、**模型**、**工作目录**，四个字段排成**两行两列**（名称 / 技能，模型 / 工作目录）、各 `width: 340px` | 整行宽的输入框只是一行标签旁边的大片空白；340px 够放一个长名字、也够放一条完整路径。**两行两列是加第四个字段时改的**：单行会把每个标签挤到下一个控件上，还把最后一个顶出页面边缘 |
| 模板 | 状态行、告警/构建器、行号栏 + 文本区、违例清单 | 一行行往下都是一个写文档的人要依次看的东西 |
| 预览 | 自有边框表面上的影子根渲染，标签「骨架预览，区间尚未填充」 | 预览里的东西是用户的文档，只有这一个框是本产品的 |

三段都用 `aria-labelledby` 指向自己的 `h2`；名称与 skill 两个字段的标签是 `<label htmlFor>`，模板字段由它自己的 `aria-label` 命名（标题已经是可见的分组名，再加一个可见标签只是噪音）。**卡片页头部不重复卡片名与 skill**（配置页头部因此只有「返回」）：它们就在下面的字段里，重复一遍会在"面板标题 → 卡片页头部 → 字段标签"之间多出一层，而头部那份还是不可编辑的那一份。这层重复就是第七版误判成"面板标题的问题"的那层，纠正后仍然不画。

写入失败由**页脚**呈现，见下面「粘性页脚」一节。

**配置字段第一版只有两种类型**：枚举选择（skill 选择器）与长文本（模板）。需求 FR-13 的通用机制按这两种落地——机制是通用的，字段类型面先收窄。第二版这里还有第三项"字段清单"（列出上次结果里的真实字段、点击插入光标处），**已随字段一起删除**：今天没有字段可列，子代理回报的是一段 HTML，不是一组命名值。第十二版加的**模型**仍然是枚举选择这一种类型（分组的选择器），它没有引入新的字段类型。第十三版的**工作目录**是第三种形状，也是这一页第一次出现"**值 + 打开器**"的字段：一个只读的值（叶子名 + 全路径），加一个打开系统选择器的按钮——**它既不是枚举，也不是输入框**。

#### 卡片的模型字段（第十二版）

配置页「基本信息」的第三个控件，也是这一版唯一新增的控件。它的三分之二不是选择器：

| 状态 | 判据 | 字段长什么样 | 运行控件 |
| --- | --- | --- | --- |
| 目录已加载 | 目录 `ready`/`selecting`，且至少有一组非空 | 按 provider 分组的 `select`，选项文本是 `ModelCatalogModel.name`，默认选中会话当前模型 | 可用 |
| 只有已知模型 | 目录不可用，或目录里没有可用的组，但**知道一条路由** | 该模型的名字（或 id）作为**文本**，不可选 | **可用**——这张卡会用那条路由跑 |
| 都没有 | 既没有存过的路由，也没有会话选择 | 「没有可用的模型，这张卡暂时不能运行」 | **不可用** |

判断的问题是**"有没有一个能跑的模型"，不是"选择器加载了吗"**。这条差别是这一节的全部要点：目录会因为凭据缺失、适配器没起来、会话被寻址成子代理而不可用，而卡片自己存的那条路由并没有因此失效——把它也一起禁掉，是在用一个 UI 就绪信号去回答一个数据问题。反过来说，目录加载成功了但一条路由都没有，也不能凭空造一条出来让运行继续。

实现分两层，**纯函数在前、React 在后**，这样状态判断可以被单测逐条钉住：

```ts
// src/client/skill-card/model.ts（不 import Cordis，不 import React）
export function resolveModelField(
  stored: WorkbenchCardModel | undefined,        // 卡片自己存的路由
  directory: WorkbenchModelDirectoryView,        // 目录回答的窄视图
): WorkbenchModelField                            // ready / fixed / unavailable

export function modelKey(model: WorkbenchCardModel): string      // 选项的 value
export function parseModelKey(value: string): WorkbenchCardModel | undefined
```

四条不显然的取舍：

- **`stored` 永远压过会话选择。** 会话模型只是"卡片没写时显示什么"的默认值；卡片写了，那就是它要跑的路由。
- **选项值是一个 JSON 数组**（`modelKey` → `["vendor/gateway","large"]`），不是 `"provider/model"`。理由与存储那一条完全相同：provider id 里有斜杠时，拼起来的字符串没有唯一的拆法。
- **选中的路由一定出现在选项里。** 一个 `select` 的 `value` 在选项里找不到时渲染为空白，而"一张卡永远显示一个具体模型"是这一节的前提；所以 `resolveModelField` 会把目录已不再列出的那条已存路由补进它所属的分组（连 provider 都没了时补一个只有它的分组），名字用它自己的 id——除了 id 之外没有可信的名字，编一个不如直说。
- **两种不可选状态用 `<p>` 而不是禁用的 `<select>`。** 禁用的选择器看起来仍然是"你可以选，只是现在不行"；而这两个状态的意思是"这里没有选择"。标签也随之从 `<label for>` 变成 `<p>`：不能指向一个不存在的控件。

这一层之上，M8 的控制器把目录**读进 state 并订阅**（目录是外部 store，且它会在页面挂载之后才加载完），算出 `modelField` 放进视图，`runnable` 再与它 AND 一次：

```ts
runnable: sessionId !== undefined && card?.skill !== undefined && card.template !== undefined
  && modelField.kind !== 'unavailable'
```

**运行控件的禁用必须与字段说的是同一句话。** 它们读的是同一个 `modelField`，所以不可能出现"字段说不可用、按钮还能按"。结果页在没有可用模型时，还在头部下面多画一句 `skillCardModelUnavailable`——一个禁用而不解释的按钮是同一个老缺陷的另一半（配置页的 skill 选择器早就因为同样的原因有了一行说明）。

`SkillCardPageProps.models` 是**必填**的（`WorkbenchModelSeat`：`read(sessionId)` + `subscribe(sessionId, listener)`）。座位而不是服务本身，是这一层不接触 Cordis 的做法：`src/client/index.ts` 用 `ctx.inject(['modelDirectories'], …)` 拿一次 resolver 放进一个可变持有者，座位通过 getter 读它。**用作用域形式注入**：服务缺席时那条纤维保持 pending，插件其余部分照常工作，卡片读到的就是"没有可用模型"——而不是整个工作台因为一个可选目录而停摆。`directoryFor()` 对"被寻址的子代理会话"会抛错，座位把这个错读成"不可用"，与"服务没注册"同一个答案。

**从不调用 `select()`。** 那个方法改的是**会话**的模型；这一版要的是"这张卡跑在哪条路由上"，两者混用会让卡片选择器偷偷改掉用户整个会话的模型。

#### 卡片的工作目录字段（第十三版）

配置页「基本信息」的第四个控件，也是这一页**唯一一个既不能打字、也不能下拉**的字段：一个只读的值 + 一个按钮。值在一个格里排两行（目录名 + 完整路径），按钮打开平台自己的目录选择器。

| 状态 | 判据 | 字段长什么样 | 运行控件 |
| --- | --- | --- | --- |
| `missing` | 卡片没有 `workspace` | 叶子位置写「未选择」，**没有第二行** | 不可用，头部下面写一句「先选一个目录再运行」 |
| `invalid`，宿主还没回答 | 有路径，检查还没回来 | 叶子 + 全路径，**一句话都不多说** | 不可用 |
| `invalid`，宿主已回答 | 有路径，但它不是目录 | 叶子 + 全路径，加一句「工作目录不存在或不是文件夹」 | 不可用 |
| `ready` | 有路径，宿主确认它是目录 | 叶子 + 全路径 | 可用（其余条件都满足时） |

三点不显然的取舍：

- **叶子名是给人扫的，全路径是给人核对的。** 一个 340px 的格子里，`D:\Git\Personal-Workbench` 会把有用的那一段挤到末尾；而只显示 `Personal-Workbench`，同名的两个目录就分不开了。所以主值是叶子、次值是全路径：**路径不会被省略、不会被叶子名取代**，它一直在 DOM 里、也一直挂在 `title` 上。**但它会被 CSS 省略号截断**（`text-overflow: ellipsis` + `white-space: nowrap`，与叶子同一套）——一个 340px 的格子放不下任意长的路径，所以"完整路径永远看得见"只在悬停与 DOM 两层成立，读者不要把这一条读成"任何长度的路径都会完整排出来"（测试断的是文本在，不是它没被截断；jsdom 也量不出省略号）。`workspaceLeaf()` 是纯函数且**只用于显示**：存的是全路径，跑的时候用的也是全路径，叶子名从不回写、从不进入请求。它处理了三种会骗过 `split('/')` 的形状——尾随分隔符（否则主值读成空白）、盘根（`C:\` 会变成 `C:`，那是"该盘上的当前目录"，不是根）、只有分隔符的路径（`/`、`\\`，没有段可命名，那就原样显示）。
- **`checked` 只影响一句话，不影响门。** 检查是异步的，一张卡读回来到宿主回答之间有一帧"有路径但没人确认过"。这一帧里字段**不能**说"目录不见了"——那是句假话；但运行控件照样是灰的。安全方向永远是关，页面只说它知道的事。
- **标签是 `<p>`，不是 `<label for>`。** 这里唯一的控件是那个按钮；`for` 会把标签指向按钮（"选择目录"），而不是用户正在读的那个值。这与模型字段那两种不可选状态的理由是同一条。

**选择器分两条路，没有第三条：**

| 平台 | 来源 | 怎么到达页面 |
| --- | --- | --- |
| Windows + Desktop | `window.__DSH_DESKTOP_PICK_DIRECTORY__`，背后是 `POST /_dsh/desktop/pick-directory`（Electron 的 `dialog.showOpenDialog`） | Desktop 插件只在 `environment.platform === 'win32'` 时装上它（`ctx.effect`，释放时删掉）；本包只读窗口成员，不走任何导入 |
| 其他平台 / 普通浏览器 | `ctx.uiWorkspace.pickDirectory()` | 本包用 `ctx.inject(['uiWorkspace'])` 的**作用域形式**拿一次；服务缺席时那根纤维保持 pending，插件其余部分照常工作 |

**Windows 的两个须知。** 其一，两个来源可能同时在（桌面构建里的 Windows 同时有窗口成员与 `uiWorkspace`），**桌面那个赢**——应用自己的浏览面板打开的就是它，走 `pickDirectory()` 等于为同一个问题开第二条原生通道。其二，窗口成员与它背后的路由是两个版本各自答应的东西：**成员在、路由不被宿主承认**（桌面客户端比宿主新）时，调用会抛错。这不是异常，我们把它读成"没有选择器"：按钮关掉、字段写一句"这个环境没有目录选择器"，**不会**回头再去问 `uiWorkspace`——一个已经选定的来源失败时换一个再试，会让同一句话有两个答案。而成员根本不在（非 Windows、或没装桌面插件）时，按上一张表走 `uiWorkspace`。

**为什么没有第三条路（一个文本框）。** 手打出来的路径是**没有被任何选择器确认过**的目录——可以打错一个字、可以指向一个不存在的盘、可以指向用户根本看不见的那台机器上的路径（如果宿主与浏览器不在同一台机器上）。产品负责人否掉了它，也否掉了工作区下拉（那要求目录先被注册成工作区，而产品要的是"用户选哪个就是哪个"）。所以"没有选择器"这个状态是**如实说出来**，而不是用一个输入框糊过去：`canChooseWorkspace` 为假时，按钮 `disabled` 且多一句说明。

**取消是回答，不是修改。** 选择器回 `null`（用户关掉了对话框）时，`chooseWorkspace()` 直接返回：不写存储、不发请求、字段还是原来那个值。它既不是一次失败（不该报错），也不是"选了个空目录"（不该清掉已有目录）。

**它是一道门，不是一间房。** 这个字段决定"能不能跑"，**不**决定"跑到哪里写"。运行至今仍执行在父会话的目录与父会话的沙箱里——那句话的完整版本与它需要的收口写法在 M5 的[「工作目录：一道门，还不是一间房」](#工作目录一道门还不是一间房第十三版)里，这里不重复，只提醒：不要把这个字段描述成沙箱。

#### 结果页：结果表面与运行详情

结果页（`SkillCardResultPage`）是另一个整栏视图，它在面板标题之下摞了三层：**结果表面 → 微调编辑区 → 运行详情**，最下面是一句权限脚注。它曾经在结果表面之上还有一行状态行，第十一版按产品决定移除了。

| 层 | 内容 | 为什么在这一层 |
| --- | --- | --- |
| 结果表面 | 边框 + 圆角 + 内边距，里面是影子根渲染的文档 | 渲染的文档是用户模板的内容；没有框，它就没有归属 |
| 微调编辑区 | 多行编辑区 + 「重新生成」（运行中变「停止」）+ 记录头部行 + 记录 + 只在本次会话 | 对结果的下一句话，紧跟结果 |
| 运行详情 | 默认折叠的 `<details>`，开关写「运行详情」：结束原因、**模型**（有才出现）、时间、结构化值、原始输出、诊断 | 调试信息，不是内容 |
| 脚注 | `skillCardPermission` | 关于这一页的说明，不是这一页的内容 |

**结果表面只加框，不改文档。** `.resultSurface` 只有 `border` / `border-radius` / `padding`，**没有背景色，也没有任何会进入影子根的样式**：用户模板的排版与配色一个字都不动。

**边界只靠内边距**（第十一版）：用户模板常常自带阴影与圆角，那块阴影会压在表层边框接缝上。表层原先靠一行「结果」`h3` 加它下面的细线（`resultHead`）让容器的上边界读得出来；那一行被产品负责人判为噪音并整行移除，**没有被任何东西替代**。留下的是边框、圆角与 `padding: 12px`——**内边距现在承担全部边界职责**：它把渲染文档（连同它自己的阴影）挡在边框之内。把 `padding` 调小或去掉，文档就会贴到边框上，这条界线也随之消失。表层的 `display: flex` 与 `flex-direction: column` 留着，内容槽还是它唯一的孩子。

**状态与时间只在「运行详情」里读。** 结束原因（`runStopReason` 那一行）与开始时间（`runStartedAt` 那一行）都是详情里的行，运行中的状态则由正文的运行提示（`skillCardRunningBody`）说明。页面没有一行概述，也没有 `data-run-status` 这个钩子：它随那一行一起删掉了，没有第二个读者。`clockText` 留了下来，但只服务微调记录里那条时间。

**运行详情的五处修正**，都由"读不了"引起（前三处是第八版，后两处是第九版）：

1. **`html` 不再是 JSON 里的一段字符串。** `readStructured` 把 `html` 抽出来单独渲染成 `<pre data-run-html>`（等宽、`overflow: auto`、**`white-space: pre`**），其余字段仍是 `JSON.stringify(rest, null, 2)`。抽字段时**按名字逐个拷贝**而不是解构重建，剩下的字段因此保持存储时的顺序——这是这次运行的原始记录，重排一次值就等于把记录改了一次。
2. **缺失的字段整行不出现。** 没有输出文本就没有「原始输出」那一行（那句"这次运行没有留下输出"已从两本字典里删掉），没有诊断就没有诊断行，没有结构化值就没有结构化块。**一个空行说的是"空"，不是"发生了什么"。** 第十二版加的「模型」行守着同一条规则：`result.model` 缺席时整行不存在——那是**继承了会话模型**的运行，宿主并不知道解出来的路由是什么，写一个猜出来的名字比不写更糟。
3. **默认折叠。** `<details>` 不带 `open`：它是"为什么没有数据"的答案，不是数据本身。测试钉的是**没有 `open` 属性**，不只是 `open` 为假——后来被加回去的正是那个属性。
4. **开关的文案是「运行详情」。** 它一度写作「原始输出」，可块里是四行：结束原因、开始时间、结构化值、原始输出。开关用一个子行的名字命名，等于只说了四分之一。今天两个含义用**两个 key**：`runDetailSummary`（开关）与 `runRawOutput`（那一行）。
5. **代码块去掉区间的公共缩进，结束原因说中文。** 两件事都是显示层的：
   - **去缩进**：模型回填的是模板里那段区间的内容，于是每一行都带着区间在模板里的缩进；一份缩进在表格深层的模板，代码块从四百多像素的地方才开始。`dedentedHtml()` 取**非空行的最长公共前导空白**并去掉；空行不参与计算、去掉后不留缩进；没有公共前缀时原文返回。**它只用于显示**：存盘的值要被原样拼回模板，所以那一个是**不能**被改写的（结果页用例同时断言两侧：代码块是去缩进的，影子根里的文档仍是原始的 8 空格缩进）。
   - **结束原因本地化**：`STOP_REASON_KEYS` 是一张**部分映射**（`completed` / `error` / `aborted` → `正常结束` / `出错` / `已中止`），不是穷举。上游的 `stopReason` 是可合并扩展的联合类型，遇到没写进表里的值**原样打印**——编一个看起来合理的标签，等于说出一件这次运行没做过的事。原始值仍挂在 `data-run-stop-reason` 上。

`html` 为空或只有空白时**不抽出来**：它留在 JSON 里（`{"html": "  "}`），因为一个空的代码块既看不出"空"，也看不出空在哪。这是纯显示上的取舍——值本身一个字节都没动。

#### 结果的手工编辑

一次运行的结果并不总是对的，而有时候要改的只是两个字符。这一批给结果页加了一条**比"再说一句话"更短的路**：就地把结果里那段区间 HTML 改成对的，保存后它就是这张卡的结果。

```tsx
// SkillCardPages.tsx
const editable = view.result !== undefined && !running && !bareRunning
const [editing, setEditing] = useState(false)

{editable && !editing
  ? <Button variant="ghost" size="sm" onClick={() => { setEditing(true) }} data-result-edit-start="">{t('skillCardResultEdit')}</Button>
  : null}
<Button variant="primary" size="sm" disabled={bareRunning || editing || (!running && !view.runnable)} …>
  {running ? t('skillCardCancel') : t('skillCardRun')}
</Button>
…
<section className={css.resultSurface} data-result-surface="">
  {editing
    ? <SkillCardResultEditor
        html={resultHtml(view.result?.structured) ?? ''}
        t={t}
        onSave={async (html) => { if (await actions.saveResultEdit(html)) setEditing(false) }}
        onCancel={() => { setEditing(false) }}
      />
    : <div data-result-busy={…}><SkillCardBody view={view} t={t} onAction={actions.click} /></div>}
</section>
```

**编辑器在结果表面的内容槽里，不在别处。** 它是**就地切换**，不是浮层：共享原语没有对话框，配置页的编辑器也是这么做的。表层的边框与内边距留在原地——被编辑的正是刚才渲染在那里的东西，框没有理由消失。

**编辑的只有片段，且只从记录里读。**

| 读什么 | 从哪读 | 为什么不是别处 |
| --- | --- | --- |
| 片段初值 | `stored.result.structured.html`（经 `resultHtml`） | 页面上的渲染文档是"模板拼上片段"的成品，它的文本**不是**能把片段拼回模板的那个值；从 DOM 读会把骨架一起读进来 |
| 模板 | 从不读 | 编辑结果是结果这一层的事；改骨架要回配置页（需求 E13） |
| 保存的内容 | 字段里的 `draft` | 它是用户写的那份，逐字发给宿主 |

**键盘与外观照抄模板编辑器，文档级的三样东西一个都不带。** `text-editing.ts` 是这一批新拆出来的：`INDENT`、`LINE_HEIGHT`、`lineIndexAt`、`lineBounds`、`indentBlock` 现在由两个编辑器共用，模板编辑器只是把 `editIndent` 改成"算一次、写一次"：

```ts
// 模板编辑器与结果编辑器共用同一份算术
export function indentBlock(text, selectionStart, selectionEnd, outdent): IndentEdit | undefined
// 没有一个字符要动时返回 undefined：空按一次 Shift+Tab 不该往文本里塞一次无变化的编辑
```

- **Tab / Shift+Tab**：裸光标缩进两空格、反缩进删它**前面**的至多两空格；跨行选区整块移动一级，选区跟着重算。
- **Escape 之后 Tab 离开字段**：Tab 被编辑器占用的那一刻不给出口，就等于把键盘用户关在里面。
- **Ctrl/Cmd+S 保存**并 `preventDefault()`，与按钮走**同一个** `saveable` 门。
- **行号栏每行一个元素**，`aria-hidden`、逐行 `tabIndex={-1}`、点行号选中该行，`onScroll` 与文本区同步——与模板编辑器同一份实现思路（`.gutter` / `.gutterLine` / `.editorPane` 都复用，没有为结果编辑器新写一套样式）。
- **没有区间染色**（片段里没有 `template-begin` / `template-end`）、**没有声明构建器**（片段里不能声明动作）、**没有骨架插入**（片段不是文档，一份骨架在这里没有意义）。这一点是需求 E16，也是两个编辑器唯一的形态差别。

**保存门（`saveable`）拦三件事，缺一不存：**

```ts
const bytes = new TextEncoder().encode(draft).length        // 字节，不是字符
const overBudget = bytes > WORKBENCH_RESULT_MAX_BYTES
const empty = draft.trim() === ''
const violations = useMemo(() => analyzeFragment(draft), [draft])
const saveable = dirty && !empty && !overBudget && violations.length === 0
```

1. **五个内容策略构造**（`script`、`event-attribute`、`unsafe-url`、`external-element`、`external-css`）。它们由 `analyzeFragment()` 报——这是这一批在 `template.ts` 里新增的**窄入口**：

   ```ts
   /** 五个内容策略码，什么都不多报。 */
   export function analyzeFragment(html: string): readonly WorkbenchFragmentViolation[] {
     const found: WorkbenchFragmentViolation[] = []
     walk(parseTemplate(html), 'root', found, html.toLowerCase())
     return found
   }
   ```

   为什么不是"跑一遍 `analyzeTemplate` 再筛五个码"：片段**不是文档**，它没有区间标记、也没有声明块，`analyzeTemplate` 会因为它"缺区间"而拒绝一次完全合法的编辑。`contentViolations()` 反过来改成直接复用 `analyzeFragment`，于是这五条规则在两个编辑器里是同一份代码。文案也归到一处（`violation-copy.ts` 的 `CONTENT_VIOLATION_KEYS`），模板编辑器的 14 项 `VIOLATION_KEYS` 用展开把这份并进去。
2. **空内容**：`trim()` 之后为空也算空。消息要说出"结果为空"**并指出这张卡可以再运行一次**——空区间渲染出来像一张坏卡，而"再跑一次"是比"存一份空的"更好的出口。
3. **超过 `WORKBENCH_RESULT_MAX_BYTES`**：读数写成 `12,480 / 65,536 字节`，超 85% 变警告色，超上限时额外多一行 `role="alert"` 的拒绝说明。**字段里的内容保持完整**：拒绝不能变成在框里截断。

`dirty` 也在门里：打开编辑器、什么都不改就按保存，会把 `editedAt` 盖到一份没人编辑过的结果上——**未改动的草稿不值得一次写**，所以这时保存是禁用的。

**一条独立的结果写路由，不借运行路由。**

```
PUT /api/workbench/skill-card/result        body: { cardId, html }
 → 200 { apiVersion, revision, result }     404 这张卡没有结果   413 超预算   400 字段不合契约
```

- 不复用 `POST /run`：手工编辑不是一次运行，它没有阶段可轮询，也不该让运行的前置条件（skill、模板、会话、输出契约）替一个不跑任何东西的操作作答（需求 §19.4(i)）。
- 校验 `cardId`（命名空间 slug）与 `html`（字符串），并按 `Math.min(maxResultBytes, WORKBENCH_RESULT_MAX_BYTES)` 拒绝超预算——部署可以收紧上限，**不能放宽契约**。
- 回执带上**新记录与新 revision**，页面据此更新，不再读一遍配置；否则下一次配置写会拿着过期 revision 白白冲突一次。

**store 的合并是这一批最容易写错的一段**（`putEditedResult`）：

```ts
const record: WorkbenchResultRecord = {
  ...previous,                       // skill、stopReason、outputText、diagnostic 原样留下
  executedAt: this.moment(),
  editedAt: this.moment(),           // 同一个时刻：这就是"这份结果是被改出来的"那一次
  structured: { ...structuredRecord(previous.structured), html },
}
```

- **只替换 `structured.html`**，结构化值里的其余字段也保留（`structuredRecord` 只接受普通对象：把一个字符串 `...` 展开会变成每个字符一个键）。
- **不伪造运行**：`skill` 与 `stopReason` 是"哪一次运行"的事实，手工编辑对它无话可说。所以一张**没有结果**的卡返回 `missing`（404）——没有记录可以站在这两个事实上。
- **拒绝而不裁剪**：片段超预算返回 `too-large`；片段没超、但**整条记录**（片段 + 这次运行的原始输出）超预算时同样返回 `too-large`。裁剪就变成"存一份、显示另一份"，而那正是这条预算存在的理由（`putResult` 的 `trimResult` 是运行路径上的取舍，手工编辑不走它）。
- **下一次运行覆盖它**：一次运行写的是全新记录，`editedAt` 自然消失。这就是"运行一张卡"本来的语义（需求 E14）。

**客户端一侧**：`actions.saveResultEdit(html)` 收下草稿，`api.saveResult(cardId, html)` 发一次 `PUT`，成功时把回执里的 `revision` 与 `result` 一起折进 controller 的 `config`（`replaceResult` 就地替换、按 cardId 排序，不追加第二条），并把**编辑前那份记录**放进 `previousResult`——「回到上一版」因此不需要第二套机制。

```ts
// controller.ts
if (prior !== undefined) setPreviousResult(prior)   // 回退的入口与微调共用
setResultOverride(undefined)
// 刻意不动 refinements：那份记录记的是指令，手工编辑不是指令
```

- **失败留在编辑器里**：写入被拒时 `view.problem` 在结果表面上方以 `role="alert"` 说明原因，编辑器**保持打开**、草稿不动。存盘失败看起来像成功，是这个面板一再修的那类缺陷。
- **不写盘的回退**：`undoRefine` 把 `previousResult` 变回屏幕上的 `resultOverride`，用掉即消失、不写存储——与微调的回退完全同一条路径（需求 E17）。
- **「修改记录 · 0 次」与「回到上一版」同时出现**：这不是缺陷。头部那个计数说的是**问过几次**，回退说的是**能退回什么**；一次手工编辑让后者成立、前者仍为 0。这一条在验收 67 里被明确钉住。
- **编辑器打开期间的取舍**：入口自己消失、「运行」不可按、微调编辑区不画。三件事同一个理由——**一次运行会替换草稿所依据的那份结果**，而这是一次没有确认的破坏。

#### 微调编辑区

结果下方的这块区域是"再改一次"的地方，顺序就是说话的次序：

```tsx
<div className={css.composer} data-refine-composer="">
  <div className={css.composerRow}>
    <textarea rows={rows} value={instruction} disabled={busy} … />   {/* 一到四行，随内容长高 */}
    {busy
      ? <Button variant="ghost" size="sm" onClick={onStop}>{t('refineStop')}</Button>
      : <Button variant="primary" size="sm" disabled={empty} onClick={submit}>{t('refineAction')}</Button>}
  </div>
  {view.refineProblem === undefined ? null : <p role="alert" data-refine-problem={…}>…</p>}
  <div className={css.refineLog} data-refine-log="">
    <div className={css.refineLogHead}>…修改记录 · N 次… …回到上一版…</div>
    <ol>…每条：那句话 + 紧跟的时间…</ol>
    <p>…只在本次会话…</p>
  </div>
</div>
```

**编辑区抄的是聊天输入区的尺寸，不是自己挑的**（需求 FR-41）。来源是应用自己的聊天输入区——`@deepseek-ai/dsh-client-ui-conversation` 的 `skeleton/InputBar.module.css`：

| 项 | 值 | 来源 |
| --- | --- | --- |
| `min-height` | `36px` | `.input` |
| `padding` | `4px 8px 0 14px` | `.input`（占位符 `inset` 与它对齐） |
| 圆角 | `var(--dsw-radius-panel)`（28px） | `.card`，令牌由主题定义 |
| 字号 | `var(--dsh-content-font-size, 14px)` | `.card`，用户设置的内容字号 |
| 行高 | `calc(24px + var(--dsh-content-font-delta, 0px))` | `.card`，主题定义 delta |

同样的来源还给了底色 `--dsw-specific-input-major`、描边（`--dsw-elevation-soft` + `--dsw-elevation-stroke-color: var(--dsw-alias-border-l2)`）、字体 `--dsw-font-family`、占位符 `--dsw-alias-label-caption` 与禁用态颜色。**唯一的偏差是下内边距 `4px` 而不是 `0`**：聊天输入区下面还有一条工具栏行（`padding: 2px 8px 6px`）替它留出底部空间，这块编辑区到底就是自己的下边缘（描边是阴影、不占布局），用 `0` 会让第四行压在那条线上。这一条写在注释里，也写在需求 §18.6 里——偏差要留下来，但不能是哑的。

**长高**：`rows` 由换行数得出（1–4，量不到时的兜底）；布局后再测一次——高度先置 `auto`，再写成 `scrollHeight`（折行的长句也会长高），上限由 CSS 的 `max-height` 封住（四行的行高 + 上下内边距，另留 2px 余量；框没有边框，描边是阴影），超出即在框内滚动。`scrollHeight` 为 0 时**不塌**：保留 `rows` 的高度。

- **按钮的门是"输入非空且没有运行在跑"**（`trim()` 之后为空也算空）。控制器里还有同一道门：这是会花一次模型调用的路径。
- **发送后清空编辑区**，否则那句话留在框里读起来像"还没生效"。
- **运行中那个位置是「停止」，不是禁用的「重新生成」**（需求 FR-44）：页面头部的取消在结果把页面撑高之后滚出视野，而用户正看着结果与编辑区。它调用与头部**同一个** `actions.cancel`，没有第二条中断路径；被取消的运行仍按"失败或被取消"结算，结果留在屏幕上、`refineProblem` 报在下方。
- **运行中编辑区本身禁用**，结果表面同时进入忙碌态（`data-result-busy="true"`、`aria-busy`）；忙碌态用的仍是既有的运行态提示（`skillCardRunningBody`），它盖住的正是"这一段正在被重写"。
- **`Enter` 提交、`Shift+Enter` 换行**；`event.nativeEvent.isComposing` 为真时**不提交**——输入法用 `Enter` 确认候选词，在那里提交会送出半句话。
- **失败报在编辑区下方**，`role="alert"`，并且**页面上只有这一处**：`view.refineProblem` 存在时，结果上方那行 `view.problem` 不画——同一次失败说两遍比说一遍更糟。
- **记录只在有内容时出现**（`refinements` 或 `previous` 非空）：一个空列表的标题只是噪音。
- **记录有一个头部行**：左边 `修改记录 · N 次`（计数，不是句子），右边「回到上一版」，**没有上一版时它不出现**。它曾经是列表下方单独一行的链接，比记录本身还显眼。
- **记录读起来像对话**：每条是"那句话 + 生效时间"，时间**紧跟在那句话后面**（小一号、三级色、`tabular-nums`、不换行），而不是被推到整行最右——推到边缘之后时间和那句话成了两列，读起来像表格。
- **"只在本次会话"是整块的最后一行**，措辞要同时盖住**记录与回退**（需求 R5）：消失的不只是这张清单，还有「回到上一版」能退回去的那一版。

**jsdom 断言不到的部分（写明，不含糊）：**

| 这一版做了什么 | 为什么断言不到 |
| --- | --- |
| 结果表面的边框、圆角、内边距，以及与运行详情之间的细线 | 全是 CSS 声明，jsdom 不计算样式；测试断言的是 DOM 结构与层级（渲染文档在 `[data-result-surface]` 之内，而那个表层不带标题行、也不带 `aria-labelledby`） |
| 运行详情的折叠**动画** | jsdom 不实现 `<details>` 的过渡，只有"关着 / 打开"两种状态可断言 |
| 编辑区**量出来的高度** | 高度是布局后由 `scrollHeight` 写进内联样式的像素；jsdom 没有布局，`scrollHeight` 恒为 0，可断言的只有 `rows`（1–4）与键盘行为 |
| 忙碌态的**外观** | 断言的是 `data-result-busy`、`aria-busy` 与"渲染文档被运行态提示替换"这个结构事实 |
| 「可滚动、不折行」的 `html` 代码块 | 断言的是文本本身是原值（真实换行、无字面 `\n`；去缩进后的样例行）；`overflow` 与 `white-space` 是 CSS |
| 结果编辑器里**行号与行的对齐**（等宽、字号、行高、内边距四处必须一致） | jsdom 不排版：能断言的只有"每行一个元素、数量与行数一致、点行号选中该行"，对齐与否只能人工看 |
| 结果编辑器的**打开/关闭** | 它没有过渡：同一块结果表面的内容槽从渲染文档换成编辑器，是重渲染而不是浮层，因此没有"动画"可断言（与折叠动画不同，这里本来就没有） |
| 模型选择器**展开后的样子**（下拉面板、`optgroup` 的分隔、截断与省略） | jsdom 只有 DOM：断言的是 `optgroup` 的 `label` 序列、选项文本序列、`select.value`，以及选择变化时回调拿到的那一对；原生弹出层与外观由浏览器决定 |
| 模型的两种**不可选状态**的视觉密度（与选择器等高的 28px 文本框） | 高度、边框与颜色都是 CSS 声明，jsdom 不计算样式；断言的是"没有 `select`、`[data-model-fixed]` / `[data-model-unavailable]` 存在且文案正确、标签不再是 `for`" |

模型字段本身没有引入新的"不可测"类别：它要断言的每一件事（三个状态、运行控件的可用性、写到存储的那一对、运行详情那一行）都在 DOM 或请求体里，而它的外观与原生控件行为与其它字段一样由 CSS/浏览器决定。

#### 模板是前置条件

**没有模板时卡片不提供「运行」**，保存后回到卡片，运行按钮才可用。

宿主侧同样拒绝无模板的运行（`template-missing`），而且它**自己从存储回答"有没有模板"**，不依赖客户端自律——这是 M6 那条纪律的又一次体现。

保存的**唯一一道门**在这里，按钮与快捷键共用它，因此不存在"第二个入口把被拒的文档存进去"：

```ts
// 缺失目标故意不在门内：它指向的卡片可以以后才建。
const saveable = analysis.violations.length === 0 && draft.length > 0 && view.skill !== undefined
```

#### 预览

预览把**正在编辑的这份文档本身**交给 **M3 的同一个渲染函数**（`ShadowHtml` → `renderTemplate`）：同一条解析路径、同一遍清洗、同一个影子根。

- **没有"占位样值"。** 预览展示的就是骨架——这正是用户交给子代理的那份东西。
- **标签必须说真话。** 它一度写作「使用示例数据」，而预览从来不填示例值：这份产品**有意拒绝示例数据**（填进去的假值会让人以为卡片已经能用）。标签因此改为「骨架预览，区间尚未填充」，说的是它实际渲染的东西。
- **注释在预览里是注释**：它们说明要填什么，不产生画面。
- **未保存的草稿也能预览**：预览用的是编辑器里的 `draft`，不是存储里的模板，所以违例能边写边看见。

#### 行号栏

**一行一个元素**，不是拼成一整段数字文本。原因只有一个：染色必须落在**属于它的那些行**上，一整段文字做不到。

```tsx
<pre ref={gutter} className={css.gutter} aria-hidden="true">
  {gutterLines.map(line => (
    <button
      key={line.number}
      type="button"
      tabIndex={-1}                                   // 不是 Tab 停靠点
      className={gutterLineClass(line.kind)}
      onMouseDown={(event) => { event.preventDefault() }}  // 焦点留在文本区
      onClick={() => { selectLine(line.number - 1) }}
    >
      {line.number}
    </button>
  ))}
</pre>
```

- **同步滚动**：文本区 `onScroll` 把 `scrollTop` 写给行号栏。固定不动的行号栏配一个可滚动的文本区，标出来的行号是错的——这不是优化，是正确性。行号栏自己 `overflow: hidden`，它从不独立滚动。
- **两处染色**：`gutterLines` 先按 `findActionsBlock` 标出 `dsh-actions` 块的行（`gutterLineActions`，更淡的一层），再按 `regionLines` 标出区间（`gutterLineRegion`，强调色 + 强调色左边框）。**后标的覆盖先标的，所以区间胜**：声明写在区间里本身就是一条违例，而区间是读者必须先看到的事实。
- **行号对齐**：每行固定 `border-left: 2px solid transparent`，染色时只换颜色不换宽度；字体、字号、行高与垂直内边距在两个元素上各写一遍——任何一处不同，数字就会从它标注的那一行上滑走。
- **点行号选行**：`selectLine` 用 `lineBounds` 取该行（不含换行符）的范围，再走与违例跳转同一个 `revealRange`，焦点回到文本区。
- **对读屏隐藏**（`aria-hidden`）且逐行 `tabIndex={-1}`：它是文本区上的鼠标便利，不是一串新的键盘负担。

#### 状态行

一行三件事，顺序就是写文档时的关注顺序：

```
区间 42–58 · 动作声明 3 条 · 12,480 / 32,768 字节 · 有未保存的改动
```

- **行号，不是偏移。** `regionLines` 由 `region.start` / `region.end` 换算成 1 基行号：`region.start` 是开启标记之后第一个字符，所以它属于开启标记那一行；闭合标记同理。
- **字节，不是字符。** `new TextEncoder().encode(draft).length` 对着 `WORKBENCH_TEMPLATE_MAX_BYTES`。宿主的上限是 UTF-8 字节，按字符计会把一份中文文档报告成"还放得下"，而宿主会拒绝它——9,500 个汉字按字符计远不到提醒线，按字节计已经过了它。
- **85% 变警告色**（`.editorStatusWarn`）：这是提醒，不是限制；真正的限制在存储时。
- **脏标记**：`draft !== view.template` 或名字变了，就在同一行追加「有未保存的改动」。
- **缺区间时整行变警告**，并给一个「插入标记」：`insertRegionMarkers` 在光标处写入成对标记（各自独占一行——标记与别的内容同行会把区间在中途打开或关闭），**光标落在两标记之间的空行**，那正是用户接下来要打字的地方；写完之后按钮消失，状态行改报新的行号。
- **模板为空时给的是「插入骨架」**（下一节），不是标记：空文本框需要的是整份示例，不只是两个标记。
- 右边还有一个「添加动作」，见「声明构建器」。
- 数字用 `Intl.NumberFormat('en-US')` 分组（`12,480`），因为一长串数字要数位数才能读。

#### 键盘

```ts
const escaped = useRef(false)
```

- **Tab 缩进两空格，Shift+Tab 反缩进。** `editIndent` 分两种情形：
  - **裸光标**：Tab 在光标处插入两空格；Shift+Tab 删除光标**前面**的至多两空格（`<p>  a` 把光标放在空格之后是常见形态，而"行首"不是）。
  - **选区跨行**：覆盖的每一行各移动一级，块的相对形状不变；选区跟着重算，不会因为多出的空格而错位。
- **Escape 之后 Tab 离开字段。** Tab 被编辑器占用的那一刻，不给出出口就等于把键盘用户关在里面：按 Escape 之后，下一次 Tab **不做任何处理**，交给浏览器移动焦点。
- **Ctrl/Cmd+S 保存**并 `preventDefault()`：浏览器默认会去"保存"整个外壳页面，而这里要保存的是这份模板。它和按钮走**同一个** `saveable` 门（上面那段），所以不可保存时它也不保存，但仍然吞掉默认行为。
- 写回文本用 `queueMicrotask` 恢复选区：React 的重渲染发生在这之后，同步设置 `setSelectionRange` 会被旧值覆盖。

#### 违例清单与定位

`useMemo(() => analyzeTemplate(draft), [draft])` 的结果逐条渲染成一行"本地化文案 · 位置"（`VIOLATION_KEYS` 是一张穷尽的记录，新增一个违规码会在这里编译失败直到它有文案）。

**位置可以点，也可以没有：**

- 违例带 `offset` 时渲染成按钮：点击 → `revealRange(offset, offset + (token?.length ?? 1))`，选中那一段、把焦点放回文本区、并**居中滚动**到它。
- **没有 `offset`（如缺区间）时渲染成纯文本**：一个点了不动的按钮比一行字更糟。
- 文本区没有"按偏移滚动"的接口，所以定位靠"行号 × 行高"这两个数：`LINE_HEIGHT = 18` 与两个元素上写死的 `line-height: 18px` 必须一致，`revealRange` 才能把目标放到视野中部。程序化滚动不一定触发 `scroll` 事件，所以它顺手把行号栏也同步一次——慢一帧的行号栏是错的号码。

**精度分两档**（类型的注释里写了，实现见 M2）：

- **精确**：区间标记、占位符残留、声明块的每一行——扫描时手里就有匹配的位置。
- **近似**：五个内容策略码（`script`、`event-attribute`、`unsafe-url`、`external-element`、`external-css`）。它们来自解析后的 DOM，DOM 不带源码区间，所以取的是"该标签名首次出现的位置"。同一标签出现多次时它可能指向第一个，未必是肇事那一个——够把光标放到那一行，但**不能当成精确位置来宣称**。

#### 声明构建器

动作声明是模板里**唯一需要背语法**的地方：键写错，或者把 `card` 写成 `cards`，渲染出来是一张完全正常的卡，只是每个按钮都被拒。所以由面板代写。

- 三个字段：**动作键**、**类型**（card / skill）、**目标**（卡片取 `view.cardTitles`——用户看到的标题，也正是点击路径按名称解析的那一份；skill 取 `userInvocable` 的那一份，因为点击路径只认这些）。
- **边输入边校验**：键必须匹配 `WORKBENCH_ACTION_KEY_PATTERN`，已被本模板占用的键直接拒绝（否则用户只是换了个顺序走到 `action-key-repeated` 那条违例）。说明文字就地显示文法或拒绝原因，并用 `aria-describedby` 指到输入框——落到错误上的人得知道它说的是哪个字段。
- 两类目标各记各的选择：把类型切过去看一眼再切回来，原来选中的目标还在。
- 列表为空时**说出原因**（没有卡片 / 目录为空 / 目录读不到）并禁用确认：一个没有任何说明的禁用按钮正是这个面板要消除的东西。
- Escape 关闭面板（和删除确认一致：误开的面板不该需要再看一眼才能关）。

**写入规则（`declarations.ts`）**，这一段是踩过两个坑之后定下的：

- **已有块：整块按它本来的缩进重发。** 只拼接字符会把块里原有的空行与多余缩进留在原地，于是**每加一条就漂一点**；而从标记而不是行首开始替换，会把旧的缩进留在新标记前面，于是**结束分隔符与它自己的条目不在同一层**。现在块被整块重写：首行用原来的缩进，条目深一级（`indent + '  '`），`-->` 与首行对齐；块里原有的声明逐条保留，块**外**的内容一字不动。
- 只有空白才允许被吞掉：标记若与别的内容同行（`<div><!-- dsh-actions a: card "A" --></div>`），那行前面的内容不是我们的，所以从标记本身开始替换、缩进按空串处理。
- **没有块时新建一个，位置在 `<!-- template-begin -->` 之前。** 区间每次运行会被整体重写，声明写进区间只能活一次；放在文档末尾则会在"区间缺了闭合标记"时被一起吞掉。
- 写完**关闭面板、光标落在刚写的那一行**（`insertion.lineStart`）：这是用户要"看见它发生了"的那一行。面板只在写入之后关闭，被拒绝的插入不会看起来像成功。

#### 缺失目标告警

一条声明可以指向一个**现在还不存在**的目标：卡片可以以后才建，skill 可以以后才装。所以它告警，但**不进保存门**。

- 判断放在编辑器里，不放分析器：分析器是纯文本函数，它手上没有卡片清单，也没有 skill 目录。
- 两道门避免误报：配置还没读出来（`view.status !== 'ready'`）时什么都不报（否则每一张卡都是"缺失"）；目录读不出来（`catalogStatus !== 'ready'`）时不报 skill 缺失——**读不到不等于不存在**。
- 渲染成状态行下方一个 `data-action-target-warnings` 的列表，文案与违例同一副样式：它读起来像问题，但「保存」照旧可用。

#### 骨架插入

模板为空时，状态行提供「插入骨架」（`templateSkeleton(t)`）。它是一份**完整文档**：`<style>`、**空的** `dsh-actions` 块、区间标记对；区间里一段注释说明要生成什么、一行示例按钮、以及 `&#39;` 的转义规则。

- **文案本地化，标记与示例是字面量**：注释是给人读、给子代理执行的说明；标记与属性是语法，翻译它们等于破坏它们。
- **必须零违例**：`skill-card-skeleton.spec.ts` 用中英两本字典各生成一次并断言 `violations` 为空、区间存在、块为空。一个打开就报错的起手样例比空框更糟。
- 只在模板为空时提供：非空模板上给"插入骨架"等于提供一个覆盖自己文档的按钮。
- 插入后光标落在**区间起点**：那是用户接下来要替换的那一段。

#### 并排与切换

编辑与预览是**同一件事看两遍**：宽到放得下两块可读区域时它们并排，标签条隐藏；窄了以后并排会把后一块推到折叠线以下，于是标签接管选择，标题隐藏（标签已经说了窗格的名字）。

- 实现是一条 CSS 媒体查询 + 一个状态：`.panes` 在 `min-width: 1100px` 变成两列并 `display: none` 掉 `.paneTabs`；`max-width: 1099px` 时按 `data-pane` 只显示一个 `.section`，并隐藏它们的 `h2`。
- 断点是"两块可读窗格不再放得下"的位置，不是设备判断。
- **测试断言的是 CSS 所依据的状态**（`data-pane` 与两个标签的 `aria-selected`），不是响应式结果：jsdom 不计算媒体查询，也没有布局。这一点在验收标准 43 与附录 A.3 里都标明了。

#### 粘性页脚：保存、失败行与两段式删除

页脚 `position: sticky; bottom: 0`，背景取页面底色：保存不能依赖"滚过一段可能任意高的预览"。

- 左边是 `保存`（`primary`，受 `saveable` 约束）与 `关闭`。
- **最右是危险色的「删除卡片」**，用一个 `flex: 1 1 auto` 的间隔把它推到远离那对"不读就按"的按钮的地方。
- **删除需要两次按下**：第一次只把 `deleteArmed` 置真，按钮换成 `确认删除` + `取消`，并在 `aria-live="polite"` 的提示位写出"删除后无法撤销"。第二次（`确认删除`）才调用 `onDelete`；`取消` 与 **Escape** 都回到未确认态（Escape 由页脚上的 `onKeyDown` 处理，所以焦点在页脚里任何位置都有效）。
- **没有对话框**：共享原语不提供 dialog，自己造一个会往应用里加第二套浮层机制，所以确认就地完成。
- 删除的写入与离开**由页面负责**（`SkillCardConfigPage` 的 `onDelete` 先 `remove()` 再 `onBack()`）：宿主提交之后才回网格，否则网格会把刚删掉的卡再读回来。
- **写入失败渲染在页脚内部**：

```tsx
{view.problem === undefined ? null : (
  <p className={css.writeFailure} role="alert">
    {t(problemKey(view.problem.code))}
    {view.problem.detail === undefined || view.problem.detail === '' ? '' : ` · ${view.problem.detail}`}
  </p>
)}
```

它曾经根本不渲染：一次被拒绝的写入在页面上和成功一模一样。现在它在 `role="alert"` 里，并且在**粘性页脚内**——失败不会随内容滚出视野。

#### 约束：只用主题实际定义的令牌

编辑器与外壳里一共有**九条焦点规则**（编辑器的输入框与下拉、行号所在的编辑区、违例跳转、窗格标签，外壳里可激活的卡片与图标按钮，以及创建磁贴）引用过 `--dsw-alias-border-focus`，而**安装的主题并没有定义这个令牌**。后果不是报错，而是那些声明在计算值阶段失效：焦点环退化成看不出来的默认值。写的时候没有任何提示（未知的自定义属性是合法的），用的时候也看不出少了什么——**每一个用键盘的人都在没有焦点提示的界面里走**。

承载焦点环的那几处（输入框与下拉的边框、编辑区的 `focus-within` 边框、图标按钮与可激活卡片的 `outline`、窗格标签与创建磁贴的 `outline`）现在统一引用 `--dsw-alias-brand-primary`（主题里定义了的强调色，也是本包其它地方用的那一支）。另外两处本来就不画环形：编辑区把自己的内层 `outline` 清掉（外框由 `focus-within` 负责），违例跳转只改文字色。约束由此确定：**CSS 只能用主题实际定义的令牌**；引用一个不存在的自定义属性不会在构建期或运行期报错，它只是安静地什么都不做。

#### 约束：两处输入区用同一套数字，偏差要写下来

微调编辑区不是"照着聊天输入区画一个像的"，而是**抄它的数字**：`min-height: 36px`、`padding: 4px 8px 0 14px`、`--dsw-radius-panel`、`var(--dsh-content-font-size, 14px)` 与 `calc(24px + var(--dsh-content-font-delta, 0px))` 都来自 `@deepseek-ai/dsh-client-ui-conversation` 的 `InputBar.module.css`（`.input` 与 `.card`）。理由很直接：用户在这块框里写的是同一类东西——一句话的指令——而两个长得不一样的指令框会让"这个框更小，所以它更次要"成为一个没人打算表达的暗示。

代价是**应用那边的输入区一改，这块就旧了**。这是接受的：这条依赖没有代码层面的耦合（不引用对方的模块，只抄数字），过期时表现为"两块框看起来不完全一样"，而不是坏掉。

**唯一刻意的偏差**是下内边距（`4px` 对 `0`，理由见「微调编辑区」）。偏差必须写在注释与需求 §18.6 里：一个既不是抄来的、也不是选来的数字，如果哪里都不写，下一个人只会以为抄漏了。

#### 约束：页头不再放「刷新」

工作台页头曾经有一个「刷新」按钮。它只重读一次排版顺序，**没有任何可见效果**（卡片内容与结果都不在它的覆盖范围内），而"刷新"这个名字许诺的远多于这一点——一个按下去看不出变化的按钮，会让人怀疑别的东西也没生效。

按钮已从页头移除，页头只剩标题与副标题。`refreshAll` 这个 locale 键**保留**：卡片外壳自己的刷新控件（`onRefresh`，可选）仍然拿它当 `aria-label`。删掉键会让那个控件变成无名按钮。

### 结果 R

- 用户所见即所得：预览与正式渲染同一条路径，标签说的就是它渲染的东西。
- 缺标记、重复标记、旧占位符语法与违禁构造都在提交前被拦下，条目能点、点了就跳到出问题的那一段。
- 行号、区间与声明条数一直摆在眼前；体积按宿主计量的单位报，快超限时提前变色。
- 键盘用户能缩进、也能出去；鼠标用户能点行号、能点违例。
- 声明块由面板代写，加多少条都不会漂；指向尚无目标的声明会被告知，但不会拦住保存。
- 空模板一键得到一份能通过分析的起手文档。
- 保存与删除都在手边（粘性页脚），删除要两次按下，写入失败不会被滚动带走。
- 结果页上：结果有框（框的边界靠边框、圆角与内边距，没有标题行、也没有状态行），权限说明退到脚注；运行详情默认折叠、开关写「运行详情」、`html` 按真实换行且去掉区间缩进读得懂、结束原因是中文、缺失的字段不占行。
- 不满意时不必重跑：一句话改一次，记录在旁边，退一步就在记录里；这两样只在本次会话里，页面上写着这句话。那句话写在一块与聊天输入区同形的编辑区里（1–4 行随内容长高，`Enter` 提交、`Shift+Enter` 换行），运行中它的「重新生成」变成「停止」。
- 结果也可以**由人直接改**：头部一个次级「编辑」把结果表面就地切成编辑器，改的是存盘那段片段；五个内容策略构造、空内容与超预算都在保存前被拒并说明理由；保存后它就是这张卡的结果，运行详情里多一行「手工编辑」，**一步**回退仍在，「修改记录」仍然是 0 条——那份记录记的是指令，不是编辑。
- 这个面板的每个视图——网格、结果页、配置页——都在「工作台」标题之下；卡片页自己的头部排在它下面。
- 没有任何一处靠"引用一个主题没定义的令牌"来假装有样式。

---

## M11 依赖与构建

> 文件：`package.json`、`vite.client.config.ts`、`tsdown.config.ts`

### 情境 S

新能力要引用的东西分两类：

- **运行时值**：第二版这里要引上游的 `assertObjectJsonSchema`，用来校验**客户端反推出来的**契约——那份契约的内容会随模板变，规则必须与上游同源。**这条需求已经消失**：契约是 `skill-card-contract.ts` 里的一个自有常量 `WORKBENCH_OUTPUT_SCHEMA`，没有任何需要与上游比对的内容。
- **若干类型**：`SkillDefinition`、`ContentBlock`、子代理的请求与结果类型，以及宿主 `agent/error` 事件的形状。

而 P1 阶段踩过一个坑：某个上游包的 `.d.ts` 无法解析它自己的依赖，导致类型检查失败。所以类型依赖的引入要有备选方案。

### 任务 T

1. 声明新依赖，并区分运行时值与纯类型。
2. 控制类型解析风险，给出退化方案。
3. 保持构建面不变——尤其不要让客户端包新增非基线外部依赖。

### 行动 A

**实际结论：本次没有新增任何运行时依赖。** 全部走窄接口与本地复刻：

| 需要的东西 | 做法 | 为什么不用上游 |
| --- | --- | --- |
| Agent / skill / subagent 的服务形状 | `src/skill-card-host.ts` 就地窄接口 | 与布局路由声明 Connection 围栏同一套做法；外层工作区根本不装这些包 |
| `agent/error` 事件的形状 | `src/index.ts` 里就地窄接口（`WorkbenchAgentErrorBus`） | 该事件由 agent loop 的模块增补声明，本包不 import 那个包，所以 `Events` 映射里看不到它 |
| 契约合法性 | **交给 `startActivation`** 判，外加一次形状预检 | 契约是本地常量，客户端没有可反推的东西要校验；`assertObjectJsonSchema` 在上游启动路径里已经调用，我们再引一份只会引入版本错配 |
| 技能正文的 `<skill_content>` 包裹 | `src/skill-card-prompt.ts` 复刻常量 | 两个通道钉的上游版本不同（stable `0.2.0-rc.2`、beta `0.2.1-alpha.2`），运行时导入会让 prompt 跟着**通道**漂移；复刻反而保证两个通道一个形状 |

**复刻带来的已知代价**：上游改了包裹格式，这个模块要跟着改。它是 12 行静态文本，且模块 JSDoc 里写明了出处与函数名，便于比对。

**形状预检**只回答"这是不是一个 `type: 'object'` 的普通对象"。它拦的是"请求压根没带契约"这类情况——那种情况下启动子代理会白花一次模型调用才失败。真正的子集校验仍由上游完成。

**构建面**：`tsdown` 出宿主半，`vite build` 出 `client.js`。客户端外部依赖仍只允许基线模块——本次没有新增非基线值导入，所以 `verify:artifacts` 的断言不用改。

### 结果 R

- 依赖声明明确区分了运行时与纯类型。
- 类型解析出问题时有一条已经想好的退路，不会临时抓瞎。
- 客户端包的外部依赖清单不变，产物校验继续通过。

---

## M12 失败、可观测与安全（横切）

> 贯穿 M2–M10

### 情境 S

这个功能引入了两个不可信来源，以及一个高风险的能力选择。它们不落在任何单个模块里，所以单独作为横切设计说明。

### 任务 T

1. 断掉"两个不可信来源汇进同一棵 DOM"的注入链。
2. 落实权限决策的配套措施。
3. 每一类失败都有可操作的表现，不出现"出错了但不知道该干什么"。
4. 运行时可观测，且日志不回显用户数据。

### 行动 A

#### 两个不可信来源的处置

| 来源 | 信任级别 | 处置 |
| --- | --- | --- |
| 用户写的骨架文档 | 自伤面，但会被复制粘贴、将来会被分享 | 影子根隔离 + 禁脚本 + 禁外链 + 保存时拒绝 |
| 子代理回填的片段（模型基于模板、skill 与工具输出生成） | 不可信输入，且**这一版它是 HTML** | 渲染前清洗（禁止元素整块移除、禁止属性删除），再解析进影子根 |

关键在于这两条**同时**进入同一棵 DOM。片段是最容易被第三方影响的那一侧（任何能写入 skill 读得到的文件的人都能影响它），所以它必须逐次过清洗——而骨架由用户自己的那份文档提供，子代理没有机会书写它。注入链因此断在两处：**进 DOM 前清洗**，以及**影子根隔离**。

#### 权限的配套措施

需求决策 13 选择继承会话的完整工具权限。这个能力收益明确（卡片能真正查仓库、跑测试），但它意味着子代理能写仓库、执行命令、发网络请求，而驱动它的是**磁盘上的一段自然语言**。真正的注入面是：skill 正文 + skill 在执行中读到的任何文件内容。

因此以下三项**不是可选项**，是这条决策的组成部分：

1. 继承会话的审批流——危险操作仍会停下询问；
2. 卡片上标注权限等级——用户知道自己在按什么；
3. 「运行」被当作会改状态的操作——**重跑不幂等**，交互上必须可感知。

#### 本设计的最高技术风险

**上游没有任何一处从 agent 回合之外启动子代理。** 所有现存调用点都是回合内发起的（模型驱动的工具执行）。我们是第一个这样做的。

这意味着这条路径**没有上游的先例可以对照**。缓解方式：

- 能力检查前置（M5 第 4 步），不支持就在启动时失败而不是运行到一半；
- 严格使用 registry 里的活 Agent（上游会校验，我们提前取）；
- 取消同时走 `signal` 与 `dispose()` 两条通道（上游明确两者分工：前者管发布前，后者管发布后）；
- 超时兜底（`runTimeoutMs`）；
- 失败诊断从 `agent/error` 兜住（M5），所以这条无先例的路径出错时至少有据可查；
- P7 阶段先在小范围真机验证再扩大。

#### 失败的可操作性

| 失败 | 用户看到什么 |
| --- | --- |
| 没有活跃会话 | 说明需要先有会话 + 跳转动作 |
| skill 被删或改名 | 标记失效 + 保留原选择供识别 + 重新选择 |
| 没有模板 | 说明要先写模板 + 去配置 |
| 子代理后端不支持 | 说明是部署配置问题 |
| 模板不合法（标记问题、占位符语法、违禁构造） | 编辑器就地指出位置或原因，保存按钮禁用 |
| 结果里没有 `html`（重试后） | 错误态 + 「运行详情」 |
| 子代理自身报错 | 错误态 + 原因（来自 `agent/error` 的诊断），可在运行详情里查看 |
| 旧结果（结构化值里没有 `html`） | 按"尚未运行"呈现，不显示空框 |
| 结果过期 | 显示"已过期"与执行时间 |

**不允许出现"通用错误"或"卡片悄悄消失了"。** 每一种失败都要让用户能自己修好。

#### 可观测

- 宿主侧所有失败经 `ctx.logger.warn` 落一条含 cardId 与错误码的日志。
- **错误消息不回显请求体**（沿用布局路由的既有约定）。
- `runTimeoutMs` 触发时记一条带耗时的日志，与用户主动取消区分开——这两者在用户视角都是"停了"，但在排障时含义完全不同。

### 结果 R

- 注入链断在两处：回填片段进 DOM 前被清洗，且整份文档只在影子根里渲染。
- 权限决策有三项配套，不是裸奔。
- 每一类失败都有可操作的表现，包括"子代理自己崩了"这一类。
- 最高技术风险有明确的缓解清单，而不是被忽略。

---

## M13 测试设计

> 目录：`tests/`

### 情境 S

这个功能横跨宿主与浏览器两侧、六个模块、五类降级态，还带三条安全断言。如果只做端到端测试，失败时无法定位；如果只做单元测试，装配问题会漏掉。

沿用本包既有的分层做法：`tests/*.spec.ts` 跑 node 环境，`tests/*.spec.tsx` 用文件首行的 `// @vitest-environment jsdom`；原语组件按既有做法在 spec 内 mock。

### 任务 T

1. 每一层各自可验，失败时能定位到层。
2. 宿主执行链路用**假的上游窄接口**驱动，覆盖全部分支。
3. 安全断言必须有独立用例（模板被拒、片段被清、样式不外泄）。
4. 需求 §14 的 **92 条**验收标准中**在效的 91 条**逐条可验（第 52 条已撤回，见需求 §14.4）。**分工**：本设计负责 1–16（卡片模型与既有卡片能力）、35–48（编辑器与配置页，M10、M9、M4）、49–56（结果页与微调，M10、M8、M5、M1、M6）、57–60（第九版那批打磨，M10、M8 与面板标题所在的页面组件）、61–70（第十版的手工编辑结果，M10、M8、M1、M4、M6）、71–79（第十二版的每卡模型选择，M1、M4、M5、M6、M8、M9、M10）与 80–92（第十三版的每卡工作目录，M1、M4、M5、M6、M8、M10；**第 92 条是负面标准**，它钉住的是一个未实现的缺口，见附录 B 那一行），映射见[附录 B](#附录-b验收映射)；**17–34** 属于按钮触发执行，由[那份详细设计](workbench-skill-card-actions-design.md#与需求验收标准的对应)自己映射，本文不重复。

### 行动 A

| 层 | 文件 | 覆盖 |
| --- | --- | --- |
| 契约 | `skill-card-contract.spec.ts` | 常量不变量、区间标记正则（含无空白写法）、输出契约的形状与 `required`、错误码封闭性 |
| 存储域 schema | `skill-card-spec.spec.ts` | 卡片记录（`skill` 与 `name`）整条往返、只带一侧的记录、空记录、模板与结果整条往返——**"store 写了但 schema 没声明"这一类缺陷的专门用例**；第十版增加 `editedAt` 的往返、`editedAt: 0` 与缺席的区别；第十二版增加卡片与结果两侧 `model` 的往返（provider 取 `vendor/gateway`）、以及两侧"没写就没有"；第十三版增加卡片 `workspace` 的往返、只带 `workspace` 的记录也保留、以及没有它时不被凭空补上 |
| 存储 | `skill-card-store.spec.ts` | 读写、revision、conflict、体积裁剪、模板复合键；第十二版增加模型的写入/读取、与 `name`/`skill` 的互相不覆盖、`model: null` 只清模型、三者都清空即删记录、以及非"两个非空 id"的拒绝；第十三版增加目录的写入/读取、与另外三个字段互不覆盖、`workspace: null` 只清目录、以及非绝对路径的拒绝 |
| 存储（手工编辑） | `skill-card-result-edit.spec.ts` | `putEditedResult` 的合并语义（保 `skill`/`stopReason`/输出/诊断、只换 `structured.html`、刷新 `executedAt`、写 `editedAt`）、`missing`/`invalid`/`too-large` 三条拒绝且不写盘、片段与整条记录两道预算都不裁剪、再跑一次后 `editedAt` 消失；同文件还驱动 `PUT /result`：围栏优先、只认 `PUT`、字段校验、404、413、500 不回显记录 |
| 执行 | `skill-card-runner.spec.ts` | 正常、无活会话、无契约、无模板、provider 不支持、skill 不存在、一次重试、取消、超时、`agent/error` 归因、提供方诊断不被覆盖；第十二版增加"卡片写了模型就把它作为 `agentOptions` 传下去并记进结果"、"没写就一个字段都不传"以及三条拒绝（后端无能力 / provider 不存在 / 模型不存在，且消息点名路由）；第十三版增加四条目录拒绝（没目录、目录不存在、路径是文件、裸运行），四条都断言**没有任何 activation** |
| 微调执行 | `skill-card-refine.spec.ts` | 微调提示词的三段与顺序（含 `<row_data>`）、模板取自存盘选择、契约与 `card` 一致、一次重试、落盘整条记录、无模板/无契约时拒绝 |
| 路由 | `skill-card-route.spec.ts` | 围栏优先、8 条路径、400/401/403/409/413/500、错误体不回显请求体；微调请求的逐字段校验与超限码；第十二版增加补丁里 `model` 的透传与形状拒绝、以及 `model-unavailable` 落到 409；第十三版增加补丁里 `workspace` 的透传与六种坏形状的 400，以及目录检查那一组（围栏优先、只认 `GET`、200 的三种答案、路径不合法时一次 `stat` 都不发生、探测器抛错仍回 200） |
| 模型字段 | `skill-card-model.spec.ts` | `resolveModelField` 的三态与四条边界（卡片路由胜过会话选择、目录报错但仍有选择、已存路由不在目录里时补进选项、连 provider 都没了时补一个分组）、`modelKey`/`parseModelKey` 的往返与四种拒收、`createModelSeat` 对"没注册 / 会话被寻址为子代理 / 没有会话"的三种不可用回答与订阅转发 |
| 工作目录字段 | `workspace.spec.ts` | `workspaceLeaf` 的五条（Windows 与 UNC、POSIX、尾随分隔符、盘根、只有分隔符）与 `resolveWorkspaceField` 的六条（没选即 missing、未确认即 invalid 且 `checked: false`、不存在、是文件、确认即 ready、只读仍是 ready） |
| 目录选择器 | `workspace-picker.spec.ts` | 桌面优先且只问一次、没有窗口 seam 时用 workspace、非函数成员不算 seam、抛错降级成 `unavailable`、取消自成一态、非绝对路径被拒、来源在页面建好之后才到达仍生效 |
| 模板 | `template.spec.ts` | 区间扫描的四种结果与位置、内容策略全部违规码、`placeholder-syntax` 及其 token、合法片段引用（`url(#id)`）不被误判 |
| 声明写入 | `skill-card-declarations.spec.ts` | 声明行的文法、追加到既有块、无块时在区间前新建、块保持原缩进且条目对齐、逐次插入不漂移、已有空行的块被整块规整 |
| 起手文档 | `skill-card-skeleton.spec.ts` | 中英两本字典生成的骨架都零违例、区间与空声明块都在、区间内含示例按钮与 `&#39;` 规则、没有残留占位符语法 |
| 渲染 | `render.spec.ts` | 骨架逐字节不变（前缀比对）、片段清洗（`<script>`/`<img>`/事件属性被移除、外部 CSS 的 `<style>` 整块移除）、`resultHtml` 对无 `html` 的结果返回 undefined、样式不外泄；第九版增加了 `dedentedHtml` 的四条（公共前缀被去掉、空行不参与也不留缩进、无前缀时原样、返回新字符串而不改原值） |
| 组件 | `SkillCard.spec.tsx` | 各状态呈现、有结果时回填区间、旧结果读作"尚未运行"、权限说明不再画在正文里（它属于结果页的脚注） |
| 页面 | `SkillCardPages.spec.tsx` | 配置页（目录读取、名称/skill/模板、**卡片页自己的头部只有返回**、模型的写入）与结果页（运行中、失败原因、运行控件的三态与"目录晚到"的订阅路径）；第十三版增加"挑中的路径整条写进 `workspace: { path }`"、"取消后 0 次写且字段仍是未选择"、"选择器报错后按钮关掉并给出说明" |
| 结果页 | `SkillCardResultPage.spec.tsx` | `html` 的真实换行与其余字段的 JSON、缺失字段整行不出现、默认折叠（**没有 `open` 属性**）、结果表面只框不命名（表层里没有 `header`、也没有 `aria-labelledby`）、权限脚注在页末；第九版增加了去缩进的显示值、影子根仍是原缩进、开关文案「运行详情」与 `原始输出` 的分离、结束原因的三行映射 + 未知值原样 + 英文侧；第十一版删掉了三个状态行用例，并把"框住并命名"改写为只断言框住；第十三版增加目录三态与运行控件（`missing` / `invalid`（文案含路径）/ `ready`） |
| 微调界面 | `SkillCardRefine.spec.tsx` | 空输入不可按、请求形状、成功替换 + 记录 + 一步回退（轮询路径）、失败结果不变且告警只在编辑器一处、被拒启动同样报在那里、再微调的 `previous`、运行中的忙碌态与禁用、没有结果时不提供编辑器；第九版增加了 `Enter` 提交 / `Shift+Enter` 换行、`rows` 1→4 封顶、运行中主控件变「停止」并调用取消、记录头部行的条数与「回到上一版」的位置、提示行是整块最后一行 |
| 卡片模型 | `WorkbenchCardShell.spec.tsx`、`WorkbenchCardGrid.spec.tsx`、`WorkbenchPage.spec.tsx`、`layout-controller.spec.tsx` | 外壳的标题/子标题/失败位与激活、X 只在有 `onRemove` 时渲染且只表示删除、**排序手柄在头部动作末位**、拖拽与键盘排序、创建卡片磁贴、存盘实例的投影、布局记录只剩排序（`hidden` 被忽略）与 reset 的删除语义。**注意它不覆盖卡片页上的面板标题**：每个用例都把 `useSelection` 定为 `undefined`（见附录 B 第 58 条） |
| 编辑器 | `SkillCardSettings.spec.tsx` | 三段与标签配对、行号栏的两处染色与点行选择、状态行的行号/条数/字节/85%/脏标记、缺区间的插入标记、Tab/Shift+Tab/Escape+Tab/Ctrl+Cmd+S、违例跳转与无位置违例、声明构建器（键校验、已占用、两类目标、写入与新建块）、缺失目标告警、空模板插入骨架、窗格切换、两段式删除、页脚内的失败行；第十二版增加模型字段的三态、分组与名称、选择回调拿到的那一对；第十三版增加工作目录字段的七条（叶子 + 全路径同时在、失效时路径仍在并加一句、未确认时不多说话、没有选择器时按钮禁用且整页只有一个文本框、四个单元格的顺序与栅格类、标签是文本而非 `label`、缺省即「未选择」且按钮可用） |
| 结果编辑器 | `SkillCardResultEdit.spec.tsx` | 入口的四种状态（有结果、无结果、运行中、裸运行中）与打开期间运行不可按、初值来自存盘片段、行号与「没有文档级 affordance」、字节读数、保存的请求与视图、取消不写、内容策略五码逐个 + 跳转、空内容、超预算不截断、`editedAt` 那一行、回退一步且记录仍为 0 条、Tab/Shift+Tab/Escape+Tab；第十三版增加"没有目录时只关运行、编辑与保存照常" |
| 结果写传输 | `skill-card-result-api.spec.ts` | `PUT` 的路径与体、`parseResultEdit` 的契约版本/身份/`editedAt`/`model` 形状校验、拒绝与传输失败的两种结果 |

> 第二版这里的 `skill-card-api.spec.ts`（解析、非契约响应、串行队列）与"字段清单"用例已不存在：传输层没有独立 spec，它通过组件与页面 spec 以假 api 驱动。

**必测的安全用例**（对应需求验收第 3–6 条）：

1. 缺区间标记、标记未闭合、标记重复 → **保存前被拒并给出原因**。
2. `<script>`、`on*` 事件属性、外部资源元素、外部 CSS → **保存时被拒并给出位置**。
3. 模板里写全局选择器（如 `* { display: none }`）→ **应用其余部分正常**。
4. 回填片段里含 `<script>`、`<img onerror=…>` 或 `<style>@import url(a.css)</style>` → **进 DOM 前被移除**。

执行链路的测试全部用 M5 定义的窄接口作假实现驱动，不启动真的子代理——这让"无活会话""provider 不支持""恰好重试一次""子代理报错"这些分支都能被确定性地覆盖。

### 结果 R

- 每条验收标准都能指到具体用例。
- 安全断言有独立、可回归的用例，模板侧（拒绝）与片段侧（清洗）各有一组。
- 执行链路的每个失败分支都有测试，不依赖真机偶发。
- **样式与响应式不参与断言，这一点写在映射里而不是含糊过去**：jsdom 不计算媒体查询、没有布局，也不解析主题令牌，因此"≥1100px 并排"、"粘性页脚"、"手柄随悬浮显现"、"焦点环是品牌色"、"结果表面的边框、圆角与内边距"、"折叠动画"、"忙碌态的外观"、"代码块可滚动不折行"、"**编辑区量出来的高度**"、"**结果编辑器里行号与行的对齐**"这些断言的是 CSS 所依据的状态（`data-pane`、DOM 位置与层级、类名、`data-result-busy`、`rows`、文本本身），不是渲染结果。需求 §14.3 / §14.4 / §14.5 / §14.6 / §14.8 与附录 A.3 / A.4 / A.5 / A.6 / A.8 对每一条都标了这一句。
- **有一条新行为只覆盖了一半，写在这里**：第 58 条（面板标题在卡片页上）没有 DOM 断言——`WorkbenchPage.spec.tsx` 的每个用例都把 `useSelection` 定为 `undefined`，没有一个用例打开卡片页。要补它得加一个"选中某张卡"的用例，本轮源码与测试都冻结，所以只把它写成已知缺口（附录 B 第 58 行）。
- **还有一条不是"覆盖了一半"，而是根本不该被覆盖**：第 92 条（工作目录不约束写入）钉的是一个**未实现的缺口**。它没有"证明它成立"的用例，也不该有；能断言的是门那一半（四条拒绝 + 没有任何 activation）。要真正改写这一条，得先实现 `agents.create({ meta: { cwd } })` 式的运行，再补一条"写入落在卡片目录里"的用例——**那两件事这一版都没有做**（M5）。
- 第九版落地时整个包是 **453 个测试 / 34 个 spec 文件**；第十版（手工编辑结果）落地时是 **505 个测试 / 37 个 spec 文件**；第十一版（撤掉状态行与「结果」标题）落地时是 **501 个测试 / 37 个 spec 文件**（少了三个状态行用例与一个"页面在说什么"用例，另有两个用例改写而没有增减条数）；第十二版（每卡模型选择）落地时是 **541 个测试 / 38 个 spec 文件**；第十三版（每卡工作目录）落地时是 **604 个测试 / 40 个 spec 文件**（两个新文件 `workspace.spec.ts` 与 `workspace-picker.spec.ts`，其余增量落在既有的 schema / store / route / runner / pages / settings / result-page / result-edit 用例里），`corepack yarn workspace dsh-workbench check`（typecheck + test + build + 产物校验）exit 0。

---

## M14 实施阶段

> 交付安排

### 情境 S

这个功能依赖链较长：契约 → 存储 → 执行 → 渲染 → 编辑器。如果一次性做完再验证，出问题时无法判断是哪一层。

而且有一个**必须最先修的缺口**：`workbench.card` 工厂没注册（M9），不先补上，卡片根本装不起来。

### 任务 T

把交付切成四个阶段，每阶段有明确的出口标准，且前一阶段的产物能被后一阶段直接用上。

### 行动 A

| 阶段 | 内容 | 出口标准 |
| --- | --- | --- |
| **P6** | 共享契约、存储域、store、路由骨架 | 域开关正常；`GET`/`PATCH` 往返通过；**`subagentProvider` 配错在加载期报错** |
| **P7** | 执行服务：agent → skill → 子代理 → 结果 | 假上游下全部分支测试通过；真机上有一个 skill 能跑通并落盘 |
| **P8** | 模板引擎、隔离渲染、`workbench.card` 工厂注册、卡片本体 | 有模板时按模板渲染；无模板时「运行」不可用并给出引导 |
| **P9** | 配置对话框、编辑器、预览、降级态与文案 | 需求 §13 当时的验收标准逐条可验 |

> **本节是当时的计划表。** P9 里列过的"字段清单"随后被删除（见下文"区间语言重构"），验收标准的条数也已随需求方案修订变化——**现在共 92 条，其中在效 91 条**（第 52 条已由产品负责人撤回，编号保留）：**1–16、17–34、35–48、49–51 与 53–56、57–60、61–70 六组都已实现并验收**（17–34 是按钮触发执行，由[那份详细设计](workbench-skill-card-actions-design.md)负责；35–48 是编辑器与配置页，49–56 是结果页与微调，57–60 是第九版那批打磨，61–70 是第十版的手工编辑结果，见下面「P10 之后」）。那张表里的 P9 出口标准指的是当时那一版的需求 §13，不是今天的条数；当前映射见[附录 B](#附录-b验收映射)。

每阶段结束跑 `yarn workspace dsh-workbench check`（typecheck + test + build + verify:artifacts）。P8 起改动会影响客户端可见输出，追加两个变体的真实 profile 验证。

**P8 顺带修掉那个缺口**是刻意的排序：技能卡是第一张真正使用统一外壳的卡，把工厂注册补在这一阶段，既能验证卡片路，也为 P5 的独立卡片包扫清障碍。

### P6 已落地（本次）

**新增源文件**

| 模块 | 文件 |
| --- | --- |
| M1 共享契约 | `src/skill-card-contract.ts` |
| M4 存储域 | `src/skill-card-spec.ts` |
| M4 配置与结果服务 | `src/skill-card-store.ts` |
| M6 配置路由 | `src/skill-card-route.ts` |
| M7 provider 校验 | `src/skill-card-provider.ts` |
| 共用路由 IO | `src/route-io.ts` |

**修改**

| 文件 | 改动 |
| --- | --- |
| `src/index.ts` | 开第二个域、建 store、注册路由；`inject` 增加 `subagents` |
| `src/config.ts` | 新增 7 个配置项，字节上限对齐契约常量 |
| `src/layout-route.ts` | 改用共用的 `route-io`，删掉本地三份 JSON 处理 |

**验证证据**（全部实跑，非推断）

| 项 | 结果 |
| --- | --- |
| `yarn workspace dsh-workbench check` | typecheck + **142 个测试（12 个 spec）** + build + 产物校验，全绿 |
| 客户端产物 | `lib/client.js` 33,904 字节；externals 仍只有基线模块，无非基线 require |
| `check:desktop-variants` | 212 个共享文件对齐 |
| `verify:profile`（stable） | 技能卡路由 **GET + PATCH + 回读**全通；未鉴权读 403；布局路由与真实浏览器渲染不受影响 |
| `verify:profile`（beta） | 同上，面板行 `["插件","自动化任务","工作台"]` |

**P6 出口标准对照**：域开关正常 ✅（真机 GET 返回契约）；GET/PATCH 往返通过 ✅（真机 + 14 个路由用例）；`subagentProvider` 配错在加载期报错 ✅（4 个用例，含"尚无 provider 时延后判定"）。

**落地时暴露并修掉的一个问题**：模板存储键最初写成 `${cardId}:${skill}`，真机写入直接 500。原因是 `per-record` 布局把记录键编码成**文件名片段**，只接受 `[a-zA-Z0-9_-]`，而冒号在 Windows 文件名里非法。改用下划线后通过——卡片 id 与 skill 名都不含下划线，第一个下划线永远是分隔符。

**这个坑内存假表永远发现不了**：假表直接拿字符串当 Map 键，不经过路径编码。这正是 M13 的分层测试之外必须保留真机验证的理由。

**与设计的一处细化**：M6 原写"路由按 `WORKBENCH_TEMPLATE_MAX_BYTES` 判 413"。实现改为按**生效的部署预算**（配置值）判定，因为部署可以调低上限，而按协议上限判会让"超部署上限"落到 store 的 400 上。HTTP 状态码归路由所有，所以路由需要拿到生效值。

### P7 已落地（本次）

**新增源文件**

| 模块 | 文件 |
| --- | --- |
| 窄 Host 接口 | `src/skill-card-host.ts` |
| 技能 prompt 构造 | `src/skill-card-prompt.ts` |
| M5 执行服务 | `src/skill-card-runner.ts` |

**修改**

| 文件 | 改动 |
| --- | --- |
| `src/index.ts` | 建 runner、把工作目录服务做成可选、注册另外 3 条路由 |
| `src/skill-card-contract.ts` | 新增 `not-configured` / `catalog-failed` 两个错误码；运行状态加 `failureCode`；两个响应体 |
| `src/skill-card-provider.ts` | 改为消费窄接口，不再自带一份服务形状 |
| `src/skill-card-route.ts` | catalog 与 run 两组处理器，HTTP 状态改为 `Record<错误码, 状态>` 以保证穷尽 |

**验证证据**（全部实跑，非推断）

| 项 | 结果 |
| --- | --- |
| `yarn workspace dsh-workbench check` | typecheck + **183 个测试（13 个 spec）** + build + 产物校验，全绿 |
| `verify:profile`（stable） | 配置路由往返；catalog 与 run 对未打开的会话返回 409 `session-not-live`；无在飞运行时的取消返回 404；真实浏览器渲染不受影响 |
| `verify:profile`（beta） | 同上 |
| M6 的 6 条路径 | 全部上线 |

**真机验证抓到两个只有跨通道组合才会暴露的问题。** 两个都是"单测全绿、一上真机就炸"，值得单独记下：

1. **`inject` 必须声明所有会被代理访问的服务。** 代码是通过窄接口的类型转换去读 `runtime.agents` 之类的成员的；单测里注入假对象完全正常，真机上 Cordis 的 Context 代理直接抛 `cannot get property "agents" without inject`。类型转换只存在于编译期，运行时就是一次属性访问。
2. **`workingDirectory` 在稳定通道上不存在。** 把它写进 `inject` 之后，稳定版整个插件 PENDING、所有路由 404——**连已经发布的布局路由一起消失**。它必须作为可选服务读取，并以会话头 `cwd` 兜底。

第 2 条的一般教训：**peer 范围声称支持两个通道，代码就必须按两个通道的交集写**，不能按较新的一侧写。两个通道的上游版本差一个 minor，服务集合并不相同。

**P7 出口标准对照**

| 标准 | 状态 |
| --- | --- |
| 假上游下全部分支测试通过 | ✅ 24 个 runner 用例覆盖五类前置拒绝、重试、取消、超时与 dispose |
| 真机上有一个 skill 能跑通并落盘 | ⚠️ **未执行**。它需要"打开一个会话 + 该会话作用域下有一个可用 skill + 一次真实模型调用"，启动验证脚本不具备这些条件。脚本验证的是路由已接线、卡配置已从存储读取、无会话时返回正确的降级态；**真正的端到端运行留待 P9 的人工验证** |

**顺带细化的一处策略**：重试不再"只要结果不可用就重试一次"。上游把"请求了契约却没拿到合法捕获"改写成 `error`，所以 `error` 可重试；而 `refusal`、`max-tokens`、`aborted` 是子代理自己的答复，重试只会再花一次模型调用。判据收敛为"没有结构化值 **且** `stopReason` 属于 `completed` 或 `error`"。

### P8 已落地（本次）

**新增源文件**

| 模块 | 文件 |
| --- | --- |
| M2 模板引擎 | `src/client/skill-card/template.ts` |
| M2 内容策略（分析与清洗共用） | `src/client/skill-card/policy.ts` |
| M3 隔离渲染 | `src/client/skill-card/render.ts` |
| M3 影子根宿主 | `src/client/skill-card/ShadowHtml.tsx` |
| M8 传输 | `src/client/skill-card/api.ts` |
| M8 状态 | `src/client/skill-card/controller.ts` |
| M8 会话选定 | `src/client/skill-card/session.ts` |
| M9 卡片本体 | `src/client/skill-card/SkillCard.tsx` |
| 样式 | `src/client/skill-card/skill-card.module.css` |

**修改**：`src/client/index.ts`（**注册 `workbench.card` 工厂**、注册技能卡条目、`inject` 增加 `sessions`）、`src/client/locales.ts`（26 个新键，中英同步）、两个变体的 `verify-profile-boot.mjs`。

**验证证据**（全部实跑）

| 项 | 结果 |
| --- | --- |
| `yarn workspace dsh-workbench check` | typecheck + **213 个测试（17 个 spec）** + build + 产物校验，全绿 |
| 客户端产物 | 33,904 → **82,671 字符**（卡片进包）；externals 仍只有基线模块 |
| `verify:profile`（stable） | 真实浏览器里 **技能卡存在、无模板时「运行」禁用** |
| `verify:profile`（beta） | 同上 |
| `check:desktop-variants` | 212 个共享文件对齐 |

**P8 出口标准对照**：有模板时按模板渲染 ✅（`render.spec.ts` 9 个用例 + `SkillCard.spec.tsx`）；无模板时「运行」不可用并给出引导 ✅（真机断言 `isDisabled()`）。

**落地时暴露的四处装配细节**，都只有类型检查或真机才会发现：

1. **`registerFactory` 必须声明 `slots`**，否则注册被拒——契约里声明了本地槽，注册时就得复述一遍。
2. **`useSessions` 不是随处可得的座席**：它属于 `ui-session` 通过 `GlobalStandardProps` 合并下来的标准座席，本包不依赖该插件的 client 入口就看不到类型。改用 `sessions` 服务 + 注入面回调。
3. **工厂的本地槽拿不到卡片自己的数据**（本地槽组件只收到工厂的派生 props），所以卡片把 body 作为**按数据记忆化的闭包**传进去。闭包身份不稳会让子树每次渲染都重挂载、重建影子根，因此控制器的 `view` 也必须记忆化。
4. **浏览器检查原来的断言是"空态存在"**，那是"这个 profile 里没有卡片插件"时代的写法；卡片上线后它必然失败。已改成断言卡片本身：标题出现、无模板提示出现、**运行按钮是禁用的**——这条断言现在直接覆盖 P8 的验收路径。

### P9 已落地（本次）

> **⚠️ 本节记录的字段清单与预览数据来源已被取代。** `preview.ts`（字段提取与占位样值）已删除，编辑器改为就地校验 + 渲染草稿本身；契约反推也已整体移除。当前实现见下文「区间语言重构与子代理失败捕获」。以下保留为历史记录。

**新增源文件**

| 模块 | 文件 |
| --- | --- |
| 预览与字段提取（**已删除**） | ~~`src/client/skill-card/preview.ts`~~ |
| M10 编辑器 | `src/client/skill-card/SkillCardSettings.tsx` |

**修改**：M8 传输层补 `catalog()`；控制器补设置态与三个写入动作；卡片补**配置入口**（P9 当时是右上角齿轮，P10 改成头部动作里的「配置」按钮）、编辑器切换、**权限等级标注**；文案补 22 个键；样式补编辑器一组类。

**验证证据**（全部实跑）

| 项 | 结果 |
| --- | --- |
| `yarn workspace dsh-workbench check` | typecheck + **231 个测试（19 个 spec）** + build + 产物校验，全绿 |
| 客户端产物 | 82,671 → **101,325 字符**；externals 仍只有基线模块 |
| `verify:profile`（stable / beta） | 真实浏览器里技能卡存在、无模板时「运行」禁用 |
| `check:desktop-variants` | 212 个共享文件对齐 |

**验收标准覆盖情况**（按当时的需求 §13 十三条；今天的映射见下文"当前验收映射"）

| 标准 | 覆盖 |
| --- | --- |
| 2、3、4、5、7、8、9、11、12 | 单测直接覆盖；3 与 9 另有真机断言 |
| 6、10、13 | 由架构与文案表保证（6 是纯存储读；10 是错误码到文案的穷尽映射） |
| **1（配置后运行并按模板渲染）** | ⚠️ **未端到端验证**：需要一次真实模型调用。链路的每一段都有测试（配置写入、契约反推、执行、渲染），但"从点运行到看见结果"这一条完整路径仍未在真机上跑过 |

**两处偏差**

1. **编辑器开在卡片内，不是模态对话框。** 共享原语没有对话框，自己造一个会往应用里加第二套浮层机制。功能等价，观感上受卡片宽度限制。
2. **结果过期提示未实现。** `resultStaleAfterMs` 是部署配置，客户端目前拿不到它；要么把阈值加进配置读响应，要么让卡片无条件显示执行时间。留给后续决定。

### 修复：技能卡的样式从来没生效过

P9 的功能全部通过测试，真机也确认"卡片在、运行按钮禁用"，但**整张卡没有任何样式**：没有边框、没有内边距，标题、状态、按钮各占一行。

原因是客户端 bundle 的构建方式。Vite 在 library 模式下把三个 CSS 模块抽成一个旁路文件 `lib/dsh-workbench.css`，而 `client.js` 里的工厂对它一无所知。宿主加载器只求值那一个工厂，从不取兄弟样式表——样式表被构建、被打包、然后被无声丢弃。`package.json` 的 `files` 连 `lib/**/*.css` 都没列，它本来也不该存在。

上游 `packages/client/tsdown.client.ts` 对此有明确约定：

> `x.module.css` yields its hashed class map and **injects a tagged style at factory execution**

即样式必须由工厂自己在执行时注入。补上这一步：`scripts/inline-client-styles.mjs` 把抽出的 CSS 文本嵌进工厂，首次求值时挂一个 `style[data-plugin-css="dsh-workbench"]`，再删掉旁路文件。

**为什么之前没被发现**：所有验证都只查"卡片在不在"。缺样式时 DOM 依然完整渲染，没有任何报错。这已在两个变体的 `verify-profile-boot.mjs` 里补上计算样式断言——`style[data-plugin-css]` 必须含 `dsh-workbench`，且卡片 `borderTopWidth` 不能是 `0px`；`smoke-artifacts.mjs` 也改成旁路 CSS 文件存在即失败。

| | 修复前 | 修复后 |
| --- | --- | --- |
| 卡片边框 | 无 | `1px` |
| 标题 / 状态 / 按钮 | 各占一行 | 同一行，右侧对齐 |
| 打包内 bundle | 101,255 字符 | 109,560 字符（含 7,464 字符 CSS） |

---

### 区间语言重构与子代理失败捕获（当前实现，取代上文的占位符设计）

两处改动同期落地，一起构成今天的技能卡。第一处**删除**了占位符语言与契约反推，第二处补上了此前缺失的失败诊断。

#### 删掉了什么

| 删除物 | 原来干什么 | 今天由什么承担 |
| --- | --- | --- |
| `WORKBENCH_FIELD_PATTERN`、`WORKBENCH_LOOP_ATTRIBUTE`（`data-dsh-each`） | 模板语法的两个符号 | `WORKBENCH_REGION_BEGIN` / `WORKBENCH_REGION_END` 与 `regionMarkerPattern()` |
| `deriveTemplate(html)` → `{ fields, schema, violations }` | 从模板反推输出契约 | `analyzeTemplate(html)` → `{ region, violations }`；契约是常量 |
| 按模板生成的 `outputSchema` | 用字段约束子代理 | `WORKBENCH_OUTPUT_SCHEMA`（`{ html: string }`，固定不变） |
| 占位符/循环文法与违规码（`unclosed-placeholder`、`invalid-field`、`loop-not-a-field`、`nested-loop`） | 报告越界写法 | 四个区间/占位符码：`region-missing`、`region-unclosed`、`region-repeated`、`placeholder-syntax` |
| `renderTemplate(root, html, values)` 的替换与循环展开 | 把命名值填进模板 | `filledTemplate(template, html)` 字符串拼接 + `renderTemplate(root, html)` 清洗挂载 |
| `preview.ts`（字段列表、样值、"插入字段"） | 编辑器列出真实字段 | 无——编辑器渲染正在编辑的文档本身 |
| 编辑器的字段清单 UI 与其 CSS、移除码的 locale 键、`skillCardNoFieldsYet` | 字段清单界面 | 无 |

**没有兼容模式。** 仍以 `{{...}}` 书写的模板被 `placeholder-syntax` 明确拒绝（并把命中的那个 token 报出来），而不是渲染出字面花括号。旧模板（含 `{{}}` 或根本没有标记）都会得到一条可操作的提示。

**迁移路径有两条：**

1. **模板**：旧模板不能运行，必须改写成区间标记的写法——两种写法没有可翻译的对应关系（旧的是"给字段填值"，新的是"交回一段 HTML"），所以不做自动转换。
2. **结果**：旧版本存下的结果在 `structured` 里是命名值、没有 `html`。`resultHtml()` 对这样的值返回 `undefined`，结果页按**尚未运行**呈现，而不是渲染一个空框（`SkillCard.spec.tsx` 有用例）。

#### 加上了什么

**子代理自身的失败不再是黑箱。** 子代理这条缝把出错的子代理压成 `stopReason: 'error'` 并**丢掉 error 对象**，所以"没交回 `html`"与"子代理自己崩了"在调用方看来曾经完全一样。现在宿主订阅 `agent/error`（`{ agent, turn, step, error }`），按 `agent.id === childId` 归因到本次运行，写进结果的 `diagnostic`，由结果页的运行详情显示。实现细节与三条纪律见 [M5 · 子代理自身的失败要单独捕获](#子代理自身的失败要单独捕获)。

#### 验证证据（实跑）

| 项 | 结果 |
| --- | --- |
| `corepack yarn workspace dsh-workbench check` | typecheck + **257 个测试（19 个 spec）** + build + 产物校验，**exit 0** |
| 客户端产物 | `lib/client.js` **122,705 字节**（vite 报 110.53 kB 的 JS，随后 `inline-client-styles` 装入 10,979 字符 CSS 并删掉旁路文件）；externals 仍只有基线模块，无非基线 require |
| 模板/渲染用例 | `template.spec.ts` 17 个、`render.spec.ts` 11 个 |
| 执行用例 | `skill-card-runner.spec.ts` 31 个（含 `observeAgentError` 的归因与"提供方诊断不被覆盖"两条） |

#### 当前验收映射

需求 §14 的 92 条里（第 52 条已撤回），**1–16、35–48、49–51 与 53–56、57–60 与 61–70** 逐条落在本设计的哪个模块见[附录 B](#附录-b验收映射)。**17–34 不在附录 B 里**：它们属于按钮触发执行，由[那份详细设计](workbench-skill-card-actions-design.md#与需求验收标准的对应)逐条映射，本文不重复（那部分的共享地基与本文的 M1、M2、M3 是同一批代码）。

#### 仍未覆盖的两项（不变）

1. **第 1 条的端到端仍未跑过**：需要"打开一个会话 + 该会话作用域下有一个可用 skill + 一次真实模型调用"，启动验证脚本不具备这些条件。链路的每一段都有测试（配置写入、模板分析、执行、拼接与清洗），但"点运行到看见结果"这一整条路径仍待人工验证。
2. **结果过期提示未实现**：`resultStaleAfterMs` 是部署配置，客户端拿不到它。

### P10 之后：编辑器与配置页（已落地）

P10 把编辑器搬进整栏的配置页之后，这个模块又按用户实际卡住的地方改了三批，结果页则又改了一批。**前面 M10 写的是今天的样子**，这里只记交付顺序与证据。

| 批次 | 落下什么 | 新增/改动的文件 |
| --- | --- | --- |
| 1 | 行号栏、状态行（字节 + 85% + 缺区间警告）、键盘（Tab / Shift+Tab / Escape 出口 / Ctrl+Cmd+S） | `SkillCardSettings.tsx`、`skill-card.module.css` |
| 2 | 违例 `offset` 与点击定位、声明构建器（`ActionDeclarationPanel.tsx` + `declarations.ts`）、缺失目标告警、骨架（`skeleton.ts`） | 同上 + `template.ts`（`offset`）、`skill-card-skeleton.spec.ts`、`skill-card-declarations.spec.ts` |
| 3 | 三段与整页布局、字段同一行、预览自有表面与标签、并排/切换、粘性页脚、两段式删除、页脚内的失败行、排序手柄的末位与三级色 | `SkillCardPages.tsx`、`WorkbenchCardShell.tsx`、`card.module.css`、各模块的 spec |
| 4 | **结果页**：结果表面、权限说明降为脚注、运行详情的三处修正（真实换行、无空行、默认折叠）、微调编辑区与它的会话内记录（那一批还加了结果表面上的「结果」标题与一行状态，**第十一版已按产品决定整行移除**） | `SkillCardPages.tsx`、`SkillCard.tsx`（正文不再画权限说明）、`skill-card.module.css`、`controller.ts`、`run-start.ts`、`skill-card-prompt.ts`、`skill-card-contract.ts`、`skill-card-route.ts`、`skill-card-runner.ts`、`locales.ts`（两本字典）、`SkillCardResultPage.spec.tsx`、`SkillCardRefine.spec.tsx`、`skill-card-refine.spec.ts` |
| 5 | **第九版打磨**：微调编辑区与聊天输入区同形（1–4 行、`Enter` / `Shift+Enter`、组字保护）、运行中主控件变「停止」、运行详情（开关写「运行详情」、去区间缩进、结束原因本地化）、记录头部行与提示行归位、结果表面标题行 + 细线（**该标题行第十一版已移除**）、**面板标题回到每个视图** | `SkillCardPages.tsx`、`render.ts`（`dedentedHtml`）、`WorkbenchPage.tsx`（面板标题无条件渲染）、`skill-card.module.css`、`locales.ts`（两本字典）、`SkillCardResultPage.spec.tsx`、`SkillCardRefine.spec.tsx`、`render.spec.ts` |
| 6 | **第十版：手工编辑结果**：结果表面里的就地编辑器（`SkillCardResultEditor.tsx`）、两个编辑器共用的行与缩进算术（`text-editing.ts`）、片段分析窄入口（`template.ts` 的 `analyzeFragment`）、五个内容策略码的共用文案（`violation-copy.ts`）、结果写路由与 store 合并（`putEditedResult`）、`editedAt` 与「手工编辑」一行 | `SkillCardPages.tsx`、`SkillCardResultEditor.tsx`、`text-editing.ts`、`violation-copy.ts`、`SkillCardSettings.tsx`（改用共用算术）、`template.ts`、`skill-card-contract.ts`、`skill-card-spec.ts`、`skill-card-store.ts`、`skill-card-route.ts`、`index.ts`、`client/skill-card/api.ts`、`client/skill-card/controller.ts`、`locales.ts`（两本字典）、`SkillCardResultEdit.spec.tsx`、`skill-card-result-edit.spec.ts`、`skill-card-result-api.spec.ts` |
| 7 | **第十一版：撤掉结果页的两处噪音**：结果面上方的状态行（`runStatusLine` / `runStateText` / `runStateMark` / `RUN_STATE_MARKS` / `durationText` / `joinSegments` / `useElapsedSeconds`，`data-run-status` 钩子与 `.runStatus` 样式）与结果表面里的「结果」标题（`resultHead` / `resultHeading`、`useId` 与 `aria-labelledby` 配对）。两本字典里失去读者的六个键（`runStatusIdle` / `runStatusDone` / `runStatusCancelled` / `runStatusFailed` / `runDuration` / `skillCardResultHeading`）一起删掉 | `SkillCardPages.tsx`、`skill-card.module.css`、`locales.ts`（两本字典）、`SkillCardResultPage.spec.tsx`、`SkillCardPages.spec.tsx`、`skill-card-action-panel.spec.tsx` |

**验证证据**（实跑，不是推断。下面的数字是**本批落地时**的；第十一批落地时是 501 个测试 / 37 个 spec 文件；第十批落地时是 505 个测试 / 37 个 spec 文件；第四批落地时是 438 个测试 / 34 个 spec 文件、`lib/client.js` 196.63 kB、`inline-client-styles` 26,430 字符）

| 项 | 结果 |
| --- | --- |
| `corepack yarn workspace dsh-workbench check` | typecheck + **453 个测试（34 个 spec 文件，第九版落地时）** / **505 个测试（37 个 spec 文件，第十版落地时）** / **501 个测试（37 个 spec 文件，第十一版落地时）** + build + 产物校验，**exit 0** |
| 客户端产物 | `lib/client.js` 200.66 kB（vite 报，第九版时），`inline-client-styles` 装入 29,387 字符 CSS 并删掉旁路文件；externals 仍只有基线模块。第十一版落地时是 `lib/client.js` 212.48 kB、装入 **29,135** 字符 CSS——少掉的那部分正是状态行与「结果」标题行那几条规则 |
| 新增的 spec（第四批） | `SkillCardResultPage.spec.tsx`（当时 10 个用例）、`SkillCardRefine.spec.tsx`（当时 8 个）、`skill-card-refine.spec.ts`（6 个）；另外 `skill-card-route.spec.ts` 增加 3 个用例、`skill-card-run-start.spec.ts` 增加 2 个、`SkillCard.spec.tsx` 的权限案例改为"正文不画它" |
| 第九版新增的用例（+15） | `SkillCardResultPage.spec.tsx` +5（去缩进后的代码块 / 影子根仍是原缩进、开关文案与 `原始输出` 的键分离、结束原因三值 + 未知值原样、英文侧映射、标题行 `header > h3`——最后这条第十一版随标题一起删掉），现在 15 个（第十一版之后 12 个）；`SkillCardRefine.spec.tsx` +6（`Enter` 提交与 `Shift+Enter` 不提交、`rows` 1→4 封顶、记录头部条数与「回到上一版」位置、提示行是最后一行、回退后头部按钮消失、运行中的「停止」调用取消），现在 14 个；`render.spec.ts` +4（`dedentedHtml` 四条），现在 15 个 |
| 第十版新增的用例（+52） | 三个新文件 `SkillCardResultEdit.spec.tsx`（23 个）、`skill-card-result-edit.spec.ts`（17 个）、`skill-card-result-api.spec.ts`（7 个）；`template.spec.ts` +3（`analyzeFragment` 的窄口径、五码逐条、path 与近似位置），`skill-card-spec.spec.ts` +2（`editedAt` 整条往返、缺席与零的区别）；`skill-card-contract.spec.ts` 的既有用例补上"结果写是一条独立路径"的断言 |
| 第十一版删掉/改写的用例（−4） | `SkillCardResultPage.spec.tsx` **删 3**（状态行三段 + 缺段的那两条、运行中每秒计时那条）并**改写 1**（"框住并命名"→只断言框住：表层在、里面没有 `header`、没有 `aria-labelledby`、文档在框里）；`SkillCardPages.spec.tsx` **删 1**（"页面在说自己正在做什么"——它断的就是删掉的那行）并**改写 1**（运行中那条改为等运行提示出现、不再等 `data-run-status`）；`skill-card-action-panel.spec.tsx` **改写 1**（同样把等待目标换成运行提示）。净减 4，spec 文件数不变 |

**这一轮修掉的三个真缺陷**，都已写成约束（M4 与 M10 各自的"约束"小节、需求 §17.5）：

1. **存储 schema 缺 `name`**：写入成功、加载丢弃，重启后卡片退回 id 而 skill 名还在（M4）。
2. **`--dsw-alias-border-focus` 不由主题定义**：九条焦点规则因此静默失效（M10）。
3. **页头的「刷新」没有可见效果**：移除，locale 键留给外壳的 `aria-label`（M10）。

**结果页那一批修掉的两个"读不了"**（已写成需求 §18.1 与 M10 的结果页小节）：

1. **调试区把 `html` 当 JSON 打印**：真实换行变成字面的 `\n`，整段无法阅读；缺失字段还占着一行说"没有输出"。
2. **结果没有归属**：渲染的文档浮在页面上，没有框，也看不出它从哪里开始。当时补的是框加一行「结果」标题；**标题后来按产品决定移除，框与内边距留下**。

**第九版那一批又修掉三个"读不了 / 做不了"**（同上，已写进 §18 与 M10）：

1. **一句话写不进一行**：那句真实的修改要求会冲出单行框的可见宽度，长句只能滚着看。换成与聊天输入区同形的多行编辑区之后，1–4 行随内容长高。
2. **看得见但按不动的「重新生成」**：运行期间它是禁用的，而取消在页面顶部、已经被结果顶出视野。那块主控件现在直接变成「停止」。
3. **开关名只说了四分之一，代码块从四百像素外开始，结束原因是英文**：三处都在运行详情里（开关改名、去缩进、本地化，未知值原样）。

另外两处是层级问题：**修改记录**把时间推到整行最右、退一步的链接单独占一行，三样东西一个重量；**面板标题**在卡片页上被拿掉之后，卡片页读起来像另一个页面。前者重排成头部行 + 消息式的行，后者按需求 FR-43 装回来（**推翻第七版**）。

**仍然没做的**：上面「仍未覆盖的两项」照旧——第 1 条的真机端到端与结果过期提示。编辑器的响应式行为（并排、粘性、显现规则）、结果页的样式类结果（边框、圆角、内边距、折叠动画、忙碌态外观）、**编辑区量出来的高度**，以及**卡片页上的面板标题**都没有自动化断言，原因见 M13 结果 R（最后一项是第九版新增的已知缺口）。

### 结果 R

- 每阶段都有可独立验证的产物，失败能定位到阶段。
- 缺口（工厂未注册）在第一张真实卡片落地时被一并修掉。
- 验收标准在 P9 结束时逐条可验；其条数与映射随后续修订更新，当前映射见[附录 B](#附录-b验收映射)。
- P10 的卡片模型重构随后落地：卡片实例是存盘的用户数据，卡片正面只是索引，结果与配置各占一整栏。
- 编辑器与配置页的三批改动随后落地（见上）：需求 §14 的 48 条因此全部有实现与包级测试；结果页与微调的第四批落地后共 56 条；第九版那批打磨落地后共 **60 条**；第十版的手工编辑结果落地后共 **70 条**；第十二版的每卡选模型落地后共 **79 条**；第十三版的工作目录字段落地后共 **92 条**，其中 **91 条在效**（第 52 条在第十一版撤回，编号保留），全部有实现与包级测试。样式与响应式那几项仍只能靠人工确认，映射里都标了；**卡片页上的面板标题**（第 58 条）是唯一"行为有、断言只有一半"的一条，见附录 B；结果编辑器里**行号与行的对齐**也是只能人工看的一处；**第 92 条是负面标准**——它钉住的是工作目录尚未约束写入位置这个缺口，不该被"补上"成一句漂亮话。

---

## P10：卡片模型重构（已落地）

> 本节曾写作"已定，待实现"。**它已经落地**：卡片名称、物理删除、结果页与配置页，以及对应的 spec（`SkillCardPages.spec.tsx`、`WorkbenchPage.spec.tsx`、`WorkbenchCardShell.spec.tsx`、`WorkbenchCardGrid.spec.tsx`）都在代码里。

### 用户确定的产品形态

| 位置 | 内容 |
| --- | --- |
| 卡片正面 | 卡片名称 + skill 名称 + 一个**配置**按钮。不渲染模板结果、状态点、运行按钮 |
| **点整张卡片**（配置按钮以外） | 整个显示栏切换为该卡的**结果页**：模板渲染出的执行结果 |
| **点配置按钮** | 整个显示栏切换为该卡的**配置页**：卡片名称、技能、HTML 模板 |
| 卡片网格末尾 | 一个**创建卡片**磁贴 → 选类型 → 新建一张（**磁贴里不起名**） |

两个整栏视图的分工是**看结果**与**改配置**，入口分别绑在卡片本体和卡片上的按钮，所以卡片正面必须同时是"可点击的结果入口"和"配置按钮的宿主"。

**运行按钮放在结果页**：结果页是看结果的地方，跑一次正是为了得到它。配置页只改配置。

卡片类型：**技能卡片**（可用）、**测试卡片**与**记忆卡片**（列出但禁用）。

### 卡片正面（`SkillCard.tsx`）

卡片不自己画外壳，而是把**表现事实**交给 `workbench.card` 工厂：

- `title` = 用户起的名字；没有名字时，默认那张卡回退到类型标签（`技能卡`），额外实例回退到自己的 `cardId`——否则一张无名的实例与默认卡在网格里长得一模一样。
- `subtitle` = skill 名（没选 skill 就不显示）。
- 头部动作只有一个「配置」按钮：`openCard(cardId, 'config')`。
- `onActivate` = `openCard(cardId, 'result')`：**点卡片本体进结果页**。
- `onRemove`：提交删除后通知面板重读列表（`onCardsChanged`）。
- **不传 `state` / `status`，也不给 body**——没有状态点、没有运行按钮、不渲染结果。

### 结果页与配置页（`SkillCardPages.tsx`）

面板是**一个表面的三种状态**：网格、某张卡的结果页、某张卡的配置页。

两个页面**各自建一个 `useSkillCard`**，而不是从外面接一个控制器：页面只在自己是当前视图时挂载，所以这个 hook 只会为屏幕上那张卡运行。

- **结果页**（`SkillCardResultPage`）：返回按钮、卡片名、skill、**运行 / 取消按钮**、失败文案、卡片正文（模板渲染）、微调编辑区（运行中它的主控件是「停止」）与可展开的**运行详情**（结束原因、执行时间、`diagnostic`、结构化值、原始输出）。它曾经在结果表面上方还有一行状态行（带 `data-run-status`），第十一版按产品决定整行删掉——状态与时间这两个事实只在运行详情里读。
- **配置页**（`SkillCardConfigPage`）：头部**只有「返回」**（卡片名与 skill 在下面的字段里，这一页的头部再写一遍就是那层重复且不可编辑的卡片名；面板自己的标题在它上面，见「页面的形状」），然后是 M10 的三段编辑器（基本信息 / 模板 / 预览）与粘性页脚（保存 / 关闭 / 两段式删除）。它用 `withCatalog: true`，因为只有这一页列 skill。删除**延后到宿主提交再返回网格**，网格才不会又把这张卡读回来。

### 创建卡片（`WorkbenchCreateCard.tsx`）

网格末尾永远渲染一个创建卡片磁贴，菜单列出三种类型：技能卡片（可用）、测试卡片与记忆卡片（列出但禁用——藏起来会让用户猜产品到底有没有）。**选类型就是全部交互**：磁贴里不起名，卡片出现后由用户在自己的配置页命名。

新卡片的 id 是第一个未被占用的 `skill-card-N`，名字先给一个「技能卡片 N」的起点。id 只需要唯一与稳定，名字是用户在配置页改的东西——所以这个入口只做**一个决定**，不是一张表单。

### 删除是物理删除，隐藏已整体移除

卡片上的 X 走 `PATCH { remove: true }`，宿主把**卡片记录、它所有 skill 的模板、它的结果**一起删掉：

```ts
if (patch.remove === true) {
  // 凡是记在这张卡名下的东西都跟着走。留下模板与结果会让它们谁也读不到，
  // 域里也会越积越多再也读不回来的记录。
  await this.run('delete', () => this.options.card.delete(patch.cardId))
  for (const [key] of [...this.options.template.entries()]) {
    if (parseTemplateKey(key)?.cardId !== patch.cardId) continue
    await this.run('delete', () => this.options.template.delete(key))
  }
  if (this.options.result.get(patch.cardId) !== undefined) {
    await this.run('delete', () => this.options.result.delete(patch.cardId))
  }
  return { status: 'written', snapshot: this.read() }
}
```

契约里写明了这条取舍：X 只在卡片提供 `onRemove` 时绘制，而且**它只表示删除**——隐藏根本不在产品里，所以"两个按钮"这个歧义来源已经不存在。删除**不可逆**（模板与结果一起消失），所以它只出现在两个"你正在管理这张卡"的位置：卡片正面的 X，与配置页的删除按钮。

> **实现细节（写清楚，免得读代码时误解）：** 隐藏**已经完全移除**，不是"留作通用能力"：外壳不再有 `onHide`，布局记录只剩 `position`，客户端的 `setHidden` / `showAll` / 隐藏分区与宿主对 `hidden` 的解析都已删除。因此不提供 `onRemove` 的卡片类型（例如将来的第三方插件卡）**没有那个 X**，而不是退化成隐藏。旧记录里仍写着 `hidden: true` 的卡片按可见读回：字段被忽略，不做迁移。

### 首次运行只有创建入口

网格的卡片清单只由**存储里的卡**构成：注册的 `skill-card` 槽位是"这种卡怎么渲染"，不是一张卡本身——把它留在清单里，删掉的卡会继续显示，删到一张不剩也还显示一张。因此**全新安装的网格是空的，只有末尾那个创建卡片磁贴**，这也是网格唯一的空态，不需要"还没有卡片"的说明文字。

同一份投影还决定：一张存盘的实例**不是**自己的槽位条目，而是由注册的技能卡条目渲染，并被告知自己在渲染哪个实例。

### 这一版推翻的三个既有决定

1. **卡片正面不再渲染模板结果**，改到结果页；卡片正面退化为索引入口 + 配置入口。
2. **模板编辑器从卡片内嵌面板迁到配置页**（P9 当时把编辑器开在卡片体内，因为共享原语没有对话框；有了整栏的配置页，这个妥协就取消了）。
3. **隐藏不再出现**：技能卡的 X 从"从视图里藏起来"变成"从产品里删掉"；随后那条**通用隐藏能力**（外壳的 `onHide`、布局域的 `hidden` 记录与其分区）也一并从源码移除，所以今天的工作台里没有任何卡片类型能隐藏。

### 架构冲突的落地：选了 A

M14 早先记过一个必须二选一的冲突：卡片实例来自插件注册表（slot ledger），而"用户可以自己创建多张具名卡片"要求卡片是**存盘的用户数据**。

**选了 A 并已落地**：`workbench.cards` 槽位仍只注册**一个**"技能卡"类型条目，真正的多张卡由工作台的卡存储提供，网格 = 该存储的投影。代价如当初所料——`WorkbenchCardFact` 的来源分成两层：**类型**（slot 条目）与**实例**（存储记录）。收益是"创建类型选择"与"有哪些类型的卡"天然对齐，注册表也不必变成运行时可变的。

B 方案（创建时动态注册 slot 条目）没有采用：它会把排序与删除都绑到插件注册生命周期上，卡片 id 还得能从存储重建。

### 存储与路由的配套改动（已落地）

- `WorkbenchCardConfigRecord` 增加 `name?`；`WorkbenchSkillCardPatch` 增加 `name?: string | null` 与 `remove?: true`。
- `remove` 与其它字段**互斥**：store 的 `validate` 直接拒绝"一次删除还带着名字、skill 或模板"的请求（"a removal cannot carry a name, a skill, or a template"）。删除不是一次局部编辑。
- 路由校验 `remove` 必须恰好为 `true`，`name` 必须是 `null` 或一段非空可见文本（`null` 表示清除，回到注册标签）。
- 名字与 skill 存在同一条卡记录里，所以任一写法都要**先读再合并**：整条覆盖会把另一个字段一并抹掉。
- 多实例存储层早先已具备（三张表都按 `cardId` 分键），本次只是把"卡"的语义从"类型"换成"实例"。

### 隐藏能力整体移除（P10 之后落地）

P10 让技能卡的 X 从"藏起来"变成"删掉"，但当时外壳与布局域仍留着一条通用隐藏路径：外壳有 `onHide`（没提供 `onRemove` 就退化成隐藏），布局记录有 `hidden` 与它的可见/隐藏分区，客户端有 `setHidden` / `showAll` / `hiddenIds` / `hiddenCount` / `hideCard`，宿主会解析并回写 `hidden`。**任何省略 `onRemove` 的卡片类型都会因此悄悄长出一个隐藏按钮**——一条已被移除的产品行为重新长回来。所以这条路径整体删除：

| 层 | 删除物 | 结果 |
| --- | --- | --- |
| 布局契约 | `WorkbenchCardLayoutRecord` / `WorkbenchLayoutEntry` 的 `hidden`，以及序列化里的 `hidden` | 记录只剩 `position` |
| 布局存储域 | schema 里的 `hidden` | 旧文档里仍写着 `hidden` 的记录**按可见读回**，字段被忽略，不做迁移 |
| 布局服务 / 路由 | 读取与写入里的 `hidden`、`hidden must be a boolean` 校验 | 补丁只带排序；无 `position` 的条目按删除处理 |
| 客户端传输与控制器 | `hidden` 解析、`setHidden`、`showAll`、`hiddenIds`、`hiddenCount`、`hideCard` | view 只有 `visibleIds`，actions 只有 `reorder` / `moveBy` / `reset` / `refresh` / `setDragging` |
| 卡片外壳 | `onHide` 与 `onRemove ?? onHide` 回退、`data-workbench-hide` | X **只在提供 `onRemove` 时渲染**，且只表示删除；不提供就没有那个按钮 |
| 文案 | `hideCard`、`showCard`、`announceHidden`、`announceShown`（中英各一条） | 字典里不再有隐藏相关文案 |

**排序、拖拽、键盘移动与重置一字未动**：只有"隐藏"这一维被拿掉。旧记录带 `hidden: true` 的兼容路径由回归用例钉住（`layout-spec.spec.ts`、`layout-service.spec.ts`、`layout-route.spec.ts`、`layout-api.spec.ts`、`layout-store.spec.ts`、`WorkbenchPage.spec.tsx`），外壳"没 `onRemove` 就不画 X"由 `WorkbenchCardShell.spec.tsx` 断言。

---

## 附录 A：需求方案的一处修订

> 附录 A 记录了**两次**修订。A.1 是第二版的历史（推导位置之争），**它描述的对象已经不存在**；A.2 是当前生效的修订。

### A.1 推导放在哪一侧（第二版，已废弃）

设计过程中发现需求 FR-4 把反推放在宿主侧不可行：宿主半跑在 Node 里**没有 DOM**，而 HTML 的嵌套关系无法靠字符串扫描可靠推断（`</tr>`、`</tbody>` 的结束标签都可省略，浏览器会自动补全）。当时把推导移到了客户端。

| 修订前 | 修订后（第二版） |
| --- | --- |
| 宿主解析模板并反推契约 | **客户端推导、宿主用上游守卫独立校验** |

**已废弃。** 反推本身已删除：契约是固定常量，两端共享同一份，没有推导、没有二次校验、也没有"宿主不信任客户端契约"这个问题（宿主仍会做一次形状预检，但那是为了拦住"请求没带契约"）。

### A.2 删除占位符语言与契约反推（第三版，当前）

需求第二版把"模板"定义成"用占位符声明字段、由系统反推契约的文档"。实现下来这条路径把三件事绑在了一起：模板语法、输出契约、结果形状。模板里写错一个字段名没有任何东西能发现，而字段类型又根本推不出来。

第三版改为**模板即规格**：整份文档发给子代理，它只回填 `<!-- template-begin -->` / `<!-- template-end -->` 之间的区间并以 `html` 交回；契约收缩为一个常量，骨架由代码用字符串拼接保持逐字节不变。

| 修订前（第二版） | 修订后（当前） |
| --- | --- |
| `{{字段}}` 占位符 + `data-dsh-each` 循环属性 | 一对区间标记 + 区间内的注释 |
| 从模板反推 `{ fields, schema }` | 固定契约 `WORKBENCH_OUTPUT_SCHEMA = { html: string }` |
| 客户端推导、宿主校验 | 两端共享同一常量，宿主只做形状预检 |
| 结果是一组命名值，按纯文本插入 | 结果是一段 HTML，拼接后**清洗**再渲染 |
| 编辑器列出真实字段、用样值预览 | 编辑器就地校验并渲染正在编辑的文档本身 |
| 无兼容路径 | 旧模板以 `placeholder-syntax` 明确拒绝；旧结果按"尚未运行"呈现 |

受影响的需求位置：§1 需求陈述、术语表、§3 决策汇总第 8/11/16/19/20/21/22 行、§4 使用流程、FR-4、FR-6、FR-7、FR-8、§6 整节、§7、§8、§9.2–§9.4、§10.1、§10.2、§11、§12、§13、§14、§15。
受影响的本设计位置：全景、模块索引、M1、M2、M3、M5、M6、M10、M11、M12、M13、M14 与附录 B。

除这两处外，其余决策与全部功能需求按需求方案执行。

## 附录 B：验收映射

需求 §14 的 **1–16**（既有卡片能力）、**35–48**（编辑器与配置页）、**49–56**（结果页与微调，**其中 52 已撤回**）、**57–60**（第九版那批打磨）、**61–70**（第十版的手工编辑结果）、**71–79**（第十二版的每卡模型选择）与 **80–92**（第十三版的每卡工作目录，**其中 92 是一条负面标准**）与本设计的对应关系：

> **17–34 不在本附录里，这是故意的。** 它们属于「技能卡按钮触发执行」，由[那份详细设计](workbench-skill-card-actions-design.md#与需求验收标准的对应)逐条映射；那部分与本设计共用 M1、M2、M3 的同一批代码，但模块编排（M1–M8）在那一份文档里。看到 §14 一共 92 条、而本表 74 行，不是遗漏。**其中第 52 行已撤回**（第十一版，见需求 §14.4）：那一行留着，是为了让编号与历史对得上，它不主张任何东西已通过。**第 92 行方向相反**：它钉住的是一个**还没有实现**的缺口（目录不约束写入），留着是为了让这一版别被读成沙箱隔离。

| 需求验收 | 落在哪个模块 |
| --- | --- |
| 1 配置后运行并按模板渲染 | M5 + M3；端到端仍需一次真实模型调用（M14"仍未覆盖的两项"） |
| 2 只回填区间，骨架逐字节不变 | M3 的 `filledTemplate`，`render.spec.ts` 前缀比对 |
| 3 标记缺失/未闭合/重复、占位符语法保存被拒 | M2 的 `analyzeTemplate`，`template.spec.ts` |
| 4 禁止构造保存被拒并给位置 | M2 的 `policy.ts`，`template.spec.ts` |
| 5 全局选择器不影响应用其余部分 | M3 影子根，`render.spec.ts` |
| 6 回填片段里的禁止构造被清除 | M3 的 `stripForbidden`，`render.spec.ts` |
| 7 打开工作台不产生模型调用 | M6 的 `GET` 是纯存储读，`SkillCard.spec.tsx` |
| 8 结果里没有 `html` 时恰好重试一次 | M5 重试判据，`skill-card-runner.spec.ts` |
| 9 编辑器就地违例 + 预览同一路径 | M10 的违例清单与预览，`SkillCardSettings.spec.tsx` |
| 10 未写模板时不能运行并给出引导 | M5 `template-missing` + M9，`skill-card-runner.spec.ts` / `SkillCard.spec.tsx` |
| 11 各降级态可操作 | M1 的可操作错误码 + M12 |
| 12 子代理自身失败可诊断 | M5 的 `agent/error` 归因，`skill-card-runner.spec.ts` |
| 13 执行中可取消 | M6 的 `DELETE`，`skill-card-runner.spec.ts` |
| 14 权限标注 + 审批流 | M9 + M12 |
| 15 不改动上游子模块 | 全部改动在 `dsh-workbench/` 内，`git status` 中子模块无改动 |
| 16 卡片模型（创建、正面、结果页、配置页、X、无隐藏） | M9 的卡片本体与外壳（X 只在有 `onRemove` 时渲染）、M8 的选中状态、P10 一节的卡片模型；`WorkbenchPage.spec.tsx` / `WorkbenchCardShell.spec.tsx` / `WorkbenchCardGrid.spec.tsx`；隐藏移除后布局记录只剩排序，`layout-controller.spec.tsx` 断言 actions 里没有隐藏操作 |
| 35 行号栏：逐行染色（区间胜）、点行号选行、同步滚动 | M10「行号栏」（`gutterLines` / `selectLine` / `onScroll`）；`SkillCardSettings.spec.tsx`（同步滚动无自动化断言） |
| 36 状态行：行号 + 声明条数 + 字节/上限、85% 警告、脏标记 | M10「状态行」（`regionLines`、`TextEncoder`、`.editorStatusWarn`）；`SkillCardSettings.spec.tsx` |
| 37 缺区间 → 整行警告 + 「插入标记」 | M10「状态行」（`insertRegionMarkers`）；`SkillCardSettings.spec.tsx` |
| 38 键盘：Tab / Shift+Tab / Escape 出口 / Ctrl+Cmd+S | M10「键盘」（`handleEditorKey`、`editIndent`、`saveable`）；`SkillCardSettings.spec.tsx` |
| 39 违例点击定位；无位置保持纯文本；内容策略位置近似 | M10「违例清单与定位」+ M2「违例的位置」；`SkillCardSettings.spec.tsx`（近似值本身未断言） |
| 40 声明构建器：键校验 / 已占用 / 两类目标 / 写入与新建块 / 按原缩进整块重发 | M10「声明构建器」+ `declarations.ts`；`SkillCardSettings.spec.tsx`、`skill-card-declarations.spec.ts` |
| 41 缺失目标告警但不阻塞保存；读不到不报缺失 | M10「缺失目标告警」；`SkillCardSettings.spec.tsx` |
| 42 骨架可插入且零违例 | M10「骨架插入」+ `skeleton.ts`；`skill-card-skeleton.spec.ts`、`SkillCardSettings.spec.tsx` |
| 43 并排 / 标签切换（媒体查询 + `data-pane`） | M10「并排与切换」（CSS 媒体查询 + `data-pane`）；`SkillCardSettings.spec.tsx`（响应式结果不可测） |
| 44 三段分组、卡片页头部只有返回、两字段一行、预览自有表面与标签、粘性页脚、标签配对 | M10「页面的形状」+「粘性页脚」（面板标题由 `WorkbenchPage.tsx` 渲染，见 58）；`SkillCardSettings.spec.tsx`、`SkillCardPages.spec.tsx`（样式不参与断言） |
| 45 删除两次按下、`aria-live` 播报、取消与 Escape 都不删 | M10「粘性页脚」的两段式删除；`SkillCardSettings.spec.tsx` |
| 46 写入失败在页脚内以 `role="alert"` 呈现 | M10「粘性页脚」的失败行；`SkillCardSettings.spec.tsx` |
| 47 排序手柄在末位、三级色、随悬浮/聚焦显现 | M9「排序手柄」；`WorkbenchCardShell.spec.tsx`（显现是 CSS） |
| 48 卡片名称重载后仍在（schema 覆盖写入字段） | M4「约束：store 写入的每个字段都必须在 schema 里声明」；`skill-card-spec.spec.ts` |
| 49 `html` 按真实换行渲染（显示时去区间缩进），其余字段仍是 JSON | M10「结果页」的 `readStructured` 与 `.runPreHtml`、`render.ts` 的 `dedentedHtml`；`SkillCardResultPage.spec.tsx`、`render.spec.ts`（去缩进本身见 60；`white-space: pre` / `overflow: auto` 是 CSS，未断言） |
| 50 缺失的字段整行不出现 | M10「结果页」的五处修正（`runNoOutput` 已从两本字典删除）；`SkillCardResultPage.spec.tsx`（`原始输出` 在无输出文本时完全不出现） |
| 51 运行详情默认折叠 | M10「结果页」（`<details>` 不带 `open`；测试钉"没有 `open` 属性"）；`SkillCardResultPage.spec.tsx`（折叠动画不可测） |
| 52 ~~状态行：状态 + 开始时间 + 用时~~ **已撤回（第十一版）** | ~~M10「结果页」的 `runStatusLine` / `runStateText` / `runStateMark` / `clockText`~~；那一行及其函数已删除，`clockText` 现在只服务微调记录。**这一条不主张任何东西已通过**，需求侧见 §14.4 |
| 53 输入为空时「重新生成」不可按 | M10「微调编辑区」的 `empty` 门 + M8 的 `refine()` 门（运行中那个位置是「停止」，见 57）；`SkillCardRefine.spec.tsx` |
| 54 成功：就地替换 + 记录（指令 + 紧跟的时间）+ 头部行条数 + 「回到上一版」在头部 + 提示行在最后 + 一步回退 | M8「微调状态」（`settleRefinement`、`previousResult`、`resultOverride`）+ M10「微调编辑区」的记录块；`SkillCardRefine.spec.tsx`；提示词与落盘见 `skill-card-refine.spec.ts` |
| 55 失败：结果不变 + 失败报在编辑区下方 | M8 的 `refineProblem` 与"覆盖 = 失败前那份记录" + M10「微调编辑区」；`SkillCardRefine.spec.tsx` |
| 56 微调过的结果可以再微调 | M8 的 `refine()`（请求带屏幕上那份 HTML）+ M10「微调编辑区」；`SkillCardRefine.spec.tsx` |
| 57 运行中主控件变「停止」，与头部共用同一个取消 | M10「微调编辑区」的 `onStop`/`data-refine-stop` + M8 的 `cancel()`，以及"被取消按失败结算"（M8 三处记录点的第 3 条）；`SkillCardRefine.spec.tsx`（"共用同一个动作"是源码事实，无独立断言） |
| 58 面板标题在每个视图上，卡片页自己的头部在其下；配置页头部仍只有「返回」 | M10「页面的形状」（`WorkbenchPage.tsx` 无条件渲染标题）+ M10「微调编辑区」所属页面的头部；`WorkbenchPage.spec.tsx`（标题随页面渲染）、`SkillCardPages.spec.tsx`（配置页头部只有返回）。**卡片页那一半没有 DOM 断言**：`WorkbenchPage.spec.tsx` 的用例都把 `useSelection` 定为 `undefined` |
| 59 编辑区与聊天输入区同形、1–4 行随内容长高、`Enter` 提交 / `Shift+Enter` 换行 / 组字不提交 | M10「微调编辑区」（`rows` 与 `useLayoutEffect` 的 `scrollHeight` 测量、`isComposing` 判断）+ `skill-card.module.css` 的 `.composerInput`（尺寸来自 `InputBar.module.css`）；`SkillCardRefine.spec.tsx`（高度本身不可测：jsdom 无布局） |
| 60 运行详情：开关写「运行详情」、代码块去公共缩进（显示层）、结束原因本地化、未知值原样 | M10「结果页」的第 4、5 处修正（`runDetailSummary` / `runRawOutput` 两个 key、`dedentedHtml`、`STOP_REASON_KEYS` 部分映射）；`SkillCardResultPage.spec.tsx`、`render.spec.ts` |
| 61 「编辑」入口：有结果且没有运行占住卡片时才有，位置在「运行」左边，打开期间运行不可按 | M10「结果的手工编辑」（`editable` 与 `editing`、头部的 ghost 控件、`disabled` 条件），以及"编辑器打开时微调编辑区不画"；`SkillCardResultEdit.spec.tsx` |
| 62 编辑的是存盘片段、保存后成为卡片结果、页面按回执更新 | M10「结果的手工编辑」（`html={resultHtml(view.result?.structured) ?? ''}`、`saveResultEdit`）+ M8（`saveResult`、`replaceResult`）+ M6（`PUT /result` 回执）；`SkillCardResultEdit.spec.tsx`、`skill-card-result-edit.spec.ts`、`skill-card-result-api.spec.ts` |
| 63 取消不写任何东西，视图原样返回 | M10「结果的手工编辑」（`onCancel` 只 `setEditing(false)`）；`SkillCardResultEdit.spec.tsx` |
| 64 五个内容策略构造拒绝保存，给出原因与位置（可点） | M2 的 `analyzeFragment`（窄入口）+ `policy.ts` + M10 的 `CONTENT_VIOLATION_KEYS` 与 `revealViolation`；`SkillCardResultEdit.spec.tsx`、`template.spec.ts` |
| 65 空内容被拒，消息说结果为空且这张卡可以再运行一次 | M10 的 `empty` 门与 `resultEditEmpty`；M10/存储边界（`putEditedResult` 的 `invalid`）；`SkillCardResultEdit.spec.tsx`、`skill-card-result-edit.spec.ts` |
| 66 超 `WORKBENCH_RESULT_MAX_BYTES` 拒绝、绝不截断（编辑器 + 路由 + store） | M10 的字节读数与 `overBudget` 门 + M6 的 `Math.min(maxResultBytes, WORKBENCH_RESULT_MAX_BYTES)` + M4/M10 的 `putEditedResult`（片段与整条记录两道预算，均不裁剪）；`SkillCardResultEdit.spec.tsx`、`skill-card-result-edit.spec.ts` |
| 67 保存后可退回一步，且这次编辑不进修改记录 | M8 的 `saveResultEdit`（把 `prior` 放进 `previousResult`、不动 `refinements`）+ M8 `undoRefine` + M10「微调编辑区」的头部行；`SkillCardResultEdit.spec.tsx` |
| 68 记录带 `editedAt`，运行详情有一行「手工编辑」和时间 | M1 的 `editedAt` + M10「结果页」`RunOutput` 的新行 + M8 `parseResultEdit` 的形状校验；`SkillCardResultEdit.spec.tsx`、`skill-card-result-api.spec.ts` |
| 69 保存不伪造运行：保 `skill`/`stopReason`/输出/诊断，只换 `structured.html`，刷新 `executedAt`、写 `editedAt`；下一次运行覆盖 | M10/store 的 `putEditedResult`（`moment()` 与 `structuredRecord()`）+ M10「结果的手工编辑」+ `putResult` 的既有语义；`skill-card-result-edit.spec.ts` |
| 70 `editedAt` 在存储 schema 里声明，重启后仍在 | M4 的 `workbenchResultSchema` 与「约束：store 写入的每个字段都必须在 schema 里声明」；`skill-card-spec.spec.ts` |
| 71 卡片模型以 `{ provider, model }` 存储并声明在 schema 里，重启后仍在 | M1「卡片模型：一对 id，不是一个字符串」+ M4（`workbenchCardModelSchema`、合并与清空语义）；`skill-card-spec.spec.ts`、`skill-card-store.spec.ts`、`skill-card-route.spec.ts` |
| 72 结果的 `model` 同样在 schema 里声明 | M1（`WorkbenchResultRecord.model?`）+ M4（`workbenchResultSchema.model`、`trimResult` 的基础记录）+ M5（记录落 `model`）；`skill-card-spec.spec.ts`、`skill-card-runner.spec.ts` |
| 73 模型字段三态与运行控件；从不提供自由文本 id | M10「卡片的模型字段」（`resolveModelField`、`modelKey`/`parseModelKey`、`ModelField` 组件）+ M8（目录读进 state 并订阅、`runnable` 与 `modelField` AND）+ M9（`ctx.inject(['modelDirectories'])` 与座位）；`skill-card-model.spec.ts`、`SkillCardSettings.spec.tsx`、`SkillCardPages.spec.tsx`（原生下拉的展开与像素高度不可测） |
| 74 结果里的模型看得见（运行详情那一行） | M5（记录带路由）+ M10「结果页」的 `RunOutput`（`model` 缺席则整行不存在）；`SkillCardResultPage.spec.tsx`、`skill-card-runner.spec.ts` |
| 75 卡片写了模型时以 `agentOptions` 启动子代理 | M5「模型：钉住这次运行的路由」（第 7 步的条件展开）；`skill-card-runner.spec.ts` |
| 76 卡片没写模型时一个字段都不传（照旧继承） | M5 同一节（`selection.model === undefined` 时整个键不出现）；`skill-card-runner.spec.ts` |
| 77 后端不支持 `agentOptions` 时拒绝，消息点名路由 | M5 `modelRefusal()` 的第一条；`skill-card-runner.spec.ts` |
| 78 模型 provider 不存在时拒绝（`provider-unavailable`） | M5 `modelRefusal()` 的 `ctx.llm.listModels` 抛错分支；`skill-card-runner.spec.ts`、`skill-card-route.spec.ts` |
| 79 模型不存在时拒绝（`model-unavailable`，409），并校验线上形状 | M1 的新错误码与三张映射表 + M5 `modelRefusal()` 的目录比对 + M6 的 `STATUS_BY_CODE` 与 `parsePatch` 的 `model` 校验；`skill-card-runner.spec.ts`、`skill-card-route.spec.ts`、`skill-card-result-api.spec.ts` |
| 80 目录以一条完整绝对路径存储（不是工作区 id）并在 schema 里声明；相对路径被拒 | M1「卡片的工作目录」的 `WorkbenchCardWorkspace` 与 `isWorkbenchWorkspacePath()` + M4「约束：store 写入的每个字段都必须在 schema 里声明」的第十三版那段 + M6 `parsePatch` 的 `workspace` 分支；`skill-card-spec.spec.ts`、`skill-card-store.spec.ts`、`skill-card-route.spec.ts` |
| 81 基本信息四个控件、两行两列 | M10「页面的形状」的段表 + `.fieldGrid`（CSS 栅格）；`SkillCardSettings.spec.tsx`（两列的视觉结果由 CSS 决定，断言的是网格、顺序与类名） |
| 82 主值是叶子名、完整路径是次要文字且永不丢；标签是文本不是 `label` | M10「卡片的工作目录字段」+ `workspace.ts` 的 `workspaceLeaf()`（显示专用，不回写、不进请求）；`workspace.spec.ts`、`SkillCardSettings.spec.tsx` |
| 83 选择器按平台分派（Windows 走窗口 seam，其他平台走 `uiWorkspace`），都没有时报"没有选择器" | M10「卡片的工作目录字段」的选择器表 + `workspace-picker.ts`（`readDesktopPicker` / `createWorkspacePicker`）+ M9 的 `ctx.inject(['uiWorkspace'])` 作用域注入；`workspace-picker.spec.ts`、`SkillCardPages.spec.tsx` |
| 84 取消（`null`）什么都不改 | `workspace-picker.ts` 的 `cancelled` 独立状态 + M8 `chooseWorkspace()` 的提前返回；`workspace-picker.spec.ts`、`SkillCardPages.spec.tsx` |
| 85 没有自由文本、没有工作区下拉；没有选择器时按钮禁用并说明 | M10「卡片的工作目录字段」（`canChooseWorkspace` 与那句说明）+ M8 的 `pickerRefused`；`SkillCardSettings.spec.tsx`、`SkillCardPages.spec.tsx` |
| 86 一个纯解析器三种状态；未确认也关着；只读目录仍是 ready | M10「卡片的工作目录字段」+ `workspace.ts` 的 `resolveWorkspaceField()` 与 `NO_DIRECTORY_STAT`；`workspace.spec.ts` |
| 87 运行控件与字段读同一个值（`runnable` AND `ready`），禁用时有说明 | M8 的 `runnable` 与 `workspaceField` + M10 结果页头部那两条 `data-run-workspace-*`；`SkillCardResultPage.spec.tsx`、`SkillCardResultEdit.spec.tsx` |
| 88 拒绝而不回退：三个客户端入口共用一个判断，宿主启动前再判一次；失效消息点名完整路径 | M8 的 `workspaceRefusal()` + M5「工作目录：一道门，还不是一间房」的门那一半（4c 与两条消息）+ M6 的 `STATUS_BY_CODE`（400 / 409）；`skill-card-runner.spec.ts`、`skill-card-route.spec.ts`、`skill-card-action-panel.spec.tsx`。**微调那条共用同一函数是源码事实，没有单独用例** |
| 89 没有迁移：已有卡片没有目录，在配上之前不能运行 | M4「没有迁移，是刻意的」+ M10 的 `missing` 状态；`skill-card-store.spec.ts`、`workspace.spec.ts`、`SkillCardSettings.spec.tsx` |
| 90 除运行以外全都照常（打开、改名 / skill / 模型 / 模板、预览、手工编辑、读结果） | M8（只有 `start` / `refine` / 确认面板读 `workspaceField`，`saveResultEdit` 不读）+ M10 + M9（卡片正面不画这个字段，**源码结构、无 DOM 断言**）；`SkillCardResultEdit.spec.tsx`、`SkillCardSettings.spec.tsx` |
| 91 两个新码进封闭联合，三张映射表各自表态；两码不合并 | M1 的错误码块与「结果 R」（`Record<码, …>` 的三张表）+ M6 的 `STATUS_BY_CODE` + M8 的 `LOCALIZED_CODES` + M10/SkillCard 的 `PROBLEM_KEYS`；`skill-card-route.spec.ts`、`SkillCardResultPage.spec.tsx`、`SkillCardSettings.spec.tsx`。**"漏一个编译不过"由类型系统保证** |
| 92 **诚实的缺口：目录不约束写入**——运行仍在父会话目录里，`startActivation` 的 `cwd` 改不到沙箱根，收口需要 `agents.create({ meta: { cwd } })`，**未实现** | M5「工作目录：一道门，还不是一间房」的"房间：没有"那张表与三句话（**这一条不是待办，是这一版的交付边界**）；**没有用例能证明它成立**，能证明的只有门（`skill-card-runner.spec.ts` 四条拒绝均无 activation） |

## 附录 C：依据

本文每条技术前提都查证自源码，不是推测：

| 结论 | 出处 |
| --- | --- |
| 子代理服务名 `subagents`，宿主平面进程单例 | [index.ts:208](../deepseek-harness/packages/subagent/subagent/src/index.ts#L208)、[web-app/cordis.patch.yml:536](../deepseek-harness/packages/bundle/web-app/cordis.patch.yml#L536) |
| 启动方法是 `startActivation(spec)`，不是 `start`；它从 `0.2.1-alpha.2` 起才有，`0.2.0-rc.2` 没有 | [index.ts:253](../deepseek-harness/packages/subagent/subagent/src/index.ts#L253) |
| `parent` 必填，且必须是 registry 里那个活的 Agent | [types.ts:147](../deepseek-harness/packages/subagent/subagent/src/types.ts#L147)、[index.ts:274](../deepseek-harness/packages/subagent/subagent/src/index.ts#L274) |
| 按 sessionId 取活 Agent：`ctx.agents.get(id)` | [agent/src/index.ts:566](../deepseek-harness/packages/core/agent/src/index.ts#L566) |
| `outputSchema` 是启动请求字段，启动时即校验 | [types.ts:169](../deepseek-harness/packages/subagent/subagent/src/types.ts#L169)、[index.ts:278](../deepseek-harness/packages/subagent/subagent/src/index.ts#L278) |
| 不传 `agentOptions` = 继承父 agent 的模型与路由 | [types.ts:156](../deepseek-harness/packages/subagent/subagent/src/types.ts#L156) |
| `agentOptions` 受 `SubagentCapabilities.agentOptions` 门控，`spawn` advertise 为真 | [types.ts:123](../deepseek-harness/packages/subagent/subagent/src/types.ts#L123) |
| 请求里的路由**整体铺在父路由之上**，一个半截覆盖会跑到不存在的路由 | [child-agent.ts:97](../deepseek-harness/packages/subagent/subagent/src/child-agent.ts#L97) |
| 会话模型目录是客户端服务 `ctx.modelDirectories`，`directoryFor(sessionId)` 对"被寻址的子代理会话"抛错 | [service.ts:66](../deepseek-harness/packages/client/ui-model-selection/src/client/service.ts#L66) |
| 目录状态在 `ModelDirectory.store`（`current` / `groups` / `status` / `failures`）上，`select()` 改的是**会话**的模型 | [directory.ts:38](../deepseek-harness/packages/client/ui-model-selection/src/client/directory.ts#L38) |
| 宿主侧查模型目录用 `ctx.llm.listModels(provider)`，未注册的 provider 直接抛错 | [llm/src/index.ts:695](../deepseek-harness/packages/llm/llm/src/index.ts#L695) |
| 不传 `toolFilter` = 不限制子代理工具 | [types.ts:177](../deepseek-harness/packages/subagent/subagent/src/types.ts#L177) |
| `stopReason==='completed'` 但无合法捕获时被改写成 `'error'` | [activation.ts:150](../deepseek-harness/packages/subagent/subagent/src/activation.ts#L150) |
| 子代理自身的失败只以 `agent/error` 事件暴露（`{ agent, turn, step, error }`） | [core/agent/src/runtime-types.ts:393](../deepseek-harness/packages/core/agent/src/runtime-types.ts#L393) |
| `spawn` 与 `fork` 都支持 `outputSchema` | [subagent-spawn-in-process:40](../deepseek-harness/packages/subagent/subagent-spawn-in-process/src/index.ts#L40) |
| skill 读取必须传 `scope`，否则只读 global 层 | [skill/src/index.ts:116](../deepseek-harness/packages/skill/skill/src/index.ts#L116) |
| **Agent 对象本身就是 scope key** | [tool-skill/src/index.ts:132](../deepseek-harness/packages/skill/tool-skill/src/index.ts#L132) |
| 指令正文字段是 `content`（不是 `body`） | [skill/src/index.ts:87](../deepseek-harness/packages/skill/skill/src/index.ts#L87) |
| 真实 web-app 组合里 global 层没有 skill provider | [web-app/cordis.patch.yml:502](../deepseek-harness/packages/bundle/web-app/cordis.patch.yml#L502) |
| 会话行的排序依据是 `updatedAt` | [service.ts:27](../deepseek-harness/packages/api/session-controller/src/client/sessions/service.ts#L27) |
| `--dsw-*` 令牌定义在 `:root` | [base.css:6](../deepseek-harness/packages/client/ui-theme/src/styles/base.css#L6) |
| 工厂注册签名 | [register-node-renderers.ts:31](../deepseek-harness/packages/client/ui-chat/src/client/chat/register-node-renderers.ts#L31) |
| `workbench.card` 工厂被声明但从未注册 | 本包全量检索无 `registerFactory` |
| 卡片契约与列表槽的现状 | [dsh-workbench/src/client/contract.ts](../dsh-workbench/src/client/contract.ts) |
| `startActivation` 的 `cwd` 只落到"有效工作目录"：它由 `workingDirectory.set(child, …)` 写入，而**会话头是不可变的原始项目** | [working-directory/src/index.ts:35](../deepseek-harness/packages/session/working-directory/src/index.ts#L35)、[manager.ts:890](../deepseek-harness/packages/subagent/subagent/src/manager.ts#L890) |
| 子会话头继承的是**父**的 `cwd`（所以"有效工作目录"再怎么改，头里的那个不变） | [child-agent.ts:145](../deepseek-harness/packages/subagent/subagent/src/child-agent.ts#L145) |
| **文件沙箱的根取自会话头的 `cwd`**：`workspaceRoot: resolveWorkspaceRoot(session?.header.cwd ?? this.workspaceRoot)`，因此 `startActivation` 改不到它——这是"目录不约束写入"的机制来源（第十三版的缺口） | [sandbox-policy/src/index.ts:168](../deepseek-harness/packages/sandbox/sandbox-policy/src/index.ts#L168) |
| 能真正换目录的入口是 `ctx.agents.create({ meta: { cwd } })`（会话元数据里校验过绝对路径）；**本包没有用**——全量检索没有 `agents.create` | [agent/src/index.ts:391](../deepseek-harness/packages/core/agent/src/index.ts#L391)、[agent/src/index.ts:79](../deepseek-harness/packages/core/agent/src/index.ts#L79) |
| 应用窗口的 Electron 安全开关均已启用 | [dsh-plugin-desktop/src/window-options.ts:32](../dsh-plugin-desktop/src/window-options.ts#L32) |
