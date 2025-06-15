/**
 * Real-time polling hooks using TanStack Query
 * Alternative to WebSocket - works perfectly with Next.js
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { ActivityEvent } from '@/types';

/**
 * Real-time activities with smart polling
 * Compatible with WebSocket interface
 */
export function useRealTimeActivities() {
  const [activityCount, setActivityCount] = useState(0);
  const [latestActivity, setLatestActivity] = useState<ActivityEvent | null>(
    null
  );

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
    connectionStatus: query.isError
      ? 'error'
      : query.isLoading
        ? 'connecting'
        : 'connected',
    latestActivity,
    activityCount,
    resetActivityCount,
  };
}


