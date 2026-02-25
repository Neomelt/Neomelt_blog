// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeVideoEmbed from "./src/utils/rehype-video-embed.mjs";

// https://astro.build/config
export default defineConfig({
	site: 'https://www.neomelt.cloud/',
	integrations: [mdx(), sitemap(), tailwind()],

	markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeVideoEmbed],
  }
});
