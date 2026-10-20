# dsh-workbench

The DSH Desktop workbench: the sidebar entry, the card page in the main column, and the host that gives plugins somewhere to put a development-state card. It is an ordinary DSH plugin package (a Host half and a Client half) that both Desktop editions depend on.

Design and rationale: [workbench overview](../docs/workbench-design.md) and [workbench detailed design](../docs/workbench-detailed-design.md).

## Capabilities

- **Sidebar entry**: registers `id: workbench` with `order: 100` in `sidebar.panellist`, landing between the Plugins row and the workspace region. The panel is named `工作台` / `Workbench`.
- **Card host**: the panel registers `key: workbench` in the `main` slot and declares the `workbench.cards` list child. A card package contributes with `ctx.slots.inject('workbench.cards', …)`. The grid always ends with a **Create card** tile; the shipped skill card is one entry that renders every stored instance, and a card's face is an index only — clicking its body opens its result page (where Run lives) and its Configure action opens its config page.
- **One shell**: the `workbench.card` assembly owns the frame, title, subtitle, reorder handle, and a delete X that is drawn **only when the card supplies `onRemove`**. A card supplies presentation facts and picks its own `body` / `actions` components.
- **Layout**: ordering is the only layout dimension. Reorder by dragging a card's header handle or with the arrow keys on that handle. Hiding does not exist: the X is a physical delete that removes the card together with its templates and its result, and a card type that supplies no `onRemove` simply has no X.
- **Persistence**: the ordering lives in the Host-side `workbench_layout` storage domain (`per-record` plus `invalidRecords: 'backup-and-skip'`), keyed by card id, so every client of one profile sees the same arrangement. Each record holds one `position` and nothing else; a record written by an older build that still carries `hidden` is read as visible, with no migration step.

## Contract

| Item | Value |
| --- | --- |
| Panel id / `main` key | `workbench` |
| Card slot | `workbench.cards` (list, root) |
| Card assembly | `workbench.card` (Factory with local `body` / `actions` slots) |
| Locale namespace | `workbench` |
| Layout route | `GET` / `PATCH` `/api/workbench/layout` |
| Storage domain | `workbench_layout`, table `layout` |

A card id is a namespaced slug (`/^[a-z0-9][a-z0-9-]*$/`, at most 64 characters), for example `git-repo`. It is the slot entry id, the layout record key, and the reorder key at once, so it must not change once published.

## Writing a card

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

// CardEntry performs one projection:
// props.renderFactorySlot('workbench.card', {
//   id: 'example-card', title: t('title'), span: 'wide',
// }, { slots: { body: ExampleBody } })
```

The presentation facts a card may pass are `title`, `subtitle`, `span`, `state`, `status`, `failure`, `onRefresh`, `onActivate`, and `onRemove`.

> **Two of them are contract-only today.** The card model moved the run state and the refresh gesture out of the card face, so a card that passes `state` / `status` / `onRefresh` gets no status dot and no refresh control drawn: the shipped card keeps those on its own result page. Pass `onRemove` to get the delete X; a card that omits it has no X at all.

A card reads its own facts from its Host half or from existing client state. The workbench never reads, forwards, or caches card data, and offers no channel for cards to share it.

## Configuration

| Field | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Whether the Host opens the layout domain and registers the layout route |
| `maxRecords` | `256` | Stored card layout records, and the entry cap for one request |

## Known Limitations and Deferred Work

- There is no read-only card metadata interface: the slot ledger (`ctx.slots.entriesOfSlot('workbench.cards')`) is the single source of registered cards. A consumer that needs to discover cards by identity reads that ledger, or the read-only service gets added first.
- Order persistence is fixed to the storage domain; the browser `localStorage` and the settings namespace are both deliberately unused.
- The command palette does not expose the reorder commands yet; the keyboard path runs through a card's own handle.
- The page shows no workspace context yet, so `useWorkspaces` is not part of its props.
- The skill card's model picker reads the optional `modelDirectories` client service, injected in its scoped form. Without that service a card still runs on a model it has stored, but its runs inherit the session's model, and such a result cannot name the route it used: the result record's `model` is written only when the card itself pinned one.
- The skill card's workspace is a directory the user picks, never a registered workspace id. On Windows the picker is the Desktop plugin's own (`window.__DSH_DESKTOP_PICK_DIRECTORY__`, behind `POST /_dsh/desktop/pick-directory`); elsewhere it is the optional `uiWorkspace` client service, injected in its scoped form. Without either, the field states that no picker exists — there is no text field, and a card with no directory cannot run.
- The skill card's permission mode is a per-card setting stored as `permission`, defaulting to `workspace-write` when unset, so cards that predate the field run stricter than the session they use to inherit. It is applied by appending one `sandbox/mode` event to the card's own agent, whose session a child inherits — the same agent that fences the run at the card's directory. The workspace therefore limits writes only under `read-only` and `workspace-write`, and the fence itself has never been verified in a real application: `tests/skill-card-workspace-sandbox.spec.ts` is a deliberately skipped specification, so no part of this should be read as "writes are confined to the chosen directory".
