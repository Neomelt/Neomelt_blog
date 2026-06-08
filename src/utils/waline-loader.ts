/**
 * Returns a self-contained client script (as a string) that defines
 * `window.__walineLoadClient()` — a memoized, multi-CDN loader for the Waline
 * UMD client. Shared by Comments.astro and WalineCounter.astro so the loader
 * logic lives in one place. Safe to inline more than once: both the function
 * and the in-flight promise are guarded on `window`.
 */
export function walineLoaderScript(scriptUrls: string[]): string {
  return `
  window.__walineLoadClient = window.__walineLoadClient || function () {
    if (window.Waline && typeof window.Waline.init === "function") {
      return Promise.resolve(window.Waline);
    }
    if (window.__walineClientPromise) return window.__walineClientPromise;

    const sources = ${JSON.stringify(scriptUrls)};
    const tryLoad = (index) =>
      new Promise((resolve, reject) => {
        const src = sources[index];
        if (!src) {
          reject(new Error("No Waline client CDN source available"));
          return;
        }
        const existing = document.querySelector(
          'script[data-waline-client-src="' + src + '"]',
        );
        if (existing) {
          if (window.Waline && typeof window.Waline.init === "function") {
            resolve(window.Waline);
            return;
          }
          existing.addEventListener("load", () => resolve(window.Waline), { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error("Failed loading " + src)),
            { once: true },
          );
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.dataset.walineClientSrc = src;
        script.onload = () => {
          if (window.Waline && typeof window.Waline.init === "function") {
            resolve(window.Waline);
          } else {
            reject(new Error("Waline global not found after loading " + src));
          }
        };
        script.onerror = () => reject(new Error("Failed loading " + src));
        document.head.appendChild(script);
      }).catch((error) => {
        if (index >= sources.length - 1) throw error;
        return tryLoad(index + 1);
      });

    window.__walineClientPromise = tryLoad(0);
    return window.__walineClientPromise;
  };
  `;
}

export const WALINE_CLIENT_SCRIPT_URLS = [
  "/vendor/waline.umd.js",
  "https://unpkg.com/@waline/client@3.12.2/dist/waline.umd.js",
  "https://cdn.jsdelivr.net/npm/@waline/client@3.12.2/dist/waline.umd.js",
];
