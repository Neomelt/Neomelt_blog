import type { SiteLayout } from "./types/layout";

/**
 * The assembly file: what the site is made of, and which skin paints it.
 *
 * To add something to a region, write the block, register it in
 * src/blocks/registry.ts, then add its name below. Layouts do not change.
 *
 * `aside` is wired but empty - the region exists so sidebar widgets can be
 * dropped in later without touching BaseLayout.
 */
export const siteLayout = {
  skin: "minimal",

  regions: {
    aside: [],
    floating: [
      { use: "fx/ClickEffect", props: { effect: "ink-glyph" } },
      "fx/ImageLightbox",
    ],
  },
} satisfies SiteLayout;
