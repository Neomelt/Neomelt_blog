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
- 文章插图优先放在 `images/YYYY/MM/`，在 Markdown 用相对路径引用。
- 需要固定公网 URL 的资源放在 `public/`。

## 常用命令

- `npm run dev`：本地开发
- `npm run build`：生产构建
- `npm run preview`：本地预览构建产物
- `npm run test`：运行测试
- `npm run new`：创建新文章模板
- `npm run watch:frontmatter`：自动补齐 frontmatter

## 视频快捷插入

在博客 Markdown 中支持以下写法，最终渲染为响应式 iframe：

```md
@[video](https://www.youtube.com/watch?v=M7lc1UVf-VE)
@[youtube](M7lc1UVf-VE)
@[bilibili](https://www.bilibili.com/video/BV1xx411c7mD)
```
