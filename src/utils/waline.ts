export function normalizeWalinePath(path: string): string {
    if (!path) return "/";

    const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
    const trimmedPath = withLeadingSlash.replace(/\/+$/, "");

    return trimmedPath || "/";
}

export function getWalinePathForPost(
    postId: string,
    collection: "blog" | "zueg" = "blog",
): string {
    const basePath = collection === "zueg" ? `/posts/zueg/${postId}` : `/posts/${postId}`;
    return normalizeWalinePath(basePath);
}
