# dsh-workbench

The DSH Desktop workbench: the sidebar entry, the card page in the main column, and the host that gives plugins somewhere to put a development-state card. It is an ordinary DSH plugin package (a Host half and a Client half) that both Desktop editions depend on.

Design and rationale: [workbench overview](../docs/workbench-design.md) and [workbench detailed design](../docs/workbench-detailed-design.md).

## Capabilities

- **Sidebar entry**: registers `id: workbench` with `order: 100` in `sidebar.panellist`, landing between the Plugins row and the workspace region. The panel is named `工作台` / `Workbench`.
- **Card host**: the panel registers `key: workbench` in the `main` slot and declares the `workbench.cards` list child. A card package contributes with `ctx.slots.inject('workbench.cards', …)`. The grid always ends with a **Create card** tile; the shipped skill card is one entry that renders every stored instance, and a card's face is an index only — clicking its body opens its result page (where Run lives) and its Configure action opens its config page.
- **One shell**: the `workbench.card` assembly owns the frame, title, subtitle, reorder handle, and a delete X that is drawn **only when the card supplies `onRemove`**. A card supplies presentation facts and picks its own `body` / `actions` components.
- **Layout**: ordering is the only layout dimension. Reorder by dragging a card's header handle or with the arrow keys on that handle. Hiding does not exist: the X is a physical delete that removes the card together with its templates and its result, and a card type that supplies no `onRemove` simply has no X.
- **Persistence**: the ordering lives in the Host-side `workbench_layout` storage domain (`per-record` plus `invalidRecords: 'backup-and-skip'`), keyed by card id, so every client of one profile sees the same arrangement. Each record holds one `position` and nothing else; a record written by an older build that still carries `hidden` is read as visible, with no migration step.

## Run instructions

A skill may need to be told what to work on. Whether it does is a per-card setting; what it is told belongs to one run.

| `instructionMode` | Run bar | A run with an empty field |
| --- | --- | --- |
| `none` (default) | no composer at all — the header's Run button, unchanged | runs |
| `optional` | one composer in the run bar, beside that button | runs |
| `required` | one composer in the run bar, beside that button | is refused in place: the field says what is missing and takes focus, nothing is sent |

- Absence reads as `none`, so every card that predates the field keeps exactly the interface it had.
- There is one composer and no dialog. The Run button is never disabled *because* the field is empty: refusal says why, in place, and leaves the button available.
- The route validates it too — a blank instruction is a bad request, and one longer than 2000 characters is refused — so a stale client cannot spend a run on an empty ask, and the runner refuses a `required` card whose own run carries none (`instruction-missing`). A run started from a row's own button is exempt: the click named the subject, so requiring a sentence as well would break every template button on such a card.
- The text travels in the prompt as `<run_instruction>`, framed as the subject of the skill rather than as another set of instructions, and is kept on the result record, so a history row states the ask it answered.
- Keyboard: `Enter` submits while the text is one line, `Shift+Enter` is a newline, and `Ctrl`/`Cmd`+`Enter` always submits. A multi-line ask therefore never runs by accident.
- The last three distinct asks of one card are offered back as chips that refill the field; they are derived from the run history, not stored separately. An unsent draft survives a page change within the session, keyed per card.

## Contract

| Item | Value |
| --- | --- |
| Panel id / `main` key | `workbench` |
| Card slot | `workbench.cards` (list, root) |
| Card assembly | `workbench.card` (Factory with local `body` / `actions` slots) |
| Locale namespace | `workbench` |
| Layout route | `GET` / `PATCH` `/api/workbench/layout` |
| Skill card routes | `/api/workbench/skill-card` (+ `/catalog`, `/run`, `/result`, `/directory`, `/files`) |
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

## What a document's own script receives

A skill card's template is the user's own HTML, and its inline `<script>` runs when the card renders. It is handed one object, as its parameter:

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

| Member | Meaning |
| --- | --- |
| `dsh.cardId`, `dsh.runId` | The card that rendered the document, and the run it shows |
| `dsh.root`, `dsh.host` | The document's shadow root and the element that holds it |
| `dsh.files.list(path)`, `dsh.files.read(path)` | List a directory, or read one text file, of the card's own workspace directory |
| `dsh.markdown.render(element, text)` | Render Markdown into one element of the document |

Both reads answer relative to the card's workspace directory, reject a path outside it, refuse a binary or a file over 1 MiB, and list at most 500 entries. Each returns the Host's answer or throws an error whose message is already localized. The script is the user's code, so the document is not sandboxed further than that: what it can reach is the page and these two reads.

The **region** a run fills is model output, not user code: a script inside it is refused by the result editor and stripped before the document is spliced, so a model cannot author behaviour.

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
- The skill card's model picker reads the optional `modelDirectories` client service, injected in its scoped form. Without that service a card still runs on a model it has stored, but its runs inherit the session's model, and such a result cannot name the route it used: the result record's `model` is written only when the card itself pinned one. The field asks that directory for a catalog when it mounts, as the application's own picker does.
- The skill card's workspace is a directory the user picks, never a registered workspace id. On Windows the picker is the Desktop plugin's own (`window.__DSH_DESKTOP_PICK_DIRECTORY__`, behind `POST /_dsh/desktop/pick-directory`); elsewhere it is the optional `uiWorkspace` client service, injected in its scoped form. Without either, the field states that no picker exists — there is no text field, and a card with no directory cannot run.
- The run instruction is trimmed, capped at 2000 characters, and stored on the result record of the run that carried it — one run's ask is not a reusable prompt, so a card has no saved instruction field to edit. A card's `instructionMode` is stored like the permission and defaults to `none` when unset, so a card that existed before the setting never grows a composer on its own.
- The skill card's permission mode is a per-card setting stored as `permission`, defaulting to `workspace-write` when unset, so cards that predate the field run stricter than the session they use to inherit. It is applied by appending one `sandbox/mode` event to the card's own agent, whose session a child inherits — the same agent that fences the run at the card's directory. The workspace therefore limits writes only under `read-only` and `workspace-write`, and the fence itself has never been verified in a real application: `tests/skill-card-workspace-sandbox.spec.ts` is a deliberately skipped specification, so no part of this should be read as "writes are confined to the chosen directory".
