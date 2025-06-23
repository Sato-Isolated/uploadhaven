/**
 * 👤 User Account Hook - Privacy-Aware User Management
 * 
 * React hook for managing user account operations with zero-knowledge guarantees.
 * Handles encrypted user data, privacy settings, and account lifecycle.
 * 
 * @domain user-management
 * @pattern React Hook
 * @privacy zero-knowledge - client-side encryption, privacy-first operations
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '../../domain/entities/User.entity';
import { RegisterUserUseCase, RegisterUserResponse } from '../../application/usecases/RegisterUser.usecase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { EmailHash } from '../../domain/value-objects/EmailHash.vo';
import { UserId } from '../../domain/value-objects/UserId.vo';

export interface RegisterUserData {
  email: string;
  name?: string;
  encryptionKey?: string; // Optional client-provided key
  language?: 'en' | 'fr' | 'es';
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
}

export interface UserAccountState {
  user: User | null | undefined;
  isLoading: boolean;
  error: string | null;
}

export interface UserAccountOperations {
  register: (data: RegisterUserData) => Promise<RegisterUserResponse>;
  login: (email: string, encryptionKey: string) => Promise<User>;
  updatePreferences: (preferences: Partial<any>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  decryptUserData: (encryptionKey: string) => Promise<{ email: string; name?: string }>;
}

/**
 * Hook for managing user account with privacy guarantees
 */
export function useUserAccount(
  userRepository: IUserRepository,
  currentUserId?: string
): UserAccountState & UserAccountOperations {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Query current user data (encrypted)
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      return await userRepository.findById(UserId.fromString(currentUserId));
    },
    enabled: !!currentUserId,
  });

  // Register new user mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterUserData) => {
      const registerUseCase = new RegisterUserUseCase(userRepository); return await registerUseCase.execute(data);
    }, onSuccess: (result) => {
      // Registration successful, but user still needs email verification
      // Don't cache user data until verification is complete
      setError(null);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Registration failed');
    }
  });

  // Login mutation (find user by email hash)
  const loginMutation = useMutation({
    mutationFn: async ({ email, encryptionKey }: { email: string; encryptionKey: string }) => {
      const foundUser = await userRepository.findByEmail(email);
      if (!foundUser) {
        throw new Error('User not found');
      }

      // Verify user can decrypt data with provided key
      try {
        await foundUser.encryptedEmail.decrypt(encryptionKey);
        return foundUser;
      } catch {
        throw new Error('Invalid encryption key');
      }
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['user', user.id], user);
      setError(null);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Login failed');
    }
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<any>) => {
      if (!user) throw new Error('No user logged in');

      user.updatePreferences(preferences);
      await userRepository.save(user);
      return user;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', updatedUser.id], updatedUser);
      setError(null);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to update preferences');
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user logged in');

      await userRepository.delete(UserId.fromString(user.id));
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['user'] });
      setError(null);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to delete account');
    }
  });
  // Register user
  const register = useCallback(async (data: RegisterUserData) => {
    const result = await registerMutation.mutateAsync(data);
    return result;
  }, [registerMutation]);

  // Login user
  const login = useCallback(async (email: string, encryptionKey: string) => {
    const user = await loginMutation.mutateAsync({ email, encryptionKey });
    return user;
  }, [loginMutation]);

  // Update preferences
  const updatePreferences = useCallback(async (preferences: Partial<any>) => {
    await updatePreferencesMutation.mutateAsync(preferences);
  }, [updatePreferencesMutation]);

  // Delete account
  const deleteAccount = useCallback(async () => {
    await deleteAccountMutation.mutateAsync();
  }, [deleteAccountMutation]);

  // Decrypt user data (for display purposes)
  const decryptUserData = useCallback(async (encryptionKey: string) => {
    if (!user) throw new Error('No user data available');

    try {
      const email = await user.encryptedEmail.decrypt(encryptionKey);
      const name = user.encryptedName
        ? await user.encryptedName.decrypt(encryptionKey)
        : undefined;

      return { email, name };
    } catch (error) {
      throw new Error('Failed to decrypt user data: invalid key');
    }
  }, [user]);

  return {
    // State
    user,
    isLoading: isLoading ||
      registerMutation.isPending ||
      loginMutation.isPending ||
      updatePreferencesMutation.isPending ||
      deleteAccountMutation.isPending,
    error,

    // Operations
    register,
    login,
    updatePreferences,
    deleteAccount,
    decryptUserData
  };
}

/**
 * Hook for user registration flow
 */
export function useUserRegistration(userRepository: IUserRepository) {
  return useMutation({
    mutationFn: async (data: RegisterUserData) => {
      const registerUseCase = new RegisterUserUseCase(userRepository);
      return await registerUseCase.execute(data);
    }
  });
}

/**
 * Hook for checking if email is available
 */
export function useEmailAvailability(userRepository: IUserRepository) {
  return useMutation({
    mutationFn: async (email: string) => {
      const exists = await userRepository.existsByEmail(email);
      return { email, available: !exists };
    }
  });
}

/**
 * Hook for user authentication status
 */
export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const signIn = useCallback((userId: string) => {
    setUserId(userId);
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(() => {
    setUserId(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    userId,
    signIn,
    signOut
  };
}
