# 操作指南

日常怎么发文、换封面、改外观、加组件。架构层面的约定见本文末尾的「组件契约」。

## 环境

**必须用 Node 22。** Astro 7 拒绝在 Node 20 上启动，会直接报错退出。

```bash
cd ~/Neomelt_blog && nvm use     # 读 .nvmrc，切到 22
npm run dev
```

机器默认仍是 Node 20，只在这个目录切。`package.json` 的 `engines` 和 GitHub workflow 也都锁在 22。

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

Header 右上角只剩两个直接按钮：🌐 切语言、月亮/太阳切明暗。皮肤和排版收进了 ⚙️ **阅读设置面板**（`chrome/ReaderSettings`），和字号、行高、行宽放在一起。面板里的选项不是手写的，是从 `src/skins/index.ts` 的 `SKIN_REGISTRY` 和 `src/arrangements/index.ts` 的 `LAYOUTS` 生成的——加一个皮肤或排版，面板自动多一个按钮。

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

三步，布局文件一个字都不用改。**注意这三步只适用于能被区域放置的 block**（`widget/` 和 `decor/`）——`src/blocks/` 下 28 个组件里有 12 个走这条路，其余的由页面直接 import，原因见下面的目录表。

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
aside: [{ use: "widget/Calendar", props: { weekStart: 1 } }],
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

**只有 `widget/` 和 `decor/` 能进 registry**，因为只有它们不需要页面喂数据。

### 区域

从后往前：`backdrop`（全屏背景）→ 页面内容 → `masthead`（顶部 banner）→ `asideStart` / `asideEnd`（左右两条侧栏）→ `floating`（进度条、返回顶部）

现成的 widget：`Profile`（头像+简介+社交，数据在 config 的 `profile`）、`BlogStats`、`TagCloud`、`Calendar`、`FriendCircle`、`TableOfContents`。

配置里可以限定某个 block 只在某个 skin 下出现：

```ts
{ use: "decor/SakuraFall", props: { count: 20 }, skins: ["anime"] }
```

它在所有 skin 下都会渲染，由 CSS 按 `data-skin` 隐藏——因为 skin 是访客存在 localStorage 里的选择，服务端不知道，构建期排除的话切换时就出不来了。

---

## 组件契约

三条硬约束，`src/skins/skins.test.ts` 会在违反时让测试失败：

1. **每个 skin 定义完全相同的 token 名。** skin 可以改一个 token 是什么，不能改有哪些——block 只读 `var(--x)`，某个 skin 少一个名字就是切换瞬间的裸元素。
2. **每个 token 必须有消费方。** 定义了没人读的 token 是死代码。
3. **`src/blocks/**` 里不准出现 skin 名字。\*\* 一旦组件开始判断「当前是不是 anime」，切换就不再是配置的事了。

推论：**skin 层不许伸手改组件内部类名。** 想让某个 skin 下卡片 hover 位移，不是写 `[data-skin=anime] .post-card:hover`，而是组件自己写 `transform: translateX(var(--card-hover-lift))`，另一个 skin 把这个 token 设成 `0`。

`--*-rgb` 系列必须保持「裸通道三元组」格式（`58, 103, 166`），全站有 23 处 `rgba(var(--ink-rgb), a)` / `rgba(var(--accent-rgb), a)` 分布在 13 个文件里依赖这个格式。想换成 OKLCH 得先把这 23 处改成 `color-mix()`。

---

## 检查

```bash
npx astro check    # 类型，应为 0 error / 0 warning
npx vitest run     # 单元测试 + skin 与 arrangement 的契约
npm run build      # 29 页
```

`astro check` 曾长期停在 18 个 implicitly-any，2026-08-29 清零了。**别让它再红着**——一个永远输出 "18 errors" 的命令，等于没有这道检查：真正的错误会作为第 19 个混进去，没人会发现。
