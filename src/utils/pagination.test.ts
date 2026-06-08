import { describe, expect, it } from "vitest";

import { paginate } from "./pagination";

describe("pagination utils", () => {
  it("paginates and clamps current page", () => {
    const items = Array.from({ length: 12 }, (_, index) => index + 1);

    const page1 = paginate(items, 1, 5);
    expect(page1.items).toEqual([1, 2, 3, 4, 5]);
    expect(page1.pagination.totalPages).toBe(3);
    expect(page1.pagination.hasPrev).toBe(false);
    expect(page1.pagination.hasNext).toBe(true);

    const overflowPage = paginate(items, 99, 5);
    expect(overflowPage.pagination.currentPage).toBe(3);
    expect(overflowPage.items).toEqual([11, 12]);
  });
});
