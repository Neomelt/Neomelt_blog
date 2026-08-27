/**
 * What the player plays. The block reads this and nothing else, so adding a
 * track is one entry here plus one file in public/music/.
 *
 * public/ rather than src/assets/: Astro's asset pipeline is for images, and
 * audio put through it would be copied and hashed with no transform to show
 * for it. The cost of public/ is that these paths are root-absolute strings
 * with no build-time check - a typo shows up as a 404 at play time, not as a
 * build error - so keep the filenames boring.
 *
 * An empty list is a valid state: the block renders nothing rather than an
 * empty player, which is what makes it safe to leave placed in site.config
 * while the directory fills up.
 */
export interface Track {
  title: string;
  artist?: string;
  /** Root-absolute path under public/. Passed through withBase by the block. */
  src: string;
  /** Root-absolute path under public/. Falls back to a generic mark. */
  cover?: string;
}

export const PLAYLIST: Track[] = [
  // Re-encoded from a 320kbps source to 128kbps: 12.4 MB to 5.0 MB. The file
  // lives in git history forever, and background music on a blog is not what
  // 320kbps is for. Swap the original back in if that judgement is wrong.
  {
    title: "你",
    artist: "GALA",
    src: "/music/gala-ni.mp3",
  },
];
