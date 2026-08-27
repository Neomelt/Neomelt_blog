import type { AstroComponentFactory } from "astro/runtime/server/index.js";

import ClickEffect from "./fx/ClickEffect.astro";
import ImageLightbox from "./fx/ImageLightbox.astro";

/**
 * The one registry. Adding a block is one import plus one line here.
 *
 * `satisfies` (rather than a type annotation) keeps the keys as literals, so
 * `BlockName` below is the union of the real names and a typo in
 * site.config.ts fails `astro check` instead of silently rendering nothing.
 *
 * Only blocks that a *region* places belong here. Components a page imports
 * directly - Pagination, PostNavigation, Comments - are not region members,
 * and Header/Footer go through named slots, so none of them are listed.
 */
export const BLOCKS = {
  "fx/ClickEffect": ClickEffect,
  "fx/ImageLightbox": ImageLightbox,
} satisfies Record<string, AstroComponentFactory>;

export type BlockName = keyof typeof BLOCKS;
