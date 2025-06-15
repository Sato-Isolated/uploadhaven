import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClientUserStats } from '../useClientUserStats';

// Mock dependencies
vi.mock('@/hooks/useUserStats', () => ({
  useUserStats: vi.fn(),
}));

import { useUserStats } from '@/hooks/useUserStats';

describe('useClientUserStats', () => {
  const mockStatsData = {
    totalFiles: 10,
    totalSize: 1024000,
    filesByType: { image: 5, document: 3, other: 2 },
    recentFiles: [],
  };

  const mockUseUserStats = {
    data: mockStatsData,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUserStats as any).mockReturnValue(mockUseUserStats);
  });

  it('should initialize with correct authentication state when session exists', () => {
    const session = { user: { id: '123', email: 'test@example.com' } };
    const { result } = renderHook(() =>
      useClientUserStats('user123', session)
    );

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.stats).toEqual(mockStatsData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.fetchStats).toBe('function');
  });

  it('should handle unauthenticated state when no session', () => {
    const { result } = renderHook(() => useClientUserStats('user123'));

    expect(result.current.isAuthenticated).toBe(false);
    expect(useUserStats).toHaveBeenCalledWith(undefined);
  });

  it('should handle unauthenticated state when session has no user', () => {
    const session = {};
    const { result } = renderHook(() =>
      useClientUserStats('user123', session)
    );

    expect(result.current.isAuthenticated).toBe(false);
    expect(useUserStats).toHaveBeenCalledWith(undefined);
  });

  it('should call useUserStats with userId when authenticated', () => {
    const session = { user: { id: '123' } };
    renderHook(() => useClientUserStats('user123', session));

    expect(useUserStats).toHaveBeenCalledWith('user123');
  });

  it('should not call useUserStats with userId when not authenticated', () => {
    renderHook(() => useClientUserStats('user123'));

    expect(useUserStats).toHaveBeenCalledWith(undefined);
  });

  it('should handle loading state', () => {
    (useUserStats as any).mockReturnValue({
      ...mockUseUserStats,
      isLoading: true,
    });

    const session = { user: { id: '123' } };
    const { result } = renderHook(() =>
      useClientUserStats('user123', session)
    );

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state', () => {
    const error = new Error('Failed to fetch stats');
    (useUserStats as any).mockReturnValue({
      ...mockUseUserStats,
      error,
    });

    const session = { user: { id: '123' } };
    const { result } = renderHook(() =>
      useClientUserStats('user123', session)
    );

    expect(result.current.error).toBe(error);
  });

  it('should handle undefined stats', () => {
    (useUserStats as any).mockReturnValue({
      ...mockUseUserStats,
      data: undefined,
    });

    const session = { user: { id: '123' } };
    const { result } = renderHook(() =>
      useClientUserStats('user123', session)
    );

    expect(result.current.stats).toBeUndefined();
  });

  it('should provide fetchStats function from useUserStats refetch', () => {
    const session = { user: { id: '123' } };
    const { result } = renderHook(() =>
      useClientUserStats('user123', session)
    );

    expect(result.current.fetchStats).toBe(mockUseUserStats.refetch);
  });  it('should handle authentication state changes', () => {
    // Test unauthenticated state
    const { result: result1 } = renderHook(() =>
      useClientUserStats('user123', undefined)
    );
    expect(result1.current.isAuthenticated).toBe(false);

    // Test authenticated state
    const session = { user: { id: '123' } };
    const { result: result2 } = renderHook(() =>
      useClientUserStats('user123', session)
    );
    expect(result2.current.isAuthenticated).toBe(true);

    // Test session with no user
    const emptySession = {};
    const { result: result3 } = renderHook(() =>
      useClientUserStats('user123', emptySession)
    );
    expect(result3.current.isAuthenticated).toBe(false);
  });

  it('should provide consistent interface', () => {
    const session = { user: { id: '123' } };
    const { result } = renderHook(() =>
      useClientUserStats('user123', session)
    );

    // Check return type interface
    expect(typeof result.current.isAuthenticated).toBe('boolean');
    expect(typeof result.current.loading).toBe('boolean');
    expect(typeof result.current.fetchStats).toBe('function');
    
    // stats can be UserStats or undefined
    expect(result.current.stats === undefined || typeof result.current.stats === 'object').toBe(true);
    
    // error can be Error or null
    expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
  });
});
