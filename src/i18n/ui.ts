export type SiteLocale = "zh" | "en";

export const LOCALE_STORAGE_KEY = "site-locale";
export const DEFAULT_LOCALE: SiteLocale = "zh";

export const UI_TRANSLATIONS = {
    zh: {
        "locale.label": "中文",

        "header.homeAria": "首页",
        "header.mainNavAria": "主导航",
        "header.posts": "文章",
        "header.archive": "归档",
        "header.tags": "标签",
        "header.friends": "友链",
        "header.about": "关于",
        "header.searchAria": "搜索",
        "header.themeAria": "切换深色/浅色模式",
        "header.menuAria": "菜单",
        "header.languageAria": "切换语言",

        "sidebar.categories": "分类",
        "sidebar.tags": "标签",
        "sidebar.more": "查看更多 →",

        "footer.running": "已运行",
        "footer.day": "天",
        "footer.hour": "时",
        "footer.minute": "分",
        "footer.second": "秒",

        "background.modalTitle": "🎨 背景设置",
        "background.quote": "世界并不美丽，但却因此而美丽。",
        "background.enableWallpaper": "启用壁纸",
        "background.styleTitle": "🎨 背景样式",
        "background.styleAltSuffix": "样式",
        "background.opacityTitle": "🔍 透明度",
        "background.blurTitle": "💫 模糊度",

        "search.dialogAria": "搜索",
        "search.title": "搜索内容",
        "search.closeAria": "关闭搜索",
        "search.placeholder": "输入关键词搜索...",
        "search.emptyStart": "开始输入以搜索文章和页面",
        "search.emptyNotFound": "没有找到相关内容",
        "search.emptyMinChars": "请输入至少 2 个字符",
        "search.emptyLoading": "正在加载搜索索引...",
        "search.typeBlog": "博客",
        "search.typeEssay": "随笔",

        "pagination.aria": "分页",
        "pagination.prev": "上一页",
        "pagination.next": "下一页",

        "code.copy": "复制代码",
        "code.expand": "展开代码块",
        "code.collapse": "折叠代码块",

        "common.home": "首页",
        "common.posts": "文章",
        "common.essay": "随笔",
        "common.pinned": "置顶",
        "common.minutes": "分钟",
        "common.words": "字",
        "common.updatedAt": "更新于",
        "common.views": "次浏览",
        "common.comments": "条评论",
        "common.messages": "条留言",
        "common.toc": "目录",

        "index.heroTitle": "👋 欢迎来到 Neomelt 的博客",
        "index.heroIntro1":
            "你好，我是 Neomelt。一个喜欢创造的工科生，对计算机视觉、机器人和系统编程等领域感兴趣。",
        "index.heroIntro2":
            "这里是我记录技术笔记、代码复盘和日常思考的地方。内容可能涉及编程语言、技术领域，以及一些不那么技术的东西。",
        "index.allPosts": "全部文章",
        "index.recentPosts": "最近文章",
        "index.viewAll": "全部文章 →",

        "about.title": "关于我",
        "about.pageCrumb": "关于",
        "about.metaTitle": "关于",
        "about.desc1": "个人主页正在建设中，敬请期待。",
        "about.desc2Prefix": "你可以在",
        "about.desc2Suffix": "上找到我。",

        "posts.title": "文章",
        "posts.metaTitle": "文章",
        "posts.empty": "暂无文章",

        "archive.title": "归档",
        "archive.metaTitle": "归档",
        "archive.countUnit": "篇",

        "tags.title": "标签",
        "tags.metaTitle": "标签",
        "tags.countUnit": "个",

        "comments.loadFailedPrefix": "评论组件加载失败。请刷新重试，或访问",
        "comments.noServerPrefix": "未配置 Waline 服务地址。请在环境变量中设置",

        "legacy.all": "全部",
        "legacy.pagePrefix": "第",
        "legacy.pageSuffix": "页",
        "legacy.yearSuffix": "年",
        "legacy.articlesSuffix": "篇文章",

        "legacy.blog.postsTitle": "博客文章",
        "legacy.blog.noPostsDesc": "还没有发布任何博客文章",

        "legacy.archive.title": "博客归档",
        "legacy.archive.desc": "按时间浏览所有文章。",

        "legacy.categories.title": "博客分类",
        "legacy.categories.desc": "浏览不同主题的文章。",
        "legacy.categories.emptyTitle": "暂无分类",
        "legacy.categories.emptyDesc": "还没有创建任何文章分类。",
        "legacy.categories.back": "返回分类",

        "legacy.tags.title": "标签云",
        "legacy.tags.desc": "所有文章的标签集合，点击标签可以查看相关文章。",
        "legacy.tags.allPosts": "所有文章",

        "legacy.series.title": "博客系列",
        "legacy.series.desc": "按系列浏览相关文章。",
        "legacy.series.emptyTitle": "暂无系列文章",
        "legacy.series.emptyDesc": "还没有创建任何文章系列。",
        "legacy.uncategorized": "未分类",

        "legacy.zueg.title": "随笔文章",
        "legacy.zueg.programming": "编程",
        "legacy.zueg.thinking": "思考",
        "legacy.zueg.empty": "还没有随笔文章。",
        "legacy.zueg.lastUpdated": "最后更新于",

        "legacy.projects.title": "项目展示",
        "legacy.projects.repo": "GitHub 仓库",
        "legacy.projects.preview": "在线预览",
        "legacy.projects.docs": "API 文档",
        "legacy.projects.imageAlt": "项目截图",
        "legacy.projects.imagePlaceholderText": "项目图片",
        "legacy.projects.p1.title": "个人博客网站",
        "legacy.projects.p1.desc":
            "基于 Astro 构建的个人博客网站，使用 TailwindCSS 进行样式设计，支持 Markdown 和 MDX 内容创作。",
        "legacy.projects.p1.tag": "响应式设计",
        "legacy.projects.p2.title": "任务管理应用",
        "legacy.projects.p2.desc":
            "一个基于 React 和 TypeScript 开发的任务管理应用，支持任务创建、编辑、删除和状态管理等功能。",
        "legacy.projects.p3.title": "数据可视化面板",
        "legacy.projects.p3.desc":
            "使用 Vue.js 和 ECharts 实现的数据可视化面板，支持多种图表类型和数据筛选功能。",
        "legacy.projects.p3.tag": "数据可视化",
        "legacy.projects.p4.title": "API 服务",
        "legacy.projects.p4.desc":
            "使用 Node.js 和 Express 开发的 RESTful API 服务，提供数据存储、查询和身份验证等功能。",
        "legacy.projects.openSourceTitle": "开源贡献",
        "legacy.projects.openSourceDesc": "我还参与了以下开源项目的贡献：",
        "legacy.projects.openSourceItem1Name": "开源项目名称",
        "legacy.projects.openSourceItem1Desc": "- 添加了新功能和修复了一些 bug。",
        "legacy.projects.openSourceItem2Name": "另一个开源项目",
        "legacy.projects.openSourceItem2Desc": "- 改进了文档和单元测试。",
        "legacy.projects.openSourceFooter": "如果你对我的项目有任何建议或想要合作，请随时联系我！",

        "friends.metaTitle": "友链",
        "friends.metaDescription": "友情链接与互链申请",
        "friends.pageCrumb": "友链",
        "friends.title": "友情链接",
        "friends.lead": "欢迎交换友链，一起记录与分享。",
        "friends.listTitle": "已收录友链",
        "friends.empty": "暂时还没有收录友链，欢迎成为第一位互链伙伴。",
        "friends.applyTitle": "申请友链",
        "friends.applyDesc": "可以通过邮件、GitHub Issue，或页面底部评论区提交申请。",
        "friends.applyEmail": "邮件申请",
        "friends.infoTitle": "建议提供以下信息",
        "friends.infoName": "网站名称",
        "friends.infoUrl": "网站地址（https://）",
        "friends.infoDesc": "网站简介（一句话）",
        "friends.infoAvatar": "头像或 Logo 地址（可选）",
        "friends.avatarAltSuffix": "头像",

        "post.breadcrumbAria": "面包屑",
        "post.statsAria": "阅读和评论统计",
        "post.navAria": "文章导航",
        "post.prev": "← 上一篇",
        "post.next": "下一篇 →",

        "toc.aria": "目录",
        "toc.label": "目录",
    },
    en: {
        "locale.label": "EN",

        "header.homeAria": "Home",
        "header.mainNavAria": "Main navigation",
        "header.posts": "Posts",
        "header.archive": "Archive",
        "header.tags": "Tags",
        "header.friends": "Friends",
        "header.about": "About",
        "header.searchAria": "Search",
        "header.themeAria": "Toggle dark/light mode",
        "header.menuAria": "Menu",
        "header.languageAria": "Switch language",

        "sidebar.categories": "Categories",
        "sidebar.tags": "Tags",
        "sidebar.more": "View more →",

        "footer.running": "Uptime",
        "footer.day": "d",
        "footer.hour": "h",
        "footer.minute": "m",
        "footer.second": "s",

        "background.modalTitle": "🎨 Background Settings",
        "background.quote": "The world is not beautiful, therefore it is.",
        "background.enableWallpaper": "Enable wallpaper",
        "background.styleTitle": "🎨 Background Style",
        "background.styleAltSuffix": "style",
        "background.opacityTitle": "🔍 Opacity",
        "background.blurTitle": "💫 Blur",

        "search.dialogAria": "Search",
        "search.title": "Search",
        "search.closeAria": "Close search",
        "search.placeholder": "Type keywords to search...",
        "search.emptyStart": "Start typing to search posts and pages",
        "search.emptyNotFound": "No matching content found",
        "search.emptyMinChars": "Please enter at least 2 characters",
        "search.emptyLoading": "Loading search index...",
        "search.typeBlog": "Blog",
        "search.typeEssay": "Essay",

        "pagination.aria": "Pagination",
        "pagination.prev": "Previous page",
        "pagination.next": "Next page",

        "code.copy": "Copy code",
        "code.expand": "Expand code block",
        "code.collapse": "Collapse code block",

        "common.home": "Home",
        "common.posts": "Posts",
        "common.essay": "Essay",
        "common.pinned": "Pinned",
        "common.minutes": "min",
        "common.words": "words",
        "common.updatedAt": "Updated on",
        "common.views": "views",
        "common.comments": "comments",
        "common.messages": "messages",
        "common.toc": "Contents",

        "index.heroTitle": "👋 Welcome to Neomelt's Blog",
        "index.heroIntro1":
            "Hi, I'm Neomelt, an engineering student who loves tinkering and is interested in computer vision, robotics, and systems programming.",
        "index.heroIntro2":
            "This is where I document study notes, technical reflections, and daily writing. Topics may include ROS2, Rust, C++, deep learning, and a few non-technical things.",
        "index.allPosts": "All posts",
        "index.recentPosts": "Recent posts",
        "index.viewAll": "All posts →",

        "about.title": "About Me",
        "about.pageCrumb": "About",
        "about.metaTitle": "About",
        "about.desc1": "My personal page is still under construction.",
        "about.desc2Prefix": "You can find me on",
        "about.desc2Suffix": ".",

        "posts.title": "Posts",
        "posts.metaTitle": "Posts",
        "posts.empty": "No posts yet",

        "archive.title": "Archive",
        "archive.metaTitle": "Archive",
        "archive.countUnit": "posts",

        "tags.title": "Tags",
        "tags.metaTitle": "Tags",
        "tags.countUnit": "tags",

        "comments.loadFailedPrefix": "Failed to load comments. Please refresh, or visit",
        "comments.noServerPrefix": "Waline server URL is not configured. Please set",

        "legacy.all": "All",
        "legacy.pagePrefix": "Page",
        "legacy.pageSuffix": "",
        "legacy.yearSuffix": "",
        "legacy.articlesSuffix": "posts",

        "legacy.blog.postsTitle": "Blog Posts",
        "legacy.blog.noPostsDesc": "No blog posts have been published yet.",

        "legacy.archive.title": "Blog Archive",
        "legacy.archive.desc": "Browse all posts by time.",

        "legacy.categories.title": "Blog Categories",
        "legacy.categories.desc": "Browse posts by topic.",
        "legacy.categories.emptyTitle": "No categories yet",
        "legacy.categories.emptyDesc": "No blog categories have been created yet.",
        "legacy.categories.back": "Back to categories",

        "legacy.tags.title": "Tag Cloud",
        "legacy.tags.desc": "A collection of all post tags. Click a tag to filter related posts.",
        "legacy.tags.allPosts": "All posts",

        "legacy.series.title": "Series",
        "legacy.series.desc": "Browse related posts by series.",
        "legacy.series.emptyTitle": "No series yet",
        "legacy.series.emptyDesc": "No article series has been created yet.",
        "legacy.uncategorized": "Uncategorized",

        "legacy.zueg.title": "Essays",
        "legacy.zueg.programming": "Programming",
        "legacy.zueg.thinking": "Reflection",
        "legacy.zueg.empty": "No essays yet.",
        "legacy.zueg.lastUpdated": "Last updated on",

        "legacy.projects.title": "Projects",
        "legacy.projects.repo": "GitHub Repo",
        "legacy.projects.preview": "Live Preview",
        "legacy.projects.docs": "API Docs",
        "legacy.projects.imageAlt": "Project screenshot",
        "legacy.projects.imagePlaceholderText": "Project image",
        "legacy.projects.p1.title": "Personal Blog Website",
        "legacy.projects.p1.desc":
            "A personal blog built with Astro and styled using TailwindCSS, supporting Markdown and MDX content.",
        "legacy.projects.p1.tag": "Responsive Design",
        "legacy.projects.p2.title": "Task Management App",
        "legacy.projects.p2.desc":
            "A task management app built with React and TypeScript, supporting creation, editing, deletion, and status management.",
        "legacy.projects.p3.title": "Data Visualization Dashboard",
        "legacy.projects.p3.desc":
            "A dashboard built with Vue.js and ECharts, supporting multiple chart types and data filtering.",
        "legacy.projects.p3.tag": "Data Visualization",
        "legacy.projects.p4.title": "API Service",
        "legacy.projects.p4.desc":
            "A RESTful API service built with Node.js and Express, providing storage, query, and authentication features.",
        "legacy.projects.openSourceTitle": "Open Source Contributions",
        "legacy.projects.openSourceDesc": "I also contributed to the following open source projects:",
        "legacy.projects.openSourceItem1Name": "Open Source Project Name",
        "legacy.projects.openSourceItem1Desc": "- Added new features and fixed bugs.",
        "legacy.projects.openSourceItem2Name": "Another Open Source Project",
        "legacy.projects.openSourceItem2Desc": "- Improved documentation and unit tests.",
        "legacy.projects.openSourceFooter": "If you have suggestions or want to collaborate, feel free to contact me.",

        "friends.metaTitle": "Friends",
        "friends.metaDescription": "Friend links and exchange requests",
        "friends.pageCrumb": "Friends",
        "friends.title": "Friend Links",
        "friends.lead": "Let's exchange links and share what we build.",
        "friends.listTitle": "Listed links",
        "friends.empty": "No friend links yet. Feel free to be the first one.",
        "friends.applyTitle": "Apply for Link Exchange",
        "friends.applyDesc": "You can apply via email, GitHub Issue, or the comments section below.",
        "friends.applyEmail": "Apply by Email",
        "friends.infoTitle": "Suggested information",
        "friends.infoName": "Site name",
        "friends.infoUrl": "Site URL (https://)",
        "friends.infoDesc": "One-line description",
        "friends.infoAvatar": "Avatar or logo URL (optional)",
        "friends.avatarAltSuffix": "avatar",

        "post.breadcrumbAria": "Breadcrumb",
        "post.statsAria": "Reading and comment stats",
        "post.navAria": "Post navigation",
        "post.prev": "← Previous",
        "post.next": "Next →",

        "toc.aria": "Table of contents",
        "toc.label": "Contents",
    },
} as const satisfies Record<SiteLocale, Record<string, string>>;

export type UiTranslationKey = keyof (typeof UI_TRANSLATIONS)["zh"];

const DEFAULT_UI_TRANSLATIONS = UI_TRANSLATIONS[DEFAULT_LOCALE];

export function getDefaultUiText(key: UiTranslationKey, fallback = ""): string {
    return DEFAULT_UI_TRANSLATIONS[key] ?? (fallback || key);
}
