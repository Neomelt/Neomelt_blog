import type { BlockName } from "../blocks/registry";

export type { BlockName };

/**
 * A skin changes tokens and decoration only - colours, fonts, radii, shadows,
 * ornaments. It never changes which blocks exist or what they do, so any skin
 * combines with any block.
 */
export type SkinName = "minimal" | "anime";

/**
 * Regions that hold an ordered list of blocks, painted back to front:
 * backdrop sits behind the page, floating above it.
 */
export type RegionName = "backdrop" | "aside" | "floating";

/** A bare name when the block needs no props, an object when it does. */
export type BlockPlacement =
  | BlockName
  | {
      use: BlockName;
      props?: Record<string, unknown>;
      /**
       * Restrict this placement to certain skins. Omit for every skin.
       *
       * Every listed block is still rendered - the filter is a CSS rule
       * keyed off data-skin, not a build-time branch. That is deliberate:
       * skin is a visitor's runtime choice held in localStorage, which the
       * server cannot know, so a block excluded at build time could never
       * appear when they switch.
       */
      skins?: SkinName[];
    };

export interface SiteLayout {
  skin: SkinName;
  regions: Record<RegionName, BlockPlacement[]>;
}
