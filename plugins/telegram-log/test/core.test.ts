import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import {
  assertChannelName,
  fetchChannel,
  parseChannelPage,
  postsDigest,
} from "../core.mjs";
import { createImageLocalizer } from "../media.mjs";

const fixture = readFileSync(
  new URL("./fixtures/channel.html", import.meta.url),
  "utf8",
);
const page = parseChannelPage(fixture, "test_log");
const byId = Object.fromEntries(page.posts.map((post) => [post.id, post]));

describe("parseChannelPage", () => {
  it("reads the channel header", () => {
    expect(page.info).toEqual({
      username: "test_log",
      title: "Test Channel",
      description: "A test channel",
      avatar: "https://cdn5.telesco.pe/file/AVATAR.jpg",
      url: "https://t.me/test_log",
      counters: { subscribers: "1.5K", photos: "42" },
    });
  });

  it("returns the cursor for the next, older page", () => {
    expect(page.before).toBe("100");
  });

  it("skips service messages and keeps the rest in page order", () => {
    expect(page.posts.map((post) => post.id)).toEqual(["102", "103", "106"]);
  });

  it("reads meta: date, views, edited flag, reactions, forward", () => {
    const post = byId["102"];
    expect(post.url).toBe("https://t.me/test_log/102");
    expect(post.date).toBe("2026-02-03T04:05:06+00:00");
    expect(post.views).toBe("1.2K");
    expect(post.edited).toBe(true);
    expect(post.reactions).toEqual([
      { emoji: "❤", count: "3" },
      { emoji: "👍", count: "1" },
    ]);
    expect(post.forwardedFrom).toEqual({
      name: "Other Channel",
      url: "https://t.me/other_channel",
    });
    expect(byId["103"].edited).toBe(false);
  });

  it("keeps a quoted reply out of the message text", () => {
    expect(byId["102"].text).not.toContain("quoted text");
    expect(byId["102"].text.startsWith("Hello bold 😊\nline two")).toBe(true);
  });

  it("rebuilds the text from an allowlist", () => {
    const { html } = byId["102"];
    expect(html).toContain("<b>bold</b>");
    expect(html).toContain("😊");
    expect(html).not.toContain("telegram.org/img/emoji");
    expect(html).toContain("<br>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("</a> bad <a"); // the text stays, the link goes
    expect(html).toContain('href="https://t.me/s/test_log?q=%23diary"');
    expect(html).toContain(
      '<a href="https://example.com/x" target="_blank" rel="noopener noreferrer nofollow">ok</a>',
    );
    expect(html).toContain('<span class="tlog-spoiler">secret</span>');
  });

  it("reads photos, albums, videos and link previews", () => {
    expect(byId["102"].photos).toEqual([
      { url: "https://cdn4.telesco.pe/file/PHOTO_ONE.jpg", ratio: 0.75 },
    ]);
    expect(byId["103"].photos.map((photo) => photo.url)).toEqual([
      "https://cdn5.telesco.pe/file/ALBUM_A.jpg",
      "https://cdn5.telesco.pe/file/ALBUM_B.jpg",
      "https://cdn5.telesco.pe/file/ALBUM_C.jpg",
    ]);
    expect(byId["103"].videos).toEqual([
      {
        url: "https://t.me/test_log/103?single",
        thumb: "https://cdn5.telesco.pe/file/VIDEO_THUMB.jpg",
        duration: "0:42",
      },
    ]);
    expect(byId["103"].link).toEqual({
      url: "https://example.org/article",
      siteName: "Example",
      title: "An Article",
      description: "What it is about",
    });
  });

  it("flags media the page cannot show", () => {
    expect(byId["106"].unsupported).toEqual(["sticker"]);
    expect(byId["102"].unsupported).toEqual([]);
  });
});

describe("postsDigest", () => {
  const posts = page.posts;

  it("ignores view and reaction counts, which change all the time", () => {
    const busier = posts.map((post) => ({
      ...post,
      views: "99K",
      reactions: [{ emoji: "🔥", count: "50" }],
    }));
    expect(postsDigest(busier)).toBe(postsDigest(posts));
  });

  it("changes when a post is edited or added", () => {
    const edited = posts.map((post) =>
      post.id === "103" ? { ...post, text: "new words" } : post,
    );
    expect(postsDigest(edited)).not.toBe(postsDigest(posts));
    const added = [...posts, { ...posts[0], id: "200" }];
    expect(postsDigest(added)).not.toBe(postsDigest(posts));
  });

  it("does not depend on input order", () => {
    expect(postsDigest([...posts].reverse())).toBe(postsDigest(posts));
  });
});

describe("assertChannelName", () => {
  it("accepts usernames and rejects anything that could reshape the URL", () => {
    expect(() => assertChannelName("test_log")).not.toThrow();
    for (const bad of [
      "",
      "ab",
      "../etc",
      "a/b",
      "name?x=1",
      "1abc",
      "x".repeat(40),
    ]) {
      expect(() => assertChannelName(bad)).toThrow();
    }
  });
});

describe("fetchChannel", () => {
  const html = (id: number, before: number | null) =>
    fixture
      .replaceAll("test_log/102", `test_log/${id}`)
      .replace('data-before="100"', before ? `data-before="${before}"` : "")
      .replace('href="/s/test_log?before=100"', "");

  it("walks back through pages until it has enough posts", async () => {
    const seen: string[] = [];
    const fakeFetch = (async (url: string) => {
      seen.push(url);
      const body = url.endsWith("before=500")
        ? html(400, null)
        : html(900, 500);
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    const result = await fetchChannel({
      channel: "test_log",
      limit: 5,
      fetchImpl: fakeFetch,
      pauseMs: 0,
    });
    expect(seen).toEqual([
      "https://t.me/s/test_log",
      "https://t.me/s/test_log?before=500",
    ]);
    expect(result.posts.map((post) => post.id)).toEqual([
      "900",
      "400",
      "106",
      "103",
    ]);
    expect(result.channel.title).toBe("Test Channel");
  });

  it("explains a private or missing channel instead of returning nothing", async () => {
    const redirect = (async () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://t.me/test_log" },
      })) as typeof fetch;
    await expect(
      fetchChannel({ channel: "test_log", fetchImpl: redirect, pauseMs: 0 }),
    ).rejects.toThrow(/private, does not exist, or has no public preview/);
  });
});

describe("createImageLocalizer", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "tlog-media-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("writes resized webp once, reuses it, and survives failures", async () => {
    const png = await sharp({
      create: { width: 1600, height: 900, channels: 3, background: "#3366aa" },
    })
      .png()
      .toBuffer();
    let calls = 0;
    const fakeFetch = (async (url: string) => {
      calls += 1;
      if (url.includes("BROKEN")) return new Response("nope", { status: 404 });
      return new Response(new Uint8Array(png), { status: 200 });
    }) as typeof fetch;

    const first = createImageLocalizer({
      outDir: dir,
      publicPath: "log-media/",
      fetchImpl: fakeFetch,
      retries: 0,
    });
    const image = await first.localize(
      "https://cdn5.telesco.pe/file/TOKEN.jpg",
      [640, 1280],
    );
    expect(image).toMatchObject({ width: 1280, height: 720 });
    expect(image?.src).toMatch(/^log-media\/[0-9a-f]{16}-1280\.webp$/);
    expect(image?.srcset.split(", ")).toHaveLength(2);
    expect(readdirSync(dir)).toHaveLength(2);

    // Same token on another cdn host is the same file: no second download.
    const second = createImageLocalizer({
      outDir: dir,
      publicPath: "log-media/",
      fetchImpl: fakeFetch,
      retries: 0,
    });
    const again = await second.localize(
      "https://cdn4.telesco.pe/file/TOKEN.jpg",
      [640, 1280],
    );
    expect(again?.src).toBe(image?.src);
    expect(calls).toBe(1);

    expect(
      await second.localize("https://cdn5.telesco.pe/file/BROKEN.jpg", [640]),
    ).toBeNull();
    expect(second.failed).toBe(1);
  });
});
