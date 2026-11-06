# dsh-workbench 2.6.2 安装说明

在 2.6.1 逐条移植原型的基础上，补齐了面板这一层：原型的面板头（标题 + 两个动作）、
两栏的深浅分界，以及让运行条永远留在屏幕里。

## 装到 DSH Desktop（profile `web`）

```powershell
$profile = "$env:APPDATA\dsh-desktop\harness\profiles\web"
(Get-Content "$profile\package.json" -Raw).Replace(
  'dsh-workbench-2.6.1.tgz', 'dsh-workbench-2.6.2.tgz'
) | Set-Content "$profile\package.json" -NoNewline -Encoding utf8

cd $profile
pnpm install --prefer-offline
```

装完**退出 DSH Desktop 再打开**，然后 `Ctrl+F5`。插件包不热替换。

## 这一版改了什么

1. **面板头归插件自己画**：`工作台` + `新建流水线` + `运行`，58px，和原型 `header.panelHead`
   一模一样；流水线下不再叠一层页面标题。
2. **运行条不再掉到折叠线以下**：宿主给的那一列用 `grid-template-rows: minmax(0, 1fr)`
   给死高度，面板内部再按 `flex` 分配，画布和检查器各自滚动，运行条固定贴底。
3. **两栏有分界**：`--pane` 从 `bg-base` 改到 `bg-layer-1`，检查器和运行条比画布低一层，
   不再是两张并在一起的白纸。
4. **空状态只给一个入口**：没流水线 → 画布上「新建流水线」；流水线没步骤 → 画布上
   「添加第一个步骤」。检查器里不再重复第二个同样的按钮，标题也不再和空状态文案重复。

## 验证

```powershell
cd F:\git\Personal-Workbench
corepack yarn workspace dsh-workbench check
```

`check` = 四套 tsconfig 类型检查 + vitest（1014 passed / 3 skipped / 1 env-flaky 用例在
满载时会超时，单独跑通过）+ 构建 + `verify:artifacts`。
