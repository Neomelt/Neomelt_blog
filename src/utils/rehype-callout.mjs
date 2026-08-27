/**
 * GitHub-style alerts: a blockquote whose first line is [!NOTE] and so on.
 *
 *   > [!WARNING]
 *   > This will overwrite the file.
 *
 * Chosen over the ::: fenced syntax because GitHub renders it natively, so
 * the same markdown reads correctly in the repository as well as on the site.
 * Unrecognised markers are left alone - a blockquote that happens to start
 * with bracketed text stays a blockquote.
 */
const TYPES = new Set(["note", "tip", "important", "warning", "caution"]);
const MARKER = /^\[!([A-Za-z]+)\]\s*/;

export default function rehypeCallout() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== "element" || node.tagName !== "blockquote") return;

      const firstParagraph = node.children.find(
        (child) => child.type === "element" && child.tagName === "p",
      );
      if (!firstParagraph) return;

      const firstText = firstParagraph.children[0];
      if (!firstText || firstText.type !== "text") return;

      const match = firstText.value.match(MARKER);
      if (!match) return;
      const type = match[1].toLowerCase();
      if (!TYPES.has(type)) return;

      // Strip the marker. If nothing else was on that line the paragraph is
      // now empty and gets dropped, so the body starts on the next one.
      firstText.value = firstText.value.slice(match[0].length);
      if (
        firstText.value.trim() === "" &&
        firstParagraph.children.length === 1
      ) {
        node.children = node.children.filter((c) => c !== firstParagraph);
      }

      node.tagName = "aside";
      node.properties = {
        ...(node.properties ?? {}),
        className: ["callout", `callout-${type}`],
        role: "note",
      };
      node.children = [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["callout-icon"], "aria-hidden": "true" },
          children: [icon(type)],
        },
        {
          type: "element",
          tagName: "div",
          properties: { className: ["callout-body"] },
          children: node.children,
        },
      ];
    });
  };
}

function icon(type) {
  const paths = {
    note: ["M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm0 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm1 8H7V7h2v5Z"],
    tip: ["M8 0a5 5 0 0 0-3 9v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V9a5 5 0 0 0-3-9ZM6 14h4v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-1Z"],
    important: ["M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM7 4h2v5H7V4Zm0 6h2v2H7v-2Z"],
    warning: ["M8.9 1.5a1 1 0 0 0-1.8 0l-7 13A1 1 0 0 0 1 16h14a1 1 0 0 0 .9-1.5l-7-13ZM7 6h2v4H7V6Zm0 6h2v2H7v-2Z"],
    caution: ["M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM4.7 4.7l6.6 6.6-1.4 1.4-6.6-6.6 1.4-1.4Z"],
  };
  return {
    type: "element",
    tagName: "svg",
    properties: { viewBox: "0 0 16 16", width: 16, height: 16 },
    children: (paths[type] ?? paths.note).map((d) => ({
      type: "element",
      tagName: "path",
      properties: { d, fill: "currentColor" },
      children: [],
    })),
  };
}

function walk(node, fn) {
  fn(node);
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) walk(child, fn);
}
