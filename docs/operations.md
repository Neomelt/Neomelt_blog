# 操作指南

日常怎么发文、换封面、改外观、加组件。架构层面的约定见本文末尾的「组件契约」。

## 环境

**必须用 Node 22。** Astro 7 拒绝在 Node 20 上启动，会直接报错退出。

```bash
cd ~/Neomelt_blog && nvm use     # 读 .nvmrc，切到 22
npm run dev
```

机器默认仍是 Node 20，只在这个目录切。`package.json` 的 `engines` 和 GitHub workflow 也都锁在 22。

## 架构速览（v2.1）

站点是 Astro 7 的静态构建：内容、配置和三个登记表进入构建管线，输出静态 HTML、共享的 hash JS/CSS 模块、优化后的图片，以及搜索/RSS/站点地图等派生文件。浏览器端不重新渲染文章，只运行主题、i18n、阅读设置、搜索、灯箱和评论等交互。

- `src/blocks/registry.ts`：可放进区域的 block（大多数 widget/decor，以及少数 chrome/behavior）。固定 chrome、全局行为和需要页面数据的 view/widget 仍由各 layout/page 直接挂载。
- `src/skins/index.ts`：皮肤名与 theme-color 的唯一登记处；token 在 `src/skins/<name>/tokens.css`。
- `src/arrangements/index.ts`：文章列表排版的唯一登记处；规则在 `src/arrangements/<name>.css`。
- `src/site.config.ts`：把 block、皮肤和排版装配到页面区域；当前默认是 anime + feature，anime 下启用 backdrop。
- `src/assets/blog/`、`src/assets/covers/` 与 `src/assets/banner/`：统一走 Astro 图片管线；不要把会被 Markdown 引用的图片放回 `public/`，否则会额外复制一份原图。
- `src/i18n/ui.ts`：翻译字典由 Astro 打包成共享模块，不再通过 `define:vars` 写进每个页面。

完整关系图见 [architecture/diagram.html](architecture/diagram.html) 和同目录的 PNG。

### 文章卡片为什么有时没有图片

卡片的封面显示由皮肤和排版共同决定，不是每篇文章单独开关：

- `anime + feature`：显示文章 `heroImage`；缺失时才使用封面池，封面池也为空时才显示确定性渐变和首字母。
- `grid` / `magazine`：图片在卡片顶部正常显示，渐变只作为图片背后的底色，通常不会被看见。
- `list`：图片是右侧缩略图，不使用 feature 的渐变叠层。
- `minimal`：`--card-cover-width: 0`，设计上是纯文字分隔列表。
- `timeline`：`.post-cover { display: none }`，设计上只保留时间轴。

因此“同一页有的有、有的没有”首先检查阅读设置里的皮肤和排版，以及浏览器保存的 `skin` / `layout` 选择。当前可见文章的 `heroImage` 均指向 `src/assets/covers/` 中存在的文件；构建产物会把它们生成到 `/_astro/`。若仍有单张缺图，再检查该图片请求是否返回 200，以及是否被浏览器扩展拦截。

---

## 发一篇文章

```bash
npm run new           # 生成带 frontmatter 的 md
npm run covers:lock   # 给它分配一张还没被占用的封面
```

`covers:lock` 是幂等的，已有封面的文章不会被动。池子不够时它会告诉你还差几张。

---

## 封面

封面是**装饰图，跟正文无关**。每篇文章在自己的 frontmatter 里锁定一张：

```yaml
heroImage: "../../assets/covers/148651669.webp"
```

图放 `src/assets/covers/`，不是 `public/`——只有 `src/` 下的文件会走 Astro 的图片管线，自动生成多个宽度的 webp 和 srcset。放 `public/` 的话原图会原样发给每个访客。

### 加封面

```bash
npm run covers -- --inbox 148682428 147803538      # 下到暂存区，不进 git
xdg-open .cover-inbox/index.html                   # 浏览器里挑
mv .cover-inbox/148682428.webp src/assets/covers/  # 留下满意的
npm run covers:lock                                # 分配给没封面的文章
```

**一定要先进暂存区看。** pixiv 只标 R18，擦边内容完全不标记，任何自动筛选都挡不住——这一步必须人看。

作品 ID 就是链接末尾的数字：`pixiv.net/artworks/`**`148682428`**

脚本会：走 pixiv.cat 反代下载（官方接口不登录拿不到图片 URL）→ 裁成 1200×630 → 转 webp（通常压掉 95% 以上）→ 把标题和作者追加到 `src/assets/covers/CREDITS.md`。

### 换掉某张封面

```bash
rm src/assets/covers/148676633.webp
npm run covers -- --inbox <新ID>
mv .cover-inbox/<新ID>.webp src/assets/covers/
npm run covers:lock
```

`covers:lock` 会发现某篇文章的 `heroImage` 指向的文件没了，自动给它重新分配。

### 版权

`src/assets/covers/CREDITS.md` 记了每张图的标题、作者和原链接。**仓库目前是 public**，等于公开再分发别人的插画。要转 private 的话注意：私有仓库发 GitHub Pages 需要 GitHub Pro，Vercel 不受影响。

---

## 写文章时能用的

### 提示框

GitHub 的 alert 语法，在 GitHub 上看这份 md 也能正确渲染：

```markdown
> [!NOTE]
> 普通说明。

> [!TIP]
> 建议。

> [!WARNING]
> 会覆盖文件之类的警告。
```

五种：`NOTE` `TIP` `IMPORTANT` `WARNING` `CAUTION`。写别的（比如 `[!FOO]`）不会被转换，还是普通引用。

### 系列文章

在 frontmatter 填 `series`，同名的自动成组：

```yaml
series: "网络与远程访问"
```

文章页底部出现「第 N / M 篇」和整个系列的目录，`/series` 页列出所有系列。**空字符串不算**——所有文章模板里都带 `series: ""`，那是没填。

系列内按发表时间**从早到晚**排（系列是往前读的，跟博客列表相反）。

### 分享图

每篇文章的 `heroImage` 就是它分享到微信/Twitter 时的预览图，构建时自动裁成 1200×630 JPEG。不用额外配。

### 表格和代码块

宽表格会自动套一层横向滚动容器，不会把整页撑破。代码块和数学公式同理。

---

## 外观

三条轴——皮肤、排版、明暗——都由访客自己选，各存一个 localStorage 键。

Header 里的 skin/layout 切换合并进了 ⚙️ **阅读设置面板**（`chrome/ReaderSettings`）；搜索、语言、明暗和设置按钮仍保留在右上角。面板里的皮肤与排版选项不是手写的，是从 `src/skins/index.ts` 的 `SKIN_REGISTRY` 和 `src/arrangements/index.ts` 的 `LAYOUTS` 生成的——加一个皮肤或排版，面板自动多一个按钮。

| 轴     | 可选值                                                | 声明处                      |
| ------ | ----------------------------------------------------- | --------------------------- |
| skin   | `minimal` / `anime`                                   | `src/skins/index.ts`        |
| layout | `grid` / `feature` / `list` / `magazine` / `timeline` | `src/arrangements/index.ts` |
| 明暗   | light / dark                                          | 无需声明                    |

改默认值在 `src/site.config.ts`：

```ts
export const siteLayout = {
  skin: "anime",
  layout: "feature",
  // ...
};
```

### 调整某个 skin

所有视觉参数在 `src/skins/<skin>/tokens.css`。改值就行，**不要加新的 token 名**——两个 skin 必须定义完全相同的名字，`src/skins/skins.test.ts` 会在不一致时失败。

几个常用的：

| token                 | 作用                                                    |
| --------------------- | ------------------------------------------------------- |
| `--accent`            | 主色。改完记得看对比度，链接色对页面底至少要 4.5:1      |
| `--radius-card`       | 卡片圆角                                                |
| `--card-cover-width`  | 封面占卡片宽度的比例，`0%` 就是不显示封面               |
| `--list-item-surface` | `transparent` 是分隔线列表，`var(--bg-card)` 是独立卡片 |
| `--aside-width`       | 侧栏宽度                                                |

### 加一个皮肤

两步：

```bash
# 1. 复制一份 token 表，改值（不要增删 token 名）
cp -r src/skins/minimal src/skins/sepia

# 2. src/skins/index.ts 的 SKIN_REGISTRY 加一行，值是它的 theme-color
#    sepia: { light: "#f4ecd8", dark: "#2b2620" },
```

其余全部派生：类型、循环顺序、样式表的引入、阅读设置面板里的按钮。忘了写 `src/i18n/ui.ts` 里的 `skin.sepia` 中英文案，`astro check` 会直接报错，不会等到面板上出现一个 raw key。

### 加一个排版

同样两步：写 `src/arrangements/<name>.css`，在同目录 `index.ts` 的 `LAYOUTS` 数组加个名字。

排版文件里放的是**规则**不是 token（skin 那层才是 token）：因为排版改的是布局模型——绝对定位的封面、`row-reverse` 的缩略图、`::before` 的时间轴圆点——不是同一个布局的不同取值。

写这类文件有一条硬要求，`arrangements.test.ts` 会守：每条选中卡片的选择器都必须带上 `.post-list` 这一层，写成 `html[data-layout="x"] .post-list .post-card`。少了它选择器特异性是 0,2,1，会被 PostCard 自己的 `.post-card:last-child[data-astro-cid-…]`（0,3,0）压过去，症状是某个排版下最后一张卡片莫名少一像素边框。

---

侧栏是两个独立区域 `asideStart` / `asideEnd`，各自是一个数组。哪边有 block 哪边就有列，两边都有就是三栏——挪一个挂件到另一边，是把它那行从一个数组剪到另一个数组。

---

## 加一个组件

三步，布局文件一个字都不用改。**这三步只适用于能被区域放置、且不依赖页面专属数据的 block**。当前 registry 登记了 12 个 block：大多数是 `widget/` / `decor/`，另有 `chrome/Banner` 与 `behavior/ImageLightbox`；Header、Footer、ReaderSettings、CodeCopyButton、WalineCounter 由布局固定挂载，`view/` 和需要页面数据的组件由页面直接 import。

```bash
# 1. 写组件，只用 var(--x)，不准出现字面颜色值
vim src/blocks/widget/Calendar.astro
```

```ts
// 2. src/blocks/registry.ts
"widget/Calendar": Calendar,
```

```ts
// 3. src/site.config.ts，放进某个区域
regions: { asideStart: ["widget/Calendar"] },
```

### 组件放哪个目录

按**接口形状**分，不是按功能：

| 目录        | 有 slot    | 数据来源   | 谁放它                      |
| ----------- | ---------- | ---------- | --------------------------- |
| `surface/`  | 有         | 视觉参数   | 任何人拿来包内容            |
| `widget/`   | 无         | 自己查     | `site.config.ts` 的区域数组 |
| `view/`     | 无         | 页面显式传 | 页面代码                    |
| `chrome/`   | 无         | 配置       | BaseLayout 的具名 slot      |
| `decor/`    | 无         | 视觉参数   | backdrop / floating 层      |
| `behavior/` | 无渲染输出 | 无         | 挂一次，全局生效            |

registry 的 block 必须能由 `Region` 以字符串名称解析，并接受区域传入的 `context` 与 `props`。目录名是接口形状的提示，不是硬编码白名单；例如 `chrome/Banner` 和 `behavior/ImageLightbox` 也已登记。需要 `headings`、`post` 等页面专属数据的组件仍由页面或布局直接挂载。

### 区域

从后往前：`backdrop`（全屏背景）→ 页面内容 → `masthead`（顶部 banner）→ `asideStart` / `asideEnd`（左右两条侧栏）→ `floating`（进度条、返回顶部、图片灯箱脚本）

可放区域的 widget：`Profile`（头像+简介+社交，数据在 config 的 `profile`）、`BlogStats`、`TagCloud`、`Calendar`、`FriendCircle`、`MusicPlayer`。`WritingHeatmap` 已登记但当前没有放进区域。`TableOfContents` 需要文章 headings，由 `BlogPost` 直接挂载，不属于区域 registry。

配置里可以限定某个 block 只在某个 skin 下出现：

```ts
{ use: "decor/Backdrop", props: { imageIndex: 1, blur: 2 }, skins: ["anime"] }
```

它在所有 skin 下都会渲染，由 CSS 按 `data-skin` 隐藏——因为 skin 是访客存在 localStorage 里的选择，服务端不知道，构建期排除的话切换时就出不来了。

---

## 组件契约

三条硬约束，`src/skins/skins.test.ts` 会在违反时让测试失败：

1. **每个 skin 定义完全相同的 token 名。** skin 可以改一个 token 是什么，不能改有哪些——block 只读 `var(--x)`，某个 skin 少一个名字就是切换瞬间的裸元素。
2. **每个 token 必须有消费方。** 定义了没人读的 token 是死代码。
3. **`src/blocks/**` 里不准出现 skin 名字。\*\* 一旦组件开始判断「当前是不是 anime」，切换就不再是配置的事了。

推论：**skin 层不许伸手改组件内部类名。** 想让某个 skin 下卡片 hover 位移，不是写 `[data-skin=anime] .post-card:hover`，而是组件自己写 `transform: translateX(var(--card-hover-lift))`，另一个 skin 把这个 token 设成 `0`。

`--*-rgb` 系列必须保持「裸通道三元组」格式（`58, 103, 166`），全站的 `rgba(var(--ink-rgb), a)` / `rgba(var(--accent-rgb), a)` 调用依赖这个格式。想换成 OKLCH 得先把这些调用改成 `color-mix()`。

---

## 检查

```bash
npx astro check    # 类型，应为 0 error / 0 warning
npx vitest run     # 单元测试 + skin 与 arrangement 的契约
npm run build      # 29 页
```

`astro check` 曾长期停在 18 个 implicitly-any，2026-08-29 清零了。**别让它再红着**——一个永远输出 "18 errors" 的命令，等于没有这道检查：真正的错误会作为第 19 个混进去，没人会发现。
