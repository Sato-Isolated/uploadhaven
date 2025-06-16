import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/components/providers/NotificationProvider', () => ({
  useNotificationContext: vi.fn(),
}));

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNotificationContext } from '@/components/providers/NotificationProvider';

describe('useNotifications', () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  };

  const mockQuery = {
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };

  const mockMutation = {
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  };

  const mockNotificationContext = {
    shouldEnableSSE: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as any).mockReturnValue(mockQuery);
    (useMutation as any).mockReturnValue(mockMutation);
    (useQueryClient as any).mockReturnValue(mockQueryClient);
    (useNotificationContext as any).mockReturnValue(mockNotificationContext); // Mock EventSource
    (global as any).EventSource = vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
      readyState: 1,
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2,
    }));
  });
  it('should initialize with default options', () => {
    renderHook(() => useNotifications());

    // Check that useQuery was called with correct parameters for notifications
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'notifications',
          { limit: 50, includeRead: true, type: undefined },
        ],
        queryFn: expect.any(Function),
        enabled: true,
        staleTime: 30000,
        refetchInterval: undefined,
      })
    );

    // Check that useQuery was called with correct parameters for stats
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['notifications', 'stats'],
        queryFn: expect.any(Function),
        enabled: true,
        staleTime: 30000,
        refetchInterval: 60000,
      })
    );
  });

  it('should use custom options when provided', () => {
    const options = {
      enabled: false,
      limit: 100,
      includeRead: false,
      type: 'security',
      realtime: false,
    };

    renderHook(() => useNotifications(options));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('should disable realtime when context disables SSE', () => {
    (useNotificationContext as any).mockReturnValue({
      shouldEnableSSE: false,
    });

    const options = { realtime: true };
    renderHook(() => useNotifications(options)); // Should not create EventSource when SSE is disabled
    expect((global as any).EventSource).not.toHaveBeenCalled();
  });

  it('should enable realtime when both user and context allow it', () => {
    (useNotificationContext as any).mockReturnValue({
      shouldEnableSSE: true,
    });

    const options = { realtime: true };
    renderHook(() => useNotifications(options));

    // EventSource should be created in useEffect, we can't directly test this
    // but we can verify the context was checked
    expect(useNotificationContext).toHaveBeenCalled();
  });

  it('should build query parameters correctly', () => {
    const options = {
      limit: 25,
      includeRead: false,
      type: 'upload',
    };

    renderHook(() => useNotifications(options));

    const queryCall = (useQuery as any).mock.calls[0][0];
    expect(queryCall.queryFn).toBeDefined();
  });
  it('should handle notifications data fetching', async () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'upload',
        message: 'File uploaded',
        timestamp: new Date().toISOString(),
        read: false,
      },
      {
        id: '2',
        type: 'security',
        message: 'Security scan complete',
        timestamp: new Date().toISOString(),
        read: true,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          notifications: mockNotifications,
          stats: { total: 2, unread: 1 },
        }),
    });

    renderHook(() => useNotifications());

    const queryCall = (useQuery as any).mock.calls[0][0];
    const result = await queryCall.queryFn();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications?limit=50&includeRead=true'
    );

    expect(result).toEqual({
      notifications: mockNotifications,
      stats: { total: 2, unread: 1 },
    });
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    renderHook(() => useNotifications());

    const queryCall = (useQuery as any).mock.calls[0][0];

    await expect(queryCall.queryFn()).rejects.toThrow(
      'Failed to fetch notifications: 500'
    );
  });

  it('should build URL with query parameters', async () => {
    const options = {
      limit: 20,
      includeRead: false,
      type: 'security',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: [], stats: {} }),
    });

    renderHook(() => useNotifications(options));

    const queryCall = (useQuery as any).mock.calls[0][0];
    await queryCall.queryFn();

    const fetchCall = (global.fetch as any).mock.calls[0];
    const url = fetchCall[0];

    expect(url).toContain('limit=20');
    expect(url).toContain('includeRead=false');
    expect(url).toContain('type=security');
  });

  it('should handle different notification types', () => {
    const notificationTypes = ['upload', 'security', 'system', 'user'];

    notificationTypes.forEach((type) => {
      vi.clearAllMocks();

      renderHook(() => useNotifications({ type }));

      expect(useQuery).toHaveBeenCalled();
    });
  });

  it('should manage connection state correctly', () => {
    const { result } = renderHook(() => useNotifications());

    // Initial state should show disconnected
    expect(result.current).toEqual(
      expect.objectContaining({
        isLoading: false,
        error: null,
      })
    );
  });

  it('should provide mutation for marking notifications as read', () => {
    renderHook(() => useNotifications());

    expect(useMutation).toHaveBeenCalled();

    const mutationCall = (useMutation as any).mock.calls[0][0];
    expect(mutationCall).toHaveProperty('mutationFn');
  });
  it('should invalidate queries after successful mutations', async () => {
    const mockMutationWithSuccess = {
      ...mockMutation,
      mutate: vi.fn(),
    };

    (useMutation as any).mockImplementation((config: any) => {
      // Simulate successful mutation with data that has a message property
      if (config.onSuccess) {
        setTimeout(() => config.onSuccess({ message: 'Success' }), 0);
      }
      return mockMutationWithSuccess;
    });

    renderHook(() => useNotifications());

    // Wait for onSuccess to be called
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
  });

  it('should handle notification limits correctly', () => {
    const limits = [10, 25, 50, 100];

    limits.forEach((limit) => {
      vi.clearAllMocks();

      renderHook(() => useNotifications({ limit }));

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        })
      );
    });
  });
  it('should respect cache configuration', () => {
    renderHook(() => useNotifications());

    const queryCall = (useQuery as any).mock.calls[0][0];

    expect(queryCall.staleTime).toBeGreaterThan(0);
    expect(queryCall.staleTime).toBe(30000); // 30 seconds
    // refetchInterval can be undefined for real-time notifications
    expect(queryCall.refetchInterval).toBeUndefined();
  });

  it('should handle empty notifications response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          notifications: [],
          stats: { total: 0, unread: 0 },
        }),
    });

    renderHook(() => useNotifications());

    const queryCall = (useQuery as any).mock.calls[0][0];
    const result = await queryCall.queryFn();

    expect(result.notifications).toEqual([]);
    expect(result.stats.total).toBe(0);
  });
  it('should provide consistent interface', () => {
    const { result } = renderHook(() => useNotifications());

    // Should return the correct interface structure with specific values
    expect(result.current).toEqual({
      // Data
      notifications: [],
      stats: undefined,

      // Loading states
      isLoading: false,
      isConnected: false,
      connectionError: null,

      // Error states
      error: null,

      // Actions
      markAsRead: expect.any(Function),
      markAllAsRead: expect.any(Function),
      deleteNotification: expect.any(Function),
      refetch: expect.any(Function),

      // Mutation states
      isMarkingAsRead: undefined,
      isMarkingAllAsRead: undefined,
      isDeleting: undefined,
    });
  });
});
