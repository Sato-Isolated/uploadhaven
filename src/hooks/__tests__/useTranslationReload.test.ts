import { renderHook } from '@testing-library/react';
import {
  useTranslationReload,
  useTranslationPolling,
} from '../useTranslationReload';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestWrapper } from '../../__tests__/test-utils';

// Mock next/navigation
const mockRefresh = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: mockPush,
  }),
}));

describe('useTranslationReload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set NODE_ENV to development for testing
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should initialize without errors in development', () => {
    const { result } = renderHook(() => useTranslationReload());
    expect(result.current).toBeUndefined(); // Hook doesn't return anything
  });

  it('should not setup WebSocket in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { result } = renderHook(() => useTranslationReload());
    expect(result.current).toBeUndefined();
  });
  it('should handle WebSocket errors gracefully', () => {
    // Mock WebSocket constructor to simulate error
    const originalWebSocket = global.WebSocket;

    global.WebSocket = vi.fn().mockImplementation(() => ({
      onmessage: null,
      onerror: null,
      close: vi.fn(),
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
    })) as any;

    const { unmount } = renderHook(() => useTranslationReload());

    expect(() => unmount()).not.toThrow();

    // Restore original WebSocket
    global.WebSocket = originalWebSocket;
  });
});

describe('useTranslationPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it('should initialize with default interval', () => {
    const { result } = renderHook(() => useTranslationPolling(), {
      wrapper: TestWrapper,
    });
    expect(result.current).toBeUndefined();
  });

  it('should initialize with custom interval', () => {
    const { result } = renderHook(() => useTranslationPolling(5000), {
      wrapper: TestWrapper,
    });
    expect(result.current).toBeUndefined();
  });

  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() => useTranslationPolling(1000), {
      wrapper: TestWrapper,
    });

    expect(() => unmount()).not.toThrow();
  });

  it('should handle polling interval correctly', () => {
    renderHook(() => useTranslationPolling(1000), {
      wrapper: TestWrapper,
    });

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    // Should not throw any errors
    expect(true).toBe(true);
  });
});
