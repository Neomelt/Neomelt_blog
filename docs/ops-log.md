# 运维日志

记录仓库外部的配置变更（Vercel / DNSPod / GitHub 仓库设置等）。这些改动不体现在代码 diff 里，只能靠这里留痕。

## 2026-07-18 评论后端迁移至自定义域名（修复大陆无法访问）

**问题**：Waline 评论后端原地址 `comments-db-one.vercel.app`，`*.vercel.app` 域名在大陆被 DNS 污染/SNI 阻断，导致不挂代理时评论区无法加载（主站正常，因为走自定义域名）。

**修复**：给评论后端绑定自定义域名，绕开对 `vercel.app` 的域名级封锁（GFW 封的是域名，不是 Vercel 的 Anycast IP）。

具体变更（均在仓库外）：

| 位置 | 变更 |
| --- | --- |
| Vercel `comments-db` 项目 → Domains | 新增 `comments.neomelt.cloud`（Production） |
| DNSPod `neomelt.cloud` | 新增 CNAME：`comments` → `9d62719f6da5d6ea.vercel-dns-017.com`（项目专属值） |
| GitHub 仓库 secret | `PUBLIC_WALINE_SERVER_URL` → `https://comments.neomelt.cloud`（Pages 构建链路） |
| Vercel 前端项目 env | `PUBLIC_WALINE_SERVER_URL` → 同上，并 Redeploy |

代码零改动：serverURL 完全来自 `PUBLIC_WALINE_SERVER_URL` 环境变量（`src/components/Comments.astro`、`src/components/WalineCounter.astro`）。

**验证**（2026-07-18）：

- `www.neomelt.cloud` 与 `neomelt.github.io/Neomelt_blog/` 页面内联的 serverURL 均为新域名
- 新域名 API 带前端 Origin 请求返回 `{"errno":0,...}`，管理后台路径 200
- 旧地址 `comments-db-one.vercel.app` 仍保留为别名，未删除

**遗留待办**：

1. `SECURE_DOMAINS` 疑似未生效：任意来源的 GET 请求评论 API 均返回 200（POST 未测）。建议在 comments-db 项目设 `SECURE_DOMAINS=neomelt.cloud,www.neomelt.cloud,comments.neomelt.cloud` 并 redeploy。
2. 现状与《从 GitHub Pages 到 Vercel 镜像》一文不符：裸域 `neomelt.cloud` 实际是 Vercel 的 308 跳转到 `www`，GitHub Pages 未绑自定义域名（仅 `neomelt.github.io` 可达），"双平台镜像"目前只有单入口。是否恢复原设计待定。
