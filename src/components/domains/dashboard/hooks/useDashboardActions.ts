// useDashboardActions.ts - Centralized dashboard actions management hook
// Responsibility: Handle all user interactions and dashboard actions

'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface UseDashboardActionsProps {
  userId?: string;
  onRefreshData?: () => void;
}

interface UseDashboardActionsReturn {
  // Action Handlers
  handleRefreshStats: () => void;
  handleNavigateToUpload: () => void;
  
  // State
  isPerformingAction: boolean;
}

export type { UseDashboardActionsProps, UseDashboardActionsReturn };

export function useDashboardActions({ 
  onRefreshData 
}: UseDashboardActionsProps = {}): UseDashboardActionsReturn {
  const router = useRouter();
  const tCommon = useTranslations('Common');

  // Handle stats refresh with feedback
  const handleRefreshStats = useCallback(() => {
    try {
      if (onRefreshData) {
        onRefreshData();
        toast.success(tCommon('dataRefreshed'));
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      toast.error(tCommon('refreshFailed'));
    }
  }, [onRefreshData, tCommon]);

  // Handle navigation to upload page
  const handleNavigateToUpload = useCallback(() => {
    try {
      router.push('/');
      toast.success(tCommon('navigatingToUpload'));
    } catch (error) {
      console.error('Failed to navigate to upload:', error);
      toast.error(tCommon('navigationFailed'));
    }
  }, [router, tCommon]);

  // For future implementation: track if any action is being performed
  const isPerformingAction = useMemo(() => false, []);
  return {
    // Action Handlers
    handleRefreshStats,
    handleNavigateToUpload,
    
    // State
    isPerformingAction,
  };
}
