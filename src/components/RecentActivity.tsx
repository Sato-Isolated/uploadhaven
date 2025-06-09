"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, MoreHorizontal, Wifi, WifiOff } from "lucide-react";
import { useActivitiesQuery, useInfiniteActivitiesQuery } from "@/hooks";
import { useRealTimeActivities } from "@/hooks/useRealTimePolling";
import { ActivityEvent, ActivityResponse } from "@/components/types/common";
import ActivityLoader from "./RecentActivity/ActivityLoader";
import ActivityError from "./RecentActivity/ActivityError";
import ActivityFilters from "./RecentActivity/ActivityFilters";
import ActivityItem from "./RecentActivity/ActivityItem";
import ActivityPagination from "./RecentActivity/ActivityPagination";
import ActivityEmpty from "./RecentActivity/ActivityEmpty";

interface RecentActivityProps {
  enableInfiniteScroll?: boolean;
  maxItems?: number;
}

export default function RecentActivity({ 
  enableInfiniteScroll = false,
  maxItems 
}: RecentActivityProps = {}) {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Choose between infinite scroll or pagination
  const useInfinite = enableInfiniteScroll && !maxItems;
  // Enable real-time updates for activities using polling
  const { 
    isConnected: realtimeConnected, 
    latestActivity, 
    activityCount, 
    resetActivityCount 
  } = useRealTimeActivities();

  // Regular query for pagination mode
  const {
    data: activityData,
    isLoading: loading,
    error,
    refetch: fetchActivities,
  } = useActivitiesQuery({
    page: currentPage,
    limit: maxItems || 10,
    type: typeFilter || undefined,
    severity: severityFilter || undefined,
  });

  // Infinite query for infinite scroll mode
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: infiniteLoading,
    error: infiniteError,
  } = useInfiniteActivitiesQuery({
    limit: 20,
    type: typeFilter || undefined,
    severity: severityFilter || undefined,
  });

  // Flatten infinite query data
  const allActivities = useMemo(() => {
    if (!infiniteData) return [];
    return infiniteData.pages.flatMap(page => page.activities);
  }, [infiniteData]);
  // Use appropriate data source
  const isLoading = useInfinite ? infiniteLoading : loading;
  const errorMessage = useInfinite ? infiniteError : error;
  const activities = useInfinite ? allActivities : (activityData?.activities || []);
  const pagination = useInfinite ? null : activityData?.pagination;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleSeverityFilterChange = (value: string) => {
    setSeverityFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    // Reset activity count when user interacts with the component
    if (activityCount > 0) {
      resetActivityCount();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, activityCount, resetActivityCount]);

  if (isLoading && !activities.length) {
    return <ActivityLoader />;
  }
  
  if (errorMessage) {
    return <ActivityError error={errorMessage?.message || "An unexpected error occurred"} />;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Recent Activity
            </span>
            {/* Real-time connection indicator */}
            <div className="flex items-center gap-2 ml-auto">
              {activityCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                >
                  {activityCount} new
                </motion.div>
              )}
              <motion.div
                className="flex items-center gap-1 text-xs"
                animate={{ opacity: realtimeConnected ? 1 : 0.5 }}
              >
                {realtimeConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-500">Offline</span>
                  </>
                )}
              </motion.div>
            </div>
          </CardTitle>

          <ActivityFilters
            typeFilter={typeFilter}
            severityFilter={severityFilter}
            onTypeFilterChange={handleTypeFilterChange}
            onSeverityFilterChange={handleSeverityFilterChange}
          />
        </CardHeader><CardContent>
          {!activities.length ? (
            <ActivityEmpty />
          ) : (
            <>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <ActivityItem
                    key={activity._id}
                    activity={activity}
                    index={index}
                  />
                ))}
              </div>

              {useInfinite ? (
                // Infinite scroll mode - Load More button
                hasNextPage && (
                  <div className="text-center mt-6">
                    <Button
                      onClick={handleLoadMore}
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
              ) : (
                // Pagination mode
                pagination && (
                  <ActivityPagination
                    pagination={pagination}
                    currentPage={currentPage}
                    loading={isLoading}
                    onPageChange={handlePageChange}
                  />
                )
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
