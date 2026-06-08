// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeVideoEmbed from "./src/utils/rehype-video-embed.mjs";
import { localizeAvatars } from "./src/utils/localize-avatars";

// Download + cache friend avatars to public/avatars/ before pages render, on
// any build path (local / Vercel / CI), so visitors load them from this origin
// instead of ~24 third-party hosts.
const localizeAvatarsIntegration = {
  name: "localize-avatars",
  hooks: {
    "astro:build:start": async () => {
      await localizeAvatars();
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: "https://www.neomelt.cloud/",
  integrations: [mdx(), sitemap(), tailwind(), localizeAvatarsIntegration],

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeVideoEmbed],
  },
});
