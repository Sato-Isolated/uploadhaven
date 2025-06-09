"use client";

import { useState, useCallback } from "react";
import type {
  AsyncOperationState,
  AsyncOperationOptions,
} from "@/components/types/common";

/**
 * Custom hook for managing async operations with loading states and error handling.
 * Useful for authentication, form submissions, and other async actions.
 * Replaces repetitive loading state patterns across components.
 */
export function useAsyncOperation(options: AsyncOperationOptions = {}) {
  const { onSuccess, onError } = options;

  const [state, setState] = useState<AsyncOperationState>({
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (asyncFn: () => Promise<void>) => {
      setState({ loading: true, error: null });

      try {
        await asyncFn();
        setState({ loading: false, error: null });

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setState({ loading: false, error: errorMessage });

        if (onError) {
          onError(errorMessage);
        }
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
