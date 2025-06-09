"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ApiState, ApiOptions } from "@/components/types/common";

/**
 * Custom hook for API calls with loading states, error handling, and data management.
 * Replaces repetitive fetch patterns across components like StatsPanel, SecurityPanel, etc.
 */
export function useApi<T = any>(
  url: string,
  options: ApiOptions = {}
): ApiState<T> & {
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
} {
  const { immediate = true, onSuccess, onError, method = "GET" } = options;

  // Use refs to maintain stable references to callbacks
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setState({ data, loading: false, error: null });

      if (onSuccessRef.current) {
        onSuccessRef.current(data);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setState({ data: null, loading: false, error: errorMessage });

      if (onErrorRef.current) {
        onErrorRef.current(errorMessage);
      }
    }
  }, [url, method]); // Removed onSuccess and onError from dependency array

  // Mutate data without refetching
  const mutate = useCallback((newData: T) => {
    setState((prev) => ({ ...prev, data: newData }));
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return {
    ...state,
    refetch: fetchData,
    mutate,
  };
}
