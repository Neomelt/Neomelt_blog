export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";

  const compact = pathname.replace(/\/{2,}/g, "/");
  if (compact === "/") return "/";

  return compact.endsWith("/") ? compact.slice(0, -1) : compact;
}
