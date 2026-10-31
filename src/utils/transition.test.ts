import { describe, expect, it } from "vitest";
import { postTitleTransition } from "./transition";

describe("postTitleTransition", () => {
  it("keeps ASCII and CJK ids as they are", () => {
    expect(postTitleTransition("rust-guide")).toBe(
      "view-transition-name: post-title-rust-guide",
    );
    expect(postTitleTransition("关于rm的碎碎念")).toBe(
      "view-transition-name: post-title-关于rm的碎碎念",
    );
  });

  it("escapes characters that are not valid in a CSS identifier", () => {
    expect(postTitleTransition("what's new")).toBe(
      "view-transition-name: post-title-what\\27 s\\20 new",
    );
  });
});
