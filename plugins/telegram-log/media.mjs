/**
 * Copy a channel's images onto the site itself.
 *
 * Telegram serves media from cdn*.telesco.pe, which visitors in mainland
 * China usually cannot reach, and the URLs are signed tokens rather than
 * stable addresses. So every photo, video thumbnail and the channel avatar is
 * downloaded at build time, resized to webp with sharp, and written under a
 * directory the site serves as static files (public/ for Astro).
 *
 * File names come from a hash of the Telegram file token, so the same image
 * keeps the same name across builds and an existing file is not downloaded
 * again. A download that keeps failing drops that one image and is counted,
 * instead of failing the whole site build.
 */
import { createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * @typedef {{ src: string; srcset: string; width: number; height: number }} LocalImage
 */

const exists = (file) =>
  access(file).then(
    () => true,
    () => false,
  );

/** The token after /file/ is what identifies the image; the cdn host varies. @param {string} url */
function mediaKey(url) {
  const token = url.split("/file/").pop() ?? url;
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}

/**
 * @param {string} url
 * @param {{ fetchImpl: typeof fetch; timeoutMs: number; retries: number }} opts
 */
async function download(url, { fetchImpl, timeoutMs, retries }) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < retries)
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastError;
}

/**
 * Run `task` over `items` with at most `limit` in flight.
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} task
 * @returns {Promise<R[]>}
 */
async function pool(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

/**
 * Build a function that turns a remote image URL into local webp files.
 *
 * @param {{
 *   outDir: string;          // filesystem directory, e.g. public/log-media
 *   publicPath: string;      // URL path the site serves outDir at, e.g. log-media/
 *   fetchImpl?: typeof fetch;
 *   timeoutMs?: number;
 *   retries?: number;
 *   quality?: number;
 * }} options
 */
export function createImageLocalizer({
  outDir,
  publicPath,
  fetchImpl = fetch,
  timeoutMs = 20_000,
  retries = 2,
  quality = 78,
}) {
  const prefix = publicPath.endsWith("/") ? publicPath : `${publicPath}/`;
  /** @type {Map<string, Promise<LocalImage | null>>} */
  const seen = new Map();
  let failed = 0;

  /**
   * @param {string} url
   * @param {number[]} widths  target widths; never upscaled
   * @returns {Promise<LocalImage | null>}
   */
  async function localize(url, widths) {
    const key = `${mediaKey(url)}:${widths.join(",")}`;
    if (!seen.has(key)) seen.set(key, work(url, widths));
    return seen.get(key);
  }

  /** @param {string} url @param {number[]} widths */
  async function work(url, widths) {
    const name = mediaKey(url);
    const largest = Math.max(...widths);
    const files = widths.map((w) => path.join(outDir, `${name}-${w}.webp`));
    try {
      let meta;
      if (
        await Promise.all(files.map(exists)).then((all) => all.every(Boolean))
      ) {
        meta = await sharp(
          path.join(outDir, `${name}-${largest}.webp`),
        ).metadata();
      } else {
        const buffer = await download(url, { fetchImpl, timeoutMs, retries });
        await mkdir(outDir, { recursive: true });
        for (const width of widths) {
          const out = await sharp(buffer)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .webp({ quality })
            .toBuffer({ resolveWithObject: true });
          await writeFile(path.join(outDir, `${name}-${width}.webp`), out.data);
          if (width === largest) meta = out.info;
        }
      }
      const variants = widths.map((w) => `${prefix}${name}-${w}.webp ${w}w`);
      return {
        src: `${prefix}${name}-${largest}.webp`,
        srcset: variants.join(", "),
        width: meta?.width ?? largest,
        height: meta?.height ?? largest,
      };
    } catch {
      failed += 1;
      return null;
    }
  }

  return {
    localize,
    /** How many images could not be fetched in this run. */
    get failed() {
      return failed;
    },
  };
}

/**
 * Localize every image referenced by a fetched channel.
 *
 * @param {{ channel: import("./core.mjs").TgChannel; posts: import("./core.mjs").TgPost[] }} data
 * @param {Parameters<typeof createImageLocalizer>[0] & { concurrency?: number }} options
 */
export async function localizeChannelMedia(
  data,
  { concurrency = 4, ...options },
) {
  const localizer = createImageLocalizer(options);

  const avatar = data.channel.avatar
    ? await localizer.localize(data.channel.avatar, [160])
    : null;

  const posts = await pool(data.posts, concurrency, async (post) => {
    const photos = [];
    for (const photo of post.photos) {
      const local = await localizer.localize(photo.url, [640, 1280]);
      if (local) photos.push(local);
    }
    const videos = [];
    for (const video of post.videos) {
      const thumb = video.thumb
        ? await localizer.localize(video.thumb, [640])
        : null;
      videos.push({
        url: video.url,
        duration: video.duration,
        thumb: thumb ?? undefined,
      });
    }
    const missing = post.photos.length - photos.length;
    return { ...post, photos, videos, missingMedia: missing };
  });

  return {
    channel: { ...data.channel, avatar: avatar ?? undefined },
    posts,
    failed: localizer.failed,
  };
}
