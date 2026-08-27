import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

import { getPostDateKey, resolvePostDatesMap } from "./post-dates";

export interface SeriesEntry {
  post: CollectionEntry<"blog">;
  date: Date;
}

export interface Series {
  name: string;
  /** Oldest first - a series reads in publication order, not newest-first. */
  entries: SeriesEntry[];
}

export interface SeriesPosition {
  series: Series;
  /** 1-based, for display. */
  index: number;
  previous: CollectionEntry<"blog"> | null;
  next: CollectionEntry<"blog"> | null;
}

/**
 * A post belongs to a series only when the field holds something. Every post
 * currently ships `series: ""` from the template, and an empty string is not
 * a series name.
 */
function seriesNameOf(post: CollectionEntry<"blog">): string | null {
  const raw = post.data.series?.trim();
  return raw ? raw : null;
}

let cache: Map<string, Series> | null = null;

export async function getAllSeries(): Promise<Map<string, Series>> {
  if (cache) return cache;

  const posts = await getCollection("blog", ({ data }) => !data.hidden);
  const dates = await resolvePostDatesMap(posts);
  const grouped = new Map<string, SeriesEntry[]>();

  for (const post of posts) {
    const name = seriesNameOf(post);
    if (!name) continue;
    const date = dates.get(getPostDateKey(post))?.pubDate ?? post.data.pubDate;
    const list = grouped.get(name) ?? [];
    list.push({ post, date });
    grouped.set(name, list);
  }

  cache = new Map(
    [...grouped.entries()]
      .map(([name, entries]): [string, Series] => [
        name,
        {
          name,
          entries: entries.sort((a, b) => a.date.valueOf() - b.date.valueOf()),
        },
      ])
      // Longest series first on the index page; ties fall back to name so the
      // order does not drift between builds.
      .sort((a, b) =>
        b[1].entries.length - a[1].entries.length ||
        a[0].localeCompare(b[0]),
      ),
  );
  return cache;
}

/** Where a post sits in its series, or null when it is not in one. */
export async function getSeriesPosition(
  post: CollectionEntry<"blog">,
): Promise<SeriesPosition | null> {
  const name = seriesNameOf(post);
  if (!name) return null;
  const series = (await getAllSeries()).get(name);
  if (!series) return null;

  const i = series.entries.findIndex((e) => e.post.id === post.id);
  if (i === -1) return null;

  return {
    series,
    index: i + 1,
    previous: series.entries[i - 1]?.post ?? null,
    next: series.entries[i + 1]?.post ?? null,
  };
}
