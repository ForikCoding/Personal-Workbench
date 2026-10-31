/**
 * `workbench` locale dictionaries: the sidebar row, the panel page, the card
 * shell, the result and configuration pages, the creation tile, and the
 * accessibility announcements.
 * @module dsh-workbench/client/locales
 */

/** Chinese dictionary. */
export const zh = {
  panel: '工作台',
  title: '工作台',
  subtitle: '把 Git、Agent 与测试状态收在一页',
  refreshAll: '刷新',
  // The grid is never empty: the creation entry is always in it, so there is no
  // empty state to describe, and hiding is not a capability at all.
  dragHandle: '拖动调整位置',
  announceMoved: '{title} 已移动到第 {index} 位',
  writeFailed: '布局未能保存',
  mergedElsewhere: '另一个窗口也改动了布局，已合并',
  cardFailed: '这张卡片暂时不可用',
  statusIdle: '空闲',
  statusOngoing: '进行中',
  statusDone: '完成',
  statusWarning: '注意',
  statusError: '失败',
  skillCardTitle: '技能卡',
  skillCardRun: '运行',
  skillCardCancel: '取消',
  skillCardLoading: '正在读取',
  skillCardLoadingBody: '正在读取这张卡的配置与上次结果。',
  skillCardNoTemplateTitle: '还没有模板',
  skillCardNoTemplateBody: '这张卡需要你为所选 skill 写一段 HTML 模板才能运行。',
  skillCardNotRunTitle: '尚未运行',
  skillCardNotRunBody: '点「运行」让这个 skill 执行一次。',
  skillCardResultFailedTitle: '这次运行没有产出内容',
  skillCardResultTimeoutTitle: '这次运行超时了',
  skillCardProblemNotConfigured: '还没有选择 skill',
  skillCardProblemNoTemplate: '这个 skill 还没有模板',
  skillCardProblemNoSession: '没有可用的会话',
  skillCardProblemSkillMissing: '这个 skill 已经不可用',
  skillCardProblemProvider: '当前的子代理后端不支持结构化输出',
  skillCardProblemContract: '输出契约不合法',
  skillCardProblemTemplateInvalid: '模板不合法',
  skillCardProblemRunning: '已经有一个运行在进行',
  skillCardProblemRunFailed: '这次运行没有产出可用的结果',
  skillCardProblemRunTimeout: '这次运行超过了时限，被宿主中止了；可以再跑一次',
  // 这张卡能读、能改，只有"运行"不行：宿主没有提供任何一条运行入口。
  skillCardProblemRunUnavailable: '当前 harness 不能运行卡片：卡片运行需要提供 startActivation（0.2.1-alpha.2 / beta 通道）或 start（0.2.0-rc.2 / 稳定通道）之一，已安装的 harness 两个都没有提供',
  // The workspace. A card runs in the directory the user picked for it and nowhere else:
  // no default, no inference from the session, and no free-text path.
  skillCardProblemWorkspaceMissing: '这张卡还没有选择工作目录，先选一个目录再运行',
  skillCardProblemWorkspaceInvalid: '工作目录不存在或不是文件夹',
  skillCardWorkspace: '工作目录',
  skillCardWorkspaceNotSet: '未选择',
  skillCardChooseDirectory: '选择目录',
  skillCardWorkspacePickerUnavailable: '这个环境没有目录选择器，无法选择工作目录',
  skillCardProblemTooLarge: '模板超出体积上限',
  skillCardProblemUnavailable: '暂时读不到这张卡的状态',
  skillCardProblemGeneric: '这张卡暂时不可用',
  skillCardSettings: '配置',
  skillCardSelectSkill: '选择 skill',
  skillCardSelectPlaceholder: '未选择',
  skillCardCatalogLoading: '正在读取 skill 列表…',
  skillCardCatalogFailed: '读不到 skill 列表',
  skillCardCatalogEmpty: '这个会话没有可用的 skill',
  skillCardNoSession: '读不到已安装的 skill：应用里还没有活的会话。先打开一个会话，再回来选 skill。',
  skillCardTemplateLabel: '模板',
  skillCardTemplateSizeUnit: '字节',
  skillCardTemplateDirty: '有未保存的改动',
  // The three facts on the editor's status line: where the region is, what the
  // template declares, and how much of the size budget it uses.
  skillCardRegionRange: '区间 {start}–{end}',
  skillCardRegionMissing: '区间缺失',
  skillCardActionsCount: '动作声明 {count} 条',
  skillCardInsertMarkers: '插入标记',
  skillCardInsertSkeleton: '插入骨架',
  // The starter document. Its prose is an instruction a child agent follows, so it is
  // translated; the markup around it is the example and stays as written.
  skillCardSkeletonHeading: '任务',
  skillCardSkeletonWhat: '在这里生成要显示的内容：一行一个条目，字段按这张卡要展示的东西来定。',
  skillCardSkeletonExample: '需要按钮时写在同一行里（动作键取上方 dsh-actions 块里声明过的键）：<li>CP-2025-001 登录模块联调 <button type="button" data-dsh-action="finish" data-dsh-row=\'{"task_number":"CP-2025-001"}\'>完成</button></li>',
  skillCardSkeletonQuote: 'data-dsh-row 用单引号包住，值里的单引号必须写成 &#39;，否则属性会断开、这次点击会被拒绝。',
  // The declaration builder. It exists because the block is the one place a user must
  // otherwise memorise exact syntax, and a wrong key only fails at click time.
  skillCardAddAction: '添加动作',
  skillCardActionKey: '动作键',
  skillCardActionKeyHint: '字母、数字、下划线或短横线，1–32 个字符',
  skillCardActionKeyTaken: '这个动作键已经被声明过了',
  skillCardActionKind: '类型',
  skillCardActionKindCard: '卡片',
  skillCardActionKindSkill: 'skill',
  skillCardActionTarget: '目标',
  skillCardActionNoCards: '还没有可以指向的卡片。先建一张卡片，再回来添加这个动作。',
  // A declared target that no longer exists is reported, not refused: the card may be
  // created (or the skill installed) after the declaration is written.
  skillCardActionCardTargetMissing: '动作 {key} 指向的卡片不存在：{name}',
  skillCardActionSkillTargetMissing: '动作 {key} 指向的 skill 不存在或不能被调用：{name}',
  // The three groups of the configuration page.
  skillCardSectionBasics: '基本信息',
  skillCardPreviewSample: '骨架预览，区间尚未填充',
  skillCardPreviewLive: '按当前模板渲染',
  // Removing a card is not a partial edit, so it is confirmed in place rather than
  // carried out on the first press.
  skillCardDeleteConfirm: '确认删除',
  skillCardDeleteConfirmPrompt: '删除后无法撤销，确认删除这张卡片？',
  skillCardTemplatePlaceholder: '用 HTML 写这张卡的样子，用 <!-- template-begin --> 与 <!-- template-end --> 标出要填数据的位置，并在注释里写明填写要求',
  skillCardPreview: '预览',
  skillCardSave: '保存',
  skillCardClose: '关闭',
  // The template's own script is allowed and runs; the region's is not, because the region is
  // model output. One code, one sentence, naming the half it applies to.
  skillCardViolationScript: '区间内容里不允许 script 标签',
  skillCardViolationEvent: '不允许事件属性',
  skillCardViolationUrl: '不允许这种 URL 协议',
  skillCardViolationExternal: '不允许会联网加载的元素',
  skillCardViolationCss: '不允许外部 CSS 引用',
  skillCardViolationRegionMissing: '模板缺少 template-begin / template-end 标记',
  skillCardViolationRegionUnclosed: '区间标记没有成对出现',
  skillCardViolationRegionRepeated: '只支持一对区间标记',
  skillCardViolationPlaceholder: '占位符语法已移除，请改用区间标记，并在注释里写明填写要求',
  skillCardViolationActionDuplicate: '动作声明只能有一处',
  skillCardViolationActionKey: '动作键不合法（字母、数字、下划线、短横线，1–32 字符）',
  skillCardViolationActionKeyRepeated: '这个动作键被声明了两次',
  skillCardViolationActionTarget: '动作目标必须写成 card "名称" 或 skill "名称"',
  skillCardViolationActionInsideRegion: '动作声明不能写在区间内——区间每次运行都会被重写',
  // The per-card permission mode. The three labels are the ones the application's own
  // permission selector uses; the warning states the one loss full access causes.
  skillCardPermissionLabel: '权限模式',
  skillCardPermissionReadOnly: '仅可查看',
  skillCardPermissionWorkspaceWrite: '工作区内修改',
  skillCardPermissionFullAccess: '完全权限',
  skillCardPermissionWarning: '完全权限：工作目录不再限制写入，这个 skill 可以修改工作目录以外的文件。',
  skillCardProblemPermissionUnavailable: '这张卡要求的权限模式无法应用，运行已拒绝',
  // The per-card instruction mode. The three labels are the choice itself, and the note
  // states what the mode governs so the setting is not mistaken for a stored prompt.
  skillCardInstructionLabel: '运行指令',
  skillCardInstructionNone: '不需要',
  skillCardInstructionOptional: '可选',
  skillCardInstructionRequired: '必须',
  skillCardInstructionNote: '运行时是否要先写一句指令。选「必须」时，没有指令不会开始运行。',
  skillCardProblemInstructionMissing: '这张卡需要一句指令才能运行',
  skillCardBack: '返回',
  skillCardCardName: '卡片名称',
  // The model field. Its two non-selectable states say what the card knows: a route it
  // cannot offer, and the case where there is no model to run on at all.
  skillCardModel: '模型',
  skillCardModelUnavailable: '没有可用的模型，这张卡暂时不能运行',
  skillCardProblemModelUnavailable: '这张卡指定的模型已经不可用',
  skillCardNamePlaceholder: '给这张卡起个名字',
  createCard: '创建卡片',
  createCardCancel: '取消',
  cardTypeSkill: '技能卡片',
  cardTypeTest: '测试卡片',
  cardTypeMemory: '记忆卡片',
  skillCardDelete: '删除卡片',
  removeCard: '删除卡片',
  // The one state word the page still says in words: the in-flight notice that replaces
  // the document. Every other state is what the content itself shows.
  runStatusRunning: '运行中',
  // Editing a stored result by hand: the entry in the result head, the field, and the two
  // reasons an edit cannot be stored. The empty one names the way out — run the card again
  // — because an empty region renders as a broken-looking card rather than as nothing.
  skillCardResultEdit: '编辑',
  resultEditLabel: '结果内容',
  resultEditPlaceholder: '这里是这段区间的 HTML：改完保存，它就是这张卡的结果',
  resultEditEmpty: '结果为空，没有可保存的内容。这张卡可以再运行一次，也可以在这里直接填入区间 HTML。',
  resultEditTooLarge: '内容有 {bytes} 字节，超过 {max} 字节上限，未保存。',
  // The run's activity stream: the tool calls and the model's own words below, the local
  // clock on a running card, the one line that admits a bounded trace dropped entries, and
  // the settled turn-process header's outcome words.
  runElapsed: '用时',
  runActivityTruncated: '之前还有 {dropped} 条已省略',
  runActivityReasoning: '思考',
  runActivityArgument: '参数',
  runActivityCompleted: '已完成',
  runActivityStopped: '已停止',
  runActivityFailed: '已失败',
  // How much the fold is hiding. The outcome word alone gave no reason to open it.
  runActivitySteps: '{count} 步',
  // The run-history page: the list every card opens on, one row per completed run. The
  // count states how much history the card holds next to the empty state, and a row shows
  // the run's own outcome word — the live page's words reused, so the list and the detail
  // never disagree about what a run became.
  runHistoryTitle: '运行记录',
  runHistoryCount: '共 {count} 次运行',
  runHistoryEmpty: '这张卡还没有运行过，点右上角运行一次吧。',
  runHistoryEdited: '已编辑',
  // A run whose record holds no region content: it ran, and stored nothing a row can
  // headline. Said in the row's first line rather than left blank, because a row with only
  // its clock reads as a row that failed to load rather than a run with nothing to say.
  runHistoryNoContent: '本次没有产出内容',
  // The list is grouped by the day a run completed on, so the day is stated once per
  // group and the rows below it carry only the clock: two runs six days apart are not
  // distinguishable by two identical clock readings.
  runHistoryDayToday: '今天',
  runHistoryDayYesterday: '昨天',
  runHistoryOrdinal: '第 {n} 次',
  runHistoryLatest: '最近 {time}',
  // The row of the run in flight: a record the controller builds while the host has not
  // stored anything yet, so it is named here rather than pretending a run stored it.
  runHistoryRunning: '运行中',
  // The instruction a run was given, on its history row. The row states it in one line so
  // two runs of the same card are distinguishable; the value is the user's own text, never
  // summarized, because a summary would be a second description of the ask.
  runHistoryInstruction: '指令：{text}',
  // The run bar: one composer beside the run control. `required` names what is missing when
  // the control is pressed empty — the control itself never disables over an empty field,
  // because a disabled button explains nothing.
  runInstructionPlaceholderRequired: '这次要做什么？',
  runInstructionPlaceholderOptional: '补充一句指令，留空直接运行',
  runInstructionRequired: '这个技能需要一句指令才能运行',
  runInstructionRecent: '最近用过',
  runInstructionField: '运行指令',
  skillCardRunningBody: '技能正在执行，完成后结果会显示在这里。',
  // The composer that revises the result. Both the log and the kept version live in
  // memory, and the note says so — otherwise their disappearance on reload reads as a
  // bug rather than as the accepted cost.
  // The selector that states the three ways this result can change, plus the group's own
  // name for a screen reader. The labels are short because they sit side by side in one
  // control, and they are verbs because each one is what happens when it is chosen.
  resultChangeLabel: '怎么改这份结果',
  resultReviseMode: '在上一版上改',
  resultFreshMode: '从头跑',
  // Why the block is a bare control for a card whose skill takes no instruction: the field
  // is absent because there is nothing it could say, not because something failed to load.
  resultFreshNoInstruction: '这张卡不需要说明，直接按当前工作区重新跑一遍。',
  refinePlaceholder: '说明要改哪里，例如「按时间倒序」',
  refineAction: '重新生成',
  refineStop: '停止',
  // The log's header, which states how many revisions it holds in a count rather than a
  // sentence, and stands beside the one step back it makes possible.
  refineLogCount: '修改记录 · {count} 次',
  refineSessionOnly: '修改记录与上一版只保留在本次会话里，重新加载就没了。',
  refineUndo: '回到上一版',
  // The in-place confirmation panel. It is a safety control, not a convenience: the
  // parameters it shows came from a model and go straight into a run.
  actionPanelTitle: '确认这次执行',
  actionFieldTarget: '目标',
  actionFieldSkill: '将运行的 skill',
  actionFieldPayload: '参数',
  actionTargetCard: '卡片：{name}',
  actionTargetSkill: 'skill：{name}',
  actionConfirm: '确认',
  actionCancel: '取消',
  actionCandidates: '可选：{names}',
  actionProblemMissingAction: '按钮没有带动作键，已拒绝执行',
  actionProblemMissingPayload: '这一行没有携带数据，将把当前卡片的内容传给目标',
  actionProblemMalformedPayload: '这一行的数据读不出来，已拒绝执行',
  actionProblemOversizedPayload: '这一行的数据超出体积上限，已拒绝执行',
  actionProblemUnknownAction: '模板没有声明这个动作键，已拒绝执行',
  actionProblemCardMissing: '找不到这个名称对应的卡片',
  actionProblemCardAmbiguous: '有多张同名卡片，无法确定目标',
  actionProblemSkillMissing: '找不到这个名称对应的 skill',
  actionProblemBusy: '目标卡片正在运行，等它结束再试',
  actionProblemUnavailable: '目标现在不能运行',
  // A skill target's whole result: whether it worked, and why not.
  bareRunRunning: '正在执行 skill {skill}',
  bareRunDone: 'skill 执行完成',
  bareRunFailed: 'skill 执行失败',
  // A card's own script reads the files a run wrote. These sentences are what that script
  // shows when a read is refused: each one names a fact about a path, so the reader can act
  // on it instead of reading a stack trace in a card.
  documentProblemForbidden: '浏览器拒绝了这次读取',
  documentProblemPath: '这个路径不能用',
  documentProblemCard: '这张卡片已经不存在了',
  documentProblemNoWorkspace: '这张卡片还没有设置目录',
  documentProblemOutside: '这个路径不在卡片的目录里',
  documentProblemNotFound: '这个文件或目录已经不在了',
  documentProblemNotDirectory: '这个路径不是目录',
  documentProblemNotFile: '这个路径不是文件',
  documentProblemNotText: '这个文件不是文本，无法显示',
  documentProblemTooLarge: '这个文件太大，无法显示',
  documentProblemUnreachable: '读不到卡片目录',
  documentProblemUnreadable: '读取结果无法识别',
  // The Markdown renderer's own chrome, which a document reader carries like any other.
  documentCopy: '复制',
  documentCopied: '已复制',
  documentFootnotes: '脚注',
}

/** English dictionary; the annotation keeps both dictionaries on one key set. */
export const en: Record<keyof typeof zh, string> = {
  panel: 'Workbench',
  title: 'Workbench',
  subtitle: 'Git, agent, and test status on one page',
  refreshAll: 'Refresh',
  // The grid is never empty: the creation entry is always in it, so there is no
  // empty state to describe, and hiding is not a capability at all.
  dragHandle: 'Drag to reorder',
  announceMoved: '{title} moved to position {index}',
  writeFailed: 'The layout could not be saved',
  mergedElsewhere: 'Another window changed the layout too; the two were merged',
  cardFailed: 'This card is unavailable right now',
  statusIdle: 'Idle',
  statusOngoing: 'Running',
  statusDone: 'Done',
  statusWarning: 'Attention',
  statusError: 'Failed',
  skillCardTitle: 'Skill card',
  skillCardRun: 'Run',
  skillCardCancel: 'Cancel',
  skillCardLoading: 'Loading',
  skillCardLoadingBody: 'Reading this card’s configuration and last result.',
  skillCardNoTemplateTitle: 'No template yet',
  skillCardNoTemplateBody: 'This card needs an HTML template for the selected skill before it can run.',
  skillCardNotRunTitle: 'Not run yet',
  skillCardNotRunBody: 'Run to let the skill execute once.',
  skillCardResultFailedTitle: 'This run produced no content',
  skillCardResultTimeoutTitle: 'This run timed out',
  skillCardProblemNotConfigured: 'No skill selected yet',
  skillCardProblemNoTemplate: 'This skill has no template',
  skillCardProblemNoSession: 'No session is available',
  skillCardProblemSkillMissing: 'That skill is no longer available',
  skillCardProblemProvider: 'The configured subagent backend cannot return structured output',
  skillCardProblemContract: 'The output contract is not valid',
  skillCardProblemTemplateInvalid: 'The template is not valid',
  skillCardProblemRunning: 'Another run is already in flight',
  skillCardProblemRunFailed: 'The run produced no usable result',
  skillCardProblemRunTimeout: 'This run passed its time limit and the host stopped it; running it again is the next step',
  // The card itself is fine: the harness under it is missing every seam a run needs.
  skillCardProblemRunUnavailable: 'This harness cannot run cards: a card run needs one of startActivation (0.2.1-alpha.2, the beta channel) or start (0.2.0-rc.2, the stable channel), and the installed harness provides neither',
  // The workspace. A card runs in the directory the user picked for it and nowhere else:
  // no default, no inference from the session, and no free-text path.
  skillCardProblemWorkspaceMissing: 'No workspace directory is selected for this card; choose one before running',
  skillCardProblemWorkspaceInvalid: 'The workspace directory does not exist or is not a folder',
  skillCardWorkspace: 'Workspace',
  skillCardWorkspaceNotSet: 'Not selected',
  skillCardChooseDirectory: 'Choose directory',
  skillCardWorkspacePickerUnavailable: 'This environment has no directory picker, so a workspace cannot be chosen',
  skillCardProblemTooLarge: 'The template is above the size limit',
  skillCardProblemUnavailable: 'This card’s state cannot be read right now',
  skillCardProblemGeneric: 'This card is unavailable right now',
  skillCardSettings: 'Configure',
  skillCardSelectSkill: 'Skill',
  skillCardSelectPlaceholder: 'Not selected',
  skillCardCatalogLoading: 'Reading the skill list…',
  skillCardCatalogFailed: 'The skill list could not be read',
  skillCardCatalogEmpty: 'This session has no invocable skills',
  skillCardNoSession: 'Cannot read the installed skills: no session is live yet. Open one, then pick a skill.',
  skillCardTemplateLabel: 'Template',
  skillCardTemplateSizeUnit: 'bytes',
  skillCardTemplateDirty: 'unsaved changes',
  // The three facts on the editor's status line: where the region is, what the
  // template declares, and how much of the size budget it uses.
  skillCardRegionRange: 'region {start}–{end}',
  skillCardRegionMissing: 'no region',
  skillCardActionsCount: '{count} actions',
  skillCardInsertMarkers: 'insert markers',
  skillCardInsertSkeleton: 'insert skeleton',
  // The starter document. Its prose is an instruction a child agent follows, so it is
  // translated; the markup around it is the example and stays as written.
  skillCardSkeletonHeading: 'Tasks',
  skillCardSkeletonWhat: 'Generate what this card should show here: one entry per row, with the fields this card needs.',
  skillCardSkeletonExample: 'A row that needs a button carries it inline (the key comes from the dsh-actions block above): <li>CP-2025-001 Sign-in flow <button type="button" data-dsh-action="finish" data-dsh-row=\'{"task_number":"CP-2025-001"}\'>Finish</button></li>',
  skillCardSkeletonQuote: 'data-dsh-row is wrapped in single quotes, so a quote inside a value must be written &#39;; otherwise the attribute breaks and the click is refused.',
  // The declaration builder. It exists because the block is the one place a user must
  // otherwise memorise exact syntax, and a wrong key only fails at click time.
  skillCardAddAction: 'Add action',
  skillCardActionKey: 'Action key',
  skillCardActionKeyHint: 'letters, digits, underscores or dashes, 1–32 characters',
  skillCardActionKeyTaken: 'That action key is already declared',
  skillCardActionKind: 'Type',
  skillCardActionKindCard: 'Card',
  skillCardActionKindSkill: 'Skill',
  skillCardActionTarget: 'Target',
  skillCardActionNoCards: 'There is no other card to point at yet. Create one, then add this action.',
  // A declared target that no longer exists is reported, not refused: the card may be
  // created (or the skill installed) after the declaration is written.
  skillCardActionCardTargetMissing: 'Action {key} points at a card that does not exist: {name}',
  skillCardActionSkillTargetMissing: 'Action {key} points at a skill that is not installed or cannot be invoked: {name}',
  // The three groups of the configuration page.
  skillCardSectionBasics: 'Basics',
  skillCardPreviewSample: 'Skeleton preview, the region is not filled yet',
  skillCardPreviewLive: 'Rendered from the current template',
  // Removing a card is not a partial edit, so it is confirmed in place rather than
  // carried out on the first press.
  skillCardDeleteConfirm: 'Confirm delete',
  skillCardDeleteConfirmPrompt: 'This cannot be undone. Delete this card?',
  skillCardTemplatePlaceholder: 'Write this card’s HTML, marking the data region with <!-- template-begin --> and <!-- template-end -->, and say what to fill in the comments',
  skillCardPreview: 'Preview',
  skillCardSave: 'Save',
  skillCardClose: 'Close',
  skillCardViolationScript: 'script elements are not allowed inside the region',
  skillCardViolationEvent: 'event attributes are not allowed',
  skillCardViolationUrl: 'that URL scheme is not allowed',
  skillCardViolationExternal: 'elements that load over the network are not allowed',
  skillCardViolationCss: 'external CSS references are not allowed',
  skillCardViolationRegionMissing: 'the template has no template-begin / template-end markers',
  skillCardViolationRegionUnclosed: 'the region markers are not a pair',
  skillCardViolationRegionRepeated: 'only one pair of region markers is supported',
  skillCardViolationPlaceholder: 'placeholder syntax was removed; use region markers and say what to fill in the comments',
  skillCardViolationActionDuplicate: 'a template may declare its actions only once',
  skillCardViolationActionKey: 'an action key must be 1–32 letters, digits, underscores or dashes',
  skillCardViolationActionKeyRepeated: 'that action key is declared twice',
  skillCardViolationActionTarget: 'an action target must read card "name" or skill "name"',
  skillCardViolationActionInsideRegion: 'declare actions outside the region: the region is rewritten on every run',
  // The per-card permission mode. The three labels are the ones the application's own
  // permission selector uses; the warning states the one loss full access causes.
  skillCardPermissionLabel: 'Permission',
  skillCardPermissionReadOnly: 'Read Only',
  skillCardPermissionWorkspaceWrite: 'Workspace Write',
  skillCardPermissionFullAccess: 'Full access',
  skillCardPermissionWarning: 'Full access: the workspace no longer limits writes, so this skill can change files outside it.',
  skillCardProblemPermissionUnavailable: 'This card’s permission mode could not be applied, so the run was refused',
  // The per-card instruction mode. The note states what the mode governs, so the setting is
  // not mistaken for a stored prompt.
  skillCardInstructionLabel: 'Run instruction',
  skillCardInstructionNone: 'Not needed',
  skillCardInstructionOptional: 'Optional',
  skillCardInstructionRequired: 'Required',
  skillCardInstructionNote: 'Whether a run needs a sentence first. On Required, a run will not start without one.',
  skillCardProblemInstructionMissing: 'This card needs an instruction before it can run',
  skillCardBack: 'Back',
  skillCardCardName: 'Card name',
  // The model field. Its two non-selectable states say what the card knows: a route it
  // cannot offer, and the case where there is no model to run on at all.
  skillCardModel: 'Model',
  skillCardModelUnavailable: 'No model is available, so this card cannot run',
  skillCardProblemModelUnavailable: 'The model this card names is no longer available',
  skillCardNamePlaceholder: 'Name this card',
  createCard: 'Create card',
  createCardCancel: 'Cancel',
  cardTypeSkill: 'Skill card',
  cardTypeTest: 'Test card',
  cardTypeMemory: 'Memory card',
  skillCardDelete: 'Delete card',
  removeCard: 'Delete card',
  // The one state word the page still says in words: the in-flight notice that replaces
  // the document. Every other state is what the content itself shows.
  runStatusRunning: 'Running',
  // Editing a stored result by hand: the entry in the result head, the field, and the two
  // reasons an edit cannot be stored. The empty one names the way out — run the card again
  // — because an empty region renders as a broken-looking card rather than as nothing.
  skillCardResultEdit: 'Edit',
  resultEditLabel: 'Result content',
  resultEditPlaceholder: 'The region’s HTML: saving it becomes this card’s result',
  resultEditEmpty: 'The result is empty, so there is nothing to save. Run this card again, or type the region HTML here.',
  resultEditTooLarge: 'The content is {bytes} bytes, over the {max}-byte limit, so nothing was saved.',
  // The run's activity stream: the tool calls and the model's own words below, the local
  // clock on a running card, the one line that admits a bounded trace dropped entries, and
  // the settled turn-process header's outcome words.
  runElapsed: 'Elapsed',
  runActivityTruncated: '{dropped} earlier entries omitted',
  runActivityReasoning: 'Thinking',
  runActivityArgument: 'Arguments',
  runActivityCompleted: 'Completed',
  runActivityStopped: 'Stopped',
  runActivitySteps: '{count} steps',
  runActivityFailed: 'Failed',
  // The run-history page: the list every card opens on, one row per completed run.
  runHistoryTitle: 'Run history',
  runHistoryCount: '{count} runs',
  runHistoryEmpty: 'This card has not run yet. Use the run control above to run it.',
  runHistoryEdited: 'Edited',
  runHistoryNoContent: 'This run produced nothing',
  runHistoryDayToday: 'Today',
  runHistoryDayYesterday: 'Yesterday',
  runHistoryOrdinal: 'Run {n}',
  runHistoryLatest: 'latest {time}',
  runHistoryRunning: 'Running',
  // The instruction a run was given, on its history row: one line, so two runs of one card
  // are distinguishable.
  runHistoryInstruction: 'Instruction: {text}',
  // The run bar: one composer beside the run control. The required message names what is
  // missing when the control is pressed empty; the control itself never disables over an
  // empty field.
  runInstructionPlaceholderRequired: 'What should this run do?',
  runInstructionPlaceholderOptional: 'Add an instruction, or leave it empty to run',
  runInstructionRequired: 'This skill needs an instruction before it can run',
  runInstructionRecent: 'Recent',
  runInstructionField: 'Run instruction',
  skillCardRunningBody: 'The skill is executing. Its result appears here when it finishes.',
  // The composer that revises the result. Both the log and the kept version live in
  // memory, and the note says so — otherwise their disappearance on reload reads as a
  // bug rather than as the accepted cost.
  resultChangeLabel: 'How to change this result',
  resultReviseMode: 'Revise this version',
  resultFreshMode: 'Run from scratch',
  resultFreshNoInstruction: 'This skill takes no instruction — running it again uses the workspace as it is.',
  refinePlaceholder: 'Say what to change, e.g. “newest first”',
  refineAction: 'Regenerate',
  refineStop: 'Stop',
  // The log's header, which states how many revisions it holds in a count rather than a
  // sentence, and stands beside the one step back it makes possible.
  refineLogCount: 'Revision log · {count}',
  refineSessionOnly: 'The revision log and the previous version are kept only for this session; a reload clears them.',
  refineUndo: 'Back to previous',
  // The in-place confirmation panel. It is a safety control, not a convenience: the
  // parameters it shows came from a model and go straight into a run.
  actionPanelTitle: 'Confirm this run',
  actionFieldTarget: 'Target',
  actionFieldSkill: 'Skill that will run',
  actionFieldPayload: 'Parameters',
  actionTargetCard: 'Card: {name}',
  actionTargetSkill: 'Skill: {name}',
  actionConfirm: 'Confirm',
  actionCancel: 'Cancel',
  actionCandidates: 'Choices: {names}',
  actionProblemMissingAction: 'The button carried no action key, so nothing ran',
  actionProblemMissingPayload: 'This row carried no data; the current card’s content goes to the target instead',
  actionProblemMalformedPayload: 'This row’s data could not be read whole, so nothing ran',
  actionProblemOversizedPayload: 'This row’s data is over the size limit, so nothing ran',
  actionProblemUnknownAction: 'The template does not declare this action key, so nothing ran',
  actionProblemCardMissing: 'No card has that name',
  actionProblemCardAmbiguous: 'More than one card has that name, so the target is ambiguous',
  actionProblemSkillMissing: 'No installed skill has that name',
  actionProblemBusy: 'The target card is already running; try again when it finishes',
  actionProblemUnavailable: 'That target cannot run right now',
  // A skill target's whole result: whether it worked, and why not.
  bareRunRunning: 'Running skill {skill}',
  bareRunDone: 'The skill finished',
  bareRunFailed: 'The skill failed',
  // A card's own script reads the files a run wrote; these are the refusals it can show.
  documentProblemForbidden: 'The browser refused this read',
  documentProblemPath: 'That path cannot be used',
  documentProblemCard: 'This card no longer exists',
  documentProblemNoWorkspace: 'This card has no directory yet',
  documentProblemOutside: 'That path is outside the card’s directory',
  documentProblemNotFound: 'That file or directory is gone',
  documentProblemNotDirectory: 'That path is not a directory',
  documentProblemNotFile: 'That path is not a file',
  documentProblemNotText: 'That file is not text, so it cannot be shown',
  documentProblemTooLarge: 'That file is too large to show',
  documentProblemUnreachable: 'The card’s directory cannot be reached',
  documentProblemUnreadable: 'The answer could not be read',
  // The Markdown renderer's own chrome, which a document reader carries like any other.
  documentCopy: 'Copy',
  documentCopied: 'Copied',
  documentFootnotes: 'Footnotes',
}

/** Key union of the `workbench` namespace. */
export type WorkbenchLocaleKey = keyof typeof zh
