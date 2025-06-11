"use client";

import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import type { ActivityEvent } from "@/types";
import ActivityItem from "../recent/ActivityItem";
import ActivityEmpty from "../recent/ActivityEmpty";
import ActivityPagination from "../recent/ActivityPagination";

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
            <div className="text-center mt-6">
              <Button
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                variant="outline"
                className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm"
              >
                {isFetchingNextPage ? (
                  <>
                    <MoreHorizontal className="h-4 w-4 mr-2 animate-pulse" />
                    Loading more...
                  </>
                ) : (
                  <>
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Load More Activities
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
