/**
 * Main Notifications Hook - Composition Pattern
 * Orchestrates all focused notification hooks - follows SRP
 * 
 * Single Responsibility: Compose and coordinate focused notification hooks
 * This is a thin orchestration layer that combines the specialized hooks
 */

'use client';

import { useNotificationQuery } from './useNotificationQuery';
import { useNotificationMutations } from './useNotificationMutations';
import { useNotificationRealtime } from './useNotificationRealtime';
import { useNotificationStats } from './useNotificationStats';
import { useNotificationConnection } from './useNotificationConnection';
import type { 
  NotificationQueryOptions,
  NotificationRealtimeOptions,
  UseNotificationStatsOptions,
  UseNotificationConnectionOptions,
} from './types';

// =============================================================================
// Composition Hook Options
// =============================================================================

export interface UseNotificationsOptions {
  // Query options
  query?: NotificationQueryOptions;
  
  // Real-time options
  realtime?: NotificationRealtimeOptions;
  
  // Stats options
  stats?: UseNotificationStatsOptions;
  
  // Connection options
  connection?: UseNotificationConnectionOptions;
  
  // Feature toggles
  enableRealtime?: boolean;
  enableStats?: boolean;
  enableConnectionMonitoring?: boolean;
}

// =============================================================================
// Main Notifications Hook
// =============================================================================

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    query: queryOptions = {},
    realtime: realtimeOptions = {},
    stats: statsOptions = {},
    connection: connectionOptions = {},
    enableRealtime = true,
    enableStats = true,
    enableConnectionMonitoring = true,
  } = options;

  // Core data fetching
  const notificationQuery = useNotificationQuery(queryOptions);
  
  // Mutation operations
  const notificationMutations = useNotificationMutations();
  
  // Real-time connection (conditional)
  const realtimeState = useNotificationRealtime({
    ...realtimeOptions,
    enabled: enableRealtime && (realtimeOptions.enabled ?? true),
  });
  
  // Statistics (conditional)
  const statsResult = useNotificationStats({
    ...statsOptions,
    enabled: enableStats && (statsOptions.enabled ?? true),
  });
  
  // Connection monitoring (conditional)
  const connectionState = useNotificationConnection({
    ...connectionOptions,
    enabled: enableConnectionMonitoring && (connectionOptions.enabled ?? true),
  });

  // =============================================================================
  // Computed Values
  // =============================================================================

  const unreadCount = statsResult.stats?.unread || 0;
  const totalCount = statsResult.stats?.total || 0;
  const hasUrgent = Boolean(statsResult.stats?.byPriority.urgent);
  const hasHigh = Boolean(statsResult.stats?.byPriority.high);

  // Overall loading state
  const isLoading = notificationQuery.isLoading || statsResult.isLoading;
  
  // Overall error state
  const error = notificationQuery.error || statsResult.error;
  const hasError = notificationQuery.isError || statsResult.isError;

  // Connection status
  const isRealTimeConnected = enableRealtime ? realtimeState.isConnected : false;
  const connectionError = enableRealtime ? realtimeState.connectionError : null;

  // =============================================================================
  // Unified Actions
  // =============================================================================

  const refetch = async () => {
    await Promise.all([
      notificationQuery.refetch(),
      enableStats ? statsResult.refetch() : Promise.resolve(),
    ]);
  };

  const reconnectRealtime = () => {
    if (enableRealtime) {
      realtimeState.connect();
    }
  };

  // =============================================================================
  // Return Interface
  // =============================================================================
  return {
    // Data
    notifications: notificationQuery.data?.notifications || [],
    stats: statsResult.stats,
    
    // Computed values
    unreadCount,
    totalCount,
    hasUrgent,
    hasHigh,
    
    // Loading states
    isLoading,
    isError: hasError,
    error,
    
    // Connection states
    isConnected: connectionState.isConnected,
    isRealTimeConnected,
    connectionError,
    connectionQuality: connectionState.connectionQuality,
    
    // Query actions
    refetch,
    
    // Mutation actions
    markAsRead: notificationMutations.markAsRead,
    markAllAsRead: notificationMutations.markAllAsRead,
    deleteNotification: notificationMutations.deleteNotification,
    bulkDelete: notificationMutations.bulkDelete,
    updateNotification: notificationMutations.updateNotification,
    
    // Mutation states
    isMarkingAsRead: notificationMutations.isMarkingAsRead,
    isMarkingAllAsRead: notificationMutations.isMarkingAllAsRead,
    isDeleting: notificationMutations.isDeleting,
    isBulkDeleting: notificationMutations.isBulkDeleting,
    isUpdating: notificationMutations.isUpdating,
    
    // Real-time actions
    connectRealtime: realtimeState.connect,
    disconnectRealtime: realtimeState.disconnect,
    subscribeToNotifications: realtimeState.subscribe,
    reconnectRealtime,
    
    // Connection actions
    retryConnection: connectionState.retryConnection,
    
    // Individual hook access (for advanced usage)
    hooks: {
      query: notificationQuery,
      mutations: notificationMutations,
      realtime: realtimeState,
      stats: statsResult,
      connection: connectionState,
    },
  };
}
