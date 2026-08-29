# 运维日志

记录仓库外部的配置变更（Vercel / DNSPod / GitHub 仓库设置等）。这些改动不体现在代码 diff 里，只能靠这里留痕。

## 2026-07-18 评论后端迁移至自定义域名（修复大陆无法访问）

**问题**：Waline 评论后端原地址 `comments-db-one.vercel.app`，`*.vercel.app` 域名在大陆被 DNS 污染/SNI 阻断，导致不挂代理时评论区无法加载（主站正常，因为走自定义域名）。

**修复**：给评论后端绑定自定义域名，绕开对 `vercel.app` 的域名级封锁（GFW 封的是域名，不是 Vercel 的 Anycast IP）。

具体变更（均在仓库外）：

| 位置                                | 变更                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Vercel `comments-db` 项目 → Domains | 新增 `comments.neomelt.cloud`（Production）                                     |
| DNSPod `neomelt.cloud`              | 新增 CNAME：`comments` → `9d62719f6da5d6ea.vercel-dns-017.com`（项目专属值）    |
| GitHub 仓库 secret                  | `PUBLIC_WALINE_SERVER_URL` → `https://comments.neomelt.cloud`（Pages 构建链路） |
| Vercel 前端项目 env                 | `PUBLIC_WALINE_SERVER_URL` → 同上，并 Redeploy                                  |

代码零改动：serverURL 完全来自 `PUBLIC_WALINE_SERVER_URL` 环境变量（当时在 `src/components/`，v2.0.0 架构调整后移至 `src/blocks/view/Comments.astro` 与 `src/blocks/behavior/WalineCounter.astro`）。

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

| 步骤       | 内容                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 重建源仓库 | 新建私有仓库 `Neomelt/comments-db`，按官方模板 `walinejs/waline/example` 重建（index.cjs + vercel.json + package.json 等 6 文件），`@waline/vercel` 钉 `1.41.3` 不用 `latest` |
| 重新关联   | Vercel 项目 Settings → Git → Connect `Neomelt/comments-db`                                                                                                                    |
| 触发部署   | 关联后未自动触发，向 main 推空提交触发，构建成功                                                                                                                              |

**验证**（2026-07-25）：SECURE_DOMAINS 随新部署生效（矩阵见待办 #1）；评论数据在
数据库中不受部署影响。注意这次部署实质是服务端升级到 1.41.3（原版本因源丢失不可
考，仅知同为 thinkjs 4 世代）；如有异常，Vercel Deployments 里 Promote 上一个部署
即可回滚。今后升级方式：改仓库里 package.json 的版本号并 push。

## 2026-08-22 评论区垃圾广告 IP 封禁（Vercel WAF）

**问题**：`150.251.158.99`（AS26383 Baxet Group，东京机房 VPS）于 2026-08-13 向评论区
连发 3 条广告（推广 `520menghuan.pages.dev`）。特征表明是批量扫描 Waline 实例的群发
脚本，非定向攻击：一条评论内容是工具自身的目标清单文件名 `waline_targets.txt`（填充
bug 泄露），另一条是同文案的编码错乱版（疑似按 GBK 直发）。现有防线均拦不住：
SECURE_DOMAINS 只校验 Origin/Referer 字符串（脚本可伪造合法值）；IPQPS 默认 60s，
三条间隔均 >9min。

**处置**：Vercel WAF 边缘封禁（Dashboard → `comments-db` 项目 → Firewall →
Configure → IP Blocking），两条规则：

| IP             | Host                                                                 |
| -------------- | -------------------------------------------------------------------- |
| 150.251.158.99 | comments.neomelt.cloud                                               |
| 150.251.158.99 | comments-db-one.vercel.app（旧别名仍在线，扫描器清单里存的可能是它） |

选 WAF 而非 Waline 自带黑名单的理由：边缘拦截不消耗函数调用量、整站生效、免改码
重部署。备选方案留档：`Neomelt/comments-db` 的 index.cjs 传
`disallowIPList: ['150.251.158.99']` 亦可（已对照 1.41.3 源码
`src/controller/comment.js:123-133`：非管理员命中即 403，但只拦发评论接口）。

**验证**（2026-08-22）：规则发布后，两域名带合法 Referer 的评论 API 均仍 200（未误伤
正常流量）。对目标 IP 的实际拦截**未验证**（本机无法伪装来源 IP），待 Firewall 页
blocked 计数或该 IP 是否再发评论来确认。

**遗留待办**：

1. 管理后台 `/ui` 清理已落库的 3 条垃圾评论（标垃圾或删除，喂给反垃圾系统优先标垃圾）。
2. 预期脚本换 IP 再来：届时不再追加单 IP，升级为 `COMMENT_AUDIT=true`（全评论先审
   后显）或确认 Akismet 生效。
3. 旧别名 `comments-db-one.vercel.app` 是否直接删除（大陆本就不可达，留着多一个被扫
   面）——待定。

## 2026-08-29 Vercel 漏投一次部署（四个 commit 滞留）

**问题**：11:01 推送四个 commit（`ed89515` / `e5b9da2` / `6760153` / `cee116d`）后，
主站 46 分钟没有任何变化。Vercel Deployments 列表里**没有对应条目**——不是构建失败
（列表里一条 Error 都没有），是 GitHub 集成压根没触发这次部署。上一条 `faab7a6`
（同一天 10:17）部署正常，前一天也有 8 条，所以集成本身没坏，属于偶发漏投。

**判据**（先分清是 CDN 缓存还是源站没更新）：

```bash
curl -sD - -o /dev/null https://www.neomelt.cloud/about/ | grep -iE 'age|x-vercel-cache|last-modified'
# x-vercel-cache: HIT 且 last-modified 始终不变 → 源站没更新，跟缓存无关
```

再用 GitHub Pages 那份冷备做三方对照，确认产物本身没问题：

```bash
ls dist/_astro/BaseLayout*.js                                   # 本地构建产物名
curl -sI https://neomelt.github.io/Neomelt_blog/_astro/<同名>   # 冷备：200 = 产物正确
curl -sI https://www.neomelt.cloud/_astro/<同名>                # 主站：404 = 卡在 Vercel
```

当时三方结果是：本地与冷备同为 `BaseLayout…C-Pw0cPg.js` 且 200，主站 404。

**处置**：Vercel 控制台的 Redeploy 只会重跑旧 commit，解决不了「新 commit 没部署」。
需要一次新的 deployment 事件，最省事的办法就是再推一个 commit——本条日志的提交即用于
此，一举两得。

**留档的一行判据**（判断线上是否已是新版）：

```bash
curl -s https://www.neomelt.cloud/ | grep -c uiTranslations
# 3 = 旧版（翻译字典还内联在 HTML 里）；0 = 新版已上线
```

这条只在字典外部化（`cee116d`）前后有区分度，日后失效。通用做法仍是比对
`/_astro/` 下带 hash 的文件名。

**注意**：`gh api repos/.../pages/builds/latest` 返回的是 legacy build API 的陈年记录
（会显示 2025 年的构建），**不反映 Actions 部署**，别拿它判断上线状态。
