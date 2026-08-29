/// <reference types="astro/client" />

/**
 * The globals the inline scripts hang off `window`.
 *
 * Two kinds live here. The first is the small runtime API that BaseHead and
 * BaseLayout publish so that any block can read or change an axis without
 * importing anything - a block cannot import from an inline script, and an
 * inline script cannot be imported, so a global is the only channel there is.
 *
 * The second is the handler slots. Several components attach a listener to
 * `document` inside a function that re-runs on every navigation, and the only
 * way to drop the previous registration is to have kept a reference to it.
 * Parking that reference on `window` is what makes the swap possible. They
 * are declared rather than left implicit so that a typo in one of these names
 * is a type error instead of a listener that silently accumulates - which is
 * the exact bug that reached production in ReaderSettings.
 */
interface SiteI18nApi {
  t(key: string, fallback?: string): string;
  getLocale(): "zh" | "en";
  setLocale(locale: string): "zh" | "en";
  toggleLocale(): "zh" | "en";
}

interface SiteThemeApi {
  storageKey: string;
  skinStorageKey: string;
  defaultTheme: string;
  defaultSkin: string;
  skins: readonly string[];
  layouts: readonly string[];
  getTheme(): string;
  getSkin(): string;
  getLayout(): string;
  applyTheme(mode: string, options?: { persist?: boolean }): string;
  toggleTheme(): string;
  setSkin(skin: string): string;
  setLayout(layout: string, options?: { persist?: boolean }): string;
  cycleSkin(): string;
  cycleLayout(): string;
}

interface Window {
  __siteI18n?: SiteI18nApi;
  __siteTheme?: SiteThemeApi;

  /** Listener slots, held so the next navigation can remove the last one. */
  __headerLocaleHandler?: EventListener;
  __searchLocaleHandler?: EventListener;
  __searchKeydownHandler?: EventListener;
  __readerLocaleHandler?: EventListener;
  __readerKeydown?: EventListener;

  /** setInterval id for the footer's uptime counter. */
  __footerRuntimeInterval?: number;

  /** Set by utils/waline-loader once the client script has been fetched. */
  __walineLoadClient?: () => Promise<unknown>;
}
