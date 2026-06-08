import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";

const AVATAR_DIR = path.join(process.cwd(), "public", "avatars");

/** Stable local filename for a remote avatar URL (content-addressed by URL). */
export function avatarFileName(remoteUrl: string): string {
  const hash = createHash("sha1").update(remoteUrl).digest("hex").slice(0, 16);
  return `${hash}.webp`;
}

/**
 * Map a remote avatar URL to its build-time localized copy at
 * /avatars/<hash>.webp when that file exists (populated by the localize-avatars
 * integration before pages render). Falls back to the original remote URL
 * otherwise — e.g. in dev, or if the download failed — so the page never breaks.
 */
export function avatarSrc(remoteUrl?: string): string | undefined {
  if (!remoteUrl || !/^https?:\/\//.test(remoteUrl)) return remoteUrl;
  const name = avatarFileName(remoteUrl);
  return existsSync(path.join(AVATAR_DIR, name))
    ? `/avatars/${name}`
    : remoteUrl;
}
