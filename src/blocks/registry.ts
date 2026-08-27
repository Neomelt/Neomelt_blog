import type { AstroComponentFactory } from "astro/runtime/server/index.js";

import Banner from "./chrome/Banner.astro";
import Backdrop from "./decor/Backdrop.astro";
import BackToTop from "./decor/BackToTop.astro";
import ClickEffect from "./decor/ClickEffect.astro";
import ReadingProgress from "./decor/ReadingProgress.astro";
import SakuraFall from "./decor/SakuraFall.astro";
import BlogStats from "./widget/BlogStats.astro";
import Calendar from "./widget/Calendar.astro";
import FriendCircle from "./widget/FriendCircle.astro";
import Profile from "./widget/Profile.astro";
import TagCloud from "./widget/TagCloud.astro";
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
  "chrome/Banner": Banner,
  "decor/Backdrop": Backdrop,
  "decor/BackToTop": BackToTop,
  "decor/ClickEffect": ClickEffect,
  "decor/ReadingProgress": ReadingProgress,
  "decor/SakuraFall": SakuraFall,
  "widget/BlogStats": BlogStats,
  "widget/Calendar": Calendar,
  "widget/FriendCircle": FriendCircle,
  "widget/Profile": Profile,
  "widget/TagCloud": TagCloud,
  "behavior/ImageLightbox": ImageLightbox,
} satisfies Record<string, AstroComponentFactory>;

export type BlockName = keyof typeof BLOCKS;
