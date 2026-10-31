/**
 * Browser half of the Markdown components (src/utils/remark-components.ts):
 * tabs, copy buttons, BibTeX popovers and Mermaid diagrams. Everything here
 * is an enhancement; the server HTML already reads correctly without it.
 */
import { getDefaultUiText, type UiTranslationKey } from "../i18n/ui";

const t = (key: UiTranslationKey) =>
  window.__siteI18n?.t(key, getDefaultUiText(key)) ?? getDefaultUiText(key);

/* ---------- tabs ---------- */

let tabsCount = 0;

function enhanceTabs() {
  document
    .querySelectorAll<HTMLElement>(".md-tabs:not(.is-enhanced)")
    .forEach((tabs) => {
      const uid = `md-tabs-${++tabsCount}`;
      const panels = Array.from(
        tabs.querySelectorAll<HTMLElement>(":scope > .md-tab"),
      );
      const bar = document.createElement("div");
      bar.className = "md-tab-bar";
      bar.setAttribute("role", "tablist");

      const buttons = panels.map((panel, i) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "md-tab-button";
        button.id = `${uid}-tab-${i}`;
        button.setAttribute("role", "tab");
        button.textContent =
          panel.querySelector(":scope > .md-tab-label")?.textContent?.trim() ||
          `${i + 1}`;
        panel.id = `${uid}-panel-${i}`;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", button.id);
        button.setAttribute("aria-controls", panel.id);
        button.addEventListener("click", () => select(i));
        return button;
      });

      function select(index: number, focus = false) {
        buttons.forEach((button, i) => {
          const on = i === index;
          button.setAttribute("aria-selected", String(on));
          button.tabIndex = on ? 0 : -1;
          panels[i].hidden = !on;
        });
        if (focus) buttons[index].focus();
      }

      bar.addEventListener("keydown", (event) => {
        const current = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        if (current === -1) return;
        const last = buttons.length - 1;
        const next =
          event.key === "ArrowRight"
            ? current === last
              ? 0
              : current + 1
            : event.key === "ArrowLeft"
              ? current === 0
                ? last
                : current - 1
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? last
                  : -1;
        if (next === -1) return;
        event.preventDefault();
        select(next, true);
      });

      bar.append(...buttons);
      tabs.prepend(bar);
      tabs.classList.add("is-enhanced");
      select(0);
    });
}

/* ---------- inline copy ---------- */

document.addEventListener("click", async (event) => {
  const button =
    event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>(".md-copy-btn")
      : null;
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copy ?? "");
    button.classList.add("copied");
    window.setTimeout(() => button.classList.remove("copied"), 1500);
  } catch (err) {
    console.error("[md-components] Failed to copy:", err);
  }
});

/* ---------- mermaid ---------- */

type Mermaid = typeof import("mermaid").default;
let mermaidLoader: Promise<Mermaid> | null = null;
let drawCount = 0;

/** Only pages that contain a diagram ever download mermaid. */
async function drawMermaid(redraw = false) {
  const blocks = Array.from(
    document.querySelectorAll<HTMLElement>(
      redraw ? "pre.md-mermaid" : "pre.md-mermaid:not(.is-drawn)",
    ),
  );
  if (blocks.length === 0) return;
  mermaidLoader ??= import("mermaid").then((module) => module.default);
  const mermaid = await mermaidLoader;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme:
      document.documentElement.dataset.theme === "dark" ? "dark" : "neutral",
    fontFamily: getComputedStyle(document.body).fontFamily,
  });
  for (const block of blocks) {
    const source = block.dataset.source ?? block.textContent ?? "";
    block.dataset.source = source;
    // A broken diagram stays readable as its source.
    if (!(await mermaid.parse(source, { suppressErrors: true }))) continue;
    try {
      const { svg } = await mermaid.render(`md-mermaid-${++drawCount}`, source);
      block.innerHTML = svg;
      block.classList.add("is-drawn");
    } catch (err) {
      console.error("[md-components] Mermaid failed:", err);
    }
  }
}

new MutationObserver(() => void drawMermaid(true)).observe(
  document.documentElement,
  { attributes: true, attributeFilter: ["data-theme"] },
);

/* ---------- bibref ---------- */

const HOVER_OPEN_DELAY = 120;
const HOVER_CLOSE_DELAY = 160;
const GAP = 8;
const EDGE = 12;

let popover: HTMLElement | null = null;
let code: HTMLElement | null = null;
let copyButton: HTMLButtonElement | null = null;
let copyLabel: HTMLElement | null = null;
let active: HTMLButtonElement | null = null;
// Opened by click or tap: stays until the next click, Escape or an outside
// click. Hover-opened popovers follow the pointer instead.
let pinned = false;
let openTimer = 0;
let closeTimer = 0;
let copiedTimer = 0;

function ensurePopover(): HTMLElement {
  if (popover) {
    // ClientRouter swaps <body>, which takes a body-level node with it.
    if (!popover.isConnected) document.body.append(popover);
    return popover;
  }

  popover = document.createElement("div");
  popover.id = "bibref-popover";
  popover.className = "bibref-popover";
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-label", "BibTeX");

  copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "bibref-copy";
  copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
  copyLabel = document.createElement("span");
  copyButton.append(copyLabel);

  const header = document.createElement("div");
  header.className = "bibref-popover-header";
  header.append(copyButton);

  const pre = document.createElement("pre");
  code = document.createElement("code");
  pre.append(code);
  popover.append(header, pre);
  document.body.append(popover);

  copyButton.addEventListener("click", copyEntry);
  popover.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") clearTimeout(closeTimer);
  });
  popover.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" && !pinned) scheduleClose();
  });
  // The popover lives at the end of <body>, so tabbing on from it would
  // jump past the rest of the article. Hand focus back to its badge instead.
  popover.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !active) return;
    event.preventDefault();
    const badge = active;
    close();
    badge.focus();
  });

  return popover;
}

async function copyEntry() {
  if (!code || !copyButton || !copyLabel) return;
  try {
    await navigator.clipboard.writeText(code.textContent || "");
    copyButton.classList.add("copied");
    copyLabel.textContent = t("bibref.copied");
    clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(resetCopyButton, 2000);
  } catch (err) {
    console.error("[BibRef] Failed to copy BibTeX:", err);
  }
}

function resetCopyButton() {
  copyButton?.classList.remove("copied");
  if (copyLabel) copyLabel.textContent = t("bibref.copy");
}

function position(badge: HTMLElement) {
  if (!popover) return;
  const rect = badge.getBoundingClientRect();
  const headerBottom = Math.max(
    0,
    document.getElementById("site-header")?.getBoundingClientRect().bottom ?? 0,
  );
  const width = popover.offsetWidth;
  const height = popover.offsetHeight;
  const spaceAbove = rect.top - headerBottom;
  const spaceBelow = window.innerHeight - rect.bottom;
  // Above covers text already read; fall back to whichever side has room.
  const above =
    spaceAbove >= height + GAP ||
    (spaceBelow < height + GAP && spaceAbove > spaceBelow);
  const top = above ? rect.top - height - GAP : rect.bottom + GAP;
  const left = Math.max(
    EDGE,
    Math.min(rect.left, document.documentElement.clientWidth - width - EDGE),
  );
  popover.style.top = `${top + window.scrollY}px`;
  popover.style.left = `${left + window.scrollX}px`;
}

function open(badge: HTMLButtonElement, pin: boolean) {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  const panel = ensurePopover();
  if (active && active !== badge) active.setAttribute("aria-expanded", "false");
  active = badge;
  pinned = pin;
  if (code) code.textContent = badge.dataset.bib || "";
  clearTimeout(copiedTimer);
  resetCopyButton();
  badge.setAttribute("aria-expanded", "true");
  position(badge);
  panel.classList.add("is-visible");
}

function close() {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  popover?.classList.remove("is-visible");
  active?.setAttribute("aria-expanded", "false");
  active = null;
  pinned = false;
}

function scheduleClose() {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  closeTimer = window.setTimeout(close, HOVER_CLOSE_DELAY);
}

function bindBibRefs() {
  document.querySelectorAll<HTMLElement>(".bibref").forEach((ref) => {
    if (ref.dataset.bibrefBound) return;
    ref.dataset.bibrefBound = "true";
    const badge = ref.querySelector<HTMLButtonElement>(".bibref-badge");
    if (!badge) return;

    // Touch and pen produce compatibility mouse events around a tap; hover
    // listens to real mice only, so a tap is just the click below.
    ref.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      clearTimeout(closeTimer);
      if (active === badge) return;
      clearTimeout(openTimer);
      openTimer = window.setTimeout(() => {
        if (!pinned) open(badge, false);
      }, HOVER_OPEN_DELAY);
    });
    ref.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "mouse") return;
      clearTimeout(openTimer);
      if (!pinned && active === badge) scheduleClose();
    });

    badge.addEventListener("click", (event) => {
      if (pinned && active === badge) {
        close();
        return;
      }
      open(badge, true);
      // detail is 0 for Enter/Space: move keyboard users to the copy button.
      if (event.detail === 0) copyButton?.focus();
    });
  });
}

document.addEventListener("click", (event) => {
  if (!active || !(event.target instanceof Node)) return;
  if (popover?.contains(event.target)) return;
  if (event.target instanceof Element && event.target.closest(".bibref-badge"))
    return;
  close();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !active) return;
  const badge = active;
  const focusInside = popover?.contains(document.activeElement) ?? false;
  close();
  if (focusInside) badge.focus();
});

window.addEventListener("resize", () => {
  if (active) position(active);
});
document.addEventListener("astro:after-swap", close);

/* ---------- wiring ---------- */

// Each step skips work it has already done, so running on both the first
// load and astro:page-load (which can fire before this module) is safe.
function init() {
  enhanceTabs();
  bindBibRefs();
  void drawMermaid();
}

init();
document.addEventListener("astro:page-load", init);
