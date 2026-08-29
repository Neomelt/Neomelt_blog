/**
 * The one place a skin is declared.
 *
 * Adding a skin is two steps: write src/skins/<name>/tokens.css, then add a
 * line to SKIN_REGISTRY below. The other two axes have their own registry in
 * the same spirit - src/arrangements/index.ts and src/blocks/registry.ts -
 * each shaped by what it holds. Everything else derives from here - the name
 * union, the cycle order, the reading panel's options, and the stylesheet
 * import itself. It used to take seven edits across five files, three of
 * which nothing checked; skins.test.ts now fails if the two steps disagree
 * with each other or with what is on disk.
 *
 * The value is the <meta name="theme-color"> for each mode, which tints the
 * mobile browser chrome. Kept in step with each skin's --bg by hand on
 * purpose: the browser needs this before any stylesheet is parsed, so it
 * cannot be read back out of a custom property.
 */
export const SKIN_REGISTRY = {
  minimal: { light: "#fafafa", dark: "#16181d" },
  anime: { light: "#f4f8fc", dark: "#0e1621" },
} as const satisfies Record<string, { light: string; dark: string }>;

/**
 * A skin changes tokens and decoration only - colours, fonts, radii, shadows,
 * ornaments. It never changes which blocks exist or what they do, so any skin
 * combines with any block.
 *
 * Derived rather than written out, so the union can never drift from the
 * registry. Keeping it a union of literals (not `string`) is what makes a
 * missing i18n key or an unknown name in site.config.ts an `astro check`
 * failure rather than a blank control.
 */
export type SkinName = keyof typeof SKIN_REGISTRY;

/** Every declared skin. Order drives the cycle button, and follows the
    registry's own declaration order. */
export const SKINS = Object.keys(SKIN_REGISTRY) as readonly SkinName[];

export const SKIN_THEME_COLORS = SKIN_REGISTRY;
