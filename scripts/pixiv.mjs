const ORIGIN = "https://www.pixiv.net";
const HEADERS = { "User-Agent": "Mozilla/5.0", Referer: `${ORIGIN}/` };
const MAX_PAGES = 5;

async function request(url, image = false) {
  const stage = image ? "image download" : "Pixiv JSON";
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(image ? 60_000 : 20_000),
      });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.retryable = [408, 429, 500, 502, 503, 504].includes(
          response.status,
        );
        const retryAfter = response.headers.get("retry-after");
        error.retryAfter = retryAfter === null ? 0 : Number(retryAfter);
        if (Number.isNaN(error.retryAfter)) {
          error.retryAfter = (Date.parse(retryAfter) - Date.now()) / 1000;
        }
        await response.body?.cancel();
        throw error;
      }
      // Consume the body inside the attempt so interrupted transfers retry too.
      return image ? await response.arrayBuffer() : await response.json();
    } catch (error) {
      const temporary =
        error.retryable ||
        ["TimeoutError", "AbortError", "TypeError"].includes(error.name);
      if (!temporary || attempt === 2) {
        throw new Error(`${stage} ${url}: ${error.message}`, { cause: error });
      }
      const seconds = Math.max(
        2 ** attempt,
        Math.min(30, error.retryAfter || 0),
      );
      console.warn(
        `[pixiv] ${stage}: retry ${attempt + 1}/2 in ${seconds}s — ${url} (${error.message})`,
      );
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }
  }
}

async function json(url) {
  const data = await request(url);
  if (data.error) throw new Error(`Pixiv: ${data.message || "request failed"}`);
  return data;
}

function landscape(work) {
  return (
    Number(work.width) >= 1200 &&
    Number(work.height) > 0 &&
    Number(work.width) / Number(work.height) >= 1.15 &&
    Number(work.pageCount ?? work.illust_page_count) === 1 &&
    Number(work.illustType ?? work.illust_type) === 0
  );
}

/** Fetch at most five pages, excluding IDs already in the local library. */
export async function findIllustrations(options, known) {
  const picks = [];
  const seen = new Set(known);
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(
      options.search
        ? `/ajax/search/illustrations/${encodeURIComponent(options.search)}`
        : "/ranking.php",
      ORIGIN,
    );
    const params = options.search
      ? {
          word: options.search,
          order: "popular_d",
          mode: "safe",
          s_mode: "s_tag",
          type: "illust",
        }
      : { mode: options.ranking, content: "illust", format: "json" };
    if (options.date) params.date = options.date;
    url.search = new URLSearchParams({ ...params, p: String(page) }).toString();
    const data = await json(url);
    const works = options.search ? data.body?.illust?.data : data.contents;
    if (!Array.isArray(works))
      throw new Error("Pixiv returned an unexpected list format");
    for (const work of works) {
      const id = String(work.id ?? work.illust_id);
      if (!/^\d+$/.test(id) || seen.has(id)) continue;
      seen.add(id);
      const safe = options.search
        ? work.xRestrict === 0
        : work.illust_content_type?.sexual === 0;
      if (!safe || !landscape(work)) continue;
      picks.push(id);
      if (picks.length === options.take) return picks;
    }
    const lastPage = options.search ? data.body.illust.lastPage : data.next;
    if (works.length === 0 || !lastPage || Number(lastPage) <= page) break;
  }
  return picks;
}

/** Check metadata before downloading, including explicit artwork IDs. */
export async function fetchIllustration(id) {
  const { body } = await json(`${ORIGIN}/ajax/illust/${id}`);
  if (
    !body ||
    String(body.id ?? body.illustId) !== id ||
    typeof body.illustTitle !== "string" ||
    !body.illustTitle.trim() ||
    typeof body.userName !== "string" ||
    !body.userName.trim()
  ) {
    throw new Error(`${id}: incomplete Pixiv metadata`);
  }
  if (
    body.xRestrict !== 0 ||
    Number(body.pageCount) !== 1 ||
    Number(body.illustType) !== 0
  ) {
    throw new Error(`${id}: requires an all-ages, single-page illustration`);
  }
  return { title: body.illustTitle, author: body.userName };
}

export async function fetchOriginal(id) {
  return Buffer.from(await request(`https://pixiv.cat/${id}.jpg`, true));
}
