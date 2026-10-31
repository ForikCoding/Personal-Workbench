# dsh-workbench 2.4.18 — 取消编辑后回到原位置：这一版不再依赖「猜对滚动容器」

## 2.4.17 为什么没生效

2.4.17 的做法是：进编辑前记下操作区在屏幕上的位置，出来时把**那个滚动容器**的 `scrollTop` 写回去。

问题在「那个滚动容器」——它是从我们页面的根节点往上找「`overflow-y: auto` 且内容比视口高」的祖先。**在真实外壳里这个容器没找到，或者找到了但不是真正在被滚动的那个**，于是写回去的数字落在了一个不动的地方，页面又是顶部。

另外还有一种可能：写对了，但文档内容比外壳晚一帧才长出来，写入时高度还不够，被浏览器夹成了 0。

## 这一版怎么做

三层，任一层成立就够：

**1. 精确恢复（保留）**：仍然按锚点算偏移并写回去，连续三帧各写一次（幂等，算的是同一段距离，不会越滚越多）。

**2. 直接向浏览器要这个块**：每一帧结束时都调用一次
```js
actBlock.scrollIntoView({ block: 'nearest', inline: 'nearest' })
```
这一步**不关心容器是谁**——`scrollIntoView` 会自己沿着真实祖先（包括门户、阴影边界里的滚动容器）把元素带进视野；而且它**已经在视野里就什么都不做**，所以精确恢复成功时它不会把页面推走。形像是「你刚才就看着这个块，那就让它重新出现在视野里」，这正是你要的效果。

**3. 120ms 后再补一次**：文档（表格、阴影 DOM）可能在这里才完全长好，那之后再算一遍 + 再要一次。

取消后还会回到你刚才选的那一种（从头跑 / 在上一版上改），这点 2.4.17 已经做了。

## 如果还是跳

那说明外壳的滚动不是 `scrollTop`，也不是 `scrollIntoView` 能解决的（例如用 transform 移动内容）。请把下面这段粘到 DevTools 控制台（`Ctrl+Shift+I` → Console），把输出发我，我就能一次定位：

```js
(() => {
  const out = []
  let e = document.querySelector('[data-result-composer]')
  const start = e
  while (e) {
    const s = getComputedStyle(e)
    if (/auto|scroll|overlay/.test(s.overflowY)) out.push({ cls: String(e.className).slice(0, 60), top: e.scrollTop, sh: e.scrollHeight, ch: e.clientHeight })
    e = e.parentElement
  }
  return { composer: !!start, scrollers: out, doc: { top: document.documentElement.scrollTop, sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight } }
})()
```

在「取消之后」那一刻运行，把结果贴给我。

## 门禁

- `typecheck` 0
- `vitest` 49 文件 / **902 通过 / 3 跳过**（新增一条：页面找不到滚动容器时，必须向浏览器索要操作区）
- `build` 0，`verify:artifacts` 干净（样式内联 70,641 字符）

## 装

```
F:\git\Personal-Workbench\dsh-workbench\dsh-workbench-2.4.18.tgz
```

profile 清单已指向它，`node_modules/dsh-workbench` 已是 2.4.18。

**必须重启 DSH Desktop（完全退出再打开），然后 `Ctrl+F5`。** 客户端代码不重启不会加载——如果你上次只是在浏览器里刷新，那跑的还是 2.4.16。

## 验收

1. 滚到结果页底部（看得见操作区），点「编辑」→ 到顶部（正常，编辑器在那）。
2. 点「取消」→ 操作区回到眼前。
3. 先切「从头跑」再点「编辑」，取消 → 回来还是「从头跑」。
