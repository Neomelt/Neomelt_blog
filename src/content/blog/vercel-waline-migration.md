---
title: '从 GitHub Pages 到 Vercel 镜像：以及 Giscus -> Waline 评论迁移实录'
description: '把博客改成双平台发布，并把评论系统从 Giscus 迁到 Waline 的一次实战记录。'
pubDate: '2026-02-23'
updatedDate: '2026-02-23'
heroImage: '../../assets/cover.svg'
category: '工程实践'
series: ''
tags: ['Astro', 'Vercel', 'GitHub Pages', 'Waline', '部署', '评论系统']
---

这篇是一次比较实用的站点改造记录：我把博客从单一 GitHub Pages 发布，改成了 GitHub Pages + Vercel 双平台；同时把评论系统从 Giscus 换成 Waline。

中间没什么“高大上设计”，就是一路踩坑一路修。把关键决策和坑点记下来，后面自己维护也省事。

## 先说结果

现在线上是这个状态：

- `www.neomelt.cloud` 走 Vercel（主站）。
- GitHub Pages 继续保留，作为镜像发布链路。
- 评论系统已经切到 Waline，文章页和列表页都能显示阅读量/评论数。
- 计数路径做了统一，不会再出现“同一篇文章两套数据”。

## 为什么要加 Vercel，而不是只用 GitHub Pages

GitHub Pages 本身没问题，我原来也是一直这么跑。  
这次加 Vercel，主要是两个原因：

1. 自定义域名和部署体验更直接，跟 Astro 的适配也顺手。
2. 想保留两条发布链路，某个平台抽风时不至于整站都挂。

这里有个经常让人误解的点：  
**一个域名主机名在 DNS 上只能主要指向一个平台。**

也就是说 `www.neomelt.cloud` 不可能同时“直接”指向 Vercel 和 GitHub Pages。  
如果想做镜像，正确姿势是不同子域名分流，例如：

- `www.neomelt.cloud` -> Vercel
- `neomelt.cloud` -> GitHub Pages

## 这次部署层面我改了什么

站点构建主流程其实没大动，GitHub Actions 还是保留。  
只补了一个关键环境变量，保证 Pages 构建时也能拿到 Waline 地址：

```yaml
env:
  PUBLIC_WALINE_SERVER_URL: ${{ vars.PUBLIC_WALINE_SERVER_URL || secrets.PUBLIC_WALINE_SERVER_URL }}
```

Vercel 这边我没走“再套一层 GitHub Action 推送”，直接让 Vercel 连 Git 仓库自动部署，链路更短，也更不容易出幺蛾子。

## Giscus -> Waline：为什么换，怎么换

我换 Waline 的主要考虑是：

- 想要更可控的后端配置，不完全绑在 GitHub Discussions。
- 以后做评论能力扩展（比如表情、策略、审核）会更灵活。

代码上核心就三块。

第一块是评论组件本体，重写 `Comments.astro`，直接用 Waline client 初始化：

```ts
init({
  el: "#waline",
  serverURL,
  path: walinePath,
  pageview: true,
  comment: true,
});
```

`serverURL` 从 `PUBLIC_WALINE_SERVER_URL` 读取，这样本地和线上都能通过环境变量切换。

第二块是计数组件，我加了一个 `WalineCounter.astro`。  
因为列表页没有评论输入框，但我又想显示文章浏览量和评论数，所以把计数逻辑拆出来单独跑。

第三块是路径标准化。  
这个问题不处理的话，数据一定会裂开：比如同一篇文章从 `/blog/xxx` 和 `/posts/xxx` 进去，会被 Waline 记成两个 path。

我最后统一映射到 `/posts/...`：

```ts
export function getWalinePathForPost(
  postId: string,
  collection: "blog" | "zueg" = "blog",
): string {
  const basePath =
    collection === "zueg" ? `/posts/zueg/${postId}` : `/posts/${postId}`;
  return normalizeWalinePath(basePath);
}
```

另外我把 emoji 包也换了，加入了 bilibili 那套，界面观感比默认的好不少。

## 这次最关键的坑

### 1) Waline API 403

这个坑花的时间最多。  
现象是后端明明起了，但前端请求一直被拒。最后定位到 `SECURE_DOMAINS` 配置和当前访问域名不匹配，导致被拦。

结论很简单：  
域名白名单必须和你真实访问域名一一对应，差一个都可能 403。

### 2) 管理后台初始化

Waline 首次初始化需要走：

- `/ui/register`（首个管理员）
- `/ui/profile`（确认登录状态）

这一步如果卡住，我建议按这个顺序查：

1. 后端环境变量有没有真正生效。
2. 前端 `PUBLIC_WALINE_SERVER_URL` 是否写对。
3. 浏览器缓存/Cookie 是否残留旧状态。

### 3) 页面出现两组统计数字

我自己还踩了个前端层面的坑：页面同时渲染了两组统计文案（中英文各一行），看起来像“数字对不上”。  
最后直接删掉重复行，只保留一组统计展示，问题就消失了。

### 4) 安卓 QQ 内置浏览器看不到评论框

这个坑挺隐蔽：Edge 和 Android 系统浏览器都正常，只有 QQ 内置浏览器不显示评论。  
最后定位到前端加载方式兼容性问题。

我原来是这样加载 Waline 的：

- `<script type="module">`
- 动态 `import("https://unpkg.com/...")`

这套在某些 X5 内核环境下会直接不执行，结果就是评论节点一直空白。  
最终修法是改成 `UMD` 版本，并加双 CDN 回退：

- 首选 `unpkg`
- 失败后自动切 `jsdelivr`

后续又补了一层本地兜底：把 `waline.umd.js` 和 `waline.css` 放到站点 `public/vendor`，前端先尝试同源加载，再走 CDN。  
这样即使 QQ 内置浏览器对第三方 CDN 抽风，也不至于整块评论直接消失。

最终这次调整上线后，`neomelt.cloud` 和 `www.neomelt.cloud` 在安卓 QQ 内置浏览器里都已经能正常显示评论区。  
到这一步，我把评论加载策略就固定成了：

- 同源本地静态资源优先（`/vendor/waline.umd.js`、`/vendor/waline.css`）
- 外部 CDN 仅作为回退路径
- 加载失败时给出页面内可见提示，不再静默失败

## 现在这套方案的取舍

优点很直接：

- 发布链路不再单点。
- 评论系统可控性更高。
- 统计口径统一，数据可信度更高。

代价也有：

- 配置项明显变多（尤其是域名和环境变量）。
- 排障复杂度上升，需要同时看前端、部署平台、Waline 后端。

总体上我觉得这次改造是值得的，维护成本可接受，收益也足够大。

如果你也在做类似迁移，我的建议是：  
先把“路径统一策略”和“环境变量命名”定下来，再动部署，不然很容易边改边乱。
