import { describe, expect, it } from "vitest";

import {
    getPrimaryCanonicalPath,
    isLegacyBlogAliasPath,
    normalizePathname,
} from "./canonical";

describe("canonical utils", () => {
    it("normalizes pathnames safely", () => {
        expect(normalizePathname("")).toBe("/");
        expect(normalizePathname("/blog/")).toBe("/blog");
        expect(normalizePathname("//blog//page//2//")).toBe("/blog/page/2");
    });

    it("maps legacy blog aliases to primary routes", () => {
        expect(getPrimaryCanonicalPath("/blog")).toBe("/posts");
        expect(getPrimaryCanonicalPath("/blog/archive")).toBe("/posts/archive");
        expect(getPrimaryCanonicalPath("/blog/tags")).toBe("/tags");
        expect(getPrimaryCanonicalPath("/blog/page/3")).toBe("/posts/page/3");
        expect(getPrimaryCanonicalPath("/blog/my-post")).toBe("/posts/my-post");
    });

    it("keeps non-alias paths untouched", () => {
        expect(getPrimaryCanonicalPath("/blog/categories")).toBe("/blog/categories");
        expect(getPrimaryCanonicalPath("/posts/my-post")).toBe("/posts/my-post");
    });

    it("detects alias path correctly", () => {
        expect(isLegacyBlogAliasPath("/blog/my-post")).toBe(true);
        expect(isLegacyBlogAliasPath("/blog")).toBe(true);
        expect(isLegacyBlogAliasPath("/blog/categories")).toBe(false);
        expect(isLegacyBlogAliasPath("/posts/my-post")).toBe(false);
    });
});
