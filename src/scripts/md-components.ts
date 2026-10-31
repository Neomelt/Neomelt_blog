/**
 * Browser half of the Markdown components (src/utils/remark-components.ts):
 * tabs and copy buttons. Everything here is an enhancement; the server HTML already reads correctly without it.
 */
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

/* ---------- wiring ---------- */

// Each step skips work it has already done, so running on both the first
// load and astro:page-load (which can fire before this module) is safe.
function init() {
  enhanceTabs();
}

init();
document.addEventListener("astro:page-load", init);
