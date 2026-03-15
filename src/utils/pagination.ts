// 分页工具函数
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  startIndex: number;
  endIndex: number;
}

export function paginate<T>(
  items: T[],
  currentPage: number = 1,
  itemsPerPage: number = 5,
): { items: T[]; pagination: PaginationInfo } {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // 确保当前页在有效范围内
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const paginatedItems = items.slice(startIndex, endIndex);

  const pagination: PaginationInfo = {
    currentPage: validCurrentPage,
    totalPages,
    hasNext: validCurrentPage < totalPages,
    hasPrev: validCurrentPage > 1,
    startIndex,
    endIndex,
  };

  return {
    items: paginatedItems,
    pagination,
  };
}

export function generatePaginationLinks(
  currentPage: number,
  totalPages: number,
  basePath: string,
): Array<{ page: number; url: string; isCurrent: boolean }> {
  const links = [];

  // 总是显示第一页
  if (totalPages > 0) {
    links.push({
      page: 1,
      url: currentPage === 1 ? basePath : `${basePath}/page/1`,
      isCurrent: currentPage === 1,
    });
  }

  // 如果总页数 <= 7，显示所有页面
  if (totalPages <= 7) {
    for (let i = 2; i <= totalPages; i++) {
      links.push({
        page: i,
        url: `${basePath}/page/${i}`,
        isCurrent: currentPage === i,
      });
    }
  } else {
    // 复杂的分页逻辑，显示省略号
    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    if (startPage > 2) {
      links.push({ page: -1, url: "", isCurrent: false }); // 省略号
    }

    for (let i = startPage; i <= endPage; i++) {
      links.push({
        page: i,
        url: `${basePath}/page/${i}`,
        isCurrent: currentPage === i,
      });
    }

    if (endPage < totalPages - 1) {
      links.push({ page: -1, url: "", isCurrent: false }); // 省略号
    }

    // 总是显示最后一页
    if (totalPages > 1) {
      links.push({
        page: totalPages,
        url: `${basePath}/page/${totalPages}`,
        isCurrent: currentPage === totalPages,
      });
    }
  }

  return links;
}
