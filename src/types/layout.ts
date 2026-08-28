import type { BlockName } from "../blocks/registry";
import type { SkinName } from "../skins";

export type { BlockName };

/**
 * How the post listing is arranged. Same markup in every case - only the
 * container and card CSS differ - so switching is a data attribute, not a
 * rebuild.
 */
export const LAYOUTS = [
  "grid",
  "feature",
  "list",
  "magazine",
  "timeline",
] as const;

export type LayoutName = (typeof LAYOUTS)[number];

/**
 * Re-exported so this file stays the one import for layout types. The union
 * itself is derived from SKIN_REGISTRY in src/skins/index.ts - writing it out
 * here as well was one of the seven edits a new skin used to need, and the
 * two copies could disagree.
 */
export type { SkinName };

/**
 * Regions that hold an ordered list of blocks, painted back to front:
 * backdrop sits behind the page, floating above it, and masthead runs
 * between the header and the content. asideStart and asideEnd are the
 * columns either side of the content - list blocks under one, the other, or
 * both, and the shell becomes two or three columns to match.
 */
export type RegionName =
  | "backdrop"
  | "masthead"
  | "asideStart"
  | "asideEnd"
  | "floating";

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
  /** Default post-list arrangement; visitors can switch it in the header. */
  layout: LayoutName;
  regions: Record<RegionName, BlockPlacement[]>;
}
