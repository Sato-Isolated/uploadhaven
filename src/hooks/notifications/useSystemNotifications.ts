/**
 * System Notifications Hook  
 * Specialized hook for system-wide notifications - follows SRP
 * 
 * Single Responsibility: Handle system announcement and admin notification logic
 */

'use client';

import { useNotificationQuery } from './useNotificationQuery';
import { useNotificationMutations } from './useNotificationMutations';
import type { SystemNotificationOptions } from './types';

// =============================================================================
// System Notification Hook
// =============================================================================

export function useSystemNotifications(options: SystemNotificationOptions = {}) {
  const {
    adminOnly = false,
    includeMaintenanceAlerts = true,
  } = options;

  // Query system notifications
  const notificationQuery = useNotificationQuery({
    type: adminOnly ? 'admin_alert' : 'system_announcement',
    includeRead: true,
  });

  const mutations = useNotificationMutations();

  // Filter notifications based on options
  const systemNotificationTypes = [
    'system_announcement',
    ...(adminOnly ? ['admin_alert'] : []),
  ];

  const filteredNotifications = notificationQuery.data?.notifications.filter((notification) => {
    const isSystemType = systemNotificationTypes.includes(notification.type);
    
    // Filter maintenance alerts if requested
    if (!includeMaintenanceAlerts && notification.metadata?.isMaintenanceAlert) {
      return false;
    }
    
    return isSystemType;
  }) || [];

  // Categorize notifications
  const announcements = filteredNotifications.filter(n => n.type === 'system_announcement');
  const adminAlerts = filteredNotifications.filter(n => n.type === 'admin_alert');
  const maintenanceAlerts = filteredNotifications.filter(
    n => n.metadata?.isMaintenanceAlert === true
  );
  const urgentSystemNotifications = filteredNotifications.filter(
    n => n.priority === 'urgent'
  );

  // System metrics
  const metrics = {
    total: filteredNotifications.length,
    announcements: announcements.length,
    adminAlerts: adminAlerts.length,
    maintenanceAlerts: maintenanceAlerts.length,
    urgent: urgentSystemNotifications.length,
    unread: filteredNotifications.filter(n => n.status === 'unread').length,
  };

  // System-specific actions
  const dismissAnnouncement = async (id: string) => {
    await mutations.updateNotification(id, {
      metadata: { 
        dismissedAt: new Date().toISOString(),
        dismissed: true,
      },
    });
    await mutations.markAsRead(id);
  };

  const acknowledgeMaintenanceAlert = async (id: string) => {
    await mutations.updateNotification(id, {
      metadata: { 
        acknowledgedAt: new Date().toISOString(),
        acknowledged: true,
      },
    });
    await mutations.markAsRead(id);
  };

  const markAllSystemNotificationsAsRead = async () => {
    const unreadIds = filteredNotifications
      .filter(n => n.status === 'unread')
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      await Promise.all(
        unreadIds.map(id => mutations.markAsRead(id))
      );
    }
  };

  return {
    // Data
    notifications: filteredNotifications,
    announcements,
    adminAlerts,
    maintenanceAlerts,
    urgentNotifications: urgentSystemNotifications,
    metrics,
    
    // States
    isLoading: notificationQuery.isLoading,
    isError: notificationQuery.isError,
    error: notificationQuery.error,
    
    // Actions
    markAsRead: mutations.markAsRead,
    dismissAnnouncement,
    acknowledgeMaintenanceAlert,
    markAllAsRead: markAllSystemNotificationsAsRead,
    deleteNotification: mutations.deleteNotification,
    refetch: notificationQuery.refetch,
    
    // Mutation states
    isMarkingAsRead: mutations.isMarkingAsRead,
    isDismissing: mutations.isUpdating,
    isAcknowledging: mutations.isUpdating,
    isDeleting: mutations.isDeleting,
  };
}
