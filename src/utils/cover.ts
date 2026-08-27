import type { ImageMetadata } from "astro";
import { getCollection } from "astro:content";

import { coverPool } from "../site.config";

/**
 * Assign a cover to each post, spread as evenly as the pool allows.
 *
 * Hashing a title and taking it modulo the pool size collides: two posts can
 * land on the same image even when there are spares. Walking the posts in a
 * stable order and stepping through the pool cannot - with at least as many
 * images as posts every post gets a distinct one, and below that the reuse
 * is even rather than lumpy.
 *
 * Ordering is by id, not by date, so adding a post does not reshuffle the
 * covers of everything published after it.
 */
let assignment: Map<string, ImageMetadata> | null = null;

async function buildAssignment(): Promise<Map<string, ImageMetadata>> {
  const posts = await getCollection("blog", ({ data }) => !data.hidden);
  const ids = posts.map((post) => post.id).sort();
  const map = new Map<string, ImageMetadata>();
  if (coverPool.length === 0) return map;
  ids.forEach((id, index) => {
    map.set(id, coverPool[index % coverPool.length]!);
  });
  return map;
}

export async function coverForPost(
  postId: string,
): Promise<ImageMetadata | null> {
  assignment ??= await buildAssignment();
  return assignment.get(postId) ?? null;
}

/** How thin the pool is spread; used to warn during a build. */
export async function coverPressure(): Promise<{
  posts: number;
  covers: number;
}> {
  const posts = await getCollection("blog", ({ data }) => !data.hidden);
  return { posts: posts.length, covers: coverPool.length };
}
