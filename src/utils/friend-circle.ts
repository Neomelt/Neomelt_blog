import { XMLParser } from "fast-xml-parser";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { FriendLink } from "../data/friends";

interface FeedPost {
    title: string;
    link: string;
    publishedAt: number;
}

export interface FriendCirclePost {
    friendName: string;
    friendUrl: string;
    friendAvatar?: string;
    title: string;
    link: string;
    publishedAt: number;
    publishedDate: string;
    publishedISO: string;
}

interface FriendCircleOptions {
    perFeedLimit?: number;
    totalLimit?: number;
    timeoutMs?: number;
}

interface FetchFeedResult {
    posts: FriendCirclePost[];
    fetched: boolean;
}

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
});

const FRIEND_CIRCLE_CACHE_FILE = new URL(
    "../../.cache/friend-circle.json",
    import.meta.url,
);

function toArray<T>(value: T | T[] | undefined | null): T[] {
    if (Array.isArray(value)) return value;
    return value == null ? [] : [value];
}

function getText(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) {
        for (const item of value) {
            const text = getText(item);
            if (text) return text;
        }
        return "";
    }
    if (value && typeof value === "object") {
        const text = (value as Record<string, unknown>)["#text"];
        return getText(text);
    }
    return "";
}

function parseTimestamp(rawDate: string): number {
    if (!rawDate) return 0;
    const timestamp = Date.parse(rawDate);
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function toDateLabel(timestamp: number): string {
    if (!timestamp) return "";
    return new Date(timestamp).toISOString().slice(0, 10);
}

function toDateIso(timestamp: number): string {
    if (!timestamp) return "";
    return new Date(timestamp).toISOString();
}

function normalizeUrl(rawUrl: string, fallbackBase: string): string {
    if (!rawUrl) return "";
    try {
        return new URL(rawUrl, fallbackBase).href;
    } catch {
        return rawUrl;
    }
}

function pickAtomLink(rawLink: unknown): string {
    for (const entry of toArray(rawLink)) {
        if (typeof entry === "string") {
            if (entry.trim()) return entry.trim();
            continue;
        }

        if (!entry || typeof entry !== "object") continue;

        const linkObject = entry as Record<string, unknown>;
        const href = getText(linkObject["@_href"]);
        const rel = getText(linkObject["@_rel"]);
        if (!href) continue;
        if (!rel || rel === "alternate") return href;
    }
    return "";
}

function parseRssPosts(parsed: Record<string, unknown>, fallbackBase: string): FeedPost[] {
    const rss = parsed.rss;
    if (!rss || typeof rss !== "object") return [];

    const channel = toArray((rss as Record<string, unknown>).channel)[0];
    if (!channel || typeof channel !== "object") return [];

    return toArray((channel as Record<string, unknown>).item)
        .map((item): FeedPost | null => {
            if (!item || typeof item !== "object") return null;
            const itemObject = item as Record<string, unknown>;

            const title = getText(itemObject.title);
            const link = normalizeUrl(
                getText(itemObject.link) || getText(itemObject.guid),
                fallbackBase,
            );
            const publishedAt = parseTimestamp(
                getText(itemObject.pubDate)
                    || getText(itemObject.published)
                    || getText(itemObject.updated),
            );

            if (!title || !link) return null;

            return { title, link, publishedAt };
        })
        .filter((item): item is FeedPost => item !== null);
}

function parseAtomPosts(parsed: Record<string, unknown>, fallbackBase: string): FeedPost[] {
    const feed = parsed.feed;
    if (!feed || typeof feed !== "object") return [];

    return toArray((feed as Record<string, unknown>).entry)
        .map((entry): FeedPost | null => {
            if (!entry || typeof entry !== "object") return null;
            const entryObject = entry as Record<string, unknown>;

            const title = getText(entryObject.title);
            const link = normalizeUrl(pickAtomLink(entryObject.link), fallbackBase);
            const publishedAt = parseTimestamp(
                getText(entryObject.published) || getText(entryObject.updated),
            );

            if (!title || !link) return null;
            return { title, link, publishedAt };
        })
        .filter((entry): entry is FeedPost => entry !== null);
}

async function fetchFeedPosts(
    friend: FriendLink,
    options: Required<FriendCircleOptions>,
): Promise<FetchFeedResult> {
    if (!friend.rss) return { posts: [], fetched: false };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
        const response = await fetch(friend.rss, {
            signal: controller.signal,
            headers: {
                Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
            },
        });

        if (!response.ok) return { posts: [], fetched: false };

        const xmlContent = await response.text();
        if (!xmlContent.trim()) return { posts: [], fetched: true };

        const parsed = xmlParser.parse(xmlContent) as Record<string, unknown>;
        const feedPosts = [
            ...parseRssPosts(parsed, friend.url),
            ...parseAtomPosts(parsed, friend.url),
        ]
            .sort((a, b) => b.publishedAt - a.publishedAt)
            .slice(0, options.perFeedLimit);

        return {
            fetched: true,
            posts: feedPosts.map((post) => ({
            friendName: friend.name,
            friendUrl: friend.url,
            friendAvatar: friend.avatar,
            title: post.title,
            link: post.link,
            publishedAt: post.publishedAt,
            publishedDate: toDateLabel(post.publishedAt),
            publishedISO: toDateIso(post.publishedAt),
            })),
        };
    } catch {
        return { posts: [], fetched: false };
    } finally {
        clearTimeout(timeout);
    }
}

function dedupeAndLimitPosts(
    posts: FriendCirclePost[],
    totalLimit: number,
): FriendCirclePost[] {
    const dedupedPosts: FriendCirclePost[] = [];
    const seenLinks = new Set<string>();
    for (const post of posts) {
        if (!post?.link || seenLinks.has(post.link)) continue;
        seenLinks.add(post.link);
        dedupedPosts.push(post);
        if (dedupedPosts.length >= totalLimit) break;
    }
    return dedupedPosts;
}

function isValidCachedPost(value: unknown): value is FriendCirclePost {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.link === "string"
        && typeof candidate.title === "string"
        && typeof candidate.friendName === "string";
}

async function readCachedPosts(totalLimit: number): Promise<FriendCirclePost[]> {
    try {
        const cacheRaw = await readFile(FRIEND_CIRCLE_CACHE_FILE, "utf-8");
        const parsed = JSON.parse(cacheRaw) as { posts?: unknown[] } | null;
        const cachedPosts = Array.isArray(parsed?.posts)
            ? parsed.posts.filter(isValidCachedPost)
            : [];

        return dedupeAndLimitPosts(cachedPosts, totalLimit);
    } catch {
        return [];
    }
}

async function writeCachedPosts(posts: FriendCirclePost[]): Promise<void> {
    try {
        const cachePath = fileURLToPath(FRIEND_CIRCLE_CACHE_FILE);
        await mkdir(dirname(cachePath), { recursive: true });
        await writeFile(
            cachePath,
            JSON.stringify(
                {
                    updatedAt: new Date().toISOString(),
                    posts,
                },
                null,
                2,
            ),
            "utf-8",
        );
    } catch {
        // 缓存写入失败不应影响页面构建
    }
}

export async function getFriendCirclePosts(
    friends: FriendLink[],
    options: FriendCircleOptions = {},
): Promise<FriendCirclePost[]> {
    const resolvedOptions: Required<FriendCircleOptions> = {
        perFeedLimit: options.perFeedLimit ?? 8,
        totalLimit: options.totalLimit ?? 24,
        timeoutMs: options.timeoutMs ?? 8000,
    };

    const feedFriends = friends.filter((friend) => Boolean(friend.rss));
    const fetchResults = await Promise.all(
        feedFriends.map((friend) => fetchFeedPosts(friend, resolvedOptions)),
    );

    const mergedPosts = fetchResults
        .flatMap((result) => result.posts)
        .sort((a, b) => b.publishedAt - a.publishedAt);

    const dedupedPosts = dedupeAndLimitPosts(
        mergedPosts,
        resolvedOptions.totalLimit,
    );

    if (dedupedPosts.length > 0) {
        await writeCachedPosts(dedupedPosts);
        return dedupedPosts;
    }

    // 外站抓取失败或暂无结果时，回退到上次成功缓存，保障构建稳定性
    const cachedPosts = await readCachedPosts(resolvedOptions.totalLimit);
    return cachedPosts;
}
