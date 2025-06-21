import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotificationMutations } from '../useNotificationMutations';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

describe('useNotificationMutations', () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  };

  const mockMutationResult = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useQueryClient as any).mockReturnValue(mockQueryClient);
    (useMutation as any).mockReturnValue(mockMutationResult);
  });

  describe('Basic mutation functionality', () => {
    it('should expose all CRUD mutation operations', () => {
      const { result } = renderHook(() => useNotificationMutations());

      // Should expose all mutation functions
      expect(typeof result.current.markAsRead).toBe('function');
      expect(typeof result.current.markAllAsRead).toBe('function');
      expect(typeof result.current.deleteNotification).toBe('function');
      expect(typeof result.current.bulkDelete).toBe('function');
      expect(typeof result.current.updateNotification).toBe('function');

      // Should expose mutation states
      expect(result.current.isMarkingAsRead).toBe(false);
      expect(result.current.isMarkingAllAsRead).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.isBulkDeleting).toBe(false);
      expect(result.current.isUpdating).toBe(false);
    });

    it('should set up mutations with proper invalidation', () => {
      renderHook(() => useNotificationMutations());

      // Should create mutations for each operation
      expect(useMutation).toHaveBeenCalledTimes(5); // markAsRead, markAllAsRead, delete, bulkDelete, update
      
      // Each mutation should be configured with onSuccess callback for cache invalidation
      const calls = (useMutation as any).mock.calls;
      calls.forEach((call: any) => {
        expect(call[0]).toHaveProperty('mutationFn');
        expect(call[0]).toHaveProperty('onSuccess');
      });
    });    it('should handle mutation success with cache invalidation', () => {
      // Mock successful mutation setup
      const mockOnSuccess = vi.fn();
      (useMutation as any).mockImplementation(({ onSuccess }: any) => {
        mockOnSuccess.mockImplementation(onSuccess);
        return {
          ...mockMutationResult,
          mutate: vi.fn(),
        };
      });

      renderHook(() => useNotificationMutations());

      // Verify that mutations are set up with onSuccess callbacks
      expect(useMutation).toHaveBeenCalledTimes(5);
      
      // Verify each mutation has the correct configuration
      const calls = (useMutation as any).mock.calls;
      calls.forEach((call: any) => {
        expect(call[0]).toHaveProperty('mutationFn');
        expect(call[0]).toHaveProperty('onSuccess');
        expect(call[0]).toHaveProperty('onError');
      });

      // Simulate successful mutation
      const firstCall = calls[0][0];
      firstCall.onSuccess();

      // Should show success toast and invalidate queries
      expect(toast.success).toHaveBeenCalledWith('Notification marked as read');
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['notifications'],
      });
    });
  });

  describe('SRP Compliance', () => {
    it('should only handle mutation concerns', () => {
      const { result } = renderHook(() => useNotificationMutations());

      // Should expose mutation functionality only
      expect(result.current).toHaveProperty('markAsRead');
      expect(result.current).toHaveProperty('deleteNotification');
      expect(result.current).toHaveProperty('isMarkingAsRead');
      expect(result.current).toHaveProperty('isDeleting');

      // Should NOT expose query or real-time functionality
      expect(result.current).not.toHaveProperty('notifications');
      expect(result.current).not.toHaveProperty('isLoading');
      expect(result.current).not.toHaveProperty('isConnected');
      expect(result.current).not.toHaveProperty('stats');
    });
  });
});
