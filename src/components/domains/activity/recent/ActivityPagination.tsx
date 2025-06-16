'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationData } from '@/types';

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
  const t = useTranslations('Activity');

  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <motion.div
      className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {t('showingActivities', {
          start: (pagination.page - 1) * pagination.limit + 1,
          end: Math.min(
            pagination.page * pagination.limit,
            pagination.totalCount
          ),
          total: pagination.totalCount,
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination.hasPrev || loading}
          className="bg-white/80 backdrop-blur-sm dark:bg-gray-700/80"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('previous')}
        </Button>

        <span className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {t('pageOfTotal', {
            current: pagination.page,
            total: pagination.totalPages,
          })}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination.hasNext || loading}
          className="bg-white/80 backdrop-blur-sm dark:bg-gray-700/80"
        >
          {t('next')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
