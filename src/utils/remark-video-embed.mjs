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

function buildEmbedHtml(embed) {
    if (embed.provider === "youtube") {
        const src = `https://www.youtube.com/embed/${embed.id}`;
        return `<div class="video-wrap"><iframe src="${src}" title="YouTube video player" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
    }

    const src = `https://player.bilibili.com/player.html?bvid=${embed.bvid}&page=1`;
    return `<div class="video-wrap"><iframe src="${src}" title="Bilibili video player" loading="lazy" scrolling="no" allowfullscreen></iframe></div>`;
}

function parseShortcodeText(value) {
    const match = value.trim().match(SHORTCODE_PATTERN);
    if (!match) {
        return null;
    }

    const [, providerRaw, sourceRaw] = match;
    const provider = providerRaw.toLowerCase();
    const source = sourceRaw.trim();
    const embed = buildEmbedInfo(provider, source);
    return embed ? buildEmbedHtml(embed) : null;
}

function transformNodes(nodes) {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];

        if (
            node.type === "paragraph" &&
            Array.isArray(node.children) &&
            node.children.length === 1 &&
            node.children[0].type === "text"
        ) {
            const html = parseShortcodeText(node.children[0].value || "");
            if (html) {
                nodes[i] = { type: "html", value: html };
                continue;
            }
        }

        if (Array.isArray(node.children) && node.children.length > 0) {
            transformNodes(node.children);
        }
    }
}

export default function remarkVideoEmbed() {
    return (tree) => {
        if (!tree || !Array.isArray(tree.children)) {
            return;
        }
        transformNodes(tree.children);
    };
}
