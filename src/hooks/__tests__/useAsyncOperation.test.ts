import { renderHook, act } from '@testing-library/react';
import { useAsyncOperation } from '../useAsyncOperation';
import { describe, it, expect, vi } from 'vitest';

describe('useAsyncOperation', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAsyncOperation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful async operation', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const mockAsyncFn = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      await result.current.execute(mockAsyncFn);
    });

    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle failed async operation', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const error = new Error('Test error');
    const mockAsyncFn = vi.fn().mockRejectedValue(error);

    await act(async () => {
      await result.current.execute(mockAsyncFn);
    });

    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Test error');
  });

  it('should handle non-Error rejections', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const mockAsyncFn = vi.fn().mockRejectedValue('String error');

    await act(async () => {
      await result.current.execute(mockAsyncFn);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('An unknown error occurred');
  });

  it('should set loading state during execution', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    let resolvePromise: () => void;
    const mockAsyncFn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    // Start the async operation
    act(() => {
      result.current.execute(mockAsyncFn);
    });

    // Should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // Resolve the promise
    await act(async () => {
      resolvePromise();
    });

    expect(result.current.loading).toBe(false);
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsyncOperation({ onSuccess }));
    const mockAsyncFn = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      await result.current.execute(mockAsyncFn);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('should call onError callback', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useAsyncOperation({ onError }));
    const error = new Error('Test error');
    const mockAsyncFn = vi.fn().mockRejectedValue(error);

    await act(async () => {
      await result.current.execute(mockAsyncFn);
    });

    expect(onError).toHaveBeenCalledWith('Test error');
  });

  it('should not call onSuccess when operation fails', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAsyncOperation({ onSuccess, onError })
    );
    const error = new Error('Test error');
    const mockAsyncFn = vi.fn().mockRejectedValue(error);

    await act(async () => {
      await result.current.execute(mockAsyncFn);
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Test error');
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useAsyncOperation());

    // Manually set some state to test reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should reset state after error', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const error = new Error('Test error');
    const mockAsyncFn = vi.fn().mockRejectedValue(error);

    // Execute failing operation
    await act(async () => {
      await result.current.execute(mockAsyncFn);
    });

    expect(result.current.error).toBe('Test error');

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle multiple sequential operations', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const mockAsyncFn1 = vi.fn().mockResolvedValue(undefined);
    const mockAsyncFn2 = vi.fn().mockResolvedValue(undefined);

    // First operation
    await act(async () => {
      await result.current.execute(mockAsyncFn1);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    // Second operation
    await act(async () => {
      await result.current.execute(mockAsyncFn2);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockAsyncFn1).toHaveBeenCalledTimes(1);
    expect(mockAsyncFn2).toHaveBeenCalledTimes(1);
  });

  it('should clear previous error when starting new operation', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const errorFn = vi.fn().mockRejectedValue(new Error('First error'));
    const successFn = vi.fn().mockResolvedValue(undefined);

    // First operation fails
    await act(async () => {
      await result.current.execute(errorFn);
    });

    expect(result.current.error).toBe('First error');

    // Second operation succeeds and should clear error
    await act(async () => {
      await result.current.execute(successFn);
    });

    expect(result.current.error).toBeNull();
  });
});
