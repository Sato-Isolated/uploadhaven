// TanStack Query hook for stats management
// Uses fetch API instead of ApiClient to avoid compilation issues
// filepath: c:\Users\ismys\Documents\GitHub\uploadhaven\src\hooks\useStatsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { UserStats } from '@/types/stats';

interface StatsResponse {
  success: boolean;
  stats: UserStats;
}

export function useStatsQuery() {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: async (): Promise<UserStats> => {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data: StatsResponse = await response.json();
      if (!data.success) {
        throw new Error('Failed to fetch stats');
      }
      return data.stats;
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
