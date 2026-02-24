export function normalizeWalinePath(path: string): string {
    if (!path) return "/";

    const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
    const trimmedPath = withLeadingSlash.replace(/\/+$/, "");

    return trimmedPath || "/";
}

export function getWalinePathForPost(
    postId: string,
): string {
    return normalizeWalinePath(`/posts/${postId}`);
}
