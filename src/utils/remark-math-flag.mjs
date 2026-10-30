/**
 * Mark posts that contain math, so only those pages load the KaTeX
 * stylesheet. Runs after remark-math and reads its nodes, which works for
 * .md and .mdx alike - MDX entries have no pre-rendered HTML to inspect, and
 * scanning the raw source for $ misfires on shell prompts in code blocks.
 *
 * Read back as remarkPluginFrontmatter.hasMath from render().
 */
export default function remarkMathFlag() {
  return (tree, file) => {
    if (!containsMath(tree)) return;
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.hasMath = true;
  };
}

function containsMath(node) {
  if (node.type === "math" || node.type === "inlineMath") return true;
  return Array.isArray(node.children) && node.children.some(containsMath);
}
