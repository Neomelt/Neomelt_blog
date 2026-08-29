import type { AstroComponentFactory } from "astro/runtime/server/index.js";

import Banner from "./chrome/Banner.astro";
import Backdrop from "./decor/Backdrop.astro";
import BackToTop from "./decor/BackToTop.astro";
import ReadingProgress from "./decor/ReadingProgress.astro";
import BlogStats from "./widget/BlogStats.astro";
import Calendar from "./widget/Calendar.astro";
import FriendCircle from "./widget/FriendCircle.astro";
import MusicPlayer from "./widget/MusicPlayer.astro";
import Profile from "./widget/Profile.astro";
import TagCloud from "./widget/TagCloud.astro";
import WritingHeatmap from "./widget/WritingHeatmap.astro";
import ImageLightbox from "./behavior/ImageLightbox.astro";

/**
 * The registry of blocks a region can place. Adding one is an import plus a
 * line here, then a line in site.config.ts.
 *
 * Those three steps apply to region members only - widget and decor - not to
 * every block. Of the 28 files under src/blocks, 12 are listed here; the rest
 * are imported directly by whatever renders them, because they need the page
 * to hand them data (view/PostCard takes a post, view/Pagination takes a page
 * number) or because the layout gives them a fixed spot (chrome/Header and
 * chrome/Footer). A region is a list of names with props, so nothing that
 * needs page data can live in one.
 *
 * `satisfies` (rather than a type annotation) keeps the keys as literals, so
 * `BlockName` below is the union of the real names and a typo in
 * site.config.ts fails `astro check` instead of silently rendering nothing.
 *
 * Two sibling registries do the same job for the other axes, in shapes that
 * differ because what they hold differs: src/skins/index.ts is an object
 * whose values are theme-colors, and src/arrangements/index.ts is a bare
 * array of names. This one has to be a map because a block is a component
 * that must be imported.
 */
export const BLOCKS = {
  "chrome/Banner": Banner,
  "decor/Backdrop": Backdrop,
  "decor/BackToTop": BackToTop,
  "decor/ReadingProgress": ReadingProgress,
  "widget/BlogStats": BlogStats,
  "widget/Calendar": Calendar,
  "widget/FriendCircle": FriendCircle,
  "widget/MusicPlayer": MusicPlayer,
  "widget/Profile": Profile,
  "widget/TagCloud": TagCloud,
  // Implemented and registered, deliberately not placed in site.config.ts.
  "widget/WritingHeatmap": WritingHeatmap,
  "behavior/ImageLightbox": ImageLightbox,
} satisfies Record<string, AstroComponentFactory>;

export type BlockName = keyof typeof BLOCKS;
