import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCovers } from "../../scripts/fetch-covers.mjs";
import { findIllustrations } from "../../scripts/pixiv.mjs";

let cwd;
const image = await sharp({
  create: { width: 1800, height: 1000, channels: 3, background: "#627caa" },
})
  .png()
  .toBuffer();
const work = (id, extra = {}) => ({
  id,
  illustTitle: `Title ${id}`,
  userName: "Artist",
  width: 1800,
  height: 1000,
  pageCount: 1,
  illustType: 0,
  xRestrict: 0,
  ...extra,
});
const credit = (id) =>
  `- [Title ${id}](https://www.pixiv.net/artworks/${id}) — Artist`;

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), "neomelt-covers-"));
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await rm(cwd, { recursive: true, force: true });
});

async function put(path, content = image) {
  const file = join(cwd, path);
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, content);
}

function mockDownloads(metadata = {}) {
  return vi.stubGlobal(
    "fetch",
    vi.fn(async (input) => {
      const url = new URL(input);
      if (url.hostname === "pixiv.cat") return new Response(image);
      const id = url.pathname.split("/").at(-1);
      return Response.json({ error: false, body: work(id, metadata) });
    }),
  );
}

describe("cover workflow", () => {
  it("downloads to the inbox, records attribution and preserves the aspect ratio", async () => {
    mockDownloads();
    await runCovers(["123456", "123456"], cwd);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(await readdir(join(cwd, ".cover-inbox"))).toEqual([
      "123456.webp",
      "CREDITS.md",
      "index.html",
    ]);
    expect(
      await readFile(join(cwd, ".cover-inbox/CREDITS.md"), "utf8"),
    ).toContain(credit("123456"));
    expect(
      await sharp(join(cwd, ".cover-inbox/123456.webp")).metadata(),
    ).toMatchObject({ width: 1800, height: 1000 });
    await expect(readdir(join(cwd, "src/assets/covers"))).rejects.toMatchObject(
      { code: "ENOENT" },
    );
  });

  it("deduplicates against the inbox, covers and banner in all supported formats", async () => {
    await put(".cover-inbox/123456.webp");
    await put("src/assets/covers/234567.png");
    await put("src/assets/banner/345678.jpg");
    vi.stubGlobal("fetch", vi.fn());
    await runCovers(["123456", "234567", "345678"], cwd);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    { value: undefined, limit: 3 },
    { value: "1", limit: 1 },
    { value: "2", limit: 2 },
  ])(
    "bounds concurrent downloads and preserves shared records: %s",
    async ({ value, limit }) => {
      const ids = ["123456", "234567", "345678", "456789", "567890"];
      await put(".cover-inbox/discarded.txt", `${ids.join("\n")}\n`);
      await put(
        ".cover-inbox/CREDITS.md",
        `# Cover art\n${credit("999999")}\n`,
      );
      const waiting = [];
      const requests = [];
      let active = 0;
      let maximum = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input) => {
          const url = new URL(input);
          if (url.hostname !== "pixiv.cat")
            return Response.json({
              body: work(url.pathname.split("/").at(-1)),
            });
          const id = url.pathname.match(/\d+/)[0];
          requests.push(id);
          active += 1;
          maximum = Math.max(maximum, active);
          const body = new Promise((resolve) =>
            waiting.push(() => {
              active -= 1;
              resolve(image);
            }),
          );
          return { ok: true, arrayBuffer: () => body };
        }),
      );
      const args = value === undefined ? [] : ["--concurrency", value];
      const download = runCovers([...args, ...ids, ids[0]], cwd);
      await vi.waitFor(() => expect(waiting).toHaveLength(limit));
      expect(requests).toEqual(ids.slice(0, limit));
      for (let finished = 0; finished < ids.length; finished += 1) {
        await vi.waitFor(() => expect(waiting.length).toBeGreaterThan(0));
        waiting.shift()();
      }
      await download;
      expect(maximum).toBe(limit);
      expect(requests.toSorted()).toEqual(ids);
      const credits = await readFile(
        join(cwd, ".cover-inbox/CREDITS.md"),
        "utf8",
      );
      expect(credits).toContain(credit("999999"));
      for (const id of ids) {
        expect(credits.split(credit(id))).toHaveLength(2);
        expect(await readdir(join(cwd, ".cover-inbox"))).toContain(
          `${id}.webp`,
        );
      }
      expect(
        (
          await readFile(join(cwd, ".cover-inbox/discarded.txt"), "utf8")
        ).trim(),
      ).toBe("");
      // A second run must complete without requesting existing works again.
      vi.stubGlobal("fetch", vi.fn());
      await runCovers([...args, ...ids], cwd);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("keeps banner candidates in the inbox and generates a banner import command", async () => {
    mockDownloads();
    await runCovers(["--banner", "123456"], cwd);
    expect(
      await readFile(join(cwd, ".cover-inbox/index.html"), "utf8"),
    ).toContain('<option value="banner" selected>');
    await expect(readdir(join(cwd, "src/assets/banner"))).rejects.toMatchObject(
      { code: "ENOENT" },
    );
  });

  it("imports selected art with credits, assigns a new post and preserves locked covers", async () => {
    await put(".cover-inbox/123456.webp");
    await put(".cover-inbox/CREDITS.md", `# Cover art\n${credit("123456")}\n`);
    await put("src/assets/covers/234567.webp");
    const locked =
      '---\ntitle: "Old"\nheroImage: "../../assets/covers/234567.webp"\n---\nBody\n';
    await put("src/content/blog/old.md", locked);
    await put(
      "src/content/blog/new.md",
      '---\ntitle: "New"\nheroImage: "../../assets/cover.svg"\n---\nBody\n',
    );
    vi.stubGlobal("fetch", vi.fn());
    await runCovers(["--accept", "123456"], cwd);
    const imported = await readFile(join(cwd, "src/assets/covers/123456.webp"));
    expect(await sharp(imported).metadata()).toMatchObject({
      width: 1200,
      height: 630,
    });
    expect(
      await readFile(join(cwd, "src/content/blog/new.md"), "utf8"),
    ).toContain("../../assets/covers/123456.webp");
    expect(await readFile(join(cwd, "src/content/blog/old.md"), "utf8")).toBe(
      locked,
    );
    await runCovers(["--accept", "123456"], cwd);
    expect(await readFile(join(cwd, "src/assets/covers/123456.webp"))).toEqual(
      imported,
    );
    const credits = await readFile(
      join(cwd, "src/assets/covers/CREDITS.md"),
      "utf8",
    );
    expect(credits.split(credit("123456"))).toHaveLength(2);
    await expect(
      readFile(join(cwd, ".cover-inbox/123456.webp")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("imports banners without cropping or assigning post covers", async () => {
    await put(".cover-inbox/123456.webp");
    await put(".cover-inbox/CREDITS.md", credit("123456"));
    await runCovers(["--accept", "--banner", "123456"], cwd);
    expect(
      await sharp(join(cwd, "src/assets/banner/123456.webp")).metadata(),
    ).toMatchObject({ width: 1800, height: 1000 });
    expect(
      await readFile(join(cwd, "src/assets/banner/CREDITS.md"), "utf8"),
    ).toContain(credit("123456"));
    await expect(readdir(join(cwd, "src/assets/covers"))).rejects.toMatchObject(
      { code: "ENOENT" },
    );
  });

  it("validates the full selection before importing any images", async () => {
    await put(".cover-inbox/123456.webp");
    await put(".cover-inbox/CREDITS.md", credit("123456"));
    await expect(
      runCovers(["--accept", "123456", "234567"], cwd),
    ).rejects.toThrow("missing attribution");
    await expect(readdir(join(cwd, "src/assets/covers"))).rejects.toMatchObject(
      { code: "ENOENT" },
    );
  });

  it.each([{ xRestrict: 1 }, { pageCount: 2 }, { userName: null }])(
    "rejects unsuitable or incomplete metadata: %s",
    async (metadata) => {
      mockDownloads(metadata);
      await expect(runCovers(["123456"], cwd)).rejects.toThrow(
        "some candidates failed",
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(await readdir(join(cwd, ".cover-inbox"))).toEqual(["index.html"]);
    },
  );

  it("reports a failed download while keeping successful candidates for review", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input) => {
        const url = new URL(input);
        if (url.hostname === "pixiv.cat") {
          return url.pathname.includes("123456")
            ? new Response(image)
            : new Response("unavailable", { status: 404 });
        }
        return Response.json({
          error: false,
          body: work(url.pathname.split("/").at(-1)),
        });
      }),
    );
    await expect(runCovers(["123456", "234567"], cwd)).rejects.toThrow(
      "some candidates failed",
    );
    expect(await readdir(join(cwd, ".cover-inbox"))).toContain("123456.webp");
    expect(await readdir(join(cwd, ".cover-inbox"))).not.toContain(
      "234567.webp",
    );
  });

  it("discards only selected candidates and their inbox credits", async () => {
    await put(".cover-inbox/123456.webp");
    await put(".cover-inbox/234567.webp");
    await put(
      ".cover-inbox/CREDITS.md",
      `# Cover art\n${credit("123456")}\n${credit("234567")}\n`,
    );
    await put("src/assets/covers/123456.webp");
    await put("src/assets/covers/CREDITS.md", credit("123456"));
    await runCovers(["--discard", "123456"], cwd);
    expect(await readdir(join(cwd, ".cover-inbox"))).not.toContain(
      "123456.webp",
    );
    expect(await readFile(join(cwd, ".cover-inbox/234567.webp"))).toEqual(
      image,
    );
    expect(await readFile(join(cwd, "src/assets/covers/123456.webp"))).toEqual(
      image,
    );
    expect(
      await readFile(join(cwd, "src/assets/covers/CREDITS.md"), "utf8"),
    ).toBe(credit("123456"));
    expect(
      await readFile(join(cwd, ".cover-inbox/CREDITS.md"), "utf8"),
    ).not.toContain(credit("123456"));
    expect(
      await readFile(join(cwd, ".cover-inbox/discarded.txt"), "utf8"),
    ).toBe("123456\n");
    await runCovers(["--discard", "123456"], cwd);
  });

  it("skips discarded art in automatic search and restores it by explicit ID", async () => {
    await put(".cover-inbox/123456.webp");
    await runCovers(["--discard", "123456"], cwd);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          body: { illust: { data: [work("123456")], lastPage: 1 } },
        }),
      ),
    );
    await runCovers(["--search", "tag"], cwd);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await readdir(join(cwd, ".cover-inbox"))).not.toContain(
      "123456.webp",
    );
    mockDownloads();
    await runCovers(["123456"], cwd);
    expect(await readdir(join(cwd, ".cover-inbox"))).toContain("123456.webp");
    expect(
      await readFile(join(cwd, ".cover-inbox/discarded.txt"), "utf8"),
    ).not.toContain("123456");
  });

  it("cleans imported copies while preserving undecided candidates and pool files", async () => {
    await put(".cover-inbox/123456.webp");
    await put(".cover-inbox/234567.webp");
    await put("src/assets/covers/123456.webp");
    await put("src/assets/covers/CREDITS.md", credit("123456"));
    await runCovers(["--clean"], cwd);
    expect(await readdir(join(cwd, ".cover-inbox"))).not.toContain(
      "123456.webp",
    );
    expect(await readFile(join(cwd, ".cover-inbox/234567.webp"))).toEqual(
      image,
    );
    expect(await readFile(join(cwd, "src/assets/covers/123456.webp"))).toEqual(
      image,
    );
    await expect(
      readFile(join(cwd, ".cover-inbox/discarded.txt")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("preserves candidate attribution when a pool credit is missing", async () => {
    await put(".cover-inbox/123456.webp");
    await put(".cover-inbox/CREDITS.md", credit("123456"));
    await put("src/assets/covers/123456.webp");
    await expect(runCovers(["--clean"], cwd)).rejects.toThrow(
      "record attribution",
    );
    expect(await readFile(join(cwd, ".cover-inbox/123456.webp"))).toEqual(
      image,
    );
  });

  it("imports, discards and cleans in one command while preserving undecided art", async () => {
    for (const id of ["123456", "234567", "345678", "456789"])
      await put(`.cover-inbox/${id}.webp`);
    await put(
      ".cover-inbox/CREDITS.md",
      [
        "# Cover art",
        ...["123456", "234567", "345678", "456789"].map(credit),
      ].join("\n"),
    );
    await put("src/assets/covers/456789.webp");
    await put("src/assets/covers/CREDITS.md", credit("456789"));
    await put(
      "src/content/blog/new.md",
      '---\ntitle: "New"\nheroImage: "../../assets/cover.svg"\n---\n',
    );
    await runCovers(
      ["--accept", "123456", "--discard", "234567", "--clean"],
      cwd,
    );
    const files = await readdir(join(cwd, ".cover-inbox"));
    expect(files).toContain("345678.webp");
    for (const id of ["123456", "234567", "456789"])
      expect(files).not.toContain(`${id}.webp`);
    expect(await readdir(join(cwd, "src/assets/covers"))).toEqual([
      "123456.webp",
      "456789.webp",
      "CREDITS.md",
    ]);
    expect(
      await readFile(join(cwd, ".cover-inbox/discarded.txt"), "utf8"),
    ).toBe("234567\n");
    const credits = await readFile(
      join(cwd, "src/assets/covers/CREDITS.md"),
      "utf8",
    );
    expect(credits).toContain(credit("123456"));
    expect(credits).toContain(credit("456789"));
  });

  it("validates deletion selections before importing or cleaning anything", async () => {
    await put(".cover-inbox/123456.webp");
    await put(".cover-inbox/CREDITS.md", credit("123456"));
    await expect(
      runCovers(["--accept", "123456", "--discard", "234567"], cwd),
    ).rejects.toThrow("candidate not found");
    expect(await readFile(join(cwd, ".cover-inbox/123456.webp"))).toEqual(
      image,
    );
    await expect(readdir(join(cwd, "src/assets/covers"))).rejects.toMatchObject(
      { code: "ENOENT" },
    );
  });

  it("supports combined background imports and deletes", async () => {
    await put(".cover-inbox/123456.webp");
    await put(".cover-inbox/234567.webp");
    await put(
      ".cover-inbox/CREDITS.md",
      `${credit("123456")}\n${credit("234567")}\n`,
    );
    await runCovers(
      ["--accept", "--banner", "123456", "--discard", "234567"],
      cwd,
    );
    expect(
      await sharp(join(cwd, "src/assets/banner/123456.webp")).metadata(),
    ).toMatchObject({ width: 1800, height: 1000 });
    expect(
      (await readdir(join(cwd, ".cover-inbox"))).filter((file) =>
        file.endsWith(".webp"),
      ),
    ).toEqual([]);
  });

  it("refreshes a static review page without downloading or mutating candidates", async () => {
    await put(".cover-inbox/123456.webp");
    vi.stubGlobal("fetch", vi.fn());
    expect(await runCovers(["--review"], cwd)).toEqual({
      preview: join(cwd, ".cover-inbox/index.html"),
    });
    const html = await readFile(join(cwd, ".cover-inbox/index.html"), "utf8");
    expect(html).toContain('value="discard"');
    expect(html).toContain('id="clean"');
    expect(html).not.toContain("fetch(");
    expect(await readFile(join(cwd, ".cover-inbox/123456.webp"))).toEqual(
      image,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["--ranking", "daily_r18"],
    ["--ranking", "daily", "--date", "20260230"],
    ["--search", "tag", "--take", "-1"],
    ["--accept", "../123456"],
    ["--ranking", "daily", "--search", "tag"],
    ["--unknown"],
    ["--discard", "../123456"],
    ["--clean", "123456"],
    ["--review", "--accept", "123456"],
    ["--accept", "123456", "--discard", "123456"],
    ["--accept", "--discard", "123456"],
    ["--accept", "123456", "--clean", "234567"],
    ["--concurrency", "0", "123456"],
    ["--concurrency", "7", "123456"],
    ["--concurrency", "1.5", "123456"],
    ["--accept", "123456", "--concurrency", "2"],
  ])("rejects invalid arguments before IO: %s", async (...argv) => {
    vi.stubGlobal("fetch", vi.fn());
    await expect(runCovers(argv, cwd)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
    expect(await readdir(cwd)).toEqual([]);
  });
});

describe("Pixiv discovery", () => {
  it("continues past known IDs and filtered works to fill the next page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input) => {
        const url = new URL(input);
        expect(url.searchParams.get("mode")).toBe("safe");
        const data =
          url.searchParams.get("p") === "1"
            ? [
                work("123456"),
                work("234567", { xRestrict: 1 }),
                work("345678", { width: 800 }),
              ]
            : [work("456789")];
        return Response.json({ body: { illust: { data, lastPage: 2 } } });
      }),
    );
    expect(
      await findIllustrations({ search: "tag", take: 1 }, new Set(["123456"])),
    ).toEqual(["456789"]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("reads normal illustration rankings with an explicit date", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input) => {
        const url = new URL(input);
        expect(url.searchParams.get("mode")).toBe("weekly");
        expect(url.searchParams.get("date")).toBe("20261030");
        expect(url.searchParams.get("content")).toBe("illust");
        return Response.json({
          contents: [
            {
              illust_id: 123456,
              width: 1800,
              height: 1000,
              illust_type: "0",
              illust_page_count: "1",
              illust_content_type: { sexual: 0 },
            },
          ],
          next: false,
        });
      }),
    );
    expect(
      await findIllustrations(
        { ranking: "weekly", date: "20261030", take: 1 },
        new Set(),
      ),
    ).toEqual(["123456"]);
  });

  it.each([
    Response.json({ body: {} }),
    Response.json({ error: true, message: "login required" }),
    new Response("blocked", { status: 403 }),
  ])("fails on upstream errors and schema changes", async (response) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response),
    );
    await expect(
      findIllustrations({ search: "tag", take: 1 }, new Set()),
    ).rejects.toThrow();
  });
});
