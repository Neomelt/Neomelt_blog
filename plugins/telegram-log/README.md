# telegram-log

把一个公开的 Telegram 频道变成博客里的"日常"页：在频道里发一条消息，网站上就多一条记录。

- 不需要服务器、机器人或 token：插件读取的是频道的公开网页版 `t.me/s/<频道名>`。
- 网站构建时抓取最近的消息，包括文字、图片、视频封面、链接卡片、点赞表情和浏览数，排成时间线。
- 图片会下载下来压缩成 webp，放在你自己的网站上，国内访客也能正常看到。

前提是频道必须公开，并且设置了用户名。

## 文件

| 文件                | 作用                               | 依赖                                       |
| ------------------- | ---------------------------------- | ------------------------------------------ |
| `core.mjs`          | 读取频道并解析成数据               | `hast-util-from-html`、`hast-util-to-html` |
| `media.mjs`         | 下载图片、压缩成 webp              | `sharp`                                    |
| `astro.mjs`         | Astro 内容加载器                   | Astro 5 及以上                             |
| `TelegramLog.astro` | 时间线页面组件                     | Astro                                      |
| `bin/check.mjs`     | 定时检查：频道有变化才触发重新构建 | 同 `core.mjs`                              |
| `test/`             | 测试，样例页面是手写的             | vitest                                     |

`core.mjs` 和 `media.mjs` 不依赖任何框架。

## 在 Astro 站点里使用

1. 把整个 `telegram-log` 文件夹复制到项目里，并安装依赖：

   ```sh
   npm i hast-util-from-html hast-util-to-html sharp
   ```

2. 在 `src/content.config.ts` 里加两个集合：

   ```ts
   import {
     telegramChannelLoader,
     telegramLogLoader,
   } from "../plugins/telegram-log/astro.mjs";

   const options = { channel: "你的频道名", limit: 0 };
   const log = defineCollection({ loader: telegramLogLoader(options) });
   const logChannel = defineCollection({
     loader: telegramChannelLoader(options),
   });
   export const collections = { /* 原有的集合, */ log, logChannel };
   ```

3. 新建页面，比如 `src/pages/log.astro`：

   ```astro
   ---
   import { getCollection } from "astro:content";
   import TelegramLog from "../../plugins/telegram-log/TelegramLog.astro";
   const posts = await getCollection("log");
   const [channel] = await getCollection("logChannel");
   ---

   <TelegramLog posts={posts} channel={channel} timeZone="Asia/Shanghai" />
   ```

4. 在 `.gitignore` 里加上 `public/log-media/`，图片是构建时生成的，不用提交。

组件的颜色和圆角读取 `--bg-card`、`--border`、`--text`、`--text-muted`、`--accent`、`--radius-card` 这几个 CSS 变量。你的站点定义了这些变量，组件就跟着你的主题走；没有定义，组件会用自带的默认值。界面文字默认是中文，可以通过 `labels` 属性替换。

## 让新消息自动上线

网站只在构建时读取频道，所以需要一个定时任务来判断什么时候重新构建：

1. 页面同时发布 `/log/latest.json`，里面记录了本次构建所用内容的指纹和保留条数。
2. `bin/check.mjs` 读取这个指纹，再和频道现在的内容比较。
3. 两者不一致时，才触发重新构建；指纹覆盖页面保留窗口，所以新增、删除和编辑都会同步。

可以参考 `.github/workflows/telegram-log.yml`：它每小时检查一次；有变化时调用 Vercel 的 Deploy Hook，并重新运行 GitHub Pages 的部署。只有浏览数和点赞数变化时，不会触发重新构建。

## 在别的框架里使用（Hexo、Hugo、11ty）

在构建前运行一小段 Node 脚本，生成 JSON 和图片，再用各自的模板渲染：

```js
import { writeFile } from "node:fs/promises";
import { fetchChannel } from "./telegram-log/core.mjs";
import { localizeChannelMedia } from "./telegram-log/media.mjs";

const raw = await fetchChannel({ channel: "你的频道名", limit: 0 });
const data = await localizeChannelMedia(raw, {
  outDir: "static/log-media",
  publicPath: "/log-media/",
});
await writeFile("data/log.json", JSON.stringify(data, null, 2));
```

## 限制

- 页面默认保留整个公开频道历史；把 `limit` 设为正数时才限制条数，设为 `0` 表示不限制。
- 贴纸、文件、语音和投票不会显示，这些消息会附上跳转到原帖的链接。
- 视频只显示封面，点击后去 Telegram 观看。
- 每次构建都会重新下载图片，因为 Vercel 这类平台不会保留上一次的构建目录。
- 如果 Telegram 改动了网页结构，解析可能失效，需要更新 `core.mjs`。抓取失败时，构建不会中断，页面会保留上一次成功抓取的内容；如果没有上一次的内容，就显示空状态。

本插件是独立实现，没有使用 BroadcastChannel（AGPL-3.0）的代码。
