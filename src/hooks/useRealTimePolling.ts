/**
 * Real-time polling hooks using TanStack Query
 * Alternative to WebSocket - works perfectly with Next.js
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Real-time stats with smart polling
 */
export function useRealTimeStats() {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    // Polling every 30 seconds for stats
    refetchInterval: 30 * 1000,
    // Only poll when window is focused
    refetchIntervalInBackground: false,
    // Consider data stale after 25 seconds to ensure fresh data
    staleTime: 25 * 1000,
  });
}

/**
 * Real-time activities with smart polling
 * Compatible with WebSocket interface
 */
export function useRealTimeActivities() {
  const [activityCount, setActivityCount] = useState(0);
  const [latestActivity, setLatestActivity] = useState<any>(null);

  const query = useQuery({
    queryKey: queryKeys.activities({ page: 1, limit: 20 }),
    queryFn: async () => {
      const response = await fetch('/api/admin/activities?page=1&limit=20');
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      
      // Update latest activity if we have new data
      if (data.activities && data.activities.length > 0) {
        const newest = data.activities[0];
        if (newest.id !== latestActivity?.id) {
          setLatestActivity(newest);
          setActivityCount((prev: number) => prev + 1);
        }
      }
      
      return data;
    },
    // Poll every 15 seconds for activities (more frequent)
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
  });

  const resetActivityCount = () => {
    setActivityCount(0);
  };

  return {
    // Query data
    ...query,
    // WebSocket-compatible interface
    isConnected: !query.isError,
    connectionStatus: query.isError ? 'error' : query.isLoading ? 'connecting' : 'connected',
    latestActivity,
    activityCount,
    resetActivityCount,
  };
}

/**
 * Real-time file updates with smart polling
 */
export function useRealTimeFiles(userId?: string) {
  return useQuery({
    queryKey: queryKeys.files(userId),
    queryFn: async () => {
      const url = userId ? `/api/files?userId=${userId}` : '/api/files';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
    // Poll every 20 seconds for file changes
    refetchInterval: 20 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 15 * 1000,
    enabled: !!userId, // Only poll if userId is provided
  });
}

/**
 * Composite hook for all real-time data
 */
export function useRealTimeData(userId?: string) {
  const stats = useRealTimeStats();
  const activities = useRealTimeActivities();
  const files = useRealTimeFiles(userId);

  return {
    stats: stats.data,
    activities: activities.data,
    files: files.data,
    isLoading: stats.isLoading || activities.isLoading || files.isLoading,
    error: stats.error || activities.error || files.error,
    // Combined connection status
    isConnected: !stats.isError && !activities.isError && !files.isError,
  };
}
