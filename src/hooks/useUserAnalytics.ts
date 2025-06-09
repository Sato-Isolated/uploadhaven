// filepath: c:\Users\ismys\Documents\GitHub\uploadhaven\src\hooks\useUserAnalytics.ts
import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/lib/query/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { DownloadAnalytics } from "@/components/DownloadAnalytics/utils";

interface UserAnalyticsResponse {
  analytics: DownloadAnalytics;
}

export function useUserAnalytics() {
  return useQuery({
    queryKey: queryKeys.analyticsUsers("all"), // Using "all" as default timeRange
    queryFn: async (): Promise<DownloadAnalytics> => {
      const response = await ApiClient.get<UserAnalyticsResponse>("/api/analytics/user");
      return response.analytics;
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
