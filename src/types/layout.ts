import type { BlockName } from "../blocks/registry";

export type { BlockName };

/**
 * A skin changes tokens and decoration only - colours, fonts, radii, shadows,
 * ornaments. It never changes which blocks exist or what they do, so any skin
 * combines with any block.
 */
export type SkinName = "minimal" | "anime";

/** Regions that hold an ordered list of blocks. */
export type RegionName = "aside" | "floating";

/** A bare name when the block needs no props, an object when it does. */
export type BlockPlacement =
  | BlockName
  | { use: BlockName; props?: Record<string, unknown> };

export interface SiteLayout {
  skin: SkinName;
  regions: Record<RegionName, BlockPlacement[]>;
}
