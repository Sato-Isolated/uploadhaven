/**
 * Notification Stats Hook
 * Responsible ONLY for notification statistics - follows SRP
 * 
 * Single Responsibility: Fetch and manage notification statistics
 */

'use client';

import type { NotificationStatsResult } from './types';
import type { NotificationStats } from '@/lib/notifications/domain/types';

// Import the robust stats query function from the main query hook
import { useNotificationStatsQuery } from './useNotificationQuery';

// =============================================================================
// Notification Stats Hook
// =============================================================================

export interface UseNotificationStatsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export function useNotificationStats(
  options: UseNotificationStatsOptions = {}
): NotificationStatsResult {
  const {
    enabled = true,
    staleTime = 30 * 1000, // 30 seconds
  } = options;

  // Use the robust implementation from useNotificationQuery
  const queryResult = useNotificationStatsQuery({
    enabled,
    staleTime,
  });

  // Ensure we always return valid stats - never undefined
  const stats: NotificationStats = queryResult.data || {
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
  return {
    stats, // Always a valid NotificationStats object, never null
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: async () => {
      await queryResult.refetch();
    },
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get notification stats summary for display
 */
export function getStatsDisplay(stats: NotificationStats | null) {
  if (!stats) {
    return {
      total: 0,
      unread: 0,
      hasUrgent: false,
      hasHigh: false,
    };
  }

  return {
    total: stats.total,
    unread: stats.unread,
    hasUrgent: stats.byPriority.urgent > 0,
    hasHigh: stats.byPriority.high > 0,
  };
}

/**
 * Format notification count for display
 */
export function formatNotificationCount(count: number): string {
  if (count === 0) return '0';
  if (count < 100) return count.toString();
  return '99+';
}

/**
 * Get priority color class for notifications
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400';
    case 'high':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-950 dark:text-orange-400';
    case 'normal':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400';
    case 'low':
      return 'text-gray-600 bg-gray-100 dark:bg-gray-950 dark:text-gray-400';
    default:
      return 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400';
  }
}
