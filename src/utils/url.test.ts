import { describe, expect, it } from "vitest";
import { applyBase } from "./url";

describe("applyBase", () => {
  it("is a no-op on the primary deployment (base '/')", () => {
    expect(applyBase("/", "/posts")).toBe("/posts");
    expect(applyBase("/", "/")).toBe("/");
    expect(applyBase("/", "/tags#Tailscale")).toBe("/tags#Tailscale");
  });

  it("prefixes the mirror base with or without trailing slash", () => {
    expect(applyBase("/Neomelt_blog/", "/posts")).toBe("/Neomelt_blog/posts");
    expect(applyBase("/Neomelt_blog", "/posts")).toBe("/Neomelt_blog/posts");
    expect(applyBase("/Neomelt_blog/", "/")).toBe("/Neomelt_blog/");
  });

  it("normalizes paths missing the leading slash", () => {
    expect(applyBase("/Neomelt_blog/", "posts")).toBe("/Neomelt_blog/posts");
    expect(applyBase("/", "posts")).toBe("/posts");
  });
});
