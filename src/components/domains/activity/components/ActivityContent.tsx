'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import type { ActivityEvent } from '@/types';
import ActivityItem from '../recent/ActivityItem';
import ActivityEmpty from '../recent/ActivityEmpty';
import ActivityPagination from '../recent/ActivityPagination';

interface ActivityContentProps {
  activities: ActivityEvent[];
  loading: boolean;
  useInfinite: boolean;
  hasMore: boolean;
  isFetchingNextPage?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  currentPage: number;
  onLoadMore: () => void;
  onPageChange: (page: number) => void;
}

export default function ActivityContent({
  activities,
  loading,
  useInfinite,
  hasMore,
  isFetchingNextPage,
  pagination,
  currentPage,
  onLoadMore,
  onPageChange,
}: ActivityContentProps) {
  const t = useTranslations('Activity');
  
  if (!activities.length) {
    return <ActivityEmpty />;
  }

  return (
    <>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <ActivityItem key={activity._id} activity={activity} index={index} />
        ))}
      </div>

      {useInfinite
        ? // Infinite scroll mode - Load More button
          hasMore && (
            <div className="mt-6 text-center">
              <Button
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                variant="outline"
                className="bg-white/80 backdrop-blur-sm dark:bg-gray-700/80"
              >
                {isFetchingNextPage ? (
                  <>
                    <MoreHorizontal className="mr-2 h-4 w-4 animate-pulse" />
                    {t('loadingMore')}
                  </>
                ) : (
                  <>
                    <MoreHorizontal className="mr-2 h-4 w-4" />
                    {t('loadMoreActivities')}
                  </>
                )}
              </Button>
            </div>
          )
        : // Pagination mode
          pagination && (
            <ActivityPagination
              pagination={pagination}
              currentPage={currentPage}
              loading={loading}
              onPageChange={onPageChange}
            />
          )}
    </>
  );
}
