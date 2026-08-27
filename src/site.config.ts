import type { SiteLayout } from "./types/layout";

/**
 * The assembly file. What the site is made of, and which skin paints it.
 *
 * Blocks hold function only - none of them knows which skin is active.
 * Everything below is either a name from src/blocks/registry.ts or a
 * parameter, which is the whole switching mechanism: to change how the
 * site looks or what is on it, edit this file, not a component.
 *
 * Regions paint back to front: backdrop, page, floating.
 * Adding a block: write it, register it, name it here.
 */
import type { ImageMetadata } from "astro";

/**
 * Decorative cover art, unrelated to post content.
 *
 * Files in src/assets/covers/ rather than public/ on purpose: only src/ goes
 * through Astro's image pipeline, which is what turns a 5MB pixiv original
 * into the hashed, immutable webp the reference blogs serve. Drop files in
 * (scripts/fetch-covers.mjs does it for you) and they are picked up here with
 * no edit - each post maps to one deterministically from its title.
 *
 * Empty directory means no covers, and cards fall back to a text-only layout
 * rather than a generated stand-in.
 */
const coverModules = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/covers/*.{webp,jpg,jpeg,png,avif}",
  { eager: true },
);

export const coverPool: ImageMetadata[] = Object.keys(coverModules)
  .sort()
  .map((key) => coverModules[key]!.default);

/**
 * Who the site belongs to. Consumed by widget/Profile and available to any
 * other block that wants it - the footer still carries its own copy of these
 * links, which is worth unifying at some point.
 */
export const profile = {
  name: "Neomelt",
  /** Root-absolute, under public/. */
  avatar: "/head.jpg",
  /**
   * i18n key, so the bio follows the language toggle. Its own key rather than
   * the homepage intro it used to borrow: a card that sits beside every page
   * wants one line, and a full self-introduction reads as filler by the
   * second page.
   */
  bioKey: "profile.bio" as const,
  links: [
    { label: "GitHub", url: "https://github.com/Neomelt", icon: "github" },
    {
      label: "Bilibili",
      url: "https://space.bilibili.com/1025251137",
      icon: "bilibili",
    },
    { label: "Email", url: "mailto:3212929002@qq.com", icon: "mail" },
  ],
} as const;

/**
 * Banner art, kept separate from coverPool on purpose: the masthead showing
 * the same illustration as one of the cards below it reads as an accident.
 * Files go in src/assets/banner/ and are picked up here with no edit.
 *
 * Empty directory means the banner falls back to its gradient.
 */
const bannerModules = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/banner/*.{webp,jpg,jpeg,png,avif}",
  { eager: true },
);

export const bannerPool: ImageMetadata[] = Object.keys(bannerModules)
  .sort()
  .map((key) => bannerModules[key]!.default);

export const siteLayout = {
  // The skin a first-time visitor gets. Anyone who has picked one in the
  // reading panel keeps their choice - it lives in localStorage and wins.
  // Switching this to anime also brings the backdrop with it: that placement
  // carries skins: ["anime"], so the illustration is part of the default now.
  skin: "anime",
  layout: "feature",

  regions: {
    backdrop: [
      // Rendered under every skin, shown only under anime. See `skins` in
      // src/types/layout.ts for why this is not a build-time exclusion.
      // overlay is left to the skin: it differs between light and dark, and a
      // value here would pin both to one.
      // imageIndex is a position in bannerPool, which is the banner directory
      // sorted by filename - dropping in a file that sorts earlier shifts
      // every index after it.
      {
        use: "decor/Backdrop",
        props: { imageIndex: 1, blur: 2 },
        skins: ["anime"],
      },
    ],

    // Between the header and the content. An oversized masthead is the
    // loudest single move a skin can make, and no token expresses it - the
    // element either exists or it does not - so it lives here.
    // Empty: the artwork is the backdrop now, and a banner would put the
    // same picture on screen twice. Put chrome/Banner back here for a
    // masthead instead.
    masthead: [],

    // Left column. The shell adds a column for each side that has blocks, so
    // moving a widget across is moving one line.
    // MusicPlayer belongs on this side specifically: BlogPost.astro renders
    // asideStart into its table-of-contents column and has no asideEnd, so a
    // player on the other side would disappear - and stop - the moment a
    // visitor opened a post. It renders nothing while playlist.ts is empty.
    asideStart: [
      "widget/Profile",
      "widget/BlogStats",
      { use: "widget/MusicPlayer", props: { volume: 0.6 } },
    ],

    // Right column. Splitting the widgets across both sides is what fills a
    // wide screen - a single column leaves 41% of a 2560px display empty
    // however wide the shell gets, because the text cannot keep growing.
    // Moving a widget between columns is moving one line.
    asideEnd: [
      { use: "widget/TagCloud", props: { limit: 18 } },
      "widget/Calendar",
    ],

    floating: [
      { use: "decor/ReadingProgress", props: { height: "3px" } },
      { use: "decor/BackToTop" },
      "behavior/ImageLightbox",
    ],
  },
} satisfies SiteLayout;

/*
 * The backdrop placement carries `skins: ["anime"]`, so switching skin swaps
 * the artwork in and out along with the colours - no reload, no rebuild. Drop
 * the `skins` key to run it under minimal too; the block does not know which
 * skin is active either way.
 *
 * Backdrop takes `imageIndex`, a position in bannerPool - drop a file in
 * src/assets/banner/ and it joins the pool with no edit here.
 */
