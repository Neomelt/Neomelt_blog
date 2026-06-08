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
