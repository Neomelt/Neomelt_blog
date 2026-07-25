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

1. ✅ 2026-07-25 已配置：`SECURE_DOMAINS=neomelt.cloud,www.neomelt.cloud,comments.neomelt.cloud,neomelt.github.io`（含镜像域，见下一条日志的部署过程）。生效验证：四个白名单 Origin 均 200；伪造 Origin 与无 Origin/Referer 的直连均 403；`/ui/` 可达。浏览器同源请求靠 Referer 兜底放行。若本地 `npm run dev` 评论区 403，往值里追加 `localhost` 即可。
2. ✅ 2026-07-25 已决策：**维持单入口**。apex 308 → www，唯一生产源为 Vercel；GitHub Pages 镜像不绑自定义域名，仅作 `neomelt.github.io/Neomelt_blog/` 冷备（Actions 持续自动部署），Vercel 长时间故障时手动分发该地址。理由：流通链接全是 www，裸域镜像保护不了它们，双入口只增加维护面（GH 构建 base 路径、CNAME、版本时差、SECURE_DOMAINS 多一项）；将来若真要高可用，升级路径是 Vercel 前套 Cloudflare，而非 apex 分流。文章已加更新注记。

## 2026-07-25 评论后端部署源重建（修复孤儿部署）

**问题**：配置 SECURE_DOMAINS 时发现 Vercel `comments-db` 项目 Redeploy 报
"The provided GitHub repository can't be found"——当初 vercel.com/new 建项目时
生成的 GitHub 源仓库已被删除，项目成了孤儿部署：线上服务正常，但**永远无法产生
新部署**，任何配置变更（环境变量、版本升级、换库）都被堵死。

**修复**：

| 步骤 | 内容 |
| --- | --- |
| 重建源仓库 | 新建私有仓库 `Neomelt/comments-db`，按官方模板 `walinejs/waline/example` 重建（index.cjs + vercel.json + package.json 等 6 文件），`@waline/vercel` 钉 `1.41.3` 不用 `latest` |
| 重新关联 | Vercel 项目 Settings → Git → Connect `Neomelt/comments-db` |
| 触发部署 | 关联后未自动触发，向 main 推空提交触发，构建成功 |

**验证**（2026-07-25）：SECURE_DOMAINS 随新部署生效（矩阵见待办 #1）；评论数据在
数据库中不受部署影响。注意这次部署实质是服务端升级到 1.41.3（原版本因源丢失不可
考，仅知同为 thinkjs 4 世代）；如有异常，Vercel Deployments 里 Promote 上一个部署
即可回滚。今后升级方式：改仓库里 package.json 的版本号并 push。
