# dsh-workbench 2.6.3

## 这一版改了什么

**面板的类名不再经过哈希，配色改成按墨色调浓度。** 界面本身没有重画：结构、间距、断点仍是原型 `docs/prototypes/workbench-pipeline-v2.html` 的逐条移植，改的是「样式怎么会丢」这件事。

上一版重启后出现过两种现象：检查器与画布之间的竖线、面板头的下边线这些该在的线在；但画布头的左内边距、空态虚线框的内缩不见了，底部运行条也不见了。用真实 Chrome 把同一份 DOM + 同一份样式表渲染出来（定宽 1263×634 的宿主列、`getBoundingClientRect` 读盒子、`--screenshot` 出图）是**完全正常**的：面板头 58、画布 312、运行条 46 且始终在可视区内。也就是说数值没问题，问题在「元素身上的类名」和「样式表里的选择器」有没有对上。

- **类名改成字面量**：`pipeline.module.css` → `pipeline.css`，全部加 `wb-` 前缀；新增 `pipeline-classes.ts` 导出 `{ canvasHead: 'wb-canvasHead', … }`，组件照样写 `css.canvasHead`，但 DOM 里出现的就是 `.wb-canvasHead`，和样式表一字不差。CSS Modules 的哈希名一旦与样式表失配（换构建、缓存了旧样式表、样式被当成独立文件而版本没对齐），元素会带着一个没人应答的类名渲染——**静默地少掉 padding、少掉高度**，控制台一个字都没有。字面量名让这种失配不可能发生，代价是前缀命名空间要自己维护（188 个类，全表在 `pipeline-classes.ts` 里）。
- **分隔线按墨色算，不再用宿主的边框令牌**：浅色主题下 `-border-l1` 只有约 2% 的黑（`#f5f5f5`），在白底上等于没有线。`--hairline`/`--divider`/`--idle`/`--scroll`/`--recess` 改成 `color-mix(in srgb, var(--dsw-alias-label-primary) N%, transparent)`，浓度照原型的 `rgba(0,0,0,.1)`、`.08`、`#d4d4d4`、`#dcdcdc`、`#f9fafb` 复刻，深浅主题自动成立。
- **`--pane` 回到白**：原型里画布、检查器、运行条同为白，两栏之间只靠一条竖线分界。此前把 `--pane` 映射到 `-bg-layer-2` 给检查器垫了一层灰，是偏离原型的，已改回 `-bg-base`。
- 顺手清掉三处死代码：`#zoomWrap` 的层级覆盖（阅读器与运行记录不同时出现）、`#histBack svg` 改成 `.wb-histBack`（那一版原型用 id，插件用类名）、`*.module.css` 之外补一条 `declare module '*.css'`。

## 装法

```powershell
$stage = Join-Path $env:TEMP 'wb-stage-263'
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
tar -xzf F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.6.3.tgz -C $stage

$target = 'C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web\node_modules\dsh-workbench'
robocopy (Join-Path $stage 'package') $target /MIR
Copy-Item (Join-Path $stage 'package\package.json') (Join-Path $target 'package.json') -Force
```

profile 的 `package.json` 指向 `dsh-workbench-2.6.3.tgz`，装完**整个退出** DSH Desktop 再重开，`Ctrl+F5`。

## 怎么验

1. 打开工作台：最上面一条是面板头（工作台 + 新建流水线 + 运行），下面左画布右检查器，**最下面一条运行条要在**（写着「还没有步骤」或分段条 + 阶段文案）。
2. 画布头的「流水线」不该贴着窗口左边缘，应有约 14px 内缩；空态虚线框也不该顶到画布两边。
3. 检查器与画布之间要有能看见的竖线；面板头下面、运行条上面各有一条。
4. 建两步、跑一遍：节点序号/耗时、检查器三个页签、结果页预览与源码；不满意就「重新生成」。
5. 若第 2、3 条仍然不成立，说明不是样式表的事：请把面板宽度和一张开发工具的截图发我，不要再靠猜。

## 回归

`corepack yarn workspace dsh-workbench check` 全绿：typecheck 4 份 tsconfig 全 0；`vitest` 1014 passed / 3 skipped；build 0；`verify:artifacts` 干净。构建产物 `lib/dsh-workbench.css` 139.61 kB、`lib/client.js` 484.37 kB（CSS 内联进 client 工厂，134649 字符）。

视觉核对方法（本轮新增，写进设计文档 §9.1）：临时 vitest 用例把真实组件挂到 jsdom 上导出无哈希 HTML → 与两份样式表 + DSH 令牌桩拼成一页 → headless Chrome `--screenshot` 看图、`--dump-dom` + `getBoundingClientRect()` 读盒子 → 几个断点宽度各跑一遍。临时用例与图片不入库。
