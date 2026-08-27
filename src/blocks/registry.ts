import type { AstroComponentFactory } from "astro/runtime/server/index.js";

import Backdrop from "./decor/Backdrop.astro";
import ClickEffect from "./decor/ClickEffect.astro";
import SakuraFall from "./decor/SakuraFall.astro";
import ImageLightbox from "./behavior/ImageLightbox.astro";

/**
 * The one registry. Adding a block is one import plus one line here.
 *
 * `satisfies` (rather than a type annotation) keeps the keys as literals, so
 * `BlockName` below is the union of the real names and a typo in
 * site.config.ts fails `astro check` instead of silently rendering nothing.
 *
 * Only widget and decor blocks belong here - they are the two shapes a
 * region can place, because neither needs the page to hand it data.
 * Everything else Components a page imports
 * directly - Pagination, PostNavigation, Comments - are not region members,
 * and Header/Footer go through named slots, so none of them are listed.
 */
export const BLOCKS = {
  "decor/Backdrop": Backdrop,
  "decor/ClickEffect": ClickEffect,
  "decor/SakuraFall": SakuraFall,
  "behavior/ImageLightbox": ImageLightbox,
} satisfies Record<string, AstroComponentFactory>;

export type BlockName = keyof typeof BLOCKS;
