"use client";

import { useState, useMemo } from "react";
import { useActivitiesQuery, useInfiniteActivitiesQuery } from "@/hooks";
import { useRealTimeActivities } from "@/hooks/useRealTimePolling";
import type { ActivityEvent } from "@/types";

interface UseActivityManagementProps {
  enableInfiniteScroll?: boolean;
  maxItems?: number;
}

interface UseActivityManagementReturn {
  // State
  typeFilter: string;
  severityFilter: string;
  currentPage: number;
  
  // Data
  activities: ActivityEvent[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  isFetchingNextPage: boolean;
  
  // Real-time
  realtimeConnected: boolean;
  activityCount: number;
  
  // Actions
  setTypeFilter: (filter: string) => void;
  setSeverityFilter: (filter: string) => void;
  setCurrentPage: (page: number) => void;
  fetchActivities: () => void;
  loadMore: () => void;
  resetActivityCount: () => void;
}

export function useActivityManagement({
  enableInfiniteScroll = false,
  maxItems
}: UseActivityManagementProps = {}): UseActivityManagementReturn {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Choose between infinite scroll or pagination
  const useInfinite = enableInfiniteScroll && !maxItems;
  
  // Real-time updates for activities using polling
  const { 
    isConnected: realtimeConnected, 
    activityCount, 
    resetActivityCount 
  } = useRealTimeActivities();

  // Regular query for pagination mode
  const {
    data: activityData,
    isLoading: paginationLoading,
    error: paginationError,
    refetch: fetchActivities,
  } = useActivitiesQuery({
    page: currentPage,
    limit: maxItems || 10,
    type: typeFilter || undefined,
    severity: severityFilter || undefined,
  }, { enabled: !useInfinite });
  // Infinite query for infinite scroll mode
  const {
    data: infiniteData,
    isLoading: infiniteLoading,
    error: infiniteError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchInfinite,
  } = useInfiniteActivitiesQuery({
    limit: 10,
    type: typeFilter || undefined,
    severity: severityFilter || undefined,
  }, { enabled: useInfinite });

  // Memoized activities data
  const activities = useMemo(() => {
    if (useInfinite && infiniteData) {
      return infiniteData.pages.flatMap(page => page.activities || []);
    }
    return activityData?.activities || [];
  }, [useInfinite, infiniteData, activityData]);
  // Unified state
  const loading = useInfinite ? infiniteLoading : paginationLoading;
  const error = useInfinite ? infiniteError : paginationError;
  const hasMore = useInfinite ? hasNextPage : false;
  const isFetching = useInfinite ? (isFetchingNextPage || false) : false;

  const loadMore = () => {
    if (useInfinite && hasNextPage) {
      fetchNextPage();
    }
  };

  const refetchAll = () => {
    if (useInfinite) {
      refetchInfinite();
    } else {
      fetchActivities();
    }
  };
  return {
    // State
    typeFilter,
    severityFilter,
    currentPage,
    
    // Data
    activities,
    loading,
    error,
    hasMore,
    isFetchingNextPage: isFetching,
    
    // Real-time
    realtimeConnected,
    activityCount,
    
    // Actions
    setTypeFilter,
    setSeverityFilter,
    setCurrentPage,
    fetchActivities: refetchAll,
    loadMore,
    resetActivityCount,
  };
}
