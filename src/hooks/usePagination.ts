import { useState, useMemo } from "react";

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
}

export const usePagination = ({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1,
}: UsePaginationProps) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // 페이지네이션 계산
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      itemsPerPage,
      totalItems,
    };
  }, [currentPage, totalItems, itemsPerPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 현재 페이지에 표시할 데이터를 가져오는 함수
  const getCurrentPageData = <T>(data: T[]): T[] => {
    return data.slice(paginationData.startIndex, paginationData.endIndex);
  };

  // 페이지 리셋
  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    ...paginationData,
    handlePageChange,
    getCurrentPageData,
    resetPage,
  };
}; 