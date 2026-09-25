/**
 * Read a public Telegram channel through its web preview (t.me/s/<name>)
 * and turn it into plain data: channel info plus a list of posts.
 *
 * No bot, no token, no server: the preview page is public HTML, so this runs
 * wherever the site builds. It is framework-agnostic on purpose - the Astro
 * loader in astro.mjs is one caller, a Hexo or Hugo build script can be
 * another.
 *
 * Only public channels have a preview. For a private or missing one t.me
 * answers with a redirect to t.me/<name>, which is reported as an error
 * instead of being parsed as an empty channel.
 */
import { createHash } from "node:crypto";
import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";

const PREVIEW_ORIGIN = "https://t.me";
const CHANNEL_NAME = /^[A-Za-z][A-Za-z0-9_]{3,31}$/;
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

/**
 * @typedef {{ url: string; ratio?: number }} TgPhoto
 * @typedef {{ url: string; thumb?: string; duration?: string }} TgVideo
 * @typedef {{ url: string; siteName?: string; title?: string; description?: string }} TgLinkPreview
 * @typedef {{ emoji: string; count: string }} TgReaction
 * @typedef {{
 *   id: string;
 *   url: string;
 *   date: string;
 *   html: string;
 *   text: string;
 *   photos: TgPhoto[];
 *   videos: TgVideo[];
 *   link?: TgLinkPreview;
 *   forwardedFrom?: { name: string; url?: string };
 *   reactions: TgReaction[];
 *   views?: string;
 *   edited: boolean;
 *   unsupported: string[];
 * }} TgPost
 * @typedef {{
 *   username: string;
 *   title: string;
 *   description: string;
 *   avatar?: string;
 *   url: string;
 *   counters: Record<string, string>;
 * }} TgChannel
 */

/** @param {string} channel */
export function assertChannelName(channel) {
  if (!CHANNEL_NAME.test(channel)) {
    throw new Error(
      `"${channel}" is not a Telegram channel username (5-32 letters, digits or _)`,
    );
  }
}

/** @param {string} channel @param {string | null} [before] */
export function previewUrl(channel, before = null) {
  const url = `${PREVIEW_ORIGIN}/s/${channel}`;
  return before ? `${url}?before=${encodeURIComponent(before)}` : url;
}

// ---------------------------------------------------------------------------
// Tree helpers. hast keeps classes as an array under properties.className.

/** @param {any} node @returns {string[]} */
function classes(node) {
  const value = node?.properties?.className;
  if (Array.isArray(value)) return value.map(String);
  return typeof value === "string" ? value.split(/\s+/) : [];
}

/** @param {any} node @param {string} name */
function hasClass(node, name) {
  return node?.type === "element" && classes(node).includes(name);
}

/**
 * Depth-first search. `skip` stops the walk from entering a subtree, which is
 * how a reply quote or link preview keeps its own text out of the message.
 * @param {any} node
 * @param {(n: any) => boolean} match
 * @param {(n: any) => boolean} [skip]
 * @param {any[]} [out]
 */
function findAll(node, match, skip = () => false, out = []) {
  for (const child of node.children ?? []) {
    if (child.type !== "element") continue;
    if (match(child)) out.push(child);
    if (!skip(child)) findAll(child, match, skip, out);
  }
  return out;
}

/** @param {any} node @param {(n: any) => boolean} match @param {(n: any) => boolean} [skip] */
function findFirst(node, match, skip) {
  return findAll(node, match, skip)[0];
}

/** @param {any} node @param {string} name @param {(n: any) => boolean} [skip] */
function byClass(node, name, skip) {
  return findFirst(node, (n) => hasClass(n, name), skip);
}

/** Visible text, with <br> as a newline. @param {any} node @returns {string} */
function textOf(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if (node.type === "element" && node.tagName === "br") return "\n";
  return (node.children ?? []).map(textOf).join("");
}

/** @param {any} node */
function styleOf(node) {
  const style = node?.properties?.style;
  return typeof style === "string" ? style : "";
}

/** @param {string} style */
function backgroundImage(style) {
  const match = style.match(/background-image:\s*url\((['"]?)(.*?)\1\)/);
  return match ? absolutize(match[2]) : undefined;
}

/** Telegram writes protocol-relative URLs (//telegram.org/...). @param {string} url */
function absolutize(url) {
  return url.startsWith("//") ? `https:${url}` : url;
}

// ---------------------------------------------------------------------------
// Message text. Telegram's markup is already escaped, but it is still
// someone else's HTML landing in our page, so it is rebuilt from an
// allowlist instead of being passed through.

const KEEP_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "del",
  "ins",
  "code",
  "pre",
  "br",
  "blockquote",
]);
const DROP_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "video",
  "audio",
  "img",
  "template",
]);

/**
 * @param {any[]} children
 * @param {string} base  URL relative hrefs (hashtags are "?q=%23tag") resolve against
 * @returns {any[]}
 */
function cleanChildren(children, base) {
  return children.flatMap((child) => cleanNode(child, base));
}

/** @param {any} node @param {string} base @returns {any[]} */
function cleanNode(node, base) {
  if (node.type === "text") return [node];
  if (node.type !== "element") return [];

  const tag = node.tagName;
  if (DROP_TAGS.has(tag)) return [];

  // <i class="emoji" style="background-image:..."><b>😊</b></i> is an image
  // sprite with the real character inside; keep only the character.
  if ((tag === "i" && hasClass(node, "emoji")) || tag === "tg-emoji") {
    return [{ type: "text", value: textOf(node) }];
  }

  if (tag === "tg-spoiler" || hasClass(node, "tg-spoiler")) {
    return [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["tlog-spoiler"] },
        children: cleanChildren(node.children ?? [], base),
      },
    ];
  }

  if (tag === "a") {
    const inner = cleanChildren(node.children ?? [], base);
    let href;
    try {
      href = new URL(String(node.properties?.href ?? ""), base);
    } catch {
      return inner;
    }
    if (href.protocol !== "https:" && href.protocol !== "http:") return inner;
    return [
      {
        type: "element",
        tagName: "a",
        properties: {
          href: href.href,
          target: "_blank",
          rel: ["noopener", "noreferrer", "nofollow"],
        },
        children: inner,
      },
    ];
  }

  const inner = cleanChildren(node.children ?? [], base);
  if (KEEP_TAGS.has(tag)) {
    return [{ type: "element", tagName: tag, properties: {}, children: inner }];
  }
  return inner; // unknown wrapper: keep its content, lose the element
}

/** @param {any} node @param {string} base */
function cleanHtml(node, base) {
  if (!node) return "";
  const root = {
    type: "root",
    children: cleanChildren(node.children ?? [], base),
  };
  return toHtml(root).trim();
}

// ---------------------------------------------------------------------------
// One page of the preview.

/**
 * @param {any} tree
 * @param {string} channel
 * @returns {TgChannel | null}
 */
function parseChannelInfo(tree, channel) {
  const info = byClass(tree, "tgme_channel_info");
  if (!info) return null;
  const header = byClass(info, "tgme_channel_info_header");
  const photo = header && byClass(header, "tgme_page_photo_image");
  const img = photo && findFirst(photo, (n) => n.tagName === "img");
  /** @type {Record<string, string>} */
  const counters = {};
  for (const counter of findAll(info, (n) =>
    hasClass(n, "tgme_channel_info_counter"),
  )) {
    const value = textOf(byClass(counter, "counter_value")).trim();
    const type = textOf(byClass(counter, "counter_type")).trim().toLowerCase();
    if (value && type) counters[type] = value;
  }
  const username =
    textOf(byClass(info, "tgme_channel_info_header_username"))
      .trim()
      .replace(/^@/, "") || channel;
  return {
    username,
    title:
      textOf(byClass(info, "tgme_channel_info_header_title")).trim() ||
      username,
    description: textOf(byClass(info, "tgme_channel_info_description")).trim(),
    avatar: img?.properties?.src
      ? absolutize(String(img.properties.src))
      : undefined,
    url: `${PREVIEW_ORIGIN}/${username}`,
    counters,
  };
}

/** Nested blocks whose text belongs to someone else. @param {any} n */
const foreignBlock = (n) =>
  hasClass(n, "tgme_widget_message_reply") ||
  hasClass(n, "tgme_widget_message_link_preview");

const UNSUPPORTED_KINDS = [
  ["tgme_widget_message_sticker_wrap", "sticker"],
  ["tgme_widget_message_document_wrap", "document"],
  ["tgme_widget_message_voice_player", "voice"],
  ["tgme_widget_message_poll", "poll"],
  ["tgme_widget_message_location_wrap", "location"],
  ["message_media_not_supported", "unsupported"],
];

/**
 * @param {any} wrap  a .tgme_widget_message_wrap element
 * @param {string} channel
 * @returns {TgPost | null}
 */
function parseMessage(wrap, channel) {
  const msg = byClass(wrap, "tgme_widget_message");
  if (!msg || hasClass(msg, "service_message")) return null;

  const post = String(msg.properties?.dataPost ?? "");
  const id = post.split("/").pop() ?? "";
  if (!/^\d+$/.test(id)) return null;

  const dateLink = byClass(msg, "tgme_widget_message_date");
  const time = dateLink && findFirst(dateLink, (n) => n.tagName === "time");
  const date = String(time?.properties?.dateTime ?? "");
  if (!date) return null;

  const base = previewUrl(channel);
  const textNode = byClass(msg, "tgme_widget_message_text", foreignBlock);

  const photos = findAll(
    msg,
    (n) => hasClass(n, "tgme_widget_message_photo_wrap"),
    foreignBlock,
  ).flatMap((wrapNode) => {
    const url = backgroundImage(styleOf(wrapNode));
    if (!url) return [];
    const inner = byClass(wrapNode, "tgme_widget_message_photo");
    const pad = styleOf(inner).match(/padding-top:\s*([\d.]+)%/);
    return [{ url, ...(pad ? { ratio: Number(pad[1]) / 100 } : {}) }];
  });

  const videos = findAll(
    msg,
    (n) =>
      hasClass(n, "tgme_widget_message_video_player") ||
      hasClass(n, "tgme_widget_message_roundvideo_player"),
    foreignBlock,
  ).map((player) => {
    const thumb =
      byClass(player, "tgme_widget_message_video_thumb") ??
      byClass(player, "tgme_widget_message_roundvideo_thumb");
    const duration = textOf(byClass(player, "message_video_duration")).trim();
    return {
      url: String(player.properties?.href ?? `${PREVIEW_ORIGIN}/${post}`),
      ...(thumb && backgroundImage(styleOf(thumb))
        ? { thumb: backgroundImage(styleOf(thumb)) }
        : {}),
      ...(duration ? { duration } : {}),
    };
  });

  const preview = byClass(msg, "tgme_widget_message_link_preview");
  const link = preview
    ? {
        url: String(preview.properties?.href ?? ""),
        siteName:
          textOf(byClass(preview, "link_preview_site_name")).trim() ||
          undefined,
        title:
          textOf(byClass(preview, "link_preview_title")).trim() || undefined,
        description:
          textOf(byClass(preview, "link_preview_description")).trim() ||
          undefined,
      }
    : undefined;

  const forward = byClass(msg, "tgme_widget_message_forwarded_from");
  const forwardName =
    forward && byClass(forward, "tgme_widget_message_forwarded_from_name");
  const forwardedFrom = forward
    ? {
        name: textOf(forwardName ?? forward)
          .replace(/^Forwarded from\s*/i, "")
          .trim(),
        ...(forwardName?.properties?.href
          ? { url: String(forwardName.properties.href) }
          : {}),
      }
    : undefined;

  const reactions = findAll(msg, (n) => hasClass(n, "tgme_reaction")).map(
    (node) => {
      const emoji = textOf(
        findFirst(
          node,
          (n) => hasClass(n, "emoji") || n.tagName === "tg-emoji",
        ),
      ).trim();
      const count = textOf(node).replace(emoji, "").trim();
      return { emoji: emoji || "❤", count };
    },
  );

  const views = textOf(byClass(msg, "tgme_widget_message_views")).trim();
  const meta = textOf(byClass(msg, "tgme_widget_message_meta"));

  return {
    id,
    url: `${PREVIEW_ORIGIN}/${post}`,
    date,
    html: cleanHtml(textNode, base),
    // Telegram pads some lines with a zero-width space; it is noise in plain text.
    text: textOf(textNode)
      .replace(/\u200b/g, "")
      .trim(),
    photos,
    videos,
    ...(link && link.url ? { link } : {}),
    ...(forwardedFrom && forwardedFrom.name ? { forwardedFrom } : {}),
    reactions,
    ...(views ? { views } : {}),
    edited: /\bedited\b/i.test(meta),
    unsupported: UNSUPPORTED_KINDS.filter(([cls]) => byClass(msg, cls)).map(
      ([, kind]) => kind,
    ),
  };
}

/**
 * Parse one preview page. `before` is the cursor for the next (older) page,
 * absent on the last one.
 * @param {string} html
 * @param {string} channel
 */
export function parseChannelPage(html, channel) {
  const tree = fromHtml(html);
  const posts = findAll(tree, (n) => hasClass(n, "tgme_widget_message_wrap"))
    .map((wrap) => parseMessage(wrap, channel))
    .filter((post) => post !== null);
  const more = byClass(tree, "tme_messages_more");
  const before =
    String(more?.properties?.dataBefore ?? "") ||
    String(more?.properties?.href ?? "").match(/before=(\d+)/)?.[1] ||
    null;
  return { info: parseChannelInfo(tree, channel), posts, before };
}

// ---------------------------------------------------------------------------
// Fetching.

/**
 * @param {string} url
 * @param {{ fetchImpl: typeof fetch; timeoutMs: number; userAgent: string }} opts
 */
async function fetchPreview(url, { fetchImpl, timeoutMs, userAgent }) {
  const response = await fetchImpl(url, {
    redirect: "manual",
    headers: { "User-Agent": userAgent, "Accept-Language": "en" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(
      `${url} redirected: the channel is private, does not exist, or has no public preview`,
    );
  }
  if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`);
  return response.text();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Newest `limit` posts plus channel info. Walks back page by page (about 20
 * posts each); a limit of 0 walks through the whole public channel history.
 *
 * @param {{
 *   channel: string;
 *   limit?: number;
 *   maxPages?: number;
 *   fetchImpl?: typeof fetch;
 *   timeoutMs?: number;
 *   userAgent?: string;
 *   pauseMs?: number;
 * }} options
 * @returns {Promise<{ channel: TgChannel; posts: TgPost[] }>}
 */
export async function fetchChannel({
  channel,
  limit = 50,
  maxPages,
  fetchImpl = fetch,
  timeoutMs = 15_000,
  userAgent = DEFAULT_USER_AGENT,
  pauseMs = 400,
}) {
  assertChannelName(channel);
  const unlimited = limit <= 0;
  const pageCap =
    maxPages ?? (unlimited ? Infinity : Math.ceil(limit / 15) + 1);
  /** @type {Map<string, TgPost>} */
  const byId = new Map();
  /** @type {TgChannel | null} */
  let info = null;
  let before = null;

  for (
    let page = 0;
    page < pageCap && (unlimited || byId.size < limit);
    page += 1
  ) {
    if (page > 0) await sleep(pauseMs);
    const html = await fetchPreview(previewUrl(channel, before), {
      fetchImpl,
      timeoutMs,
      userAgent,
    });
    const parsed = parseChannelPage(html, channel);
    if (page === 0) {
      if (!parsed.info) {
        throw new Error(
          `${previewUrl(channel)} has no channel header; not a public channel?`,
        );
      }
      info = parsed.info;
    }
    for (const post of parsed.posts) byId.set(post.id, post);
    if (!parsed.before || parsed.before === before) break;
    before = parsed.before;
  }

  const posts = [...byId.values()]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, unlimited ? undefined : limit);
  return { channel: /** @type {TgChannel} */ (info), posts };
}

/**
 * Fingerprint of the posts kept by the site, used to decide whether a rebuild
 * is worth it. View and reaction counts are left out on purpose: they move
 * all the time, and a rebuild for every new view would never stop.
 * @param {TgPost[]} posts
 * @param {number} [count]
 */
export function postsDigest(posts, count = posts.length) {
  const newest = [...posts]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, count)
    .map((post) => [
      post.id,
      post.text,
      post.photos.length,
      post.videos.length,
      post.link?.url ?? "",
      post.edited,
    ]);
  return createHash("sha256")
    .update(JSON.stringify(newest))
    .digest("hex")
    .slice(0, 16);
}
