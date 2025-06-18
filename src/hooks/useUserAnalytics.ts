import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/core/queryKeys';
import { DownloadAnalytics } from '@/components/domains/analytics/download/utils';
import { useSession } from '@/lib/auth/auth-client';

interface UserAnalyticsResponse {
  success: true;
  data: {
    analytics: DownloadAnalytics;
  };
  timestamp: string;
}

export function useUserAnalytics(timeRange: '7d' | '24h' | '30d' | '90d' = '7d') {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: session?.user?.id 
      ? queryKeys.analyticsUser(session.user.id, timeRange)
      : ['uploadhaven', 'analytics', 'user', 'anonymous', timeRange],
    queryFn: async (): Promise<DownloadAnalytics> => {
      const response = await ApiClient.get<UserAnalyticsResponse>(
        '/api/analytics/user'
      );
      return response.data.analytics;
    },
    enabled: !!session?.user?.id, // Only run query if user is authenticated
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),placeholderData: {
      totalDownloads: 0,
      last24hDownloads: 0,
      last7dDownloads: 0,
      avgDownloadsPerDay: 0,
      uniqueDownloaders: 0,
      totalFiles: 0,
      timeRange: '7d',
      topFiles: [],
      downloadTrends: [],
      fileTypeStats: [],
      recentDownloads: [],
    },
  });
}
