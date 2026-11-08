# dsh-workbench 2.9.18

阅读器与卡片页的头，改成一行铭牌。

## 改了什么

- **卡片页的头**：原来三层——一层只有「‹ 返回」，一层 20px 的标题，一层技能与工作目录——加起来约 96px。现在合成一行：返回收成一个图标按钮（可访问名仍是「返回」），后面依次是标题（15px/500）、技能 chip、工作目录，整行 34px。文档因此往上提了约 60px。
- **阅读器里的头不再重复**：阅读器自己已经说了「详细阅读哪一步」，弹层里那张卡片页原来又把自己的标题和返回按钮印一遍。现在弹层里挂载的是「无头」的页面，阅读器的头补上它省掉的信息：`阅读结果 · 详细设计 · uf30-detailed-design · F:\git\ses`，右侧仍是 `Esc 关闭 / 重新生成 / ✕`。
- **阅读器里不再套两层框**：弹层本身有边框和内边距，正文外面那圈 `resultSurface` 边框去掉了，文档直接落在阅读器的面上。单独打开的卡片页仍保留那圈框。

功能一个没动：返回、重新生成、Esc / ✕ / 点遮罩关闭、修改结果、手改 HTML、运行记录折叠，全部照旧。

## 安装

```powershell
cd C:\Users\hspcadmin\AppData\Roaming\dsh-desktop\harness\profiles\web
npm install "file:F:/git/Personal-Workbench/dsh-workbench/dsh-workbench-2.9.18.tgz" --no-audit --no-fund
```

装完**重启 DSH Desktop**。
