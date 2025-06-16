import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSignInForm } from '../useSignInForm';

// Mock dependencies
vi.mock('@/lib/auth-client', () => ({
  signIn: {
    email: vi.fn(),
  },
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/hooks', () => ({
  useAsyncOperation: vi.fn(),
}));

import { signIn, useSession } from '@/lib/auth/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAsyncOperation } from '@/hooks';

describe('useSignInForm', () => {
  const mockRouter = {
    replace: vi.fn(),
  };

  const mockExecute = vi.fn();
  const mockUseAsyncOperation = {
    loading: false,
    execute: mockExecute,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSession as any).mockReturnValue({ data: null });
    (useAsyncOperation as any).mockReturnValue(mockUseAsyncOperation);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSignInForm());

    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.showPassword).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('should update email state', () => {
    const { result } = renderHook(() => useSignInForm());

    act(() => {
      result.current.setEmail('test@example.com');
    });

    expect(result.current.email).toBe('test@example.com');
  });

  it('should update password state', () => {
    const { result } = renderHook(() => useSignInForm());

    act(() => {
      result.current.setPassword('password123');
    });

    expect(result.current.password).toBe('password123');
  });

  it('should toggle password visibility', () => {
    const { result } = renderHook(() => useSignInForm());

    expect(result.current.showPassword).toBe(false);

    act(() => {
      result.current.togglePasswordVisibility();
    });

    expect(result.current.showPassword).toBe(true);

    act(() => {
      result.current.togglePasswordVisibility();
    });

    expect(result.current.showPassword).toBe(false);
  });

  it('should handle loading state from useAsyncOperation', () => {
    (useAsyncOperation as any).mockReturnValue({
      ...mockUseAsyncOperation,
      loading: true,
    });

    const { result } = renderHook(() => useSignInForm());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle sign in form submission', async () => {
    const mockEvent = {
      preventDefault: vi.fn(),
    } as any;

    const { result } = renderHook(() => useSignInForm());

    act(() => {
      result.current.setEmail('test@example.com');
      result.current.setPassword('password123');
    });

    await act(async () => {
      await result.current.handleSignIn(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should redirect to dashboard when user is authenticated', () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: '1', email: 'test@example.com' } },
    });

    renderHook(() => useSignInForm());

    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
  });

  it('should clear error when setting error state', () => {
    const { result } = renderHook(() => useSignInForm());

    act(() => {
      result.current.setShowPassword(true);
    });

    expect(result.current.showPassword).toBe(true);
  });

  it('should call useAsyncOperation with correct config', () => {
    renderHook(() => useSignInForm());

    expect(useAsyncOperation).toHaveBeenCalledWith({
      onSuccess: expect.any(Function),
      onError: expect.any(Function),
    });
  });
  it('should handle async operation success', () => {
    const onSuccessCallback = vi.fn();
    (useAsyncOperation as any).mockImplementation(({ onSuccess }: any) => {
      onSuccessCallback.mockImplementation(onSuccess);
      return mockUseAsyncOperation;
    });

    renderHook(() => useSignInForm());

    act(() => {
      onSuccessCallback();
    });

    expect(toast.success).toHaveBeenCalledWith('Signed in successfully!');
  });

  it('should handle async operation error', () => {
    const onErrorCallback = vi.fn();
    (useAsyncOperation as any).mockImplementation(({ onError }: any) => {
      onErrorCallback.mockImplementation(onError);
      return mockUseAsyncOperation;
    });

    const { result } = renderHook(() => useSignInForm());

    act(() => {
      onErrorCallback('Invalid credentials');
    });

    expect(result.current.error).toBe('Invalid credentials');
    expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
  });

  it('should provide all required interface properties', () => {
    const { result } = renderHook(() => useSignInForm());

    // Check all required properties exist
    expect(typeof result.current.email).toBe('string');
    expect(typeof result.current.password).toBe('string');
    expect(typeof result.current.showPassword).toBe('boolean');
    expect(typeof result.current.error).toBe('string');
    expect(typeof result.current.isLoading).toBe('boolean');

    expect(typeof result.current.setEmail).toBe('function');
    expect(typeof result.current.setPassword).toBe('function');
    expect(typeof result.current.setShowPassword).toBe('function');
    expect(typeof result.current.handleSignIn).toBe('function');
    expect(typeof result.current.togglePasswordVisibility).toBe('function');
  });
});
