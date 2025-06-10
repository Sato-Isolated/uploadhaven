"use client";

import { useCallback } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { useActivityManagement } from "@/hooks/useActivityManagement";
import { useActivitiesQuery } from "@/hooks";
import { ActivityHeader, ActivityContent } from "./components";
import ActivityLoader from "./recent/ActivityLoader";
import ActivityError from "./recent/ActivityError";

interface RecentActivityProps {
  enableInfiniteScroll?: boolean;
  maxItems?: number;
}

export default function RecentActivity({ 
  enableInfiniteScroll = false,
  maxItems 
}: RecentActivityProps = {}) {  const {
    // State
    typeFilter,
    severityFilter,
    currentPage,
    
    // Data
    activities,
    loading,
    error,
    hasMore,
    isFetchingNextPage,
    
    // Real-time
    realtimeConnected,
    activityCount,
    
    // Actions
    setTypeFilter,
    setSeverityFilter,
    setCurrentPage,
    loadMore,
    resetActivityCount,
  } = useActivityManagement({ enableInfiniteScroll, maxItems });

  // We need to get pagination data for non-infinite mode
  const { data: activityData } = useActivitiesQuery({
    page: currentPage,
    limit: maxItems || 10,
    type: typeFilter || undefined,
    severity: severityFilter || undefined,
  });

  const useInfinite = enableInfiniteScroll && !maxItems;

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
    loadMore();
    // Reset activity count when user interacts with the component
    if (activityCount > 0) {
      resetActivityCount();
    }
  }, [loadMore, activityCount, resetActivityCount]);

  if (loading && !activities.length) {
    return <ActivityLoader />;
  }
  
  if (error) {
    return <ActivityError error={error?.message || "An unexpected error occurred"} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <ActivityHeader
          realtimeConnected={realtimeConnected}
          activityCount={activityCount}
          typeFilter={typeFilter}
          severityFilter={severityFilter}
          onTypeFilterChange={handleTypeFilterChange}
          onSeverityFilterChange={handleSeverityFilterChange}
        />
          <CardContent>
          <ActivityContent
            activities={activities}
            loading={loading}
            useInfinite={useInfinite}
            hasMore={hasMore}
            isFetchingNextPage={isFetchingNextPage}
            pagination={activityData?.pagination}
            currentPage={currentPage}
            onLoadMore={handleLoadMore}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
