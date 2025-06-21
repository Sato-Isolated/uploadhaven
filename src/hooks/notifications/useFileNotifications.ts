/**
 * File Notifications Hook
 * Specialized hook for file-related notifications - follows SRP
 * 
 * Single Responsibility: Handle file-specific notification logic
 */

'use client';

import { useNotificationQuery } from './useNotificationQuery';
import { useNotificationMutations } from './useNotificationMutations';
import type { FileNotificationOptions } from './types';

// =============================================================================
// File Notification Hook
// =============================================================================

export function useFileNotifications(options: FileNotificationOptions = {}) {
  const {
    fileId,
    includeExpiration = true,
    groupByFile = false,
  } = options;

  // Query file-related notifications
  const notificationQuery = useNotificationQuery({
    // No type filter to get all file-related types
    includeRead: true,
  });

  const mutations = useNotificationMutations();

  // Filter file-related notifications
  const fileNotificationTypes = [
    'file_downloaded',
    'file_expired_soon', 
    'file_shared',
    'file_upload_complete',
  ];

  const allFileNotifications = notificationQuery.data?.notifications.filter((notification) => {
    const isFileType = fileNotificationTypes.includes(notification.type);
    const matchesFileId = !fileId || notification.relatedFileId === fileId;
    const includeExpirationCheck = includeExpiration || notification.type !== 'file_expired_soon';
    
    return isFileType && matchesFileId && includeExpirationCheck;
  }) || [];

  // Group by file if requested
  const groupedNotifications = groupByFile 
    ? groupNotificationsByFile(allFileNotifications)
    : null;

  // File-specific metrics
  const metrics = {
    total: allFileNotifications.length,
    downloads: allFileNotifications.filter(n => n.type === 'file_downloaded').length,
    uploads: allFileNotifications.filter(n => n.type === 'file_upload_complete').length,
    shares: allFileNotifications.filter(n => n.type === 'file_shared').length,
    expiringFiles: allFileNotifications.filter(n => n.type === 'file_expired_soon').length,
    unread: allFileNotifications.filter(n => n.status === 'unread').length,
  };

  // File-specific actions
  const markFileNotificationsAsRead = async (targetFileId: string) => {
    const fileNotifications = allFileNotifications.filter(
      n => n.relatedFileId === targetFileId && n.status === 'unread'
    );
    
    await Promise.all(
      fileNotifications.map(notification => mutations.markAsRead(notification.id))
    );
  };

  const deleteFileNotifications = async (targetFileId: string) => {
    const fileNotifications = allFileNotifications.filter(
      n => n.relatedFileId === targetFileId
    );
    
    if (fileNotifications.length > 0) {
      await mutations.bulkDelete(fileNotifications.map(n => n.id));
    }
  };

  return {
    // Data
    notifications: allFileNotifications,
    groupedNotifications,
    metrics,
    
    // States
    isLoading: notificationQuery.isLoading,
    isError: notificationQuery.isError,
    error: notificationQuery.error,
    
    // Actions
    markAsRead: mutations.markAsRead,
    markFileNotificationsAsRead,
    deleteNotification: mutations.deleteNotification,
    deleteFileNotifications,
    refetch: notificationQuery.refetch,
    
    // Mutation states
    isMarkingAsRead: mutations.isMarkingAsRead,
    isDeleting: mutations.isDeleting || mutations.isBulkDeleting,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function groupNotificationsByFile(notifications: any[]) {
  const grouped: Record<string, any[]> = {};
  
  notifications.forEach(notification => {
    const fileId = notification.relatedFileId || 'no-file';
    if (!grouped[fileId]) {
      grouped[fileId] = [];
    }
    grouped[fileId].push(notification);
  });
  
  return grouped;
}
