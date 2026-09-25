/**
 * Astro content loaders for a Telegram channel.
 *
 *   // src/content.config.ts
 *   import { telegramLogLoader, telegramChannelLoader } from "../plugins/telegram-log/astro.mjs";
 *   const options = { channel: "my_channel" };
 *   export const collections = {
 *     log: defineCollection({ loader: telegramLogLoader(options) }),
 *     logChannel: defineCollection({ loader: telegramChannelLoader(options) }),
 *   };
 *
 * Both loaders share one fetch per build. When t.me cannot be reached the
 * loaders clear their current stores and warn, so a failed run cannot leave
 * stale entries that point at unavailable generated media.
 */
import path from "node:path";
import { z } from "astro/zod";
import { fetchChannel, postsDigest } from "./core.mjs";
import { localizeChannelMedia } from "./media.mjs";

/**
 * @typedef {{
 *   channel?: string;       // public channel username, without @
 *   limit?: number;         // newest posts to keep (default 0 = all history)
 *   mediaDir?: string;      // where images are written (default public/log-media)
 *   mediaPath?: string;     // URL path of mediaDir, relative to the site base (default log-media/)
 * }} TelegramLogOptions
 */

const imageSchema = z.object({
  src: z.string(),
  srcset: z.string(),
  width: z.number(),
  height: z.number(),
});

export const logPostSchema = z.object({
  url: z.string(),
  date: z.coerce.date(),
  html: z.string(),
  text: z.string(),
  photos: z.array(imageSchema),
  videos: z.array(
    z.object({
      url: z.string(),
      duration: z.string().optional(),
      thumb: imageSchema.optional(),
    }),
  ),
  link: z
    .object({
      url: z.string(),
      siteName: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  forwardedFrom: z
    .object({ name: z.string(), url: z.string().optional() })
    .optional(),
  reactions: z.array(z.object({ emoji: z.string(), count: z.string() })),
  views: z.string().optional(),
  edited: z.boolean(),
  unsupported: z.array(z.string()),
  missingMedia: z.number(),
});

export const logChannelSchema = z.object({
  username: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string(),
  avatar: imageSchema.optional(),
  counters: z.record(z.string(), z.string()),
  limit: z.number(),
  /** Fingerprint of the newest posts; the rebuild check compares against it. */
  digest: z.string(),
  latestId: z.string().optional(),
  fetchedAt: z.coerce.date(),
});

/** @type {Map<string, Promise<any>>} */
const runs = new Map();

/** @param {TelegramLogOptions} options */
function resolve(options) {
  return {
    channel: (options.channel ?? "").trim().replace(/^@/, ""),
    limit: options.limit ?? 0,
    mediaDir:
      options.mediaDir ?? path.join(process.cwd(), "public", "log-media"),
    mediaPath: options.mediaPath ?? "log-media/",
  };
}

/** One fetch + download per build, shared by both loaders. @param {ReturnType<typeof resolve>} o */
function run(o) {
  const key = JSON.stringify(o);
  if (!runs.has(key)) {
    const job = (async () => {
      const raw = await fetchChannel({ channel: o.channel, limit: o.limit });
      const local = await localizeChannelMedia(raw, {
        outDir: o.mediaDir,
        publicPath: o.mediaPath,
      });
      // Digest over the raw posts: an image that failed to download must not
      // make every later check think the channel changed.
      return { ...local, digest: postsDigest(raw.posts) };
    })();
    // A failed run must not be cached, or a retry in `astro dev` would reuse it.
    job.catch(() => runs.delete(key));
    runs.set(key, job);
  }
  return runs.get(key);
}

/** @param {TelegramLogOptions} options */
export function telegramLogLoader(options = {}) {
  const o = resolve(options);
  return {
    name: "telegram-log",
    schema: logPostSchema,
    /** @param {import("astro/loaders").LoaderContext} ctx */
    async load({ store, logger, parseData, generateDigest }) {
      if (!o.channel) {
        store.clear();
        logger.info("no channel configured; the log stays empty");
        return;
      }
      let result;
      try {
        result = await run(o);
      } catch (error) {
        const cleared = store.keys().length;
        store.clear();
        logger.warn(
          `could not read t.me/s/${o.channel} (${error instanceof Error ? error.message : error}); ` +
            `cleared ${cleared} posts from the current build`,
        );
        return;
      }
      store.clear();
      for (const { id, ...post } of result.posts) {
        const data = await parseData({ id, data: post });
        store.set({ id, data, digest: generateDigest(data) });
      }
      logger.info(
        `${result.posts.length} posts from t.me/s/${o.channel}` +
          (result.failed
            ? `, ${result.failed} image(s) could not be downloaded`
            : ""),
      );
    },
  };
}

/** @param {TelegramLogOptions} options */
export function telegramChannelLoader(options = {}) {
  const o = resolve(options);
  return {
    name: "telegram-log-channel",
    schema: logChannelSchema,
    /** @param {import("astro/loaders").LoaderContext} ctx */
    async load({ store, logger, parseData }) {
      if (!o.channel) {
        store.clear();
        return;
      }
      let result;
      try {
        result = await run(o);
      } catch {
        store.clear();
        return; // telegramLogLoader already reported it
      }
      const { channel, posts, digest } = result;
      const data = await parseData({
        id: channel.username,
        data: {
          ...channel,
          limit: o.limit,
          digest,
          latestId: posts[0]?.id,
          fetchedAt: new Date().toISOString(),
        },
      });
      store.clear();
      store.set({ id: channel.username, data });
      logger.info(`channel ${channel.title} (@${channel.username})`);
    },
  };
}
