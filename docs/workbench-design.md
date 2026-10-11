# DSH Desktop 工作台概要设计

本文是"工作台"（Workbench）的概要设计，用于在二次开发中把开发态信息聚合进 Desktop 主界面。文中把已经存在的官方能力标为事实并给出出处，把本设计新增的部分标为设计约定；实现顺序与验收见最后一节。

## 目标与范围

在侧栏的 **插件** 与 **工作区** 之间插入一个新的全局面板入口 **工作台**，它在主框架中打开一页卡片网格，每张卡片展示一类开发态信息：代码仓库状态、开发工作的 Agent、测试与检查、环境健康等。卡片的提供者是可安装的插件，工作台本身只定义卡片宿主、注册契约和排版，不实现具体卡片。

本设计覆盖：位置与信息架构、面板注册方式、卡片注册契约、数据与刷新模型、状态与存储归属、包与构建、失败语义、验证与分期。不覆盖：具体卡片的数据模型细化、市场发布流程、Agent 调度算法。

## 现状与既有能力

以下事实来自当前代码，是设计必须成立的前提。

- 侧栏的全局面板行由 `ui-plugin-manager` 注册进 `sidebar.panellist`，`order: 0`、`id: 'plugins'`，并在同一 `apply` 里向 `main` 槽注册 `key: 'plugins'` 的页面（[src/client/index.ts](../../deepseek-harness/packages/client/ui-plugin-manager/src/client/index.ts)）。行序按 `order` 升序、同序按注册顺序，图标收到 `{ size, active }`。**插件** 行因此排在最前。
- 侧栏品牌行下方到列表底部之间的整块区域属于 `sidebar.workspaces` 的占用者，其中包含 **工作区** 头行和会话列表（[slots.ts](../../deepseek-harness/packages/client/ui-sidebar/src/client/contract/slots.ts)、[SidebarRoot.tsx](../../deepseek-harness/packages/client/ui-sidebar/src/client/SidebarRoot.tsx)）。工作区行不是 `sidebar.panellist` 的一项。
- `main` 是 ui-layout 声明的 keyed/root 槽：`entryKey` 等于侧栏行的 id，`conversation` 为保留键表示会话；除此之外的键不绑定 Session（[index.ts](../../deepseek-harness/packages/client/ui-layout/src/client/index.ts)）。
- 选择面板走 `ctx.layout.selectPanel(id)`；面板注册被释放时 `retainMainPanels` 会把选中项清回会话（[stores.ts](../../deepseek-harness/packages/client/ui-layout/src/client/stores.ts)）。
- 插件的组合入口是 profile 与 `cordis.patch.yml`，Desktop 的 Host 侧入口列在 [cordis.patch.yml](../../dsh-plugin-desktop/cordis.patch.yml)；`deepseek-harness/` 是固定的上游子模块，Desktop 变更不改动它（[AGENTS.md](../../AGENTS.md)）。
- 卡片可用组件来自 `ui-primitives` 的目录与 `ui-theme` 的语义 token，样式走 CSS Modules，不引入字面色值或组件库（[ui-primitives README](../../deepseek-harness/packages/client/ui-primitives/README.md)、[web-styling.md](../../deepseek-harness/docs/web-styling.md)）。
- 客户端插件与 Host 之间的数据通道是 `ctx.remote` 与 Host service，浏览器侧不直接持有 Electron 或 Node 能力。

## 位置与信息架构

```text
侧栏（sidebar）
├─ 品牌行 / 新会话
├─ 全局面板行：插件  ←  工作台  ←  以后新增的全局面板
└─ 工作区浏览器（工作区头行 + 会话列表）
主框架（main）
└─ 工作台页面
   ├─ 页头：标题、工作区上下文、刷新、布局密度
   └─ 卡片网格
      └─ 卡片（壳：标题 / 状态 / 主体 / 操作；主体由卡片插件提供）
```

工作台是**全局面板**：它与会话无关，选中它不改变当前 Session，返回会话由 `conversation` 键接管。这与 **插件** 面板的行为一致，也是"卡片里能点开一条会话而不丢上下文"的前提。

侧栏行的位置由 `order` 决定：**插件** 保持 `order: 0`，工作台取 `order: 100`（数字留空档，便于以后在两者之间插入），从而落在插件行与工作区区域之间。工作台不注册 `sidebar.workspaces`，因此不会挤掉工作区浏览器。

### 命名约定

面板名中英固定为 **工作台 / Workbench**，与侧栏已有的 **工作区 / Workspaces** 刻意区分。

| 用途 | 取值 | 说明 |
| --- | --- | --- |
| 侧栏行名与可访问名 | `工作台` / `Workbench` | `sidebar.panellist` 的 `label` 同时是行文案与 `aria-label`，只有这一个名字可用 |
| 页面标题 | 同上，同源同键 | 页头 `<h1>` 不另起文案，避免"菜单叫什么、进去叫什么" |
| 英文侧工作区 | 保持 `Workspaces` | 不为给工作台让位而改动 `ui-workspace` 的 `section.workspaces` |

落地方式：在工作台自己的 locale 命名空间下只有一个键（默认名为 `panel`），取值 `工作台` / `Workbench`，以 `label: () => t('panel')` 的 thunk 形式注册，保证切换语言时行名跟着更新。

两点需要遵守：

- 面板名是**短名词**，与已发布的 **插件** / `Plugins` 形态一致。不写成"开发工作台"这类限定词：那会让该行明显长于同行其它行，也不再是短名词形态。`工作台` 与 `工作区` 只差一个字，靠界面区分而不是靠加长行名，例如首次出现时用一次性的页面副标题说明（该副标题不进侧栏行）。
- 侧栏行名与工作区列头在已发布代码里的英文大小写并不统一（行名 `Plugins` 句首大写，列头 `Workspaces` 词首大写）。工作台采用 `Workbench`，即与行名同一形态；统一大小写属于上游既有问题，不在本设计内顺手改动。

## 面板注册

工作台面板是一次普通的面板注册，不需要改动 ui-layout 或 ui-sidebar：

```ts
// 包内常量：侧栏行 id 与 main 键共用同一个值
export const WORKBENCH_PANEL_ID = 'workbench' as MainPanelId

// 1) 主面板页面
ctx.slots.inject('main', () => ctx.slots.register({
  name: 'main',
  key: WORKBENCH_PANEL_ID,
  locale: NS,
  store,                                   // 视图状态，见"状态与存储归属"
  inject: () => face,                      // 页面自己需要的回调与观察源
  children: { 'workbench.cards': { kind: 'list', scope: 'root' } },
}, WorkbenchPage))

// 2) 侧栏入口；Declaring is claiming：图标由工作台拥有
//    label 的取值由 locale 字典固定为 工作台 / Workbench，见"命名约定"
ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
  name: 'sidebar.panellist',
  id: WORKBENCH_PANEL_ID,
  order: 100,
  label: () => t('panel'),
  locale: NS,
}, WorkbenchPanelIcon))
```

面板本身不需要额外的清理逻辑：注册释放时 `retainMainPanels` 已经会把选中项清回会话。页面若需要跨渲染保留观看状态，走注册时声明的 store。

约束与已知风险：

- 面板键在 `main` 与侧栏 id 上全局唯一。第三方若用同一 `workbench` 键注册，会在同一 key、同一 priority 上直接抛错（fail loud），不会静默替换；文档应把这个键声明为产品保留键。
- 卡片槽 `workbench.cards` 由工作台面板声明（declaring is claiming），因此只有工作台能渲染它；卡片插件只能用 `ctx.slots.inject('workbench.cards', …)` 贡献，不能自行声明。
- 上例的 `NS` 是工作台自己注册的 locale 命名空间（`LocaleNamespaceMap` 声明合并）；侧栏标签取该命名空间的 `panel` 键，页面文案、卡片失败原因也必须来自该字典或卡片自己的字典，见"命名约定"。
- 页面组件只接收五类派生 props，不接触 `ctx`；数据经 inject 工厂与声明 store 进入。
- 侧栏行标签与页面文案都走 locale 字典，不写死文案；面板名的具体取值见"命名约定"。

## 卡片注册契约

卡片不是一个自定义注册 API，而是官方已有的 **Component Factory**：工作台声明 `workbench.card` 这个可复用装配，卡片插件按独立的位置渲染它。这样卡片的边框、页头、状态点和操作区由工作台统一绘制，卡片只提供主体内容，同时不违反"插件不得导入另一个插件组件"的规则。

```ts
// workbench 包导出的契约声明
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotFactoryMap {
    /**
     * 一张工作台卡片的统一外壳。props 是卡片提供的展示事实，
     * 主体与操作区是调用方选择的本地组件。
     */
    'workbench.card': {
      scope: 'root'
      props: WorkbenchCardInput
      slots: {
        body: { scope: 'root' }
        actions: { scope: 'root' }
      }
    }
  }
}

/** 卡片提供者提交的展示事实与生命周期回调。 */
export interface WorkbenchCardInput {
  /** 卡片身份，同时是网格内的稳定键与顺序依据。 */
  readonly id: string
  /** 卡片标题。 */
  readonly title: string
  /** 次级说明，例如仓库路径或分支名。 */
  readonly subtitle?: string
  /** 网格占位：标准格、双列、双行，或大卡。 */
  readonly span?: 'standard' | 'wide' | 'tall' | 'large'
  /** 同一网格内的排序，升序。 */
  readonly order?: number
  /** 状态点语义，缺省表示无状态。 */
  readonly state?: 'idle' | 'ongoing' | 'done' | 'warning' | 'error'
  /** 状态文案，与 state 配套。 */
  readonly status?: string
  /** 用户手势触发的刷新；卡片自己决定是否需要。 */
  readonly onRefresh?: () => void
  /** 卡片级的显式失败：主体不可用时的可读原因。 */
  readonly failure?: string
}
```

卡片插件的注册形态（示意）：

```ts
ctx.slots.inject('workbench.cards', () => ctx.slots.register({
  name: 'workbench.cards',
  id: CARD_ID,
  order: 100,
  locale: NS,
  inject: () => ({ hooks: { repo: repoSource }, refresh: controller.refresh }),
}, CardEntry))

// CardEntry 是薄组件：把卡片数据投影成一次 renderFactorySlot 调用
// props.renderFactorySlot('workbench.card', {
//   id: CARD_ID, title: t('git.title'), state, status, span: 'wide', onRefresh: props.refresh,
// }, { slots: { body: GitCardBody } })
```

设计说明与边界：

- 网格顺序以 `workbench.cards` 的 `order` 作为**默认顺序**，用户拖拽过的位置以 `id` 为键覆盖默认顺序，见"卡片布局与重排"；卡片之间的依赖关系不允许存在，跨卡片要共享事实时应通过 Host service 或 Remote 数据通道，而不是导入彼此。
- 卡片插件自己的 inject 工厂在工作台面板的注入之外单独提供自己的数据与回调，因此卡片的业务数据不需要进入工作台的 store。
- `body` 与 `actions` 是 Factory 的本地槽，由卡片在每次渲染时选择组件；不使用 ReactNode 作为 owner 值，符合客户端的数据/回调传递规则。
- 卡片必须以 `workbench.card` 渲染，不得自行绘制不同外壳；需要新模式时先扩展 `span` 与壳的规格，而不是绕过 Factory。
- 卡片内不自行订阅外部快照：可观察源走 inject 的 `hooks` 隔间，由渲染器绑定成 `use<Name>`。

### 卡片枚举：不提供专用元数据通道

工作台**不**在 `workbench.cards` 之外再提供只读的卡片元数据接口。已注册卡片的事实只有一处来源：槽账本本身。

- 工作台页面是 `workbench.cards` 的占用者，在自己的 `apply` 闭包里用 `ctx.slots.entries('workbench.cards')` 读条目（`id`、`order`、`label`）；`ui-layout` 对 `main` 槽用的是同一种读法。
- 其他插件若确实要按卡片身份发现卡片，直接读同一张账本，或用 `ctx.slots.subscribe('workbench.cards', …)` 订阅变化。这是槽机制自身的读法，**不是工作台承诺的卡片元数据契约**：字段与稳定性由槽机制决定，工作台不为其背书。
- 卡片 id 仍需要命名空间化的前缀（如 `git-repo`、`agent-runs`），并且与拖拽重排持久化记录使用同一个键，一次定死。
- 跨卡片共享事实不靠枚举：读取方走 Host service 或 Remote 数据通道，渲染方走插槽。元数据通道本来也给不出组件与回调，因此它解决不了这类需求。

将来若出现真实消费者（某个插件要按卡片身份发现卡片、要把卡片列进插件详情页，或卡片数量增长到需要在工作台之外汇总状态），再补一个**只读服务**形态的接口：它是对 `workbench.cards` 账本的投影，而不是第二张注册表；只暴露展示事实（身份、标题、占位大小、状态语义、归属包名），不含组件、回调与 inject 面；标题按当前语言求值。

## 卡片布局与重排

网格是自适应列数（按可用宽度取 1–3 列），卡片的 `span` 决定它在网格中占几格：`standard` 一格、`wide` 横跨两列、`tall` 纵向两格、`large` 两列两行。窄窗口下降到单列时所有 `span` 退化为一行，卡片内容自带滚动或截断，不撑破页面。

**拖拽重排**是本期能力，排序结果按 `id` 覆盖默认 `order`：

- **触发方式**：卡片页头在指针悬停与键盘聚焦时显示拖拽手柄，由手柄发起拖拽；卡片主体上的文本选择、滑杆与跳转链接不触发拖拽。整卡拖动会与卡片内的交互控件冲突，因此不用整卡作为拖拽面。
- **拖拽过程**：拖动中的卡片跟随指针并半透明，网格显示插入位置指示；拖到工作台面板之外视为取消，按 Esc 取消并归位。一次拖拽只产生一次状态写入（落点确定时提交），不做逐帧持久化。
- **键盘可达**：手柄是可聚焦控件，`Space` 拾起、方向键移动一格、`Space` 落下、`Esc` 取消；重排结果通过 `aria-live` 播报"已移动到第 n 位"。命令面板另提供"上移/下移卡片""恢复默认布局"两条命令，供无指针场景使用。
- **持久化与失效**：顺序按卡片 `id` 存储，并在**每次拖拽落点时立即写入**（避免一次意外退出丢掉全部布局），写入失败时保留界面顺序并给出可读提示，不回滚用户已经看到的排布。已卸载卡片的 `id` 永久保留在记录里而不是删除，重装后回到用户排定的位置；卡片消失时不移位其他卡片。
- **新卡片与默认位置**：插入位置由默认 `order` 决定，而不是追加到末尾——排在它前面、且用户已经排定的卡片之后。这样新装的卡片留在插件作者声明的位置附近，不会因为用户早先调过顺序就被甩到最后。
- **重置**：页头提供"恢复默认布局"，清空顺序记录；该操作属于可撤销的低风险操作，不需要确认对话框。

## 数据与刷新模型

卡片的读取路径分三类，按可用性从高到低选择：

1. **已有客户端事实**：工作区列表、会话列表、会话状态、面板信息等经由框架标准 props（`useWorkspaces`、`useSessions`、`usePanelInfo`）直接读到，不新增通道。
2. **Host 能力**：需要在磁盘、进程或系统上取事实的卡片，由该卡片的 Host 半边提供 service 或 Remote，浏览器半边通过 `ctx.remote` 调用；命令执行遵循 Host 侧已有的 subprocess/终端语义，禁止拼接 shell 字符串越过边界。
3. **Desktop 自有服务**：当前 profile、Desktop 设置与终端能力经 `desktopProfiles` / `desktopPnpm` 等 Desktop service 或对应的 Remote 获得；这些是不可从浏览器直接读取的 Host 服务，卡片必须经 Remote 边界。

刷新语义：卡片自己拥有读取与刷新，工作台只提供用户手势入口（页面刷新按钮、卡片 `onRefresh`）。面向会话的流式事实走 Remote 事件推送而不是轮询；卡片在卸载时释放自己的订阅与在途请求。**不使用全局定时轮询**，避免多卡片叠加造成 Host 压力。

上下文：工作台页面显示当前工作区作为全局上下文；卡片用 `useWorkspaces` 读取它，用于 Git 仓库、测试命令这类与工作区绑定的事实。工作台不替卡片选择仓库。

## 状态与存储归属

| 状态 | 归属 | 说明 |
| --- | --- | --- |
| 网格顺序、布局密度、筛选条件（运行期） | 工作台面板 store | 观看状态，随面板注册存活；store 是唯一写入点，持久化只是它的投影 |
| 用户排定的卡片顺序（持久） | 工作台自己的持久化 | 按卡片 `id` 记录，应用重启与 profile 内插件重装后保持；写入在拖拽落点立即发生 |
| 卡片业务数据、刷新游标 | 卡片插件自己的 inject 与 Remote | 工作台不持有，也不解析 |
| 卡片偏好（监控哪些仓库、跑哪条命令） | 卡片插件自己的持久化 | 需要落盘时使用已有的设置/存储能力，不写入工作台 store |

持久化有三条可选承接路径，约束相同、代价不同，实现时选定其中一条：

| 路径 | 落点 | 代价与风险 |
| --- | --- | --- |
| 工作台自己的 Host 半边 + 存储域（`ctx.storageDomain`） | Host 侧、schema 校验的 KV 域 | 需要在卡片顺序这一件事上新增一个 Remote 读写通道；域记录可用 `invalidRecords: 'backup-and-skip'` 把不可解析的旧记录移开而不阻塞启动，正合"可丢弃的界面状态" |
| 设置命名空间（`ctx.settings` + 设置 Remote） | Host 侧设置文档 | 已有读写通道与并发保护（写失败要按修订号重读重放）；代价是卡片顺序会作为一个命名空间出现在设置文档与描述面里，而它是界面状态、不是用户可配置项 |
| 浏览器 `localStorage`（store 声明的 `persist`） | 当前 Web 客户端 | 最省事，但同一 profile 的另一个窗口或局域网客户端看不到同一顺序，也无法随 profile 数据目录迁移 |

选择的判据是"这份顺序属于谁"：若属于**用户在该 profile 下的工作台布局**，取前两条之一（Host 侧）；若明确接受"每个客户端各自一份"，才用第三条。三条共同约束对任何一条路径都成立：**卡片 id 是唯一键**、**写入失败不回滚已经呈现的排布**、**卡片卸载不删除记录**。

## 包与构建

工作台是独立的可安装插件包 **`dsh-workbench`**，不并入 `dsh-plugin-desktop`：卡片契约与页面属于产品能力，独立包可以被稳定版与 Beta 两个 Desktop 变体同时依赖，避免在 `dsh-plugin-desktop/` 与 `dsh-plugin-desktop-beta/` 之间重复同步源码。相应地，Desktop 变体只保留一行依赖与一条 profile insert，两边的客户端源码不发生镜像关系。

需要落地的登记点：

1. 新包加入根 `package.json` 的 `workspaces`，并在两个 Desktop 变体包的依赖中声明（版本与其余 Desktop 依赖的通道约定一致）。
2. 客户端半边（`./client` 导出、`dsh.client` manifest、平台为 `web`、`inject` 列出实际依赖的包名边），Host 半边在需要时提供卡片与页面的 Remote。
3. 组合入口：两个变体各自的 `cordis.patch.yml` insert 一条 `dsh-workbench` 条目；普通 `dsh web` 由各自的 profile 或 bundle 声明同一行。
4. 变体一致性：即使源码不镜像，两个变体的依赖与 insert 仍要成对更新，改完运行 `corepack yarn check:desktop-variants`。

## 首批卡片

| 卡片 | 展示 | 数据来源 | 用户操作 |
| --- | --- | --- | --- |
| Git 仓库 | 当前工作区仓库、分支、领先/落后、变更文件数、最近提交 | 卡片的 Host 半边执行 `git`，经 Remote 投影 | 打开仓库目录、刷新、复制分支名 |
| 开发 Agent | 进行中的会话与子代理、状态、当前任务摘要 | `useSessions`、会话状态、子代理状态 | 打开会话、用预置提示词新建会话 |
| 测试与检查 | 最近一次测试/检查的结果、耗时、失败摘要 | 卡片的 Host 半边执行项目脚本并经 Remote 投影 | 重跑、打开输出、跳到失败文件 |
| 环境健康 | Desktop 版本、模式、profile、宿主端口、插件数 | Desktop service 与现有 Dashboard 类页面数据 | 打开设置、复制诊断信息 |
| 待办与目标 | 当前会话的 todo 进度、计划状态、后台 job | 现有会话与 job 能力 | 跳到会话对应位置 |
| 终端与日志 | 打开的终端标签、最近错误 | Desktop 终端服务与日志 | 打开终端、导出日志 |

首批实现只需前三张；后三张复用已有页面能力，属于增强项。

## 失败语义与安全边界

- 单张卡片失败只影响它自己：外壳渲染状态点与可读原因，`failure` 文案走 locale 字典；卡片抛错不得让工作台页面白屏。页面级失败（卡片槽不可用、locale 未安装）按现有槽机制的 fail-loud 处理，不静默降级。
- 面板注册被释放（插件卸载、profile 切换、generation 重建）时，选中项回到会话；工作台不缓存跨 generation 的 service 引用、窗口对象或子进程句柄。
- 卡片可以展示本地路径、分支名与用户自己的提示词；不得展示凭据、令牌或环境变量内容。诊断导出沿用现有的脱敏规则。
- 卡片触发的命令继承 Host 侧既有的沙盒与权限策略，工作台不提供绕过入口。

## 验证与验收

- 面板注册的组件测试：以 props 与 store 夹具驱动，断言侧栏行 id/标签、页面渲染与空卡片状态。
- 命名测试：在 zh 与 en 两份字典下断言行名与页面标题分别为 `工作台` / `Workbench`，且两侧不出现 `Workspace`/`工作区` 作为工作台的名称。
- 槽生命周期测试：注册与释放卡片贡献，断言网格增删；断言工作台仅通过 `ctx.slots.entries('workbench.cards')` 与订阅读取卡片事实，且不存在第二张卡片注册表；断言面板释放后 `activePanelId` 回到 `conversation`。
- 顺序测试：断言侧栏行序为 **插件 → 工作台 → 工作区区域**，且工作台不占用 `sidebar.workspaces`。
- 重排测试：以 store 夹具驱动断言默认顺序、用户覆盖顺序与新卡片插入位置；断言落点写入一次、失败时界面排布不回滚；断言键盘路径（拾起、移动、落下、取消）与 `aria-live` 播报。
- 组合测试：在真实 profile 组合下启动 Desktop，断言侧栏存在工作台入口、卡片由已安装插件提供，而非手工 `ctx.plugin()` 拼装。
- 官方门禁：`pnpm run test:gui` 覆盖客户端；改动可见输出时补 `DSH_SNAPSHOT=replay pnpm run test:web`；两个变体的依赖与 insert 改动跑 `corepack yarn check:desktop-variants`。
- 类型与构建：`corepack yarn typecheck`、`corepack yarn build`。

## 待决策

1. 卡片顺序的持久化承接层：Desktop 设置还是 DSH 存储域（约束已定，实现时按现有能力选定）。
2. 是否允许隐藏卡片（隐藏与卸载的区别、隐藏后能否从"更多卡片"恢复）。
