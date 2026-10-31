import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchOriginal, findIllustrations } from "../../scripts/pixiv.mjs";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Pixiv request retries", () => {
  it("retries a timeout, allowing 60 seconds for image requests", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))
        .mockResolvedValueOnce(new Response("image")),
    );
    const result = fetchOriginal("123456");
    const check = expect(result).resolves.toEqual(Buffer.from("image"));
    await vi.runAllTimersAsync();
    await check;
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(timeout.mock.calls).toEqual([[60_000], [60_000]]);
  });

  it("retries when an image transfer is interrupted after response headers", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => {
            throw new TypeError("terminated");
          },
        })
        .mockResolvedValueOnce(new Response("complete")),
    );
    const check = expect(fetchOriginal("123456")).resolves.toEqual(
      Buffer.from("complete"),
    );
    await vi.runAllTimersAsync();
    await check;
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("stops after two retries and reports the request stage and URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 })),
    );
    const check = expect(fetchOriginal("123456")).rejects.toThrow(
      "image download https://pixiv.cat/123456.jpg: HTTP 503",
    );
    await vi.runAllTimersAsync();
    await check;
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("waits for Retry-After on a temporary rate limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response("limited", {
            status: 429,
            headers: { "Retry-After": "5" },
          }),
        )
        .mockResolvedValueOnce(new Response("image")),
    );
    const check = expect(fetchOriginal("123456")).resolves.toEqual(
      Buffer.from("image"),
    );
    await vi.advanceTimersByTimeAsync(4999);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await check;
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry permanent HTTP failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not found", { status: 404 })),
    );
    await expect(fetchOriginal("123456")).rejects.toThrow("HTTP 404");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps JSON requests at 20 seconds and leaves malformed JSON visible", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("invalid json")),
    );
    await expect(
      findIllustrations({ search: "tag", take: 1 }, new Set()),
    ).rejects.toThrow("Pixiv JSON");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(timeout).toHaveBeenCalledWith(20_000);
  });
});
