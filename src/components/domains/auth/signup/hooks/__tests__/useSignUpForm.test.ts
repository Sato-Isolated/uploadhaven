import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSignUpForm } from '../useSignUpForm';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  signUp: {
    email: vi.fn(),
  },
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

import { useTranslations } from 'next-intl';
import { signUp } from '@/lib/auth/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAsyncOperation } from '@/hooks';

describe('useSignUpForm', () => {
  const mockT = vi.fn((key: string) => key);
  const mockRouter = {
    push: vi.fn(),
  };

  const mockExecute = vi.fn();
  const mockUseAsyncOperation = {
    loading: false,
    execute: mockExecute,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTranslations as any).mockReturnValue(mockT);
    (useRouter as any).mockReturnValue(mockRouter);
    (useAsyncOperation as any).mockReturnValue(mockUseAsyncOperation);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSignUpForm());

    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.confirmPassword).toBe('');
    expect(result.current.name).toBe('');
    expect(result.current.showPassword).toBe(false);
    expect(result.current.showConfirmPassword).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('should update form field states', () => {
    const { result } = renderHook(() => useSignUpForm());

    act(() => {
      result.current.setEmail('test@example.com');
      result.current.setPassword('Password123');
      result.current.setConfirmPassword('Password123');
      result.current.setName('John Doe');
    });

    expect(result.current.email).toBe('test@example.com');
    expect(result.current.password).toBe('Password123');
    expect(result.current.confirmPassword).toBe('Password123');
    expect(result.current.name).toBe('John Doe');
  });

  it('should toggle password visibility', () => {
    const { result } = renderHook(() => useSignUpForm());

    expect(result.current.showPassword).toBe(false);

    act(() => {
      result.current.togglePasswordVisibility();
    });

    expect(result.current.showPassword).toBe(true);
  });

  it('should toggle confirm password visibility', () => {
    const { result } = renderHook(() => useSignUpForm());

    expect(result.current.showConfirmPassword).toBe(false);

    act(() => {
      result.current.toggleConfirmPasswordVisibility();
    });

    expect(result.current.showConfirmPassword).toBe(true);
  });

  describe('password validation', () => {
    it('should validate password requirements correctly', () => {
      const { result } = renderHook(() => useSignUpForm());

      // Test with weak password
      act(() => {
        result.current.setPassword('weak');
      });

      expect(result.current.isPasswordValid).toBe(false);
      expect(result.current.passwordValidations).toEqual([
        { label: 'atLeast8Characters', valid: false },
        { label: 'containsUppercaseLetter', valid: false },
        { label: 'containsLowercaseLetter', valid: true },
        { label: 'containsNumber', valid: false },
      ]);

      // Test with strong password
      act(() => {
        result.current.setPassword('StrongPass123');
      });

      expect(result.current.isPasswordValid).toBe(true);
      expect(result.current.passwordValidations).toEqual([
        { label: 'atLeast8Characters', valid: true },
        { label: 'containsUppercaseLetter', valid: true },
        { label: 'containsLowercaseLetter', valid: true },
        { label: 'containsNumber', valid: true },
      ]);
    });

    it('should check if passwords match', () => {
      const { result } = renderHook(() => useSignUpForm());

      act(() => {
        result.current.setPassword('Password123');
        result.current.setConfirmPassword('Password123');
      });

      expect(result.current.doPasswordsMatch).toBe(true);

      act(() => {
        result.current.setConfirmPassword('DifferentPassword');
      });

      expect(result.current.doPasswordsMatch).toBe(false);
    });

    it('should not match when confirm password is empty', () => {
      const { result } = renderHook(() => useSignUpForm());

      act(() => {
        result.current.setPassword('Password123');
      });

      expect(result.current.doPasswordsMatch).toBe(false);
    });
  });

  describe('form submission', () => {
    it('should handle successful sign up', async () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      } as any;

      const { result } = renderHook(() => useSignUpForm());

      act(() => {
        result.current.setEmail('test@example.com');
        result.current.setPassword('StrongPass123');
        result.current.setConfirmPassword('StrongPass123');
        result.current.setName('John Doe');
      });

      await act(async () => {
        await result.current.handleSignUp(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should validate passwords match before submission', async () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      } as any;

      const { result } = renderHook(() => useSignUpForm());

      act(() => {
        result.current.setEmail('test@example.com');
        result.current.setPassword('StrongPass123');
        result.current.setConfirmPassword('DifferentPassword');
        result.current.setName('John Doe');
      });

      await act(async () => {
        await result.current.handleSignUp(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.error).toBe('passwordsDoNotMatch');
      expect(toast.error).toHaveBeenCalledWith('passwordsDoNotMatch');
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should validate password requirements before submission', async () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      } as any;

      const { result } = renderHook(() => useSignUpForm());

      act(() => {
        result.current.setEmail('test@example.com');
        result.current.setPassword('weak');
        result.current.setConfirmPassword('weak');
        result.current.setName('John Doe');
      });

      await act(async () => {
        await result.current.handleSignUp(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.error).toBe('pleaseMeetPasswordRequirements');
      expect(toast.error).toHaveBeenCalledWith(
        'pleaseMeetPasswordRequirements'
      );
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should clear error before new submission', async () => {
      const mockEvent = {
        preventDefault: vi.fn(),
      } as any;

      const { result } = renderHook(() => useSignUpForm());

      // Set an initial error
      act(() => {
        result.current.setPassword('weak');
        result.current.setConfirmPassword('different');
      });

      await act(async () => {
        await result.current.handleSignUp(mockEvent);
      });

      expect(result.current.error).toBe('passwordsDoNotMatch');

      // Clear the error by making passwords match and strong
      act(() => {
        result.current.setPassword('StrongPass123');
        result.current.setConfirmPassword('StrongPass123');
        result.current.setEmail('test@example.com');
        result.current.setName('John Doe');
      });

      await act(async () => {
        await result.current.handleSignUp(mockEvent);
      });

      // Error should be cleared at the start
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  it('should handle loading state from useAsyncOperation', () => {
    (useAsyncOperation as any).mockReturnValue({
      ...mockUseAsyncOperation,
      loading: true,
    });

    const { result } = renderHook(() => useSignUpForm());

    expect(result.current.isLoading).toBe(true);
  });

  it('should call useAsyncOperation with correct config', () => {
    renderHook(() => useSignUpForm());

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

    renderHook(() => useSignUpForm());

    act(() => {
      onSuccessCallback();
    });

    expect(toast.success).toHaveBeenCalledWith('accountCreatedSuccessfully');
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle async operation error', () => {
    const onErrorCallback = vi.fn();
    (useAsyncOperation as any).mockImplementation(({ onError }: any) => {
      onErrorCallback.mockImplementation(onError);
      return mockUseAsyncOperation;
    });

    const { result } = renderHook(() => useSignUpForm());

    act(() => {
      onErrorCallback();
    });

    expect(result.current.error).toBe('failedToCreateAccount');
    expect(toast.error).toHaveBeenCalledWith('failedToCreateAccount');
  });

  it('should provide all required interface properties', () => {
    const { result } = renderHook(() => useSignUpForm());

    // Check form state properties
    expect(typeof result.current.email).toBe('string');
    expect(typeof result.current.password).toBe('string');
    expect(typeof result.current.confirmPassword).toBe('string');
    expect(typeof result.current.name).toBe('string');
    expect(typeof result.current.showPassword).toBe('boolean');
    expect(typeof result.current.showConfirmPassword).toBe('boolean');
    expect(typeof result.current.error).toBe('string');
    expect(typeof result.current.isLoading).toBe('boolean');

    // Check validation state
    expect(Array.isArray(result.current.passwordValidations)).toBe(true);
    expect(typeof result.current.isPasswordValid).toBe('boolean');
    expect(typeof result.current.doPasswordsMatch).toBe('boolean');

    // Check action functions
    expect(typeof result.current.setEmail).toBe('function');
    expect(typeof result.current.setPassword).toBe('function');
    expect(typeof result.current.setConfirmPassword).toBe('function');
    expect(typeof result.current.setName).toBe('function');
    expect(typeof result.current.togglePasswordVisibility).toBe('function');
    expect(typeof result.current.toggleConfirmPasswordVisibility).toBe(
      'function'
    );
    expect(typeof result.current.handleSignUp).toBe('function');
  });
});
