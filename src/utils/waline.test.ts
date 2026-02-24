import { describe, expect, it } from "vitest";

import { getWalinePathForPost, normalizeWalinePath } from "./waline";

describe("waline path utils", () => {
    it("normalizes path for waline", () => {
        expect(normalizeWalinePath("")).toBe("/");
        expect(normalizeWalinePath("posts/test")).toBe("/posts/test");
        expect(normalizeWalinePath("/posts/test/")).toBe("/posts/test");
    });

    it("builds post path for blog and zueg collections", () => {
        expect(getWalinePathForPost("hello-world", "blog")).toBe("/posts/hello-world");
        expect(getWalinePathForPost("thoughts", "zueg")).toBe("/posts/zueg/thoughts");
    });
});
