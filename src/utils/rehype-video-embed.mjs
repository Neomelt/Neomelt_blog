const SHORTCODE_PATTERN = /^@\[(video|youtube|bilibili)\]\((.+)\)$/i;
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const BILIBILI_BVID_PATTERN = /^BV[0-9A-Za-z]{10}$/i;

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

function normalizeBilibiliBvid(input) {
    const raw = input.trim();
    if (BILIBILI_BVID_PATTERN.test(raw)) {
        return raw.toUpperCase();
    }

    try {
        const url = new URL(raw);
        const path = url.pathname || "";
        const pathMatch = path.match(/\/video\/(BV[0-9A-Za-z]{10})/i);
        if (pathMatch) {
            return pathMatch[1].toUpperCase();
        }

        const bvid = url.searchParams.get("bvid") || "";
        if (BILIBILI_BVID_PATTERN.test(bvid)) {
            return bvid.toUpperCase();
        }
    } catch {
        return null;
    }

    return null;
}

function buildEmbedInfo(provider, source) {
    if (provider === "youtube") {
        const id = normalizeYouTubeId(source);
        return id ? { provider: "youtube", id } : null;
    }

    if (provider === "bilibili") {
        const bvid = normalizeBilibiliBvid(source);
        return bvid ? { provider: "bilibili", bvid } : null;
    }

    const youtubeId = normalizeYouTubeId(source);
    if (youtubeId) {
        return { provider: "youtube", id: youtubeId };
    }

    const bilibiliBvid = normalizeBilibiliBvid(source);
    if (bilibiliBvid) {
        return { provider: "bilibili", bvid: bilibiliBvid };
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

    return {
        type: "element",
        tagName: "iframe",
        properties: {
            src: `https://player.bilibili.com/player.html?bvid=${embed.bvid}&page=1`,
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

function parseShortcodeText(value) {
    const match = String(value || "").trim().match(SHORTCODE_PATTERN);
    if (!match) {
        return null;
    }

    const [, providerRaw, sourceRaw] = match;
    const provider = providerRaw.toLowerCase();
    const source = sourceRaw.trim();
    return buildEmbedInfo(provider, source);
}

function parseLinkAsEmbed(linkNode, options = {}) {
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

    return buildEmbedInfo(provider, href);
}

function normalizeParagraphChildren(children) {
    return children.filter((child) => {
        if (child.type !== "text") {
            return true;
        }
        return String(child.value || "").trim() !== "";
    });
}

function parseParagraphAsEmbed(paragraphNode) {
    if (!paragraphNode || paragraphNode.type !== "element" || paragraphNode.tagName !== "p") {
        return null;
    }

    const children = normalizeParagraphChildren(paragraphNode.children || []);
    if (children.length === 1) {
        const only = children[0];
        if (only.type === "text") {
            return parseShortcodeText(only.value || "");
        }
        return parseLinkAsEmbed(only, { requireAtPrefix: true });
    }

    // Markdown usually parses "@[video](...)" as text("@") + link("video").
    if (children.length === 2 && children[0].type === "text") {
        const prefix = String(children[0].value || "").trim();
        if (prefix === "@") {
            return parseLinkAsEmbed(children[1], { requireAtPrefix: false });
        }
    }

    return null;
}

function transformNode(node) {
    if (!node || !Array.isArray(node.children)) {
        return;
    }

    for (let i = 0; i < node.children.length; i += 1) {
        const child = node.children[i];
        const embed = parseParagraphAsEmbed(child);
        if (embed) {
            node.children[i] = makeVideoWrapNode(embed);
            continue;
        }
        transformNode(child);
    }
}

export default function rehypeVideoEmbed() {
    return (tree) => {
        transformNode(tree);
    };
}
