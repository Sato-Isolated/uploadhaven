"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationData } from "@/types";

interface ActivityPaginationProps {
  pagination: PaginationData;
  currentPage: number;
  loading: boolean;
  onPageChange: (newPage: number) => void;
}

export default function ActivityPagination({
  pagination,
  currentPage,
  loading,
  onPageChange,
}: ActivityPaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <motion.div
      className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {(pagination.page - 1) * pagination.limit + 1} to
        {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of
        {pagination.totalCount} activities
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination.hasPrev || loading}
          className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <span className="text-sm font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md">
          Page {pagination.page} of {pagination.totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination.hasNext || loading}
          className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
