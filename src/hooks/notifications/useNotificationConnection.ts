/**
 * Notification Connection Hook
 * Responsible ONLY for connection state management - follows SRP
 * 
 * Single Responsibility: Monitor and manage connection quality and state
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NotificationConnectionState } from './types';

// =============================================================================
// Connection Quality Detection
// =============================================================================

function getConnectionQuality(): 'good' | 'poor' | 'offline' {
  if (!navigator.onLine) return 'offline';
  
  // Check connection type if available
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (connection) {
    const { effectiveType, downlink } = connection;
    
    // Very slow connections
    if (effectiveType === 'slow-2g' || downlink < 0.15) {
      return 'poor';
    }
    
    // Slow connections
    if (effectiveType === '2g' || downlink < 0.5) {
      return 'poor';
    }
    
    // Good connections (3g, 4g, or good downlink)
    return 'good';
  }
  
  // Fallback to online status
  return navigator.onLine ? 'good' : 'offline';
}

async function testConnectionSpeed(): Promise<number> {
  const startTime = performance.now();
  
  try {
    // Make a small request to test latency
    await fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache',
    });
    
    const endTime = performance.now();
    return endTime - startTime;
  } catch {
    return Infinity; // Connection failed
  }
}

// =============================================================================
// Connection State Hook
// =============================================================================

export interface UseNotificationConnectionOptions {
  enabled?: boolean;
  testInterval?: number; // How often to test connection (ms)
  poorConnectionThreshold?: number; // Latency threshold for poor connection (ms)
}

export function useNotificationConnection(
  options: UseNotificationConnectionOptions = {}
): NotificationConnectionState {
  const {
    enabled = true,
    testInterval = 30000, // 30 seconds
    poorConnectionThreshold = 1000, // 1 second
  } = options;

  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [lastTestLatency, setLastTestLatency] = useState<number | null>(null);

  // =============================================================================
  // Connection Testing
  // =============================================================================

  const testConnection = useCallback(async () => {
    if (!enabled || !navigator.onLine) {
      setConnectionQuality('offline');
      setIsConnected(false);
      return;
    }

    try {
      const latency = await testConnectionSpeed();
      setLastTestLatency(latency);
      setLastSync(new Date());

      if (latency === Infinity) {
        setConnectionQuality('offline');
        setIsConnected(false);
      } else if (latency > poorConnectionThreshold) {
        setConnectionQuality('poor');
        setIsConnected(true);
      } else {
        setConnectionQuality('good');
        setIsConnected(true);
      }
    } catch (error) {
      console.warn('Connection test failed:', error);
      setConnectionQuality('offline');
      setIsConnected(false);
    }
  }, [enabled, poorConnectionThreshold]);

  const retryConnection = useCallback(async () => {
    await testConnection();
  }, [testConnection]);

  // =============================================================================
  // Browser Events
  // =============================================================================

  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      setIsOnline(true);
      testConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
      setIsConnected(false);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, test connection
        testConnection();
      }
    };

    // Connection type change (mobile networks)
    const handleConnectionChange = () => {
      const newQuality = getConnectionQuality();
      setConnectionQuality(newQuality);
      
      if (newQuality !== 'offline') {
        testConnection();
      }
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Connection API events (if available)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial test
    testConnection();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [enabled, testConnection]);

  // =============================================================================
  // Periodic Testing
  // =============================================================================

  useEffect(() => {
    if (!enabled || testInterval <= 0) return;

    const interval = setInterval(() => {
      if (navigator.onLine && !document.hidden) {
        testConnection();
      }
    }, testInterval);

    return () => clearInterval(interval);
  }, [enabled, testInterval, testConnection]);

  // =============================================================================
  // Return Interface
  // =============================================================================

  return {
    isOnline,
    isConnected,
    connectionQuality,
    lastSync,
    retryConnection,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if connection is good enough for real-time features
 */
export function isConnectionGoodForRealtime(state: NotificationConnectionState): boolean {
  return state.isOnline && state.isConnected && state.connectionQuality !== 'poor';
}

/**
 * Get user-friendly connection status message
 */
export function getConnectionStatusMessage(state: NotificationConnectionState): string {
  if (!state.isOnline) {
    return 'You are offline';
  }
  
  if (!state.isConnected) {
    return 'Connection issues detected';
  }
  
  switch (state.connectionQuality) {
    case 'good':
      return 'Connected';
    case 'poor':
      return 'Slow connection detected';
    case 'offline':
      return 'Offline';
    default:
      return 'Unknown connection status';
  }
}

/**
 * Get connection status color for UI
 */
export function getConnectionStatusColor(state: NotificationConnectionState): string {
  if (!state.isOnline || !state.isConnected) {
    return 'red';
  }
  
  switch (state.connectionQuality) {
    case 'good':
      return 'green';
    case 'poor':
      return 'yellow';
    case 'offline':
      return 'red';
    default:
      return 'gray';
  }
}
