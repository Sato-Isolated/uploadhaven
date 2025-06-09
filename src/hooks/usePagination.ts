"use client";

import { useState, useCallback } from "react";
import type {
  PaginationState,
  UsePaginationOptions,
} from "@/components/types/common";

/**
 * Custom hook for pagination logic used across components like RecentActivity,
 * AdminFileManager, and file listings. Consolidates pagination state management.
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, initialLimit = 10 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const buildPaginationState = useCallback(
    (totalCount: number): PaginationState => {
      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = currentPage < totalPages;
      const hasPrev = currentPage > 1;

      return {
        page: currentPage,
        limit,
        totalCount,
        totalPages,
        hasNext,
        hasPrev,
      };
    },
    [currentPage, limit]
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  const getOffset = useCallback(() => {
    return (currentPage - 1) * limit;
  }, [currentPage, limit]);

  const getPageInfo = useCallback(
    (totalCount: number) => {
      const startItem = (currentPage - 1) * limit + 1;
      const endItem = Math.min(currentPage * limit, totalCount);

      return {
        startItem,
        endItem,
        totalCount,
        showing: `Showing ${startItem} to ${endItem} of ${totalCount}`,
      };
    },
    [currentPage, limit]
  );

  return {
    currentPage,
    limit,
    buildPaginationState,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changeLimit,
    reset,
    getOffset,
    getPageInfo,
  };
}
