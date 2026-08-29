# 变更日志

记录对读者可感知的变化，以及会改变「东西该怎么加」的架构调整。琐碎的措辞修订和内容更新不在这里，看 `git log`。

版本号只是这份文件里的分节标记——本项目不发布到 npm，`package.json` 的 `version` 字段无实际用途。

## v2.1.0 — 2026-08-29

两条轴对称了：加一个皮肤和加一个排版都从「改代码」降成了两步声明，各有测试守着。同时修掉一个泄漏、两处浪费，并把 `astro check` 从长期红着拉回 0。

### 架构

- **加一个皮肤从 7 处编辑降到 2 步。** `src/skins/index.ts` 的 `SKIN_REGISTRY` 成为唯一声明处，名称联合类型、循环顺序、样式表引入、阅读设置面板的选项全部由它派生。漏写 `i18n` 译文现在是 `astro check` 报错，而不是面板上出现一个 raw key。
- **文章列表的 5 种排版搬出组件。** 原先 22 条 CSS 规则散在 `PostCard.astro` 和 `global.css` 里，现在各自成为 `src/arrangements/<name>.css`，加一个排版同样是两步。组件里的排版分支归零。
- 排版层放规则而非 token——它改的是布局模型（绝对定位的封面、`row-reverse` 的缩略图、`::before` 的时间轴圆点），不是同一布局的不同取值。这与皮肤层的 token 是有意的差别，理由写在 `src/arrangements/index.ts`。
- 新增 4 条契约测试（排版名不得进组件、每条规则必须自带作用域、选择器特异性下限、登记表与磁盘一致），皮肤的泄漏检查从字符串匹配改为正则，堵住无引号属性选择器。

### 修复

- **阅读设置面板每次站内导航泄漏一个事件监听器。** 浏览 N 页后切换语言会重复执行 N 次重绘。实测每次导航净增 1，修复后为 0。
- **英文读者每次打开页面会看到约 40ms 的中文。** 翻译脚本原先内联在 `<body>` 开头，只能排队等 `DOMContentLoaded`，浏览器早已画出服务端渲染的中文。改为打包 module（deferred）后，语言在首次绘制前就位。
- magazine 排版的首卡本该是 hero，其中封面比例与标题字号两条规则因 Astro scoped CSS 的作用域 id 不匹配，**自上线起从未生效**。搬出组件后恢复。

### 性能

- **字体少下载 121 KB。** 原先引入 LXGW WenKai 的 6 张字体表，站点只用得上 2 张——等宽字体是 JetBrains Mono，Light 字重全站零使用。改为直接引用需要的两张，顺带把 `@import` 的串行请求变成并行。
- **全站 HTML 从 995 KB 降到 686 KB**（gzip）。529 条翻译原先被 `define:vars` 内联进每一个页面，改为共享 module 后只取一次。单页 33.0 KB → 22.3 KB。
- **构建产物从 21 MB 降到 17 MB。** 文章配图一直走着图片管线，但原件放在 `public/` 因而被原样复制了一份，那份零页面引用。移入 `src/assets/blog/` 后不再重复。

### 工程

- `astro check` 从 18 个 error 清零。全部是 inline script 缺类型标注，无运行时缺陷——但一个永远输出 "18 errors" 的命令等于没有这道检查。新增 `src/env.d.ts` 声明 inline script 挂在 `window` 上的运行时 API 与 handler 槽位。
- CI 的 GitHub Actions 全部升级到仍在维护的大版本（checkout v4→v7、setup-node v4→v7、configure-pages v5→v6、upload-pages-artifact v3→v5、deploy-pages v4→v5）。`upload-pages-artifact` 自 v4 起排除 dotfile，需显式开启 `include-hidden-files`，否则 `.nojekyll` 丢失会让 Jekyll 忽略 `_astro/`、全站失去样式。
- Node 要求提升到 22（Astro 7 在 Node 20 上拒绝启动）。

### 外观

- 新访客默认使用 anime 皮肤与 feature 排版。
- Header 与页面其余部分使用同一套玻璃质感。

## v2.0.0 — 2026-08-27

block / skin 架构：组件库只保留功能实现，视觉切换靠参数化配置加装配文件。详见 `docs/operations.md` 与该次提交。
