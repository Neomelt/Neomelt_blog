/**
 * Wrap every markdown table in a horizontally scrollable container.
 *
 * A wide table has to overflow somewhere. Without a wrapper it overflows the
 * page, and on a phone that means the whole layout scrolls sideways - the
 * widest table here is five columns, which does exactly that. Putting
 * overflow-x on the table itself does not work either: it needs
 * `display: block` to take effect, which drops the table's own layout and its
 * width: 100%.
 *
 * So: a wrapper div, styled in global.css as .table-scroll.
 */
export default function rehypeTableScroll() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (
        node.type !== "element" ||
        node.tagName !== "table" ||
        !parent ||
        index === undefined
      ) {
        return;
      }
      // Already wrapped, e.g. by a re-run over the same tree.
      if (
        parent.type === "element" &&
        parent.tagName === "div" &&
        parent.properties?.className?.includes?.("table-scroll")
      ) {
        return;
      }
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"], tabindex: 0, role: "region" },
        children: [node],
      };
    });
  };
}

/** Minimal depth-first walk; the tree here is small and hast-util-visit is
    not a dependency of this project. */
function visit(node, fn, parent, index) {
  fn(node, index, parent);
  const children = node.children;
  if (!Array.isArray(children)) return;
  for (let i = 0; i < children.length; i += 1) {
    visit(children[i], fn, node, i);
  }
}
