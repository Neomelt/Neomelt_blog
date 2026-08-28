import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LAYOUTS } from "./index";

const ARRANGEMENT_DIR = join(process.cwd(), "src", "arrangements");
const SRC_DIR = join(process.cwd(), "src");

/**
 * The selectors in one arrangement file.
 *
 * Comments are stripped first: a `/* ... *\/` block sits directly above most
 * rules here, and matching up to the next `{` without removing them swallows
 * the comment and the previous closing brace into what looks like a selector.
 * At-rules are dropped rather than parsed - the selectors nested inside them
 * are matched on their own by the same pass.
 */
function selectorsOf(css: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...stripped.matchAll(/([^{}]+)\{/g)]
    .map((m) => m[1]!.trim().replace(/\s+/g, " "))
    .filter((sel) => sel.length > 0 && !sel.startsWith("@"));
}

function walk(dir: string, exts: string[]): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, exts);
    return exts.some((e) => entry.name.endsWith(e)) ? [full] : [];
  });
}

describe("arrangement contract", () => {
  it("declares exactly the arrangements that exist on disk", () => {
    // The two halves of adding an arrangement checking each other, the same
    // way skins.test.ts pairs SKIN_REGISTRY with the skins directory. A name
    // with no stylesheet is a pill that switches to nothing; a stylesheet
    // with no name ships CSS that no control can reach.
    const onDisk = readdirSync(ARRANGEMENT_DIR)
      .filter((f) => f.endsWith(".css"))
      .map((f) => f.replace(/\.css$/, ""))
      .sort();
    expect([...LAYOUTS].sort()).toEqual(onDisk);
  });

  it("keeps arrangement names out of block code", () => {
    // The rule skins have had all along, now applied to the other axis:
    // a block that branches on which arrangement is active puts the shape
    // back inside the component, which is what moving these files out of
    // PostCard.astro was for.
    const blocks = walk(join(SRC_DIR, "blocks"), [".astro"]);
    const leaks = blocks.filter((file) => {
      const body = readFileSync(file, "utf8");
      return LAYOUTS.some((name) =>
        new RegExp(`data-layout\\s*[~^$*|]?=\\s*["']?${name}\\b`).test(body),
      );
    });
    expect(leaks).toEqual([]);
  });

  it("scopes every rule to its own arrangement", () => {
    // A rule that forgets its html[data-layout="<name>"] prefix applies under
    // all five, which looks like a bug in whichever one the visitor is on.
    for (const name of LAYOUTS) {
      const css = readFileSync(join(ARRANGEMENT_DIR, `${name}.css`), "utf8");
      const unscoped = selectorsOf(css).filter(
        (sel) => !sel.startsWith(`html[data-layout="${name}"]`),
      );
      expect({ name, unscoped }).toEqual({ name, unscoped: [] });
    }
  });

  it("keeps selectors specific enough to beat the card's own rules", () => {
    // PostCard's base styles compile to `.post-card[data-astro-cid-x]`, and
    // one of them is `.post-card:last-child[data-astro-cid-x]` at 0,3,0.
    // These files are plain global CSS, so a selector reaching a card has to
    // carry .post-list as well to clear that bar - without it the grid
    // arrangement silently lost its border on the last card.
    for (const name of LAYOUTS) {
      const css = readFileSync(join(ARRANGEMENT_DIR, `${name}.css`), "utf8");
      const reachesCard = selectorsOf(css).filter((sel) =>
        /\.post-c(ard|over)/.test(sel),
      );
      const missingList = reachesCard.filter(
        (sel) => !sel.includes(".post-list"),
      );
      expect({ name, missingList }).toEqual({ name, missingList: [] });
    }
  });
});
