import type { SkinName } from "../types/layout";

/** Every skin that has a tokens.css. Order drives the cycle button. */
export const SKINS = ["minimal", "anime"] as const satisfies readonly SkinName[];

/**
 * <meta name="theme-color"> per skin and mode, which tints the mobile browser
 * chrome. Kept in sync with each skin's --bg by hand on purpose: the browser
 * needs this value before any stylesheet is parsed, so it cannot be read back
 * out of a custom property.
 */
export const SKIN_THEME_COLORS: Record<
  SkinName,
  { light: string; dark: string }
> = {
  minimal: { light: "#fafafa", dark: "#16181d" },
  anime: { light: "#f7f6fd", dark: "#15121f" },
};
