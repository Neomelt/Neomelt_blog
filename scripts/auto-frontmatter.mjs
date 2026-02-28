#!/usr/bin/env node
import { watch } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const CONTENT_DIR = path.resolve(process.cwd(), "src/content/blog");

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

function escapeYamlString(value) {
	return String(value).replaceAll("'", "''");
}

function normalizeTitleFromFilename(filePath) {
	const baseName = path.basename(filePath, path.extname(filePath));
	return baseName.replaceAll(/[-_]+/g, " ").trim() || "Untitled";
}

function buildFrontmatter(title) {
	return `---
title: '${escapeYamlString(title)}'
description: ''
pubDate: '${formatLocalIsoWithOffset(new Date())}'
pinned: false
hidden: false
heroImage: '../../assets/cover.svg'
category: ''
series: ''
tags: []
---

`;
}

async function isMarkdownFile(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	if (![".md", ".mdx"].includes(ext)) return false;
	try {
		const fileStats = await stat(filePath);
		return fileStats.isFile();
	} catch {
		return false;
	}
}

async function injectFrontmatterIfMissing(filePath) {
	if (!(await isMarkdownFile(filePath))) return;

	const content = await readFile(filePath, "utf-8");
	if (content.trim().length === 0) {
		const title = normalizeTitleFromFilename(filePath);
		await writeFile(filePath, `${buildFrontmatter(title)}\n`, "utf-8");
		console.log(`[auto-frontmatter] injected: ${path.relative(process.cwd(), filePath)}`);
		return;
	}

	if (/^---\r?\n[\s\S]*?\r?\n---/.test(content)) {
		return;
	}

	const headingMatch = content.match(/^\s*#\s+(.+)$/m);
	const title = headingMatch?.[1]?.trim() || normalizeTitleFromFilename(filePath);
	await writeFile(filePath, `${buildFrontmatter(title)}${content}`, "utf-8");
	console.log(`[auto-frontmatter] injected: ${path.relative(process.cwd(), filePath)}`);
}

async function repairExistingFiles() {
	const names = await readdir(CONTENT_DIR);
	await Promise.all(
		names.map(async (name) => {
			const filePath = path.join(CONTENT_DIR, name);
			await injectFrontmatterIfMissing(filePath);
		})
	);
}

async function main() {
	await mkdir(CONTENT_DIR, { recursive: true });
	await repairExistingFiles();
	console.log(`[auto-frontmatter] watching: ${CONTENT_DIR}`);

	const timers = new Map();
	const schedule = (filePath) => {
		const current = timers.get(filePath);
		if (current) clearTimeout(current);
		const next = setTimeout(async () => {
			timers.delete(filePath);
			try {
				await injectFrontmatterIfMissing(filePath);
			} catch (error) {
				console.error(`[auto-frontmatter] failed: ${filePath}`);
				console.error(error?.message || error);
			}
		}, 20);
		timers.set(filePath, next);
	};

	watch(CONTENT_DIR, (eventType, filename) => {
		if (!filename) return;
		const filePath = path.join(CONTENT_DIR, String(filename));
		if (eventType === "rename" || eventType === "change") {
			schedule(filePath);
		}
	});
}

main().catch((error) => {
	console.error(`[auto-frontmatter] ${error?.message || error}`);
	process.exitCode = 1;
});
