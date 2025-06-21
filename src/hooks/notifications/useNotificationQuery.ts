/**
 * Notification Query Hook
 * Handles data fetching for notifications with React Query
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { NotificationEntity, NotificationStats } from '@/lib/notifications/domain/types';

// =============================================================================
// API Client Functions
// =============================================================================

interface NotificationQueryParams {
  limit?: number;
  includeRead?: boolean;
  type?: string;
  offset?: number;
}

interface NotificationResponse {
  notifications: NotificationEntity[];
  stats: NotificationStats;
  total: number;
}

/**
 * Fetch notifications from API
 */
async function fetchNotifications(params: NotificationQueryParams = {}): Promise<NotificationResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.includeRead !== undefined) searchParams.set('includeRead', params.includeRead.toString());
  if (params.type) searchParams.set('type', params.type);
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const response = await fetch(`/api/notifications?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
  }
  
  const apiResponse = await response.json();
  
  // Handle the API response structure
  if (apiResponse.success && apiResponse.data) {
    return {
      notifications: apiResponse.data.notifications || [],
      stats: apiResponse.data.stats || {},
      total: apiResponse.data.pagination?.total || apiResponse.data.notifications?.length || 0,
    };
  }
  
  throw new Error('Invalid API response format');
}

/**
 * Fetch notification statistics from API
 */
async function fetchNotificationStats(): Promise<NotificationStats> {
  try {
    const response = await fetch('/api/notifications/stats');
    
    if (!response.ok) {
      console.warn(`Failed to fetch notification stats: ${response.status} ${response.statusText}`);
      // Return default stats instead of throwing
      return {
        total: 0,
        unread: 0,
        byType: {
          file_downloaded: 0,
          file_expired_soon: 0,
          file_shared: 0,
          security_alert: 0,
          malware_detected: 0,
          system_announcement: 0,
          file_upload_complete: 0,
          bulk_action_complete: 0,
          account_security: 0,
          admin_alert: 0,
        },
        byPriority: {
          low: 0,
          normal: 0,
          high: 0,
          urgent: 0,
        },
        byStatus: {
          unread: 0,
          read: 0,
          archived: 0,
        },
      };
    }
    
    const apiResponse = await response.json();
    
    // Handle the API response structure
    if (apiResponse.success && apiResponse.data) {
      return {
        total: apiResponse.data.total || 0,
        unread: apiResponse.data.unread || 0,
        byType: {
          file_downloaded: apiResponse.data.byType?.file_downloaded || 0,
          file_expired_soon: apiResponse.data.byType?.file_expired_soon || 0,
          file_shared: apiResponse.data.byType?.file_shared || 0,
          security_alert: apiResponse.data.byType?.security_alert || 0,
          malware_detected: apiResponse.data.byType?.malware_detected || 0,
          system_announcement: apiResponse.data.byType?.system_announcement || 0,
          file_upload_complete: apiResponse.data.byType?.file_upload_complete || 0,
          bulk_action_complete: apiResponse.data.byType?.bulk_action_complete || 0,
          account_security: apiResponse.data.byType?.account_security || 0,
          admin_alert: apiResponse.data.byType?.admin_alert || 0,
        },
        byPriority: {
          low: apiResponse.data.byPriority?.low || 0,
          normal: apiResponse.data.byPriority?.normal || 0,
          high: apiResponse.data.byPriority?.high || 0,
          urgent: apiResponse.data.byPriority?.urgent || 0,
        },
        byStatus: {
          unread: apiResponse.data.byStatus?.unread || apiResponse.data.unread || 0,
          read: apiResponse.data.byStatus?.read || (apiResponse.data.total - apiResponse.data.unread) || 0,
          archived: apiResponse.data.byStatus?.archived || 0,
        },
      };
    }
    
    console.warn('Invalid stats API response format:', apiResponse);
    // Return default stats instead of throwing
    return {
      total: 0,
      unread: 0,
      byType: {
        file_downloaded: 0,
        file_expired_soon: 0,
        file_shared: 0,
        security_alert: 0,
        malware_detected: 0,
        system_announcement: 0,
        file_upload_complete: 0,
        bulk_action_complete: 0,
        account_security: 0,
        admin_alert: 0,
      },
      byPriority: {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0,
      },
      byStatus: {
        unread: 0,
        read: 0,
        archived: 0,
      },
    };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    // Return default stats instead of throwing
    return {
      total: 0,
      unread: 0,
      byType: {
        file_downloaded: 0,
        file_expired_soon: 0,
        file_shared: 0,
        security_alert: 0,
        malware_detected: 0,
        system_announcement: 0,
        file_upload_complete: 0,
        bulk_action_complete: 0,
        account_security: 0,
        admin_alert: 0,
      },
      byPriority: {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0,
      },
      byStatus: {
        unread: 0,
        read: 0,
        archived: 0,
      },
    };
  }
}

// =============================================================================
// Query Hooks
// =============================================================================

export interface UseNotificationQueryOptions {
  enabled?: boolean;
  limit?: number;
  includeRead?: boolean;
  type?: string;
  offset?: number;
  staleTime?: number;
  refetchInterval?: number;
}

/**
 * Hook for fetching notifications
 */
export function useNotificationQuery(options: UseNotificationQueryOptions = {}) {
  const {
    enabled = true,
    limit = 50,
    includeRead = true,
    type,
    offset = 0,
    staleTime = 30 * 1000, // 30 seconds
    refetchInterval,
  } = options;

  const queryKey = ['notifications', { limit, includeRead, type, offset }];

  return useQuery({
    queryKey,
    queryFn: () => fetchNotifications({ limit, includeRead, type, offset }),
    enabled,
    staleTime,
    refetchInterval,
    select: (data) => ({
      notifications: data.notifications || [],
      stats: data.stats,
      total: data.total || 0,
    }),
  });
}

/**
 * Hook for fetching notification statistics
 */
export function useNotificationStatsQuery(options: { enabled?: boolean; staleTime?: number } = {}) {
  const {
    enabled = true,
    staleTime = 30 * 1000, // 30 seconds
  } = options;

  return useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: fetchNotificationStats,
    enabled,
    staleTime,
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

/**
 * Hook for fetching unread notifications count
 */
export function useUnreadNotificationsCount(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  
  const { data: stats } = useNotificationStatsQuery({ enabled });
  
  return {
    unreadCount: stats?.unread || 0,
    isLoading: !stats,
  };
}

/**
 * Hook for fetching notifications by type
 */
export function useNotificationsByType(
  type: string,
  options: Omit<UseNotificationQueryOptions, 'type'> = {}
) {
  return useNotificationQuery({
    ...options,
    type,
  });
}

/**
 * Hook for fetching unread notifications only
 */
export function useUnreadNotifications(options: Omit<UseNotificationQueryOptions, 'includeRead'> = {}) {
  return useNotificationQuery({
    ...options,
    includeRead: false,
  });
}

/**
 * Hook for paginated notifications
 */
export function usePaginatedNotifications(
  page: number = 0,
  pageSize: number = 20,
  options: Omit<UseNotificationQueryOptions, 'limit' | 'offset'> = {}
) {
  const offset = page * pageSize;
  
  return useNotificationQuery({
    ...options,
    limit: pageSize,
    offset,
  });
}

/**
 * Hook for notifications with real-time updates disabled
 * Useful for admin panels or reports where real-time updates aren't needed
 */
export function useStaticNotifications(options: UseNotificationQueryOptions = {}) {
  return useNotificationQuery({
    ...options,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

// =============================================================================
// Query Key Utilities
// =============================================================================

/**
 * Generate query key for notifications
 */
export function getNotificationQueryKey(params: NotificationQueryParams = {}) {
  return ['notifications', params];
}

/**
 * Generate query key for notification stats
 */
export function getNotificationStatsQueryKey() {
  return ['notifications', 'stats'];
}

// =============================================================================
// Prefetch Utilities
// =============================================================================

/**
 * Prefetch notifications for better UX
 */
export function prefetchNotifications(
  queryClient: any,
  params: NotificationQueryParams = {}
) {
  return queryClient.prefetchQuery({
    queryKey: getNotificationQueryKey(params),
    queryFn: () => fetchNotifications(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Prefetch notification stats
 */
export function prefetchNotificationStats(queryClient: any) {
  return queryClient.prefetchQuery({
    queryKey: getNotificationStatsQueryKey(),
    queryFn: fetchNotificationStats,
    staleTime: 30 * 1000,
  });
}
