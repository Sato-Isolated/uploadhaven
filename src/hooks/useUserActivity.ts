import { useMutation } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';

/**
 * Hook for logging user activity when navigating to different pages
 * This is used to track when users are active on the platform
 */
export function useLogUserActivity() {
  return useMutation({
    mutationFn: async (): Promise<{ success: boolean }> => {
      const response = await ApiClient.post<{ success: boolean }>(
        '/api/user/activity'
      );
      return response;
    },

    onError: (error) => {
      // Don't show user-facing errors for activity logging
      // This is a background operation and shouldn't disrupt UX
      console.warn('Failed to log user activity:', error);
    },

    // No success handling needed - this is a background operation
    retry: 1, // Only retry once to avoid excessive requests
    retryDelay: 2000, // Wait 2 seconds before retry
  });
}
