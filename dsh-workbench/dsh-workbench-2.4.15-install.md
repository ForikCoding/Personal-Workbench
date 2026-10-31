# dsh-workbench 2.4.15 — 「运行指令」重启后回默认值

真的没存住吗？不是。**存住了，读的时候被丢掉了。**

## 根因

卡片记录写到磁盘时是完整的：

```
C:\...\harness\storages\workbench_skill_card\card\skill-card-2.json
{
  "version": 1,
  "record": { "name": "任务分析", "skill": "uf30-task-analysis", ..., "instructionMode": "required" }
}
```

加载时这条记录要过一遍 `workbenchCardConfigSchema`（zod）。**zod 会把 schema 里没声明的键直接删掉**，而这张 schema 是在 `permission` 之后就没再更新过——`instructionMode` 没在里面。于是：写入成功、落盘完整、加载时字段消失，页面读回默认值「不需要」。这就是「保存了，重启又回去了」。

同一个毛病还带走了另外三个字段：

| 表 | 字段 | 后果 |
| --- | --- | --- |
| `card` | `instructionMode` | 就是你看到的：运行指令回默认 |
| `result` | `instruction` | 结果页上「这次让它做什么」丢了——你磁盘上三条结果确实带着这个字段，一直被丢 |
| `result` | `failure` / `failureCode` | 跑失败/被拒的结论在重启后没了，卡片看起来像「跑了但没产出」 |

顺带一个静默的行为问题：重启后 `required` 变成 `none`，Host 端那条「必须有指令才允许开跑」的校验也就失效了——卡片看起来还写着「不需要」。修好之后它会重新生效。

## 改法

1. `workbenchCardConfigSchema` 补 `instructionMode: z.enum(WORKBENCH_INSTRUCTION_MODES).optional()`。用枚举而不是 `z.string()`：这条卡片的模式决定了 Host 要不要拒绝空指令的运行，读到一个本版本不认识的模式宁可让领域层备份跳过，也不要当作「不要求」。
2. `workbenchResultSchema` 补 `instruction`、`failure`、`failureCode`。`failureCode` 用 `z.string()`：更新的版本可能带来本版本不认识的 code，那种情况要能读进来（卡片本来就对未知 code 回落到通用标题），不能把整条结果判为不可读。
3. 补 4 条 spec 钉住这件事：「运行指令整条记录往返」「没设过就不该有 mode」「未知 mode 拒绝」「结果里的指令与失败结论往返」。schema 文件顶部那段「store 写的每个字段都必须在这里声明」的注释，把这次的事写成第二个例子——它已经吃掉过 name、editedAt、model、activity、runId、sessionId、permission，这次是第七个。

**你不需要重新设一遍。** 磁盘上那条记录还是 `"instructionMode": "required"`，装上重启就会自己回来。

## 门禁

- `typecheck` 0
- `vitest` 48 文件 / **886 通过 / 3 跳过**
- `build` 0，`verify:artifacts` 干净
- 装好的 `lib/index.js` 里四个新字段都在 schema 中

## 装

```
F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.15.tgz
```

profile 清单已指向它，`node_modules/dsh-workbench` 已是 2.4.15。

**重启 DSH Desktop，然后 `Ctrl+F5`。**

## 验收

1. 任务分析的「运行指令」应当自己回到「必须」（就是你上次设的那条），不用重设。
2. 随便改一个别的字段保存，再重启一次——它还是「必须」。
3. 打开一条带指令的历史结果，「运行指令」那一行还在。
