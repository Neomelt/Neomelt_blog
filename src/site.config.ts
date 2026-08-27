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
  /** i18n key, so the bio follows the language toggle. */
  bioKey: "index.heroIntro1" as const,
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

export const siteLayout = {
  skin: "minimal",
  layout: "grid",
  asidePosition: "left",

  regions: {
    backdrop: [
      // Rendered under every skin, shown only under anime. See `skins` in
      // src/types/layout.ts for why this is not a build-time exclusion.
      // No `skins` filter: the backdrop is tinted from --accent, so it reads
      // as restrained under minimal and richer under anime without being
      // owned by either. Add skins: ["anime"] to confine it.
      { use: "decor/Backdrop", props: { overlay: 0.42 } },
    ],

    // Between the header and the content. An oversized masthead is the
    // loudest single move a skin can make, and no token expresses it - the
    // element either exists or it does not - so it lives here.
    masthead: [
      // No skins filter: the banner replaces the old text hero on the home
      // page, so it belongs under both. coverIndex draws from the same pool
      // the cards use.
      {
        use: "chrome/Banner",
        props: { subtitleKey: "index.heroIntro1", height: "38vh", coverIndex: 0 },
      },
    ],

    // Appears in the post sidebar. BlogPost grows the column on its own, so
    // adding to this list is the whole operation - no layout edit.
    aside: [
      "widget/Profile",
      "widget/BlogStats",
      { use: "widget/TagCloud", props: { limit: 18 } },
      "widget/Calendar",
    ],

    floating: [
      { use: "decor/ReadingProgress", props: { height: "3px" } },
      { use: "decor/BackToTop" },
      {
        use: "decor/SakuraFall",
        props: { count: 20, duration: 16 },
        skins: ["anime"],
      },
      { use: "decor/ClickEffect", props: { effect: "ink-glyph" } },
      "behavior/ImageLightbox",
    ],
  },
} satisfies SiteLayout;

/*
 * The two placements above carry `skins: ["anime"]`, so the palette button
 * in the header swaps the backdrop and the petals in and out along with the
 * colours - no reload, no rebuild. Drop the `skins` key to run either one
 * under the minimal skin too; neither block knows which skin is active.
 *
 * With an illustration in public/, give Backdrop: src: "/wallpaper.webp".
 */
