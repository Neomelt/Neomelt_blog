const SHORTCODE_PATTERN = /^@\[(video|youtube|bilibili)\]\((.+)\)$/i;
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const BILIBILI_BVID_PATTERN = /^BV[0-9A-Za-z]{10}$/i;
const bilibiliMetadataCache = new Map();

function formatBilibiliBvid(value) {
  return `BV${value.slice(2)}`;
}

function normalizeYouTubeId(input) {
  const raw = input.trim();
  if (YOUTUBE_ID_PATTERN.test(raw)) {
    return raw;
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      const id = pathParts[0] || "";
      return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (host.endsWith("youtube.com")) {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v") || "";
        return YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }

      if (["embed", "shorts", "live"].includes(pathParts[0])) {
        const id = pathParts[1] || "";
        return YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeBilibiliInfo(input) {
  const raw = input.trim();
  if (BILIBILI_BVID_PATTERN.test(raw)) {
    return { bvid: formatBilibiliBvid(raw), aid: null, cid: null };
  }

  try {
    const url = new URL(raw);
    const path = url.pathname || "";
    const pathMatch = path.match(/\/video\/(BV[0-9A-Za-z]{10})/i);
    const bvid = pathMatch?.[1] || url.searchParams.get("bvid") || "";
    if (!BILIBILI_BVID_PATTERN.test(bvid)) {
      return null;
    }

    const aidRaw = Number(url.searchParams.get("aid") || "");
    const cidRaw = Number(url.searchParams.get("cid") || "");

    return {
      bvid: formatBilibiliBvid(bvid),
      aid: Number.isFinite(aidRaw) && aidRaw > 0 ? aidRaw : null,
      cid: Number.isFinite(cidRaw) && cidRaw > 0 ? cidRaw : null,
    };
  } catch {
    return null;
  }
}

async function fetchBilibiliMetadata(bvid) {
  if (bilibiliMetadataCache.has(bvid)) {
    return bilibiliMetadataCache.get(bvid);
  }

  const promise = fetch(
    `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(
      bvid,
    )}`,
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Bilibili API responded with ${response.status}`);
      }

      const payload = await response.json();
      const aid = Number(payload?.data?.aid || "");
      const cid = Number(payload?.data?.cid || payload?.data?.pages?.[0]?.cid);
      if (!Number.isFinite(aid) || aid <= 0 || !Number.isFinite(cid) || cid <= 0) {
        return null;
      }

      return { aid, cid };
    })
    .catch(() => null);

  bilibiliMetadataCache.set(bvid, promise);
  return promise;
}

async function resolveBilibiliEmbed(source) {
  const info = normalizeBilibiliInfo(source);
  if (!info) {
    return null;
  }

  if (info.aid && info.cid) {
    return { provider: "bilibili", ...info };
  }

  const metadata = await fetchBilibiliMetadata(info.bvid);
  return {
    provider: "bilibili",
    bvid: info.bvid,
    aid: metadata?.aid || info.aid || null,
    cid: metadata?.cid || info.cid || null,
  };
}

async function buildEmbedInfo(provider, source) {
  if (provider === "youtube") {
    const id = normalizeYouTubeId(source);
    return id ? { provider: "youtube", id } : null;
  }

  if (provider === "bilibili") {
    return resolveBilibiliEmbed(source);
  }

  const youtubeId = normalizeYouTubeId(source);
  if (youtubeId) {
    return { provider: "youtube", id: youtubeId };
  }

  const bilibiliInfo = normalizeBilibiliInfo(source);
  if (bilibiliInfo) {
    return resolveBilibiliEmbed(source);
  }

  return null;
}

function textContent(node) {
  if (!node) {
    return "";
  }
  if (node.type === "text") {
    return String(node.value || "");
  }
  if (!Array.isArray(node.children)) {
    return "";
  }
  return node.children.map((child) => textContent(child)).join("");
}

function makeTextParagraphNode(value) {
  return {
    type: "element",
    tagName: "p",
    properties: {},
    children: [
      {
        type: "text",
        value,
      },
    ],
  };
}

function makeIframeNode(embed) {
  if (embed.provider === "youtube") {
    return {
      type: "element",
      tagName: "iframe",
      properties: {
        src: `https://www.youtube.com/embed/${embed.id}`,
        title: "YouTube video player",
        loading: "lazy",
        allow:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        referrerpolicy: "strict-origin-when-cross-origin",
        allowfullscreen: true,
      },
      children: [],
    };
  }

  const params = new URLSearchParams({
    bvid: embed.bvid,
    p: "1",
    isOutside: "true",
  });

  if (embed.aid) {
    params.set("aid", String(embed.aid));
  }

  if (embed.cid) {
    params.set("cid", String(embed.cid));
  }

  return {
    type: "element",
    tagName: "iframe",
    properties: {
      src: `https://player.bilibili.com/player.html?${params.toString()}`,
      title: "Bilibili video player",
      loading: "lazy",
      scrolling: "no",
      allowfullscreen: true,
    },
    children: [],
  };
}

function makeVideoWrapNode(embed) {
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["video-wrap"],
    },
    children: [makeIframeNode(embed)],
  };
}

async function parseShortcodeText(value) {
  const match = String(value || "")
    .trim()
    .match(SHORTCODE_PATTERN);
  if (!match) {
    return null;
  }

  const [, providerRaw, sourceRaw] = match;
  const provider = providerRaw.toLowerCase();
  const source = sourceRaw.trim();
  return await buildEmbedInfo(provider, source);
}

async function parseLinkAsEmbed(linkNode, options = {}) {
  const { requireAtPrefix = true } = options;
  if (!linkNode || linkNode.type !== "element" || linkNode.tagName !== "a") {
    return null;
  }

  const labelRaw = textContent(linkNode).trim().toLowerCase();
  const hasAtPrefix = labelRaw.startsWith("@");
  if (requireAtPrefix && !hasAtPrefix) {
    return null;
  }

  const provider = labelRaw.replace(/^@/, "");
  if (!["video", "youtube", "bilibili"].includes(provider)) {
    return null;
  }

  const href = String(linkNode.properties?.href || "").trim();
  if (!href) {
    return null;
  }

  return await buildEmbedInfo(provider, href);
}

function normalizeParagraphChildren(children) {
  return children.filter((child) => {
    if (child.type !== "text") {
      return true;
    }
    return String(child.value || "").trim() !== "";
  });
}

async function parseParagraphAsEmbed(paragraphNode) {
  if (
    !paragraphNode ||
    paragraphNode.type !== "element" ||
    paragraphNode.tagName !== "p"
  ) {
    return null;
  }

  const children = normalizeParagraphChildren(paragraphNode.children || []);
  if (children.length === 1) {
    const only = children[0];
    if (only.type === "text") {
      const embed = await parseShortcodeText(only.value || "");
      return embed ? [makeVideoWrapNode(embed)] : null;
    }
    const embed = await parseLinkAsEmbed(only, { requireAtPrefix: true });
    return embed ? [makeVideoWrapNode(embed)] : null;
  }

  // Markdown usually parses "@[video](...)" as text("@") + link("video").
  if (children.length === 2 && children[0].type === "text") {
    const prefix = String(children[0].value || "").trim();
    if (prefix === "@") {
      const embed = await parseLinkAsEmbed(children[1], {
        requireAtPrefix: false,
      });
      return embed ? [makeVideoWrapNode(embed)] : null;
    }

    const inlineEmbed = await parseLinkAsEmbed(children[1], {
      requireAtPrefix: false,
    });
    if (!inlineEmbed) {
      return null;
    }

    const leadingText = String(children[0].value || "");
    const splitMatch = leadingText.match(/^([\s\S]*?)@\s*$/);
    if (!splitMatch) {
      return null;
    }

    const beforeText = splitMatch[1].trim();
    if (!beforeText) {
      return [makeVideoWrapNode(inlineEmbed)];
    }

    return [makeTextParagraphNode(beforeText), makeVideoWrapNode(inlineEmbed)];
  }

  return null;
}

async function transformNode(node) {
  if (!node || !Array.isArray(node.children)) {
    return;
  }

  for (let i = 0; i < node.children.length; i += 1) {
    const child = node.children[i];
    const replacements = await parseParagraphAsEmbed(child);
    if (replacements) {
      node.children.splice(i, 1, ...replacements);
      i += replacements.length - 1;
      continue;
    }
    await transformNode(child);
  }
}

export default function rehypeVideoEmbed() {
  return async (tree) => {
    await transformNode(tree);
  };
}
