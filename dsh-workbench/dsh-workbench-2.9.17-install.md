# dsh-workbench 2.9.17 安装说明

本版重排**配置页**：字段的解释不再占据控件下方，长技能说明不再把整页撑开。

## 为什么

配置页每一行原来是 `标签 + 控件 + 控件底下的整行提示`：

```
.ruleRow { display: flex; align-items: center; min-height: 46px }
.ruleValue .hint { display: block; margin-top: 5px; font-size: 11px }
```

于是**行高由注脚决定**，而不是由控件决定；提示铺满整行、11px 却和控件同权重；标签垂直居中，
在长内容旁边浮在半空。技能那一行的提示是技能的完整 description——真实的技能说明有二三百字，
于是它就是一片 4–6 行的灰墙，把工作目录和后面的控件全推出视野，模板整块掉到折叠线以下。
用户的话：**文字把空间都挤走了**。

## 改了什么

原型 `docs/prototypes/workbench-pipeline-v2.html` 已经先改并确认过，本版照它落地。

**一行三轨：标签 / 控件 / 注脚。** 注脚在控件右侧固定 16px、和控件第一行字对齐；
面板窄到放不下才折到控件下方，仍从控件那条左边缘起。行的行高只由控件决定，注脚撑不长它。
标签改成顶端对齐（`padding-top: 7px`），内容再高也不会浮在中间。

```
.wb-ruleRow   { align-items: flex-start; gap: 0 14px }
.wb-ruleLabel { flex: 0 0 84px; padding-top: 7px }
.wb-ruleBody  { flex: 1; min-width: 0 }
.wb-ruleLine  { display: flex; flex-wrap: wrap; gap: 3px 16px }
.wb-ruleNote  { flex: 1 1 200px; min-width: 150px; max-width: 300px; padding-top: 7px }
```

**控件宽度固定，注脚因此落在两条共享竖线上**：下拉 200，路径与指令 480（都带 `max-width: 100%`）。
以前 `max-width: 240/420` 是上限而不是宽度，每行长度跟着内容走，注脚也就各站各的位置。

**长技能说明不是注脚，所以不当注脚用**（`SKILL_NOTE_MAX = 60`）：一句话的说明仍然只是控件右边
一句注脚；超过这个长度就变成控件下方一块窄栏（`.wb-specNote`，`--recess` 凹面、480 宽），
两行打住、末行淡出，右下角「展开说明」就地铺开成完整段落，再点「收起」。
**成本与文字长短无关**：三百字的说明和一百字的说明占一样高。换到别的步骤时自动收起。

**注脚按值说话**：权限模式三档说的不是同一件事，以前一句「写入限制在工作目录内」对三档里的
两档都是假的；现在 `permissionNoteKey(mode)` 给出对应的一句（一个文件都不动 / 只改工作目录里的
文件 / 也能改目录以外的文件），和 `permissionLabelKey` 放在同一个模块里，新增模式会编译失败
直到两种语言都有文案。失败的注脚也改成说结果：`失败即停，后面的步骤不跑`。

**删掉的话**：模型行的「这一步没有单独指定，跟着流水线走」。下拉里已经写着「跟随会话」，
区块标题已经写着「改一次，每一步都跟着」，这句两头都重复，还和"改的是每一步"相矛盾。
那一行现在没有注脚——空着是允许的。

**没动的**：模板区块、`data-cfg-*` 钩子、写入路径。这版只改呈现与文案。

## 安装

1. **完全退出 DSH Desktop**。
2. 解包覆盖（robocopy 返回 1 正常）：

```
tar -xf dsh-workbench-2.9.17.tgz -C %TEMP%\wb-stage-2.9.17
robocopy %TEMP%\wb-stage-2.9.17\package "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench" /MIR
copy /Y %TEMP%\wb-stage-2.9.17\package\package.json "C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench\package.json"
```

3. profile 的 pin 指向 `dsh-workbench-2.9.17.tgz`。
4. 重新打开 DSH Desktop。

## 怎么验

1. 「从需求到交付」点第 2 步 → 配置：每个字段的解释都在控件右边一行，`工作目录`、`运行指令`
   的注脚在同一条竖线上，`权限模式`、`失败处理` 的在另一条上。
2. 技能那一段：两行、末行淡出，右下角「展开说明」；点开是完整段落，再点「收起」。
   切到第 3 步再切回来：收起来了。
3. 把面板拖窄（或窗口缩小）：注脚折到控件下方，仍和控件左边缘对齐。
4. 改权限模式：右边那句跟着变（工作区内修改 → 只改工作目录里的文件，只读 → 一个文件都不动）。
5. 深色主题下：凹面块、淡出、“展开说明”都还在。

配套测试：`WorkbenchPage.spec.tsx` 的
`keeps a long skill description folded until it is asked for`（长说明进 `.wb-specNote`、默认收起、
aria-expanded 跟着变、页面上不重复放一份注脚）、
`changes the permission mode for every step at once` 里新增的两条（注脚跟着取值、
旧的那句消失）、`points every step at one model` 里改成断言模型行**没有**注脚。
