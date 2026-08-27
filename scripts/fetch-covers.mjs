#!/usr/bin/env node
/**
 * Download pixiv illustrations for use as post covers.
 *
 *   node scripts/fetch-covers.mjs 126327443 134308706 ...
 *   node scripts/fetch-covers.mjs --inbox 126327443 ...   # review first
 *   node scripts/fetch-covers.mjs --from covers.txt
 *
 * pixiv's own ajax endpoint returns metadata without a login but leaves every
 * entry in `urls` null, so the image itself needs a session cookie. The
 * pixiv.cat proxy serves originals by illust id with no auth, which is what
 * this uses. Originals run to several megabytes, so each one is resized and
 * re-encoded before it ever reaches the repository.
 *
 * Images land in src/assets/covers/ rather than public/ on purpose: only
 * files under src/ go through Astro's image pipeline, which is what produces
 * the hashed, immutable webp the reference blogs serve.
 */
import { mkdir, readFile, readdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

// --inbox keeps downloads out of the repository until they have been looked
// at. pixiv only flags outright R18, so anything merely suggestive arrives
// unmarked and no filter catches it - the decision has to be a human one.
const INBOX = process.argv.includes("--inbox");
const OUT_DIR = INBOX
  ? join(process.cwd(), ".cover-inbox")
  : join(process.cwd(), "src", "assets", "covers");
const WIDTH = 1200;
const HEIGHT = 630;
const QUALITY = 82;
const PROXY = (id) => `https://pixiv.cat/${id}.jpg`;
const META = (id) => `https://www.pixiv.net/ajax/illust/${id}`;
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "usage: node scripts/fetch-covers.mjs <illust-id...> | --from <file>",
  );
  process.exit(1);
}

async function resolveIds() {
  const fromIndex = args.indexOf("--from");
  if (fromIndex === -1) return args.filter((a) => /^\d+$/.test(a));
  const file = args[fromIndex + 1];
  if (!file) throw new Error("--from needs a file path");
  const text = await readFile(file, "utf8");
  return [...text.matchAll(/(\d{6,})/g)].map((m) => m[1]);
}

/** Title and author, for the credits file. Works without a login. */
async function fetchMeta(id) {
  try {
    const res = await fetch(META(id), {
      headers: { "User-Agent": UA, Referer: "https://www.pixiv.net/" },
    });
    const json = await res.json();
    const body = json?.body ?? {};
    return { title: body.illustTitle ?? body.title ?? null, author: body.userName ?? null };
  } catch {
    return { title: null, author: null };
  }
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchOne(id) {
  const out = join(OUT_DIR, `${id}.webp`);
  if (await exists(out)) return { id, skipped: true };

  const res = await fetch(PROXY(id), {
    headers: { "User-Agent": UA, Referer: "https://www.pixiv.net/" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const original = Buffer.from(await res.arrayBuffer());
  // Crop to the card's aspect rather than letterboxing: these are decorative
  // panels, and attention:centre keeps the subject in frame more often than a
  // plain centre crop does.
  const buf = await sharp(original)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: QUALITY })
    .toBuffer();
  await writeFile(out, buf);

  const meta = await fetchMeta(id);
  return {
    id,
    before: original.length,
    after: buf.length,
    ...meta,
  };
}

const ids = [...new Set(await resolveIds())];
if (ids.length === 0) {
  console.error("no illust ids found");
  process.exit(1);
}
await mkdir(OUT_DIR, { recursive: true });

console.log(`fetching ${ids.length} cover(s) into src/assets/covers/\n`);
const credits = [];
let failed = 0;

for (const id of ids) {
  try {
    const r = await fetchOne(id);
    if (r.skipped) {
      console.log(`  = ${id}  already present, skipped`);
      continue;
    }
    const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
    console.log(
      `  + ${id}  ${kb(r.before)} -> ${kb(r.after)}` +
        (r.author ? `  by ${r.author}` : ""),
    );
    credits.push(
      `- [${r.title ?? id}](https://www.pixiv.net/artworks/${id})` +
        (r.author ? ` — ${r.author}` : ""),
    );
  } catch (err) {
    failed += 1;
    console.error(`  ! ${id}  ${err.message}`);
  }
}

if (credits.length > 0) {
  // Keep attribution with the files. These are other people's illustrations.
  const path = join(OUT_DIR, "CREDITS.md");
  const prev = (await exists(path)) ? await readFile(path, "utf8") : "# Cover art\n\n";
  await writeFile(path, prev.trimEnd() + "\n" + credits.join("\n") + "\n");
  console.log(`\ncredits appended to src/assets/covers/CREDITS.md`);
}

if (INBOX && credits.length > 0) {
  // A contact sheet, so picking does not mean opening fifteen files.
  const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith(".webp")).sort();
  const html =
    `<!doctype html><meta charset="utf-8"><title>cover inbox</title>` +
    `<style>body{background:#111;color:#ccc;font:14px system-ui;margin:0;padding:1rem}` +
    `.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem}` +
    `figure{margin:0}img{width:100%;border-radius:8px;display:block}` +
    `figcaption{padding:.4rem 0;font-size:12px;opacity:.7}</style>` +
    `<p>keep what you want, then move it into src/assets/covers/ and run <code>npm run covers:lock</code></p>` +
    `<div class=g>` +
    files
      .map(
        (f) =>
          `<figure><img src="./${f}" loading="lazy"><figcaption>${f}</figcaption></figure>`,
      )
      .join("") +
    `</div>`;
  await writeFile(join(OUT_DIR, "index.html"), html);
}

console.log(
  `\ndone: ${credits.length} downloaded, ${failed} failed.` +
    (INBOX
      ? `\nreview: open .cover-inbox/index.html, then move keepers into src/assets/covers/`
      : `\nthe pool in site.config.ts picks these up automatically - no edit needed.`),
);
