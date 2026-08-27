#!/usr/bin/env node
/**
 * Download pixiv illustrations for use as post covers.
 *
 *   node scripts/fetch-covers.mjs 126327443 134308706 ...
 *   node scripts/fetch-covers.mjs --inbox 126327443 ...   # review first
 *   node scripts/fetch-covers.mjs --from covers.txt
 *   node scripts/fetch-covers.mjs --search 初音ミク --take 8 --inbox
 *   node scripts/fetch-covers.mjs --banner 126327443            # 1920x640
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
// Banner art lives apart from card art: the masthead showing the same
// illustration as a card below it reads as an accident.
const BANNER = process.argv.includes("--banner");
const OUT_DIR = INBOX
  ? join(process.cwd(), ".cover-inbox")
  : join(process.cwd(), "src", "assets", BANNER ? "banner" : "covers");
const WIDTH = BANNER ? 1920 : 1200;
// Banners are not cropped. The element is 100vw by a vh height with
// object-fit: cover, so the viewport decides the visible slice - cropping
// here as well would throw away most of a 4:3 illustration for nothing.
const HEIGHT = BANNER ? null : 630;
const QUALITY = 82;
const PROXY = (id) => `https://pixiv.cat/${id}.jpg`;
const META = (id) => `https://www.pixiv.net/ajax/illust/${id}`;
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "usage: node scripts/fetch-covers.mjs <illust-id...> | --from <file> | --search <tag> [--take N] [--inbox]",
  );
  process.exit(1);
}

/**
 * pixiv's tag search works without a login, unlike the illust endpoint that
 * returns null image urls. mode=safe filters R18 at the source; the rest of
 * the filtering is about whether an image can serve as a banner or card at
 * all - portrait art loses half its frame to a 1200x630 crop, and anything
 * under 1200px wide would be upscaled.
 */
async function searchTag(tag, take) {
  const q = encodeURIComponent(tag);
  const url =
    `https://www.pixiv.net/ajax/search/illustrations/${q}` +
    `?word=${q}&order=popular_d&mode=safe&p=1&s_mode=s_tag&type=illust`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Referer: "https://www.pixiv.net/" },
  });
  const json = await res.json();
  const found = json?.body?.illust?.data ?? [];

  const picks = found.filter((it) => {
    const w = Number(it.width) || 0;
    const h = Number(it.height) || 0;
    if (Number(it.pageCount ?? 1) !== 1) return false;
    if (Number(it.xRestrict ?? 0) !== 0) return false;
    if (w < 1200) return false;
    return w / h >= 1.15;
  });

  console.log(
    `search "${tag}": ${found.length} results, ${picks.length} usable ` +
      `(landscape, >=1200px, single page)\n`,
  );
  for (const it of picks.slice(0, take)) {
    console.log(
      `  ${it.id}  ${it.width}x${it.height}  ${String(it.title).slice(0, 24).padEnd(26)} by ${it.userName}`,
    );
  }
  console.log();
  return picks.slice(0, take).map((it) => String(it.id));
}

async function resolveIds() {
  const searchIndex = args.indexOf("--search");
  if (searchIndex !== -1) {
    const tag = args[searchIndex + 1];
    if (!tag) throw new Error("--search needs a tag");
    const takeIndex = args.indexOf("--take");
    const take = takeIndex === -1 ? 6 : Number(args[takeIndex + 1]) || 6;
    return searchTag(tag, take);
  }
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
  // Card covers crop to the share-card aspect rather than letterboxing, with
  // sharp's attention strategy keeping the subject in frame more often than a
  // plain centre crop. Banners only get scaled - see HEIGHT above.
  const buf = await sharp(original)
    .resize(
      WIDTH,
      HEIGHT,
      HEIGHT === null
        ? { withoutEnlargement: true }
        : { fit: "cover", position: sharp.strategy.attention },
    )
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

console.log(`fetching ${ids.length} image(s) into ${INBOX ? ".cover-inbox" : `src/assets/${BANNER ? "banner" : "covers"}`}/\n`);
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

if (INBOX) {
  // A contact sheet, so picking does not mean opening files one at a time.
  // Each card carries its dominant colour and how warm it is, because the
  // decision here is partly "does this sit with the rest of the site" and
  // that is easier to judge from a swatch than from a thumbnail.
  const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith(".webp")).sort();
  const cards = [];
  for (const f of files) {
    let swatch = "#333";
    let note = "";
    try {
      const stats = await sharp(join(OUT_DIR, f)).stats();
      const { r, g, b } = stats.dominant;
      swatch = `rgb(${r},${g},${b})`;
      // Positive means the red channel leads, negative means blue does.
      const warmth = (r - b) / 255;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      note =
        `${warmth > 0.08 ? "暖" : warmth < -0.08 ? "冷" : "中"} · ` +
        `${lum < 0.35 ? "暗" : lum > 0.68 ? "亮" : "中亮"}`;
    } catch {
      // A file that will not decode is not worth failing the sheet over.
    }
    cards.push(
      `<figure><img src="./${f}" loading="lazy">` +
        `<figcaption><span class="sw" style="background:${swatch}"></span>` +
        `${f.replace(".webp", "")} · ${note}</figcaption></figure>`,
    );
  }
  const html =
    `<!doctype html><meta charset="utf-8"><title>cover inbox</title>` +
    `<style>body{background:#111;color:#ccc;font:14px system-ui;margin:0;padding:1rem}` +
    `.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1rem}` +
    `figure{margin:0}img{width:100%;border-radius:8px;display:block}` +
    `figcaption{padding:.4rem 0;font-size:12px;opacity:.75;display:flex;align-items:center;gap:.4rem}` +
    `.sw{width:14px;height:14px;border-radius:3px;flex:none;border:1px solid #0006}</style>` +
    `<p>留下想要的，移进 src/assets/banner/ 或 src/assets/covers/，其余删掉</p>` +
    `<div class=g>${cards.join("")}</div>`;
  await writeFile(join(OUT_DIR, "index.html"), html);
}

console.log(
  `\ndone: ${credits.length} downloaded, ${failed} failed.` +
    (INBOX
      ? `\nreview: open .cover-inbox/index.html, then move keepers into src/assets/covers/`
      : `\nthe pool in site.config.ts picks these up automatically - no edit needed.`),
);
