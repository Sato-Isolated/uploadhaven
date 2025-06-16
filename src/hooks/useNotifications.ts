import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Notification, NotificationStats } from '@/types/events';
import { useNotificationContext } from '@/components/providers/NotificationProvider';

interface UseNotificationsOptions {
  enabled?: boolean;
  limit?: number;
  includeRead?: boolean;
  type?: string;
  realtime?: boolean;
}

interface NotificationStreamEvent {
  type: 'connected' | 'notification';
  data?: Notification;
  message?: string;
  timestamp?: string;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    enabled = true,
    limit = 50,
    includeRead = true,
    type,
    realtime = true,
  } = options;

  const queryClient = useQueryClient();
  const { shouldEnableSSE } = useNotificationContext();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);
  const maxReconnectAttempts = 3;
  const reconnectAttemptsRef = useRef(0);

  // Effective realtime flag combines user preference and context state
  const effectiveRealtime = realtime && shouldEnableSSE;

  // Query for notifications
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', { limit, includeRead, type }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        includeRead: includeRead.toString(),
        ...(type && { type }),
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      return response.json();
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: realtime ? undefined : 60 * 1000, // 1 minute if not real-time
  });

  // Query for notification statistics
  const { data: statsData } = useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?stats=true');
      if (!response.ok) {
        throw new Error(
          `Failed to fetch notification stats: ${response.status}`
        );
      }
      return response.json();
    },
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refresh stats every minute
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          action: 'markRead',
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to mark notification as read: ${response.status}`
        );
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification marked as read');
    },
    onError: (error) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to mark all notifications as read: ${response.status}`
        );
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(data.message || 'All notifications marked as read');
    },
    onError: (error) => {
      toast.error(`Failed to mark all notifications as read: ${error.message}`);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete notification: ${error.message}`);
    },
  });
  // Real-time notifications via Server-Sent Events
  const cleanupConnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
  }, []);
  const connectToNotificationStream = useCallback(() => {
    // Don't connect if unmounting, disabled, or if already connected
    if (!effectiveRealtime || eventSourceRef.current || isUnmountingRef.current)
      return;

    try {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
        console.log('🔔 Connected to notification stream');
      };

      eventSource.onmessage = (event) => {
        try {
          const data: NotificationStreamEvent = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('🔔 Notification stream connected:', data.message);
          } else if (data.type === 'notification' && data.data) {
            // New notification received
            console.log('🔔 New notification received:', data.data);

            // Show toast notification only if component is still mounted
            if (!isUnmountingRef.current) {
              const notification = data.data;
              const toastFn =
                notification.priority === 'urgent' ||
                notification.priority === 'high'
                  ? toast.error
                  : toast.success;

              toastFn(`${notification.title}: ${notification.message}`, {
                action: notification.actionUrl
                  ? {
                      label: notification.actionLabel || 'View',
                      onClick: () =>
                        (window.location.href = notification.actionUrl!),
                    }
                  : undefined,
              });

              // Update query cache with new notification
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        setIsConnected(false);

        // Clean up current connection
        eventSource.close();
        eventSourceRef.current = null;

        // Only attempt reconnection if component is still mounted, SSE is enabled, and we haven't exceeded max attempts
        if (
          !isUnmountingRef.current &&
          effectiveRealtime &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          const retryDelay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            10000
          ); // Exponential backoff, max 10s

          setConnectionError(
            `Connection lost - retrying in ${Math.ceil(retryDelay / 1000)}s (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountingRef.current && effectiveRealtime) {
              connectToNotificationStream();
            }
          }, retryDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Connection failed - please refresh the page');
        }
      };
    } catch (error) {
      console.error('❌ Failed to connect to notification stream:', error);
      setConnectionError('Failed to connect to notification stream');
    }
  }, [effectiveRealtime, queryClient, maxReconnectAttempts]); // Consolidated effect to handle SSE connection state
  useEffect(() => {
    isUnmountingRef.current = false;

    // Handle page navigation/visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, close connection to avoid errors
        cleanupConnection();
      } else if (
        !document.hidden &&
        effectiveRealtime &&
        enabled &&
        !eventSourceRef.current &&
        !isUnmountingRef.current
      ) {
        // Page is visible again, reconnect with delay to avoid rapid reconnections
        setTimeout(() => {
          if (!isUnmountingRef.current && effectiveRealtime && enabled) {
            connectToNotificationStream();
          }
        }, 1000); // Longer delay to prevent connection conflicts
      }
    };

    const handleBeforeUnload = () => {
      isUnmountingRef.current = true;
      cleanupConnection();
    };

    // Main connection logic with debouncing
    if (
      effectiveRealtime &&
      enabled &&
      !eventSourceRef.current &&
      !isUnmountingRef.current
    ) {
      // Use a longer timeout to prevent rapid reconnections during navigation
      const connectionTimer = setTimeout(() => {
        if (
          !isUnmountingRef.current &&
          effectiveRealtime &&
          enabled &&
          !eventSourceRef.current
        ) {
          connectToNotificationStream();
        }
      }, 1500); // 1.5 second delay to allow navigation to settle

      // Add event listeners for better navigation handling
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        clearTimeout(connectionTimer);
        isUnmountingRef.current = true;
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
        window.removeEventListener('beforeunload', handleBeforeUnload);
        cleanupConnection();
      };
    } else if (!effectiveRealtime) {
      // SSE disabled by context (e.g., during navigation), clean up connection
      cleanupConnection();
    }

    // Add event listeners even when not connecting
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isUnmountingRef.current = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupConnection();
    };
  }, [effectiveRealtime, enabled]); // Simplified dependency array

  // Helper functions
  const markAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(
    (notificationId: string) => {
      deleteNotificationMutation.mutate(notificationId);
    },
    [deleteNotificationMutation]
  );

  return {
    // Data
    notifications: notificationsData?.notifications || [],
    stats: statsData?.stats as NotificationStats | undefined,

    // Loading states
    isLoading,
    isConnected,
    connectionError,

    // Error states
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
  };
}
