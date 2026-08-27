import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { SKINS, SKIN_THEME_COLORS } from "./index";

const SKIN_DIR = join(process.cwd(), "src", "skins");
const SRC_DIR = join(process.cwd(), "src");

function readSkinTokens(skin: string): Set<string> {
  const css = readFileSync(join(SKIN_DIR, skin, "tokens.css"), "utf8");
  return new Set(
    [...css.matchAll(/^\s+(--[a-z0-9-]+):/gm)].map((m) => m[1] as string),
  );
}

function walk(dir: string, exts: string[]): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, exts);
    return exts.some((e) => entry.name.endsWith(e)) ? [full] : [];
  });
}

const allSource = walk(SRC_DIR, [".astro", ".css", ".ts"])
  .filter((f) => !f.includes(`${join("src", "skins")}`))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

describe("skin token contract", () => {
  it("every skin defines exactly the same token names", () => {
    // A skin may change what a token is, never which tokens exist - a block
    // reads var(--x) with no idea which skin is active, so a name missing
    // from one skin is an unstyled element the moment a visitor switches.
    const [first, ...rest] = SKINS;
    const reference = readSkinTokens(first);
    for (const skin of rest) {
      const tokens = readSkinTokens(skin);
      const missing = [...reference].filter((t) => !tokens.has(t));
      const extra = [...tokens].filter((t) => !reference.has(t));
      expect({ skin, missing, extra }).toEqual({ skin, missing: [], extra: [] });
    }
  });

  it("every token has at least one consumer", () => {
    // Declaring a token nothing reads is the defect Yukina shipped with
    // bannerStyle: the config offers 'static' and 'hidden' while the layout
    // only ever checks for 'LOOP'.
    const tokens = readSkinTokens(SKINS[0]);
    const orphans = [...tokens].filter(
      (token) => !allSource.includes(`var(${token})`),
    );
    expect(orphans).toEqual([]);
  });

  it("declares a theme-color for every skin", () => {
    for (const skin of SKINS) {
      expect(SKIN_THEME_COLORS[skin]).toMatchObject({
        light: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        dark: expect.stringMatching(/^#[0-9a-f]{6}$/i),
      });
    }
  });

  it("keeps skin names out of block code", () => {
    // Blocks are function only. The moment one branches on which skin is
    // active, switching stops being a matter of configuration.
    const blocks = walk(join(SRC_DIR, "blocks"), [".astro"]);
    const leaks = blocks.filter((file) => {
      const body = readFileSync(file, "utf8");
      return SKINS.some((skin) => body.includes(`data-skin="${skin}"`));
    });
    expect(leaks).toEqual([]);
  });
});
