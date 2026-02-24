import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { SITE_TITLE } from '../consts';

const FEED_AUTHOR = 'Neomelt';
const FEED_DESCRIPTION = 'Latest posts from Neomelt Blog.';
const FALLBACK_SITE = 'https://www.neomelt.cloud/';
const execFileAsync = promisify(execFile);
const gitDateCache = new Map();
const frontmatterDateCache = new Map();

function pad2(value) {
	return String(value).padStart(2, '0');
}

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

function parseDatePart(rawDate) {
	if (typeof rawDate !== 'string') return null;
	const match = rawDate.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
	if (!match) return null;
	const [, year, month, day] = match;
	return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseExplicitDate(rawDate) {
	if (typeof rawDate !== 'string') return null;
	if (!/[T\s]\d{1,2}:\d{2}/.test(rawDate)) return null;
	const parsedDate = new Date(rawDate.trim());
	return Number.isNaN(parsedDate.valueOf()) ? null : parsedDate;
}

function parseGitIso(isoDateString) {
	if (!isoDateString) return null;
	const match = isoDateString.trim().match(
		/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):\d{2}(Z|[+\-]\d{2}:\d{2})$/
	);
	if (!match) return null;
	return {
		iso: isoDateString.trim(),
		datePart: match[1],
		hour: match[2],
		minute: match[3],
		offset: match[4] === 'Z' ? '+00:00' : match[4],
	};
}

function createDate(datePart, hour, minute, offset) {
	return new Date(`${datePart}T${hour}:${minute}:00${offset}`);
}

function fallbackDatePart(dateValue) {
	return `${dateValue.getUTCFullYear()}-${pad2(dateValue.getUTCMonth() + 1)}-${pad2(dateValue.getUTCDate())}`;
}

async function readFrontmatterDates(filePath) {
	if (!filePath) return { pubDateRaw: null, updatedDateRaw: null };
	if (frontmatterDateCache.has(filePath)) return frontmatterDateCache.get(filePath);

	try {
		const fileContent = await readFile(filePath, 'utf-8');
		const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
		const frontmatterBlock = frontmatterMatch?.[1] ?? '';
		const pubDateRaw =
			frontmatterBlock.match(/^pubDate:\s*['"]?([^'"\n]+)['"]?/m)?.[1]?.trim() ?? null;
		const updatedDateRaw =
			frontmatterBlock.match(/^updatedDate:\s*['"]?([^'"\n]+)['"]?/m)?.[1]?.trim() ?? null;
		const value = { pubDateRaw, updatedDateRaw };
		frontmatterDateCache.set(filePath, value);
		return value;
	} catch {
		const value = { pubDateRaw: null, updatedDateRaw: null };
		frontmatterDateCache.set(filePath, value);
		return value;
	}
}

async function readGitDates(filePath) {
	if (!filePath) return { first: null, last: null };
	if (gitDateCache.has(filePath)) return gitDateCache.get(filePath);

	try {
		const { stdout } = await execFileAsync('git', ['log', '--follow', '--format=%aI', '--', filePath], {
			cwd: process.cwd(),
		});
		const commitLines = stdout
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);
		const latestCommit = commitLines[0] ?? '';
		const earliestCommit = commitLines[commitLines.length - 1] ?? '';
		const value = {
			first: parseGitIso(earliestCommit),
			last: parseGitIso(latestCommit),
		};
		gitDateCache.set(filePath, value);
		return value;
	} catch {
		const value = { first: null, last: null };
		gitDateCache.set(filePath, value);
		return value;
	}
}

async function resolvePostDates(post) {
	const [{ pubDateRaw, updatedDateRaw }, gitDates] = await Promise.all([
		readFrontmatterDates(post.filePath),
		readGitDates(post.filePath),
	]);

	const explicitPubDate = parseExplicitDate(pubDateRaw);
	const pubDatePart = parseDatePart(pubDateRaw) ?? fallbackDatePart(post.data.pubDate);
	const pubDate =
		explicitPubDate ??
		(gitDates.first
			? createDate(pubDatePart, gitDates.first.hour, gitDates.first.minute, gitDates.first.offset)
			: createDate(pubDatePart, '00', '00', '+00:00'));

	const updatedBaseDate = post.data.updatedDate ?? post.data.pubDate;
	const explicitUpdatedDate = parseExplicitDate(updatedDateRaw);
	let updatedDate;

	if (explicitUpdatedDate) {
		updatedDate = explicitUpdatedDate;
	} else if (updatedDateRaw) {
		const updatedDatePart = parseDatePart(updatedDateRaw) ?? fallbackDatePart(updatedBaseDate);
		if (gitDates.last) {
			updatedDate = createDate(
				updatedDatePart,
				gitDates.last.hour,
				gitDates.last.minute,
				gitDates.last.offset
			);
		} else {
			updatedDate = createDate(updatedDatePart, '00', '00', '+00:00');
		}
	} else if (gitDates.last) {
		updatedDate = new Date(gitDates.last.iso);
	} else {
		updatedDate = pubDate;
	}

	return { pubDate, updatedDate };
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
	const posts = await getCollection('blog');
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
