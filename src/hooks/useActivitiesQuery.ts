// TanStack Query hook for activities management
// Uses fetch API instead of ApiClient to avoid compilation issues
// filepath: c:\Users\ismys\Documents\GitHub\uploadhaven\src\hooks\useActivitiesQuery.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { ActivityResponse } from '@/types';

interface ActivitiesFilters {
  page?: number;
  limit?: number;
  type?: string;
  severity?: string;
  userId?: string;
}

export function useActivitiesQuery(
  filters: ActivitiesFilters = {},
  options?: { enabled?: boolean }
) {
  const { page = 1, limit = 10, type, severity, userId } = filters;

  // Build query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (type) params.append('type', type);
  if (severity) params.append('severity', severity);
  if (userId) params.append('userId', userId);

  const url = `/api/admin/activities?${params}`;
  return useQuery({
    queryKey: queryKeys.activities(filters),
    queryFn: async (): Promise<ActivityResponse> => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: options?.enabled,
  });
}

/**
 * Infinite query hook for activities with pagination
 * Provides smooth infinite scrolling experience
 */
export function useInfiniteActivitiesQuery(
  filters: Omit<ActivitiesFilters, 'page'> = {},
  options?: { enabled?: boolean }
) {
  const { limit = 20, type, severity, userId } = filters;

  return useInfiniteQuery({
    queryKey: queryKeys.activitiesList(filters),
    queryFn: async ({ pageParam = 1 }): Promise<ActivityResponse> => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: limit.toString(),
      });

      if (type) params.append('type', type);
      if (severity) params.append('severity', severity);
      if (userId) params.append('userId', userId);
      const url = `/api/admin/activities?${params}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Return next page number if there are more pages
      if (lastPage.pagination?.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined; // No more pages
    },
    getPreviousPageParam: (firstPage) => {
      // Return previous page number if there are previous pages
      if (firstPage.pagination?.hasPrev) {
        return firstPage.pagination.page - 1;
      }
      return undefined; // No previous pages
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Enable real-time updates for recent activities
    refetchInterval: (query) => {
      // Only auto-refresh if we're on the first page and showing recent data
      const data = query.state.data;
      const isFirstPage = data?.pages?.[0]?.pagination?.page === 1;
      return isFirstPage ? 60 * 1000 : false; // Refresh every minute for first page
    },
    refetchIntervalInBackground: false, // Don't refresh when tab is not active
    enabled: options?.enabled,
  });
}
