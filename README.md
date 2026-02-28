# Neomelt Blog

基于 Astro 的个人博客项目。

## 目录结构

```text
.
├── public/                  # 直接静态资源（按 URL 原样输出）
│   ├── blog/                # 文章内使用的公开图片资源
│   ├── fonts/
│   ├── images/
│   │   ├── anime-bg/
│   │   └── hero-images/
│   ├── js/
│   └── vendor/
├── images/                  # 本地文章插图（按日期分目录）
├── scripts/                 # 发布与内容维护脚本
├── src/
│   ├── assets/              # 通过 Astro 构建处理的资源
│   ├── components/
│   ├── content/
│   │   └── blog/            # 博客 Markdown/MDX
│   ├── i18n/
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   └── utils/
├── astro.config.mjs
├── src/content.config.ts
└── package.json
```

## 内容维护约定

- 新文章放在 `src/content/blog/`。
- 文章 frontmatter 默认 `heroImage` 使用 `src/assets/cover.svg`。
- 可以通过 frontmatter 的 `hidden: true` 暂时隐藏文章（不会出现在列表、归档、标签、RSS、搜索，也不会生成公开详情页）。
- 文章插图优先放在 `images/YYYY/MM/`，在 Markdown 用相对路径引用。
- 需要固定公网 URL 的资源放在 `public/`。

## 常用命令

- `npm run dev`：本地开发
- `npm run build`：生产构建
- `npm run preview`：本地预览构建产物
- `npm run test`：运行测试
- `npm run new`：创建新文章模板
- `npm run watch:frontmatter`：自动补齐 frontmatter

## 自动生成文章头（frontmatter）

你现在有两种方式：

- `npm run new` / `npm run new:post`：创建新文章并自动写入完整 frontmatter
- `npm run watch:frontmatter`：监听 `src/content/blog/`，给“缺失 frontmatter 的 md/mdx”自动补齐

### 方式 1：新建文章时自动生成

交互式创建（推荐）：

```bash
npm run new
```

命令行参数创建：

```bash
npm run new -- --title "我的新文章" --tags "astro,blog" --category "开发" --series "折腾记录"
```

常用参数：

- `--title` 文章标题（必填）
- `--slug` 文件名（默认由标题自动生成）
- `--desc` 描述
- `--tags` 逗号分隔标签
- `--category` 分类
- `--series` 系列
- `--pinned` 是否置顶（`true/false`）
- `--hidden` 是否隐藏（`true/false`）
- `--hero` 头图路径（默认 `../../assets/cover.svg`）
- `--pubDate` 发布时间（默认当前时间）
- `--dry-run` 只预览，不落盘

### 方式 2：已有文章自动补齐 frontmatter

```bash
npm run watch:frontmatter
```

说明：

- 启动后会先扫描一次 `src/content/blog/`
- 之后监听文件变化，发现没有 frontmatter 的 `.md/.mdx` 会自动补齐
- 已经有 frontmatter 的文件不会被覆盖

## 视频快捷插入

在博客 Markdown 中支持以下写法，最终渲染为响应式 iframe：

```md
@[video](https://www.youtube.com/watch?v=M7lc1UVf-VE)
@[youtube](M7lc1UVf-VE)
@[bilibili](https://www.bilibili.com/video/BV1xx411c7mD)
```
