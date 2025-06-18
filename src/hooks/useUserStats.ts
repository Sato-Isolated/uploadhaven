import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/core/queryKeys';
import type { UserStats } from '@/types';

/**
 * Hook to retrieve user statistics with auto-refresh
 * Compatible avec l'API /api/user/stats qui retourne { success: boolean, data: UserStats }
 */
export function useUserStats(userId?: string) {
  return useQuery({
    queryKey: queryKeys.userStats(userId),    queryFn: async () => {
      const response = await ApiClient.get<{
        success: boolean;
        data: { stats: UserStats };
      }>('/api/user/stats');
      
      // Ensure we return a valid object even if the API response is unexpected
      if (!response.success || !response.data || !response.data.stats) {
        throw new Error('Failed to fetch user stats');
      }
      
      return response.data.stats; // Return the nested stats object
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh toutes les 5 minutes
    refetchOnWindowFocus: true, // Refresh when returning to the tab
    // Only enable the query if we have a userId (for authenticated users)
    enabled: !!userId,    // Return empty stats object as fallback to prevent undefined
    placeholderData: {
      totalFiles: 0,
      totalSize: 0,
      recentUploads: 0,
      expiringSoon: 0,
      last7dUploads: 0,
      last24hUploads: 0,
      totalDownloads: 0,
    } as UserStats,
  });
}
