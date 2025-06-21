/**
 * Security Notifications Hook
 * Specialized hook for security-related notifications - follows SRP
 * 
 * Single Responsibility: Handle security-specific notification logic
 */

'use client';

import { useNotificationQuery } from './useNotificationQuery';
import { useNotificationMutations } from './useNotificationMutations';
import type { SecurityNotificationOptions } from './types';
import type { NotificationEntity } from '@/lib/notifications/domain/types';

// =============================================================================
// Security Notification Hook
// =============================================================================

export function useSecurityNotifications(options: SecurityNotificationOptions = {}) {
  const {
    severityFilter,
    autoMarkAsRead = false,
    alertOnCritical = true,
  } = options;
  // Query security notifications only
  const notificationQuery = useNotificationQuery({
    type: 'security_alert',
    includeRead: !autoMarkAsRead,
  });

  const mutations = useNotificationMutations();

  // Filter by severity if specified
  const filteredNotifications = notificationQuery.data?.notifications.filter((notification) => {
    if (!severityFilter) return true;
    
    // Map priority to severity
    const severityMap = {
      low: 'low',
      normal: 'medium', 
      high: 'high',
      urgent: 'critical',
    };
    
    const notificationSeverity = severityMap[notification.priority] || 'medium';
    return notificationSeverity === severityFilter;
  }) || [];

  // Critical notifications
  const criticalNotifications = filteredNotifications.filter(
    n => n.priority === 'urgent'
  );

  // Security metrics
  const metrics = {
    total: filteredNotifications.length,
    unread: filteredNotifications.filter(n => n.status === 'unread').length,
    critical: criticalNotifications.length,
    hasCritical: criticalNotifications.length > 0,
  };

  // Auto-acknowledge security notifications
  const acknowledgeSecurityAlert = async (id: string) => {
    await mutations.updateNotification(id, {
      metadata: { acknowledgedAt: new Date().toISOString() },
    });
    await mutations.markAsRead(id);
  };

  return {
    // Data
    notifications: filteredNotifications,
    criticalNotifications,
    metrics,
    
    // States
    isLoading: notificationQuery.isLoading,
    isError: notificationQuery.isError,
    error: notificationQuery.error,
    
    // Actions
    acknowledgeAlert: acknowledgeSecurityAlert,
    markAsRead: mutations.markAsRead,
    deleteNotification: mutations.deleteNotification,
    refetch: notificationQuery.refetch,
    
    // Mutation states
    isAcknowledging: mutations.isUpdating || mutations.isMarkingAsRead,
  };
}
