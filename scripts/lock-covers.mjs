#!/usr/bin/env node
/**
 * Pin each post to a cover by writing it into the post's own frontmatter.
 *
 *   node scripts/lock-covers.mjs            # assign covers to posts missing one
 *   node scripts/lock-covers.mjs --relock   # reassign everything from scratch
 *   node scripts/lock-covers.mjs --dry-run
 *
 * Without this the mapping is positional: covers are handed out by walking
 * posts in id order, so inserting a post shifts every cover after it. Writing
 * the choice into the post makes it permanent, survives pool changes, and
 * means a new post only needs one unused image rather than a reshuffle -
 * which is what makes this cheap to run from CI.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";

const POSTS_DIR = join(process.cwd(), "src", "content", "blog");
const COVERS_DIR = join(process.cwd(), "src", "assets", "covers");
const REL = "../../assets/covers";
/** Every post ships this as a placeholder; it is not a real assignment. */
const SHARED_DEFAULT = "cover.svg";

const relock = process.argv.includes("--relock");
const dryRun = process.argv.includes("--dry-run");

const covers = (await readdir(COVERS_DIR))
  .filter((f) => /\.(webp|jpg|jpeg|png|avif)$/i.test(f))
  .sort();
if (covers.length === 0) {
  console.error("no covers in src/assets/covers - run `npm run covers <id>` first");
  process.exit(1);
}

const post_missing = (file, cover) =>
  `dropped   ${file}  ->  ${cover} is gone, will reassign`;

const files = (await readdir(POSTS_DIR)).filter((f) => /\.mdx?$/.test(f)).sort();

const readHero = (text) =>
  text.match(/^heroImage:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim() ?? null;

// Pass 1: what is already pinned, so those covers stay claimed.
const posts = [];
const claimed = new Set();
for (const file of files) {
  const text = await readFile(join(POSTS_DIR, file), "utf8");
  const hero = readHero(text);
  // A post pointing at a file that no longer exists counts as unpinned, so
  // deleting a cover you did not like and re-running is all it takes.
  const candidate =
    !relock && hero && !hero.includes(SHARED_DEFAULT) ? basename(hero) : null;
  const pinned = candidate && covers.includes(candidate) ? candidate : null;
  if (candidate && !pinned) {
    console.log(`  ${post_missing(file, candidate)}`);
  }
  if (pinned) claimed.add(pinned);
  posts.push({ file, text, hero, pinned });
}

// Pass 2: hand unclaimed covers to unpinned posts, in order.
const free = covers.filter((c) => !claimed.has(c));
let cursor = 0;
let changed = 0;
let exhausted = 0;

for (const post of posts) {
  if (post.pinned) continue;
  if (cursor >= free.length) {
    exhausted += 1;
    continue;
  }
  const cover = free[cursor++];
  const value = `"${REL}/${cover}"`;
  const next = post.hero
    ? post.text.replace(/^heroImage:.*$/m, `heroImage: ${value}`)
    : post.text.replace(/^(title:.*)$/m, `$1\nheroImage: ${value}`);
  if (next === post.text) continue;
  changed += 1;
  console.log(`  ${dryRun ? "would pin" : "pinned"}  ${post.file}  ->  ${cover}`);
  if (!dryRun) await writeFile(join(POSTS_DIR, post.file), next);
}

console.log(
  `\n${posts.length} posts, ${covers.length} covers.` +
    ` ${posts.filter((p) => p.pinned).length} already pinned, ${changed} ${dryRun ? "would change" : "updated"}.`,
);
if (exhausted > 0) {
  console.log(
    `\n${exhausted} post(s) left without a cover - the pool is short.` +
      ` Run \`npm run covers <id...>\` for ${exhausted} more, then re-run this.`,
  );
}
