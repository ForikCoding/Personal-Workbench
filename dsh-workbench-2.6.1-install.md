# dsh-workbench 2.6.1 安装说明

这一版把流水线工作台按 `docs/prototypes/workbench-pipeline-v2.html` 逐条移植，界面与原型对齐。

## 装到 DSH Desktop（profile `web`）

```powershell
$profile = "$env:APPDATA\dsh-desktop\harness\profiles\web"
# 1. 把 profile 的依赖指向这个包
(Get-Content "$profile\package.json" -Raw).Replace(
  'dsh-workbench-2.6.0.tgz', 'dsh-workbench-2.6.1.tgz'
) | Set-Content "$profile\package.json" -NoNewline -Encoding utf8

# 2. 重装
cd $profile
pnpm install --prefer-offline
```

装完**退出 DSH Desktop 再打开**（插件包不会热替换），然后 `Ctrl+F5` 刷新界面。

## 这一版改了什么

- 删除左侧轨道：流水线列表、单任务列表、新建/重命名/删除都在画布标题的下拉菜单里，与原型一致。
- 画布 280px + 检查器占满余量，两栏之间一条 0.5px 分隔线；运行条通栏在底部。
- 样式改为逐条取自原型（`src/client/pipeline.module.css`），只把原型的两套固定色板换成 DSH 令牌，因此跟随 DSH 的明暗主题。
- 新增「重新生成」：结果页与阅读器里都能写一句要求，让这一步重跑。
- 页面框架去掉左右留白，面板自己铺满；页面头保留工作台标题，补一条下边线。

## 验证

```powershell
cd F:\git\Personal-Workbench
corepack yarn workspace dsh-workbench check
```

`check` = 四套 tsconfig 类型检查 + vitest（1015 passed / 3 skipped）+ 构建 + `verify:artifacts`。
