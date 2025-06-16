import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/core/queryKeys';
import { DownloadAnalytics } from '@/components/domains/analytics/download/utils';

interface UserAnalyticsResponse {
  analytics: DownloadAnalytics;
}

export function useUserAnalytics() {
  return useQuery({
    queryKey: queryKeys.analyticsUsers('7d'), // Using "7d" as default timeRange
    queryFn: async (): Promise<DownloadAnalytics> => {
      const response = await ApiClient.get<UserAnalyticsResponse>(
        '/api/analytics/user'
      );
      return response.analytics;
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
