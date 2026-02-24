import { describe, expect, it } from "vitest";

import { getWalinePathForPost, normalizeWalinePath } from "./waline";

describe("waline path utils", () => {
    it("normalizes path for waline", () => {
        expect(normalizeWalinePath("")).toBe("/");
        expect(normalizeWalinePath("posts/test")).toBe("/posts/test");
        expect(normalizeWalinePath("/posts/test/")).toBe("/posts/test");
    });

    it("builds post path for blog posts", () => {
        expect(getWalinePathForPost("hello-world")).toBe("/posts/hello-world");
    });
});
