#!/usr/bin/env node
/** Download candidates, then import the IDs selected in the contact sheet. */
import { execFile } from "node:child_process";
import {
  access,
  mkdir,
  readFile,
  readdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs, promisify } from "node:util";
import sharp from "sharp";
import {
  fetchIllustration,
  fetchOriginal,
  findIllustrations,
} from "./pixiv.mjs";
import { writeInboxIndex } from "./cover-review.mjs";

const exec = promisify(execFile);
const IMAGE = /^(\d+)\.(?:webp|jpe?g|png|avif)$/i;
const HELP = `Pixiv cover candidates and reviewed imports.

  npm run covers -- --ranking daily --take 8
  npm run covers -- --search "<标签>" --take 8
  npm run covers -- 126327443 134308706
  npm run covers -- --from covers.txt
  npm run covers -- --review
  npm run covers -- --accept 126327443
  npm run covers -- --accept --banner 134308706
  npm run covers -- --discard 126327443
  npm run covers -- --clean
  npm run covers -- --accept 126327443 --discard 134308706 --clean

Options:
  --ranking daily|weekly|monthly   All-ages illustration rankings
  --date YYYYMMDD                 Ranking date (default: latest)
  --search TAG                    Tag search, all ages
  --take N                        Up to N new candidates, 1–50 (default: 6)
  --concurrency N                 Concurrent downloads, 1–6 (default: 3)
  --from FILE                     Read artwork IDs or URLs from a file
  --inbox                         Candidates always go to .cover-inbox/
  --review                        Refresh and open the static preview page
  --accept                        Import reviewed IDs and assign covers
  --discard                       Delete candidates and skip future auto-fetches
  --clean                         Remove inbox copies already imported
  --banner                        Select or import uncropped background art
  --help

Search and rankings read at most five pages. Review .cover-inbox/index.html
before --accept. Image downloads allow 60s and two retries. Failed requests
exit nonzero. Deletion only affects .cover-inbox/.`;

function optionsFor(argv) {
  const { values, positionals, tokens } = parseArgs({
    args: argv,
    tokens: true,
    allowPositionals: true,
    options: {
      ranking: { type: "string" },
      date: { type: "string" },
      search: { type: "string" },
      take: { type: "string" },
      concurrency: { type: "string" },
      from: { type: "string" },
      inbox: { type: "boolean" },
      accept: { type: "boolean" },
      discard: { type: "boolean" },
      clean: { type: "boolean" },
      review: { type: "boolean" },
      banner: { type: "boolean" },
      help: { type: "boolean" },
    },
  });
  if (values.help) return values;
  const sourcesWithFlags = [
    "ranking",
    "date",
    "search",
    "take",
    "concurrency",
    "from",
    "inbox",
  ].some((key) => values[key] !== undefined);
  if (values.review) {
    if (
      positionals.length ||
      sourcesWithFlags ||
      values.accept ||
      values.discard ||
      values.clean
    ) {
      throw new Error(
        "--review does not take another action or a download source",
      );
    }
    return values;
  }
  if (positionals.some((id) => !/^\d+$/.test(id)))
    throw new Error("artwork IDs must contain digits only");
  if (values.accept || values.discard || values.clean) {
    if (sourcesWithFlags)
      throw new Error("reviewed actions do not take a download source");
    const plan = { accept: [], discard: [] };
    const actions = ["accept", "discard"].filter((name) => values[name]);
    let action = actions.length === 1 ? actions[0] : null;
    for (const token of tokens) {
      if (
        token.kind === "option" &&
        ["accept", "discard", "clean"].includes(token.name)
      )
        action = token.name === "clean" ? null : token.name;
      if (token.kind === "positional") {
        if (!action)
          throw new Error("place artwork IDs after --accept or --discard");
        plan[action].push(token.value);
      }
    }
    for (const name of ["accept", "discard"]) {
      plan[name] = [...new Set(plan[name])];
      if (values[name] && !plan[name].length)
        throw new Error(`--${name} requires artwork IDs`);
    }
    if (values.banner && !plan.accept.length)
      throw new Error("--banner requires images to import");
    if (plan.accept.some((id) => plan.discard.includes(id)))
      throw new Error(
        "an artwork cannot be imported and discarded in the same command",
      );
    return { ...values, plan };
  }
  const sources = [
    values.ranking !== undefined,
    values.search !== undefined,
    values.from !== undefined,
    positionals.length > 0,
  ].filter(Boolean);
  if (sources.length !== 1)
    throw new Error("choose one source: IDs, --from, --search or --ranking");
  if (
    values.ranking !== undefined &&
    !["daily", "weekly", "monthly"].includes(values.ranking)
  ) {
    throw new Error("--ranking must be daily, weekly or monthly");
  }
  if (values.search !== undefined && !values.search.trim())
    throw new Error("--search needs a tag");
  if (values.from !== undefined && !values.from.trim())
    throw new Error("--from needs a file path");
  if (values.date !== undefined) {
    const iso = values.date.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
    if (
      !values.ranking ||
      !/^\d{8}$/.test(values.date) ||
      Number.isNaN(Date.parse(iso)) ||
      new Date(iso).toISOString().slice(0, 10) !== iso
    ) {
      throw new Error("--date requires --ranking and a valid YYYYMMDD date");
    }
  }
  const take = Number(values.take ?? 6);
  if (
    !Number.isInteger(take) ||
    take < 1 ||
    take > 50 ||
    (values.take !== undefined && !values.search && !values.ranking)
  ) {
    throw new Error(
      "--take requires --search or --ranking and an integer from 1 to 50",
    );
  }
  const concurrency = Number(values.concurrency ?? 3);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 6)
    throw new Error("--concurrency must be an integer from 1 to 6");
  return { ...values, take, concurrency, ids: [...new Set(positionals)] };
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function images(dir) {
  try {
    return (await readdir(dir)).filter((file) => IMAGE.test(file)).sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function readCredits(dir) {
  const file = join(dir, "CREDITS.md");
  const text = (await exists(file))
    ? await readFile(file, "utf8")
    : "# Cover art\n";
  const entries = new Map();
  for (const line of text.split("\n")) {
    const id = creditId(line);
    if (id) entries.set(id, line);
  }
  return { text, entries };
}

function creditId(line) {
  return line.match(/^- .*\(https:\/\/www\.pixiv\.net\/artworks\/(\d+)\)/)?.[1];
}

async function appendCredits(dir, additions) {
  const { text, entries } = await readCredits(dir);
  const lines = additions
    .filter(([id]) => !entries.has(id))
    .map(([, line]) => line);
  if (lines.length)
    await writeFile(
      join(dir, "CREDITS.md"),
      `${text.trimEnd()}\n${lines.join("\n")}\n`,
    );
}

function creditLine(id, { title, author }) {
  const clean = (text) => text.replace(/\s+/g, " ").replace(/[\\[\]]/g, "\\$&");
  return `- [${clean(title)}](https://www.pixiv.net/artworks/${id}) — ${clean(author)}`;
}

async function importedIds(dirs) {
  return new Set(
    (await images(dirs.covers))
      .concat(await images(dirs.banner))
      .map((file) => file.match(IMAGE)[1]),
  );
}

async function refreshInbox(dirs, banner) {
  const imported = await importedIds(dirs);
  const files = await images(dirs.inbox);
  await mkdir(dirs.inbox, { recursive: true });
  await writeInboxIndex(
    dirs.inbox,
    files.filter((file) => !imported.has(file.match(IMAGE)[1])),
    {
      banner,
      importedCopies: files.filter((file) => imported.has(file.match(IMAGE)[1]))
        .length,
    },
  );
}

async function readDiscarded(inbox) {
  const file = join(inbox, "discarded.txt");
  return new Set(
    (await exists(file))
      ? ((await readFile(file, "utf8")).match(/^\d+$/gm) ?? [])
      : [],
  );
}

async function checkDiscard(dirs, ids) {
  const discarded = await readDiscarded(dirs.inbox);
  const candidates = new Set(
    (await images(dirs.inbox)).map((file) => file.match(IMAGE)[1]),
  );
  for (const id of ids)
    if (!discarded.has(id) && !candidates.has(id))
      throw new Error(`${id}: candidate not found`);
}

async function removeCandidates(dirs, ids, discard = false) {
  const selected = new Set(ids);
  const files = (await images(dirs.inbox)).filter((file) =>
    selected.has(file.match(IMAGE)[1]),
  );
  if (discard) {
    const discarded = await readDiscarded(dirs.inbox);
    await mkdir(dirs.inbox, { recursive: true });
    await writeFile(
      join(dirs.inbox, "discarded.txt"),
      [...new Set([...discarded, ...ids])].sort().join("\n") + "\n",
    );
  }
  for (const file of files) await unlink(join(dirs.inbox, file));
  if (files.length) {
    const { text } = await readCredits(dirs.inbox);
    await writeFile(
      join(dirs.inbox, "CREDITS.md"),
      text
        .split("\n")
        .filter((line) => !selected.has(creditId(line)))
        .join("\n"),
    );
  }
  return files.length;
}

async function cleanableIds(dirs, ids) {
  const imported = await importedIds(dirs);
  const candidates = new Set(
    (await images(dirs.inbox)).map((file) => file.match(IMAGE)[1]),
  );
  const selected = (ids ?? [...candidates]).filter(
    (id) => candidates.has(id) && imported.has(id),
  );
  const credits = new Set([
    ...(await readCredits(dirs.covers)).entries.keys(),
    ...(await readCredits(dirs.banner)).entries.keys(),
  ]);
  for (const id of selected)
    if (!credits.has(id))
      throw new Error(
        `${id}: record attribution in the pool before cleaning its candidate`,
      );
  return selected;
}

async function cleanImported(dirs, ids) {
  return removeCandidates(dirs, await cleanableIds(dirs, ids));
}

async function acceptReviewed(options, cwd, dirs) {
  const target = options.banner ? dirs.banner : dirs.covers;
  const { entries } = await readCredits(dirs.inbox);
  const existing = new Set(
    (await images(target)).map((file) => file.match(IMAGE)[1]),
  );
  const pending = [];
  // Validate and encode the whole selection before adding it to the pool.
  for (const id of options.ids) {
    if (existing.has(id)) continue;
    if (!entries.has(id))
      throw new Error(`${id}: missing attribution in .cover-inbox/CREDITS.md`);
    const src = join(dirs.inbox, `${id}.webp`);
    if (!(await exists(src)))
      throw new Error(`${id}: candidate file missing from .cover-inbox/`);
    const buffer = await sharp(src)
      .resize(
        options.banner ? 1920 : 1200,
        options.banner ? null : 630,
        options.banner
          ? { withoutEnlargement: true }
          : { fit: "cover", position: sharp.strategy.attention },
      )
      .webp({ quality: 82 })
      .toBuffer();
    pending.push({ id, buffer });
  }
  await mkdir(target, { recursive: true });
  await appendCredits(
    target,
    pending.map(({ id }) => [id, entries.get(id)]),
  );
  for (const { id, buffer } of pending) {
    await writeFile(join(target, `${id}.webp`), buffer, { flag: "wx" });
    console.log(`  imported ${id} -> ${options.banner ? "banner" : "covers"}`);
  }
  if (!options.banner) {
    const { stdout } = await exec(
      process.execPath,
      [fileURLToPath(new URL("./lock-covers.mjs", import.meta.url))],
      { cwd },
    );
    process.stdout.write(stdout);
  }
  return {
    imported: pending.length,
    removed: await cleanImported(dirs, options.ids),
  };
}

export async function runCovers(argv, cwd = process.cwd()) {
  const options = optionsFor(argv);
  if (options.help) {
    console.log(HELP);
    return;
  }
  const dirs = {
    inbox: join(cwd, ".cover-inbox"),
    covers: join(cwd, "src/assets/covers"),
    banner: join(cwd, "src/assets/banner"),
  };
  if (options.review) {
    await refreshInbox(dirs, options.banner);
    return { preview: join(dirs.inbox, "index.html") };
  }
  if (options.plan) {
    const { accept, discard } = options.plan;
    await checkDiscard(dirs, discard);
    // Validate --clean preconditions before any writes; cleanImported repeats the call.
    if (options.clean) await cleanableIds(dirs);
    let result = { imported: 0, removed: 0 };
    if (accept.length)
      result = await acceptReviewed(
        { ids: accept, banner: options.banner },
        cwd,
        dirs,
      );
    if (discard.length)
      result.removed += await removeCandidates(dirs, discard, true);
    if (options.clean) result.removed += await cleanImported(dirs);
    await refreshInbox(dirs, options.banner);
    console.log(
      `${result.imported} imported, ${result.removed} inbox image(s) removed.`,
    );
    return;
  }
  const imported = await importedIds(dirs);
  const discarded = await readDiscarded(dirs.inbox);
  const known = new Set([
    ...imported,
    ...(await images(dirs.inbox)).map((file) => file.match(IMAGE)[1]),
  ]);
  let ids = options.ids;
  if (options.from) {
    const text = await readFile(resolve(cwd, options.from), "utf8");
    ids = [...new Set([...text.matchAll(/\b\d{6,}\b/g)].map(([id]) => id))];
    if (ids.length === 0)
      throw new Error("no artwork IDs found in --from file");
  }
  if (options.search || options.ranking) {
    ids = await findIllustrations(options, new Set([...known, ...discarded]));
    console.log(
      `${ids.length} new candidates selected (up to ${options.take}).`,
    );
  }
  const skipped = ids.filter((id) => known.has(id)).length;
  if (skipped) console.log(`${skipped} already downloaded, skipped.`);
  ids = ids.filter((id) => !known.has(id));
  await mkdir(dirs.inbox, { recursive: true });
  let downloaded = 0;
  const failures = [];
  const pending = ids.values();
  let writeQueue = Promise.resolve();
  async function worker() {
    for (const id of pending) {
      try {
        const meta = await fetchIllustration(id);
        const original = await fetchOriginal(id);
        const buffer = await sharp(original)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        // Workers share attribution and discard records; serialize their writes.
        const saved = writeQueue.then(async () => {
          await appendCredits(dirs.inbox, [[id, creditLine(id, meta)]]);
          await writeFile(join(dirs.inbox, `${id}.webp`), buffer, {
            flag: "wx",
          });
          if (discarded.delete(id))
            await writeFile(
              join(dirs.inbox, "discarded.txt"),
              [...discarded].sort().join("\n") + "\n",
            );
        });
        writeQueue = saved.catch(() => {});
        await saved;
        downloaded += 1;
        console.log(`  downloaded ${id} — ${meta.title} / ${meta.author}`);
      } catch (error) {
        failures.push(`${id}: ${error.message}`);
        console.error(`  failed ${failures.at(-1)}`);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(options.concurrency, ids.length) }, worker),
  );
  await refreshInbox(dirs, options.banner);
  console.log(
    `${downloaded} downloaded, ${failures.length} failed. Review: npm run covers -- --review${options.banner ? " --banner" : ""}`,
  );
  if (failures.length)
    throw new Error(
      "some candidates failed; successful downloads remain in .cover-inbox/",
    );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  runCovers(process.argv.slice(2))
    .then((review) => {
      if (!review) return;
      console.log(`Cover preview: ${review.preview}`);
      execFile("xdg-open", [review.preview], (error) => {
        if (error)
          console.error(
            `Could not open the browser: ${error.message}. Open ${review.preview}`,
          );
      });
    })
    .catch((error) => {
      console.error(`[covers] ${error.message}`);
      process.exitCode = 1;
    });
}
