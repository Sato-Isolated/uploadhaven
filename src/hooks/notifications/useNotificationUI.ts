/**
 * Notification UI State Hook
 * Responsible ONLY for UI state management - follows SRP
 * 
 * Single Responsibility: Manage notification UI states and interactions
 */

'use client';

import { useState, useCallback } from 'react';
import type { NotificationUIState, NotificationUIActions } from './types';

// =============================================================================
// Notification UI Hook
// =============================================================================

export function useNotificationUI(initialState: Partial<NotificationUIState> = {}) {
  const [uiState, setUIState] = useState<NotificationUIState>({
    selectedIds: [],
    expandedIds: [],
    viewMode: 'list',
    showUnreadOnly: false,
    groupByType: false,
    ...initialState,
  });

  // =============================================================================
  // Selection Actions
  // =============================================================================

  const toggleSelection = useCallback((id: string) => {
    setUIState(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(id)
        ? prev.selectedIds.filter(selectedId => selectedId !== id)
        : [...prev.selectedIds, id],
    }));
  }, []);

  const selectAll = useCallback((allIds: string[]) => {
    setUIState(prev => ({
      ...prev,
      selectedIds: allIds,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      selectedIds: [],
    }));
  }, []);

  // =============================================================================
  // Expansion Actions
  // =============================================================================

  const toggleExpanded = useCallback((id: string) => {
    setUIState(prev => ({
      ...prev,
      expandedIds: prev.expandedIds.includes(id)
        ? prev.expandedIds.filter(expandedId => expandedId !== id)
        : [...prev.expandedIds, id],
    }));
  }, []);

  const expandAll = useCallback((allIds: string[]) => {
    setUIState(prev => ({
      ...prev,
      expandedIds: allIds,
    }));
  }, []);

  const collapseAll = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      expandedIds: [],
    }));
  }, []);

  // =============================================================================
  // View Actions
  // =============================================================================

  const setViewMode = useCallback((mode: 'list' | 'compact' | 'card') => {
    setUIState(prev => ({
      ...prev,
      viewMode: mode,
    }));
  }, []);

  const toggleUnreadOnly = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      showUnreadOnly: !prev.showUnreadOnly,
    }));
  }, []);

  const toggleGroupByType = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      groupByType: !prev.groupByType,
    }));
  }, []);

  // =============================================================================
  // Utility Functions
  // =============================================================================

  const isSelected = useCallback((id: string) => {
    return uiState.selectedIds.includes(id);
  }, [uiState.selectedIds]);

  const isExpanded = useCallback((id: string) => {
    return uiState.expandedIds.includes(id);
  }, [uiState.expandedIds]);

  const hasSelection = uiState.selectedIds.length > 0;
  const selectedCount = uiState.selectedIds.length;

  // =============================================================================
  // Return Interface
  // =============================================================================

  const actions: NotificationUIActions = {
    toggleSelection,
    selectAll: (allIds: string[]) => selectAll(allIds),
    clearSelection,
    toggleExpanded,
    setViewMode,
    toggleUnreadOnly,
    toggleGroupByType,
  };

  return {
    // State
    ...uiState,
    
    // Computed
    hasSelection,
    selectedCount,
    
    // Helpers
    isSelected,
    isExpanded,
    
    // Actions
    ...actions,
    
    // Additional actions
    expandAll,
    collapseAll,
    
    // Raw state setter for advanced use cases
    setState: setUIState,
  };
}

// =============================================================================
// Notification Bulk Actions Hook
// =============================================================================

export function useNotificationBulkActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const executeBulkAction = useCallback(async (
    action: 'markAsRead' | 'delete' | 'archive',
    selectedIds: string[],
    actionFunction: (ids: string[]) => Promise<void>
  ) => {
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    setLastAction(action);

    try {
      await actionFunction(selectedIds);
    } finally {
      setIsProcessing(false);
      setLastAction(null);
    }
  }, []);

  return {
    isProcessing,
    lastAction,
    executeBulkAction,
  };
}
