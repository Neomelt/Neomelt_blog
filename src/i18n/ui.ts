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
    "footer.sitePolicy": "网站政策",
    "footer.themePowered": "Astro 主题驱动",

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
      "你好，我是 Neomelt，一名喜欢创造的工科生，主要对机器人应用开发和软件工程实践等方向感兴趣。",
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
    "about.distributionTitle": "站点入口",
    "about.distributionLead":
      "主站统一使用 www.neomelt.cloud。若主站在你当前网络下访问不稳定，可切换到备用入口。",
    "about.distributionHint":
      "根域名 neomelt.cloud 会自动跳转到主站；GitHub Pages Direct 仅作为备用访问入口。",
    "about.nodePrimary": "主站",
    "about.nodeFallback": "备用",

    "terms.metaTitle": "网站政策",
    "terms.listTitle": "网站政策",
    "terms.listLead":
      "这里整理了站点相关政策与说明，用于明确内容使用、版权归属和责任范围。",
    "terms.cardTitle": "政策目录",
    "terms.privacyTitle": "隐私政策",
    "terms.privacyDesc": "说明站点收集的数据类型、用途与保存方式。",
    "terms.conditionsTitle": "条款与条件",
    "terms.conditionsDesc": "说明访问和使用本站内容时应遵循的规则。",
    "terms.copyrightTitle": "版权声明",
    "terms.copyrightDesc": "说明文章、图片和代码片段的版权归属与引用要求。",
    "terms.disclaimerTitle": "免责声明",
    "terms.disclaimerDesc": "说明内容边界与风险自担原则。",
    "terms.updatedLabel": "最后更新",
    "terms.effectiveDate": "2026 年 2 月 24 日",
    "terms.contact": "联系邮箱：3212929002@qq.com",
    "terms.backToList": "返回政策目录",
    "terms.privacyIntro":
      "本政策用于说明本站在访问、评论和偏好设置场景下对数据的处理方式。",
    "terms.privacyS1Title": "1. 收集的信息类型",
    "terms.privacyS1Item1":
      "访问日志：可能包含访问时间、页面路径、来源地址、设备类型与浏览器信息。",
    "terms.privacyS1Item2":
      "评论信息：昵称、邮箱、网址与评论内容由评论服务提供方处理并存储。",
    "terms.privacyS1Item3":
      "本地偏好：主题模式、语言设置等可能保存在浏览器本地存储中。",
    "terms.privacyS2Title": "2. 数据使用目的",
    "terms.privacyS2Item1":
      "用于分析访问趋势、排查故障并改进站点性能与阅读体验。",
    "terms.privacyS2Item2": "用于识别异常请求、减少垃圾评论和提升站点安全性。",
    "terms.privacyS2Item3": "用于提供评论、统计计数和页面个性化展示功能。",
    "terms.privacyS3Title": "3. 第三方服务与链接",
    "terms.privacyS3Item1":
      "评论系统、CDN 或统计服务可能在其服务范围内处理相关数据。",
    "terms.privacyS3Item2":
      "本站链接到的外部站点由第三方维护，其隐私规则不受本站控制。",
    "terms.privacyS3Item3": "建议在访问第三方站点前阅读其隐私政策与使用条款。",
    "terms.privacyS4Title": "4. 用户权利",
    "terms.privacyS4Item1":
      "你可以通过浏览器设置清除本地缓存、Cookie 与站点偏好数据。",
    "terms.privacyS4Item2":
      "如需删除评论或反馈数据处理问题，可通过邮箱联系站长。",
    "terms.privacyS4Item3": "本站将尽力在合理范围内响应数据删除或修正请求。",
    "terms.conditionsIntro": "访问和使用本站内容，即表示你同意遵守以下条款。",
    "terms.conditionsS1Title": "1. 允许的使用方式",
    "terms.conditionsS1Item1":
      "允许在非商业学习与研究场景下阅读、收藏和引用本站内容。",
    "terms.conditionsS1Item2": "转载或引用时应保留作者署名，并附带原文链接。",
    "terms.conditionsS1Item3": "使用本站时应遵守所在地区适用法律法规。",
    "terms.conditionsS2Title": "2. 禁止行为",
    "terms.conditionsS2Item1": "禁止未授权的批量搬运、镜像抓取或冒充原创发布。",
    "terms.conditionsS2Item2": "禁止将本站内容用于违法、误导、骚扰或侵权用途。",
    "terms.conditionsS2Item3":
      "禁止利用自动化脚本进行恶意请求、爬虫滥用或破坏性访问。",
    "terms.conditionsS3Title": "3. 服务可用性与变更",
    "terms.conditionsS3Item1": "本站为个人维护项目，不保证持续可用或永久在线。",
    "terms.conditionsS3Item2":
      "页面结构、评论服务、访问域名与镜像节点可能不定期调整。",
    "terms.conditionsS3Item3":
      "相关政策内容可在不另行通知的情况下更新，并以最新版本为准。",
    "terms.conditionsS4Title": "4. 争议与联系",
    "terms.conditionsS4Item1":
      "若你认为本站内容存在问题，请先通过邮箱沟通处理。",
    "terms.conditionsS4Item2":
      "对于外部平台或第三方服务导致的问题，本站仅协助沟通，不承担其独立责任。",
    "terms.conditionsS4Item3":
      "继续使用本站即视为你理解并接受本条款的适用范围。",
    "terms.copyrightIntro":
      "本页面用于明确本站原创内容及相关素材的版权归属和使用边界。",
    "terms.copyrightS1Title": "1. 版权归属",
    "terms.copyrightS1Item1":
      "除特别标注外，本站文章、页面文案与原创图文版权归作者所有。",
    "terms.copyrightS1Item2":
      "代码片段与技术示例默认供学习参考，不自动授予商用再分发许可。",
    "terms.copyrightS1Item3": "第三方素材仍归其原作者或原授权方所有。",
    "terms.copyrightS2Title": "2. 引用与转载规范",
    "terms.copyrightS2Item1":
      "引用内容时请注明来源并附原文链接，避免断章取义。",
    "terms.copyrightS2Item2":
      "转载全文或大段内容前，请先与站长沟通并获得授权。",
    "terms.copyrightS2Item3":
      "禁止去除作者署名、水印或在未授权场景下用于商业宣传。",
    "terms.copyrightS3Title": "3. 开源与第三方许可",
    "terms.copyrightS3Item1": "涉及开源项目内容时，以对应开源许可证条款为准。",
    "terms.copyrightS3Item2":
      "若页面中包含第三方引用，将尽量注明来源与许可信息。",
    "terms.copyrightS3Item3": "如发现标注遗漏，可联系站长补充或修正。",
    "terms.copyrightS4Title": "4. 侵权处理",
    "terms.copyrightS4Item1":
      "若你认为本站内容侵犯合法权益，可提供权属证明并邮件告知。",
    "terms.copyrightS4Item2": "收到有效通知后，本站会在合理时间内核验并处理。",
    "terms.copyrightS4Item3": "必要时会下线相关内容或补充版权说明。",
    "terms.disclaimerIntro":
      "本站内容主要用于知识分享和经验记录，以下声明用于明确责任边界。",
    "terms.disclaimerS1Title": "1. 信息性质",
    "terms.disclaimerS1Item1":
      "文章内容不构成法律、医疗、投资、财税等专业意见。",
    "terms.disclaimerS1Item2":
      "技术方案仅代表发布时的经验，不保证适用于所有环境。",
    "terms.disclaimerS1Item3": "请在生产环境部署前自行评估风险并做好备份。",
    "terms.disclaimerS2Title": "2. 风险承担",
    "terms.disclaimerS2Item1":
      "因使用本站信息导致的直接或间接损失，由使用者自行承担。",
    "terms.disclaimerS2Item2":
      "本站不对数据丢失、业务中断或兼容性问题承担担保责任。",
    "terms.disclaimerS2Item3": "建议在关键操作前进行测试、验证与回滚预案准备。",
    "terms.disclaimerS3Title": "3. 外部链接说明",
    "terms.disclaimerS3Item1":
      "外部链接内容由第三方维护，本站无法持续保证其准确性与安全性。",
    "terms.disclaimerS3Item2":
      "访问外部站点时请自行判断可信度并注意个人信息保护。",
    "terms.disclaimerS3Item3":
      "外部服务条款变更可能影响可用性，本站不对其做长期承诺。",
    "terms.disclaimerS4Title": "4. 声明更新",
    "terms.disclaimerS4Item1":
      "本站可根据运营情况更新本声明，更新后版本即时生效。",
    "terms.disclaimerS4Item2": "如对声明内容有疑问，可通过邮箱联系站长沟通。",
    "terms.disclaimerS4Item3": "继续访问本站即视为已阅读并接受当前声明内容。",

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
    "legacy.projects.openSourceFooter":
      "如果你对我的项目有任何建议或想要合作，请随时联系我！",

    "friends.metaTitle": "友链",
    "friends.metaDescription": "友情链接与互链申请",
    "friends.pageCrumb": "友链",
    "friends.title": "友情链接",
    "friends.lead": "欢迎交换友链，一起记录与分享。",
    "friends.listTitle": "已收录友链",
    "friends.empty": "暂时还没有收录友链，欢迎成为第一位互链伙伴。",
    "friends.applyTitle": "申请友链",
    "friends.applyDesc":
      "可以通过邮件、GitHub Issue，或页面底部评论区提交申请。",
    "friends.applyEmail": "邮件申请",
    "friends.infoTitle": "建议提供以下信息",
    "friends.infoName": "网站名称",
    "friends.infoUrl": "网站地址（https://）",
    "friends.infoDesc": "网站简介（一句话）",
    "friends.infoAvatar": "头像或 Logo 地址（可选）",
    "friends.avatarAltSuffix": "头像",
    "friends.selfInfoTitle": "本站友链信息",
    "friends.selfInfoDesc": "点击一键复制或单行复制，直接贴给对方即可。",
    "friends.copyAll": "一键复制",
    "friends.copy": "复制",
    "friends.copied": "已复制",
    "friends.circleTitle": "朋友圈",
    "friends.circleLead": "最近更新，随机看看朋友们都在写什么。",
    "friends.circleRefresh": "换一批",
    "friends.circleEmpty": "暂时还没有抓取到友链动态。",

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
    "footer.sitePolicy": "Site policy",
    "footer.themePowered": "Astro theme powered",

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
      "Hi, I'm Neomelt, an engineering student who loves creating and is mainly interested in robotics application development and software engineering practice.",
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
    "about.distributionTitle": "Site Entrances",
    "about.distributionLead":
      "The canonical site lives at www.neomelt.cloud. If it is unstable on your network, you can use the fallback entry.",
    "about.distributionHint":
      "The root domain neomelt.cloud now redirects to the primary site. GitHub Pages Direct is kept only as a fallback.",
    "about.nodePrimary": "Primary",
    "about.nodeFallback": "Fallback",

    "terms.metaTitle": "Site Policy",
    "terms.listTitle": "Site Policy",
    "terms.listLead":
      "This section documents site-level policies, including usage boundaries, copyright, and liability notes.",
    "terms.cardTitle": "Terms content",
    "terms.privacyTitle": "Privacy Policy",
    "terms.privacyDesc":
      "How data is collected, used, and retained on this site.",
    "terms.conditionsTitle": "Terms and Conditions",
    "terms.conditionsDesc":
      "Rules for accessing and using content published on this site.",
    "terms.copyrightTitle": "Copyright",
    "terms.copyrightDesc":
      "Ownership and citation requirements for text, media, and code snippets.",
    "terms.disclaimerTitle": "Disclaimer",
    "terms.disclaimerDesc": "Scope limits and at-your-own-risk statement.",
    "terms.updatedLabel": "Last updated",
    "terms.effectiveDate": "February 24, 2026",
    "terms.contact": "Contact: 3212929002@qq.com",
    "terms.backToList": "Back to policy list",
    "terms.privacyIntro":
      "This policy explains how this site handles data during visits, comments, and preference storage.",
    "terms.privacyS1Title": "1. Data We May Collect",
    "terms.privacyS1Item1":
      "Visit logs may include access time, page path, referrer, device type, and browser details.",
    "terms.privacyS1Item2":
      "Comment fields such as nickname, email, website, and content are processed by the comment provider.",
    "terms.privacyS1Item3":
      "Local preferences (theme, locale, and UI settings) may be stored in browser local storage.",
    "terms.privacyS2Title": "2. Why We Use Data",
    "terms.privacyS2Item1":
      "To analyze traffic trends, troubleshoot issues, and improve performance and readability.",
    "terms.privacyS2Item2":
      "To detect abuse patterns, reduce spam comments, and enhance basic site security.",
    "terms.privacyS2Item3":
      "To provide comment features, counters, and personalized interface behavior.",
    "terms.privacyS3Title": "3. Third-party Services",
    "terms.privacyS3Item1":
      "Comment, CDN, and analytics services may process related data under their own policies.",
    "terms.privacyS3Item2":
      "External links are maintained by third parties and are not controlled by this site.",
    "terms.privacyS3Item3":
      "Please read third-party privacy policies before submitting personal information.",
    "terms.privacyS4Title": "4. Your Rights",
    "terms.privacyS4Item1":
      "You can clear browser storage, cookies, and local preferences at any time.",
    "terms.privacyS4Item2":
      "For comment deletion or data-related requests, contact the site owner via email.",
    "terms.privacyS4Item3":
      "Reasonable requests for deletion or correction will be reviewed and handled in time.",
    "terms.conditionsIntro":
      "By accessing and using this site, you agree to follow the terms below.",
    "terms.conditionsS1Title": "1. Acceptable Use",
    "terms.conditionsS1Item1":
      "Reading, bookmarking, and citing content for non-commercial learning is allowed.",
    "terms.conditionsS1Item2":
      "When citing or reposting, keep author attribution and include the original link.",
    "terms.conditionsS1Item3":
      "Use of this site should comply with applicable laws and regulations in your region.",
    "terms.conditionsS2Title": "2. Prohibited Behavior",
    "terms.conditionsS2Item1":
      "Unauthorized bulk scraping, mirroring, or reposting as original work is prohibited.",
    "terms.conditionsS2Item2":
      "Content must not be used for illegal, misleading, harassing, or infringing activity.",
    "terms.conditionsS2Item3":
      "Abusive automation, malicious requests, or destructive access behavior is prohibited.",
    "terms.conditionsS3Title": "3. Availability and Changes",
    "terms.conditionsS3Item1":
      "This is a personally maintained site and availability is not guaranteed 24/7.",
    "terms.conditionsS3Item2":
      "Page structure, comment service, domains, and mirror entries may change over time.",
    "terms.conditionsS3Item3":
      "Policies may be updated without separate notice; latest published version prevails.",
    "terms.conditionsS4Title": "4. Disputes and Contact",
    "terms.conditionsS4Item1":
      "If you identify issues, please contact the site owner first for resolution.",
    "terms.conditionsS4Item2":
      "For third-party platform issues, this site can assist communication but not assume their liability.",
    "terms.conditionsS4Item3":
      "Continued use indicates understanding and acceptance of these terms.",
    "terms.copyrightIntro":
      "This page clarifies ownership and permitted use of original content and referenced assets.",
    "terms.copyrightS1Title": "1. Ownership",
    "terms.copyrightS1Item1":
      "Unless stated otherwise, original posts and media are copyrighted by the author.",
    "terms.copyrightS1Item2":
      "Code snippets are provided for learning reference and do not imply commercial relicensing.",
    "terms.copyrightS1Item3":
      "Third-party assets remain under their original owners or license holders.",
    "terms.copyrightS2Title": "2. Citation and Repost",
    "terms.copyrightS2Item1":
      "When quoting, include source attribution and a link to the original page.",
    "terms.copyrightS2Item2":
      "Full-text reposting requires prior permission from the site owner.",
    "terms.copyrightS2Item3":
      "Removing author attribution, watermark, or unauthorized commercial use is prohibited.",
    "terms.copyrightS3Title": "3. Open-source and Third-party Licenses",
    "terms.copyrightS3Item1":
      "When open-source material is involved, its original license terms take priority.",
    "terms.copyrightS3Item2":
      "Third-party references should include source and license notes when applicable.",
    "terms.copyrightS3Item3":
      "If attribution is missing, please report it for correction.",
    "terms.copyrightS4Title": "4. Infringement Notice",
    "terms.copyrightS4Item1":
      "If you believe content infringes your rights, send ownership proof by email.",
    "terms.copyrightS4Item2":
      "Valid notices will be reviewed and processed within a reasonable time.",
    "terms.copyrightS4Item3":
      "Content may be removed or corrected when infringement is confirmed.",
    "terms.disclaimerIntro":
      "This site is primarily for knowledge sharing and learning notes. The following defines liability boundaries.",
    "terms.disclaimerS1Title": "1. Nature of Information",
    "terms.disclaimerS1Item1":
      "Content does not constitute legal, medical, financial, or tax advice.",
    "terms.disclaimerS1Item2":
      "Technical solutions reflect experience at publish time and may not fit all environments.",
    "terms.disclaimerS1Item3":
      "Please test and back up before applying any solution in production.",
    "terms.disclaimerS2Title": "2. Risk Responsibility",
    "terms.disclaimerS2Item1":
      "Any direct or indirect loss from using this information is at the reader's own risk.",
    "terms.disclaimerS2Item2":
      "No warranty is provided for data loss, service interruption, or compatibility outcomes.",
    "terms.disclaimerS2Item3":
      "Prepare validation and rollback plans before critical operations.",
    "terms.disclaimerS3Title": "3. External Links",
    "terms.disclaimerS3Item1":
      "External sites are maintained by third parties; accuracy and safety are not guaranteed here.",
    "terms.disclaimerS3Item2":
      "Assess trust level yourself when visiting external links and sharing personal information.",
    "terms.disclaimerS3Item3":
      "Third-party policy changes may affect availability and are outside this site's control.",
    "terms.disclaimerS4Title": "4. Updates",
    "terms.disclaimerS4Item1":
      "This disclaimer may be updated according to operational needs and takes effect once published.",
    "terms.disclaimerS4Item2":
      "For questions regarding policy text, contact the site owner via email.",
    "terms.disclaimerS4Item3":
      "Continued access indicates acceptance of the current version of this disclaimer.",

    "posts.title": "Posts",
    "posts.metaTitle": "Posts",
    "posts.empty": "No posts yet",

    "archive.title": "Archive",
    "archive.metaTitle": "Archive",
    "archive.countUnit": "posts",

    "tags.title": "Tags",
    "tags.metaTitle": "Tags",
    "tags.countUnit": "tags",

    "comments.loadFailedPrefix":
      "Failed to load comments. Please refresh, or visit",
    "comments.noServerPrefix":
      "Waline server URL is not configured. Please set",

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
    "legacy.tags.desc":
      "A collection of all post tags. Click a tag to filter related posts.",
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
    "legacy.projects.openSourceDesc":
      "I also contributed to the following open source projects:",
    "legacy.projects.openSourceItem1Name": "Open Source Project Name",
    "legacy.projects.openSourceItem1Desc":
      "- Added new features and fixed bugs.",
    "legacy.projects.openSourceItem2Name": "Another Open Source Project",
    "legacy.projects.openSourceItem2Desc":
      "- Improved documentation and unit tests.",
    "legacy.projects.openSourceFooter":
      "If you have suggestions or want to collaborate, feel free to contact me.",

    "friends.metaTitle": "Friends",
    "friends.metaDescription": "Friend links and exchange requests",
    "friends.pageCrumb": "Friends",
    "friends.title": "Friend Links",
    "friends.lead": "Let's exchange links and share what we build.",
    "friends.listTitle": "Listed links",
    "friends.empty": "No friend links yet. Feel free to be the first one.",
    "friends.applyTitle": "Apply for Link Exchange",
    "friends.applyDesc":
      "You can apply via email, GitHub Issue, or the comments section below.",
    "friends.applyEmail": "Apply by Email",
    "friends.infoTitle": "Suggested information",
    "friends.infoName": "Site name",
    "friends.infoUrl": "Site URL (https://)",
    "friends.infoDesc": "One-line description",
    "friends.infoAvatar": "Avatar or logo URL (optional)",
    "friends.avatarAltSuffix": "avatar",
    "friends.selfInfoTitle": "My Link Info",
    "friends.selfInfoDesc":
      "Use quick-copy or copy a single line and send it directly.",
    "friends.copyAll": "Copy all",
    "friends.copy": "Copy",
    "friends.copied": "Copied",
    "friends.circleTitle": "Friends Circle",
    "friends.circleLead": "Recent updates, shown a few at a time.",
    "friends.circleRefresh": "Shuffle",
    "friends.circleEmpty": "No recent updates were fetched from friend feeds.",

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
