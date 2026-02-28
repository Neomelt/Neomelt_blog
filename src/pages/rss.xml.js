import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_TITLE } from '../consts';
import { resolvePostDates } from '../utils/post-dates';

const FEED_AUTHOR = 'Neomelt';
const FEED_DESCRIPTION = 'Latest posts from Neomelt Blog.';
const FALLBACK_SITE = 'https://www.neomelt.cloud/';

function escapeXml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');
}

function toAbsoluteUrl(path, site) {
	return new URL(path, site).toString();
}

function getImageUrl(heroImage, site) {
	if (!heroImage) return undefined;
	if (typeof heroImage === 'string') {
		if (heroImage.startsWith('__ASTRO_IMAGE_')) return undefined;
		return toAbsoluteUrl(heroImage, site);
	}
	if (typeof heroImage === 'object' && heroImage !== null && 'src' in heroImage) {
		const src = heroImage.src;
		if (typeof src === 'string' && src.length > 0) {
			return toAbsoluteUrl(src, site);
		}
	}
	return undefined;
}

function guessImageMimeType(url) {
	const normalizedUrl = url.toLowerCase().split('?')[0];
	if (normalizedUrl.endsWith('.png')) return 'image/png';
	if (normalizedUrl.endsWith('.jpg') || normalizedUrl.endsWith('.jpeg')) return 'image/jpeg';
	if (normalizedUrl.endsWith('.webp')) return 'image/webp';
	if (normalizedUrl.endsWith('.gif')) return 'image/gif';
	if (normalizedUrl.endsWith('.svg')) return 'image/svg+xml';
	return undefined;
}

function toRfc822Date(date) {
	return new Date(date).toUTCString();
}

function buildItemCustomData({ author, publishedDate, updatedDate, imageUrl, imageMimeType }) {
	const fields = [
		`<dc:creator>${escapeXml(author)}</dc:creator>`,
		`<dc:date>${escapeXml(new Date(publishedDate).toISOString())}</dc:date>`,
		`<dcterms:modified>${escapeXml(new Date(updatedDate).toISOString())}</dcterms:modified>`,
	];
	if (imageUrl) {
		const mimeTypePart = imageMimeType ? ` type="${escapeXml(imageMimeType)}"` : '';
		fields.push(
			`<media:content medium="image" url="${escapeXml(imageUrl)}"${mimeTypePart} />`
		);
		fields.push(`<media:thumbnail url="${escapeXml(imageUrl)}" />`);
	}
	return fields.join('');
}

export async function GET(context) {
	const site = context.site ?? FALLBACK_SITE;
	const posts = await getCollection('blog', ({ data }) => !data.hidden);
	const postsWithResolvedDates = await Promise.all(
		posts.map(async (post) => {
			const { pubDate, updatedDate } = await resolvePostDates(post);
			return { post, pubDate, updatedDate };
		})
	);
	postsWithResolvedDates.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

	const lastBuildDate = postsWithResolvedDates.reduce(
		(latest, post) => {
			const candidate = post.updatedDate;
			return candidate > latest ? candidate : latest;
		},
		new Date(0)
	);

	return rss({
		title: SITE_TITLE,
		description: FEED_DESCRIPTION,
		site,
		stylesheet: '/rss.xsl',
		trailingSlash: false,
		xmlns: {
			atom: 'http://www.w3.org/2005/Atom',
			dc: 'http://purl.org/dc/elements/1.1/',
			dcterms: 'http://purl.org/dc/terms/',
			media: 'http://search.yahoo.com/mrss/',
		},
		customData: [
			'<language>zh-cn</language>',
			`<lastBuildDate>${escapeXml(toRfc822Date(lastBuildDate))}</lastBuildDate>`,
			`<atom:link href="${escapeXml(toAbsoluteUrl('/rss.xml', site))}" rel="self" type="application/rss+xml" />`,
		].join(''),
		items: postsWithResolvedDates.map(({ post, pubDate, updatedDate }) => {
			const link = `/posts/${post.id}`;
			const itemUrl = toAbsoluteUrl(link, site);
			const imageUrl = getImageUrl(post.data.heroImage, site);
			const imageMimeType = imageUrl ? guessImageMimeType(imageUrl) : undefined;
			const categories = Array.from(
				new Set([post.data.category, ...(post.data.tags ?? [])].filter(Boolean))
			);

			return {
				title: post.data.title,
				description: post.data.description,
				pubDate,
				link,
				content: post.rendered?.html ?? post.body ?? post.data.description,
				author: FEED_AUTHOR,
				commentsUrl: `${itemUrl}#comments`,
				categories,
				customData: buildItemCustomData({
					author: FEED_AUTHOR,
					publishedDate: pubDate,
					updatedDate,
					imageUrl,
					imageMimeType,
				}),
			};
		}),
	});
}
