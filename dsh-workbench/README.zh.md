# dsh-workbench

DSH Desktop 工作台：侧栏入口、主框架中的卡片页，以及让插件放置开发态卡片的宿主。它是一个普通的 DSH 插件包（Host 半边 + Client 半边），被两个 Desktop 版本同时依赖。

设计与取舍见[工作台概要设计](../docs/workbench-design.md)与[工作台详细设计](../docs/workbench-detailed-design.md)。

## 能力

- **侧栏入口**：向 `sidebar.panellist` 注册 `id: workbench`、`order: 100`，落在「插件」行与工作区区域之间；面板名为 `工作台` / `Workbench`。
- **卡片宿主**：面板向 `main` 槽注册 `key: workbench`，并声明 `workbench.cards` 列表子槽。卡片插件用 `ctx.slots.inject('workbench.cards', …)` 贡献条目。网格末尾永远是「创建卡片」磁贴；随包发布的技能卡是一个条目，它负责渲染每一条存盘实例。卡片正面只是索引：点本体打开它的结果页（「运行」在那一页），点「配置」打开它的配置页。
- **统一外壳**：`workbench.card` 装配负责边框、标题、子标题、拖拽手柄，以及一个**只在卡片提供 `onRemove` 时才绘制**的删除 X；卡片提供展示事实，并自己选择 `body` / `actions` 组件。
- **布局**：排序是唯一的布局维度。拖动卡片页头的手柄重排，或聚焦手柄后用方向键移动。**没有隐藏这一维**：X 是物理删除，会把卡片连同它的模板与结果一起删掉；没提供 `onRemove` 的卡片类型根本没有那个 X。
- **持久化**：顺序存在 Host 侧的 `workbench_layout` 存储域（`per-record` 与 `invalidRecords: 'backup-and-skip'`），按卡片 id 记录，因此同一 profile 的所有客户端看到同一份排布。每条记录只有一个 `position`，没有别的字段；旧版本写下的、仍带 `hidden` 的记录按可见读回，不做迁移。

## 契约

| 项 | 值 |
| --- | --- |
| 面板 id / `main` 键 | `workbench` |
| 卡片槽 | `workbench.cards`（list，root） |
| 卡片装配 | `workbench.card`（Factory，本地槽 `body` / `actions`） |
| locale 命名空间 | `workbench` |
| 布局路由 | `GET` / `PATCH` `/api/workbench/layout` |
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
