import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { FRIEND_LINKS } from "../data/friends";
import { avatarFileName } from "./avatar";

const AVATAR_DIR = path.join(process.cwd(), "public", "avatars");
const SIZE = 128;
const TIMEOUT_MS = 8000;

/**
 * Download every friend avatar once, re-encode to a small square webp, and
 * cache it under public/avatars/. Run from an `astro:build:start` hook so it
 * happens on any build (local, Vercel, CI) before pages render — avatarSrc()
 * then rewrites friend/circle avatars to these same-origin copies, removing the
 * per-visitor cost of ~24 third-party avatar hosts. Best-effort: a failed
 * download just falls back to the remote URL and never fails the build.
 */
export async function localizeAvatars(): Promise<void> {
  const urls = Array.from(
    new Set(
      FRIEND_LINKS.map((friend) => friend.avatar).filter(
        (url): url is string =>
          typeof url === "string" && /^https?:\/\//.test(url),
      ),
    ),
  );
  if (urls.length === 0) return;

  await mkdir(AVATAR_DIR, { recursive: true });

  const stats = { downloaded: 0, cached: 0, failed: 0 };
  await Promise.all(
    urls.map(async (url) => {
      const outPath = path.join(AVATAR_DIR, avatarFileName(url));
      if (existsSync(outPath)) {
        stats.cached += 1;
        return;
      }
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!response.ok) {
          stats.failed += 1;
          return;
        }
        const input = Buffer.from(await response.arrayBuffer());
        await sharp(input)
          .resize(SIZE, SIZE, { fit: "cover" })
          .webp({ quality: 82 })
          .toFile(outPath);
        stats.downloaded += 1;
      } catch {
        stats.failed += 1;
      }
    }),
  );

  console.log(
    `[localize-avatars] ${urls.length} avatars — downloaded ${stats.downloaded}, cached ${stats.cached}, failed ${stats.failed} (failures fall back to remote)`,
  );
}
