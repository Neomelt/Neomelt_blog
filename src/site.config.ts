import type { SiteLayout } from "./types/layout";
import { SITE_EMAIL } from "./consts";

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
 * Empty directory means no covers, and cards fall back to a deterministic
 * gradient panel derived from the post id.
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
    { label: "Email", url: `mailto:${SITE_EMAIL}`, icon: "mail" },
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

/**
 * The "日常" page: short posts pulled from a public Telegram channel at build
 * time (plugins/telegram-log). Empty channel = feature off: no nav link, and
 * /log shows an empty state. A non-empty TELEGRAM_LOG_CHANNEL environment
 * value overrides the value here, which is how a local build can point at
 * another channel without editing this file.
 */
export const telegramLog = {
  channel: "yohakunite",
  /** Posts kept on the page; 0 means the whole public channel history. */
  limit: 0,
  /** Zone the timestamps are printed in; the build machine runs on UTC. */
  timeZone: "Asia/Shanghai",
};

export const siteLayout = {
  // Default to the crisp, wallpaper-free minimal skin with inset thumbnails.
  // Visitors who prefer the illustrated glass skin can still switch in the
  // reading panel.
  skin: "minimal",
  layout: "list",

  regions: {
    backdrop: [
      {
        use: "decor/Backdrop",
        props: { imageIndex: 1, lightImageIndex: 0, blur: 2 },
        skins: ["anime"],
      },
    ],

    masthead: [],

    asideStart: ["widget/SidebarNav"],

    asideEnd: [
      "widget/WritingPulse",
      "widget/BlogStats",
      { use: "widget/TagCloud", props: { limit: 18 } },
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
