# 工作台技能卡详细设计

[需求方案](workbench-card-requirements.md)回答"要什么"。本文回答"怎么做"——把技能卡拆成 14 个模块，逐个讲清楚。

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
        │ ① 点齿轮：选一个 skill，写整份 HTML 文档（区间标记 + 注释）
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
```

三条贯穿全文的线索：

1. **模板是前置条件。** 没有模板就没有可交给子代理的规格，也没有可供拼回结果的骨架（需求决策 20）。
2. **两个不可信来源，信任级别并不相同。** 用户写的骨架是自伤面（会被复制粘贴），而子代理回填的 HTML 片段来自**模型**——它读过模板、skill 以及 skill 工具的输出。注入链断在"逐次清洗"与影子根这两处（M3、M12）。
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
| **M6** | 私域路由 | `src/skill-card-route.ts` | 浏览器访问宿主的 6 个入口 |
| **M7** | 插件入口与配置 | `src/index.ts`、`src/config.ts` | 启动时装配全部能力，暴露可调项 |
| **M8** | 客户端传输与状态 | `src/client/skill-card/api.ts`、`controller.ts` | 页面需要的 view 与 actions |
| **M9** | 卡片组件与装配 | `src/client/skill-card/SkillCard.tsx`、`src/client/index.ts` | 卡片本体，以及补上缺失的工厂注册 |
| **M10** | 配置对话框与编辑器 | `src/client/skill-card/SkillCardSettings.tsx` 等 | 选 skill、写模板、就地校验、实时预览 |
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

技能卡要跨的边界更多（6 条路径、5 种数据结构），更需要这份共同语言。

### 任务 T

1. 定义 6 条路由路径与一个契约版本号。
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
export const WORKBENCH_SKILL_CARD_API_VERSION = 1
```

**上限**——两端引用同一组数字，避免"客户端以为能存、宿主拒收"这类错配：

```ts
export const WORKBENCH_TEMPLATE_MAX_BYTES = 32 * 1024
export const WORKBENCH_TEMPLATE_MAX_PER_CARD = 16
export const WORKBENCH_RESULT_MAX_BYTES = 64 * 1024
export const WORKBENCH_SKILL_CARD_MAX_BODY_BYTES = 128 * 1024
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

**线上数据结构**——分四组：

| 组 | 类型 | 说明 |
| --- | --- | --- |
| 存储 | `WorkbenchCardConfigRecord`、`WorkbenchTemplateRecord`、`WorkbenchResultRecord` | 落盘的东西 |
| 读取 | `WorkbenchSkillCardSnapshot`、`WorkbenchCardConfigView` | 打开工作台时拿到的 |
| 写入 | `WorkbenchSkillCardPatch` | 改配置 |
| 运行 | `WorkbenchRunRequest`、`WorkbenchRunState`、`WorkbenchRunPhase` | 执行相关 |

```ts
/** 启动一次运行。 */
export interface WorkbenchRunRequest {
  readonly cardId: string
  readonly sessionId: string
  /**
   * 输出契约。**每次运行都送同一个常量** `WORKBENCH_OUTPUT_SCHEMA`：子代理只回报
   * 填好的那段区间 HTML，没有按模板生成的契约。字段仍然保留，因为它是子代理启动
   * 请求的一部分，宿主也对它做一次廉价的形状预检。
   */
  readonly outputSchema: unknown
}
```

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
  | 'provider-unavailable'  // 子代理后端不支持输出契约
  | 'schema-rejected'       // 请求没带可用的对象根契约（形状预检）
  | 'run-in-progress'       // 这张卡已经在跑
```

后八个是**可操作的降级原因**，对应需求 §8 的降级矩阵：每一个都告诉用户下一步该做什么。把它们折叠成一个通用错误，用户就会看到"出错了"却不知道该干什么——这正是需求明令禁止的。

### 结果 R

- 两端编译期就对同一组常量与类型，字段名写错立刻是类型错误。
- 错误码表成为 M12 与验收标准的公共词汇。
- 契约模块本身零依赖，`vite` 构建时被内联进客户端包，不产生新的外部依赖。

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

### 结果 R

- `analyzeTemplate(html)` 返回 `{ region, violations }`：区间在哪，以及每一条拒绝原因与位置。
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
| `card` | cardId | `{ skill?: string }` |
| `template` | `${cardId}_${skill}` | `{ html: string }` |
| `result` | cardId | `{ skill, executedAt, stopReason, structured?, outputText?, diagnostic? }` |

**`structured` 现在只装一个 `html`**（填好的那段区间）。旧版本存下的命名值仍是合法记录——存储层不校验契约，卡片那边发现没有 `html` 时按"尚未运行"呈现。`diagnostic` 是失败文本：提供方写的，或由 M5 从 `agent/error` 捕获到的。

模板用复合键，因为需求决策 15 要求**模板跟 skill 走**：切回原来的 skill，原来的模板还在。

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
- 结果超 `WORKBENCH_RESULT_MAX_BYTES` → **截断文本输出，保留结构化值**。理由是结构化值是渲染要用的，文本输出只是"查看原始输出"的兜底。

### 结果 R

- 配置与结果互不影响，可以分别清理。
- 已发布的布局域一字未改。
- 损坏的单条记录不会导致工作台起不来。

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

  const controller = new AbortController()
  const timer = setTimeout(() => { controller.abort() }, config.runTimeoutMs)

  // 5. Agent 作用域下解析 cwd 与 skill。
  const cwd = await cwdFor(agent, controller.signal)
  const skill = await host.skills.get(selection.skill, { cwd, scope: agent, signal: controller.signal })
  if (skill === undefined) return { kind: 'skill-not-found' }

  // 6. prompt = 技能正文 + 整份文档（逐字，注释在内）+ 任务说明。
  const text = renderWorkbenchSkillPrompt(skill, selection.template)

  // 7. 启动。不传 agentOptions = 继承会话模型；不传 toolFilter = 不限制工具。
  const activation = await host.subagents.startActivation({
    provider: config.subagentProvider,
    label: `workbench:${request.cardId}`,
    signal: controller.signal,
    delivery: 'caller',
    request: { parent: agent, prompt: [{ type: 'text', text }], cwd, outputSchema: request.outputSchema },
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

#### 子代理自身的失败要单独捕获

这是与区间语言同期的第二处改动，解决的是另一个具体问题：**失败曾经是黑箱。**

子代理这条缝在子代理出错时只留下 `stopReason: 'error'`，**把 error 对象丢掉**。于是"模型没按契约交出 `html`"和"子代理自己崩了"在调用方看来完全一样，原始输出面板里也什么都没有。

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

失败原因因此有了落点：结果记录的 `diagnostic` → 卡片错误态 → 结果页的原始输出面板。

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
- 子代理自己报错时，结果里带着它的失败文本，原始输出面板能显示——失败不再是黑箱。

---

## M6 私域路由

> 文件：`src/skill-card-route.ts`

### 情境 S

浏览器要读配置、写模板、拿目录、起运行、查状态、取消——六件事都要穿过进程边界。工作台已有的布局路由给出了一套验证过的范式：**同源私有路径 + 信任围栏**。技能卡路由直接沿用，不发明新机制。

围栏的含义是：一个没通过信任与浏览器鉴权检查的请求，**永远碰不到业务逻辑**，更碰不到存储。

### 任务 T

1. 提供 6 条路径，全部先过信任围栏。
2. 逐字段校验请求体——这是进程边界，调用方不是同进程的可信对象。
3. 失败返回**可操作**的错误码，消息不回显请求数据。
4. 打开工作台的路径不得触发任何模型调用。

### 行动 A

#### 六条路径

| 方法 | 路径 | 作用 | 主要失败码 |
| --- | --- | --- | --- |
| `GET` | `/api/workbench/skill-card` | 配置 + 全部结果（纯存储读） | `storage-failure` |
| `PATCH` | `/api/workbench/skill-card` | 写 skill 选择与模板 | `invalid-request` `too-large` `conflict` |
| `GET` | `/api/workbench/skill-card/catalog?sessionId=` | 会话作用域的 skill 目录 | `session-not-live` |
| `POST` | `/api/workbench/skill-card/run` | 启动一次运行 | `template-missing` `run-in-progress` `provider-unavailable` `schema-rejected` `skill-not-found` `session-not-live` |
| `GET` | `/api/workbench/skill-card/run?cardId=` | 轮询运行状态 | `not-found` |
| `DELETE` | `/api/workbench/skill-card/run?cardId=` | 取消并释放 | `not-found` |

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

### 结果 R

- 打开工作台只发一次纯存储读请求，**不产生模型调用**（需求验收第 7 条）。
- 每种失败都有专属错误码，客户端能映射成可操作的文案而不是"出错了"。
- 未通过信任检查的请求在围栏处就被挡下，不入业务逻辑。

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

1. 把 6 条路由包装成结构化结果（不抛异常）。
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
}
```

每一次调用都返回**结构化结果**而不是抛异常——页面要渲染"不可用"状态，而不是落进错误边界。响应在这里做契约校验：这是进程边界，宿主的 JSON 是输入，不是可信值。

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
  /** 能不能运行：有 skill、有模板、有活会话。 */
  runnable: boolean
  /** 会话的 agent 能调用的 skill。 */
  catalog: readonly WorkbenchSkillCatalogEntry[]
  catalogStatus: 'idle' | 'loading' | 'ready' | 'failed'
  catalogFailure: WorkbenchSkillCardErrorCode | 'unavailable' | undefined
}

export interface WorkbenchCardActions {
  run(): void
  cancel(): void
  /** 重读存储里的配置与结果。 */
  refresh(): void
  chooseSkill(skill: string): void
  saveTemplate(template: string): void
  /** 存卡片名；空串即清除，回到注册标签。 */
  rename(name: string): void
  /** 删除这张卡与它名下的一切；resolve 表示宿主已经提交。 */
  remove(): Promise<void>
}
```

几处刻意的取舍：

- **`withCatalog` 决定要不要读目录。** 只有配置页列 skill，所以只有它传 `withCatalog: true`；卡片正面与结果页都不传。网格里每张卡都为一份它不显示的列表发一次请求，正是这条设计要避免的。
- **`remove()` 返回 Promise**，因为它总要有后续：卡片正面用它通知面板重读列表（`onCardsChanged`），配置页用它决定何时退回网格。
- **`rename` 的空串即清除**：`name` 传 `null` 让卡片回到注册标签，而不是存一段空白标题。
- **`problem` 是合并后的一个字段**，组件只渲染一条，不必自己判断优先级。
- **`view` 被记忆化**（`useMemo`，依赖是它显示的每一个值）：卡片正文按这份 view 记忆化成一个闭包，再交给外壳的本地槽；闭包身份不稳会让子树每次渲染都重挂载、重建影子根（P8 的装配细节之一）。

#### 数据获取时机

| 时机 | 发什么请求 |
| --- | --- |
| 卡片挂载 | 只 `read()` 一次（纯存储读，**不发模型请求**） |
| 配置页挂载（`withCatalog: true`） | 取一次 `catalog(sessionId)` |
| 点"运行" | `start()` 后按 1 秒轮询直到终态 |
| 改 skill / 模板 / 名字 | `write()`，无模型调用 |
| 删除卡片 | `write({ remove: true })`，无模型调用 |

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

#### 状态与结果不画在卡片正面

P10 之后，运行中 / 已出结果 / 失败的呈现都在**结果页**：状态行（带 `data-run-status`）说这次运行在做什么，失败文案走外壳的 `failure` 位，正文与原始输出都由结果页渲染。外壳仍保留状态点这套能力（`state` / `status` 可选），供其它卡片类型使用。

结果超过 `resultStaleAfterMs` 时显示"已过期"与上次执行时间——**仍未实现**：这个阈值是部署配置，客户端当前拿不到它（见 M14 的"仍未覆盖的两项"）。

#### 权限标注

**这个标注不能省**（需求 FR-12 / 决策 13）。它现在随**结果页的正文**渲染——也就是「运行」按钮所在的那一页，用户按下去之前必然看到它。

这不是装饰：用户选了"继承当前会话的完整工具权限"，而 skill 是磁盘上的自然语言，第三方 skill 根目录里已有现成内容。子代理能写仓库、执行命令、发网络请求。**让用户知道自己按下去的是什么**，是这条决策的组成部分。

### 结果 R

- 卡片装上统一外壳，外观与其它卡片一致。
- `workbench.card` 工厂从此可用，P5 的独立卡片包不再受阻。
- 卡片正面只做索引；结果与配置各占一整栏，用户在按下运行的那一页看到权限等级。

---

## M10 配置对话框与编辑器

> 文件：`src/client/skill-card/SkillCardSettings.tsx`

### 情境 S

这是用户唯一要动手的地方，也是需求里"易用性"的落点。他要在这里做三件事：选 skill、写整份 HTML 文档、预览效果。

其中有一个**必须先说清楚的限制**：模板是运行的前置条件，而"填什么"写在**区间注释**里——系统无法替他决定该产出什么形态。他必须自己写清楚（通常因为他就是写这个 skill 的人）。编辑器能提供的帮助是"随时告诉他哪里不合法"，而不是"告诉他该写什么"。

### 任务 T

1. 两段结构：skill 选择器、模板编辑器（含实时预览）。
2. 无模板时**不提供运行入口**。
3. 预览必须用**与正式渲染完全相同**的路径。
4. 随输入做区间与内容策略校验，就地报错；有违例时**保存按钮不可用**。

### 行动 A

#### 两段结构

1. **skill 选择器**——数据来自目录接口，`userInvocable` 为假的 skill 不列出。未配置时这里是主行动。
2. **模板编辑器**——等宽文本框 + 实时预览。

**第二版这里还有第三项"字段清单"（列出上次结果里的真实字段、点击插入光标处），已随字段一起删除。** 今天没有字段可列：子代理回报的是一段 HTML，不是一组命名值。要改结果，改的是注释——它是唯一能告诉子代理"要填什么"的地方（需求 §7、§9.4）。

#### 模板是前置条件

**没有模板时卡片不提供「运行」**，保存后回到卡片，运行按钮才可用。

宿主侧同样拒绝无模板的运行（`template-missing`），而且它**自己从存储回答"有没有模板"**，不依赖客户端自律——这是 M6 那条纪律的又一次体现。

#### 预览

预览把**正在编辑的这份文档本身**交给 **M3 的同一个渲染函数**（`ShadowHtml` → `renderTemplate`）：同一条解析路径、同一遍清洗、同一个影子根。

三点要说清楚：

- **没有"占位样值"。** 第二版的预览要拿数据（上次结果或合成样值）才算得出画面；现在没有值可填，预览展示的就是骨架——这正是用户交给子代理的那份东西，所见即所得。
- **注释在预览里是注释。** 它们说明要填什么，不产生画面。
- **未保存的草稿也能预览**：预览用的是编辑器里的 `draft`，不是存储里的模板，所以违例能边写边看见。

#### 随输入校验

`useMemo(() => analyzeTemplate(draft), [draft])`，每条违例渲染成一行"本地化文案 · 位置"：

- 区间问题（`region-missing` / `region-unclosed` / `region-repeated`）→ 提示标记缺失或不成对；
- `placeholder-syntax` → 提示占位符语法已移除，改用区间标记并在注释里写明要求；
- 违禁构造（脚本、事件、危险 URL、外部资源、外部 CSS）→ 就地报错并指出位置；
- 超体积上限 → 宿主拒绝并回 `too-large`；
- 全部通过 → 保存按钮可用，提交给宿主。

**配置字段第一版只支持两种类型**：枚举选择（skill 选择器）与长文本（模板）。需求 FR-13 的通用配置机制按这两种落地——机制本身是通用的，字段类型面先收窄。

### 结果 R

- 用户所见即所得：预览与正式渲染同一条路径。
- 缺标记、重复标记、旧占位符语法与违禁构造都在提交前被拦下，用户看到具体位置。
- 没有模板时不会误触运行；结果不对时，需要改的是区间注释或骨架排版，编辑器把这两样都摆在同一屏里。

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
| 结果里没有 `html`（重试后） | 错误态 + 「查看原始输出」 |
| 子代理自身报错 | 错误态 + 原因（来自 `agent/error` 的诊断），可在原始输出面板查看 |
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
4. 需求 §14 里**已实现**的 16 条验收标准（1–16）逐条可验。§14 另有 18 条（17–34）属于**尚未实现**的按钮触发执行功能，本设计不为它们负责——那部分还没有实现与测试。

### 行动 A

| 层 | 文件 | 覆盖 |
| --- | --- | --- |
| 契约 | `skill-card-contract.spec.ts` | 常量不变量、区间标记正则（含无空白写法）、输出契约的形状与 `required`、错误码封闭性 |
| 存储 | `skill-card-store.spec.ts` | 读写、revision、conflict、体积裁剪、模板复合键 |
| 执行 | `skill-card-runner.spec.ts` | 正常、无活会话、无契约、无模板、provider 不支持、skill 不存在、一次重试、取消、超时、`agent/error` 归因、提供方诊断不被覆盖 |
| 路由 | `skill-card-route.spec.ts` | 围栏优先、6 条路径、400/401/403/409/413/500、错误体不回显请求体 |
| 模板 | `template.spec.ts` | 区间扫描的四种结果与位置、内容策略全部违规码、`placeholder-syntax` 及其 token、合法片段引用（`url(#id)`）不被误判 |
| 渲染 | `render.spec.ts` | 骨架逐字节不变（前缀比对）、片段清洗（`<script>`/`<img>`/事件属性被移除、外部 CSS 的 `<style>` 整块移除）、`resultHtml` 对无 `html` 的结果返回 undefined、样式不外泄 |
| 组件 | `SkillCard.spec.tsx` | 各状态呈现、有结果时回填区间、旧结果读作"尚未运行"、权限标注 |
| 页面 | `SkillCardPages.spec.tsx` | 配置页（目录读取、名称/skill/模板）与结果页（运行中、失败原因） |
| 卡片模型 | `WorkbenchCardShell.spec.tsx`、`WorkbenchCardGrid.spec.tsx`、`WorkbenchPage.spec.tsx`、`layout-controller.spec.tsx` | 外壳的标题/子标题/失败位与激活、X 只在有 `onRemove` 时渲染且只表示删除、拖拽与键盘排序、创建卡片磁贴、存盘实例的投影、布局记录只剩排序（`hidden` 被忽略）与 reset 的删除语义 |
| 编辑器 | `SkillCardSettings.spec.tsx` | 选择器、就地违例清单与禁用保存、预览 |

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

> **本节是当时的计划表。** P9 里列过的"字段清单"随后被删除（见下文"区间语言重构"），验收标准的条数也已随需求方案修订变化——**现在共 34 条**：其中 **1–16 已实现并验收**，**17–34 属于尚未实现的按钮触发执行功能**（需求 §12）。那张表里的 P9 出口标准指的是当时那一版的需求 §13，不是今天的条数；当前映射见[附录 B](#附录-b验收映射)，那里只映射已实现的 16 条。

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

**修改**：M8 传输层补 `catalog()`；控制器补设置态与三个写入动作；卡片补齿轮入口、编辑器切换、**权限等级标注**；文案补 22 个键；样式补编辑器一组类。

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

**子代理自身的失败不再是黑箱。** 子代理这条缝把出错的子代理压成 `stopReason: 'error'` 并**丢掉 error 对象**，所以"没交回 `html`"与"子代理自己崩了"在调用方看来曾经完全一样。现在宿主订阅 `agent/error`（`{ agent, turn, step, error }`），按 `agent.id === childId` 归因到本次运行，写进结果的 `diagnostic`，由结果页的原始输出面板显示。实现细节与三条纪律见 [M5 · 子代理自身的失败要单独捕获](#子代理自身的失败要单独捕获)。

#### 验证证据（实跑）

| 项 | 结果 |
| --- | --- |
| `corepack yarn workspace dsh-workbench check` | typecheck + **257 个测试（19 个 spec）** + build + 产物校验，**exit 0** |
| 客户端产物 | `lib/client.js` **122,705 字节**（vite 报 110.53 kB 的 JS，随后 `inline-client-styles` 装入 10,979 字符 CSS 并删掉旁路文件）；externals 仍只有基线模块，无非基线 require |
| 模板/渲染用例 | `template.spec.ts` 17 个、`render.spec.ts` 11 个 |
| 执行用例 | `skill-card-runner.spec.ts` 31 个（含 `observeAgentError` 的归因与"提供方诊断不被覆盖"两条） |

#### 当前验收映射

需求 §14 的 34 条里，**已实现的 1–16** 逐条落在哪个模块，见[附录 B](#附录-b验收映射)。**17–34 不被映射**：它们属于尚未实现的按钮触发执行功能（需求 §12），本设计没有对应模块。

#### 仍未覆盖的两项（不变）

1. **第 1 条的端到端仍未跑过**：需要"打开一个会话 + 该会话作用域下有一个可用 skill + 一次真实模型调用"，启动验证脚本不具备这些条件。链路的每一段都有测试（配置写入、模板分析、执行、拼接与清洗），但"点运行到看见结果"这一整条路径仍待人工验证。
2. **结果过期提示未实现**：`resultStaleAfterMs` 是部署配置，客户端拿不到它。

### 结果 R

- 每阶段都有可独立验证的产物，失败能定位到阶段。
- 缺口（工厂未注册）在第一张真实卡片落地时被一并修掉。
- 验收标准在 P9 结束时逐条可验；其条数与映射随后续修订更新，当前映射见[附录 B](#附录-b验收映射)。
- P10 的卡片模型重构随后落地：卡片实例是存盘的用户数据，卡片正面只是索引，结果与配置各占一整栏。

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

- **结果页**（`SkillCardResultPage`）：返回按钮、卡片名、skill、**运行 / 取消按钮**、状态行（带 `data-run-status`）、失败文案、卡片正文（模板渲染）与可展开的**原始输出**（stop reason、执行时间、`diagnostic`、结构化值、文本输出）。运行中每秒刷新已用秒数。
- **配置页**（`SkillCardConfigPage`）：返回按钮、卡片名、skill、**删除卡片**按钮，然后是 M10 的编辑器（名称、skill 选择器、模板、预览）。它用 `withCatalog: true`，因为只有这一页列 skill。删除**延后到宿主提交再返回网格**，网格才不会又把这张卡读回来。

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

需求 §14 的 **已实现 16 条（1–16）**与本设计的对应关系：

> **17–34 不在本附录里，这是故意的。** 它们是需求 §12「技能卡按钮触发执行」的待验收项，该功能**尚未实现**，本文不为它设计、也没有模块可映射。看到 §14 一共 34 条、而本表只有 16 行，不是遗漏。

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
| 9 编辑器就地违例 + 预览同一路径 | M10，`SkillCardSettings.spec.tsx` |
| 10 未写模板时不能运行并给出引导 | M5 `template-missing` + M9，`skill-card-runner.spec.ts` / `SkillCard.spec.tsx` |
| 11 各降级态可操作 | M1 的可操作错误码 + M12 |
| 12 子代理自身失败可诊断 | M5 的 `agent/error` 归因，`skill-card-runner.spec.ts` |
| 13 执行中可取消 | M6 的 `DELETE`，`skill-card-runner.spec.ts` |
| 14 权限标注 + 审批流 | M9 + M12 |
| 15 不改动上游子模块 | 全部改动在 `dsh-workbench/` 内，`git status` 中子模块无改动 |
| 16 卡片模型（创建、正面、结果页、配置页、X、无隐藏） | M9 的卡片本体与外壳（X 只在有 `onRemove` 时渲染）、M8 的选中状态、P10 一节的卡片模型；`WorkbenchPage.spec.tsx` / `WorkbenchCardShell.spec.tsx` / `WorkbenchCardGrid.spec.tsx`；隐藏移除后布局记录只剩排序，`layout-controller.spec.tsx` 断言 actions 里没有隐藏操作 |

## 附录 C：依据

本文每条技术前提都查证自源码，不是推测：

| 结论 | 出处 |
| --- | --- |
| 子代理服务名 `subagents`，宿主平面进程单例 | [index.ts:208](../deepseek-harness/packages/subagent/subagent/src/index.ts#L208)、[web-app/cordis.patch.yml:536](../deepseek-harness/packages/bundle/web-app/cordis.patch.yml#L536) |
| 启动方法是 `startActivation(spec)`，不是 `start` | [index.ts:253](../deepseek-harness/packages/subagent/subagent/src/index.ts#L253) |
| `parent` 必填，且必须是 registry 里那个活的 Agent | [types.ts:147](../deepseek-harness/packages/subagent/subagent/src/types.ts#L147)、[index.ts:274](../deepseek-harness/packages/subagent/subagent/src/index.ts#L274) |
| 按 sessionId 取活 Agent：`ctx.agents.get(id)` | [agent/src/index.ts:566](../deepseek-harness/packages/core/agent/src/index.ts#L566) |
| `outputSchema` 是启动请求字段，启动时即校验 | [types.ts:169](../deepseek-harness/packages/subagent/subagent/src/types.ts#L169)、[index.ts:278](../deepseek-harness/packages/subagent/subagent/src/index.ts#L278) |
| 不传 `agentOptions` = 继承父 agent 的模型与路由 | [types.ts:156](../deepseek-harness/packages/subagent/subagent/src/types.ts#L156) |
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
| 应用窗口的 Electron 安全开关均已启用 | [dsh-plugin-desktop/src/window-options.ts:32](../dsh-plugin-desktop/src/window-options.ts#L32) |
