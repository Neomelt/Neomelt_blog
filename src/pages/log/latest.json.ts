import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { TELEGRAM_LOG_ENABLED } from "../../utils/telegram-log";

/**
 * What the 日常 page was built from. The scheduled workflow
 * (.github/workflows/telegram-log.yml) compares this digest with the live
 * channel and only asks for a rebuild when they differ, so an hourly check
 * does not turn into an hourly deploy.
 */
export const GET: APIRoute = async () => {
  const [channel] = TELEGRAM_LOG_ENABLED
    ? await getCollection("logChannel")
    : [];
  const body = channel
    ? {
        channel: channel.data.username,
        digest: channel.data.digest,
        limit: channel.data.limit,
        latestId: channel.data.latestId ?? null,
        fetchedAt: channel.data.fetchedAt.toISOString(),
      }
    : { channel: null };
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
};
