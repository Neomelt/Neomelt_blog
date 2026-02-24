const LEGACY_BLOG_RESERVED_SEGMENTS = new Set([
    "archive",
    "categories",
    "series",
    "tags",
    "page",
]);

export function normalizePathname(pathname: string): string {
    if (!pathname) return "/";

    const compact = pathname.replace(/\/{2,}/g, "/");
    if (compact === "/") return "/";

    return compact.endsWith("/") ? compact.slice(0, -1) : compact;
}

export function getPrimaryCanonicalPath(pathname: string): string {
    const path = normalizePathname(pathname);

    if (path === "/blog") return "/posts";
    if (path === "/blog/archive") return "/posts/archive";
    if (path === "/blog/tags") return "/tags";

    const pagedMatch = path.match(/^\/blog\/page\/(\d+)$/);
    if (pagedMatch) {
        return `/posts/page/${pagedMatch[1]}`;
    }

    const slugMatch = path.match(/^\/blog\/(.+)$/);
    if (slugMatch && !slugMatch[1].includes("/")) {
        const slug = slugMatch[1];
        if (!LEGACY_BLOG_RESERVED_SEGMENTS.has(slug)) {
            return `/posts/${slug}`;
        }
    }

    return path;
}

export function isLegacyBlogAliasPath(pathname: string): boolean {
    const normalized = normalizePathname(pathname);
    return getPrimaryCanonicalPath(normalized) !== normalized;
}
