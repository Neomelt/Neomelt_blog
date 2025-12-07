import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			category: z.string().optional(),
			series: z.string().optional(),
			tags: z.array(z.string()).optional(),
		}),
});

const zueg = defineCollection({
	// Load Markdown files in the `src/content/zueg/` directory.
	loader: glob({ base: './src/content/zueg', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			category: z.string(), // 随笔分类：技术、生活、思考等
			tags: z.array(z.string()).optional(),
			heroImage: image().optional(),
			readingTime: z.number().optional(), // 预估阅读时间（分钟）
		}),
});

export const collections = { blog, zueg };
