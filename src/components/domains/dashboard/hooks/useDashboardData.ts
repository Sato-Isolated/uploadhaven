// useDashboardData.ts - Centralized dashboard data management hook
// Responsibility: Orchestrate all dashboard data fetching and state management

'use client';

import { useMemo, useCallback } from 'react';
import { useUserStats } from '@/hooks/useUserStats';
import { useLogUserActivity } from '@/hooks';
import { useRealTimeActivities } from '@/hooks/useRealTimePolling';
import type { UserStatsData } from '../types';

interface UseDashboardDataProps {
  userId?: string;
  enabled?: boolean;
}

interface UseDashboardDataReturn {
  // Data
  stats: UserStatsData | null;
  
  // States
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  
  // Real-time data
  realtimeConnected: boolean;
  
  // Actions
  refreshData: () => void;
  logActivity: () => void;
}

export type { UseDashboardDataProps, UseDashboardDataReturn };

export function useDashboardData({ 
  userId, 
  enabled = true 
}: UseDashboardDataProps = {}): UseDashboardDataReturn {
  // Stabilize authentication state
  const isAuthenticated = useMemo(() => Boolean(userId), [userId]);
  
  // User activity logging
  const { mutate: logUserActivity } = useLogUserActivity();
  
  // Real-time activities monitoring
  const {
    isConnected: realtimeConnected,
    // latestActivity,
    // activityCount,
    // resetActivityCount
  } = useRealTimeActivities();

  // User statistics with conditional fetching
  const {
    data: rawStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useUserStats(enabled && isAuthenticated ? userId : undefined);
  // Transform raw stats to dashboard format with safe defaults
  const stats: UserStatsData | null = useMemo(() => {
    if (!rawStats) return null;
    
    return {
      totalFiles: rawStats.totalFiles || 0,
      totalSize: rawStats.totalSize || 0,
      recentUploads: rawStats.recentUploads || 0,
      expiringSoon: rawStats.expiringSoon || 0,
      filesThisWeek: 0, // Additional field for SRP dashboard
      averageFileSize: 0, // Additional field for SRP dashboard  
      mostUsedType: 'document', // Additional field for SRP dashboard
    };
  }, [rawStats]);

  // Global loading state
  const isLoading = useMemo(() => {
    return statsLoading && enabled && isAuthenticated;
  }, [statsLoading, enabled, isAuthenticated]);

  // Global error state
  const error = useMemo(() => {
    return statsError;
  }, [statsError]);

  // Refresh all dashboard data
  const refreshData = useCallback(() => {
    if (isAuthenticated) {
      refetchStats();
    }
  }, [isAuthenticated, refetchStats]);

  // Log user activity with error handling
  const logActivity = useCallback(() => {
    if (isAuthenticated) {
      try {
        logUserActivity();
      } catch (error) {
        console.warn('Failed to log user activity:', error);
      }
    }
  }, [isAuthenticated, logUserActivity]);

  return {
    // Data
    stats,
    
    // States
    isLoading,
    error,
    isAuthenticated,
    
    // Real-time
    realtimeConnected,
    
    // Actions
    refreshData,
    logActivity,
  };
}
