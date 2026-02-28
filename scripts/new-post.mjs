#!/usr/bin/env node
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

function parseArgs(argv) {
	const args = {};
	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		if (!token.startsWith("--")) continue;
		const key = token.slice(2);
		const next = argv[i + 1];
		if (!next || next.startsWith("--")) {
			args[key] = true;
		} else {
			args[key] = next;
			i += 1;
		}
	}
	return args;
}

function pad2(value) {
	return String(value).padStart(2, "0");
}

function formatLocalIsoWithOffset(date) {
	const year = date.getFullYear();
	const month = pad2(date.getMonth() + 1);
	const day = pad2(date.getDate());
	const hour = pad2(date.getHours());
	const minute = pad2(date.getMinutes());
	const tzOffsetMinutes = -date.getTimezoneOffset();
	const sign = tzOffsetMinutes >= 0 ? "+" : "-";
	const abs = Math.abs(tzOffsetMinutes);
	const tzHour = pad2(Math.floor(abs / 60));
	const tzMinute = pad2(abs % 60);
	return `${year}-${month}-${day}T${hour}:${minute}:00${sign}${tzHour}:${tzMinute}`;
}

function sanitizeSlug(value) {
	return value
		.trim()
		.toLowerCase()
		.replaceAll(/[/\\?%*:|"<>]/g, "")
		.replaceAll(/\s+/g, "-")
		.replaceAll(/-+/g, "-")
		.replaceAll(/^-|-$/g, "");
}

function escapeYamlString(value) {
	return String(value).replaceAll("'", "''");
}

function normalizeTags(inputValue) {
	if (!inputValue) return [];
	return inputValue
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function parseBoolean(inputValue, defaultValue = false) {
	if (typeof inputValue !== "string") return defaultValue;
	const normalized = inputValue.trim().toLowerCase();
	if (["1", "true", "yes", "y"].includes(normalized)) return true;
	if (["0", "false", "no", "n"].includes(normalized)) return false;
	return defaultValue;
}

function buildFrontmatter({
	title,
	description,
	pubDate,
	pinned,
	hidden,
	heroImage,
	category,
	series,
	tags,
}) {
	const tagText = `[${tags.map((tag) => `'${escapeYamlString(tag)}'`).join(", ")}]`;
	return `---
title: '${escapeYamlString(title)}'
description: '${escapeYamlString(description)}'
pubDate: '${pubDate}'
pinned: ${pinned}
hidden: ${hidden}
heroImage: '${escapeYamlString(heroImage)}'
category: '${escapeYamlString(category)}'
series: '${escapeYamlString(series)}'
tags: ${tagText}
---

`;
}

function printHelp() {
	console.log(`Create a new blog post file with frontmatter.

Usage:
  npm run new:post -- --title "My Post"
  npm run new -- --title "My Post"

Optional flags:
  --title "Post title"                    (required)
  --slug "custom-file-name"               (default: from title)
  --desc "Short description"              (default: "")
  --tags "tag1,tag2"                      (default: [])
  --category "Category name"              (default: "")
  --series "Series name"                  (default: "")
  --pinned true|false                     (default: false)
  --hidden true|false                     (default: false)
  --hero "../../assets/cover.svg"
  --pubDate "2026-02-24T18:30:00+08:00"   (default: now)
  --dry-run
  --help`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		printHelp();
		return;
	}

	const canPrompt = input.isTTY && output.isTTY;
	const rl = canPrompt ? createInterface({ input, output }) : null;
	const ask = async (label, defaultValue = "") => {
		if (!canPrompt || !rl) return defaultValue;
		const suffix = defaultValue ? ` (${defaultValue})` : "";
		const answer = await rl.question(`${label}${suffix}: `);
		return answer.trim() || defaultValue;
	};

	const nowIso = formatLocalIsoWithOffset(new Date());
	const title = (args.title && String(args.title).trim()) || (await ask("Title"));
	if (!title) {
		rl?.close();
		throw new Error("Title is required.");
	}

	const defaultSlug = sanitizeSlug(title) || `post-${Date.now()}`;
	const slug = sanitizeSlug(
		(args.slug && String(args.slug).trim()) || (await ask("Slug", defaultSlug))
	);
	if (!slug) {
		rl?.close();
		throw new Error("Slug is invalid.");
	}

	const description =
		(args.desc && String(args.desc).trim()) || (await ask("Description", ""));
	const category =
		(args.category && String(args.category).trim()) || (await ask("Category", ""));
	const series = (args.series && String(args.series).trim()) || (await ask("Series", ""));
	const tagsInput =
		(args.tags && String(args.tags).trim()) || (await ask("Tags (comma separated)", ""));
	const pinned =
		typeof args.pinned === "string"
			? parseBoolean(args.pinned, false)
			: parseBoolean(await ask("Pinned [true/false]", "false"), false);
	const hidden =
		typeof args.hidden === "string"
			? parseBoolean(args.hidden, false)
			: parseBoolean(await ask("Hidden [true/false]", "false"), false);
	const heroImage =
		(args.hero && String(args.hero).trim()) ||
		(await ask("Hero image", "../../assets/cover.svg"));
	const pubDate =
		(args.pubDate && String(args.pubDate).trim()) || (await ask("pubDate", nowIso));

	const dirPath = path.resolve(process.cwd(), "src/content/blog");
	const filePath = path.join(dirPath, `${slug}.md`);
	const frontmatter = buildFrontmatter({
		title,
		description,
		pubDate,
		pinned,
		hidden,
		heroImage,
		category,
		series,
		tags: normalizeTags(tagsInput),
	});

	rl?.close();

	if (args["dry-run"]) {
		console.log(`\n[DRY RUN] ${filePath}\n`);
		console.log(frontmatter);
		return;
	}

	await mkdir(dirPath, { recursive: true });
	try {
		await access(filePath);
		throw new Error(`File already exists: ${filePath}`);
	} catch (error) {
		if (error?.code !== "ENOENT") {
			throw error;
		}
	}

	await writeFile(filePath, frontmatter, "utf-8");
	console.log(`Created: ${filePath}`);
}

main().catch((error) => {
	console.error(`[new-post] ${error.message}`);
	process.exitCode = 1;
});
