/**
 * The one place a post-list arrangement is declared.
 *
 * Adding one is two steps: write src/arrangements/<name>.css, then add its
 * name below. The stylesheet is picked up by a glob in view/PostCard.astro
 * and the reading panel's pills are derived from this array, so nothing else
 * needs an edit - the same spirit as src/skins/index.ts, which is an object
 * only because a skin also carries a theme-color, and src/blocks/registry.ts,
 * which is a map only because a block is a component to import.
 *
 * The directory is not src/layouts/, which Astro reserves for page layout
 * components. "Arrangement" is what the CSS and the type comments have
 * called these all along; the attribute stays data-layout.
 *
 * Order is the cycle order and the order of the pills in the reading panel.
 */
export const LAYOUTS = [
  "grid",
  "feature",
  "list",
  "magazine",
  "timeline",
] as const;

/**
 * How the post listing is arranged. Same markup in every case - only the
 * container and card CSS differ - so switching is a data attribute, not a
 * rebuild.
 */
export type LayoutName = (typeof LAYOUTS)[number];
