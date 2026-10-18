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
  {
    title: "Call your name _Gv_",
    artist: "澤野弘之、R!N_Gemie",
    src: "/music/library/Call%20your%20name%20_Gv_%20-%20%E6%BE%A4%E9%87%8E%E5%BC%98%E4%B9%8B%E3%80%81R%21N_Gemie.mp3",
  },
  {
    title: "One Last Kiss",
    artist: "宇多田ヒカル",
    src: "/music/library/One%20Last%20Kiss%20-%20%E5%AE%87%E5%A4%9A%E7%94%B0%E3%83%92%E3%82%AB%E3%83%AB.mp3",
  },
  {
    title: "Take Me Hand",
    artist: "DAISHI DANCE、Cécile Corbel",
    src: "/music/library/Take%20Me%20Hand%20-%20DAISHI%20DANCE%E3%80%81C%C3%A9cile%20Corbel.mp3",
  },
  {
    title: "Time Flows Ever Onward",
    artist: "Evan Call",
    src: "/music/library/Time%20Flows%20Ever%20Onward%20-%20Evan%20Call.mp3",
  },
  {
    title: "ありがとう...",
    artist: "KOKIA",
    src: "/music/library/%E3%81%82%E3%82%8A%E3%81%8C%E3%81%A8%E3%81%86...%20-%20KOKIA.mp3",
  },
  {
    title: "シリウスの心臓",
    artist: "ヰ世界情緒",
    src: "/music/library/%E3%82%B7%E3%83%AA%E3%82%A6%E3%82%B9%E3%81%AE%E5%BF%83%E8%87%93%20-%20%E3%83%B0%E4%B8%96%E7%95%8C%E6%83%85%E7%B7%92.mp3",
  },
  {
    title: "丸ノ内サディスティック",
    artist: "椎名林檎",
    src: "/music/library/%E4%B8%B8%E3%83%8E%E5%86%85%E3%82%B5%E3%83%87%E3%82%A3%E3%82%B9%E3%83%86%E3%82%A3%E3%83%83%E3%82%AF%20-%20%E6%A4%8E%E5%90%8D%E6%9E%97%E6%AA%8E.mp3",
  },
  {
    title: "恋人を射ち堕とした日",
    artist: "Sound Horizon",
    src: "/music/library/%E6%81%8B%E4%BA%BA%E3%82%92%E5%B0%84%E3%81%A1%E5%A0%95%E3%81%A8%E3%81%97%E3%81%9F%E6%97%A5%20-%20Sound%20Horizon.mp3",
  },
  {
    title: "永世のクレイドル",
    artist: "鈴華ゆう子",
    src: "/music/library/%E6%B0%B8%E4%B8%96%E3%81%AE%E3%82%AF%E3%83%AC%E3%82%A4%E3%83%89%E3%83%AB%20-%20%E9%88%B4%E8%8F%AF%E3%82%86%E3%81%86%E5%AD%90.mp3",
  },
  {
    title: "狂おしいほど僕には美しい",
    artist: "majiko",
    src: "/music/library/%E7%8B%82%E3%81%8A%E3%81%97%E3%81%84%E3%81%BB%E3%81%A9%E5%83%95%E3%81%AB%E3%81%AF%E7%BE%8E%E3%81%97%E3%81%84%20-%20majiko.mp3",
  },
  {
    title: "色は匂へど 散りぬるを (Full Version)",
    artist: "Senya",
    src: "/music/library/%E8%89%B2%E3%81%AF%E5%8C%82%E3%81%B8%E3%81%A9%20%E6%95%A3%E3%82%8A%E3%81%AC%E3%82%8B%E3%82%92%20(Full%20Version)%20-%20Senya.mp3",
  },
  {
    title: "風色Letter",
    artist: "水瀬いのり",
    src: "/music/library/%E9%A2%A8%E8%89%B2Letter%20-%20%E6%B0%B4%E7%80%AC%E3%81%84%E3%81%AE%E3%82%8A.mp3",
  },
];
