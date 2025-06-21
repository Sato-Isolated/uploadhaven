/**
 * Notification Mutations Hook
 * Responsible ONLY for notification CRUD operations - follows SRP
 * 
 * Single Responsibility: Handle notification mutations (create, update, delete)
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { 
  NotificationMutationActions, 
  NotificationMutationState 
} from './types';
import { getNotificationQueryKey } from './useNotificationQuery';

// =============================================================================
// API Functions
// =============================================================================

interface MarkAsReadParams {
  notificationId: string;
}

interface BulkDeleteParams {
  notificationIds: string[];
}

interface UpdateNotificationParams {
  notificationId: string;
  data: {
    status?: 'read' | 'unread' | 'archived';
    metadata?: Record<string, unknown>;
  };
}

async function markNotificationAsRead(params: MarkAsReadParams): Promise<void> {
  const response = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notificationId: params.notificationId,
      action: 'markRead',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.status}`);
  }
}

async function markAllNotificationsAsRead(): Promise<void> {
  const response = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'markAllRead' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark all notifications as read: ${response.status}`);
  }
}

async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(`/api/notifications?id=${notificationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete notification: ${response.status}`);
  }
}

async function bulkDeleteNotifications(params: BulkDeleteParams): Promise<void> {
  const response = await fetch('/api/notifications/bulk', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationIds: params.notificationIds }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete notifications: ${response.status}`);
  }
}

async function updateNotification(params: UpdateNotificationParams): Promise<void> {
  const response = await fetch(`/api/notifications/${params.notificationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update notification: ${response.status}`);
  }
}

// =============================================================================
// Notification Mutations Hook
// =============================================================================

export function useNotificationMutations(): NotificationMutationActions & NotificationMutationState {
  const queryClient = useQueryClient();
  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification marked as read');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    },
  });
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark all notifications as read: ${error.message}`);
    },
  });
  // Delete single notification
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete notification: ${error.message}`);
    },
  });
  // Bulk delete notifications
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteNotifications,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`${variables.notificationIds.length} notifications deleted`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete notifications: ${error.message}`);
    },
  });
  // Update notification
  const updateNotificationMutation = useMutation({
    mutationFn: updateNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update notification: ${error.message}`);
    },
  });

  // Return actions and state
  return {
    // Actions
    markAsRead: async (id: string) => {
      await markAsReadMutation.mutateAsync({ notificationId: id });
    },
    markAllAsRead: async () => {
      await markAllAsReadMutation.mutateAsync();
    },
    deleteNotification: async (id: string) => {
      await deleteNotificationMutation.mutateAsync(id);
    },
    bulkDelete: async (ids: string[]) => {
      await bulkDeleteMutation.mutateAsync({ notificationIds: ids });
    },
    updateNotification: async (id: string, data) => {
      await updateNotificationMutation.mutateAsync({ notificationId: id, data });
    },

    // State
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    isUpdating: updateNotificationMutation.isPending,
  };
}
