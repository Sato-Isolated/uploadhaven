import { QueryClient } from '@tanstack/react-query';
import { queryKeys, TimeRange } from '@/lib/core/queryKeys';
import { ApiClient } from '@/lib/api/client';

/**
 * Prefetching strategies for better user experience
 * These functions pre-load data that users are likely to need
 */
export class PrefetchManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Prefetch user stats when they visit the dashboard
   */
  async prefetchUserStats(userId: string) {
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.userStats(userId),
      queryFn: () => ApiClient.get(`/api/user/stats`),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }

  /**
   * Prefetch user analytics when they view stats
   */
  async prefetchUserAnalytics(userId: string, timeRange: TimeRange = '7d') {
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.analyticsUser(userId, timeRange),
      queryFn: () =>
        ApiClient.get(`/api/analytics/user?timeRange=${timeRange}`),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }

  /**
   * Prefetch admin data when admin visits dashboard
   */
  async prefetchAdminDashboard() {
    const promises = [
      // Prefetch recent activities
      this.queryClient.prefetchQuery({
        queryKey: queryKeys.activities({ limit: 3 }),
        queryFn: () => ApiClient.get('/api/admin/activities?limit=3'),
        staleTime: 30 * 1000, // 30 seconds
      }),

      // Prefetch security data
      this.queryClient.prefetchQuery({
        queryKey: queryKeys.security(),
        queryFn: () => ApiClient.get('/api/security'),
        staleTime: 60 * 1000, // 1 minute
      }),

      // Prefetch admin stats
      this.queryClient.prefetchQuery({
        queryKey: queryKeys.adminStats(),
        queryFn: () => ApiClient.get('/api/stats'),
        staleTime: 2 * 60 * 1000, // 2 minutes
      }),
    ];

    await Promise.allSettled(promises);
  }

  /**
   * Prefetch files list when user visits file manager
   */
  async prefetchFilesList(userId?: string) {
    const endpoint = userId ? `/api/user/files` : '/api/files';

    await this.queryClient.prefetchQuery({
      queryKey: userId ? queryKeys.userFiles(userId) : queryKeys.files(),
      queryFn: () => ApiClient.get(endpoint),
      staleTime: 60 * 1000, // 1 minute
    });
  }

  /**
   * Prefetch next page of activities for infinite scroll
   */
  async prefetchNextActivitiesPage(
    currentPage: number,
    filters?: Record<string, unknown>
  ) {
    const nextPage = currentPage + 1;
    const params = new URLSearchParams({
      page: nextPage.toString(),
      limit: '20',
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.activities({ ...filters, page: nextPage }),
      queryFn: () => ApiClient.get(`/api/admin/activities?${params}`),
      staleTime: 30 * 1000, // 30 seconds
    });
  }
  /**
   * Warm up cache with essential data on app initialization
   */
  async warmUpCache(userId?: string, isAdmin?: boolean) {
    const promises: Promise<unknown>[] = [];

    if (userId) {
      // Always prefetch user stats
      promises.push(this.prefetchUserStats(userId));
    }

    if (isAdmin) {
      // Prefetch admin dashboard data
      promises.push(this.prefetchAdminDashboard());
    }

    // Execute all prefetches in parallel, but don't wait for completion
    // This allows the app to start while cache warms up in background
    Promise.allSettled(promises).catch((error) => {
      console.warn('Some prefetches failed during cache warm-up:', error);
    });
  }

  /**
   * Prefetch related analytics when viewing one timerange
   */
  async prefetchRelatedAnalytics(currentTimeRange: TimeRange, userId?: string) {
    const otherTimeRanges: TimeRange[] = ['24h', '7d', '30d', '90d'].filter(
      (range) => range !== currentTimeRange
    ) as TimeRange[];

    const promises = otherTimeRanges.slice(0, 2).map((timeRange) => {
      if (userId) {
        return this.queryClient.prefetchQuery({
          queryKey: queryKeys.analyticsUser(userId, timeRange),
          queryFn: () =>
            ApiClient.get(`/api/analytics/user?timeRange=${timeRange}`),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      } else {
        return this.queryClient.prefetchQuery({
          queryKey: queryKeys.analyticsAdmin(timeRange),
          queryFn: () =>
            ApiClient.get(`/api/analytics/admin?timeRange=${timeRange}`),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Smart prefetching based on user behavior patterns
   */
  async smartPrefetch(context: {
    currentPage?: string;
    userId?: string;
    isAdmin?: boolean;
    userBehavior?: {
      frequentlyViewsAnalytics?: boolean;
      frequentlyManagesFiles?: boolean;
      frequentlyViewsActivity?: boolean;
    };
  }) {
    const { currentPage, userId, isAdmin, userBehavior } = context;

    // Based on current page, predict what user might visit next
    switch (currentPage) {
      case '/dashboard':
        if (userBehavior?.frequentlyViewsAnalytics && userId) {
          this.prefetchUserAnalytics(userId);
        }
        if (userBehavior?.frequentlyManagesFiles && userId) {
          this.prefetchFilesList(userId);
        }
        break;

      case '/dashboard/analytics':
        // User is viewing analytics, they might switch time ranges
        if (userId) {
          this.prefetchRelatedAnalytics('7d', userId);
        }
        break;

      case '/admin':
        if (isAdmin && userBehavior?.frequentlyViewsActivity) {
          // Prefetch more activities if admin frequently checks activity
          this.prefetchNextActivitiesPage(1);
        }
        break;

      default:
        // General prefetching for unknown pages
        if (userId) {
          this.prefetchUserStats(userId);
        }
        break;
    }
  }
}

// Create a singleton instance
let prefetchManager: PrefetchManager | null = null;


