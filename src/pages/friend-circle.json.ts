import type { APIRoute } from "astro";
import { FRIEND_LINKS } from "../data/friends";
import { getFriendCirclePosts } from "../utils/friend-circle";
import { avatarSrc } from "../utils/avatar";

// Static JSON consumed client-side by /friends so the page never blocks on
// external RSS at render time. Generated once at build (and served from the
// dev cache in dev — see getFriendCirclePosts).
export const GET: APIRoute = async () => {
  try {
    const posts = await getFriendCirclePosts(FRIEND_LINKS, {
      perFeedLimit: 4,
      totalLimit: 18,
      maxAgeDays: 21,
      timeoutMs: 8000,
    });
    const localized = posts.map((post) => ({
      ...post,
      friendAvatar: avatarSrc(post.friendAvatar),
    }));
    return new Response(JSON.stringify(localized), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[friend-circle] Failed to build feed:", error);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
