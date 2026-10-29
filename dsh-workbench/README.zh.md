# dsh-workbench

DSH Desktop 工作台：侧栏入口、主框架中的卡片页，以及让插件放置开发态卡片的宿主。它是一个普通的 DSH 插件包（Host 半边 + Client 半边），被两个 Desktop 版本同时依赖。

设计与取舍见[工作台概要设计](../docs/workbench-design.md)与[工作台详细设计](../docs/workbench-detailed-design.md)。

## 能力

- **侧栏入口**：向 `sidebar.panellist` 注册 `id: workbench`、`order: 100`，落在「插件」行与工作区区域之间；面板名为 `工作台` / `Workbench`。
- **卡片宿主**：面板向 `main` 槽注册 `key: workbench`，并声明 `workbench.cards` 列表子槽。卡片插件用 `ctx.slots.inject('workbench.cards', …)` 贡献条目。网格末尾永远是「创建卡片」磁贴；随包发布的技能卡是一个条目，它负责渲染每一条存盘实例。卡片正面只是索引：点本体打开它的结果页（「运行」在那一页），点「配置」打开它的配置页。
- **统一外壳**：`workbench.card` 装配负责边框、标题、子标题、拖拽手柄，以及一个**只在卡片提供 `onRemove` 时才绘制**的删除 X；卡片提供展示事实，并自己选择 `body` / `actions` 组件。
- **布局**：排序是唯一的布局维度。拖动卡片页头的手柄重排，或聚焦手柄后用方向键移动。**没有隐藏这一维**：X 是物理删除，会把卡片连同它的模板与结果一起删掉；没提供 `onRemove` 的卡片类型根本没有那个 X。
- **持久化**：顺序存在 Host 侧的 `workbench_layout` 存储域（`per-record` 与 `invalidRecords: 'backup-and-skip'`），按卡片 id 记录，因此同一 profile 的所有客户端看到同一份排布。每条记录只有一个 `position`，没有别的字段；旧版本写下的、仍带 `hidden` 的记录按可见读回，不做迁移。

## 运行指令

技能有时需要被告知「这次做什么」。**要不要**是卡片的设置，**说了什么**属于那一次运行。

| `instructionMode` | 运行条 | 留空就点运行 |
| --- | --- | --- |
| `none`（默认） | 不出现输入框，页头的「运行」按钮与以前完全一样 | 照常运行 |
| `optional` | 运行条里出现一个输入框，与那个按钮并排 | 照常运行 |
| `required` | 运行条里出现一个输入框，与那个按钮并排 | 就地拒绝：输入框说明缺什么并拿到焦点，什么也不发送 |

- 字段缺失按 `none` 读，因此所有早于这个设置的卡片保持原样界面。
- 只有一个输入框，没有弹窗。「运行」按钮**永不因为输入框为空而变灰**：拒绝就地说出原因，并把按钮留在可点状态。
- 路由也做校验——空白指令是坏请求，超过 2000 字符同样拒绝——所以旧客户端不会花一次运行去问一句空的；`required` 的卡片自己那颗「运行」在没有指令时由 runner 直接拒绝（`instruction-missing`）。**点行触发的运行不受此限**：那次点击已经指定了对象，一行数据就是它的指令，否则这类卡片的模板按钮会全部失效。
- 文本以 `<run_instruction>` 进入 prompt，被框定为技能**作用的对象**而不是又一份指令，并写在结果记录上，历史行因此能说出这一行回答的是哪一句。
- 键盘：文本只有一行时 `Enter` 提交，`Shift+Enter` 换行，`Ctrl`/`Cmd`+`Enter` 始终提交，因此多行指令不会被误触发。
- 同一张卡片最近三条互不相同的指令以 chip 形式提供回来，点一下填进输入框；它们从运行历史派生，不另存一份。未发送的草稿在一次会话内跨页面保留，按卡片分开。

## 契约

| 项 | 值 |
| --- | --- |
| 面板 id / `main` 键 | `workbench` |
| 卡片槽 | `workbench.cards`（list，root） |
| 卡片装配 | `workbench.card`（Factory，本地槽 `body` / `actions`） |
| locale 命名空间 | `workbench` |
| 布局路由 | `GET` / `PATCH` `/api/workbench/layout` |
| 技能卡路由 | `/api/workbench/skill-card`（另加 `/catalog`、`/run`、`/result`、`/directory`、`/files`） |
| 存储域 | `workbench_layout`，表 `layout` |

卡片 id 是命名空间化的 slug（`/^[a-z0-9][a-z0-9-]*$/`，不超过 64 字符），例如 `git-repo`。它同时是槽条目 id、布局记录键与重排键，一经发布不应更改。

## 卡片插件怎么写

```ts
import type { Context } from '@deepseek-ai/cordis'
import type {} from 'dsh-workbench/client'

export const inject = ['slots', 'locale']

export function apply(ctx: Context): void {
  ctx.slots.inject('workbench.cards', () => ctx.slots.register({
    name: 'workbench.cards',
    id: 'example-card',
    order: 100,
    locale: 'example',
    inject: () => ({ hooks: { status: statusSource } }),
  }, CardEntry))
}

// CardEntry 只做一次投影：
// props.renderFactorySlot('workbench.card', {
//   id: 'example-card', title: t('title'), span: 'wide',
// }, { slots: { body: ExampleBody } })
```

卡片可以传的展示事实有 `title`、`subtitle`、`span`、`state`、`status`、`failure`、`onRefresh`、`onActivate` 与 `onRemove`。

> **其中三个今天只有契约、没有画面。** 卡片模型把运行状态与刷新手势移出了卡片正面，所以传 `state` / `status` / `onRefresh` 不会画出状态点，也不会画出刷新控件：随包发布的技能卡把它们留在自己的结果页上。传 `onRemove` 才有那个删除 X；不传就一个都没有。

卡片的数据来自它自己的 Host 半边或已有的客户端事实。工作台不读取、不转发、不缓存卡片数据，也不提供卡片之间共享数据的通道。

## 模板自己的脚本拿到什么

技能卡的模板是用户自己的 HTML，里面的内联 `<script>` 会在卡片渲染时执行，并收到一个对象作为参数：

```html
<div id="tree"></div>
<!-- template-begin --><!-- template-end -->
<script>
  const listing = await dsh.files.list('任务分析')
  // listing.entries: [{ name, path, type: 'directory' | 'file' | 'other', size? }]
  const file = await dsh.files.read(listing.entries[0].path)
  await dsh.markdown.render(document.getElementById('doc'), file.text)
</script>
```

| 成员 | 含义 |
| --- | --- |
| `dsh.cardId`、`dsh.runId` | 渲染这段文档的卡片，以及它显示的那次运行 |
| `dsh.root`、`dsh.host` | 文档的 shadow root 与承载它的元素 |
| `dsh.files.list(path)`、`dsh.files.read(path)` | 列目录 / 读一个文本文件，都限定在这张卡自己的目录里 |
| `dsh.markdown.render(element, text)` | 把 Markdown 渲染进文档里的某个元素 |

两个读操作都相对卡片的工作目录解析，路径越出这个目录会被拒绝，二进制文件与超过 1 MiB 的文件会被拒绝，一次最多列 500 条。它们要么返回宿主的结果，要么抛出带已本地化文案的错误。脚本是用户自己的代码，所以文档没有更进一步的沙箱——它能拿到的只有页面本身和这两个读操作。

区间（run 填的那段）是模型输出而非用户代码：区间里的 `script` 会被结果编辑器拒绝，并在拼接前被剥掉，所以模型写不出行为。

## 配置

| 字段 | 默认 | 含义 |
| --- | --- | --- |
| `enabled` | `true` | 是否打开布局域并注册布局路由 |
| `maxRecords` | `256` | 存储的卡片布局记录上限，同时限制单次请求的条目数 |

## 已知限制与后续工作

- 不提供只读的卡片元数据接口：已注册卡片的事实只有槽账本一处来源（`ctx.slots.entriesOfSlot('workbench.cards')`）。需要按卡片身份发现的消费者应直接读账本，或先补一个只读服务。
- 顺序持久化固定为存储域；浏览器 `localStorage` 与设置命名空间都不使用。
- 命令面板尚未接入重排命令；键盘路径通过卡片自己的手柄完成。
- 页面暂不显示工作区上下文，因此 `useWorkspaces` 不在它的 props 里。
- 运行指令会被去掉首尾空白、限制在 2000 字符内，并存在承载它的那次运行的结果记录上——一次运行的问法不是可复用的 prompt，所以卡片没有「已保存指令」这样的字段可编辑。卡片的 `instructionMode` 与权限一样按记录存，缺失时按 `none` 读，因此早于该设置的卡片不会自己长出输入框。
- 技能卡的模型选择器读的是可选的 `modelDirectories` 客户端服务，用**作用域形式**注入。没有这个服务时，卡片仍能按它自己存过的模型运行，但运行会继承会话的模型，而这样的结果**说不出自己用的是哪条路由**：结果记录里的 `model` 只在卡片自己钉住了一条路由时才写。
- 技能卡的工作目录是用户**选的目录**，不是已注册的工作区 id。Windows 上用的是 Desktop 插件自己的选择器（`window.__DSH_DESKTOP_PICK_DIRECTORY__`，背后是 `POST /_dsh/desktop/pick-directory`）；其他平台用可选的 `uiWorkspace` 客户端服务，同样以**作用域形式**注入。两者都没有时，字段直接说明没有选择器——不提供文本框，而没有工作目录的卡片不能运行。
