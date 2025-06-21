import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import type { UseNotificationsOptions } from '../useNotifications';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('../useNotificationQuery', () => ({
  useNotificationQuery: vi.fn(),
}));

vi.mock('../useNotificationMutations', () => ({
  useNotificationMutations: vi.fn(),
}));

vi.mock('../useNotificationRealtime', () => ({
  useNotificationRealtime: vi.fn(),
}));

vi.mock('../useNotificationStats', () => ({
  useNotificationStats: vi.fn(),
}));

vi.mock('../useNotificationConnection', () => ({
  useNotificationConnection: vi.fn(),
}));

import { 
  useNotificationQuery,
  useNotificationMutations,
  useNotificationRealtime,
  useNotificationStats,
  useNotificationConnection,
} from '../';

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

const mockStats = {
  total: 5,
  unread: 3,
  read: 2,
  byType: { file_upload: 2, security: 1, system: 2 },
  byPriority: { high: 1, medium: 3, low: 1, urgent: 0 },
};

describe('useNotifications (New SRP-based)', () => {
  const mockQueryResult = {
    data: { notifications: mockNotifications },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };

  const mockMutations = {
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    bulkDelete: vi.fn(),
    updateNotification: vi.fn(),
    isMarkingAsRead: false,
    isMarkingAllAsRead: false,
    isDeleting: false,
    isBulkDeleting: false,
    isUpdating: false,
  };

  const mockRealtimeResult = {
    isConnected: true,
    connectionError: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribe: vi.fn(),
  };

  const mockStatsResult = {
    stats: mockStats,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };

  const mockConnectionResult = {
    isConnected: true,
    connectionQuality: 'good' as const,
    retryConnection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useNotificationQuery as any).mockReturnValue(mockQueryResult);
    (useNotificationMutations as any).mockReturnValue(mockMutations);
    (useNotificationRealtime as any).mockReturnValue(mockRealtimeResult);
    (useNotificationStats as any).mockReturnValue(mockStatsResult);
    (useNotificationConnection as any).mockReturnValue(mockConnectionResult);
  });

  describe('Basic functionality', () => {
    it('should return all composed results from focused hooks', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current).toEqual({
        // Data
        notifications: mockNotifications,
        stats: mockStats,

        // Computed values
        unreadCount: 3,
        totalCount: 5,
        hasUrgent: false,
        hasHigh: true,

        // Loading states
        isLoading: false,
        isError: false,
        error: null,

        // Connection states
        isConnected: true,
        isRealTimeConnected: true,
        connectionError: null,
        connectionQuality: 'good',

        // Query actions
        refetch: expect.any(Function),

        // Mutation actions
        markAsRead: expect.any(Function),
        markAllAsRead: expect.any(Function),
        deleteNotification: expect.any(Function),
        bulkDelete: expect.any(Function),
        updateNotification: expect.any(Function),

        // Mutation states
        isMarkingAsRead: false,
        isMarkingAllAsRead: false,
        isDeleting: false,
        isBulkDeleting: false,
        isUpdating: false,

        // Real-time actions
        connectRealtime: expect.any(Function),
        disconnectRealtime: expect.any(Function),
        subscribeToNotifications: expect.any(Function),
        reconnectRealtime: expect.any(Function),

        // Connection actions
        retryConnection: expect.any(Function),

        // Individual hook access
        hooks: {
          query: mockQueryResult,
          mutations: mockMutations,
          realtime: mockRealtimeResult,
          stats: mockStatsResult,
          connection: mockConnectionResult,
        },
      });
    });

    it('should call focused hooks with correct options', () => {
      const options: UseNotificationsOptions = {
        query: { 
          enabled: true,
          limit: 20,
          includeRead: false 
        },        realtime: { 
          enabled: true
        },
        stats: { 
          enabled: true 
        },
        enableRealtime: true,
        enableStats: true,
      };

      renderHook(() => useNotifications(options));

      expect(useNotificationQuery).toHaveBeenCalledWith(options.query);
      expect(useNotificationRealtime).toHaveBeenCalledWith({
        ...options.realtime,
        enabled: true,
      });
      expect(useNotificationStats).toHaveBeenCalledWith({
        ...options.stats,
        enabled: true,
      });
    });

    it('should handle default options correctly', () => {
      renderHook(() => useNotifications());

      expect(useNotificationQuery).toHaveBeenCalledWith({});
      expect(useNotificationRealtime).toHaveBeenCalledWith({ enabled: true });
      expect(useNotificationStats).toHaveBeenCalledWith({ enabled: true });
    });
  });

  describe('Composition behavior', () => {
    it('should aggregate loading states correctly', () => {
      (useNotificationQuery as any).mockReturnValue({
        ...mockQueryResult,
        isLoading: true,
      });
      (useNotificationStats as any).mockReturnValue({
        ...mockStatsResult,
        isLoading: true,
      });

      const { result } = renderHook(() => useNotifications());

      expect(result.current.isLoading).toBe(true);
    });

    it('should aggregate error states correctly', () => {
      const queryError = new Error('Query failed');
      const statsError = new Error('Stats failed');

      (useNotificationQuery as any).mockReturnValue({
        ...mockQueryResult,
        isError: true,
        error: queryError,
      });
      (useNotificationStats as any).mockReturnValue({
        ...mockStatsResult,
        isError: true,
        error: statsError,
      });

      const { result } = renderHook(() => useNotifications());

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(queryError);
    });

    it('should expose all mutation functions', () => {
      const { result } = renderHook(() => useNotifications());

      // Test that all mutation functions are exposed
      expect(typeof result.current.markAsRead).toBe('function');
      expect(typeof result.current.markAllAsRead).toBe('function');
      expect(typeof result.current.deleteNotification).toBe('function');
      expect(typeof result.current.bulkDelete).toBe('function');
      expect(typeof result.current.updateNotification).toBe('function');
    });

    it('should expose all connection management functions', () => {
      const { result } = renderHook(() => useNotifications());

      expect(typeof result.current.connectRealtime).toBe('function');
      expect(typeof result.current.disconnectRealtime).toBe('function');
      expect(typeof result.current.retryConnection).toBe('function');
      expect(typeof result.current.reconnectRealtime).toBe('function');
    });
  });

  describe('SRP Compliance', () => {
    it('should delegate query operations to useNotificationQuery', () => {
      const { result } = renderHook(() => useNotifications());

      result.current.refetch();
      expect(mockQueryResult.refetch).toHaveBeenCalled();
    });

    it('should delegate mutations to useNotificationMutations', () => {
      const { result } = renderHook(() => useNotifications());

      result.current.markAsRead('1');
      expect(mockMutations.markAsRead).toHaveBeenCalledWith('1');

      result.current.deleteNotification('1');
      expect(mockMutations.deleteNotification).toHaveBeenCalledWith('1');
    });

    it('should delegate real-time operations to useNotificationRealtime', () => {
      const { result } = renderHook(() => useNotifications());

      result.current.connectRealtime();
      expect(mockRealtimeResult.connect).toHaveBeenCalled();

      result.current.disconnectRealtime();
      expect(mockRealtimeResult.disconnect).toHaveBeenCalled();
    });

    it('should delegate stats operations to useNotificationStats', async () => {
      const { result } = renderHook(() => useNotifications());

      await result.current.refetch();
      expect(mockStatsResult.refetch).toHaveBeenCalled();
    });

    it('should delegate connection operations to useNotificationConnection', () => {
      const { result } = renderHook(() => useNotifications());

      result.current.retryConnection();
      expect(mockConnectionResult.retryConnection).toHaveBeenCalled();
    });
  });

  describe('Feature toggles', () => {
    it('should disable real-time when enableRealtime is false', () => {
      renderHook(() => useNotifications({ enableRealtime: false }));

      expect(useNotificationRealtime).toHaveBeenCalledWith({ enabled: false });
    });

    it('should disable stats when enableStats is false', () => {
      renderHook(() => useNotifications({ enableStats: false }));

      expect(useNotificationStats).toHaveBeenCalledWith({ enabled: false });
    });

    it('should disable connection monitoring when enableConnectionMonitoring is false', () => {
      renderHook(() => useNotifications({ enableConnectionMonitoring: false }));

      expect(useNotificationConnection).toHaveBeenCalledWith({ enabled: false });
    });
  });
});
