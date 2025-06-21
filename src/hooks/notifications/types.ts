/**
 * Notification Hooks Types
 * Type definitions for SRP-based notification hooks
 */

import type { 
  NotificationEntity, 
  NotificationStats, 
  NotificationFilters,
  NotificationQueryOptions as DomainQueryOptions,
  NotificationPriority,
  NotificationType,
  SSEConnectionState,
} from '@/lib/notifications/domain/types';

// =============================================================================
// Query Hook Types
// =============================================================================

export interface NotificationQueryOptions extends DomainQueryOptions {
  readonly enabled?: boolean;
  readonly realtime?: boolean;
  readonly staleTime?: number;
  readonly refetchInterval?: number;
}

export interface NotificationQueryResult {
  readonly notifications: NotificationEntity[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<void>;
  readonly hasNextPage?: boolean;
  readonly fetchNextPage?: () => void;
  readonly isFetchingNextPage?: boolean;
}

// =============================================================================
// Mutation Hook Types
// =============================================================================

export interface NotificationMutationActions {
  readonly markAsRead: (id: string) => Promise<void>;
  readonly markAllAsRead: () => Promise<void>;
  readonly deleteNotification: (id: string) => Promise<void>;
  readonly bulkDelete: (ids: string[]) => Promise<void>;
  readonly updateNotification: (id: string, data: Partial<NotificationEntity>) => Promise<void>;
}

export interface NotificationMutationState {
  readonly isMarkingAsRead: boolean;
  readonly isMarkingAllAsRead: boolean;
  readonly isDeleting: boolean;
  readonly isBulkDeleting: boolean;
  readonly isUpdating: boolean;
}

// =============================================================================
// Real-time Hook Types
// =============================================================================

export interface NotificationRealtimeOptions {
  readonly enabled?: boolean;
  readonly reconnectAttempts?: number;
  readonly reconnectDelay?: number;
}

export interface NotificationRealtimeState extends SSEConnectionState {
  readonly connect: () => void;
  readonly disconnect: () => void;
  readonly subscribe: (callback: (notification: NotificationEntity) => void) => () => void;
}

// =============================================================================
// Stats Hook Types
// =============================================================================

export interface NotificationStatsResult {
  readonly stats: NotificationStats; // Never null - always returns valid stats
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<void>;
}

// =============================================================================
// Connection Hook Types
// =============================================================================

export interface NotificationConnectionState {
  readonly isOnline: boolean;
  readonly isConnected: boolean;
  readonly connectionQuality: 'good' | 'poor' | 'offline';
  readonly lastSync: Date | null;
  readonly retryConnection: () => void;
}

// =============================================================================
// UI State Hook Types
// =============================================================================

export interface NotificationUIState {
  readonly selectedIds: string[];
  readonly expandedIds: string[];
  readonly viewMode: 'list' | 'compact' | 'card';
  readonly showUnreadOnly: boolean;
  readonly groupByType: boolean;
}

export interface NotificationUIActions {
  readonly toggleSelection: (id: string) => void;
  readonly selectAll: (allIds: string[]) => void;
  readonly clearSelection: () => void;
  readonly toggleExpanded: (id: string) => void;
  readonly setViewMode: (mode: 'list' | 'compact' | 'card') => void;
  readonly toggleUnreadOnly: () => void;
  readonly toggleGroupByType: () => void;
}

// =============================================================================
// Filter Hook Types  
// =============================================================================

export interface NotificationFiltersState {
  readonly type?: NotificationType;
  readonly priority?: NotificationPriority;
  readonly dateRange?: {
    readonly from: Date;
    readonly to: Date;
  };
  readonly searchTerm?: string;
  readonly includeRead: boolean;
}

export interface NotificationFiltersActions {
  readonly setType: (type?: NotificationType) => void;
  readonly setPriority: (priority?: NotificationPriority) => void;
  readonly setDateRange: (range?: { from: Date; to: Date }) => void;
  readonly setSearchTerm: (term?: string) => void;
  readonly setIncludeRead: (include: boolean) => void;
  readonly clearFilters: () => void;
}

// =============================================================================
// Specialized Domain Hook Types
// =============================================================================

export interface SecurityNotificationOptions {
  readonly severityFilter?: 'low' | 'medium' | 'high' | 'critical';
  readonly autoMarkAsRead?: boolean;
  readonly alertOnCritical?: boolean;
}

export interface FileNotificationOptions {
  readonly fileId?: string;
  readonly includeExpiration?: boolean;
  readonly groupByFile?: boolean;
}

export interface SystemNotificationOptions {
  readonly adminOnly?: boolean;
  readonly includeMaintenanceAlerts?: boolean;
}

// =============================================================================
// Hook Options Aliases
// =============================================================================

export type UseNotificationStatsOptions = {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
};

export type UseNotificationConnectionOptions = {
  enabled?: boolean;
  testInterval?: number;
  poorConnectionThreshold?: number;
};
