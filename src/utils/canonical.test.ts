import { describe, expect, it } from "vitest";

import { normalizePathname } from "./canonical";

describe("canonical utils", () => {
  it("normalizes pathnames safely", () => {
    expect(normalizePathname("")).toBe("/");
    expect(normalizePathname("/posts/")).toBe("/posts");
    expect(normalizePathname("//posts//page//2//")).toBe("/posts/page/2");
  });
});
