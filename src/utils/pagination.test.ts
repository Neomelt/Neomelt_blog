import { describe, expect, it } from "vitest";

import { generatePaginationLinks, paginate } from "./pagination";

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

    it("generates compact links with ellipsis markers", () => {
        const links = generatePaginationLinks(6, 12, "/posts");

        expect(links[0]).toMatchObject({ page: 1, isCurrent: false });
        expect(links.some((item) => item.page === -1)).toBe(true);
        expect(links.some((item) => item.page === 6 && item.isCurrent)).toBe(true);
        expect(links[links.length - 1]).toMatchObject({ page: 12, isCurrent: false });
    });
});
