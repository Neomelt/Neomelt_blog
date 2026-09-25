import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";
import {
  telegramChannelLoader,
  telegramLogLoader,
} from "../plugins/telegram-log/astro.mjs";
import { telegramLog } from "./site.config";
import { TELEGRAM_LOG_CHANNEL } from "./utils/telegram-log";

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      category: z.string().optional(),
      series: z.string().optional(),
      tags: z.array(z.string()).optional(),
      pinned: z.boolean().optional(),
      hidden: z.boolean().default(false),
    }),
});

// 日常: posts from a public Telegram channel, fetched at build time. Both
// collections stay empty while no channel is configured in site.config.ts.
const telegramOptions = {
  channel: TELEGRAM_LOG_CHANNEL,
  limit: telegramLog.limit,
};
const log = defineCollection({ loader: telegramLogLoader(telegramOptions) });
const logChannel = defineCollection({
  loader: telegramChannelLoader(telegramOptions),
});

export const collections = { blog, log, logChannel };
