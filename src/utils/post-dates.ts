import type { CollectionEntry } from "astro:content";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

type PostEntry = CollectionEntry<"blog"> | CollectionEntry<"zueg">;
export type ResolvedPostDates = { pubDate: Date; updatedDate: Date };

type GitIsoParts = {
    iso: string;
    datePart: string;
    hour: string;
    minute: string;
    offset: string;
};

type RawFrontmatterDates = {
    pubDateRaw: string | null;
    updatedDateRaw: string | null;
};

type GitDates = {
    first: GitIsoParts | null;
    last: GitIsoParts | null;
};

const execFileAsync = promisify(execFile);
const frontmatterDateCache = new Map<string, RawFrontmatterDates>();
const gitDateCache = new Map<string, GitDates>();

function pad2(value: string | number): string {
    return String(value).padStart(2, "0");
}

function parseDatePart(rawDate: string | null): string | null {
    if (typeof rawDate !== "string") return null;
    const match = rawDate.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseExplicitDate(rawDate: string | null): Date | null {
    if (typeof rawDate !== "string") return null;
    if (!/[T\s]\d{1,2}:\d{2}/.test(rawDate)) return null;
    const parsedDate = new Date(rawDate.trim());
    return Number.isNaN(parsedDate.valueOf()) ? null : parsedDate;
}

function parseGitIso(isoDateString: string): GitIsoParts | null {
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
        offset: match[4] === "Z" ? "+00:00" : match[4],
    };
}

function createDate(datePart: string, hour: string, minute: string, offset: string): Date {
    return new Date(`${datePart}T${hour}:${minute}:00${offset}`);
}

function fallbackDatePart(dateValue: Date): string {
    return `${dateValue.getUTCFullYear()}-${pad2(dateValue.getUTCMonth() + 1)}-${pad2(dateValue.getUTCDate())}`;
}

async function readFrontmatterDates(filePath?: string): Promise<RawFrontmatterDates> {
    if (!filePath) return { pubDateRaw: null, updatedDateRaw: null };
    const cachedValue = frontmatterDateCache.get(filePath);
    if (cachedValue) return cachedValue;

    try {
        const fileContent = await readFile(filePath, "utf-8");
        const frontmatterMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        const frontmatterBlock = frontmatterMatch?.[1] ?? "";
        const pubDateRaw =
            frontmatterBlock.match(/^pubDate:\s*['"]?([^'"\n]+)['"]?/m)?.[1]?.trim() ?? null;
        const updatedDateRaw =
            frontmatterBlock.match(/^updatedDate:\s*['"]?([^'"\n]+)['"]?/m)?.[1]?.trim() ?? null;
        const value = { pubDateRaw, updatedDateRaw };
        frontmatterDateCache.set(filePath, value);
        return value;
    } catch {
        const fallback = { pubDateRaw: null, updatedDateRaw: null };
        frontmatterDateCache.set(filePath, fallback);
        return fallback;
    }
}

async function readGitDates(filePath?: string): Promise<GitDates> {
    if (!filePath) return { first: null, last: null };
    const cachedValue = gitDateCache.get(filePath);
    if (cachedValue) return cachedValue;

    try {
        const { stdout } = await execFileAsync("git", ["log", "--follow", "--format=%aI", "--", filePath], {
            cwd: process.cwd(),
        });
        const commitLines = stdout
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
        const latestCommit = commitLines[0] ?? "";
        const earliestCommit = commitLines[commitLines.length - 1] ?? "";
        const value = {
            first: parseGitIso(earliestCommit),
            last: parseGitIso(latestCommit),
        };
        gitDateCache.set(filePath, value);
        return value;
    } catch {
        const fallback = { first: null, last: null };
        gitDateCache.set(filePath, fallback);
        return fallback;
    }
}

export function getPostDateKey(post: PostEntry): string {
    return `${post.collection}:${post.id}`;
}

export async function resolvePostDates(post: PostEntry): Promise<ResolvedPostDates> {
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
            : createDate(pubDatePart, "00", "00", "+00:00"));

    const updatedBaseDate = post.data.updatedDate ?? post.data.pubDate;
    const explicitUpdatedDate = parseExplicitDate(updatedDateRaw);
    let updatedDate: Date;

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
            updatedDate = createDate(updatedDatePart, "00", "00", "+00:00");
        }
    } else if (gitDates.last) {
        updatedDate = new Date(gitDates.last.iso);
    } else {
        updatedDate = pubDate;
    }

    return { pubDate, updatedDate };
}

export async function resolvePostDatesMap(posts: PostEntry[]): Promise<Map<string, ResolvedPostDates>> {
    const pairs = await Promise.all(
        posts.map(async (post) => [getPostDateKey(post), await resolvePostDates(post)] as const)
    );
    return new Map(pairs);
}
