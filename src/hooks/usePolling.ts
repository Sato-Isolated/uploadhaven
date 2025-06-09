"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PollingOptions } from "@/components/types/common";

/**
 * Custom hook for polling/auto-refreshing data at intervals.
 * Used in components like StatsPanel, FileManager that need periodic updates.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  options: PollingOptions = {}
) {
  const { interval = 30000, immediate = true, enabled = true } = options;
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const startPolling = useCallback(() => {
    if (!enabled) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      savedCallback.current();
    }, interval);
  }, [interval, enabled]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const restartPolling = useCallback(() => {
    stopPolling();
    startPolling();
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if (enabled) {
      if (immediate) {
        savedCallback.current();
      }
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, immediate, startPolling, stopPolling]);

  return {
    startPolling,
    stopPolling,
    restartPolling,
  };
}

/**
 * Hook that combines useApi with usePolling for auto-refreshing API data
 */
export function usePollingApi<T>(
  url: string,
  options: PollingOptions & { onData?: (data: T) => void } = {}
) {
  const { onData, ...pollingOptions } = options;

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        onData?.(data);
        return data;
      }
    } catch (error) {
      console.warn(`Polling error for ${url}:`, error);
    }
  }, [url, onData]);

  const { startPolling, stopPolling, restartPolling } = usePolling(
    fetchData,
    pollingOptions
  );

  return {
    startPolling,
    stopPolling,
    restartPolling,
    fetchData,
  };
}
