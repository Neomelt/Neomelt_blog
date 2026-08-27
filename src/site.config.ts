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
export const siteLayout = {
  skin: "minimal",

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
      {
        use: "chrome/Banner",
        props: { subtitleKey: "index.heroIntro1", height: "34vh" },
        skins: ["anime"],
      },
    ],

    // Appears in the post sidebar. BlogPost grows the column on its own, so
    // adding to this list is the whole operation - no layout edit.
    aside: [
      "widget/BlogStats",
      { use: "widget/TagCloud", props: { limit: 18 } },
      "widget/Calendar",
    ],

    floating: [
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
