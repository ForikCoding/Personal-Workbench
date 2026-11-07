# dsh-workbench 2.8.2

## 源码可编辑，预览是模板自己的渲染

### 源码

一个编辑框，字和原型里那份 `.docSrc` 一模一样：等宽字体、11px / 17px 行高、`var(--recess)` 底色、0.5px 边框、圆角 10px、字色 `var(--ink2)`。改完失焦就写进这张卡片（`{ skill, html }`，模板跟技能绑在一起）。写不进去出红字，不会沉默。

### 预览

原来预览只是画一个「区域内容」的占位框——那是文字，不是模板的样子。现在预览把**模板本身渲染出来**：版式、字体、颜色都来自模板自己的 `<style>`，只有"模型这次要写的那一段"换成占位块（虚线框 + 「区域内容 · 运行时由模型生成」）。上面那行「模板预览 · 不含本次产物」保留。

渲染走的是插件里已有的 `ShadowHtml`（shadow root，模板的 CSS 出不来）+ `filledTemplate`（把区域替换掉，脚本会被剥掉）。所以卡片带着工作台的 `--dsw-*` 变量，预览用的就是真实配色，不是近似值。

### 原型

- 源码：`<textarea>`，就是那个编辑框，边打边存进这一步（`kept` 实测：切到预览再切回来内容还在）。
- 预览：沙箱 iframe 渲染模板（`sandbox=""`，模板自带 `<style>` 改不到工作台），区域放同一个占位块。iframe 里拿不到 `--dsw-*`，所以把工作台这套值照抄进文档，否则渲染出来是一片默认黑字——那就不叫"按模板样式渲染"了。

实测（headless Chrome）：预览帧存在、含占位块、保留了模板的 `<style>`、沙箱生效、高 320；源码是 `TEXTAREA`，改完内容切回预览，渲染里就是改过的内容；页面 0 报错。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-282'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.8.2.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 指向 `dsh-workbench-2.8.2.tgz`，之后**完全退出** DSH Desktop 再开。

## 怎么验

1. 配置 → 模板块 → 「源码」：等宽编辑框，直接改一句。
2. 「预览」：看到的是模板渲染出来的样子（标题、字体、配色都是模板的），中间那块虚线是区域占位。
3. 改完源码再点预览：渲染跟着变。
4. 换一步：模板是每张卡片自己的。

## 回归

`check` 全绿：typecheck 4 份 0 错、vitest **1031 passed / 3 skipped**、build 0、`verify:artifacts` 干净；`lib/client.js` 503 kB，内联 CSS 138274 字符。

用例「switches the template block between preview and source」现在断言预览帧真的装着一份文档：里面有区域占位块、原来的区域内容已经不在，并且源码框只在源码视图里出现。

改动：`WorkbenchPipeline.tsx`（`ShadowHtml` + `filledTemplate` 渲染预览、`REGION_PLACEHOLDER`）、`pipeline.css` / `pipeline-classes.ts`（预览框）、测试；原型 `docs/prototypes/workbench-pipeline-v2.html`（可编辑源码 + iframe 渲染预览）。
