/**
 * Mark posts that contain math, so only those pages load the KaTeX
 * stylesheet. Runs after remark-math and reads its nodes, which works for
 * .md and .mdx alike - MDX entries have no pre-rendered HTML to inspect, and
 * scanning the raw source for $ misfires on shell prompts in code blocks.
 *
 * Read back as remarkPluginFrontmatter.hasMath from render().
 */
import type { RemarkPlugin } from "@astrojs/markdown-remark";
import type { Node } from "unist";

const remarkMathFlag: RemarkPlugin<[]> = () => (tree, file) => {
  if (!containsMath(tree)) return;
  file.data.astro ??= {};
  file.data.astro.frontmatter ??= {};
  file.data.astro.frontmatter.hasMath = true;
};

export default remarkMathFlag;

function containsMath(node: Node): boolean {
  if (node.type === "math" || node.type === "inlineMath") return true;
  return (
    "children" in node &&
    Array.isArray(node.children) &&
    node.children.some(containsMath)
  );
}
