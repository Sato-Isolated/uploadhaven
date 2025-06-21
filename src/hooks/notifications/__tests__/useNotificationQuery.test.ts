import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotificationQuery } from '../useNotificationQuery';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useInfiniteQuery: vi.fn(),
}));

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

describe('useNotificationQuery', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'file_upload' as const,
      priority: 'medium' as const,
      title: 'File uploaded',
      message: 'Your file has been uploaded successfully',
      isRead: false,
      createdAt: new Date(),
      userId: 'user1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic query functionality', () => {
    it('should execute query with default options', () => {
      const mockQueryResult = {
        data: { notifications: mockNotifications },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      (useQuery as any).mockReturnValue(mockQueryResult);

      const { result } = renderHook(() => useNotificationQuery());      expect(useQuery).toHaveBeenCalledWith({
        queryKey: ['notifications', {
          limit: 50,
          includeRead: true,
          type: undefined,
          offset: 0,
        }],
        queryFn: expect.any(Function),
        enabled: true,
        staleTime: 30000,
        refetchInterval: undefined,
        select: expect.any(Function),
      });

      expect(result.current).toEqual({
        data: { notifications: mockNotifications },
        isLoading: false,
        isError: false,
        error: null,
        refetch: expect.any(Function),
      });
    });

    it('should pass custom options to query', () => {
      const options = {
        enabled: false,
        limit: 10,
        includeRead: false,
        staleTime: 60000,
        refetchInterval: 5000,
      };

      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useNotificationQuery(options));      expect(useQuery).toHaveBeenCalledWith({
        queryKey: ['notifications', {
          limit: 10,
          includeRead: false,
          type: undefined,
          offset: 0,
        }],
        queryFn: expect.any(Function),
        enabled: false,
        staleTime: 60000,
        refetchInterval: 5000,
        select: expect.any(Function),
      });
    });

    it('should handle query errors', () => {
      const error = new Error('Query failed');
      (useQuery as any).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useNotificationQuery());

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(error);
    });
  });

  describe('SRP Compliance', () => {
    it('should only handle data fetching concerns', () => {
      const mockQueryResult = {
        data: { notifications: mockNotifications },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      (useQuery as any).mockReturnValue(mockQueryResult);

      const { result } = renderHook(() => useNotificationQuery());

      // Should expose query-related functionality only
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');

      // Should NOT expose mutation or real-time functionality
      expect(result.current).not.toHaveProperty('markAsRead');
      expect(result.current).not.toHaveProperty('isConnected');
      expect(result.current).not.toHaveProperty('stats');
    });
  });
});
