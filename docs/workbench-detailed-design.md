# DSH Desktop 工作台详细设计

本文是[工作台概要设计](workbench-design.md)的实现级展开，按改动模块组织。每个模块给出：职责、文件、对外契约（类型与接口）、行为与失败语义、验证点。概要设计里的结论在这里不再论证，只在实现层面落定"用什么、写在哪、怎么测"。

## 1. 模块清单

| 模块 | 位置 | 性质 | 一句话职责 |
| --- | --- | --- | --- |
| 工作台包（Host 半边） | `dsh-workbench/src/*.ts` | 新建 | 存储域、布局服务、Web 路由与请求围栏 |
| 工作台包（Client 半边） | `dsh-workbench/src/client/**` | 新建 | 面板注册、页面与卡片宿主、布局 store、远端读写 |
| 工作台包（合约与构建） | `dsh-workbench` 包清单、tsconfig、Vite 配置 | 新建 | 双半边入口、依赖面、构建产物 |
| 根工作区 | `package.json` | 修改 | 注册新工作区包与依赖解析 |
| Desktop 两个变体 | `dsh-plugin-desktop{,-beta}/package.json`、`cordis.patch.yml` | 修改 | 声明依赖并 insert 组合条目 |
| 文档 | `docs/workbench-design.md`、`docs/README.md` | 修改 | 指向详细设计 |

不改动的部分：`deepseek-harness/` 子模块（固定上游，一行都不动）、`dsh-plugin-desktop{,-beta}/src/**`（Desktop 客户端源码不参与，也不镜像）；上游 `ui-sidebar`、`ui-layout`、`ui-workspace` 的插槽声明保持原样。

实现前需核对的宿主接口（本设计按其现有语义编写，落地时以工作区中的当前签出为准）：`ctx.webServer.register` 的路由形状与 `kind: 'exact'`、`ctx.connection.requestRejection` 的返回语义、`ctx.storageDomain.open` 的句柄与变更事件、`ctx.slots.entriesOfSlot` 与 `resolveSlotLabel` 的行为、`defineStore` 的声明字段。这些接口在上游子模块内，Desktop 的既有用法可作为对照（例如 Desktop 私有路由与请求围栏、`ui-plugin-manager` 的面板注册）。

## 2. 新建包 `dsh-workbench`

### 2.1 目录布局

```text
dsh-workbench/
├─ package.json
├─ cordis.patch.yml            # 该包自身的组合补丁（Host 半边条目）
├─ README.md / README.zh.md
├─ tsconfig.json               # Host 面
├─ tsconfig.client.json        # Client 面
├─ tsconfig.tests.json / tsconfig.tests.client.json
├─ tsdown.config.ts            # Host 半边
├─ vite.client.config.ts       # Client 半边（单文件 client.js）
├─ vitest.config.ts
├─ src/
│  ├─ index.ts                 # Host 入口：apply / inject / Config
│  ├─ config.ts                # Host 插件配置（schemastery）
│  ├─ layout-spec.ts           # 存储域声明（defineDomain）
│  ├─ layout-service.ts        # 布局服务：读、写、修订号、归一化
│  ├─ layout-route.ts          # Web 路由处理与请求校验
│  ├─ layout-contract.ts       # 双半边共享的 JSON 合约与常量（无运行时依赖）
│  └─ client/
│     ├─ index.ts              # Client 入口：apply / inject
│     ├─ contract.ts           # SlotMap/SlotFactoryMap/LocaleNamespaceMap 声明合并
│     ├─ locales.ts            # zh/en 字典
│     ├─ layout-api.ts         # 远端读写与重试（浏览器侧）
│     ├─ layout-store.ts       # 展示顺序、拖拽会话
│     ├─ WorkbenchPage.tsx     # 面板页面（页头 + 网格 + 整栏的结果页/配置页）
│     ├─ WorkbenchCardGrid.tsx # 网格、拖拽、键盘重排
│     ├─ WorkbenchCardShell.tsx# workbench.card 工厂组件
│     ├─ WorkbenchCreateCard.tsx# 「创建卡片」磁贴
│     ├─ WorkbenchPanelIcon.tsx# 侧栏行图标
│     ├─ workbench.module.css  # 页面与网格样式
│     └─ card.module.css       # 卡片壳样式
└─ tests/                      # 包级测试（Host 与 Client 分开）
```

### 2.2 包清单

要点（其余字段照仓库既有包格式）：

- `name: "dsh-workbench"`，`version` 与两个 Desktop 变体的次版本对齐，`private: false`，`type: "module"`。
- `exports`：`.`（Host 入口 `lib/index.js`）、`./client`（`lib/client.js`）、`./package.json`。
- `dsh.client`：`{ platform: "web", inject: ["@deepseek-ai/dsh-client-locale", "@deepseek-ai/dsh-client-ui-layout", "@deepseek-ai/dsh-client-ui-sidebar", "@deepseek-ai/dsh-client-ui-workspace", "@deepseek-ai/dsh-client-ui-renderer"] }`。
  - `inject` 是信息的包名边，用于预检与 HMR 差异；激活顺序由 Cordis service 决定。
  - **不声明 `dsh.client.external`**：客户端半边只值导入基线模块（见 2.4），其余跨包引用一律 `import type`，因此不需要任何非基线模块表行。
- `dsh.bundle.patch: "./cordis.patch.yml"`。
- `files` 必须覆盖 `lib/**`、`cordis.patch.yml`、`README*.md`；`lib/types/**` 随包发布以支持类型导入。
- `scripts`：`build`、`typecheck`、`test`、`check`，与既有包同形。

`cordis.patch.yml` 只 insert 一行 Host 半边条目：

```yaml
- insert:
    - id: workbench
      name: dsh-workbench
```

### 2.3 Host 半边入口

```ts
/** Host 半边：存储域 + 布局服务 + 私有 Web 路由。 */
export const inject = ['storageDomain', 'webServer', 'connection', 'storage']
export { Config } from './config.ts'
export type { Config } from './config.ts'

/**
 * @param ctx - Host Cordis 上下文。
 * @param config - 已校验配置（见 2.3.1）。
 */
export function apply(ctx: Context, config: Config): void
```

行为：

1. `ctx.effect` 内 `await ctx.storageDomain.open(WORKBENCH_LAYOUT_DOMAIN)`，构造 `WorkbenchLayoutService`，`provide('workbenchLayout', service)`；释放时先 `service.dispose()` 再 `domain.close()`。
2. `ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: LAYOUT_PATH, handler }), 'workbench: layout route')`；`handler` 先过请求围栏再进服务。

#### 2.3.1 配置

`Config` 用 schemastery（Host 插件配置一律 schemastery）：`enabled`（默认 `true`，用于 profile 侧一键停用整页）、`maxRecords`（默认 `256`，范围 `1..4096`）。没有"卡片列表"之类需要部署方填的字段：卡片是插件贡献，配置里写不出来。

### 2.4 Client 半边入口与值导入纪律

```ts
/** Client 半边：侧栏入口 + 工作台面板 + 卡片宿主。 */
export const inject = ['slots', 'locale', 'layout', 'connection']
export function apply(ctx: ClientContext): void
```

值导入只允许：`react`、`@deepseek-ai/cordis`、`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-ui-primitives`、`@deepseek-ai/dsh-client-store`。这五个都在 Web 平台的共享模块表基线里。

由此产生的两条实现约束：

- `MainPanelId`、`PropsRuntime`、`PropsRenderSlots`、插槽键声明、会话与工作区类型一律 `import type`；类型导入会被完全擦除，不产生模块表请求。
- Locale 与布局能力通过 service 使用（`ctx.locale.register`、`ctx.layout.selectPanel`），不导入 `dsh-client-locale` 或 `dsh-client-ui-layout` 的运行时值。

任何"想 import 另一个功能插件"的冲动都按仓库规则处理：行为走 Cordis service，UI 走插槽。

### 2.5 构建

#### 2.5.1 Host 半边（tsdown）

照 `dsh-plugin-desktop{,-beta}/tsdown.config.ts` 的形状：ESM、`platform: 'node'`、`target: 'es2024'`、`outDir: 'lib'`、`sourcemap: true`、`dts: false`（类型由 tsc 产出）。

- 入口：`{ index: 'src/index.ts' }`。
- 生产依赖（`@deepseek-ai/dsh-storage-domain`、`@deepseek-ai/dsh-storage`、`zod`）保持外部导入；其余内联。
- 类型声明由 `tsc -p tsconfig.json --emitDeclarationOnly` 输出到 `lib/types`。

#### 2.5.2 Client 半边（vite）

照 Desktop 客户端半边的形状（`vite.client.config.ts`）：`formats: ['cjs']`、`lib.fileName: () => 'client.js'`、`codeSplitting: false`，并把工厂包在 Loader 握手外层：

```ts
banner: `window.__ModuleLoader__.load({ id: "dsh-workbench", factory: (require) => {`,
intro: 'var module = { exports: {} }; var exports = module.exports;',
footer: 'return module.exports; } });',
```

- `external`：至少放过平台基线（`react`、`react-dom`、`react/jsx-runtime`）与全部 `@deepseek-ai/*`。**这是刻意的宽松**：真正决定"能不能 require 到"的是模块表，而不是打包器的 external 列表；把 `@deepseek-ai/*` 全部 external 后，一旦有人误写值导入，运行时立刻以"模块表无法满足"失败，而不是悄悄内联出一份重复实例。
- 不要引入 tailwind 插件：工作台样式走 CSS Modules 与语义 token，与上游功能插件的样式纪律一致（Desktop 客户端半边的 tailwind 插件是为其原生 UI 部件准备的，这里用不上）。
- CSS Modules 交给 Vite 内建处理（`*.module.css` 生成类名映射并注入样式），**不要声明自定义的类名生成模式**：桌面客户端半边是用未配置的 Vite 默认值构建的，模板类名与样式选择器必须来自同一个编译器，否则会静默失配。

#### 2.5.3 tsconfig 与类型

- `tsconfig.json`（Host 面）：`rootDir: src`、`outDir: lib/types`、`include: ["src/**/*.ts"]`，引用 Host 依赖；`moduleResolution` 与上游 DSH 包一致（type-only 导入上游 `.d.ts`）。
- `tsconfig.client.json`（Client 面）：额外 `jsx: "react-jsx"`、`lib: ["DOM", "ES2024"]`，`include: ["src/client/**/*"]`，并用一个 `references` 列表声明它关心的上游包（`ui-slots`、`ui-layout`、`ui-sidebar`、`ui-workspace`、`ui-primitives`、`client-locale`、`client-store`），只用于类型解析。
- 两个面都必须能独立 `--noEmit` 通过；Host 面不得引入 DOM 类型，Client 面不得引入 Node 类型。

### 2.6 卡片注册契约（对外 API）

`src/client/contract.ts` 是唯一的对外契约声明，卡片作者 `import type` 它。

```ts
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** 侧栏行 id 与 main 槽键共用的值；产品保留键。 */
export const WORKBENCH_PANEL_ID = 'workbench' as MainPanelId

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** 工作台自身的文案（含卡片壳与菜单）。 */
    workbench: WorkbenchLocaleKey
  }

  interface SlotFactoryMap {
    /**
     * 一张工作台卡片的统一外壳。props 是卡片提供的展示事实，
     * 主体与操作区由卡片在渲染时选择（Factory 本地槽）。
     */
    'workbench.card': {
      scope: 'root'
      props: WorkbenchCardInput
      slots: {
        body: { scope: 'root' }
        actions: { scope: 'root' }
      }
      locale: 'workbench'
    }
  }

  interface SlotMap {
    /**
     * 工作台网格中的卡片，由工作台面板声明。每个条目渲染一次
     * `workbench.card` 装配；`id` 是卡片身份，同时是排序记录的键。
     * 网格本身只负责顺序：放置（`reorder`/`moveBy`）与拖拽会话，X 由卡片
     * 自己提供的 `onRemove` 驱动。
     */
    'workbench.cards': { kind: 'list'; scope: 'root'; owner: WorkbenchCardsOwnerProps }
  }
}
```

卡片注册的入口形态（卡片插件侧，示意）：

```ts
ctx.slots.inject('workbench.cards', () => ctx.slots.register({
  name: 'workbench.cards',
  id: CARD_ID,
  order: 100,
  locale: CARD_NS,
  inject: () => ({ hooks: { repo: repoSource }, refresh: controller.refresh }),
}, CardEntry))

// CardEntry 只做一次投影：把卡片数据交给宿主外壳
// props.renderFactorySlot('workbench.card', {
//   id: CARD_ID, title: t('git.title'), span: 'wide', state, status, onRefresh: props.refresh,
// }, { slots: { body: GitCardBody } })
```

`WorkbenchCardInput` 字段沿用概要设计，实现期补充两点：

- `state` 取 `'idle' | 'ongoing' | 'done' | 'warning' | 'error'`，直接映射到 `ui-primitives` 的 `StateDot`。
- `id` 必须匹配 `/^[a-z0-9][a-z0-9-]*$/` 且长度不超过 64（与 Host 侧记录键的校验一致）；不合规的 `id` 在开发期由包内断言拒绝，在 Host 侧由路由 400 拒绝。

`WorkbenchCardsOwnerProps` 只放渲染已知的展示输入：

```ts
/** 网格渲染卡片条目时的 owner 输入；卡片自身的数据不经过这里。 */
export interface WorkbenchCardsOwnerProps {
  /** 当前卡片的展示顺序（已合并用户排布与默认 order）。 */
  readonly visibleIds: readonly string[]
  /** 拖拽会话中的卡片 id；空闲为 null。 */
  readonly draggingId: string | null
  /** 报告存盘卡片集合发生了变化，由面板重读列表。 */
  readonly onCardsChanged: () => void
}
```

> **排序是唯一的布局维度。** `hiddenCount` / `hideCard` 随隐藏能力一起删除：网格不再向卡片发放任何"让这张卡消失"的手段，卡片要离开产品只能由它自己提供的 `onRemove` 走物理删除。

## 3. Host 半边详细设计

### 3.1 存储域（`src/layout-spec.ts`）

```ts
/** 卡片在网格中的排布记录；缺记录即"未排定"。 */
export interface WorkbenchCardLayoutRecord {
  /** 用户排定的次序值；越大越靠后。缺省表示未排定，按插件 order 参与默认排序。 */
  readonly position?: number
}

/** 工作台布局域；可丢弃的界面状态，坏记录不得阻塞启动。 */
export const WORKBENCH_LAYOUT_DOMAIN = defineDomain({
  name: 'workbench_layout',
  version: 1,
  layout: 'per-record',
  invalidRecords: 'backup-and-skip',
  tables: { layout: domainTable<WorkbenchCardId, WorkbenchCardLayoutRecord>(workbenchCardLayoutSchema) },
})
```

设计要点：

- `position` 用**分数次序**而不是密集序数：移动一张卡片只写它自己那一条记录，不需要重写整份顺序。当插入点的间隙小于 `1e-6` 时，服务对该可见序列做一次归一化重排（重新分配 `1024, 2048, …`）并把受影响的记录一并写入同一次请求——这是唯一会写多条的路径。
- `per-record` 与 `invalidRecords: 'backup-and-skip'` 的理由在概要设计中已定；这里补一条实现约束：`defineDomain` 会拒绝接受 `null` 的 `global` schema，所以**不要**为了"省一张表"把顺序搬进 `global`。
- 域名的 `UNIT_NAME_RE`（`^[a-z][a-z0-9_]*$`）只约束域与表名；记录键是卡片 id，允许连字符，两者不要混淆。

### 3.2 布局服务（`src/layout-service.ts`）

```ts
/** 一张卡片的对外读值。 */
export interface WorkbenchLayoutEntry {
  readonly id: string
  readonly position?: number
}

/** 一次读取的结果。 */
export interface WorkbenchLayoutSnapshot {
  readonly entries: readonly WorkbenchLayoutEntry[]
  /** 单调修订号：进程启动基线与域变更计数合成，用于并发写冲突检测。 */
  readonly revision: string
}

/** 一次写入的请求；`entries` 只包含本次变更的卡片。 */
export interface WorkbenchLayoutPatch {
  readonly baseRevision: string
  readonly entries: readonly WorkbenchLayoutEntry[]
}

export type WorkbenchLayoutWriteResult =
  | { readonly status: 'written'; readonly snapshot: WorkbenchLayoutSnapshot }
  | { readonly status: 'conflict'; readonly snapshot: WorkbenchLayoutSnapshot }
  | { readonly status: 'invalid'; readonly reason: string }
```

服务方法：`read(): Promise<WorkbenchLayoutSnapshot>`、`write(patch: WorkbenchLayoutPatch): Promise<WorkbenchLayoutWriteResult>`、`dispose(): void`。

行为：

- `read` 从域表投影全部记录；`revision` 为 `${bootStamp}:${changeCount}`，`changeCount` 由域变更事件递增。
- `write` 先比对 `baseRevision`：不等即返回 `conflict` 并附带最新快照，**不写入**。相等则逐条写入 `patch.entries`，再返回 `written` 与新快照。
- 校验：条目数不超过 `config.maxRecords`；`id` 匹配 `/^[a-z0-9][a-z0-9-]*$/` 且不超过 64 字符；`position` 非有限数或为负即 `invalid`；重复 `id` 即 `invalid`。
- 删除语义：条目的 `position` 缺省时删除该记录，而不是写入一条等于默认值的记录。（记录只有排序一维，所以"缺省"就只有这一种含义。）
- 归一化：由服务内部决定是否补写，客户端不需要知道。
- 顺序：一次请求内的写入按 `id` 升序执行，避免同一请求内互相覆盖。
- 失败：底层写入抛错时向上传播，由路由层转成 500 与可读消息；**服务不吞错**，因为"没写成功"必须能被界面表达。

### 3.3 Web 路由（`src/layout-route.ts`）

路径与方法常量放在 `src/layout-contract.ts`，双半边共享：

```ts
/** 工作台布局的私有同源路由。 */
export const WORKBENCH_LAYOUT_PATH = '/api/workbench/layout'
/** 响应中的契约版本；客户端不匹配时拒绝解析。 */
export const WORKBENCH_LAYOUT_API_VERSION = 1
/** 单次读取或写入允许的条目上限。 */
export const WORKBENCH_LAYOUT_MAX_ENTRIES = 256
/** 请求体字节上限。 */
export const WORKBENCH_LAYOUT_MAX_BODY_BYTES = 64 * 1024
```

**为什么是私有同源路由，而不是 `ctx.remote`：** Remote 命名空间由上游 Typert 生成器按 `deepseek-harness/` 工作区内的包面产出，`dsh-workbench` 位于外层工作区，无法参与该生成流程；Desktop 自己面向渲染进程的功能走的也正是私有同源路由（`/api/desktop/...`）。因此这里沿用同一条路：**同一份契约常量加上同源 fetch**。

处理器行为：

- 请求围栏：先调用 `ctx.connection.requestRejection(req)`；有拒绝码就原样返回（401 或 403），不进入业务逻辑。围栏必须在任何读盘之前。
- `GET`：返回 `{ apiVersion, revision, entries }`；`cache-control: no-store`。
- `PATCH`：读 JSON body（超过 `WORKBENCH_LAYOUT_MAX_BODY_BYTES` 返回 413），按 `WorkbenchLayoutPatch` 校验字段（`baseRevision` 为字符串、`entries` 为数组），调用服务；`written` 返回 200 与 `{ apiVersion, revision, entries }`；`conflict` 返回 409 且响应体携带最新快照；`invalid` 返回 400 与 `reason`。
- 其他方法：405 并给出 `allow`。
- 错误一律返回 JSON `{ error: { code, message } }`，`code` 取 `'unauthorized' | 'forbidden' | 'invalid-request' | 'conflict' | 'storage-failure'`；消息里不回显用户数据，也不回显请求体。

## 4. Client 半边详细设计

### 4.1 字典（`src/client/locales.ts`）

`WorkbenchLocaleKey` 是 `workbench` 命名空间的键联合，今天有 **79 个键**，来源是两本字典：`zh`（源）与 `en: Record<keyof typeof zh, string>`。**`en` 的注解类型就是"两本字典必须是同一套键"的强制手段**：少一个键或多一个键都是编译错误，页面 spec 另有一条断言把这件事钉在测试里。

**这份文档不再逐键罗列。** 原来那张"至少包含 …"的清单在两次产品改动之后就漂了——它列的 `emptyNoCards`、`moreCards`、`showAll`、`hidden`、`hideCard`、`moveUp`、`moveDown`、`dragHint` 等键今天一个都不存在，而真正在用的键大半没被列出。**权威清单是 `src/client/locales.ts` 本身**，这里只写那些会被人写错的约定：

| 约定 | 内容 |
| --- | --- |
| 命名空间 | `NS = 'workbench'`；键不带前缀，跨域同名的键（如 `panel`、`title`）靠命名空间区分 |
| `panel` 的取值 | 固定为 `工作台` 与 `Workbench`；行名与页面标题同键 |
| 副标题 | 只在页面上出现，用于区分"工作台与工作区"，不进侧栏行 |
| 带参数的键 | `announceMoved` 带 `{title}` 与 `{index}`；页面用 `t(key, params)` 做替换 |
| 卡片壳的文案 | `refreshAll`（刷新控件）、`dragHandle`（手柄的可访问名）、`cardFailed`（主体被失败原因替换时的标题）、`removeCard`（X 的可访问名）、`statusIdle` / `statusOngoing` / `statusDone` / `statusWarning` / `statusError`（`state` 到文案的映射） |
| 运行状态的文案 | `runStatusRunning`（正文那块运行中提示的标题）与运行详情那一组 `run*`（`runStartedAt`、`runStopReason`、`runStopCompleted` / `runStopError` / `runStopAborted`、`runDetailSummary` 等），**由结果页读**，不是卡片正面。状态行移除后，失去读者的 `runStatusIdle` / `runStatusDone` / `runStatusCancelled` / `runStatusFailed` / `runDuration` / `skillCardResultHeading` 已一并删除 |
| 无键可读即缺陷 | 字典里不允许留"没有任何读者"的键：隐藏相关文案（`hideCard`、`showCard`、`announceHidden`、`announceShown`）与不再有控件的 `resetLayout`、`announceReset`、`reload`、`unknownCard`、`createCardConfirm`、`skillCardRunning`、`skillCardCancelled` 都已删除 |

> **注意两处容易误判的"读者"：** `reload` 曾是"重试"文案，`reloadInstances`（页面里的重载函数）包含这串字符但它**不是** locale 键的读者；`skillCardRunning` 与 `skillCardRunningBody` 同理。判定一个键是否还有人读，看的是 `t('<key>')`，不是子串匹配。

### 4.2 远端读写（`src/client/layout-api.ts`）

```ts
/** 浏览器侧的布局读写面；所有失败都以结构化结果返回，不抛到组件。 */
export interface WorkbenchLayoutApi {
  read(signal?: AbortSignal): Promise<ReadResult>
  write(patch: WorkbenchLayoutPatch, signal?: AbortSignal): Promise<WriteResult>
}

export type ReadResult =
  | { readonly status: 'ok'; readonly snapshot: WorkbenchLayoutSnapshot }
  | { readonly status: 'unavailable'; readonly reason: string }

export type WriteResult =
  | { readonly status: 'ok'; readonly snapshot: WorkbenchLayoutSnapshot }
  | { readonly status: 'conflict'; readonly snapshot: WorkbenchLayoutSnapshot }
  | { readonly status: 'failed'; readonly reason: string }
```

行为：

- `read`：`GET` 同源、`credentials: 'same-origin'`、`redirect: 'error'`、`cache: 'no-store'`、`Accept: application/json`。响应先校验 `apiVersion` 与字段，再交给 store；**不信任响应体**（它是跨进程数据）。
- `write`：`PATCH`，body 只含本次变更的条目。`409` 解析为 `conflict` 并带回最新快照；网络错误、非 JSON、`apiVersion` 不匹配一律 `failed`。
- 写序列化：内部用一个串行队列（前一次 `write` settle 前不发第二次），因为落点写入是用户手势驱动的低频事件，串行化能消除同源并发写；队列长度上限 8，超出时丢弃最旧的**待发**变更（已呈现的界面状态不回滚，只提示）。
- 重试：网络失败或 `5xx` 做一次退避重试（200ms）；`4xx` 不重试。

### 4.3 顺序规则与布局控制器（`layout-store.ts`、`layout-controller.ts`）

顺序规则做成一组**纯函数**，单独可测，不依赖 React 也不依赖 Host：

```ts
/** 合并卡片默认顺序与用户记录，得到展示序列。 */
export function resolveWorkbenchOrder(
  cards: readonly WorkbenchCardFact[],
  layout: ReadonlyMap<string, WorkbenchCardLayoutRecord>,
): WorkbenchOrder

/** 规划一次移动，返回补丁条目与结果序列。 */
export function planWorkbenchMove(
  visible: readonly string[],
  layout: ReadonlyMap<string, WorkbenchCardLayoutRecord>,
  id: string,
  toIndex: number,
): WorkbenchMovePlan

/** 把一列卡片重新编号为间距充裕的位置。 */
export function renumberEntries(visible: readonly string[]): readonly WorkbenchLayoutEntry[]

/** 把 Host 快照投影成按卡片 id 索引的排布表。 */
export function layoutFromSnapshot(snapshot: WorkbenchLayoutSnapshot): Map<string, WorkbenchCardLayoutRecord>
```

- **默认与覆盖**：有 `position` 的按 `position` 升序；没有的按其默认 `order` 落在"账本里在它之前的最后一张已排定卡片之后"。
- **一次移动只写一条**：落点两侧都已排定时取中点；只有间隙小于 `WORKBENCH_POSITION_EPSILON` 时才整列重新编号（同一次请求写多条）。落点一侧未排定时，移动的卡片改为锚定已排定那一侧（前插取 `upper - BASE/2`，后插取 `lower + BASE`）；两侧都未排定时写 `WORKBENCH_POSITION_BASE`。
- **变更语义**：条目缺省 `position` 时按删除处理，因此"恢复默认"回到未排定状态而不是留下一堆等于默认值的记录。

页面私有的观看状态由 `useWorkbenchLayout(cards, api, active)` 持有（`layout-controller.ts`）。它**不用声明式 store**：布局是这一页的本地状态，卡片业务数据本来就留在卡片自己的 inject 里，所以 React 状态足够，且少一个跨注册共享的可变源。

```ts
/** 页面渲染所需的读值。 */
interface WorkbenchLayoutView {
  visibleIds: readonly string[]
  draggingId: string | null
  load: 'loading' | 'ready' | 'unavailable'
  write: { phase: 'idle' | 'pending' | 'failed'; message?: string }
}

/** 页面写值。 */
interface WorkbenchLayoutActions {
  reorder(id: string, toIndex: number): void
  moveBy(id: string, delta: -1 | 1): void
  reset(): void
  refresh(): void
  setDragging(id: string | null): void
}
```

行为：

- 控制器把"已应用的排布"与其**修订号一起持有**（读回执、写入回执、冲突快照都会同时更新两者），下一次写入引用它。
- 每次写入都做乐观更新：界面先呈现，失败只在提示条上报告，**不回滚**已经呈现的排布。
- 冲突处理：`409` 时采纳响应里的最新快照，并提示"另一个窗口也改动了布局，已合并"；不重放、不重试。
- 面板首次选中时才读一次（`active` 由页面的 `usePanelInfo` 提供），避免未打开页面就发请求。

### 4.4 面板注册与入口（`src/client/index.ts`）

```ts
export const inject = ['slots', 'locale']
```

`apply` 内按顺序执行：

1. `ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'workbench: dictionaries')`，`NS = 'workbench'`。
2. 卡片事实投影：一个 `createSnapshotStore<readonly WorkbenchCardFact[]>([])`，`syncCards` 由 `ctx.slots.entriesOfSlot('workbench.cards')` 投影出 `{ id, order, label }`（`label` 走 `resolveSlotLabel`，因此跟随语言），并用 `ctx.locale.subscribe` 在语言切换后重建；`ctx.slots.subscribe('workbench.cards', …)` 在注册变化后重建。相等时不写入，保持快照引用稳定。释放时清空。
3. 构造一个 api 实例（`createWorkbenchLayoutApi()`），整个插件共享。
4. `ctx.slots.inject('main', …)` 注册面板：`{ name: 'main', key: WORKBENCH_PANEL_ID, locale: NS, inject: () => ({ hooks: { cards }, api }), children: { 'workbench.cards': { kind: 'list', scope: 'root' } } }`。`hooks.cards` 由渲染器绑定成页面 props 上的 `useCards`。
5. `ctx.slots.inject('sidebar.panellist', …)` 注册行：`{ name: 'sidebar.panellist', id: WORKBENCH_PANEL_ID, order: 100, label: () => t('panel'), locale: NS }`。
6. 面板选中状态由页面自己的 `usePanelInfo` 读取（框架标准 props），因此入口不需要额外订阅。

> **P1–P4 之后的补充（当前实现）：** 入口另外注册了 `workbench.card` 工厂（此前只有声明没有注册，任何卡片调用 `renderFactorySlot('workbench.card', …)` 都会失败），并把技能卡注册成 `workbench.cards` 的一个条目。inject face 也因此不再只有两件东西：卡片事实源、**面板的三态选中状态**（网格 / 某张卡的结果页 / 某张卡的配置页）、布局读写通道 `api`，以及技能卡的传输与"打开某张卡的某个视图"的回调。卡片与页面因此**不共享 React 树**：卡片只说"打开我的结果页 / 配置页"。

页面自己负责顺序与拖拽会话。**隐藏不是页面的一维**：布局记录只有 `position`，控制器没有 `setHidden` / `showAll`。

### 4.5 页面、网格与卡片壳

`WorkbenchPage`（`src/client/WorkbenchPage.tsx`）：

- 结构：页头（`h1` 取 `t('title')`；副标题）加内容，再加写入/合并提示条（`role="status"` 且 `aria-live="polite"`）。页头**没有刷新按钮**：它曾经有一个，但只重读排版顺序、没有可见效果，已移除（locale 键 `refreshAll` 留给卡片外壳自己的刷新控件当 `aria-label`）。
- 顶部内边距照 `ui-plugin-manager` 的页面约定（含 macOS 的 `--dsh-frame-top-clearance` 处理），保证与既有页面同高、拖拽区行为一致。
- **没有空态分支。** 网格永远渲染，它的末尾永远是「创建卡片」磁贴，所以"一张卡都没有"就是正常的首次运行状态；把网格换成一段说明文字会把创建第一张卡片的唯一入口一起拿走。**也没有"全部隐藏"这种状态**——隐藏不是能力。
- `renderEntry(id, owner)` 是页面传给网格的唯一渲染入口：它调用 `renderSlot('workbench.cards', owner, { only: id })`，因此网格始终是声明该槽的那次注册在渲染。存盘的卡片实例不是自己的槽位条目，而是由注册的技能卡条目渲染并被告知自己渲染哪个实例。
- 面板是**一个表面的三种状态**：网格、某张卡的结果页、某张卡的配置页。后两者各占整个显示栏，由 `selection` 决定渲染哪一个，因此都不在网格单元里渲染。

`WorkbenchCardGrid`（`src/client/WorkbenchCardGrid.tsx`）：

- 布局：`display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`，窄于断点（720px）降到单列；`span` 的网格占位样式挂在卡片壳上。
- 拖拽会话由网格持有：手柄 `pointerdown` 触发 `setPointerCapture` 与 `begin`，`pointermove` 用 `document.elementFromPoint(...).closest('[data-card-id]')` 算出落点索引，`pointerup` 提交一次，`pointercancel`/`Escape` 取消。拖拽期间给网格加 `data-dragging`。
- 网格把宿主能力通过 `WorkbenchReorderContext` 交给它渲染的卡片壳（**重排与取消，以及键盘上下移动**），因为工厂槽的 props 由卡片自己传入，宿主不在那条传参路径上。
- 播报：`role="status" aria-live="polite"` 的区域显示最近一次移动的播报；若页面给出了写入提示，提示优先。
- 网格在末尾渲染一个额外单元放传入的 `trailing` 内容：创建卡片属于卡片所在的位置，而只有网格知道那个位置在哪。

`WorkbenchCardShell`（`src/client/WorkbenchCardShell.tsx`，`workbench.card` 工厂组件）：

- `WorkbenchCardShell` 解析框架座位（`useFactorySlot('body'|'actions')`、`t`、重排上下文），把结果交给 `WorkbenchCardShellView`。
- `WorkbenchCardShellView` 接收**纯数据**：卡片的展示事实加一组回调（激活、移除、上下移动、取消拖拽）。这样组件测试可以直接驱动它，不需要渲染机制。
- 结构：`article` 加 `aria-labelledby`；头部为标题、副标题、可选的标题级 `actions`、可选的拖拽手柄与**可选的删除按钮 X**；主体为卡片 body，`failure` 存在时替换为可读原因。
- **外壳不画状态点，也没有刷新控件。** 卡片模型的改动把运行中 / 已出结果 / 失败的呈现整体搬到结果页，卡片正面退化为索引条目，因此原生卡片渲染时不传 `state` / `status` / `onRefresh`，外壳也就不画这三样。（`state` / `status` / `onRefresh` 仍在契约里，供将来需要它们的卡片类型使用。）
- **X 只在卡片提供 `onRemove` 时绘制，而且它永远表示物理删除**：`aria-label` 取 `removeCard`，点击直接调用 `onRemove`，没有 `onHide` 也没有任何回退。不提供 `onRemove` 的卡片类型（例如将来的第三方插件卡）就**没有那个 X**。删除由卡片自己提交（`PATCH { remove: true }`），提交后通知面板重读列表。
- 重排与删除都由宿主绘制，卡片不能覆盖；`reorderable` 只控制是否绘制手柄。

### 4.6 写入语义（端到端）

一次用户手势的完整路径：

1. 控制器乐观更新展示序列并把补丁交给 api；
2. api 的串行队列发出 `PATCH`，body 只含变更条目；
3. 200 返回后用响应快照与修订号校准（Host 可能做了重新编号）；
4. 409 时采纳响应里的最新快照并提示合并，用户刚刚的意图体现在 Host 的快照里；
5. 400、`5xx` 或网络失败时保留界面顺序，提示可读原因，不做回滚。

`WorkbenchCreateCard`（`src/client/WorkbenchCreateCard.tsx`）：

- 网格末尾永远渲染的「创建卡片」磁贴，菜单列出三种类型：技能卡片（可用）、测试卡片与记忆卡片（列出但禁用——藏起来会让用户猜产品到底有没有）。
- **选类型就是全部交互**：磁贴里不起名，卡片出现后由用户在自己的配置页命名。新卡片的 id 是第一个未被占用的 `skill-card-N`，名字先给一个可改的默认值，所以这个入口只做**一个决定**，不是一张表单。
- 原先的 `WorkbenchMoreCards`（"更多卡片"菜单 + "全部显示"）**已随隐藏能力一起删除**：没有任何卡片会被藏起来，也就不需要一条把它们找回来的路径。

`WorkbenchPanelIcon`（`src/client/WorkbenchPanelIcon.tsx`）：接收侧栏给的尺寸，渲染与同行其它面板行一致的线性图标。

按钮类控件用 `ui-primitives` 的 `Button`（图标按钮传 `variant="ghost"` 与本地样式类）；网格与页面的容器用原生元素加 CSS Modules 类名。

## 5. 既有文件改动

### 5.1 根 `package.json`

- `workspaces` 增加 `"dsh-workbench"`。
- 若该包的上游 DSH 依赖需要与两个 Desktop 变体共享解析，按现有 `resolutions` 的写法补条目，且与两个变体声明的通道版本一致。

### 5.2 `dsh-plugin-desktop/` 与 `dsh-plugin-desktop-beta/`

两个变体各自改两处，内容按各自的通道版本写：

1. `package.json` 的 `dependencies` 增加 `"dsh-workbench": "workspace:*"`（或该仓库既有变体工作区依赖的等价写法）。
2. `cordis.patch.yml` 增加一条 insert：

```yaml
- insert:
    - id: workbench
      name: dsh-workbench
      config:
        enabled: true
```

两组文件的差异必须只体现在包名、版本与通道常量上：`check:desktop-variants` 会比对两份变体的共享面，改动提交前必须跑。

### 5.3 文档

- `docs/README.md`：开发者文档表里补一行指向本文（与概要设计相邻）。
- `docs/workbench-design.md`：开头说明实现级展开见本文，并在"包与构建"一节链接本文的目录布局，避免两处各写一份清单。

## 6. 失败语义、可观测性与安全

- **围栏先于业务**：路由先 `connection.requestRejection`，再读 body，再碰存储；任何跳过围栏的实现都是缺陷，需要测试固定。
- **输入即不可信**：路由对 body 做字段与范围校验；客户端对响应做字段与 `apiVersion` 校验。跨进程边界两侧都校验，不在同一进程内的类型假设上偷懒。
- **失败可见**：读取失败显示不可用状态与重试入口；写入失败保留界面顺序并提示；卡片自身失败只影响该卡片。
- **日志**：Host 侧用 `ctx.logger` 记录域打开失败、归一化发生、写入失败的具体原因；不记录请求体内容。客户端不新增日志通道。
- **限额**：请求体上限、条目上限、`id` 长度、`position` 必须为有限数；超限明确报错而不是截断。
- **权限**：卡片触发的命令一律走 Host 侧既有的沙盒与权限策略；工作台不提供绕过入口，也不代卡片执行命令。

## 7. 验证与门禁

### 7.1 `dsh-workbench/tests`（包级）

- `layout-spec.spec.ts`：域名与表名符合命名规则；`per-record` 与 `backup-and-skip` 生效；一条坏记录被移开且域照常打开；**旧文档里仍写着 `hidden` 的记录被按可见读回**（字段被忽略，不做迁移）。
- `layout-service.spec.ts`：读、写、`baseRevision` 冲突返回 `conflict` 且不写入；条目上限、`id` 形状、`position` 有限数的拒绝路径；分数次序插入与间隙不足时的归一化（断言同一次请求写入了哪些记录）；重置走删除语义（`position` 缺省即删除）。
- `layout-route.spec.ts`：围栏先于任何存储访问（用一个被调用即失败的存储替身）；`GET`、`PATCH` 与其它方法的状态码；`409` 携带最新快照；`400` 的 `reason`；413 大小上限；错误消息不回显请求体。
- `layout-store.spec.ts`：`resolveWorkbenchOrder` 的默认顺序、覆盖顺序、新卡片插入、以及"带 `hidden: true` 的记录仍出现在可见序列里"；`planWorkbenchMove` 的中点、前插/后插锚定与间隙不足时的整列重编号。
- `layout-controller.spec.tsx`（jsdom）：view 与 actions 的键集合**只含排序与拖拽**（没有隐藏操作）；`reset()` 走 `{ id }` 删除语义并回到默认顺序。
- `layout-api.spec.ts`：`apiVersion` 不匹配、非 JSON、网络失败、冲突合并、写队列串行与上限；响应里多出的 `hidden` 字段被丢弃。
- `WorkbenchPage.spec.tsx`：创建卡片磁贴与类型菜单、写入失败提示、`aria-live` 播报、冲突合并、拖拽一个补丁、零隐藏控件、zh 与 en 字典键集合相等。
- `WorkbenchCardGrid.spec.tsx`：owner props 只含顺序与拖拽（键集合断言）、指针拖拽只写一次、键盘路径、拖拽期间的 `data-dragging`、X 只走卡片自己的 `onRemove` 且不碰布局 actions。
- `WorkbenchCardShell.spec.tsx`：`failure` 覆盖主体、`actions` 与 `body` 本地槽的选择**不受 X 影响**、`onRemove` 缺席时**一个 X 都不画**。
- `SkillCard.spec.tsx` / `SkillCardPages.spec.tsx` / `SkillCardSettings.spec.tsx`：卡片正面的各状态呈现、结果页的运行状态与失败原因、配置页的目录与就地违例。

### 7.2 Desktop 侧

- 组合测试：在真实 profile 组合下启动，断言侧栏出现 `workbench` 行且顺序在"插件"与工作区区域之间、面板可选中、卡片由已安装插件提供。
- 变体一致性：`corepack yarn check:desktop-variants`。
- 若改动了可见输出：`DSH_SNAPSHOT=replay pnpm run test:web`。

### 7.3 门禁

包级 `corepack yarn typecheck`、`corepack yarn build`、`corepack yarn test`；两端提交前跑 `corepack yarn check`。

## 8. 分期与验收

| 阶段 | 内容 | 验收 |
| --- | --- | --- |
| P1 骨架 | 包清单、双半边入口、构建、侧栏行与空面板、空态 | 应用启动后侧栏出现"工作台"，位置正确，页面渲染两种空态 |
| P2 宿主 | 卡片契约、网格、卡片壳、卡片清单入口 | 一个测试卡片插件能注册并正确渲染；Factory 本地槽生效 |
| P3 排布 | 布局 store、拖拽、键盘、顺序持久化、Host 域与路由 | 重排跨重启、跨窗口一致；冲突与失败路径按 4.6 表现 |
| ~~P4 隐藏~~ | ~~隐藏、恢复、全部显示、重置~~ **已整体删除** | 这条能力今天不存在：见 4.5 与 9.3 |
| P5 首批卡片 | Git 仓库、开发 Agent、测试与检查 | 三张卡片在真实环境可用，刷新与失败路径正确 |

> **本节是当时的计划表，不是今天的规范。** 表里有两处已被后续修订取代，读的时候不要当成现状：
>
> - **P1 的"两种空态"** 已不存在：网格永远渲染，末尾是「创建卡片」磁贴，所以"一张卡都没有"就是正常状态（见 4.5）。
> - **P4 隐藏** 已整体删除（见 9.3）；这一行保留只为对上当时的交付记录，**不是待办**。
> - 同样地，"验收标准的条数"也随需求方案修订变化——**现在是 79 条**（其中第 52 条已撤回，故 78 条在效：1–16 既有卡片能力、17–34 按钮触发执行、35–48 编辑器与配置页、49–56 结果页与微调、57–60 结果页修正、61–70 手工编辑结果、71–79 每卡选择模型），当前映射见[需求方案 · 附录 A](workbench-card-requirements.md#附录-a验收标准映射)与[技能卡详细设计 · 附录 B](workbench-skill-card-detailed-design.md#附录-b验收映射)；P9 那一行的出口标准指的是当时那一版的需求 §13。
>
> 段落里"P3 之后追加一次同源双窗口的手工验证"指当时的做法；今天的自动化覆盖见 7.1、9.1 与 9.2。

每阶段结束时的完成定义：包级测试与 `typecheck` 绿、`check:desktop-variants` 绿；P3 之后追加一次同源双窗口的手工验证（两个窗口同时改布局，观察合并与提示）。

## 9. P1–P4 的落地结果

P1 至 P4 已实现（`dsh-workbench/`），P5 的首批卡片仍未开工。实际落地与本设计有两处偏离，都是有意的：

- **本包不注册 `layout` 以外的客户端服务**：客户端 `inject` 收敛为 `['slots', 'locale']`。面板选中状态由页面自己的 `usePanelInfo` 读取，无需订阅 `layout`；这也少一次跨注册的引用。
- **顺序的状态放在页面的 React 状态（`useWorkbenchLayout`）**（当时还包含隐藏），而不是声明式 store：布局只服务这一页，卡片业务数据本来就留在卡片自己的 inject 里。纯顺序规则仍是可测的纯函数（`resolveWorkbenchOrder`、`planWorkbenchMove`、`renumberEntries`）。
- **命令面板的重排命令未接入**：键盘路径通过卡片壳的手柄（方向键移动、Esc 取消）完成。三张首批卡片之外，页面暂不显示"工作区上下文"，因此 `useWorkspaces` 没有进入页面 props。

P1–P4 的验证证据（在 `dsh-workbench/` 下执行）：

| 命令 | 结果 |
| --- | --- |
| `yarn typecheck`（Host、Client、两个测试面共四个项目） | 通过 |
| `yarn test` | 8 个 spec、100 个用例全部通过 |
| `yarn build` | `lib/index.js`、`lib/client.js`（含 Loader 握手与 CSS）、`lib/types/**` 全部产出 |
| `corepack yarn check:desktop-variants`（仓库根） | 通过：212 个共享源文件对齐 |

P2/P3 里"卡片插件注册并渲染"与"跨窗口一致"的验收目前由包级测试覆盖：宿主外壳与网格的成分测试、路由与服务的 Host 侧测试、以及页面级的读取/写入/冲突/失败路径测试。

### 9.1 真机组合验证

**真机组合验证已执行，两个版本都跑了**：用仓库自带的组合冒烟（`corepack yarn workspace dsh-plugin-desktop verify:profile` 与 `… dsh-plugin-desktop-beta verify:profile`）在**真实 Desktop profile** 上启动 Host 与 Web carrier。这个冒烟用 `prepareDesktopProfile` 装配真实 profile、读取真实 patch 层（也就是第 5.2 节插入的那条 `dsh-workbench`），因此它验证的是产品组合本身，而不是单元级的拼装。

工作台断言已作为**永久断言**写进两个变体的冒烟脚本（`dsh-plugin-desktop{,-beta}/scripts/verify-profile-boot.mjs`，因此 `check:desktop-variants` 仍保持 212 个共享文件对齐），覆盖：

| 断言 | 观测结果 |
| --- | --- |
| 客户端图中存在工作台行 | `{"id":"dsh-workbench","url":"plugins/??dsh-workbench/client.js&rev=…","inject":["@deepseek-ai/dsh-client-locale","@deepseek-ai/dsh-client-ui-layout","@deepseek-ai/dsh-client-ui-renderer","@deepseek-ai/dsh-client-ui-sidebar","@deepseek-ai/dsh-client-ui-workspace"]}` |
| 未认证访问布局路由被挡 | `GET /api/workbench/layout` → **403 forbidden** |
| 认证后的读取 | `200 {"apiVersion":1,"revision":"…:0","entries":[]}` |
| 一次写入 | `200 {"apiVersion":1,"revision":"…:1","entries":[{"id":"probe-card","position":1024}]}` |
| 写入跨请求留存（落到存储域） | 再读回：`{"revision":"…:1","entries":[{"id":"probe-card","position":1024}]}` |
| 客户端半边可被 Loader 加载 | `200`，33636 字节，含 `window.__ModuleLoader__.load({` 与 `"dsh-workbench"` |

两个版本的输出一致（同为 33636 字节的客户端产物）。这也顺带验证了**两条运行时通道**：稳定版解析 `@deepseek-ai/dsh-*` `0.2.0-rc.2`、Beta 解析 `0.2.1-alpha.2`，工作台声明的双版本 peer 区间在两个通道上都成立。

### 9.2 真实浏览器渲染验证

`verify:profile` 另外带一个**渲染后的 DOM 断言**（仅在带 `--workbench-browser` 时运行）：用 Playwright 的 pinned Chromium 以无头模式打开刚启动的 renderer URL，带上 renderer 能力头与认证 cookie，然后按用户看到的样子断言。断言对语言自适应（读 `document.documentElement.lang` 选择中文/英文文案）：侧栏面板行的顺序里工作台在插件之后、点开后面板标题出现、**技能卡在网格里且样式生效**、卡片正面**不出现运行按钮**、点卡片本体打开结果页且无模板时那里的「运行」是禁用的、创建卡片磁贴里选类型能建出第二张卡，并截图留证。

> **已知缺陷：** 这条可选路径里还留着两处已删除控件的文案引用——`names.more`（"More cards"/"更多卡片"，对应的按钮已随隐藏能力删除）与 `createCardConfirm`（"Create"/"创建"，磁贴里不再有确认按钮）。因此 `--workbench-browser` 目前会在第一步等待超时；修在 `dsh-plugin-desktop{,-beta}/scripts/verify-profile-boot.mjs`，见 9.3 末条。

| 版本 | 侧栏面板行 | 结果 |
| --- | --- | --- |
| 稳定版 | `["插件","工作台"]` | 通过，截图 `%TEMP%\dsh-workbench-desktop.png` |
| Beta | `["插件","自动化任务","工作台"]` | 通过，截图 `%TEMP%\dsh-workbench-desktop-beta.png` |

两张截图都显示：工作台行位于插件（Beta 另有自动化任务）之后、工作区区域之前；主框架是工作台页面（标题、副标题、卡片网格与末尾的创建卡片磁贴；截图当时页头还有一个刷新按钮，该控件后来按"没有可见效果"移除）。截图里那条"预览版说明"浮层是上游首启引导，会挡住指针事件，因此脚本用直接派发点击事件的方式激活行——这解释了为什么断言不是用 `click()`。

浏览器这一层是**可选**的：脚本在 Playwright 缓存里找不到 `chromium*` 时打印一行 skipped 并继续（加 `--require-workbench-browser` 则改为失败）。这样无浏览器的 CI 不会因为缺二进制而红，而需要严格验证的机器可以显式要求。

仍未执行的一项：

- **打包应用内的真机点击** —— 需要 `corepack yarn dist:win:beta` 重新打包（需要网络与较长时间）；当前运行的 DSH Desktop 2.0.17 是此前打包的产物，不含工作台。渲染层已经由上面的无头 Chromium 覆盖，因此这条只差"装进安装包再点一遍"。

### 9.3 隐藏能力整体移除（P4 之后的反向修订）

P4 交付的隐藏是一条**通用**能力：外壳有 `onHide`，布局记录有 `hidden`，客户端有 `setHidden` / `showAll` / `hiddenIds` / `hiddenCount` / `hideCard`，页面有一张「更多卡片」菜单负责"全部显示"，宿主会解析并回写 `hidden`。产品决定是**隐藏不存在**：卡片的 X 是物理删除，没有任何卡片类型可以隐藏。留着这条通用路径的代价很具体——**任何省略 `onRemove` 的卡片类型都会悄悄长出一个隐藏按钮**，一条已被移除的产品行为重新长回来。因此它整体删除：

| 层 | 删除物 | 今天的行为 |
| --- | --- | --- |
| 布局契约 | `WorkbenchCardLayoutRecord` / `WorkbenchLayoutEntry` 的 `hidden` | 记录只剩 `position` |
| 布局存储域 | schema 里的 `hidden` | 旧文档里仍写着 `hidden` 的记录**按可见读回**，字段被忽略，**不做迁移** |
| 布局服务 / 路由 | 读取与写入里的 `hidden`、`hidden must be a boolean` 校验 | 补丁只带排序；`position` 缺省即删除 |
| 客户端传输与控制器 | `hidden` 解析、`setHidden`、`showAll`、`hiddenIds` | view 只有 `visibleIds`，actions 只有 `reorder` / `moveBy` / `reset` / `refresh` / `setDragging` |
| 卡片外壳 | `onHide` 与 `onRemove ?? onHide` 回退、`data-workbench-hide` | X **只在提供 `onRemove` 时渲染**，且只表示删除；不提供就没有那个按钮 |
| 页面 | 「更多卡片」菜单、「全部隐藏」空态、页脚的隐藏角标 | 页头只剩标题与副标题（刷新按钮后来也按"没有可见效果"移除）；网格永远渲染，末尾是创建卡片磁贴 |
| 文案 | `hideCard`、`showCard`、`announceHidden`、`announceShown` | 字典里不再有隐藏相关文案 |

**排序、拖拽、键盘移动与重置一字未动**：只有隐藏这一维被拿掉。`reset()` 仍留在控制器里（它把记录删回未排定状态），但**不再有可见控件**——P4 时代那只"更多卡片"菜单曾承载它。旧记录带 `hidden: true` 的兼容路径由回归用例钉住（`layout-spec.spec.ts`、`layout-service.spec.ts`、`layout-route.spec.ts`、`layout-api.spec.ts`、`layout-store.spec.ts`、`WorkbenchPage.spec.tsx`），外壳"没 `onRemove` 就不画 X"由 `WorkbenchCardShell.spec.tsx` 断言。

> **两个变体的浏览器冒烟里仍留着两处旧文案引用**（`names.more` = "More cards"/"更多卡片"、"More cards" 按钮的等待与 `createCardConfirm` = "Create"/"创建"）。它们属于 `dsh-plugin-desktop{,-beta}/scripts/verify-profile-boot.mjs`，`--workbench-browser` 那条可选路径会因此超时；这是本轮发现、**尚未修**的独立缺陷，不在本文范围内。

## 10. 续作入口

这一节给接手的人（或压缩后的新上下文）最短的落点，不重复前文结论。

**已完成并验证**：P1–P4（包骨架、卡片宿主、排布与持久化；P4 的隐藏能力随后整体删除，见 9.3），以及第 9.1、9.2 节的两层真机验证。工作树内的改动清单：新增 `dsh-workbench/` 与 `docs/workbench-detailed-design.md`；修改根 `package.json`、`yarn.lock`、`docs/README.md`、`docs/workbench-design.md`，以及两个变体各自的 `package.json`、`cordis.patch.yml`、`scripts/verify-profile-boot.mjs`。

**已知未修项**（本轮发现，见 9.2 与 9.3 的注）：两个变体的 `verify-profile-boot.mjs` 在 `--workbench-browser` 路径上仍引用已删除的「更多卡片」按钮与已被移出 UI 的 `createCardConfirm`（磁贴里不再有「创建」确认键），因此那条可选断言会超时。

**下一步候选**，按价值排序：

1. **P5 首批卡片**（第 8 节表里的前三张：Git 仓库、开发 Agent、测试与检查）。每张卡片是一个独立插件包，只依赖第 2.6 节的契约；先做 Git 仓库那张能最快打通"卡片插件 → 卡片壳 → 网格"的真实链路。
2. **命令面板重排命令**（第 9 节列出的偏离之一）：`workbench.card.moveUp` / `moveDown` / `workbench.layout.reset` 三条，走 `ctx.shortcuts`。
3. **页面的工作区上下文**：把 `useWorkspaces` 接进页面 props，用于按工作区过滤卡片。
4. **打包实测**：`corepack yarn dist:win:beta` 后安装并在应用内点一遍（第 9.2 节最后一条）。

**复跑命令**（本轮实际执行的）：

```sh
corepack yarn install
corepack yarn workspace dsh-workbench check           # typecheck + 100 用例 + build + 产物握手
corepack yarn check:desktop-variants                  # 212 个共享文件对齐
corepack yarn workspace dsh-plugin-desktop verify:profile        # 真机组合 + 真实浏览器
corepack yarn workspace dsh-plugin-desktop-beta verify:profile
```

浏览器那一步需要 Playwright 的 pinned Chromium；补装方式是 `corepack yarn dlx playwright@1.63.0 install chromium`（版本必须与 `dsh-desktop-next` 钉的一致，否则下载的 revision 用不上）。缺浏览器时该步会打印 skipped 并继续。

**环境注意**：`dsh-workbench` 的 tsconfig 开了 `skipLibCheck`（理由写在 `tsconfig.json` 顶层注释）；客户端 `inject` 只有 `['slots','locale']`；`lib/client.js` 未压缩，约 34 kB。


