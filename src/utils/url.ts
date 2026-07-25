// Root-absolute links ("/posts") break on the GitHub Pages mirror, which is
// served under a sub-path (astro build --base /Neomelt_blog). BASE_URL is "/"
// on the primary deployment and "/<repo>/" on the mirror build.

/** Pure form of withBase, testable with an explicit base. */
export function applyBase(base: string, path: string): string {
  const trimmed = base.replace(/\/+$/, "");
  return `${trimmed}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Prefix a root-absolute path with the deployment base. No-op on the primary site. */
export function withBase(path: string): string {
  return applyBase(import.meta.env.BASE_URL, path);
}
