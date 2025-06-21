/**
 * Notification Filters Hook
 * Responsible ONLY for filter state management - follows SRP
 * 
 * Single Responsibility: Manage notification filtering and search state
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { 
  NotificationFiltersState, 
  NotificationFiltersActions 
} from './types';
import type { 
  NotificationEntity, 
  NotificationPriority, 
  NotificationType 
} from '@/lib/notifications/domain/types';

// =============================================================================
// Notification Filters Hook
// =============================================================================

export function useNotificationFilters(initialState: Partial<NotificationFiltersState> = {}) {
  const [filtersState, setFiltersState] = useState<NotificationFiltersState>({
    type: undefined,
    priority: undefined,
    dateRange: undefined,
    searchTerm: undefined,
    includeRead: true,
    ...initialState,
  });

  // =============================================================================
  // Filter Actions
  // =============================================================================

  const setType = useCallback((type?: NotificationType) => {
    setFiltersState(prev => ({ ...prev, type }));
  }, []);

  const setPriority = useCallback((priority?: NotificationPriority) => {
    setFiltersState(prev => ({ ...prev, priority }));
  }, []);

  const setDateRange = useCallback((range?: { from: Date; to: Date }) => {
    setFiltersState(prev => ({ ...prev, dateRange: range }));
  }, []);

  const setSearchTerm = useCallback((term?: string) => {
    setFiltersState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setIncludeRead = useCallback((include: boolean) => {
    setFiltersState(prev => ({ ...prev, includeRead: include }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({
      type: undefined,
      priority: undefined,
      dateRange: undefined,
      searchTerm: undefined,
      includeRead: true,
    });
  }, []);

  // =============================================================================
  // Quick Filter Actions
  // =============================================================================

  const showOnlyUnread = useCallback(() => {
    setIncludeRead(false);
  }, [setIncludeRead]);

  const showAll = useCallback(() => {
    setIncludeRead(true);
  }, [setIncludeRead]);

  const filterByToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setDateRange({ from: today, to: tomorrow });
  }, [setDateRange]);

  const filterByLastWeek = useCallback(() => {
    const now = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);
    
    setDateRange({ from: lastWeek, to: now });
  }, [setDateRange]);

  const filterByUrgent = useCallback(() => {
    setPriority('urgent');
  }, [setPriority]);

  const filterByHigh = useCallback(() => {
    setPriority('high');
  }, [setPriority]);

  // =============================================================================
  // Filter Application
  // =============================================================================

  const applyFilters = useCallback((notifications: NotificationEntity[]): NotificationEntity[] => {
    return notifications.filter(notification => {
      // Type filter
      if (filtersState.type && notification.type !== filtersState.type) {
        return false;
      }

      // Priority filter
      if (filtersState.priority && notification.priority !== filtersState.priority) {
        return false;
      }

      // Read status filter
      if (!filtersState.includeRead && notification.status === 'read') {
        return false;
      }

      // Date range filter
      if (filtersState.dateRange) {
        const notificationDate = new Date(notification.createdAt);
        if (notificationDate < filtersState.dateRange.from || notificationDate > filtersState.dateRange.to) {
          return false;
        }
      }

      // Search term filter
      if (filtersState.searchTerm) {
        const searchLower = filtersState.searchTerm.toLowerCase();
        const titleMatch = notification.title.toLowerCase().includes(searchLower);
        const messageMatch = notification.message.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !messageMatch) {
          return false;
        }
      }

      return true;
    });
  }, [filtersState]);

  // =============================================================================
  // Filter Stats
  // =============================================================================

  const filterStats = useMemo(() => {
    const hasActiveFilters = !!(
      filtersState.type ||
      filtersState.priority ||
      filtersState.dateRange ||
      filtersState.searchTerm ||
      !filtersState.includeRead
    );

    const activeFilterCount = [
      filtersState.type,
      filtersState.priority,
      filtersState.dateRange,
      filtersState.searchTerm,
      !filtersState.includeRead ? 'unread-only' : null,
    ].filter(Boolean).length;

    return {
      hasActiveFilters,
      activeFilterCount,
    };
  }, [filtersState]);

  // =============================================================================
  // Actions Object
  // =============================================================================

  const actions: NotificationFiltersActions = {
    setType,
    setPriority,
    setDateRange,
    setSearchTerm,
    setIncludeRead,
    clearFilters,
  };

  // =============================================================================
  // Return Interface
  // =============================================================================

  return {
    // State
    filters: filtersState,
    
    // Stats
    ...filterStats,
    
    // Basic actions
    ...actions,
    
    // Quick actions
    showOnlyUnread,
    showAll,
    filterByToday,
    filterByLastWeek,
    filterByUrgent,
    filterByHigh,
    
    // Filter application
    applyFilters,
    
    // Raw state setter
    setFiltersState,
  };
}

// =============================================================================
// Filter Presets Hook
// =============================================================================

export function useNotificationFilterPresets() {
  const presets = useMemo(() => ({
    unreadOnly: {
      name: 'Unread Only',
      filters: { includeRead: false },
    },
    urgentAndHigh: {
      name: 'Urgent & High Priority',
      filters: { includeRead: false }, // We'll apply priority filter in component
    },
    securityAlerts: {
      name: 'Security Alerts',
      filters: { type: 'security_alert' as NotificationType },
    },
    fileNotifications: {
      name: 'File Activity', 
      filters: { includeRead: true }, // We'll filter by type in component
    },
    systemNotifications: {
      name: 'System Announcements',
      filters: { type: 'system_announcement' as NotificationType },
    },
    today: {
      name: 'Today',
      filters: { includeRead: true }, // Date range applied in component
    },
    lastWeek: {
      name: 'Last Week',
      filters: { includeRead: true }, // Date range applied in component
    },
  }), []);
  const applyPreset = useCallback((
    presetKey: keyof typeof presets,
    setFiltersState: (updater: (prev: NotificationFiltersState) => NotificationFiltersState) => void
  ) => {
    const preset = presets[presetKey];
    if (preset) {
      setFiltersState((prev: NotificationFiltersState) => ({ ...prev, ...preset.filters }));
    }
  }, [presets]);

  return {
    presets,
    applyPreset,
  };
}
