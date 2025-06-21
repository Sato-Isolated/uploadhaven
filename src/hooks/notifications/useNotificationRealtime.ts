/**
 * Notification Real-time Hook
 * Responsible ONLY for real-time SSE connections - follows SRP
 * 
 * Single Responsibility: Manage real-time notification connections
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { 
  NotificationRealtimeOptions, 
  NotificationRealtimeState 
} from './types';
import type { NotificationEntity } from '@/lib/notifications/domain/types';
import { useNotificationContext } from '@/components/providers/NotificationProvider';

// =============================================================================
// SSE Event Types
// =============================================================================

interface NotificationSSEEvent {
  type: 'connected' | 'notification' | 'error';
  data?: NotificationEntity;
  message?: string;
  timestamp?: string;
}

// =============================================================================
// Real-time Notification Hook
// =============================================================================

export function useNotificationRealtime(
  options: NotificationRealtimeOptions = {}
): NotificationRealtimeState {
  const {
    enabled = true,
    reconnectAttempts = 3,
    reconnectDelay = 1000,
  } = options;

  const queryClient = useQueryClient();
  const { shouldEnableSSE } = useNotificationContext();
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);
  const subscribersRef = useRef<Set<(notification: NotificationEntity) => void>>(new Set());

  // Effective enabled state
  const effectiveEnabled = enabled && shouldEnableSSE;

  // =============================================================================
  // Connection Management
  // =============================================================================

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);
  }, []);

  const connect = useCallback(() => {
    if (!effectiveEnabled || eventSourceRef.current || isUnmountingRef.current) {
      return;
    }

    try {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        setReconnectCount(0);
        setLastConnectedAt(new Date());
        console.log('🔔 Connected to notification stream');
      };

      eventSource.onmessage = (event) => {
        try {
          const data: NotificationSSEEvent = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('🔔 Notification stream ready:', data.message);
          } else if (data.type === 'notification' && data.data) {
            const notification = data.data;
            
            // Notify subscribers
            subscribersRef.current.forEach(callback => {
              try {
                callback(notification);
              } catch (error) {
                console.error('Error in notification subscriber:', error);
              }
            });

            // Show toast for urgent notifications
            if (notification.priority === 'urgent' || notification.priority === 'high') {
              const toastFn = notification.priority === 'urgent' ? toast.error : toast.warning;
              
              toastFn(`${notification.title}: ${notification.message}`, {
                action: notification.actionUrl ? {
                  label: notification.actionLabel || 'View',
                  onClick: () => window.location.href = notification.actionUrl!,
                } : undefined,
              });
            }

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
          setConnectionError('Failed to parse notification data');
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        setIsConnected(false);
        
        // Clean up current connection
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt reconnection if not unmounting and under retry limit
        if (
          !isUnmountingRef.current &&
          effectiveEnabled &&
          reconnectCount < reconnectAttempts
        ) {
          const newCount = reconnectCount + 1;
          setReconnectCount(newCount);
          
          const delay = Math.min(reconnectDelay * Math.pow(2, newCount - 1), 10000);
          setConnectionError(`Connection lost - retrying in ${Math.ceil(delay / 1000)}s (${newCount}/${reconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountingRef.current && effectiveEnabled) {
              connect();
            }
          }, delay);
        } else if (reconnectCount >= reconnectAttempts) {
          setConnectionError('Connection failed - please refresh the page');
        }
      };

    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      setConnectionError('Failed to establish connection');
    }
  }, [effectiveEnabled, reconnectCount, reconnectAttempts, reconnectDelay, queryClient]);

  const disconnect = useCallback(() => {
    cleanup();
    setReconnectCount(0);
  }, [cleanup]);

  // =============================================================================
  // Subscription Management
  // =============================================================================

  const subscribe = useCallback((callback: (notification: NotificationEntity) => void) => {
    subscribersRef.current.add(callback);
    
    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  // =============================================================================
  // Effects
  // =============================================================================

  // Main connection effect
  useEffect(() => {
    isUnmountingRef.current = false;

    if (effectiveEnabled) {
      // Delay initial connection to avoid rapid reconnections
      const connectionTimer = setTimeout(() => {
        if (!isUnmountingRef.current && effectiveEnabled) {
          connect();
        }
      }, 500);

      return () => {
        clearTimeout(connectionTimer);
        isUnmountingRef.current = true;
        cleanup();
      };
    } else {
      cleanup();
    }
  }, [effectiveEnabled, connect, cleanup]);

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, disconnect to save resources
        cleanup();
      } else if (!document.hidden && effectiveEnabled && !eventSourceRef.current) {
        // Page is visible again, reconnect
        setTimeout(() => {
          if (!isUnmountingRef.current && effectiveEnabled) {
            connect();
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [effectiveEnabled, connect, cleanup]);

  // =============================================================================
  // Return Interface
  // =============================================================================
  return {
    isConnected,
    connectionError,
    reconnectAttempts: reconnectCount,
    lastConnectedAt: lastConnectedAt || undefined,
    connect,
    disconnect,
    subscribe,
  };
}
